// Service worker: lets the game load with no internet after one visit.
//
// How it works:
//   - On install, it downloads and saves every file in PRECACHE, all as one
//     matching set ("version").
//   - After that, game files always come from that saved set, so the game
//     starts instantly and works offline, and you never get a mix of old and
//     new files (a mix can stop the game from loading at all).
//   - Updates arrive all at once: when CACHE_VERSION changes, the browser
//     installs the new set in the background, and the next visit uses it.
//   - Files not in the list (like a student's new enemy PNG) are saved the
//     first time they load.
//
// CACHE_VERSION is worked out from the files themselves. After changing any
// game file, run `node --test`; if the version is out of date, the test
// tells you the new value to paste in below.
//
// All paths are relative to this file, so it works in any website subfolder.

const CACHE_VERSION = 'panther-slash-b4a55f9c';

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
  'src/core/stats.js',
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
  // cache: 'reload' skips the browser's own HTTP cache, so the new version
  // really is new.
  const requests = PRECACHE.map((path) => new Request(path, { cache: 'reload' }));
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(requests))
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
      if (cached) return cached;
      // Not saved yet (e.g. a new student picture): fetch it and save it.
      try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      } catch {
        return Response.error();
      }
    }),
  );
});
