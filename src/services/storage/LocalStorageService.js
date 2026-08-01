import { APP_CONFIG } from '../../config/app.config.js';

const RECOVERY_PREFIX = 'recovery';
const MAX_RECOVERY_VALUE_LENGTH = 250_000;
const MAX_RECOVERY_ENTRIES = 5;

/** Browser storage adapter with small corruption recovery snapshots. */
class LocalStorageService {
  #prefix = APP_CONFIG.storageNamespace;

  #buildKey(key) {
    return `${this.#prefix}:${key}`;
  }

  get(key, fallbackValue = null) {
    const storageKey = this.#buildKey(key);
    const rawValue = localStorage.getItem(storageKey);
    if (rawValue === null) return fallbackValue;

    try {
      return JSON.parse(rawValue);
    } catch (error) {
      this.#quarantine(key, rawValue, error);
      console.warn(`Unable to read storage key "${key}". A recovery copy was kept.`, error);
      return fallbackValue;
    }
  }

  set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this.#buildKey(key), serialized);
      return true;
    } catch (error) {
      console.error(`Unable to save storage key "${key}".`, error);
      return false;
    }
  }

  remove(key) {
    try {
      localStorage.removeItem(this.#buildKey(key));
      return true;
    } catch (error) {
      console.warn(`Unable to remove storage key "${key}".`, error);
      return false;
    }
  }

  clearNamespace() {
    try {
      this.#keys()
        .filter((key) => key.startsWith(`${this.#prefix}:`))
        .forEach((key) => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Unable to clear local application data.', error);
      return false;
    }
  }

  listRecoveryEntries() {
    try {
      return this.#keys()
        .filter((key) => key.startsWith(`${this.#prefix}:${RECOVERY_PREFIX}:`))
        .sort()
        .reverse()
        .map((key) => ({ key, ...JSON.parse(localStorage.getItem(key)) }))
        .filter((entry) => entry.originalKey);
    } catch {
      return [];
    }
  }

  #keys() {
    const keys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key !== null) keys.push(key);
    }
    return keys;
  }

  #quarantine(key, rawValue, error) {
    try {
      const recoveryKey = `${this.#prefix}:${RECOVERY_PREFIX}:${Date.now()}`;
      localStorage.setItem(recoveryKey, JSON.stringify({
        originalKey: key,
        capturedAt: new Date().toISOString(),
        reason: String(error?.message || 'Invalid JSON'),
        rawValue: String(rawValue).slice(0, MAX_RECOVERY_VALUE_LENGTH),
        truncated: String(rawValue).length > MAX_RECOVERY_VALUE_LENGTH,
      }));

      const recoveryKeys = this.#keys()
        .filter((storageKey) => storageKey.startsWith(`${this.#prefix}:${RECOVERY_PREFIX}:`))
        .sort()
        .reverse();
      recoveryKeys.slice(MAX_RECOVERY_ENTRIES).forEach((storageKey) => localStorage.removeItem(storageKey));
    } catch {
      // Recovery is best effort only; never mask the original parsing failure.
    }
  }
}

export const localStorageService = new LocalStorageService();
