
UPDATE t_p76085414_carclub_messenger_ap.users
SET pin = md5(pin || 'placeholder')
WHERE 1=0;
