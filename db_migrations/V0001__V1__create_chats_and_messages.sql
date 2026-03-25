
CREATE TABLE t_p76085414_carclub_messenger_ap.chats (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  is_group BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p76085414_carclub_messenger_ap.messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL REFERENCES t_p76085414_carclub_messenger_ap.chats(id),
  text TEXT NOT NULL,
  sender TEXT NOT NULL DEFAULT 'me',
  is_out BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO t_p76085414_carclub_messenger_ap.chats (name, avatar, is_group) VALUES
  ('🏎️ Общий чат клуба', '🏁', true),
  ('Максим Рублёв', 'М', false),
  ('🔥 Дрифт-команда', '🔥', true),
  ('Анна Соколова', 'А', false),
  ('⚡ Электрокары', '⚡', true);

INSERT INTO t_p76085414_carclub_messenger_ap.messages (chat_id, text, sender, is_out) VALUES
  (1, 'Всем привет! Едем в воскресенье на трек?', 'Максим', false),
  (1, 'Я точно буду! Уже подготовил резину 🏎️', 'me', true),
  (1, 'Едем в воскресенье!', 'Анна', false),
  (2, 'Привет! Когда встреча клуба?', 'Максим', false),
  (2, 'В субботу в 10:00 на парковке ТЦ', 'me', true),
  (3, 'Новые фото в галерее!', 'Дмитрий', false),
  (4, 'Спасибо за помощь 🙏', 'Анна', false),
  (5, 'Тест-драйв в пятницу, кто участвует?', 'Кирилл', false);
