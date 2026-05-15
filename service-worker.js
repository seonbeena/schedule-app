const CACHE_NAME = "dayplan-filter-label-v1";
const ASSETS = [
  "./index.html?v=filter-label-v1",
  "./style.css?v=filter-label-v1",
  "./app.js?v=filter-label-v1",
  "./manifest.json?v=filter-label-v1",
  "./icon-192.png?v=filter-label-v1",
  "./icon-512.png?v=filter-label-v1"
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
