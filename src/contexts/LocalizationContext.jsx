import { createContext, useEffect, useMemo, useState } from 'react';
import {
  FALLBACK_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  resolveBrowserLanguage,
} from '../config/localization.config.js';
import { TRANSLATIONS } from '../i18n/translations.js';
import { localStorageService } from '../services/storage/LocalStorageService.js';

export const LocalizationContext = createContext(null);

const VALID_LANGUAGES = new Set(SUPPORTED_LANGUAGES.map((language) => language.id));

function readPath(source, path) {
  return path.split('.').reduce((value, segment) => value?.[segment], source);
}

function interpolate(value, variables) {
  if (typeof value !== 'string') return value;
  return value.replace(/{{\s*([\w]+)\s*}}/g, (_, key) => String(variables[key] ?? ''));
}

export function getStoredOrBrowserLanguage() {
  const storedLanguage = localStorageService.get(LANGUAGE_STORAGE_KEY, null);
  return VALID_LANGUAGES.has(storedLanguage) ? storedLanguage : resolveBrowserLanguage();
}

export function translateForCurrentBrowser(key, variables = {}) {
  const language = getStoredOrBrowserLanguage();
  const value = readPath(TRANSLATIONS[language], key)
    ?? readPath(TRANSLATIONS[FALLBACK_LANGUAGE], key)
    ?? key;
  return interpolate(value, variables);
}

export function LocalizationProvider({ children }) {
  const [language, setLanguageState] = useState(getStoredOrBrowserLanguage);
  const languageConfig = SUPPORTED_LANGUAGES.find((option) => option.id === language)
    || SUPPORTED_LANGUAGES.find((option) => option.id === FALLBACK_LANGUAGE);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;
  }, [language]);

  const value = useMemo(() => ({
    language,
    locale: languageConfig.locale,
    supportedLanguages: SUPPORTED_LANGUAGES,
    setLanguage(nextLanguage) {
      if (!VALID_LANGUAGES.has(nextLanguage)) return;
      localStorageService.set(LANGUAGE_STORAGE_KEY, nextLanguage);
      setLanguageState(nextLanguage);
    },
    t(key, variables = {}) {
      const translatedValue = readPath(TRANSLATIONS[language], key)
        ?? readPath(TRANSLATIONS[FALLBACK_LANGUAGE], key)
        ?? key;
      return interpolate(translatedValue, variables);
    },
  }), [language, languageConfig.locale]);

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}
