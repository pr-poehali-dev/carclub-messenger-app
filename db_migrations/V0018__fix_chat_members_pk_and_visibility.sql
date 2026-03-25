-- Пересоздаём chat_members с правильным составным PK (chat_id + user_id)
ALTER TABLE t_p76085414_carclub_messenger_ap.chat_members DROP CONSTRAINT IF EXISTS chat_members_pkey;
ALTER TABLE t_p76085414_carclub_messenger_ap.chat_members ADD PRIMARY KEY (chat_id, user_id);

-- Старые моковые чаты 1-8 делаем публичными (is_private=false) чтобы все видели
UPDATE t_p76085414_carclub_messenger_ap.chats SET is_private = false WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8);

-- Чат 9 тоже делаем публичным (создан с ошибкой, пусть видят)
UPDATE t_p76085414_carclub_messenger_ap.chats SET is_private = false WHERE id = 9;
