ALTER TABLE t_p76085414_carclub_messenger_ap.users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

UPDATE t_p76085414_carclub_messenger_ap.users SET is_admin = true WHERE LOWER(nickname) = 'александр';

CREATE TABLE IF NOT EXISTS t_p76085414_carclub_messenger_ap.club_rules (
    id serial PRIMARY KEY,
    content text NOT NULL DEFAULT '',
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_by integer
);

INSERT INTO t_p76085414_carclub_messenger_ap.club_rules (content)
VALUES ('1. Уважать других участников клуба.
2. Соблюдать правила дорожного движения на выездах.
3. Участвовать в жизни клуба — посещать встречи и события.
4. Не разглашать личные данные других участников.
5. Споры решать мирно через администраторов.')
ON CONFLICT DO NOTHING;