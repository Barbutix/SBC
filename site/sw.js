const CACHE_NAME = 'sullias-bull-club-shell-v20';
const APP_SHELL = ['./', './index.html', './styles.css', './app.js', './products.js', './product-carousel.js', './product-refresh.js', './tournament-search.js', './tournament-carousel.js', './local-tournaments.json', './clubs.json', './manifest.webmanifest', './assets/sbc-app-192.png', './assets/sbc-app-512.png', './assets/sbc-logo.png', './assets/sbc-background.jpg', './sources.html'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const path = new URL(request.url).pathname;
  if (path.endsWith('/event-candidates.json') || path.endsWith('/equipment.json') || path.endsWith('/local-tournaments.json')) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, {cache:'no-store'});
        if (!response.ok) throw new Error('Data unavailable');
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        } catch { /* A full offline cache must not hide a fresh network response. */ }
        return response;
      } catch {
        return await caches.match(request) || new Response('{"error":"offline"}', {status:503, headers:{'Content-Type':'application/json'}});
      }
    })());
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(request, copy)); }
    return response;
  }).catch(() => caches.match('./index.html'))));
});
