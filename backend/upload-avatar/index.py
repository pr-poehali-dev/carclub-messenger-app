"""
Загрузка аватара пользователя в S3 и обновление avatar_url в БД.
Принимает base64-изображение, сохраняет в S3, возвращает CDN-URL.
"""
import json
import os
import base64
import boto3
import psycopg2

SCHEMA = "t_p76085414_carclub_messenger_ap"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    session_id = event.get("headers", {}).get("X-Session-Id", "")
    if not session_id:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Требуется авторизация"})}

    body = json.loads(event.get("body") or "{}")
    image_data = body.get("image")
    content_type = body.get("content_type", "image/jpeg")

    if not image_data:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нет изображения"})}

    conn = get_conn()
    cur = conn.cursor()

    cur.execute(f"SELECT id FROM {SCHEMA}.sessions WHERE session_id = %s", (session_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Сессия не найдена"})}
    user_id = row[0]

    raw = base64.b64decode(image_data)
    key = f"avatars/{user_id}.jpg"

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=content_type)

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    cur.execute(f"UPDATE {SCHEMA}.users SET avatar_url = %s WHERE id = %s", (cdn_url, user_id))
    conn.commit()
    conn.close()

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"avatar_url": cdn_url}),
    }
