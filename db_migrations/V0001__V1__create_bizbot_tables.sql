
CREATE TABLE IF NOT EXISTS bizbot_users (
  id SERIAL PRIMARY KEY,
  yandex_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bizbot_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES bizbot_users(id),
  plan VARCHAR(50) NOT NULL DEFAULT 'starter',
  tokens_limit INTEGER NOT NULL DEFAULT 20000,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS bizbot_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES bizbot_users(id),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  guest_questions_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bizbot_messages (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES bizbot_sessions(id),
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bizbot_widget_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES bizbot_users(id) UNIQUE,
  widget_name VARCHAR(255) DEFAULT 'BizBot',
  widget_color VARCHAR(50) DEFAULT '#2563eb',
  widget_greeting TEXT DEFAULT 'Привет! Я BizBot — ваш умный помощник. Чем могу помочь?',
  widget_placeholder VARCHAR(255) DEFAULT 'Напишите ваш вопрос...',
  updated_at TIMESTAMP DEFAULT NOW()
);
