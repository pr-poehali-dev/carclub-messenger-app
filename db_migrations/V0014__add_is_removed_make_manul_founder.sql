ALTER TABLE t_p76085414_carclub_messenger_ap.users ADD COLUMN IF NOT EXISTS is_removed boolean NOT NULL DEFAULT false;

UPDATE t_p76085414_carclub_messenger_ap.users SET is_founder = true, is_admin = true, role = 'Основатель' WHERE LOWER(nickname) = 'манул';

UPDATE t_p76085414_carclub_messenger_ap.users SET is_founder = false, is_admin = false WHERE LOWER(nickname) = 'александр';