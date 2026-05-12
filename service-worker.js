const CACHE_NAME = "dayplan-final-release";
const ASSETS = [
  "./index.html?v=final-release",
  "./style.css?v=final-release",
  "./app.js?v=final-release",
  "./manifest.json?v=final-release",
  "./icon-192.png?v=final-release",
  "./icon-512.png?v=final-release"
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
