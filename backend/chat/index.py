"""
API чата автоклуба: получение чатов, сообщений, отправка сообщений.
Параметр action: chats | messages
"""
import json
import os
import psycopg2

SCHEMA = "t_p76085414_carclub_messenger_ap"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def fmt_time(dt):
    if dt is None:
        return ""
    return dt.strftime("%H:%M")


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "chats")

    # GET ?action=chats — список всех чатов с последним сообщением
    if method == "GET" and action == "chats":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT c.id, c.name, c.avatar, c.is_group,
                   m.text AS last_msg, m.created_at AS last_time,
                   COUNT(m2.id) FILTER (WHERE m2.is_out = false) AS unread
            FROM {SCHEMA}.chats c
            LEFT JOIN LATERAL (
                SELECT text, created_at FROM {SCHEMA}.messages
                WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1
            ) m ON true
            LEFT JOIN {SCHEMA}.messages m2 ON m2.chat_id = c.id
            GROUP BY c.id, c.name, c.avatar, c.is_group, m.text, m.created_at
            ORDER BY m.created_at DESC NULLS LAST
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        chats = [
            {"id": r[0], "name": r[1], "avatar": r[2], "isGroup": r[3],
             "lastMsg": r[4] or "", "time": fmt_time(r[5]), "unread": int(r[6] or 0)}
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
            SELECT id, text, sender, is_out, created_at
            FROM {SCHEMA}.messages
            WHERE chat_id = %s AND id > %s
            ORDER BY created_at ASC
        """, (int(chat_id), int(after)))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        msgs = [{"id": r[0], "text": r[1], "sender": r[2], "out": r[3], "time": fmt_time(r[4])} for r in rows]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(msgs, ensure_ascii=False)}

    # POST ?action=messages — отправить сообщение
    if method == "POST" and action == "messages":
        body = json.loads(event.get("body") or "{}")
        chat_id = body.get("chat_id")
        text = (body.get("text") or "").strip()
        if not chat_id or not text:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "chat_id and text required"})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            INSERT INTO {SCHEMA}.messages (chat_id, text, sender, is_out)
            VALUES (%s, %s, 'me', true)
            RETURNING id, text, sender, is_out, created_at
        """, (int(chat_id), text))
        r = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        msg = {"id": r[0], "text": r[1], "sender": r[2], "out": r[3], "time": fmt_time(r[4])}
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(msg, ensure_ascii=False)}

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}