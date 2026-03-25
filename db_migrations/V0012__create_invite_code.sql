CREATE TABLE IF NOT EXISTS t_p76085414_carclub_messenger_ap.invite_code (
    id serial PRIMARY KEY,
    code text NOT NULL UNIQUE,
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_by integer
);

INSERT INTO t_p76085414_carclub_messenger_ap.invite_code (code) VALUES ('MOTOCLUB2026');