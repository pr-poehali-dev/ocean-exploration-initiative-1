"""
Админ-панель и личный кабинет: управление пользователями, подписками, виджетом, статистикой.
"""
import json
import os
import hashlib
import hmac
import base64
import time
import psycopg2


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def verify_jwt(token: str) -> dict | None:
    try:
        secret = os.environ.get("JWT_SECRET", "bizbot-secret-key-change-me")
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, body, sig = parts
        expected = base64.urlsafe_b64encode(
            hmac.new(secret.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest()
        ).rstrip(b"=").decode()
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(base64.urlsafe_b64decode(body + "=="))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None


def handler(event: dict, context) -> dict:
    """Управление подписками, виджетом, историей и администрированием BizBot"""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    auth = event.get("headers", {}).get("X-Authorization", "")
    token = auth.replace("Bearer ", "")
    user_payload = verify_jwt(token) if token else None

    if not user_payload:
        return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Unauthorized"})}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "")
    raw_body = event.get("body") or "{}"
    body = json.loads(raw_body) if isinstance(raw_body, str) else raw_body
    conn = get_db()
    cur = conn.cursor()

    if "/widget" in path:
        if method == "GET":
            cur.execute("SELECT widget_name, widget_color, widget_greeting, widget_placeholder FROM bizbot_widget_settings WHERE user_id = %s", (user_payload["user_id"],))
            row = cur.fetchone()
            conn.close()
            if not row:
                return {"statusCode": 200, "headers": cors, "body": json.dumps({"widget_name": "BizBot", "widget_color": "#2563eb", "widget_greeting": "Привет! Я BizBot — ваш умный помощник. Чем могу помочь?", "widget_placeholder": "Напишите ваш вопрос..."})}
            return {"statusCode": 200, "headers": cors, "body": json.dumps({"widget_name": row[0], "widget_color": row[1], "widget_greeting": row[2], "widget_placeholder": row[3]})}

        if method == "PUT":
            widget_name = body.get("widget_name", "BizBot")
            widget_color = body.get("widget_color", "#2563eb")
            widget_greeting = body.get("widget_greeting", "Привет! Я BizBot — ваш умный помощник.")
            widget_placeholder = body.get("widget_placeholder", "Напишите ваш вопрос...")
            cur.execute(
                "INSERT INTO bizbot_widget_settings (user_id, widget_name, widget_color, widget_greeting, widget_placeholder, updated_at) VALUES (%s, %s, %s, %s, %s, NOW()) ON CONFLICT (user_id) DO UPDATE SET widget_name=%s, widget_color=%s, widget_greeting=%s, widget_placeholder=%s, updated_at=NOW()",
                (user_payload["user_id"], widget_name, widget_color, widget_greeting, widget_placeholder, widget_name, widget_color, widget_greeting, widget_placeholder)
            )
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": cors, "body": json.dumps({"success": True})}

    if "/subscription" in path:
        if method == "GET":
            cur.execute("SELECT plan, tokens_limit, tokens_used, started_at, expires_at, is_active FROM bizbot_subscriptions WHERE user_id = %s", (user_payload["user_id"],))
            row = cur.fetchone()
            conn.close()
            if not row:
                return {"statusCode": 200, "headers": cors, "body": json.dumps({"plan": None})}
            return {"statusCode": 200, "headers": cors, "body": json.dumps({"plan": row[0], "tokens_limit": row[1], "tokens_used": row[2], "started_at": str(row[3]), "expires_at": str(row[4]) if row[4] else None, "is_active": row[5]})}

        if method == "POST":
            plan = body.get("plan", "starter")
            plans = {"starter": (20000, 4999), "pro": (50000, 9999), "unlimited": (-1, 24999)}
            if plan not in plans:
                conn.close()
                return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Invalid plan"})}
            tokens_limit = plans[plan][0]
            expires_at = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(time.time() + 30 * 24 * 3600))
            cur.execute(
                "INSERT INTO bizbot_subscriptions (user_id, plan, tokens_limit, tokens_used, expires_at, is_active) VALUES (%s, %s, %s, 0, %s, TRUE) ON CONFLICT (user_id) DO UPDATE SET plan=%s, tokens_limit=%s, tokens_used=0, expires_at=%s, is_active=TRUE",
                (user_payload["user_id"], plan, tokens_limit, expires_at, plan, tokens_limit, expires_at)
            )
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": cors, "body": json.dumps({"success": True, "plan": plan})}

    if "/stats" in path and user_payload.get("is_admin"):
        cur.execute("SELECT COUNT(*) FROM bizbot_users")
        total_users = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM bizbot_subscriptions WHERE is_active = TRUE")
        active_subs = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM bizbot_messages")
        total_messages = cur.fetchone()[0]
        cur.execute("SELECT plan, COUNT(*) FROM bizbot_subscriptions GROUP BY plan")
        plans = {row[0]: row[1] for row in cur.fetchall()}
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"total_users": total_users, "active_subscriptions": active_subs, "total_messages": total_messages, "plans": plans})}

    if "/users" in path and user_payload.get("is_admin"):
        params = event.get("queryStringParameters") or {}
        limit = int(params.get("limit", 50))
        cur.execute(
            "SELECT u.id, u.email, u.name, u.avatar_url, u.created_at, s.plan, s.tokens_used, s.tokens_limit, s.is_active FROM bizbot_users u LEFT JOIN bizbot_subscriptions s ON s.user_id = u.id ORDER BY u.created_at DESC LIMIT %s",
            (limit,)
        )
        rows = cur.fetchall()
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps([{"id": r[0], "email": r[1], "name": r[2], "avatar_url": r[3], "created_at": str(r[4]), "plan": r[5], "tokens_used": r[6], "tokens_limit": r[7], "is_active": r[8]} for r in rows])}

    conn.close()
    return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Not found"})}