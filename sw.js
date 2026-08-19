const CACHE_NAME = 'hidra-v2.2';
const ASSETS = [
  '/',
  'index.html',
  'manifest.json',
  'estilos.css',
  'app.js',
  'icono.svg',
  'icono.png'
];

// Instalación: Guarda todo en caché de forma segura
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('SW: Abriendo caché y guardando recursos');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación: Limpia de inmediato cualquier versión antigua (v1, etc.)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('SW: Eliminando caché antigua:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia: Caché Primero con tolerancia para rutas raíz (/)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // CONTROL CRÍTICO: Si el usuario entra a la raíz "/", le servimos el index.html de la caché
  if (url.origin === self.location.origin && url.pathname === '/') {
    e.respondWith(
      caches.match('index.html').then(cachedResponse => {
        return cachedResponse || fetch(e.request);
      })
    );
    return;
  }

  // Estrategia normal para el resto de recursos
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      return cachedResponse || fetch(e.request).catch(() => {
        // Fallback en caso de que un recurso no exista en caché y estemos offline
        console.log('SW: Recurso no encontrado offline:', e.request.url);
      });
    })
  );
});
