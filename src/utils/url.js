/**
 * Normalize links before persisting or exposing them in the UI.
 * Data URLs are disabled by default and only accepted for locally compressed
 * image covers when the caller opts in explicitly.
 */
export function normalizeExternalUrl(value, { allowDataUrl = false } = {}) {
  const candidate = String(value || '').trim();
  if (!candidate) return '';

  if (allowDataUrl && /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(candidate)) {
    return candidate;
  }

  try {
    const url = new URL(candidate);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}
