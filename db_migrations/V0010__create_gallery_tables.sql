CREATE TABLE IF NOT EXISTS t_p76085414_carclub_messenger_ap.gallery_folders (
    id serial PRIMARY KEY,
    name text NOT NULL,
    cover_url text DEFAULT NULL,
    created_by integer,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t_p76085414_carclub_messenger_ap.gallery_items (
    id serial PRIMARY KEY,
    folder_id integer NOT NULL REFERENCES t_p76085414_carclub_messenger_ap.gallery_folders(id),
    url text NOT NULL,
    thumbnail_url text DEFAULT NULL,
    title text NOT NULL DEFAULT '',
    type text NOT NULL DEFAULT 'photo',
    likes integer NOT NULL DEFAULT 0,
    uploaded_by integer,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

INSERT INTO t_p76085414_carclub_messenger_ap.gallery_folders (name) VALUES
  ('Трек-день'),
  ('Дрифт-шоу'),
  ('Встречи клуба');