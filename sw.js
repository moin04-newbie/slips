/* Offline shell for slipsall.vercel.app — bump CACHE_VERSION after deploy when assets change */
var CACHE_VERSION = 'slips-offline-v1';
var PRECACHE_URLS = [
  '/',
  '/index.html',
  '/copy-offline.js',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_VERSION) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') {
    return;
  }
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  /* HTML: network first when online (fresh deploys), cache when offline */
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          try {
            var copy = response.clone();
            caches.open(CACHE_VERSION).then(function (cache) {
              cache.put(event.request, copy);
            });
          } catch (e) {}
          return response;
        })
        .catch(function () {
          return caches.match(event.request).then(function (hit) {
            return hit || caches.match('/index.html') || caches.match('/');
          });
        })
    );
    return;
  }

  /* JS, manifest, icons: cache first, then network */
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) {
        return cached;
      }
      return fetch(event.request)
        .then(function (response) {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          var copy = response.clone();
          caches.open(CACHE_VERSION).then(function (cache) {
            cache.put(event.request, copy);
          });
          return response;
        });
    })
  );
});
