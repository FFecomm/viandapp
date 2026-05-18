const CACHE_NAME = 'viandapp-v1'
const STATIC_CACHE = ['/', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_CACHE)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)

  // Stale-while-revalidate para assets estáticos de Next.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request)
        const network = fetch(event.request).then((resp) => {
          if (resp.ok) cache.put(event.request, resp.clone())
          return resp
        }).catch(() => cached)
        return cached || network
      }),
    )
    return
  }

  // Network-first con fallback a caché para todo lo demás.
  // (Los datos de Supabase no se cachean porque pasan por dominio externo).
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)),
  )
})
