import GradientBlinds from "@/components/GradientBlinds"
import Navbar from "@/components/Navbar"
import ChatWidget from "@/components/ChatWidget"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Icon from "@/components/ui/icon"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"

const PLANS = [
  {
    id: "starter",
    name: "Старт",
    price: "4 999",
    tokens: "20 000",
    features: [
      "20 000 токенов в месяц",
      "Чат-бот на сайт или в Telegram",
      "История диалогов",
      "Базовая настройка виджета",
      "Email поддержка",
    ],
    cta: "Начать",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Про",
    price: "9 999",
    tokens: "50 000",
    features: [
      "50 000 токенов в месяц",
      "Приоритетный AI (GPT-4)",
      "Расширенная настройка виджета",
      "Аналитика диалогов",
      "Защита от спама",
      "Поддержка 24/7",
    ],
    cta: "Выбрать Про",
    highlighted: true,
    badge: "Популярный",
  },
  {
    id: "unlimited",
    name: "Безлимит",
    price: "24 999",
    tokens: "∞",
    features: [
      "Безлимитные токены",
      "GPT-4 Turbo без ограничений",
      "Белый лейбл (свой бренд)",
      "API доступ",
      "Анти-спам система",
      "Мультиязычность",
      "Персональный менеджер",
      "SLA 99.9%",
    ],
    cta: "Максимум",
    highlighted: false,
    badge: "Best Value",
  },
]

const FEATURES = [
  {
    icon: "Lock",
    title: "Ваши данные только у вас",
    desc: "Мы не используем n8n или сторонние автоматизации. Собственная разработка — никакой утечки данных ваших клиентов.",
  },
  {
    icon: "Bot",
    title: "Реальный AI, не заглушка",
    desc: "GPT-4 под капотом. Бот понимает контекст, отвечает развёрнуто и помнит историю диалога.",
  },
  {
    icon: "Zap",
    title: "Подключение за 5 минут",
    desc: "Регистрируйтесь, настраивайте виджет и вставляйте одну строку кода — готово.",
  },
  {
    icon: "BarChart2",
    title: "Аналитика в реальном времени",
    desc: "Видите сколько токенов использовано, когда истекает подписка и всю историю диалогов.",
  },
  {
    icon: "Shield",
    title: "Защита от спама",
    desc: "Умная антиспам-система отсеивает ботов и не даёт злоупотреблять вашим чатом.",
  },
  {
    icon: "Palette",
    title: "Настройка под ваш бренд",
    desc: "Цвет, имя бота, приветствие — всё под ваш стиль. Клиент не догадается, что это BizBot.",
  },
]

const EXAMPLES = [
  {
    business: "Интернет-магазин",
    question: "Какой у вас срок доставки в Москву?",
    answer: "Доставляем по Москве за 1-2 дня курьером или 3-5 дней в пункт выдачи. Бесплатно от 3 000 ₽.",
  },
  {
    business: "Юридическая компания",
    question: "Сколько стоит консультация?",
    answer: "Первичная консультация — бесплатно, 30 минут. Составление договора — от 5 000 ₽. Уточните задачу?",
  },
  {
    business: "Фитнес-клуб",
    question: "Есть ли у вас пробное занятие?",
    answer: "Да! Первое занятие — бесплатно для новых клиентов. Запишитесь прямо сейчас через форму ниже.",
  },
]

const FAQ = [
  {
    q: "Почему BizBot лучше n8n или других конструкторов?",
    a: "n8n и подобные сервисы хранят ваши данные на своих серверах и могут передавать их третьим лицам. BizBot — собственная разработка: все данные хранятся изолированно, никаких сторонних автоматизаций.",
  },
  {
    q: "Что такое токены и как они считаются?",
    a: "Токен — это примерно 4 символа текста. Вопрос и ответ вместе тратят токены. На тарифе Старт — 20 000 токенов в месяц, это ~200-300 полноценных диалогов.",
  },
  {
    q: "Могу ли я поменять тариф в середине месяца?",
    a: "Да, можно повысить тариф в любой момент. При повышении тариф активируется сразу, счётчик токенов обнуляется.",
  },
  {
    q: "Как подключить бота на мой сайт?",
    a: "После регистрации и выбора тарифа в личном кабинете есть виджет-код — одна строка JavaScript. Вставьте её перед </body> вашего сайта.",
  },
  {
    q: "Есть ли бесплатный пробный период?",
    a: "Да! Можно задать 3 вопроса нашему боту прямо на сайте без регистрации. После — выбираете тариф.",
  },
  {
    q: "Что если токены закончатся раньше конца месяца?",
    a: "Бот вежливо уведомит, что лимит исчерпан, и предложит обновить тариф. Переплата за превышение не начисляется.",
  },
]

export default function Index() {
  const [chatOpen, setChatOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#060b18]">
      <Navbar onOpenChat={() => setChatOpen(true)} />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <GradientBlinds
            gradientColors={["#060b18", "#0f2460", "#1a4bcc", "#0a1f5c"]}
            angle={15}
            noise={0.22}
            blindCount={13}
            blindMinWidth={50}
            spotlightRadius={0.38}
            spotlightSoftness={1.6}
            spotlightOpacity={0.42}
            mouseDampening={0.15}
            distortAmount={0}
            shineDirection="left"
            mixBlendMode="overlay"
          />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-8 text-center px-5 max-w-5xl mx-auto pt-24">
          <Badge className="bg-white/10 text-white/90 border-white/20 backdrop-blur px-4 py-1.5 text-sm">
            🤖 AI-чатбот для вашего бизнеса
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight text-white text-balance drop-shadow-2xl">
            Умный бот,<br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">ваши данные</span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl text-pretty drop-shadow-lg leading-relaxed">
            BizBot — собственная разработка без n8n и сторонних сервисов. Данные ваших клиентов только у вас. Подключается за 5 минут.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <button
              onClick={() => setChatOpen(true)}
              className="inline-flex items-center gap-2 justify-center rounded-full bg-white px-8 py-4 text-lg font-semibold text-black transition-all hover:bg-white/90 shadow-2xl"
            >
              <Icon name="MessageCircle" size={20} />
              Попробовать бесплатно
            </button>
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 justify-center rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur transition-all hover:bg-white/20 hover:border-white/50 shadow-xl"
            >
              Войти
              <Icon name="ArrowRight" size={20} />
            </button>
          </div>
          <div className="flex items-center gap-6 mt-4 text-white/50 text-sm">
            <span className="flex items-center gap-1.5"><Icon name="CheckCircle" size={14} />3 вопроса бесплатно</span>
            <span className="flex items-center gap-1.5"><Icon name="CheckCircle" size={14} />Без карты</span>
            <span className="flex items-center gap-1.5"><Icon name="CheckCircle" size={14} />Вход через Яндекс</span>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <Icon name="ChevronDown" size={28} className="text-white/30" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-5 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20">Преимущества</Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Почему выбирают BizBot</h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">Мы не перепродаём чужие решения — BizBot написан с нуля нашей командой</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.icon} className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-colors">
                <Icon name={f.icon} fallback="Star" size={22} className="text-blue-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Examples */}
      <section className="py-16 px-5 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-500/10 text-green-400 border-green-500/20">Примеры</Badge>
          <h2 className="text-4xl font-bold text-white mb-4">Как BizBot помогает бизнесу</h2>
          <p className="text-white/60 text-lg">Реальные диалоги, которые бот ведёт вместо вас 24/7</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {EXAMPLES.map((ex) => (
            <div key={ex.business} className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="mb-4">
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">{ex.business}</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon name="User" size={14} className="text-white/70" />
                  </div>
                  <div className="bg-white/10 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm text-white/80">
                    {ex.question}
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <div className="bg-blue-600/70 rounded-2xl rounded-tr-none px-4 py-2.5 text-sm text-white max-w-[85%]">
                    {ex.answer}
                  </div>
                  <div className="w-7 h-7 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon name="Bot" size={14} className="text-blue-400" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-5 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">Тарифы</Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Выберите свой план</h2>
          <p className="text-white/60 text-lg">Все цены в рублях, оплата ежемесячно. Без скрытых платежей.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-8 rounded-2xl border transition-all duration-300 flex flex-col ${
                plan.highlighted
                  ? "bg-gradient-to-b from-blue-600/30 to-blue-900/20 border-blue-500/50 shadow-2xl shadow-blue-500/20 scale-[1.02]"
                  : "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className={plan.highlighted ? "bg-blue-500 text-white border-blue-400" : "bg-purple-500/80 text-white border-purple-400"}>
                    {plan.badge}
                  </Badge>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-white font-bold text-xl mb-1">{plan.name}</h3>
                <div className="flex items-end gap-1 mt-3">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/50 mb-1.5">₽/мес</span>
                </div>
                <p className="text-blue-400 text-sm mt-1">{plan.tokens} токенов</p>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-white/70 text-sm">
                    <Icon name="Check" size={16} className="text-green-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/login")}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
                  plan.highlighted
                    ? "bg-blue-500 text-white hover:bg-blue-400 shadow-lg shadow-blue-500/30"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "5 мин", label: "Подключение" },
            { value: "99.9%", label: "Uptime" },
            { value: "GPT-4", label: "Модель AI" },
            { value: "24/7", label: "Работа бота" },
          ].map((s) => (
            <div key={s.label} className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-white/50 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-5 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-white/10 text-white/70 border-white/20">FAQ</Badge>
          <h2 className="text-4xl font-bold text-white mb-4">Частые вопросы</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {FAQ.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="bg-white/5 border border-white/10 rounded-xl px-6 data-[state=open]:bg-white/8">
              <AccordionTrigger className="text-white hover:no-underline text-left py-5">{item.q}</AccordionTrigger>
              <AccordionContent className="text-white/60 pb-5 leading-relaxed">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA Bottom */}
      <section className="py-24 px-5">
        <div className="max-w-3xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-b from-blue-600/20 to-blue-900/10 border border-blue-500/20">
          <h2 className="text-4xl font-bold text-white mb-4">Готов запустить своего бота?</h2>
          <p className="text-white/60 text-lg mb-8">Попробуйте 3 вопроса бесплатно — без регистрации</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setChatOpen(true)}
              className="inline-flex items-center gap-2 justify-center rounded-full bg-blue-500 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-blue-400 shadow-xl shadow-blue-500/30"
            >
              <Icon name="MessageCircle" size={20} />
              Попробовать сейчас
            </button>
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 justify-center rounded-full border border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur transition-all hover:bg-white/20"
            >
              Зарегистрироваться
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-5 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Icon name="Bot" size={18} className="text-white" />
            </div>
            <span className="text-white font-semibold">BizBot</span>
          </div>
          <p className="text-white/40 text-sm">© 2025 BizBot. Все права защищены.</p>
          <div className="flex gap-6 text-white/40 text-sm">
            <a href="#" className="hover:text-white/70 transition-colors">Политика конфиденциальности</a>
            <a href="#" className="hover:text-white/70 transition-colors">Условия использования</a>
          </div>
        </div>
      </footer>

      <ChatWidget isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </main>
  )
}