const CACHE_NAME = "dayplan-final-design-release-fixed-fixed";
const ASSETS = [
  "./index.html?v=final-design-release-fixed",
  "./style.css?v=final-design-release-fixed",
  "./app.js?v=final-design-release-fixed",
  "./manifest.json?v=final-design-release-fixed",
  "./icon-192.png?v=final-design-release-fixed",
  "./icon-512.png?v=final-design-release-fixed"
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
