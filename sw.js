/* TextDiff Pro service worker: cache-first for local assets, network-first for CDN libs */
const CACHE = "textdiff-v4";
const CORE = ["./", "./index.html", "./styles.css", "./app.js", "./counter.js", "./favicon.svg", "./manifest.json", "./og-image.svg"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    /* HTML must always come from the network, otherwise an updated page
       (e.g. with the AdSense snippet) is never delivered to returning users. */
    if (e.request.mode === "navigate" || (e.request.destination === "document")) {
      e.respondWith(fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request).then((hit) => hit || caches.match("./index.html"))));
      return;
    }
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    })));
  }
});
