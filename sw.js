// Offline support. HTML is network-first (so deploys show up immediately); audio and icons are cache-first.
const CACHE = 'announcer-v1';
const range = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1));
const clips = [
  ...range(60, (i) => `audio/n${i}.mp3`), 'audio/timeup.mp3',
  ...['m', 's', 'mm', 'om', 'os'].flatMap((k) => range(59, (i) => `audio/${k}${i}.mp3`)),
  ...['h', 'oh'].flatMap((k) => range(24, (i) => `audio/${k}${i}.mp3`)),
];
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon.svg', 'icons/apple-touch-icon.png',
               'icons/icon-192.png', 'icons/icon-512.png', ...clips];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put('index.html', copy));
      return res;
    }).catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
