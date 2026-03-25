"""
Авторизация членов автоклуба по никнейму и PIN-коду.
action=login — вход, action=register — регистрация, action=me — профиль по session_id
"""
import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = "t_p76085414_carclub_messenger_ap"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}

# Сессии в памяти инстанса
_sessions: dict = {}
_pins_initialized = False


def ensure_pins_hashed():
    demo = [("Александр", "1234"), ("Максим", "1111"), ("Анна", "2222"),
            ("Дмитрий", "3333"), ("Кирилл", "4444")]
    conn = get_conn()
    cur = conn.cursor()
    for nickname, pin in demo:
        h = hash_pin(pin)
        cur.execute(f"""
            UPDATE {SCHEMA}.users SET pin = %s
            WHERE LOWER(nickname) = LOWER(%s) AND pin != %s
        """, (h, nickname, h))
    conn.commit()
    cur.close()
    conn.close()


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_pin(pin: str) -> str:
    return hashlib.sha256(pin.encode()).hexdigest()


def user_to_dict(row) -> dict:
    return {
        "id": row[0],
        "nickname": row[1],
        "car": row[2],
        "role": row[3],
        "level": row[4],
        "levelColor": row[5],
        "points": row[6],
        "avatarUrl": row[7] if len(row) > 7 else None,
        "isAdmin": bool(row[8]) if len(row) > 8 else False,
        "isFounder": bool(row[9]) if len(row) > 9 else False,
    }


def handler(event: dict, context) -> dict:
    global _pins_initialized
    if not _pins_initialized:
        ensure_pins_hashed()
        _pins_initialized = True

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    headers = event.get("headers") or {}
    session_id = headers.get("X-Session-Id") or headers.get("x-session-id") or ""

    # GET ?action=me — получить текущего пользователя по session_id
    if method == "GET" and action == "me":
        if not session_id:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "no session"})}
        user = _sessions.get(session_id)
        if not user:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "session expired"})}
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(user, ensure_ascii=False)}

    # POST ?action=login — вход по никнейму + PIN
    if method == "POST" and action == "login":
        body = json.loads(event.get("body") or "{}")
        nickname = (body.get("nickname") or "").strip()
        pin = (body.get("pin") or "").strip()
        if not nickname or not pin:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "nickname and pin required"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT id, nickname, car, role, level, level_color, points, avatar_url, is_admin, is_founder
            FROM {SCHEMA}.users
            WHERE LOWER(nickname) = LOWER(%s) AND pin = %s
        """, (nickname, hash_pin(pin)))
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Неверный никнейм или PIN-код"})}

        user = user_to_dict(row)
        sid = secrets.token_hex(24)
        _sessions[sid] = user
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (session_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (sid, user["id"]))
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"session_id": sid, "user": user}, ensure_ascii=False)}

    # POST ?action=register — регистрация нового участника
    if method == "POST" and action == "register":
        body = json.loads(event.get("body") or "{}")
        nickname = (body.get("nickname") or "").strip()
        pin = (body.get("pin") or "").strip()
        car = (body.get("car") or "").strip()
        if not nickname or not pin:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "nickname and pin required"})}
        if len(pin) < 4:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "PIN должен быть минимум 4 цифры"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE LOWER(nickname) = LOWER(%s)", (nickname,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "Никнейм уже занят"})}

        cur.execute(f"""
            INSERT INTO {SCHEMA}.users (nickname, pin, car, role, level, level_color, points)
            VALUES (%s, %s, %s, 'Участник', 'Новичок', '#00ffb3', 0)
            RETURNING id, nickname, car, role, level, level_color, points, avatar_url, is_admin, is_founder
        """, (nickname, hash_pin(pin), car))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        user = user_to_dict(row)
        sid = secrets.token_hex(24)
        _sessions[sid] = user
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"session_id": sid, "user": user}, ensure_ascii=False)}

    # POST ?action=update — обновить никнейм и/или автомобиль
    if method == "POST" and action == "update":
        if not session_id:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Требуется авторизация"})}
        user = _sessions.get(session_id)
        if not user:
            # попробуем найти в БД
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(f"SELECT user_id FROM {SCHEMA}.sessions WHERE session_id = %s", (session_id,))
            row = cur.fetchone()
            if not row:
                cur.close()
                conn.close()
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Сессия не найдена"})}
            user_id = row[0]
        else:
            user_id = user["id"]
            conn = get_conn()
            cur = conn.cursor()

        body = json.loads(event.get("body") or "{}")
        new_nickname = (body.get("nickname") or "").strip()
        new_car = (body.get("car") or "").strip()

        if not new_nickname:
            cur.close()
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Никнейм не может быть пустым"})}

        # проверяем уникальность никнейма (если изменился)
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE LOWER(nickname) = LOWER(%s) AND id != %s", (new_nickname, user_id))
        if cur.fetchone():
            cur.close()
            conn.close()
            return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "Никнейм уже занят"})}

        cur.execute(f"""
            UPDATE {SCHEMA}.users SET nickname = %s, car = %s WHERE id = %s
            RETURNING id, nickname, car, role, level, level_color, points, avatar_url, is_admin, is_founder
        """, (new_nickname, new_car, user_id))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        updated_user = user_to_dict(row)
        if session_id in _sessions:
            _sessions[session_id] = updated_user
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": updated_user}, ensure_ascii=False)}

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}