const CACHE_NAME = 'ude-plus-v2';
const RUNTIME_CACHE = 'ude-plus-runtime-v2';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first strategy for API, cache-first for assets
// Fetch event - network-first strategy for API and scripts, cache-first for other assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API calls - network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || new Response('Offline - please try again when connected', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
        })
    );
    return;
  }

  // For JS/CSS (and other script/style resources) prefer network-first to avoid serving HTML cached under those URLs
  const isScript = request.destination === 'script' || url.pathname.endsWith('.js');
  const isStyle = request.destination === 'style' || url.pathname.endsWith('.css');

  if (isScript || isStyle) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If response is OK, update runtime cache and return it
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseToCache));
          }
          return response;
        })
        .catch(() => {
          // On network failure, fall back to cache but ensure content-type matches expected
          return caches.match(request).then((cached) => {
            if (!cached) return new Response('', { status: 504, statusText: 'Gateway Timeout' });
            const contentType = cached.headers.get('Content-Type') || '';
            if (isScript && contentType.includes('javascript')) return cached;
            if (isStyle && contentType.includes('css')) return cached;
            // If cached asset doesn't match expected content-type, fail so browser will handle
            return new Response('', { status: 504, statusText: 'Gateway Timeout' });
          });
        })
    );
    return;
  }

  // Static assets - cache first for everything else
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      }).catch(() => {
        // As a last resort, return cached index.html for navigations
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});
