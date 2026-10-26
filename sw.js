/* Caches the whole app, maps included, so it opens with no connection.
   The cache name carries a hash of the page: publishing a new build makes a
   new cache, and the old one is dropped once the new worker takes over. */
const CACHE = "atlas-6f66e34e00";
const ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "fonts/fredoka-latin-ext.woff2",
  "fonts/fredoka-latin.woff2",
  "fonts/nunito-latin-ext.woff2",
  "fonts/nunito-latin.woff2",
  "data/cities.json",
  "data/countries.json",
  "data/provinces.json"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Cache first: the maps never change between builds, and this is what makes
   the app open instantly and work on a plane. */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && res.ok && res.type === "basic"){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match("index.html"));
    })
  );
});
