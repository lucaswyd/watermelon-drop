/*  Watermelon Drop – offline cache service‑worker
    Cache‑first for immutable assets, network‑first for everything else   */

const CACHE_VERSION = 'wm-drop-v1';
const CORE_ASSETS = [
  '/',                 // the automatically generated /index.html route
  '/index.html',
  '/dmloader.js',
  '/scripts/gamepog.bundle.js',
  '/watermelon_drop.wasm',
  '/icon.png',
  '/idle.gif'
  //  add more assets (e.g., extra images, CSS) here if they’re small & rarely change
];

// ‑‑ install: pre‑cache “core” files                                              
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// ‑‑ activate: clean out old caches                                              
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k !== CACHE_VERSION)
        .map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// ‑‑ fetch:                                                                         ‑‑
// •  Try cache first for core/immutable files.                                     
// •  For everything else:  try network, fall back to cache if offline.             
self.addEventListener('fetch', event => {
  const { request } = event;
  const url      = new URL(request.url);
  const isCore   = CORE_ASSETS.includes(url.pathname);

  if (request.method !== 'GET') return;   // skip POST/PUT/etc.

  event.respondWith(
    (async () => {
      if (isCore) {
        const cached = await caches.match(request);
        return cached ?? fetch(request);
      }

      // network‑first for dynamic or large files (e.g., archives)
      try {
        const fresh = await fetch(request);
        // Optionally cache fetched responses here, but skip huge archives to save space
        return fresh;
      } catch (err) {
        return caches.match(request) ?? Response.error();
      }
    })()
  );
});
