const CACHE_NAME = "dayplan-backup-v2";
const ASSETS = [
  "./index.html?v=backup-v2",
  "./style.css?v=backup-v2",
  "./app.js?v=backup-v2",
  "./manifest.json?v=backup-v2",
  "./icon-192.png?v=backup-v2",
  "./icon-512.png?v=backup-v2"
];

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
