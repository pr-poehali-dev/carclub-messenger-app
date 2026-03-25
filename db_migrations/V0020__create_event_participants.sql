CREATE TABLE IF NOT EXISTS t_p76085414_carclub_messenger_ap.event_participants (
    event_id INTEGER NOT NULL REFERENCES t_p76085414_carclub_messenger_ap.events(id),
    user_id  INTEGER NOT NULL REFERENCES t_p76085414_carclub_messenger_ap.users(id),
    joined_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (event_id, user_id)
);