import func2url from "../../backend/func2url.json"

const AUTH_URL = func2url.auth
const CHAT_URL = func2url.chat
const ADMIN_URL = func2url.admin

export function getToken(): string | null {
  return localStorage.getItem("bizbot_token")
}

export function setToken(t: string) {
  localStorage.setItem("bizbot_token", t)
}

export function removeToken() {
  localStorage.removeItem("bizbot_token")
}

function authHeaders() {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }
}

export async function getMe() {
  const r = await fetch(`${AUTH_URL}/me`, { headers: authHeaders() })
  if (!r.ok) throw new Error("Unauthorized")
  return r.json()
}

export async function yandexCallback(code: string) {
  const r = await fetch(`${AUTH_URL}/yandex/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  })
  return r.json()
}

export async function sendChat(message: string, session_token: string) {
  const r = await fetch(`${CHAT_URL}/send`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ message, session_token }),
  })
  return r.json()
}

export async function getChatHistory(limit = 50) {
  const r = await fetch(`${CHAT_URL}/history?limit=${limit}`, { headers: authHeaders() })
  return r.json()
}

export async function getSubscription() {
  const r = await fetch(`${ADMIN_URL}/subscription`, { headers: authHeaders() })
  return r.json()
}

export async function buySubscription(plan: string) {
  const r = await fetch(`${ADMIN_URL}/subscription`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ plan }),
  })
  return r.json()
}

export async function getWidget() {
  const r = await fetch(`${ADMIN_URL}/widget`, { headers: authHeaders() })
  return r.json()
}

export async function saveWidget(data: object) {
  const r = await fetch(`${ADMIN_URL}/widget`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function getAdminStats() {
  const r = await fetch(`${ADMIN_URL}/stats`, { headers: authHeaders() })
  return r.json()
}

export async function getAdminUsers(limit = 50) {
  const r = await fetch(`${ADMIN_URL}/users?limit=${limit}`, { headers: authHeaders() })
  return r.json()
}

export { AUTH_URL, CHAT_URL, ADMIN_URL }