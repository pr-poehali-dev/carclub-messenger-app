"""
Запусти этот скрипт локально для генерации VAPID ключей:
pip install pywebpush
python generate_keys.py
"""
from py_vapid import Vapid

vapid = Vapid()
vapid.generate_keys()
print("VAPID_PUBLIC_KEY:", vapid.public_key_urlsafe)
print("VAPID_PRIVATE_KEY:", vapid.private_key_urlsafe)
