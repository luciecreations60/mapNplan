const MONTHS = Object.freeze({
  january: 1, jan: 1, janvier: 1, janv: 1, gennaio: 1, enero: 1,
  february: 2, feb: 2, february: 2, fevrier: 2, février: 2, fevr: 2, févr: 2, febbraio: 2, febrero: 2,
  march: 3, mar: 3, mars: 3, marzo: 3,
  april: 4, apr: 4, avril: 4, avr: 4, aprile: 4, abril: 4,
  may: 5, mai: 5, maggio: 5, mayo: 5,
  june: 6, jun: 6, juin: 6, giugno: 6, junio: 6,
  july: 7, jul: 7, juillet: 7, juil: 7, luglio: 7, julio: 7,
  august: 8, aug: 8, aout: 8, août: 8, ago: 8, agosto: 8,
  september: 9, sep: 9, sept: 9, septembre: 9, settembre: 9, septiembre: 9,
  october: 10, oct: 10, octobre: 10, ottobre: 10, octubre: 10,
  november: 11, nov: 11, novembre: 11, novembre_it: 11, noviembre: 11,
  december: 12, dec: 12, décembre: 12, decembre: 12, dicembre: 12, diciembre: 12,
});

const PROVIDERS = Object.freeze([
  'Booking.com', 'Airbnb', 'Expedia', 'Hotels.com', 'Agoda', 'Vrbo',
  'Air France', 'easyJet', 'Ryanair', 'Transavia', 'Lufthansa', 'KLM', 'Vueling',
  'SNCF Connect', 'SNCF', 'Trenitalia', 'Eurostar', 'FlixBus', 'BlaBlaCar Bus',
  'Corsica Ferries', 'La Méridionale', 'Moby Lines', 'Grimaldi Lines',
  'GetYourGuide', 'Viator', 'Tiqets',
]);

const TYPE_KEYWORDS = Object.freeze({
  accommodation: [
    'hotel', 'hôtel', 'hebergement', 'hébergement', 'accommodation', 'camping', 'campsite',
    'appartement', 'apartment', 'hostel', 'auberge', 'check-in', 'check in', 'check-out', 'check out',
    'nuit', 'night', 'room', 'chambre', 'stay', 'séjour',
  ],
  flight: ['flight', 'vol ', 'boarding', 'embarquement', 'airport', 'aéroport', 'airline', 'compagnie aérienne', 'pnr'],
  transport: [
    'train', 'sncf', 'ferry', 'traversée', 'bus', 'coach', 'location de voiture', 'car rental',
    'rental car', 'transport', 'billet de train', 'rail', 'treno', 'traghetto',
  ],
  activity: ['activity', 'activité', 'ticket', 'billet', 'museum', 'musée', 'tour', 'excursion', 'visit', 'visite', 'attraction'],
});

const TOTAL_KEYWORDS = [
  'total', 'montant total', 'prix total', 'amount due', 'total price', 'grand total', 'price', 'prix', 'montant', 'cost', 'coût', 'costo', 'totale',
];

const REFERENCE_KEYWORDS = [
  'confirmation number', 'confirmation no', 'booking number', 'booking reference', 'reservation number',
  'reservation reference', 'référence de réservation', 'numero de réservation', 'numéro de réservation',
  'numéro de confirmation', 'reference', 'référence', 'confirmation', 'booking id', 'reservation id', 'pnr', 'code de réservation',
];

export function analyzeReservationText(text, {
  fileName = '',
  currency = 'EUR',
  tripStartDate = '',
  tripEndDate = '',
} = {}) {
  const normalizedText = normalizeWhitespace(text);
  const lines = getMeaningfulLines(text);
  const lower = normalizedText.toLocaleLowerCase('fr');
  const type = detectReservationType(lower);
  const provider = detectProvider(lines, lower);
  const confirmationNumber = detectConfirmationNumber(lines);
  const dates = detectDates(normalizedText, { tripStartDate, tripEndDate });
  const times = detectTimes(normalizedText);
  const amountInfo = detectAmount(lines, currency);
  const location = detectLocation(lines, type, provider);
  const title = detectTitle(lines, { provider, location, type, fileName });
  const status = detectStatus(lower);

  const warnings = [];
  if (!title) warnings.push('title');
  if (!dates.startDate) warnings.push('startDate');
  if (!confirmationNumber) warnings.push('confirmationNumber');
  if (amountInfo.amount <= 0) warnings.push('amount');

  return {
    type,
    status,
    title,
    provider,
    confirmationNumber,
    startDate: dates.startDate,
    startTime: times.startTime,
    endDate: dates.endDate,
    endTime: times.endTime,
    location,
    amount: amountInfo.amount,
    detectedCurrency: amountInfo.currency || currency,
    url: detectUrl(normalizedText),
    latitude: null,
    longitude: null,
    notes: '',
    warnings,
    extractedText: normalizedText,
  };
}

export function findLikelyDuplicateReservation(reservations, draft) {
  const reference = normalizeToken(draft?.confirmationNumber);
  if (reference) {
    const byReference = (reservations || []).find((item) => normalizeToken(item.confirmationNumber) === reference);
    if (byReference) return { reservation: byReference, reason: 'reference' };
  }

  const title = normalizeToken(draft?.title);
  const provider = normalizeToken(draft?.provider);
  const startDate = String(draft?.startDate || '');
  if (!startDate) return null;

  const byIdentity = (reservations || []).find((item) => {
    if (String(item.startDate || '') !== startDate) return false;
    const sameTitle = title && normalizeToken(item.title) === title;
    const sameProvider = provider && normalizeToken(item.provider) === provider;
    return sameTitle || sameProvider;
  });
  return byIdentity ? { reservation: byIdentity, reason: 'date' } : null;
}

export function mapReservationTypeToActivityType(type) {
  return {
    accommodation: 'hotel',
    flight: 'plane',
    transport: 'car',
    activity: 'ticket',
  }[type] || 'ticket';
}

export function mapReservationTypeToExpenseCategory(type) {
  return {
    accommodation: 'accommodation',
    flight: 'transport',
    transport: 'transport',
    activity: 'activities',
  }[type] || 'other';
}

function detectReservationType(lower) {
  let winner = 'activity';
  let bestScore = -1;
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    const score = keywords.reduce((sum, keyword) => sum + countOccurrences(lower, keyword), 0);
    if (score > bestScore) {
      winner = type;
      bestScore = score;
    }
  }
  return winner;
}

function detectProvider(lines, lower) {
  const known = PROVIDERS.find((provider) => lower.includes(provider.toLocaleLowerCase('fr')));
  if (known) return known;

  const providerLine = lines.find((line) => /(?:provider|prestataire|compagnie|opérateur|operator|booking made with|réservé avec)\s*[:\-]/i.test(line));
  if (providerLine) return cleanExtractedValue(providerLine.split(/[:\-]/).slice(1).join('-'));
  return '';
}

function detectConfirmationNumber(lines) {
  for (const line of lines) {
    const lower = line.toLocaleLowerCase('fr');
    if (!REFERENCE_KEYWORDS.some((keyword) => lower.includes(keyword))) continue;
    const value = line
      .replace(new RegExp(`.*(?:${REFERENCE_KEYWORDS.map(escapeRegExp).join('|')})\\s*(?:n[°o.]*)?\\s*[:#-]?\\s*`, 'i'), '')
      .trim();
    const token = value.match(/[A-Z0-9][A-Z0-9-]{3,19}/i)?.[0];
    if (token) return token;
  }

  const pnr = lines.join(' ').match(/\b(?:PNR|REF|BOOKING)\s*[:#-]?\s*([A-Z0-9][A-Z0-9-]{4,11})\b/i);
  return pnr?.[1] || '';
}

function detectDates(text, { tripStartDate, tripEndDate }) {
  const candidates = [];

  const numericPattern = /\b(0?[1-9]|[12]\d|3[01])[\/.\-](0?[1-9]|1[0-2])[\/.\-](20\d{2}|\d{2})\b/g;
  for (const match of text.matchAll(numericPattern)) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = normalizeYear(match[3]);
    const iso = safeIsoDate(year, month, day);
    if (iso) candidates.push({ iso, index: match.index || 0 });
  }

  const namedPattern = /\b(0?[1-9]|[12]\d|3[01])\s+(jan(?:uary|vier)?|janv\.?|feb(?:ruary)?|fév(?:rier)?|fev(?:rier)?|mars?|march|apr(?:il)?|avr(?:il)?|mai|may|juin|june|jun|juillet|july|jul|ao[uû]t|aug(?:ust)?|sept(?:ember|embre)?|sep|oct(?:ober|obre)?|nov(?:ember|embre)?|d[ée]c(?:ember|embre)?|dec(?:ember|embre)?|gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|enero|febrero|abril|mayo|junio|julio|septiembre|octubre|noviembre|diciembre)\s+(20\d{2}|\d{2})\b/giu;
  for (const match of text.matchAll(namedPattern)) {
    const month = monthNumber(match[2]);
    const iso = safeIsoDate(normalizeYear(match[3]), month, Number(match[1]));
    if (iso) candidates.push({ iso, index: match.index || 0 });
  }

  const isoPattern = /\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/g;
  for (const match of text.matchAll(isoPattern)) candidates.push({ iso: match[0], index: match.index || 0 });

  const unique = [...new Map(candidates.sort((a, b) => a.index - b.index).map((item) => [item.iso, item])).values()];
  const plausible = unique.filter((item) => isNearTrip(item.iso, tripStartDate, tripEndDate));
  const selected = plausible.length > 0 ? plausible : unique;
  return { startDate: selected[0]?.iso || '', endDate: selected[1]?.iso || '' };
}

function detectTimes(text) {
  const values = [];
  const pattern = /\b([01]?\d|2[0-3])(?:\s*[hH:]\s*)([0-5]\d)\b/g;
  for (const match of text.matchAll(pattern)) values.push(`${String(Number(match[1])).padStart(2, '0')}:${match[2]}`);

  const amPmPattern = /\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(AM|PM)\b/gi;
  for (const match of text.matchAll(amPmPattern)) {
    let hour = Number(match[1]);
    if (match[3].toUpperCase() === 'PM' && hour < 12) hour += 12;
    if (match[3].toUpperCase() === 'AM' && hour === 12) hour = 0;
    values.push(`${String(hour).padStart(2, '0')}:${match[2] || '00'}`);
  }

  const unique = [...new Set(values)];
  return { startTime: unique[0] || '', endTime: unique[1] || '' };
}

function detectAmount(lines, fallbackCurrency) {
  const candidates = [];
  const moneyPattern = /(?:\b(EUR|USD|GBP|CHF|JPY|CAD|AUD)\b\s*)?([€$£¥]?)\s*([0-9]+(?:[\s.,][0-9]{3})*(?:[.,][0-9]{1,2})?)\s*([€$£¥]?)(?:\s*\b(EUR|USD|GBP|CHF|JPY|CAD|AUD)\b)?/gi;

  lines.forEach((line, lineIndex) => {
    const lower = line.toLocaleLowerCase('fr');
    const keywordScore = TOTAL_KEYWORDS.reduce((score, keyword) => score + (lower.includes(keyword) ? 3 : 0), 0);
    for (const match of line.matchAll(moneyPattern)) {
      if (!match[1] && !match[2] && !match[4] && !match[5] && keywordScore === 0) continue;
      const amount = parseLocalizedNumber(match[3]);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) continue;
      candidates.push({
        amount,
        currency: currencyFromMatch(match) || fallbackCurrency,
        score: keywordScore + (match[1] || match[2] || match[4] || match[5] ? 2 : 0) + Math.min(amount / 1000, 2),
        lineIndex,
      });
    }
  });

  candidates.sort((left, right) => right.score - left.score || right.amount - left.amount || left.lineIndex - right.lineIndex);
  return candidates[0] || { amount: 0, currency: fallbackCurrency };
}

function detectLocation(lines, type, provider) {
  const labelPattern = /(?:address|adresse|location|lieu|pickup|pick-up|meeting point|point de rendez-vous|destination)\s*[:\-]\s*(.+)$/i;
  for (const line of lines) {
    const match = line.match(labelPattern);
    if (match?.[1]) return cleanExtractedValue(match[1]);
  }

  const addressLike = lines.find((line) => (
    /\b\d{1,4}\s+[\p{L}][\p{L}\s.'’-]{2,}\b/iu.test(line)
    && /\b(rue|avenue|av\.?|boulevard|bd\.?|route|chemin|street|st\.?|road|rd\.?|via|piazza|calle|drive|dr\.?)\b/i.test(line)
  ));
  if (addressLike) return cleanExtractedValue(addressLike);

  if (type === 'accommodation') {
    const lodging = lines.find((line) => /\b(hôtel|hotel|camping|campsite|résidence|residence|apartment|appartement|hostel|auberge)\b/i.test(line) && !providerMatches(line, provider));
    if (lodging) return cleanExtractedValue(lodging);
  }
  return '';
}

function detectTitle(lines, { provider, location, type, fileName }) {
  const candidates = lines.filter((line) => {
    if (line.length < 3 || line.length > 100) return false;
    if (/^(reservation|réservation|booking|confirmation|invoice|facture|receipt|reçu|voucher|bon|e-ticket|ticket)$/i.test(line)) return false;
    if (providerMatches(line, provider)) return false;
    if (/https?:\/\//i.test(line) || /@/.test(line)) return false;
    if (/^[\d\s.,€$£¥:/#-]+$/.test(line)) return false;
    return true;
  });

  const typePattern = type === 'accommodation'
    ? /\b(hôtel|hotel|camping|campsite|résidence|residence|apartment|appartement|hostel|auberge)\b/i
    : type === 'flight'
      ? /\b(flight|vol|airways|airlines|airport|aéroport)\b/i
      : type === 'transport'
        ? /\b(train|ferry|bus|sncf|trenitalia|transport|traversée)\b/i
        : /\b(activity|activité|museum|musée|tour|excursion|visit|visite|attraction)\b/i;

  const typed = candidates.find((line) => typePattern.test(line));
  if (typed) return cleanExtractedValue(typed);
  if (location && location.length <= 80) return location;
  if (candidates[0]) return cleanExtractedValue(candidates[0]);
  if (provider) return provider;
  return fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
}

function detectStatus(lower) {
  if (/\b(cancelled|canceled|annulée|annulee|annulé|annule|cancellata|cancelled booking)\b/i.test(lower)) return 'cancelled';
  if (/\b(pending|en attente|à confirmer|a confirmer|provisional|provvisoria)\b/i.test(lower)) return 'pending';
  return 'confirmed';
}

function detectUrl(text) {
  const match = text.match(/https?:\/\/[^\s<>()]+/i);
  return match?.[0]?.replace(/[.,;]+$/, '') || '';
}

function getMeaningfulLines(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter((line) => line.length >= 2)
    .slice(0, 500);
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function cleanExtractedValue(value) {
  return normalizeWhitespace(value).replace(/^[\s:;,.\-–—]+|[\s:;,.\-–—]+$/g, '').slice(0, 180);
}

function monthNumber(value) {
  const key = String(value || '').toLocaleLowerCase('fr').replace(/\.$/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normalizedMap = Object.fromEntries(Object.entries(MONTHS).map(([name, number]) => [name.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), number]));
  return normalizedMap[key] || 0;
}

function normalizeYear(value) {
  const year = Number(value);
  if (String(value).length === 2) return year >= 70 ? 1900 + year : 2000 + year;
  return year;
}

function safeIsoDate(year, month, day) {
  if (![year, month, day].every(Number.isFinite) || year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return '';
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return '';
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isNearTrip(iso, start, end) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start || '') || !/^\d{4}-\d{2}-\d{2}$/.test(end || '')) return true;
  const date = new Date(`${iso}T12:00:00Z`).getTime();
  const lower = new Date(`${start}T12:00:00Z`).getTime() - 45 * 86400000;
  const upper = new Date(`${end}T12:00:00Z`).getTime() + 45 * 86400000;
  return date >= lower && date <= upper;
}

function parseLocalizedNumber(value) {
  let normalized = String(value || '').replace(/\s/g, '');
  const lastComma = normalized.lastIndexOf(',');
  const lastDot = normalized.lastIndexOf('.');
  if (lastComma > lastDot) normalized = normalized.replace(/\./g, '').replace(',', '.');
  else if (lastDot > lastComma) normalized = normalized.replace(/,/g, '');
  else normalized = normalized.replace(',', '.');
  return Number(normalized);
}

function currencyFromMatch(match) {
  const code = (match[1] || match[5] || '').toUpperCase();
  if (code) return code;
  const symbol = match[2] || match[4] || '';
  return { '€': 'EUR', '$': 'USD', '£': 'GBP', '¥': 'JPY' }[symbol] || '';
}

function normalizeToken(value) {
  return String(value || '').trim().toLocaleLowerCase('fr').replace(/[^a-z0-9à-ÿ]+/gi, '');
}

function providerMatches(line, provider) {
  return provider && normalizeToken(line) === normalizeToken(provider);
}

function countOccurrences(text, keyword) {
  let count = 0;
  let index = 0;
  while ((index = text.indexOf(keyword, index)) !== -1) {
    count += 1;
    index += Math.max(keyword.length, 1);
  }
  return count;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
