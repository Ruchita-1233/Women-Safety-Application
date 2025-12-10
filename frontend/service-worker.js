self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("safety-app-cache").then((cache) => {
      return cache.addAll([
        "/frontend/index.html",
        "/frontend/login.html",
        "/frontend/style.css",
        "/frontend/styles.css",
        "/frontend/app.js",
        "/frontend/config.js",
        "/frontend/images/icon-192.jpg",
        "/frontend/images/icon-512.jpg"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});