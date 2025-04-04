const CACHE_NAME = 'theaibotler-v2'; // Updated cache version

// Assets to cache on install - reduced to most essential static assets
const PRECACHE_ASSETS = [
  '/',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Utility function to cache a single asset with error handling
const cacheAsset = async (cache, asset) => {
  try {
    await cache.add(asset);
    console.log(`Cached asset: ${asset}`);
    return true;
  } catch (error) {
    console.warn(`Failed to cache asset: ${asset}`, error);
    return false;
  }
};

// Install event - precache assets with individual error handling
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        // Try to cache each asset individually, allow some to fail
        const results = await Promise.all(
          PRECACHE_ASSETS.map(asset => cacheAsset(cache, asset))
        );
        console.log(`Cached ${results.filter(Boolean).length} of ${PRECACHE_ASSETS.length} assets`);
        return self.skipWaiting();
      })
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