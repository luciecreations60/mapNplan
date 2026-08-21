import { normalizeExternalUrl } from './url.js';

/**
 * Links back to the original confirmation email.
 *
 * Documents stay on the device that imported them, so the mailbox remains the
 * one copy reachable from anywhere. Rather than storing a direct message URL —
 * which users cannot easily copy on a phone, and which breaks when a message is
 * archived or moved — a search link is generated from data the import already
 * extracted: the provider and the confirmation number. That combination is
 * specific enough to surface the right email as the first result, and it never
 * goes stale.
 *
 * A manually pasted direct link always wins when the user has one.
 */

export const MAIL_PROVIDERS = Object.freeze([
  {
    id: 'gmail',
    labelKey: 'mailLink.providerGmail',
    buildSearchUrl: (query) => `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(query)}`,
  },
  {
    id: 'outlook',
    labelKey: 'mailLink.providerOutlook',
    buildSearchUrl: (query) => `https://outlook.live.com/mail/0/?search=${encodeURIComponent(query)}`,
  },
  {
    id: 'yahoo',
    labelKey: 'mailLink.providerYahoo',
    buildSearchUrl: (query) => `https://mail.yahoo.com/d/search/keyword=${encodeURIComponent(query)}`,
  },
  {
    id: 'icloud',
    labelKey: 'mailLink.providerIcloud',
    buildSearchUrl: () => 'https://www.icloud.com/mail/',
  },
  {
    id: 'other',
    labelKey: 'mailLink.providerOther',
    buildSearchUrl: () => '',
  },
]);

export const DEFAULT_MAIL_PROVIDER = 'gmail';

export function getMailProvider(providerId) {
  return MAIL_PROVIDERS.find((provider) => provider.id === providerId)
    || MAIL_PROVIDERS.find((provider) => provider.id === DEFAULT_MAIL_PROVIDER);
}

/**
 * The search terms that identify one confirmation email. The confirmation
 * number alone is the strongest signal; the provider is added when known to
 * disambiguate short references.
 */
export function buildMailSearchQuery(reservation) {
  const terms = [];
  const provider = String(reservation?.provider || '').trim();
  const reference = String(reservation?.confirmationNumber || '').trim();

  if (provider) terms.push(provider);
  if (reference) terms.push(reference);

  // Without a reference, fall back to the title so the link still lands
  // somewhere useful instead of opening an empty search.
  if (terms.length === 0) {
    const title = String(reservation?.title || '').trim();
    if (title) terms.push(title);
  }

  return terms.join(' ').trim();
}

/**
 * Resolves the link to open for a reservation, or an empty string when there
 * is nothing specific enough to search for.
 */
export function buildMailLink(reservation, providerId = DEFAULT_MAIL_PROVIDER) {
  const direct = normalizeExternalUrl(reservation?.emailUrl || '');
  if (direct) return direct;

  const query = buildMailSearchQuery(reservation);
  if (!query) return '';

  return getMailProvider(providerId).buildSearchUrl(query) || '';
}

export function hasMailLink(reservation, providerId = DEFAULT_MAIL_PROVIDER) {
  return Boolean(buildMailLink(reservation, providerId));
}
