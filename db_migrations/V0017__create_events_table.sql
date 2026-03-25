CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date_text TEXT NOT NULL,
  location TEXT NOT NULL,
  members INTEGER DEFAULT 0,
  tag TEXT NOT NULL DEFAULT 'Событие',
  tag_color TEXT NOT NULL DEFAULT '#00ffb3',
  emoji TEXT NOT NULL DEFAULT '📅',
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO events (title, date_text, location, members, tag, tag_color, emoji) VALUES
('Ночной трек-день', '30 марта, 20:00', 'Moscow Raceway', 24, 'Гонки', '#00ffb3', '🏁'),
('Встреча клуба', '5 апреля, 10:00', 'Лужники, парковка А', 47, 'Встреча', '#00d4ff', '🤝'),
('Дрифт-шоу 2026', '12 апреля, 14:00', 'Крокус Экспо', 112, 'Шоу', '#bf00ff', '🔥'),
('Сезонное ТО', '20 апреля, 9:00', 'СТО «Мотор»', 18, 'Сервис', '#ff6b00', '🔧'),
('Фотосессия суперкаров', '27 апреля, 11:00', 'Воробьёвы горы', 31, 'Фото', '#00ffb3', '📸');
