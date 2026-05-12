const CACHE_NAME = "dayplan-final-now-hide-time";
const ASSETS = [
  "./index.html?v=final-now-hide-time",
  "./style.css?v=final-now-hide-time",
  "./app.js?v=final-now-hide-time",
  "./manifest.json?v=final-now-hide-time",
  "./icon-192.png?v=final-now-hide-time",
  "./icon-512.png?v=final-now-hide-time"
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
