CREATE TABLE IF NOT EXISTS t_p76085414_carclub_messenger_ap.sessions (
    session_id text PRIMARY KEY,
    user_id integer NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);