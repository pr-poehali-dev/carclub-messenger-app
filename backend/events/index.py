"""
События клуба: получение, создание, редактирование, удаление.
Создание/редактирование/удаление доступно только администраторам и основателям.
"""
import json
import os
import psycopg2

SCHEMA = "t_p76085414_carclub_messenger_ap"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user_id(session_id: str, conn):
    cur = conn.cursor()
    cur.execute(f"SELECT user_id FROM {SCHEMA}.sessions WHERE session_id = %s", (session_id,))
    row = cur.fetchone()
    cur.close()
    return row[0] if row else None


def is_admin(user_id: int, conn):
    cur = conn.cursor()
    cur.execute(f"SELECT is_admin, is_founder FROM {SCHEMA}.users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    cur.close()
    return row and (row[0] or row[1])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    session_id = (event.get("headers") or {}).get("X-Session-Id", "")

    conn = get_conn()

    try:
        if method == "GET":
            cur = conn.cursor()
            cur.execute(f"""
                SELECT id, title, date_text, location, members, tag, tag_color, emoji, description, created_by, created_at
                FROM {SCHEMA}.events
                ORDER BY id ASC
            """)
            rows = cur.fetchall()
            cur.close()
            result = []
            for r in rows:
                result.append({
                    "id": r[0],
                    "title": r[1],
                    "date": r[2],
                    "location": r[3],
                    "members": r[4],
                    "tag": r[5],
                    "tagColor": r[6],
                    "emoji": r[7],
                    "description": r[8] or "",
                    "createdBy": r[9],
                })
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"events": result})}

        if method == "POST":
            user_id = get_user_id(session_id, conn)
            if not user_id or not is_admin(user_id, conn):
                conn.close()
                return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Forbidden"})}
            body = json.loads(event.get("body") or "{}")
            title = body.get("title", "").strip()
            date_text = body.get("date", "").strip()
            location = body.get("location", "").strip()
            tag = body.get("tag", "Событие").strip()
            tag_color = body.get("tagColor", "#00ffb3").strip()
            emoji = body.get("emoji", "📅").strip()
            description = body.get("description", "").strip()
            if not title or not date_text or not location:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "title, date, location required"})}
            cur = conn.cursor()
            cur.execute(f"""
                INSERT INTO {SCHEMA}.events (title, date_text, location, tag, tag_color, emoji, description, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (title, date_text, location, tag, tag_color, emoji, description, user_id))
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": new_id, "ok": True})}

        if method == "PUT":
            user_id = get_user_id(session_id, conn)
            if not user_id or not is_admin(user_id, conn):
                conn.close()
                return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Forbidden"})}
            event_id = params.get("id")
            if not event_id:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id required"})}
            body = json.loads(event.get("body") or "{}")
            title = body.get("title", "").strip()
            date_text = body.get("date", "").strip()
            location = body.get("location", "").strip()
            tag = body.get("tag", "Событие").strip()
            tag_color = body.get("tagColor", "#00ffb3").strip()
            emoji = body.get("emoji", "📅").strip()
            description = body.get("description", "").strip()
            cur = conn.cursor()
            cur.execute(f"""
                UPDATE {SCHEMA}.events
                SET title=%s, date_text=%s, location=%s, tag=%s, tag_color=%s, emoji=%s, description=%s
                WHERE id=%s
            """, (title, date_text, location, tag, tag_color, emoji, description, int(event_id)))
            conn.commit()
            cur.close()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        if method == "DELETE":
            user_id = get_user_id(session_id, conn)
            if not user_id or not is_admin(user_id, conn):
                conn.close()
                return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Forbidden"})}
            event_id = params.get("id")
            if not event_id:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id required"})}
            cur = conn.cursor()
            cur.execute(f"DELETE FROM {SCHEMA}.events WHERE id=%s", (int(event_id),))
            conn.commit()
            cur.close()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        conn.close()
        return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}

    except Exception as e:
        conn.close()
        return {"statusCode": 500, "headers": CORS, "body": json.dumps({"error": str(e)})}
