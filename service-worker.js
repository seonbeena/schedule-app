const CACHE_NAME = "dayplan-calendar-sync-final";
const ASSETS = [
  "./index.html?v=calendar-sync-final",
  "./style.css?v=calendar-sync-final",
  "./app.js?v=calendar-sync-final",
  "./manifest.json?v=calendar-sync-final",
  "./icon-192.png?v=calendar-sync-final",
  "./icon-512.png?v=calendar-sync-final"
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
