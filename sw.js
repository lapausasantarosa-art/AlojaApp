// AlojApp — Service Worker minimalista
// Solo provee el contexto HTTPS necesario para PWA
// No cachea en install para evitar errores de URL

const CACHE_NAME = 'alojapp-v2';

self.addEventListener('install', e => {
  // Nada que cachear al instalar — skipWaiting directo
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Limpiar caches viejos
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Solo GET, solo mismo origen
  if (e.request.method !== 'GET') return;
  const url = e.request.url;

  // No interceptar Firebase, Google APIs ni externos
  if (
    url.includes('firestore.googleapis.com') ||
    url.includes('firebase') ||
    url.includes('googleapis.com') ||
    url.includes('accounts.google.com') ||
    url.includes('gstatic.com') ||
    url.includes('dolarapi.com')
  ) return;

  // Red primero, cache como fallback
  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

