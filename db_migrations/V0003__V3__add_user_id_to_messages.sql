
ALTER TABLE t_p76085414_carclub_messenger_ap.messages
  ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES t_p76085414_carclub_messenger_ap.users(id);
