const CACHE_NAME = 'puls-goroda-v1';
const STATIC_ASSETS = [
  '/',
  '/src/main.tsx',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const title = data.title || 'Пульс Города';
  const options = {
    body: data.body || '',
    icon: 'https://cdn.poehali.dev/projects/63e708a6-7a81-48b1-9e5a-267986d3465b/bucket/869e4556-4d7c-40f3-9bdb-b119c62778b8.jpg',
    badge: 'https://cdn.poehali.dev/projects/63e708a6-7a81-48b1-9e5a-267986d3465b/bucket/869e4556-4d7c-40f3-9bdb-b119c62778b8.jpg',
    vibrate: [200, 100, 200],
    tag: 'chat-message',
    renotify: true,
    data: { url: '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
