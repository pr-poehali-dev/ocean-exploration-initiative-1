"""
Авторизация через Яндекс OAuth. Выдаёт JWT токен после успешного входа.
"""
import json
import os
import hashlib
import hmac
import base64
import time
import urllib.request
import urllib.parse
import psycopg2


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def make_jwt(payload: dict) -> str:
    secret = os.environ.get("JWT_SECRET", "bizbot-secret-key-change-me")
    header = b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload["exp"] = int(time.time()) + 60 * 60 * 24 * 30
    body = b64url(json.dumps(payload).encode())
    sig = b64url(hmac.new(secret.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest())  # type: ignore
    return f"{header}.{body}.{sig}"


def verify_jwt(token: str) -> dict | None:
    try:
        secret = os.environ.get("JWT_SECRET", "bizbot-secret-key-change-me")
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, body, sig = parts
        expected = b64url(hmac.new(secret.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(base64.urlsafe_b64decode(body + "=="))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None


def handler(event: dict, context) -> dict:
    """Авторизация через Яндекс OAuth и управление сессией пользователя"""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    path = event.get("path", "")
    method = event.get("httpMethod", "GET")

    if method == "GET" and "/me" in path:
        auth = event.get("headers", {}).get("X-Authorization", "")
        token = auth.replace("Bearer ", "")
        payload = verify_jwt(token)
        if not payload:
            return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Unauthorized"})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "SELECT u.id, u.email, u.name, u.avatar_url, u.is_admin, s.plan, s.tokens_limit, s.tokens_used, s.expires_at, s.is_active FROM bizbot_users u LEFT JOIN bizbot_subscriptions s ON s.user_id = u.id WHERE u.id = %s",
            (payload["user_id"],)
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "User not found"})}
        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({
                "id": row[0], "email": row[1], "name": row[2], "avatar_url": row[3],
                "is_admin": row[4],
                "subscription": {
                    "plan": row[5], "tokens_limit": row[6], "tokens_used": row[7],
                    "expires_at": str(row[8]) if row[8] else None, "is_active": row[9]
                } if row[5] else None
            })
        }

    if method == "POST":
        raw_body = event.get("body") or "{}"
        try:
            body = json.loads(raw_body) if isinstance(raw_body, str) else (raw_body or {})
        except (json.JSONDecodeError, TypeError):
            body = {}
        code = body.get("code") if isinstance(body, dict) else None
        if not code:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "No code provided"})}

        client_id = os.environ.get("YANDEX_CLIENT_ID", "")
        client_secret = os.environ.get("YANDEX_CLIENT_SECRET", "")

        token_data = urllib.parse.urlencode({
            "grant_type": "authorization_code",
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
        }).encode()
        req = urllib.request.Request(
            "https://oauth.yandex.ru/token",
            data=token_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        with urllib.request.urlopen(req) as resp:
            token_resp = json.loads(resp.read())

        access_token = token_resp.get("access_token")
        if not access_token:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Failed to get token"})}

        req2 = urllib.request.Request(
            "https://login.yandex.ru/info?format=json",
            headers={"Authorization": f"OAuth {access_token}"}
        )
        with urllib.request.urlopen(req2) as resp:
            user_info = json.loads(resp.read())

        yandex_id = str(user_info.get("id"))
        email = user_info.get("default_email") or user_info.get("emails", [""])[0]
        name = user_info.get("real_name") or user_info.get("display_name") or email
        avatar_url = f"https://avatars.yandex.net/get-yapic/{user_info.get('default_avatar_id', '')}/islands-200" if user_info.get("default_avatar_id") else None

        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id, is_admin FROM bizbot_users WHERE yandex_id = %s", (yandex_id,))
        existing = cur.fetchone()
        if existing:
            user_id = existing[0]
            is_admin = existing[1]
            cur.execute("UPDATE bizbot_users SET name=%s, avatar_url=%s WHERE id=%s", (name, avatar_url, user_id))
        else:
            cur.execute(
                "INSERT INTO bizbot_users (yandex_id, email, name, avatar_url) VALUES (%s, %s, %s, %s) RETURNING id, is_admin",
                (yandex_id, email, name, avatar_url)
            )
            row = cur.fetchone()
            user_id = row[0]
            is_admin = row[1]
        conn.commit()
        conn.close()

        jwt_token = make_jwt({"user_id": user_id, "email": email, "is_admin": is_admin})
        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({"token": jwt_token, "user": {"id": user_id, "name": name, "email": email, "avatar_url": avatar_url, "is_admin": is_admin}})
        }

    return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Not found"})}