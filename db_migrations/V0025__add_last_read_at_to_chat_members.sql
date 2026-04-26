ALTER TABLE t_p76085414_carclub_messenger_ap.chat_members
ADD COLUMN IF NOT EXISTS last_read_at timestamptz NOT NULL DEFAULT now();