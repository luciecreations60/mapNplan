import { useContext } from 'react';
import { LocalizationContext, translateForCurrentBrowser } from '../contexts/LocalizationContext.jsx';

export function useI18n() {
  const context = useContext(LocalizationContext);
  if (context) return context;

  return {
    language: 'fr',
    locale: 'fr-FR',
    supportedLanguages: [],
    setLanguage() {},
    t: (key, variables = {}) => translateForCurrentBrowser(key, variables),
  };
}
