/**
 * Accepts only HTTP(S) links before exposing them in clickable anchors.
 */
export function normalizeExternalUrl(value) {
  const candidate = String(value || '').trim();
  if (!candidate) return '';

  try {
    const url = new URL(candidate);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}
