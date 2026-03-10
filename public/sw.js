/**
 * Service Worker mínimo para o PWA Teste.
 * Em um sistema completo você pode adicionar cache de assets e offline.
 */
const CACHE_NAME = 'pwa-teste-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
