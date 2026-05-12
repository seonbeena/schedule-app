const CACHE_NAME = "dayplan-final-now-release";
const ASSETS = [
  "./index.html?v=final-now-release",
  "./style.css?v=final-now-release",
  "./app.js?v=final-now-release",
  "./manifest.json?v=final-now-release",
  "./icon-192.png?v=final-now-release",
  "./icon-512.png?v=final-now-release"
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
