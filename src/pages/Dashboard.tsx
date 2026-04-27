import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { getSubscription, buySubscription, getWidget, saveWidget, getChatHistory } from "@/lib/api"
import Icon from "@/components/ui/icon"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

const PLANS = [
  { id: "starter", name: "Старт", price: "4 999", tokens: 20000 },
  { id: "pro", name: "Про", price: "9 999", tokens: 50000 },
  { id: "unlimited", name: "Безлимит", price: "24 999", tokens: -1 },
]

interface Subscription {
  plan: string | null
  tokens_limit: number
  tokens_used: number
  started_at: string
  expires_at: string | null
  is_active: boolean
}

interface WidgetSettings {
  widget_name: string
  widget_color: string
  widget_greeting: string
  widget_placeholder: string
}

interface ChatMessage {
  id: number
  role: string
  content: string
  tokens_used: number
  created_at: string
  session_token: string
}

export default function Dashboard() {
  const { user, logout, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [sub, setSub] = useState<Subscription | null>(null)
  const [widget, setWidget] = useState<WidgetSettings>({
    widget_name: "BizBot",
    widget_color: "#2563eb",
    widget_greeting: "Привет! Я BizBot — ваш умный помощник. Чем могу помочь?",
    widget_placeholder: "Напишите ваш вопрос...",
  })
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [saving, setSaving] = useState(false)
  const [buyingPlan, setBuyingPlan] = useState("")

  useEffect(() => {
    if (!authLoading && !user) navigate("/login")
  }, [user, authLoading, navigate])

  const loadData = useCallback(async () => {
    try {
      const [subData, widgetData, histData] = await Promise.all([getSubscription(), getWidget(), getChatHistory(20)])
      setSub(subData)
      setWidget(widgetData)
      setHistory(Array.isArray(histData) ? histData : [])
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    if (user) loadData()
  }, [user, loadData])

  const handleSaveWidget = async () => {
    setSaving(true)
    try {
      await saveWidget(widget)
      toast({ title: "Настройки сохранены!" })
    } catch {
      toast({ title: "Ошибка сохранения", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleBuyPlan = async (plan: string) => {
    setBuyingPlan(plan)
    try {
      await buySubscription(plan)
      toast({ title: "Подписка активирована!", description: `Тариф ${plan} успешно подключён` })
      loadData()
    } catch {
      toast({ title: "Ошибка", description: "Не удалось активировать подписку", variant: "destructive" })
    } finally {
      setBuyingPlan("")
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#060b18] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  const tokensPercent = sub && sub.tokens_limit > 0
    ? Math.min(100, (sub.tokens_used / sub.tokens_limit) * 100)
    : 0

  const planName = PLANS.find((p) => p.id === sub?.plan)?.name || sub?.plan

  return (
    <div className="min-h-screen bg-[#060b18] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Icon name="Bot" size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg">BizBot</span>
          </div>
          <div className="flex items-center gap-3">
            {user.is_admin && (
              <button onClick={() => navigate("/admin")} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm">
                <Icon name="Shield" size={14} />
                Админ
              </button>
            )}
            <div className="flex items-center gap-2">
              {user.avatar_url ? (
                <img src={user.avatar_url} className="w-8 h-8 rounded-full" alt="" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Icon name="User" size={16} />
                </div>
              )}
              <span className="text-sm text-white/70">{user.name}</span>
            </div>
            <button onClick={() => { logout(); navigate("/") }} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all">
              <Icon name="LogOut" size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">Личный кабинет</h1>
        <p className="text-white/50 mb-8">Управляйте подпиской, настройкой виджета и историей</p>

        <Tabs defaultValue="overview">
          <TabsList className="bg-white/5 border border-white/10 mb-8">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Обзор</TabsTrigger>
            <TabsTrigger value="subscription" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Подписка</TabsTrigger>
            <TabsTrigger value="widget" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Виджет</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">История</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Icon name="CreditCard" size={20} className="text-blue-400" />
                  </div>
                  <span className="text-white/60 text-sm">Тариф</span>
                </div>
                <div className="text-2xl font-bold">{sub?.plan ? planName : "Нет подписки"}</div>
                {sub?.is_active && <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/30">Активна</Badge>}
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Icon name="Zap" size={20} className="text-purple-400" />
                  </div>
                  <span className="text-white/60 text-sm">Токены</span>
                </div>
                {sub?.plan ? (
                  <>
                    <div className="text-2xl font-bold mb-2">
                      {sub.tokens_used.toLocaleString()} / {sub.tokens_limit > 0 ? sub.tokens_limit.toLocaleString() : "∞"}
                    </div>
                    {sub.tokens_limit > 0 && <Progress value={tokensPercent} className="h-1.5 bg-white/10" />}
                  </>
                ) : (
                  <div className="text-white/40">—</div>
                )}
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Icon name="Calendar" size={20} className="text-green-400" />
                  </div>
                  <span className="text-white/60 text-sm">Истекает</span>
                </div>
                <div className="text-2xl font-bold">
                  {sub?.expires_at
                    ? new Date(sub.expires_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
                    : "—"}
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Icon name="MessageSquare" size={18} className="text-blue-400" />
                Последние диалоги
              </h3>
              {history.length === 0 ? (
                <p className="text-white/40 text-sm">Диалогов пока нет</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.slice(0, 10).map((m) => (
                    <div key={m.id} className={`flex gap-3 p-3 rounded-xl ${m.role === "user" ? "bg-white/5" : "bg-blue-500/5"}`}>
                      <Icon name={m.role === "user" ? "User" : "Bot"} size={14} className={`flex-shrink-0 mt-0.5 ${m.role === "user" ? "text-white/40" : "text-blue-400"}`} />
                      <p className="text-white/70 text-sm truncate flex-1">{m.content}</p>
                      <span className="text-white/30 text-xs flex-shrink-0">{m.tokens_used > 0 ? `${m.tokens_used}t` : ""}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Subscription */}
          <TabsContent value="subscription">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PLANS.map((plan) => (
                <div key={plan.id} className={`p-6 rounded-2xl border flex flex-col ${sub?.plan === plan.id ? "bg-blue-600/20 border-blue-500/40" : "bg-white/5 border-white/10"}`}>
                  {sub?.plan === plan.id && <Badge className="self-start mb-3 bg-blue-500/30 text-blue-300 border-blue-400/30">Текущий</Badge>}
                  <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                  <div className="text-3xl font-bold mb-1">{plan.price} ₽<span className="text-white/40 text-base font-normal">/мес</span></div>
                  <p className="text-blue-400 text-sm mb-6">{plan.tokens > 0 ? `${plan.tokens.toLocaleString()} токенов` : "Безлимит"}</p>
                  <button
                    onClick={() => handleBuyPlan(plan.id)}
                    disabled={buyingPlan === plan.id || sub?.plan === plan.id}
                    className={`mt-auto w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                      sub?.plan === plan.id
                        ? "bg-white/10 text-white/40 cursor-default"
                        : "bg-blue-600 text-white hover:bg-blue-500"
                    }`}
                  >
                    {buyingPlan === plan.id ? "Активация..." : sub?.plan === plan.id ? "Активен" : "Выбрать"}
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Widget */}
          <TabsContent value="widget">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <h3 className="font-semibold text-lg">Настройка виджета</h3>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Имя бота</label>
                  <input
                    value={widget.widget_name}
                    onChange={(e) => setWidget({ ...widget, widget_name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Приветствие</label>
                  <textarea
                    value={widget.widget_greeting}
                    onChange={(e) => setWidget({ ...widget, widget_greeting: e.target.value })}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Плейсхолдер</label>
                  <input
                    value={widget.widget_placeholder}
                    onChange={(e) => setWidget({ ...widget, widget_placeholder: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Цвет</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={widget.widget_color}
                      onChange={(e) => setWidget({ ...widget, widget_color: e.target.value })}
                      className="w-12 h-12 rounded-xl border border-white/10 bg-transparent cursor-pointer"
                    />
                    <span className="text-white/40 text-sm">{widget.widget_color}</span>
                  </div>
                </div>
                <button
                  onClick={handleSaveWidget}
                  disabled={saving}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 transition-all disabled:opacity-50"
                >
                  {saving ? "Сохранение..." : "Сохранить"}
                </button>
              </div>

              {/* Preview */}
              <div>
                <h3 className="font-semibold text-lg mb-5">Предпросмотр</h3>
                <div className="bg-[#0d1424] border border-white/15 rounded-2xl overflow-hidden shadow-xl" style={{ maxWidth: "320px" }}>
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10" style={{ background: `${widget.widget_color}20` }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: widget.widget_color }}>
                      <Icon name="Bot" size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">{widget.widget_name}</div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        <span className="text-white/50 text-xs">Онлайн</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${widget.widget_color}40` }}>
                        <Icon name="Bot" size={14} className="text-blue-400" />
                      </div>
                      <div className="bg-white/8 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm text-white/80 max-w-[85%]">
                        {widget.widget_greeting}
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="flex gap-2">
                      <input disabled placeholder={widget.widget_placeholder} className="flex-1 bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-white/30 text-sm" />
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: widget.widget_color }}>
                        <Icon name="Send" size={14} className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* History */}
          <TabsContent value="history">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg mb-5">История диалогов</h3>
              {history.length === 0 ? (
                <div className="text-center py-16 text-white/30">
                  <Icon name="MessageCircle" size={40} className="mx-auto mb-3 opacity-30" />
                  <p>История диалогов пуста</p>
                </div>
              ) : (
                history.map((m) => (
                  <div key={m.id} className={`flex gap-4 p-4 rounded-xl border ${m.role === "user" ? "bg-white/5 border-white/8 flex-row-reverse" : "bg-blue-500/5 border-blue-500/10"}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${m.role === "user" ? "bg-white/15" : "bg-blue-500/20"}`}>
                      <Icon name={m.role === "user" ? "User" : "Bot"} size={15} className={m.role === "user" ? "text-white/60" : "text-blue-400"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm leading-relaxed">{m.content}</p>
                      <p className="text-white/30 text-xs mt-1">
                        {new Date(m.created_at).toLocaleString("ru-RU")}
                        {m.tokens_used > 0 && ` · ${m.tokens_used} токенов`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
