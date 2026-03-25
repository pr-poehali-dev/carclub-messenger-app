ALTER TABLE t_p76085414_carclub_messenger_ap.chats
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS t_p76085414_carclub_messenger_ap.chat_members (
    chat_id integer NOT NULL,
    user_id integer NOT NULL,
    PRIMARY KEY (chat_id, user_id)
);