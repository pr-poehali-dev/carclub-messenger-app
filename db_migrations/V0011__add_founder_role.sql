ALTER TABLE t_p76085414_carclub_messenger_ap.users
  ADD COLUMN IF NOT EXISTS is_founder boolean NOT NULL DEFAULT false;

UPDATE t_p76085414_carclub_messenger_ap.users
  SET is_founder = true, is_admin = true
  WHERE LOWER(nickname) = 'александр';