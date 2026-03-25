ALTER TABLE t_p76085414_carclub_messenger_ap.messages
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url text DEFAULT NULL;