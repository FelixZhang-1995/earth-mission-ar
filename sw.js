self.__PRECACHE_MANIFEST=["/_next/static/chunks/168-1b0964f115c67df7.js","/_next/static/chunks/476-339acc4af2b3804b.js","/_next/static/chunks/4bd1b696-215e5051988c3dde.js","/_next/static/chunks/602-0ef2c323df0fdff2.js","/_next/static/chunks/7-e6518955aae8cd21.js","/_next/static/chunks/794-d4ec4c159b8d3a7e.js","/_next/static/chunks/995-e1848a4732f28742.js","/_next/static/chunks/app/activate/page-b8a136f3c098d95d.js","/_next/static/chunks/app/layout-a142403985116fe4.js","/_next/static/chunks/app/map/page-ff17081291105d6d.js","/_next/static/chunks/app/mission/[missionId]/page-6958eaf4c928d50d.js","/_next/static/chunks/app/page-728453b5c55e12a8.js","/_next/static/chunks/app/profile/[sessionId]/page-2f1e2daa0a26a9e0.js","/_next/static/chunks/app/scan/page-9471f1db5656b9f1.js","/_next/static/chunks/app/spirits/page-54913b9ded014e9d.js","/_next/static/chunks/main-app-8ba8aced763bc972.js","/_next/static/chunks/polyfills-42372ed130431b0a.js","/_next/static/chunks/webpack-e0cb09578c716e57.js","/_next/static/css/d6368300b35c9808.css","/_next/static/media/22a5144ee8d83bca-s.p.woff2","/_next/static/media/7d4881bb7e1bf84d-s.p.woff2","/manifest.webmanifest"];
const CACHE_NAME = "earth-mission-ar-v19";
const GENERATED_PRECACHE_URLS = self.__PRECACHE_MANIFEST ?? [];
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const withBasePath = (path) => {
  if (!BASE_PATH) return path;
  if (path === "/") return `${BASE_PATH}/`;
  return `${BASE_PATH}${path}`;
};
const CORE_PRECACHE_URLS = [
  "/",
  "/activate",
  "/map",
  "/scan",
  "/spirits",
  "/profile/active",
  "/mission/Z1-SUN-01",
  "/mission/Z1-HAB-02",
  "/mission/Z1-IMPACT-05",
  "/brand/beijing-planetarium-logo.png",
  "/spirits/yaohe.webp",
  "/spirits/qihuan.webp",
  "/spirits/suixing.webp",
  "/spirits/maideng.webp",
  "/globe.svg",
].map(withBasePath);

const GENERATED_APP_SHELL_URLS = GENERATED_PRECACHE_URLS.filter(
  (url) =>
    (url.startsWith("/_next/static/") &&
      !url.endsWith("/_buildManifest.js") &&
      !url.endsWith("/_ssgManifest.js")) ||
    url === "/manifest.webmanifest",
).map(withBasePath);
const PRECACHE_URLS = [...new Set([...CORE_PRECACHE_URLS, ...GENERATED_APP_SHELL_URLS])];

async function cacheUrl(cache, url) {
  if (url.includes("/_next/static/")) {
    const existing = await caches.match(url);
    if (existing) {
      await cache.put(url, existing.clone());
      return;
    }
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Precache failed: ${response.status} ${url}`);
    await cache.put(url, response);
  } finally {
    clearTimeout(timeout);
  }
}

async function cacheInBatches(cache, urls, batchSize = 6) {
  for (let index = 0; index < urls.length; index += batchSize) {
    await Promise.allSettled(urls.slice(index, index + batchSize).map((url) => cacheUrl(cache, url)));
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cacheInBatches(cache, PRECACHE_URLS))
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
      const url = new URL(request.url);
      if (url.search) {
        await cache.put(`${url.origin}${url.pathname}`, response.clone());
      }
    }
    return response;
  } catch {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const alternatePath = pathname.endsWith("/") ? pathname.slice(0, -1) : `${pathname}/`;
    return (
      (await caches.match(request)) ||
      (await caches.match(`${url.origin}${alternatePath}`)) ||
      (await caches.match(withBasePath("/"))) ||
      Response.error()
    );
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
