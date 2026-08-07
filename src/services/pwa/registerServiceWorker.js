import { APP_CONFIG } from '../../config/app.config.js';

export function registerServiceWorker() {
  if (!APP_CONFIG.features.pwa || !import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    const serviceWorkerUrl = `${import.meta.env.BASE_URL}service-worker.js`;
    navigator.serviceWorker.register(serviceWorkerUrl).catch((error) => {
      console.warn('Service worker registration failed.', error);
    });
  });
}
