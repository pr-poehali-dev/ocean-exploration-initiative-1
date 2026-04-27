import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { yandexCallback } from "@/lib/api"
import GradientBlinds from "@/components/GradientBlinds"
import Icon from "@/components/ui/icon"

const YANDEX_CLIENT_ID = import.meta.env.VITE_YANDEX_CLIENT_ID || ""
const REDIRECT_URI = typeof window !== "undefined" ? `${window.location.origin}/login` : ""

export default function Login() {
  const navigate = useNavigate()
  const { user, login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user) { navigate("/dashboard"); return }

    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    if (code) {
      setLoading(true)
      yandexCallback(code).then((res) => {
        if (res.token && res.user) {
          login(res.token, res.user)
          window.history.replaceState({}, "", "/login")
          navigate("/dashboard")
        } else {
          setError("Ошибка авторизации. Попробуйте снова.")
          setLoading(false)
        }
      }).catch(() => {
        setError("Ошибка соединения. Попробуйте снова.")
        setLoading(false)
      })
    }
  }, [user, navigate, login])

  const loginWithYandex = () => {
    if (!YANDEX_CLIENT_ID) {
      setError("Яндекс OAuth не настроен. Добавьте VITE_YANDEX_CLIENT_ID в переменные окружения.")
      return
    }
    const url = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${YANDEX_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
    window.location.href = url
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060b18] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Входим через Яндекс...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060b18] relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0">
        <GradientBlinds
          gradientColors={["#060b18", "#0f1e4a", "#1a3a8f", "#060b18"]}
          angle={25}
          noise={0.15}
          blindCount={8}
          spotlightRadius={0.5}
          spotlightOpacity={0.3}
          mouseDampening={0.1}
        />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-5">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <Icon name="Bot" size={30} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Добро пожаловать</h1>
            <p className="text-white/50 text-sm">Войдите в BizBot через Яндекс</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={loginWithYandex}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#FC3F1D] hover:bg-[#e63618] text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-500/20 text-sm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.32 3H10.5C7.48 3 5.5 5.1 5.5 8.33c0 2.4 1.05 4.07 2.92 4.97L5.5 21h3.18l2.74-7.3h1.07V21h2.83V3zm-2.83 8.2V5.5h.33c1.47 0 2.27.83 2.27 2.7 0 1.83-.8 3-2.27 3h-.33z" />
            </svg>
            Войти через Яндекс
          </button>

          <div className="mt-6 text-center">
            <p className="text-white/30 text-xs">
              Входя, вы соглашаетесь с{" "}
              <a href="#" className="text-blue-400 hover:underline">условиями использования</a>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <button onClick={() => navigate("/")} className="text-white/40 text-sm hover:text-white/70 transition-colors flex items-center gap-1.5 mx-auto">
              <Icon name="ArrowLeft" size={14} />
              На главную
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
