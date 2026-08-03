const CACHE_NAME = 'hidra-v1';
const ASSETS = [
  'index.html',
  'manifest.json',
  'estilos.css',
  'app.js',
  'icono.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
