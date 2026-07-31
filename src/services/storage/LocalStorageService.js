import { APP_CONFIG } from '../../config/app.config.js';

/**
 * Browser storage adapter.
 * Components never access localStorage directly, allowing this adapter to be
 * replaced later by IndexedDB, Supabase or a REST API.
 */
class LocalStorageService {
  #prefix = APP_CONFIG.storageNamespace;

  #buildKey(key) {
    return `${this.#prefix}:${key}`;
  }

  get(key, fallbackValue = null) {
    try {
      const rawValue = localStorage.getItem(this.#buildKey(key));
      return rawValue === null ? fallbackValue : JSON.parse(rawValue);
    } catch (error) {
      console.warn(`Unable to read storage key "${key}".`, error);
      return fallbackValue;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(this.#buildKey(key), JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Unable to save storage key "${key}".`, error);
      return false;
    }
  }

  remove(key) {
    localStorage.removeItem(this.#buildKey(key));
  }

  clearNamespace() {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(`${this.#prefix}:`))
      .forEach((key) => localStorage.removeItem(key));
  }
}

export const localStorageService = new LocalStorageService();
