// Service worker: mở app tức thì (kể cả mất mạng).
// - /assets/* (file có hash): cache-first, không bao giờ đổi.
// - HTML, icon, manifest: stale-while-revalidate (hiện bản cache ngay, tải bản mới ngầm).
// - /api/*: không đụng vào, luôn đi mạng.
const CACHE = 'lich-tap-v2';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.open(CACHE).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  const isPage = req.mode === 'navigate';
  const key = isPage ? '/' : req;
  const network = fetch(req).then(async (res) => {
    if (res.ok) (await caches.open(CACHE)).put(key, res.clone());
    return res;
  });
  e.waitUntil(network.catch(() => {}));
  e.respondWith(
    caches.open(CACHE).then(async (c) => (await c.match(key)) || network),
  );
});
