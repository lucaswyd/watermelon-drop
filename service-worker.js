const CACHE_NAME = 'watermelon-cache-v1';

// List of files to cache for offline support
const CORE_ASSETS = [
  '/', // index.html
  '/index.html',
  '/icon.png',
  '/idle.gif',
  '/manifest.json',
  '/dmloader.js',
  '/watermelon_drop_wasm.js',
  '/watermelon_drop.wasm',
  '/scripts/gamepog.bundle.js',
  '/poki/poki-sdk.js',
  '/poki/poki-sdk-core.js',

  // Archive files (game content)
  '/archive/archive_files.json',
  '/archive/game.arcd0',
  '/archive/game.arci0',
  '/archive/game.dmanifest0',
  '/archive/game.projectc0',
  '/archive/game.public.der0',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CORE_ASSETS);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Always try the network first, fallback to cache if offline
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then(response => response || caches.match('/index.html'))
    )
  );
});
