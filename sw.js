// Service Worker for LYPO - Aggressive Caching Strategy
const CACHE_VERSION = 'lypo-v1.4';
const CACHE_NAME = `lypo-cache-${CACHE_VERSION}`;

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/index.js',
  '/header.js',
  '/mobile-header.js',
  '/mobile-header.css',
  '/favicon.ico',
  '/favicon.png',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first, fallback to network (for static assets)
  cacheFirst: ['css', 'js', 'woff', 'woff2', 'ttf', 'eot', 'ico', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'],
  // Network first, fallback to cache (for HTML and API calls)
  networkFirst: ['html'],
  // Network only (for API calls that need fresh data)
  networkOnly: ['/api/'],
};

// Install event - precache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Network only for API calls
  if (url.pathname.startsWith('/api/')) {
    return event.respondWith(fetch(request));
  }

  // Determine strategy based on file extension
  const ext = url.pathname.split('.').pop().toLowerCase();
  
  if (CACHE_STRATEGIES.cacheFirst.includes(ext)) {
    // Cache first strategy (for static assets)
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) {
            // Return cached version and update in background
            fetch(request).then((fresh) => {
              // Only cache complete responses (not partial 206 responses)
              if (fresh.ok && fresh.status !== 206) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, fresh));
              }
            }).catch(() => {}); // Ignore network errors
            return cached;
          }
          // Not in cache, fetch from network
          return fetch(request).then((response) => {
            // Only cache complete responses (not partial 206 responses)
            if (response.ok && response.status !== 206) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          });
        })
    );
  } else {
    // Network first strategy (for HTML)
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache complete responses (not partial 206 responses)
          if (response.ok && response.status !== 206) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request);
        })
    );
  }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
});
