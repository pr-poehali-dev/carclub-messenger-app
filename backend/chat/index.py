"""
API чата автоклуба: получение чатов, сообщений, отправка сообщений.
Параметры action: chats | messages
Типы сообщений: text | image | voice | emoji
"""
import json
import os
import base64
import uuid
import psycopg2
import boto3

SCHEMA = "t_p76085414_carclub_messenger_ap"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def fmt_time(dt):
    if dt is None:
        return ""
    return dt.strftime("%H:%M")


def get_user_id_from_session(session_id: str, conn):
    cur = conn.cursor()
    cur.execute(f"SELECT user_id FROM {SCHEMA}.sessions WHERE session_id = %s", (session_id,))
    row = cur.fetchone()
    cur.close()
    return row[0] if row else None


def upload_to_s3(data: bytes, content_type: str, ext: str) -> str:
    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    key = f"chat-media/{uuid.uuid4().hex}.{ext}"
    s3.put_object(Bucket="files", Key=key, Body=data, ContentType=content_type)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "chats")
    headers = event.get("headers") or {}
    session_id = headers.get("X-Session-Id") or headers.get("x-session-id") or ""

    # GET ?action=chats — список чатов (закрытые только для участников)
    if method == "GET" and action == "chats":
        conn = get_conn()
        user_id = get_user_id_from_session(session_id, conn) if session_id else None
        cur = conn.cursor()
        cur.execute(f"""
            SELECT c.id, c.name, c.avatar, c.is_group, c.is_private,
                   m.text AS last_msg, m.type AS last_type, m.created_at AS last_time,
                   COUNT(m2.id) FILTER (WHERE m2.is_out = false) AS unread
            FROM {SCHEMA}.chats c
            LEFT JOIN LATERAL (
                SELECT text, type, created_at FROM {SCHEMA}.messages
                WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1
            ) m ON true
            LEFT JOIN {SCHEMA}.messages m2 ON m2.chat_id = c.id
            WHERE c.is_private = false
               OR EXISTS (
                   SELECT 1 FROM {SCHEMA}.chat_members cm
                   WHERE cm.chat_id = c.id AND cm.user_id = %s
               )
            GROUP BY c.id, c.name, c.avatar, c.is_group, c.is_private, m.text, m.type, m.created_at
            ORDER BY m.created_at DESC NULLS LAST
        """, (user_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()

        def last_msg_preview(text, msg_type):
            if msg_type == "image": return "📷 Фото"
            if msg_type == "voice": return "🎤 Голосовое"
            if msg_type == "emoji": return text
            return text or ""

        chats = [
            {"id": r[0], "name": r[1], "avatar": r[2], "isGroup": r[3], "isPrivate": r[4],
             "lastMsg": last_msg_preview(r[5], r[6]), "time": fmt_time(r[7]), "unread": int(r[8] or 0)}
            for r in rows
        ]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(chats, ensure_ascii=False)}

    # GET ?action=messages&chat_id=1[&after=42] — сообщения чата
    if method == "GET" and action == "messages":
        chat_id = params.get("chat_id")
        after = params.get("after", "0")
        if not chat_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "chat_id required"})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT id, text, sender, is_out, created_at, type, media_url
            FROM {SCHEMA}.messages
            WHERE chat_id = %s AND id > %s
            ORDER BY created_at ASC
        """, (int(chat_id), int(after)))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        msgs = [{"id": r[0], "text": r[1], "sender": r[2], "out": r[3], "time": fmt_time(r[4]),
                 "type": r[5] or "text", "mediaUrl": r[6]} for r in rows]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(msgs, ensure_ascii=False)}

    # POST ?action=messages — отправить сообщение (text/image/voice/emoji)
    if method == "POST" and action == "messages":
        body = json.loads(event.get("body") or "{}")
        chat_id = body.get("chat_id")
        msg_type = body.get("type", "text")
        text = (body.get("text") or "").strip()
        media_data = body.get("media")      # base64
        media_content_type = body.get("media_content_type", "image/jpeg")

        if not chat_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "chat_id required"})}

        media_url = None

        if msg_type in ("image", "voice") and media_data:
            raw = base64.b64decode(media_data)
            ext = "jpg" if msg_type == "image" else "webm"
            if "ogg" in media_content_type: ext = "ogg"
            elif "mp4" in media_content_type: ext = "mp4"
            media_url = upload_to_s3(raw, media_content_type, ext)
            if not text:
                text = "📷 Фото" if msg_type == "image" else "🎤 Голосовое"
        elif msg_type == "emoji":
            if not text:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "emoji required"})}
        else:
            if not text:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "text required"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            INSERT INTO {SCHEMA}.messages (chat_id, text, sender, is_out, type, media_url)
            VALUES (%s, %s, 'me', true, %s, %s)
            RETURNING id, text, sender, is_out, created_at, type, media_url
        """, (int(chat_id), text, msg_type, media_url))
        r = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        msg = {"id": r[0], "text": r[1], "sender": r[2], "out": r[3], "time": fmt_time(r[4]),
               "type": r[5], "mediaUrl": r[6]}
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(msg, ensure_ascii=False)}

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}
