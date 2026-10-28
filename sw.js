// Service worker: lets the game load with no internet after one visit.
//
// How it works:
//   - On install, it saves ("precaches") every file the game needs.
//   - After that, each request is answered from the saved copy right away,
//     and in the background the newest version is fetched and saved for next
//     time ("stale-while-revalidate"). So the game always starts instantly,
//     even offline, and picks up updates on the following visit.
//   - New files that aren't in the list (like a student's new enemy PNG) are
//     saved the first time they load.
//
// If you add a new file the game needs from the very first load, add it to
// PRECACHE below and bump CACHE_VERSION.
//
// All paths are relative to this file, so it works in any website subfolder.

const CACHE_VERSION = 'panther-slash-v1';

const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'src/styles.css',
  'src/main.js',
  'src/config.js',
  'src/reactions.js',
  'src/audio/sound.js',
  'src/core/game.js',
  'src/core/geometry.js',
  'src/core/leaderboard.js',
  'src/core/prizes.js',
  'src/engine/loop.js',
  'src/engine/viewport.js',
  'src/input/pointer.js',
  'src/render/art.js',
  'src/render/background.js',
  'src/render/draw.js',
  'src/render/effects.js',
  'src/render/renderer.js',
  'src/render/sprites.js',
  'src/storage/scores.js',
  'src/storage/settings.js',
  'src/storage/store.js',
  'src/ui/board.js',
  'src/ui/fullscreen.js',
  'src/ui/hud.js',
  'src/ui/initials.js',
  'src/ui/kiosk.js',
  'src/ui/prize.js',
  'src/ui/screens.js',
  'src/ui/staff.js',
  'assets/fonts/creepster-latin.woff2',
  'assets/fonts/fredoka-latin-variable.woff2',
  'assets/icons/icon-180.png',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  // Delete caches from older versions.
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  // Only handle our own files. Never cache other websites.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      // "?debug" and other query strings still load the same page.
      const cached = await cache.match(request, { ignoreSearch: true });
      const fresh = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached ?? Response.error()); // offline: fall back to the saved copy
      if (cached) {
        // Answer now; let the update finish in the background.
        event.waitUntil(fresh.catch(() => {}));
        return cached;
      }
      return fresh;
    }),
  );
});
