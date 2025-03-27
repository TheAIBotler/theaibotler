const CACHE_NAME = 'theaibotler-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/about',
  '/tools',
  '/blog',
  '/site.webmanifest',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html',
];

// Install event - precache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network-first strategy with fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and browser extensions
  if (
    event.request.method !== 'GET' ||
    event.request.url.startsWith('chrome-extension') ||
    event.request.url.includes('extension') ||
    // Skip URLs with no file extension (likely API calls)
    !event.request.url.includes('.')
  ) {
    return;
  }
  
  event.respondWith(
    // Try the network first
    fetch(event.request)
      .then((response) => {
        // Clone the response to put in cache
        const responseClone = response.clone();
        
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseClone);
          });
          
        return response;
      })
      .catch(() => {
        // If network fails, try the cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If not in cache either, return a fallback for HTML pages
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            
            // Otherwise just return a basic error
            return new Response('Network error', { status: 408, headers: { 'Content-Type': 'text/plain' } });
          });
      })
  );
});