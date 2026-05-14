const CACHE_NAME = "dayplan-time-v1";
const ASSETS = [
  "./index.html?v=time-v1",
  "./style.css?v=time-v1",
  "./app.js?v=time-v1",
  "./manifest.json?v=time-v1",
  "./icon-192.png?v=time-v1",
  "./icon-512.png?v=time-v1"
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
