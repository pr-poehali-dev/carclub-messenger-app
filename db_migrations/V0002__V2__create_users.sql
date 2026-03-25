
CREATE TABLE t_p76085414_carclub_messenger_ap.users (
  id SERIAL PRIMARY KEY,
  nickname TEXT NOT NULL UNIQUE,
  pin TEXT NOT NULL,
  car TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'Участник',
  level TEXT NOT NULL DEFAULT 'Новичок',
  level_color TEXT NOT NULL DEFAULT '#00ffb3',
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO t_p76085414_carclub_messenger_ap.users (nickname, pin, car, role, level, level_color, points) VALUES
  ('Александр', '1234', 'BMW M3 G80', 'Президент клуба', 'Легенда', '#ff6b00', 9850),
  ('Максим', '1111', 'Nissan GT-R R35', 'Капитан дрифт-команды', 'Эксперт', '#bf00ff', 7420),
  ('Анна', '2222', 'Porsche 911 GT3', 'Организатор событий', 'Профи', '#00d4ff', 5130),
  ('Дмитрий', '3333', 'Mercedes AMG GT', 'Механик', 'Профи', '#00d4ff', 4890),
  ('Кирилл', '4444', 'Toyota Supra A90', 'Участник', 'Новичок', '#00ffb3', 1240);
