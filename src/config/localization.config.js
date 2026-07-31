/**
 * Supported interface languages.
 *
 * The first visit follows the browser language. A manual choice made in
 * Settings is persisted locally and takes priority on subsequent visits.
 */
export const SUPPORTED_LANGUAGES = Object.freeze([
  Object.freeze({ id: 'fr', locale: 'fr-FR', label: 'Français', shortLabel: 'FR' }),
  Object.freeze({ id: 'en', locale: 'en-GB', label: 'English', shortLabel: 'EN' }),
]);

export const FALLBACK_LANGUAGE = 'en';
export const LANGUAGE_STORAGE_KEY = 'language';

export function resolveBrowserLanguage() {
  if (typeof navigator === 'undefined') return FALLBACK_LANGUAGE;

  const requestedLanguages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  const matchingLanguage = requestedLanguages
    .map((language) => language?.toLowerCase())
    .find((language) => SUPPORTED_LANGUAGES.some((option) => language?.startsWith(option.id)));

  return SUPPORTED_LANGUAGES.find((option) => matchingLanguage?.startsWith(option.id))?.id
    || FALLBACK_LANGUAGE;
}
