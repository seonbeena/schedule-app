const CACHE_NAME = "dayplan-backup-clean-v1";
const ASSETS = [
  "./index.html?v=backup-clean-v1",
  "./style.css?v=backup-clean-v1",
  "./app.js?v=backup-clean-v1",
  "./manifest.json?v=backup-clean-v1",
  "./icon-192.png?v=backup-clean-v1",
  "./icon-512.png?v=backup-clean-v1"
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
