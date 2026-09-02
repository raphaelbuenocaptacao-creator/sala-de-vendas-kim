const CACHE_PREFIX = 'kim-vendas-shell-';
const CACHE_NAME = `${CACHE_PREFIX}v4-safe`;
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './data.js',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './icons/icon-512-maskable.svg'
];
const APP_SHELL_PATHS = new Set(APP_SHELL.map(item => new URL(item, self.registration.scope).pathname));
const PRIVATE_PATH_RE = /\/(api|auth|login|logout|admin|session|sessions|token|tokens|password|account|profile|me)(\/|$)/i;
const SENSITIVE_QUERY_RE = /^(token|access_token|refresh_token|password|passwd|secret|session|auth|authorization|api_key|apikey|key|code|credential|credentials)$/i;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function hasSensitiveQuery(url) {
  for (const key of url.searchParams.keys()) {
    if (SENSITIVE_QUERY_RE.test(key)) return true;
  }
  return false;
}

function isPrivateRequest(request, url) {
  if (request.method !== 'GET') return true;
  if (url.origin !== self.location.origin) return true;
  if (request.headers.has('authorization') || request.headers.has('cookie') || request.headers.has('range')) return true;
  if (PRIVATE_PATH_RE.test(url.pathname)) return true;
  if (hasSensitiveQuery(url)) return true;
  return false;
}

function isCacheableResponse(response) {
  if (!response || !response.ok || response.status === 206) return false;
  if (response.type === 'opaque' || response.redirected) return false;
  const cacheControl = response.headers.get('cache-control') || '';
  if (/\b(no-store|private)\b/i.test(cacheControl)) return false;
  if (response.headers.has('set-cookie') || response.headers.has('content-range')) return false;
  return true;
}

async function fetchAndCache(request) {
  const response = await fetch(new Request(request, { cache: 'no-store' }));
  if (isCacheableResponse(response)) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (isPrivateRequest(request, url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(new Request(request, { cache: 'no-store' }))
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (url.search) return;
  if (!APP_SHELL_PATHS.has(url.pathname)) return;

  event.respondWith(
    caches.match(request).then(cached => cached || fetchAndCache(request))
  );
});
