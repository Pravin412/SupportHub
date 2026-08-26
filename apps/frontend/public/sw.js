self.addEventListener("install", (event) => {
  event.waitUntil(caches.open("shell-v1").then((cache) => cache.addAll(["/"])));
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api")) return;
  event.respondWith(fetch(event.request).catch(() => caches.match("/")));
});
