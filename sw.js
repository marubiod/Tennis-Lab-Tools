/* Tennis Lab Tools: caché para uso sin conexión.
   - Páginas: primero la red (así la versión nueva aparece nada más abrir la app); sin conexión, la copia guardada.
   - Resto de archivos: se sirve lo guardado y se actualiza en segundo plano. */
const CACHE = "tennis-lab-tools-v2";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req.url, {cache: "no-cache"}).then(r => {
        if (r.redirected) return fetch(req);
        const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp));
        return r;
      }).catch(() => caches.match(req, {ignoreSearch: true}).then(h => h || caches.match("index.html")))
    );
    return;
  }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => {
    const net = fetch(req).then(r => {
      if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    }).catch(() => hit);
    return hit || net;
  }));
});
