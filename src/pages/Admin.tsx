import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { getAdminStats, getAdminUsers } from "@/lib/api"
import Icon from "@/components/ui/icon"
import { Badge } from "@/components/ui/badge"

interface Stats {
  total_users: number
  active_subscriptions: number
  total_messages: number
  plans: Record<string, number>
}

interface AdminUser {
  id: number
  email: string
  name: string
  avatar_url: string | null
  created_at: string
  plan: string | null
  tokens_used: number
  tokens_limit: number
  is_active: boolean
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) navigate("/dashboard")
  }, [user, authLoading, navigate])

  const loadData = useCallback(async () => {
    try {
      const [statsData, usersData] = await Promise.all([getAdminStats(), getAdminUsers()])
      setStats(statsData)
      setUsers(Array.isArray(usersData) ? usersData : [])
    } catch {
      // silent
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    if (user?.is_admin) loadData()
  }, [user, loadData])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#060b18] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  const planColors: Record<string, string> = {
    starter: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    pro: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    unlimited: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  }

  return (
    <div className="min-h-screen bg-[#060b18] text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center cursor-pointer" onClick={() => navigate("/")}>
              <Icon name="Bot" size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg">BizBot</span>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Admin</Badge>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-all">
              <Icon name="User" size={14} />
              Кабинет
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-8">Панель администратора</h1>

        {loadingData ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { icon: "Users", label: "Пользователи", value: stats?.total_users ?? 0, color: "blue" },
                { icon: "CreditCard", label: "Активных подписок", value: stats?.active_subscriptions ?? 0, color: "green" },
                { icon: "MessageCircle", label: "Сообщений", value: stats?.total_messages ?? 0, color: "purple" },
                { icon: "TrendingUp", label: "Конверсия", value: stats?.total_users ? `${Math.round(((stats.active_subscriptions ?? 0) / stats.total_users) * 100)}%` : "0%", color: "yellow" },
              ].map((s) => (
                <div key={s.label} className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-${s.color}-500/20`}>
                    <Icon name={s.icon} fallback="Star" size={18} className={`text-${s.color}-400`} />
                  </div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-white/40 text-sm mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Plans distribution */}
            {stats?.plans && Object.keys(stats.plans).length > 0 && (
              <div className="mb-10 p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="font-semibold mb-5 flex items-center gap-2">
                  <Icon name="PieChart" size={18} className="text-blue-400" />
                  Распределение по тарифам
                </h3>
                <div className="flex gap-6 flex-wrap">
                  {Object.entries(stats.plans).map(([plan, count]) => (
                    <div key={plan} className="flex items-center gap-2">
                      <Badge className={planColors[plan] || "bg-white/10 text-white/60 border-white/20"}>
                        {plan}
                      </Badge>
                      <span className="text-white font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users table */}
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Icon name="Users" size={18} className="text-blue-400" />
                  Пользователи ({users.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-6 py-3 text-white/40 text-xs font-medium">Пользователь</th>
                      <th className="text-left px-6 py-3 text-white/40 text-xs font-medium">Тариф</th>
                      <th className="text-left px-6 py-3 text-white/40 text-xs font-medium">Токены</th>
                      <th className="text-left px-6 py-3 text-white/40 text-xs font-medium">Регистрация</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} className="w-8 h-8 rounded-full" alt="" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                                <Icon name="User" size={14} className="text-white/60" />
                              </div>
                            )}
                            <div>
                              <div className="text-white text-sm font-medium">{u.name}</div>
                              <div className="text-white/40 text-xs">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {u.plan ? (
                            <Badge className={planColors[u.plan] || "bg-white/10 text-white/60 border-white/20"}>
                              {u.plan}
                            </Badge>
                          ) : (
                            <span className="text-white/30 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-white/60 text-sm">
                          {u.plan ? `${(u.tokens_used || 0).toLocaleString()} / ${u.tokens_limit > 0 ? u.tokens_limit.toLocaleString() : "∞"}` : "—"}
                        </td>
                        <td className="px-6 py-4 text-white/40 text-sm">
                          {new Date(u.created_at).toLocaleDateString("ru-RU")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="text-center py-12 text-white/30">
                    <Icon name="Users" size={32} className="mx-auto mb-2 opacity-30" />
                    <p>Пользователей пока нет</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
