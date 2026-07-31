/**
 * Central navigation definition.
 * Permissions and feature flags can later be added without rewriting layouts.
 */
export const PRIMARY_NAVIGATION = Object.freeze([
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { label: 'My trips', path: '/trips', icon: 'trips' },
  { label: 'Explore', path: '/explore', icon: 'explore' },
]);

export const SECONDARY_NAVIGATION = Object.freeze([
  { label: 'Settings', path: '/settings', icon: 'settings' },
]);
