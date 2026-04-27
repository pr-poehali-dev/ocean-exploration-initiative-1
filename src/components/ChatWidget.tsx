import { useState, useRef, useEffect } from "react"
import { sendChat } from "@/lib/api"
import Icon from "@/components/ui/icon"
import { useNavigate } from "react-router-dom"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function ChatWidget({ isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Привет! Я BizBot — ваш умный бизнес-ассистент. Задайте мне вопрос! У вас есть 3 бесплатных вопроса 🤖" },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionToken] = useState(() => Math.random().toString(36).slice(2))
  const [limitReached, setLimitReached] = useState(false)
  const [questionsLeft, setQuestionsLeft] = useState(3)
  const endRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading || limitReached) return
    const userMsg = input.trim()
    setInput("")
    setMessages((m) => [...m, { role: "user", content: userMsg }])
    setLoading(true)
    try {
      const res = await sendChat(userMsg, sessionToken)
      if (res.error === "limit_reached") {
        setLimitReached(true)
        setMessages((m) => [...m, { role: "assistant", content: "Вы использовали все 3 бесплатных вопроса! Зарегистрируйтесь чтобы продолжить — ответы на все ваши вопросы ждут 🚀" }])
      } else if (res.reply) {
        setMessages((m) => [...m, { role: "assistant", content: res.reply }])
        if (res.remaining_guest_questions !== null && res.remaining_guest_questions !== undefined) {
          setQuestionsLeft(res.remaining_guest_questions)
          if (res.remaining_guest_questions === 0) setLimitReached(true)
        }
      } else {
        setMessages((m) => [...m, { role: "assistant", content: "Что-то пошло не так. Попробуйте ещё раз!" }])
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Ошибка соединения. Попробуйте позже." }])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-end p-4 sm:p-6 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-sm bg-[#0d1424] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ height: "520px" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-indigo-600/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Icon name="Bot" size={18} className="text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm">BizBot</div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white/50 text-xs">Онлайн</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${m.role === "assistant" ? "bg-blue-500/30" : "bg-white/20"}`}>
                <Icon name={m.role === "assistant" ? "Bot" : "User"} size={14} className={m.role === "assistant" ? "text-blue-400" : "text-white/70"} />
              </div>
              <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === "assistant" ? "bg-white/8 text-white/85 rounded-tl-none" : "bg-blue-600 text-white rounded-tr-none"}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-blue-500/30 flex-shrink-0 flex items-center justify-center">
                <Icon name="Bot" size={14} className="text-blue-400" />
              </div>
              <div className="bg-white/8 rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Limit banner */}
        {limitReached && (
          <div className="px-4 pb-2">
            <div className="bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-500/30 rounded-xl p-4 text-center">
              <p className="text-white/80 text-sm mb-3">Лимит исчерпан. Зарегистрируйтесь для продолжения!</p>
              <button
                onClick={() => { onClose(); navigate("/login") }}
                className="w-full py-2.5 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-400 transition-colors"
              >
                Зарегистрироваться бесплатно
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        {!limitReached && (
          <div className="px-4 pb-4 pt-2">
            {questionsLeft > 0 && questionsLeft <= 3 && (
              <p className="text-white/30 text-xs mb-2 text-center">Осталось бесплатных вопросов: {questionsLeft}</p>
            )}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Напишите вопрос..."
                className="flex-1 bg-white/8 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                disabled={loading}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white hover:bg-blue-400 transition-colors disabled:opacity-50"
              >
                <Icon name="Send" size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
