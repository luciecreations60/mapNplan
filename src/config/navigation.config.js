/**
 * Central navigation definition.
 * Labels are translation keys so layouts remain language-neutral.
 */
export const PRIMARY_NAVIGATION = Object.freeze([
  { labelKey: 'nav.dashboard', path: '/dashboard', icon: 'dashboard' },
  { labelKey: 'nav.trips', path: '/trips', icon: 'trips' },
  { labelKey: 'nav.templates', path: '/templates', icon: 'copy' },
  { labelKey: 'nav.explore', path: '/explore', icon: 'explore' },
  { labelKey: 'nav.contentStudio', path: '/content', icon: 'fileText' },
]);

export const SECONDARY_NAVIGATION = Object.freeze([
  { labelKey: 'nav.settings', path: '/settings', icon: 'settings' },
]);
