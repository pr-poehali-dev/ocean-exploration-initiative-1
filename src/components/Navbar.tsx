import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import Icon from "@/components/ui/icon"

interface Props {
  onOpenChat?: () => void
}

export default function Navbar({ onOpenChat }: Props) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === "/"

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { href: "/#features", label: "Возможности" },
    { href: "/#pricing", label: "Тарифы" },
    { href: "/#faq", label: "FAQ" },
  ]

  return (
    <>
      {/* Desktop */}
      <header
        className={`fixed top-4 z-[9999] mx-auto hidden w-full flex-row items-center justify-between self-start rounded-full backdrop-blur-md md:flex border transition-all duration-300 ${
          isScrolled ? "max-w-4xl px-2 border-white/20 shadow-lg" : "max-w-6xl px-4 border-transparent shadow-none"
        } py-2`}
        style={{
          background: isScrolled ? "rgba(6, 11, 24, 0.9)" : "transparent",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <a className="flex items-center gap-2 ml-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Icon name="Bot" size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg">BizBot</span>
        </a>

        <div className="absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-white/70 md:flex md:space-x-2">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="relative px-4 py-2 text-white/70 hover:text-white transition-colors cursor-pointer">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {onOpenChat && isHome && (
            <button
              onClick={onOpenChat}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              <Icon name="MessageCircle" size={16} />
              Чат
            </button>
          )}
          {user ? (
            <div className="flex items-center gap-2">
              <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-all">
                {user.avatar_url ? (
                  <img src={user.avatar_url} className="w-6 h-6 rounded-full" alt="" />
                ) : (
                  <Icon name="User" size={16} />
                )}
                <span>{user.name.split(" ")[0]}</span>
              </button>
              {user.is_admin && (
                <button onClick={() => navigate("/admin")} className="px-3 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs hover:bg-purple-500/30 transition-all">
                  Админ
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="rounded-lg font-medium px-4 py-2 text-sm border bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400/30 text-white hover:from-blue-500 hover:to-indigo-500 transition-all"
            >
              Войти
            </button>
          )}
        </div>
      </header>

      {/* Mobile */}
      <header
        className={`fixed top-4 z-[9999] mx-4 flex w-auto flex-row items-center justify-between rounded-full backdrop-blur-md md:hidden px-4 py-3 border transition-all duration-300 ${
          isScrolled ? "border-white/20 shadow-lg" : "border-transparent shadow-none"
        }`}
        style={{
          background: isScrolled ? "rgba(6, 11, 24, 0.9)" : "transparent",
          left: "1rem", right: "1rem", width: "calc(100% - 2rem)",
        }}
      >
        <a className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Icon name="Bot" size={18} className="text-white" />
          </div>
          <span className="text-white font-bold">BizBot</span>
        </a>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-white/20 transition-colors hover:bg-white/10"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={18} className="text-white" />
        </button>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm md:hidden">
          <div className="absolute top-24 left-4 right-4 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6" style={{ background: "rgba(6, 11, 24, 0.95)" }}>
            <nav className="flex flex-col space-y-2">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-lg font-medium text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10">
                  {l.label}
                </a>
              ))}
              <div className="border-t border-white/20 pt-4 mt-2 flex flex-col gap-2">
                {user ? (
                  <>
                    <button onClick={() => { navigate("/dashboard"); setIsMobileMenuOpen(false) }} className="px-4 py-3 text-left text-white rounded-lg bg-white/10 font-medium">
                      Личный кабинет
                    </button>
                    <button onClick={() => { logout(); setIsMobileMenuOpen(false) }} className="px-4 py-3 text-left text-white/60 rounded-lg hover:bg-white/10">
                      Выйти
                    </button>
                  </>
                ) : (
                  <button onClick={() => { navigate("/login"); setIsMobileMenuOpen(false) }} className="px-4 py-3 text-center font-bold text-white rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600">
                    Войти
                  </button>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
