// Red primero: la app siempre busca la versión más nueva y usa la copia guardada solo sin conexión.
const CACHE = 'plan-felipe';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(r.url, {cache: 'no-store'})
      .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r.url.split('?')[0], copy)); } return res; })
      .catch(() => caches.match(r.url.split('?')[0]))
  );
});
