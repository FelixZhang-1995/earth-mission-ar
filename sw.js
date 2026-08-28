self.__PRECACHE_MANIFEST=["/_next/static/chunks/168-5154214a45d0a454.js","/_next/static/chunks/204-283a36c29a610e1b.js","/_next/static/chunks/341-4891c659ef0a96d1.js","/_next/static/chunks/496-ab8f657ca9cd431a.js","/_next/static/chunks/4bd1b696-215e5051988c3dde.js","/_next/static/chunks/537-f78be96a5e69ff07.js","/_next/static/chunks/582-aff5b303cfe05c00.js","/_next/static/chunks/602-0ef2c323df0fdff2.js","/_next/static/chunks/654-9a11a809ba20cae1.js","/_next/static/chunks/794-d4ec4c159b8d3a7e.js","/_next/static/chunks/908-d636ea4e7eb2c642.js","/_next/static/chunks/app/activate/page-9925409b6fbcb320.js","/_next/static/chunks/app/layout-f37796a49fb0974b.js","/_next/static/chunks/app/map/page-7e623dc00fc8028d.js","/_next/static/chunks/app/mission/[missionId]/page-ee39603bde1b424c.js","/_next/static/chunks/app/page-d62f29dd9363f973.js","/_next/static/chunks/app/profile/[sessionId]/page-2037109730175ac8.js","/_next/static/chunks/app/scan/page-7fb5aa46d5a01c9b.js","/_next/static/chunks/app/spirits/page-25e4c298ffd0485c.js","/_next/static/chunks/b536a0f1-c5b57b7e6ff4dac8.js","/_next/static/chunks/bd904a5c-ad7f95bc21f7a5e3.js","/_next/static/chunks/main-app-8ba8aced763bc972.js","/_next/static/chunks/polyfills-42372ed130431b0a.js","/_next/static/chunks/webpack-4c9da91af4b06e02.js","/_next/static/css/1c5ce971b5679d7d.css","/_next/static/media/22a5144ee8d83bca-s.p.woff2","/_next/static/media/7d4881bb7e1bf84d-s.p.woff2","/manifest.webmanifest"];
const CACHE_PREFIX = "earth-mission-ar-v";
const CACHE_VERSION = 58;
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const RETAINED_CACHE_GENERATIONS = 3;
const FORCE_REFRESH_ASSET_SUFFIXES = [
  "/_next/static/chunks/168-7c5d41a1b76b8549.js",
  "/_next/static/chunks/306-05f02d5926ec0625.js",
  "/_next/static/chunks/523-102f9b7106367f3a.js",
  "/_next/static/chunks/526-14c619b80ebadf7e.js",
  "/_next/static/chunks/608-e153e83f94bdaa62.js",
  "/_next/static/chunks/app/scan/page-e040017232464ea2.js",
  "/_next/static/chunks/app/spirits/page-246ea3d527760871.js",
  "/_next/static/css/a8e9e1919256c45d.css",
];
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const withBasePath = (path) => {
  if (!BASE_PATH) return path;
  if (path === "/") return `${BASE_PATH}/`;
  return `${BASE_PATH}${path}`;
};
const CORE_PRECACHE_URLS = [
  "/",
  "/map",
  "/profile/active",
  "/mission/Z1-SUN-01",
  "/brand/beijing-planetarium-logo.png",
  "/spirits/yaohe.webp",
  "/manifest.webmanifest",
  "/globe.svg",
].map(withBasePath);

const PRECACHE_URLS = [...new Set(CORE_PRECACHE_URLS)];

function shouldForceRefresh(url) {
  const pathname = new URL(url, self.location.origin).pathname;
  return FORCE_REFRESH_ASSET_SUFFIXES.some((suffix) => pathname.endsWith(suffix));
}

async function cacheUrl(cache, url) {
  const forceRefresh = shouldForceRefresh(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const pathname = new URL(url, self.location.origin).pathname;
    const isDocumentShell = !/\.[a-z0-9]+$/i.test(pathname);
    const preloadUrl = isDocumentShell || forceRefresh || url.includes("/_next/static/")
      ? `${url}${url.includes("?") ? "&" : "?"}__pwa_preload=${CACHE_VERSION}`
      : url;
    const response = await fetch(preloadUrl, { signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error(`Precache failed: ${response.status} ${url}`);
    await cache.put(url, response);
  } catch (error) {
    const previous = await caches.match(url);
    if (previous) {
      await cache.put(url, previous.clone());
      return;
    }
    throw error;
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
      .then((keys) => {
        const previousCaches = keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .sort((a, b) => Number(b.slice(CACHE_PREFIX.length)) - Number(a.slice(CACHE_PREFIX.length)))
          .slice(0, RETAINED_CACHE_GENERATIONS - 1);
        const retainedCaches = new Set([CACHE_NAME, ...previousCaches]);
        return Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && !retainedCaches.has(key))
            .map((key) => caches.delete(key)),
        );
      })
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return /\.(?:js|css|png|jpg|jpeg|svg|webp|ico|mind|glb|mp3|m4a|ogg|wav|wasm|woff2?)$/i.test(url.pathname);
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const forceRefresh = shouldForceRefresh(request.url);
  if (cached && !forceRefresh) return cached;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = forceRefresh
      ? await fetch(`${request.url}${request.url.includes("?") ? "&" : "?"}__pwa_asset=${CACHE_VERSION}`, {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        })
      : await fetch(request, { signal: controller.signal });
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return cached || (await caches.match(request)) || Response.error();
  } finally {
    clearTimeout(timeout);
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(request, { signal: controller.signal });
    if (response.ok) {
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
    const appRootUrl = new URL(withBasePath("/"), self.location.origin).href;
    const current = (
      (await cache.match(request)) ||
      (await cache.match(`${url.origin}${pathname}`)) ||
      (await cache.match(`${url.origin}${alternatePath}`)) ||
      (await cache.match(appRootUrl))
    );
    if (current) return current;

    const previousCacheNames = (await caches.keys())
      .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .sort((left, right) => Number(right.slice(CACHE_PREFIX.length)) - Number(left.slice(CACHE_PREFIX.length)));
    for (const cacheName of previousCacheNames) {
      const previous = await caches.open(cacheName);
      const fallback =
        (await previous.match(request)) ||
        (await previous.match(`${url.origin}${pathname}`)) ||
        (await previous.match(`${url.origin}${alternatePath}`)) ||
        (await previous.match(appRootUrl));
      if (fallback) return fallback;
    }
    return Response.error();
  } finally {
    clearTimeout(timeout);
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
