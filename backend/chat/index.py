"""
Chat API: обрабатывает сообщения пользователей через OpenAI, управляет лимитами токенов и гостевым доступом (3 вопроса).
"""
import json
import os
import hashlib
import hmac
import base64
import time
import uuid
import urllib.request
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


def call_openai(messages: list, model: str = "gpt-4o-mini") -> tuple[str, int]:
    api_key = os.environ.get("OPENAI_API_KEY", "")
    data = json.dumps({
        "model": model,
        "messages": messages,
        "max_tokens": 800,
        "temperature": 0.7,
    }).encode()
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=data,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        result = json.loads(resp.read())
    content = result["choices"][0]["message"]["content"]
    tokens = result.get("usage", {}).get("total_tokens", len(content) // 4)
    return content, tokens


def handler(event: dict, context) -> dict:
    """Обработка чат-сообщений: гостевой режим (3 вопроса), авторизованный режим с учётом подписки"""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    method = event.get("httpMethod", "POST")
    path = event.get("path", "")
    raw_body = event.get("body") or "{}"
    body = json.loads(raw_body) if isinstance(raw_body, str) else raw_body

    auth = event.get("headers", {}).get("X-Authorization", "")
    token = auth.replace("Bearer ", "")
    user_payload = verify_jwt(token) if token else None

    conn = get_db()
    cur = conn.cursor()

    if method == "POST":
        body = body if isinstance(body, dict) else {}
        message = body.get("message", "").strip()
        session_token = body.get("session_token", "")

        if not message:
            conn.close()
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Message is required"})}

        if not session_token:
            session_token = str(uuid.uuid4())

        cur.execute("SELECT id, user_id, guest_questions_used FROM bizbot_sessions WHERE session_token = %s", (session_token,))
        session = cur.fetchone()

        if not session:
            user_id = user_payload["user_id"] if user_payload else None
            cur.execute(
                "INSERT INTO bizbot_sessions (user_id, session_token) VALUES (%s, %s) RETURNING id, user_id, guest_questions_used",
                (user_id, session_token)
            )
            session = cur.fetchone()
            conn.commit()

        session_id, session_user_id, guest_count = session

        if not user_payload:
            if guest_count >= 3:
                conn.close()
                return {
                    "statusCode": 402,
                    "headers": cors,
                    "body": json.dumps({
                        "error": "limit_reached",
                        "message": "Вы использовали все 3 бесплатных вопроса. Зарегистрируйтесь и выберите тариф для продолжения!",
                        "session_token": session_token
                    })
                }
            cur.execute("UPDATE bizbot_sessions SET guest_questions_used = guest_questions_used + 1 WHERE id = %s", (session_id,))
            conn.commit()
        else:
            cur.execute(
                "SELECT id, tokens_limit, tokens_used, is_active, expires_at FROM bizbot_subscriptions WHERE user_id = %s",
                (user_payload["user_id"],)
            )
            sub = cur.fetchone()
            if not sub or not sub[3]:
                conn.close()
                return {"statusCode": 402, "headers": cors, "body": json.dumps({"error": "no_subscription", "message": "У вас нет активной подписки. Выберите тариф!"})}
            if sub[4] and sub[4] < time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()):
                conn.close()
                return {"statusCode": 402, "headers": cors, "body": json.dumps({"error": "subscription_expired", "message": "Ваша подписка истекла. Обновите тариф!"})}
            sub_id, tokens_limit, tokens_used, is_active, expires_at = sub
            if tokens_limit > 0 and tokens_used >= tokens_limit:
                conn.close()
                return {"statusCode": 402, "headers": cors, "body": json.dumps({"error": "tokens_exhausted", "message": f"Токены закончились ({tokens_used}/{tokens_limit}). Обновите тариф!"})}

        cur.execute(
            "SELECT role, content FROM bizbot_messages WHERE session_id = %s ORDER BY created_at DESC LIMIT 10",
            (session_id,)
        )
        history = list(reversed(cur.fetchall()))

        system_prompt = "Ты BizBot — умный бизнес-ассистент. Помогаешь с вопросами о бизнесе, аналитике, стратегии. Отвечай чётко, профессионально и по-русски."
        messages = [{"role": "system", "content": system_prompt}]
        for role, content in history:
            messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": message})

        try:
            reply, tokens_used_now = call_openai(messages)
        except Exception as e:
            conn.close()
            return {"statusCode": 500, "headers": cors, "body": json.dumps({"error": "AI error", "message": str(e)})}

        cur.execute("INSERT INTO bizbot_messages (session_id, role, content, tokens_used) VALUES (%s, 'user', %s, 0)", (session_id, message))
        cur.execute("INSERT INTO bizbot_messages (session_id, role, content, tokens_used) VALUES (%s, 'assistant', %s, %s)", (session_id, reply, tokens_used_now))

        if user_payload:
            cur.execute("UPDATE bizbot_subscriptions SET tokens_used = tokens_used + %s WHERE user_id = %s", (tokens_used_now, user_payload["user_id"]))

        conn.commit()

        remaining_guest = max(0, 3 - (guest_count + 1)) if not user_payload else None
        conn.close()
        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({
                "reply": reply,
                "session_token": session_token,
                "tokens_used": tokens_used_now,
                "remaining_guest_questions": remaining_guest
            })
        }

    if method == "GET" and "/history" in path:
        if not user_payload:
            conn.close()
            return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Unauthorized"})}
        params = event.get("queryStringParameters") or {}
        limit = int(params.get("limit", 50))
        cur.execute(
            "SELECT m.id, m.role, m.content, m.tokens_used, m.created_at, s.session_token FROM bizbot_messages m JOIN bizbot_sessions s ON s.id = m.session_id WHERE s.user_id = %s ORDER BY m.created_at DESC LIMIT %s",
            (user_payload["user_id"], limit)
        )
        rows = cur.fetchall()
        conn.close()
        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps([{"id": r[0], "role": r[1], "content": r[2], "tokens_used": r[3], "created_at": str(r[4]), "session_token": r[5]} for r in rows])
        }

    conn.close()
    return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Not found"})}