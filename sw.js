const CACHE_NAME = "earth-mission-ar-v5";
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const withBasePath = (path) => {
  if (!BASE_PATH) return path;
  if (path === "/") return `${BASE_PATH}/`;
  return `${BASE_PATH}${path}`;
};
const PRECACHE_URLS = [
  "/",
  "/activate",
  "/map",
  "/scan",
  "/spirits",
  "/admin",
  "/qr",
  "/profile/active",
  "/print/active",
  "/mission/Z1-SUN-01",
  "/mission/Z1-HAB-02",
  "/mission/Z1-LAYER-03",
  "/mission/Z1-AST-04",
  "/mission/Z1-IMPACT-05",
  "/mission/Z2-GRAV-06",
  "/mission/Z2-MOON-07",
  "/mission/Z2-RAD-08",
  "/mission/Z2-WINDOW-09",
  "/mission/Z2-BH-10",
  "/mission/Z3-ENGINE-11",
  "/mission/Z3-MOON-12",
  "/mission/Z3-PULSAR-13",
  "/mission/Z3-TELESCOPE-14",
  "/mission/Z4-EXO-15",
  "/mission/Z4-CIV-16",
  "/ar/targets/z1-sun-01.png",
  "/ar/targets/z1-sun-01.mind",
  "/ar/targets/z1-hab-02.png",
  "/ar/targets/z1-hab-02.mind",
  "/ar/targets/z1-impact-05.png",
  "/ar/targets/z1-impact-05.mind",
  "/ar/models/solar-diagnostic.glb",
  "/ar/models/habitable-zone.glb",
  "/ar/models/impact-countdown.glb",
  "/vendor/mindar/mindar-image.prod.js",
  "/vendor/mindar/controller-mGt1s8dJ.js",
  "/vendor/mindar/ui-fBadYuor.js",
  "/brand/beijing-planetarium-logo.png",
  "/spirits/yaohe.webp",
  "/spirits/qihuan.webp",
  "/spirits/suixing.webp",
  "/spirits/maideng.webp",
  "/globe.svg",
].map(withBasePath);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return /\.(?:js|css|png|jpg|jpeg|svg|webp|ico|mind|glb|wasm|woff2?)$/i.test(url.pathname);
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || (await caches.match(withBasePath("/"))) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (
    url.searchParams.has("_rsc") ||
    event.request.headers.has("rsc") ||
    event.request.headers.has("next-router-prefetch")
  ) return;

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  return;
});
