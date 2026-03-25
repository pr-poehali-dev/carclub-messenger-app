"""
Push-уведомления: сохранение подписок и отправка уведомлений.
GET ?action=vapid_key — публичный VAPID ключ
GET ?action=generate_keys — сгенерировать VAPID ключи (один раз)
POST ?action=subscribe — сохранить подписку
POST ?action=send — отправить push всем подписчикам кроме отправителя
"""
import json
import os
import psycopg2
from pywebpush import webpush, WebPushException
from py_vapid import Vapid

SCHEMA = "t_p76085414_carclub_messenger_ap"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """Управление push-подписками и отправка уведомлений."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    VAPID_PRIVATE = os.environ.get("VAPID_PRIVATE_KEY", "")
    VAPID_PUBLIC = os.environ.get("VAPID_PUBLIC_KEY", "")
    VAPID_EMAIL = "mailto:admin@carclub.app"

    # GET ?action=generate_keys — только для первоначальной настройки
    if method == "GET" and action == "generate_keys":
        from cryptography.hazmat.primitives.asymmetric import ec
        from cryptography.hazmat.backends import default_backend
        import base64
        private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
        public_key = private_key.public_key()
        from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat, PrivateFormat, NoEncryption
        pub_bytes = public_key.public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)
        priv_bytes = private_key.private_bytes(Encoding.DER, PrivateFormat.PKCS8, NoEncryption())
        pub_b64 = base64.urlsafe_b64encode(pub_bytes).rstrip(b"=").decode()
        priv_b64 = base64.urlsafe_b64encode(priv_bytes).rstrip(b"=").decode()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "public_key": pub_b64,
            "private_key": priv_b64,
            "instruction": "Добавь эти значения в секреты VAPID_PUBLIC_KEY и VAPID_PRIVATE_KEY"
        })}

    # GET ?action=vapid_key
    if method == "GET" and action == "vapid_key":
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"public_key": VAPID_PUBLIC})}

    # POST ?action=subscribe — сохранить подписку
    if method == "POST" and action == "subscribe":
        session_id = event.get("headers", {}).get("X-Session-Id", "")
        body = json.loads(event.get("body") or "{}")
        endpoint = body.get("endpoint", "")
        p256dh = body.get("keys", {}).get("p256dh", "")
        auth = body.get("keys", {}).get("auth", "")

        if not endpoint or not p256dh or not auth:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неверные данные подписки"})}

        conn = get_conn()
        cur = conn.cursor()

        user_id = None
        if session_id:
            cur.execute(f"SELECT user_id FROM {SCHEMA}.sessions WHERE session_id = %s", (session_id,))
            row = cur.fetchone()
            if row:
                user_id = row[0]

        if not user_id:
            cur.close()
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

        cur.execute(f"""
            INSERT INTO {SCHEMA}.push_subscriptions (user_id, endpoint, p256dh, auth)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, user_id = EXCLUDED.user_id
        """, (user_id, endpoint, p256dh, auth))
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # POST ?action=send — разослать push (вызывается из chat при новом сообщении)
    if method == "POST" and action == "send":
        body = json.loads(event.get("body") or "{}")
        sender = body.get("sender", "")
        title = body.get("title", "Пульс Города")
        message = body.get("message", "")
        chat_id = body.get("chat_id")

        conn = get_conn()
        cur = conn.cursor()

        # Получаем всех подписчиков кроме отправителя
        if sender:
            cur.execute(f"""
                SELECT ps.endpoint, ps.p256dh, ps.auth
                FROM {SCHEMA}.push_subscriptions ps
                JOIN {SCHEMA}.users u ON u.id = ps.user_id
                WHERE u.nickname != %s
            """, (sender,))
        else:
            cur.execute(f"SELECT endpoint, p256dh, auth FROM {SCHEMA}.push_subscriptions")

        rows = cur.fetchall()
        cur.close()
        conn.close()

        sent = 0
        for endpoint, p256dh, auth in rows:
            try:
                webpush(
                    subscription_info={"endpoint": endpoint, "keys": {"p256dh": p256dh, "auth": auth}},
                    data=json.dumps({"title": title, "body": message}),
                    vapid_private_key=VAPID_PRIVATE,
                    vapid_claims={"sub": VAPID_EMAIL},
                )
                sent += 1
            except WebPushException:
                pass

        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"sent": sent})}

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}