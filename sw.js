const CACHE_NAME = 'rotina-cache-v9';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icons/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// A página (index.html) vem sempre da internet primeiro, para pegar a versão nova.
// Sem internet, usa a cópia guardada. Os outros arquivos continuam vindo da cópia.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const ehPagina = req.mode === 'navigate' || req.url.endsWith('/index.html') || req.url.endsWith('/');
  if (ehPagina) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(resp => {
          const copia = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put('./index.html', copia));
          return resp;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clientsArr => {
      if (clientsArr.length > 0) {
        return clientsArr[0].focus();
      }
      return self.clients.openWindow('./index.html');
    })
  );
});
