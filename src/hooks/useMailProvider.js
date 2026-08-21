import { useCallback, useState } from 'react';
import { localStorageService } from '../services/storage/LocalStorageService.js';
import { DEFAULT_MAIL_PROVIDER, MAIL_PROVIDERS } from '../utils/mailLink.js';

const STORAGE_KEY = 'mail-provider';

function readStoredProvider() {
  const stored = localStorageService.get(STORAGE_KEY, DEFAULT_MAIL_PROVIDER);
  return MAIL_PROVIDERS.some((provider) => provider.id === stored)
    ? stored
    : DEFAULT_MAIL_PROVIDER;
}

/**
 * Which webmail to open when jumping back to a confirmation email.
 *
 * This is a device preference rather than trip data: the same account may be
 * opened from a phone and a laptop with different mail apps, so it is kept in
 * local storage and never synchronised.
 */
export function useMailProvider() {
  const [mailProvider, setStoredProvider] = useState(readStoredProvider);

  const setMailProvider = useCallback((providerId) => {
    const next = MAIL_PROVIDERS.some((provider) => provider.id === providerId)
      ? providerId
      : DEFAULT_MAIL_PROVIDER;
    localStorageService.set(STORAGE_KEY, next);
    setStoredProvider(next);
  }, []);

  return { mailProvider, setMailProvider };
}
