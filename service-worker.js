// Klima Uzaktan Kontrol - Service Worker
// Amac: uygulama "kabugunu" (HTML/CSS/JS/ikonlar) cihaza onbelleklemek, boylece
// uygulama internet olmadan da (splash ekrani gecip) acilabilsin. MQTT baglantisi
// zaten gercek zamanli internet gerektirdigi icin o kismi onbelleklemiyoruz -
// sadece "kabuk" (arayuzun kendisi) offline calissin diye.

const CACHE_NAME = "klima-kontrol-v1";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-96.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // MQTT.js CDN dosyasi ve MQTT WebSocket trafigi onbelleklenmez - her zaman
  // ağdan gelsin (guncel kalsin, ve zaten gercek zamanli veri).
  if (req.url.indexOf("unpkg.com") !== -1) return;

  // Kabuk dosyalari icin: once cache, yoksa aga git (cache-first).
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // Basariliysa cache'e de yaz (bir sonraki offline acilis icin)
        if (res && res.status === 200 && req.method === "GET") {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
