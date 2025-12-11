self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("atomsync-static-v1").then((cache) =>
      cache.addAll(["/", "/manifest.json"])
    )
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((resp) => {
          if (!resp || resp.status !== 200 || resp.type !== "basic") return resp;
          const copy = resp.clone();
          caches.open("atomsync-static-v1").then((cache) => cache.put(event.request, copy));
          return resp;
        })
    )
  );
});

