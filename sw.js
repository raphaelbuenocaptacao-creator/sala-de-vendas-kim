const CACHE_NAME = 'kim-vendas-shell-v2';
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
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isPrivateRequest(request, url) {
  if (request.method !== 'GET') return true;
  if (url.origin !== self.location.origin) return true;
  if (request.headers.has('authorization') || request.headers.has('cookie')) return true;
  if (/\/(api|auth|login|logout|admin|session|token|password|account|profile)(\/|$)/i.test(url.pathname)) return true;
  for (const key of ['token','access_token','refresh_token','password','secret','session','auth']) {
    if (url.searchParams.has(key)) return true;
  }
  return false;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (isPrivateRequest(request, url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (!APP_SHELL_PATHS.has(url.pathname)) return;

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});
