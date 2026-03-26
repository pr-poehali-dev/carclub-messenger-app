ALTER TABLE t_p76085414_carclub_messenger_ap.messages
  ADD COLUMN reply_to_id integer NULL,
  ADD COLUMN reply_to_text text NULL,
  ADD COLUMN reply_to_sender text NULL;