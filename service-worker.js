const CACHE_NAME = "dayplan-backup-v6";
const ASSETS = [
  "./index.html?v=backup-v6",
  "./style.css?v=backup-v6",
  "./app.js?v=backup-v6",
  "./manifest.json?v=backup-v6",
  "./icon-192.png?v=backup-v6",
  "./icon-512.png?v=backup-v6"
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
