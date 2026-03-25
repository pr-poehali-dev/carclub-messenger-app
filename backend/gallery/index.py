"""
Галерея клуба: папки, загрузка фото/видео в S3, лайки.
GET  ?action=folders           — список папок
GET  ?action=items&folder_id=X — файлы папки
POST ?action=create_folder     — создать папку (админ)
POST ?action=upload            — загрузить фото/видео
POST ?action=like&item_id=X    — лайк
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


def get_user(session_id: str, conn):
    if not session_id:
        return None, False
    cur = conn.cursor()
    cur.execute(f"""
        SELECT u.id, u.is_admin FROM {SCHEMA}.sessions s
        JOIN {SCHEMA}.users u ON u.id = s.user_id
        WHERE s.session_id = %s
    """, (session_id,))
    row = cur.fetchone()
    cur.close()
    if not row:
        return None, False
    return row[0], bool(row[1])


def s3_client():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def upload_file(data: bytes, content_type: str, ext: str) -> str:
    key = f"gallery/{uuid.uuid4().hex}.{ext}"
    s3_client().put_object(Bucket="files", Key=key, Body=data, ContentType=content_type)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "folders")
    session_id = (event.get("headers") or {}).get("X-Session-Id", "")

    conn = get_conn()

    # ── GET folders — список папок с кол-вом файлов
    if method == "GET" and action == "folders":
        cur = conn.cursor()
        cur.execute(f"""
            SELECT f.id, f.name, f.cover_url,
                   COUNT(i.id) AS item_count
            FROM {SCHEMA}.gallery_folders f
            LEFT JOIN {SCHEMA}.gallery_items i ON i.folder_id = f.id
            GROUP BY f.id, f.name, f.cover_url
            ORDER BY f.created_at ASC
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps([
            {"id": r[0], "name": r[1], "coverUrl": r[2], "itemCount": int(r[3])}
            for r in rows
        ], ensure_ascii=False)}

    # ── GET items — файлы папки
    if method == "GET" and action == "items":
        folder_id = params.get("folder_id")
        if not folder_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "folder_id required"})}
        cur = conn.cursor()
        cur.execute(f"""
            SELECT id, url, thumbnail_url, title, type, likes, created_at
            FROM {SCHEMA}.gallery_items
            WHERE folder_id = %s
            ORDER BY created_at DESC
        """, (int(folder_id),))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps([
            {"id": r[0], "url": r[1], "thumbnailUrl": r[2], "title": r[3],
             "type": r[4], "likes": r[5]}
            for r in rows
        ], ensure_ascii=False)}

    # ── Действия требующие авторизации
    user_id, is_admin = get_user(session_id, conn)

    # ── POST create_folder — только админ
    if method == "POST" and action == "create_folder":
        if not is_admin:
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Только для администраторов"})}
        body = json.loads(event.get("body") or "{}")
        name = (body.get("name") or "").strip()
        if not name:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Название обязательно"})}
        cur = conn.cursor()
        cur.execute(f"""
            INSERT INTO {SCHEMA}.gallery_folders (name, created_by)
            VALUES (%s, %s) RETURNING id, name, cover_url
        """, (name, user_id))
        r = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(
            {"id": r[0], "name": r[1], "coverUrl": r[2], "itemCount": 0}, ensure_ascii=False)}

    # ── POST upload — загрузить файл
    if method == "POST" and action == "upload":
        if not user_id:
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Требуется авторизация"})}
        body = json.loads(event.get("body") or "{}")
        folder_id = body.get("folder_id")
        file_data = body.get("file")
        content_type = body.get("content_type", "image/jpeg")
        title = (body.get("title") or "").strip()
        file_type = "video" if content_type.startswith("video") else "photo"

        if not folder_id or not file_data:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "folder_id и file обязательны"})}

        raw = base64.b64decode(file_data)
        ext_map = {
            "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
            "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
        }
        ext = ext_map.get(content_type, "bin")
        url = upload_file(raw, content_type, ext)

        cur = conn.cursor()
        cur.execute(f"""
            INSERT INTO {SCHEMA}.gallery_items (folder_id, url, title, type, uploaded_by)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, url, thumbnail_url, title, type, likes
        """, (int(folder_id), url, title or (f"Видео" if file_type == "video" else "Фото"), file_type, user_id))
        r = cur.fetchone()

        # Обновляем обложку папки если её нет
        if file_type == "photo":
            cur.execute(f"""
                UPDATE {SCHEMA}.gallery_folders SET cover_url = COALESCE(cover_url, %s) WHERE id = %s
            """, (url, int(folder_id)))

        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(
            {"id": r[0], "url": r[1], "thumbnailUrl": r[2], "title": r[3], "type": r[4], "likes": r[5]},
            ensure_ascii=False)}

    # ── POST like
    if method == "POST" and action == "like":
        item_id = params.get("item_id")
        if not item_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "item_id required"})}
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.gallery_items SET likes = likes + 1 WHERE id = %s RETURNING likes",
                    (int(item_id),))
        r = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"likes": r[0] if r else 0})}

    conn.close()
    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}
