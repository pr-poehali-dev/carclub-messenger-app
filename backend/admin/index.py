"""
Административные действия: управление клубом, правила, рейтинг, создание чатов.
Все действия доступны только администраторам (is_admin=true).
"""
import json
import os
import psycopg2

SCHEMA = "t_p76085414_carclub_messenger_ap"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
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


def get_user_rights(user_id: int, conn):
    cur = conn.cursor()
    cur.execute(f"SELECT is_admin, is_founder FROM {SCHEMA}.users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    cur.close()
    if not row:
        return False, False
    return bool(row[0]), bool(row[1])


def is_admin(user_id: int, conn) -> bool:
    admin, _ = get_user_rights(user_id, conn)
    return admin


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    session_id = (event.get("headers") or {}).get("X-Session-Id", "")

    conn = get_conn()

    # ── GET ?action=invite_code — получить текущий код (только основатель)
    if method == "GET" and action == "invite_code":
        user_id = get_user_id(session_id, conn)
        _, is_founder = get_user_rights(user_id, conn) if user_id else (False, False)
        if not is_founder:
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Только для основателя"})}
        cur = conn.cursor()
        cur.execute(f"SELECT code FROM {SCHEMA}.invite_code ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"code": row[0] if row else ""}, ensure_ascii=False)}

    # ── POST ?action=set_invite_code — изменить код (только основатель)
    if method == "POST" and action == "set_invite_code":
        user_id = get_user_id(session_id, conn)
        _, is_founder = get_user_rights(user_id, conn) if user_id else (False, False)
        if not is_founder:
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Только для основателя"})}
        body = json.loads(event.get("body") or "{}")
        new_code = (body.get("code") or "").strip().upper()
        if len(new_code) < 4:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Код должен быть минимум 4 символа"})}
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.invite_code SET code = %s, updated_at = now(), updated_by = %s", (new_code, user_id))
        if cur.rowcount == 0:
            cur.execute(f"INSERT INTO {SCHEMA}.invite_code (code, updated_by) VALUES (%s, %s)", (new_code, user_id))
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"code": new_code})}

    # ── GET ?action=user_details&user_id=X — личные данные участника (только основатель)
    if method == "GET" and action == "user_details":
        user_id_param = params.get("user_id")
        req_user_id = get_user_id(session_id, conn)
        _, is_founder = get_user_rights(req_user_id, conn) if req_user_id else (False, False)
        if not is_founder:
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Только для основателя"})}
        if not user_id_param:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "user_id required"})}
        cur = conn.cursor()
        cur.execute(f"""
            SELECT phone, birth_date FROM {SCHEMA}.users WHERE id = %s
        """, (int(user_id_param),))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Пользователь не найден"})}
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "phone": row[0],
            "birthDate": row[1].isoformat() if row[1] else None,
        }, ensure_ascii=False)}

    # ── GET ?action=rules — получить правила клуба (доступно всем)
    if method == "GET" and action == "rules":
        cur = conn.cursor()
        cur.execute(f"SELECT content, updated_at FROM {SCHEMA}.club_rules ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "content": row[0] if row else "",
            "updated_at": row[1].isoformat() if row and row[1] else None,
        }, ensure_ascii=False)}

    # ── GET ?action=members — список участников (доступно всем)
    if method == "GET" and action == "members":
        cur = conn.cursor()
        cur.execute(f"""
            SELECT id, nickname, car, role, level, level_color, points, avatar_url, is_admin, is_founder
            FROM {SCHEMA}.users ORDER BY points DESC
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        members = [{"id": r[0], "nickname": r[1], "car": r[2], "role": r[3],
                    "level": r[4], "levelColor": r[5], "points": r[6],
                    "avatarUrl": r[7], "isAdmin": bool(r[8]), "isFounder": bool(r[9])} for r in rows]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(members, ensure_ascii=False)}

    # Все действия ниже — только для администраторов
    if not session_id:
        conn.close()
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Требуется авторизация"})}

    user_id = get_user_id(session_id, conn)
    if not user_id:
        conn.close()
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Сессия не найдена"})}
    caller_is_admin, caller_is_founder = get_user_rights(user_id, conn)
    if not caller_is_admin:
        conn.close()
        return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Доступ запрещён — только для администраторов"})}

    # ── POST ?action=rules — обновить правила клуба
    if method == "POST" and action == "rules":
        body = json.loads(event.get("body") or "{}")
        content = (body.get("content") or "").strip()
        cur = conn.cursor()
        cur.execute(f"""
            UPDATE {SCHEMA}.club_rules SET content = %s, updated_at = now(), updated_by = %s
        """, (content, user_id))
        if cur.rowcount == 0:
            cur.execute(f"INSERT INTO {SCHEMA}.club_rules (content, updated_by) VALUES (%s, %s)", (content, user_id))
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True}, ensure_ascii=False)}

    # ── POST ?action=rating — изменить очки участника
    if method == "POST" and action == "rating":
        body = json.loads(event.get("body") or "{}")
        target_id = body.get("user_id")
        delta = body.get("delta", 0)
        if not target_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "user_id required"})}
        cur = conn.cursor()
        cur.execute(f"""
            UPDATE {SCHEMA}.users SET points = GREATEST(0, points + %s) WHERE id = %s
            RETURNING id, points
        """, (int(delta), int(target_id)))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if not row:
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Пользователь не найден"})}
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": row[0], "points": row[1]})}

    # ── POST ?action=create_chat — создать групповой или закрытый чат
    if method == "POST" and action == "create_chat":
        body = json.loads(event.get("body") or "{}")
        name = (body.get("name") or "").strip()
        avatar = (body.get("avatar") or "💬").strip()
        is_private = bool(body.get("is_private", False))
        member_ids = body.get("member_ids", [])  # список user_id для закрытого чата
        if not name:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Название чата обязательно"})}
        if is_private and not member_ids:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Выберите участников закрытого чата"})}
        cur = conn.cursor()
        cur.execute(f"""
            INSERT INTO {SCHEMA}.chats (name, avatar, is_group, is_private)
            VALUES (%s, %s, true, %s)
            RETURNING id, name, avatar, is_group, is_private
        """, (name, avatar, is_private))
        row = cur.fetchone()
        chat_id = row[0]
        if is_private:
            # добавляем всех выбранных участников + самого создателя
            all_ids = list(set([user_id] + [int(i) for i in member_ids]))
            for uid in all_ids:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.chat_members (chat_id, user_id)
                    VALUES (%s, %s) ON CONFLICT DO NOTHING
                """, (chat_id, uid))
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "id": row[0], "name": row[1], "avatar": row[2], "isGroup": row[3],
            "isPrivate": row[4], "lastMsg": "", "time": "", "unread": 0,
        }, ensure_ascii=False)}

    # ── POST ?action=set_admin — назначить/снять администратора
    if method == "POST" and action == "set_admin":
        body = json.loads(event.get("body") or "{}")
        target_id = body.get("user_id")
        value = bool(body.get("is_admin", True))
        if not target_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "user_id required"})}
        if not caller_is_founder:
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Только основатель может назначать администраторов"})}
        if int(target_id) == user_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нельзя изменить свои права"})}
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.users SET is_admin = %s WHERE id = %s AND is_founder = false RETURNING id, nickname, is_admin",
                    (value, int(target_id)))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if not row:
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Пользователь не найден или является основателем"})}
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": row[0], "nickname": row[1], "isAdmin": row[2]})}

    # ── POST ?action=set_role — установить подпись/должность участнику (только основатель)
    if method == "POST" and action == "set_role":
        if not caller_is_founder:
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Только основатель может назначать должности"})}
        body = json.loads(event.get("body") or "{}")
        target_id = body.get("user_id")
        new_role = (body.get("role") or "").strip()
        if not target_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "user_id required"})}
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.users SET role = %s WHERE id = %s RETURNING id, nickname, role",
                    (new_role or "Участник", int(target_id)))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if not row:
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Пользователь не найден"})}
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": row[0], "nickname": row[1], "role": row[2]}, ensure_ascii=False)}

    # ── GET ?action=chat_members&chat_id=X — участники закрытого чата (публично)
    if method == "GET" and action == "chat_members":
        chat_id = params.get("chat_id")
        if not chat_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "chat_id required"})}
        cur = conn.cursor()
        cur.execute(f"""
            SELECT u.id, u.nickname, u.car, u.role, u.level, u.level_color, u.avatar_url, u.is_admin
            FROM {SCHEMA}.chat_members cm
            JOIN {SCHEMA}.users u ON u.id = cm.user_id
            WHERE cm.chat_id = %s
            ORDER BY u.nickname
        """, (int(chat_id),))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps([
            {"id": r[0], "nickname": r[1], "car": r[2], "role": r[3],
             "level": r[4], "levelColor": r[5], "avatarUrl": r[6], "isAdmin": bool(r[7])}
            for r in rows
        ], ensure_ascii=False)}

    # ── POST ?action=add_member — добавить участника в закрытый чат
    if method == "POST" and action == "add_member":
        body = json.loads(event.get("body") or "{}")
        chat_id = body.get("chat_id")
        target_id = body.get("user_id")
        if not chat_id or not target_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "chat_id и user_id обязательны"})}
        cur = conn.cursor()
        cur.execute(f"SELECT is_private FROM {SCHEMA}.chats WHERE id = %s", (int(chat_id),))
        row = cur.fetchone()
        if not row or not row[0]:
            cur.close()
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Чат не является закрытым"})}
        cur.execute(f"""
            INSERT INTO {SCHEMA}.chat_members (chat_id, user_id)
            VALUES (%s, %s) ON CONFLICT DO NOTHING
        """, (int(chat_id), int(target_id)))
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # ── POST ?action=remove_member — удалить участника из закрытого чата
    if method == "POST" and action == "remove_member":
        body = json.loads(event.get("body") or "{}")
        chat_id = body.get("chat_id")
        target_id = body.get("user_id")
        if not chat_id or not target_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "chat_id и user_id обязательны"})}
        cur = conn.cursor()
        cur.execute(f"""
            DELETE FROM {SCHEMA}.chat_members WHERE chat_id = %s AND user_id = %s
        """, (int(chat_id), int(target_id)))
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}