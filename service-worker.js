const CACHE_NAME = "dayplan-calendar-sync-v1";
const ASSETS = [
  "./index.html?v=calendar-sync-v1",
  "./style.css?v=calendar-sync-v1",
  "./app.js?v=calendar-sync-v1",
  "./manifest.json?v=calendar-sync-v1",
  "./icon-192.png?v=calendar-sync-v1",
  "./icon-512.png?v=calendar-sync-v1"
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
