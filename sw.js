// Moonbun Money service worker: makes the app installable and open offline.
// Bump VERSION whenever you change files so phones pick up the new version.
const VERSION = 'moonbun-v21';
const SHELL = ['./', 'index.html', 'css/styles.css', 'js/app.js', 'js/store.js', 'js/mascots.js', 'js/yutu.js', 'js/icons.js', 'js/play.js', 'js/plan.js', 'js/firebase-config.js',
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'img/bao.webp'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Network first for our own files (so updates show up), cache as offline fallback.
// Firebase / Google requests are left alone.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
