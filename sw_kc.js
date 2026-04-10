const CACHE_NAME = 'kc-premium-v2';

// Daftar file basic yang disimpan di memori HP
const urlsToCache = [
  './index_kc.html',
  './logo_kc.png'
];

// Install Service Worker
self.addEventListener('install', event => {
  self.skipWaiting(); // Langsung aktif tanpa nunggu
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache KC Premium dibuka');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate Service Worker (Otomatis bersihin cache versi lama)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Strategi: Network First, falling back to cache
self.addEventListener('fetch', event => {
  // Hanya proses request GET (biar database Firebase nggak error)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Kalau dapet response valid dari internet, simpan ke cache
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Kalau sinyal mati/jelek, panggil dari cache
        return caches.match(event.request);
      })
  );
});
