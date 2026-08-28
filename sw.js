const CACHE_PREFIX = "earth-mission-ar-v";
const CACHE_VERSION = 62;
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

function staticAssetTimeoutMs(url) {
  return /\.(?:glb|mind|mp3|m4a|ogg|wav)$/i.test(url.pathname) ? 24_000 : 8_000;
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const forceRefresh = shouldForceRefresh(request.url);
  const inherited = cached || (await caches.match(request));
  if (inherited && !forceRefresh) {
    if (!cached) await cache.put(request, inherited.clone());
    return inherited;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), staticAssetTimeoutMs(new URL(request.url)));
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
    return inherited || Response.error();
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
