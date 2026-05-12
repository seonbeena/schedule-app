const CACHE_NAME = "dayplan-mobile-clean-v7";
const ASSETS = [
  "./index.html?v=mobile-clean-v7",
  "./style.css?v=mobile-clean-v7",
  "./app.js?v=mobile-clean-v7",
  "./manifest.json?v=mobile-clean-v7",
  "./icon-192.png?v=mobile-clean-v7",
  "./icon-512.png?v=mobile-clean-v7"
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
