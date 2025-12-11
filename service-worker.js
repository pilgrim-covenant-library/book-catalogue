/**
 * PCC Library Catalogue - Service Worker
 * Enables offline functionality and caching
 */

const CACHE_NAME = 'pcc-library-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/css/catalogue-enhanced.css',
  '/assets/js/catalogue-enhanced.js',
  'https://code.jquery.com/jquery-3.7.0.min.js',
  'https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js',
  'https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css',
  'https://pilgrim-covenant.com/images/logo/svg/logo.svg'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((error) => {
        console.error('[ServiceWorker] Cache failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Only cache GET requests
          if (event.request.method === 'GET') {
            // Don't cache Open Library API requests (too large)
            if (!event.request.url.includes('openlibrary.org')) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
          }

          return response;
        }).catch(() => {
          // Network request failed, try to serve offline page
          return caches.match('/index.html');
        });
      })
  );
});
