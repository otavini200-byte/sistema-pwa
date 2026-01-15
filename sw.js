// ✅ Troque o número quando atualizar o site para forçar refresh do cache
const CACHE = "sistema-pwa-v1";

const ASSETS = [
  "/sistema-pwa/",
  "/sistema-pwa/index.html",
  "/sistema-pwa/manifest.json",
  "/sistema-pwa/icons/icon-192.png",
  "/sistema-pwa/icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// ✅ MUITO IMPORTANTE: NÃO cachear script.google.com (senão quebra login)
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // não interfere na API do Apps Script
  if (url.hostname.includes("script.google.com")) return;

  // navegação: sempre tenta rede e cai pro cache
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("/sistema-pwa/index.html"))
    );
    return;
  }

  // assets: cache-first
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return resp;
      });
    })
  );
});
