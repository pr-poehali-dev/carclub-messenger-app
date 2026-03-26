CREATE TABLE t_p76085414_carclub_messenger_ap.message_reactions (
  id serial PRIMARY KEY,
  message_id integer NOT NULL REFERENCES t_p76085414_carclub_messenger_ap.messages(id),
  emoji text NOT NULL,
  sender text NOT NULL DEFAULT 'me',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, emoji, sender)
);