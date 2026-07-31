/**
 * External service endpoints and operational limits.
 *
 * Keeping URLs, timeouts and cache durations outside UI components makes it
 * possible to replace a provider without rewriting the travel workspace.
 */
export const EXTERNAL_SERVICES_CONFIG = Object.freeze({
  weather: Object.freeze({
    baseUrl: 'https://api.open-meteo.com/v1/forecast',
    timeoutMs: 10000,
    cacheTtlMs: 15 * 60 * 1000,
    forecastDays: 7,
  }),
  currency: Object.freeze({
    baseUrl: 'https://api.frankfurter.dev/v2',
    timeoutMs: 10000,
    cacheTtlMs: 6 * 60 * 60 * 1000,
  }),
  geocoding: Object.freeze({
    provider: 'photon',
    baseUrl: 'https://photon.komoot.io/api',
    timeoutMs: 9000,
    cacheTtlMs: 24 * 60 * 60 * 1000,
    debounceMs: 500,
    minimumQueryLength: 3,
    resultLimit: 6,
  }),
});

export const SUPPORTED_CURRENCIES = Object.freeze([
  { code: 'EUR', label: 'Euro' },
  { code: 'USD', label: 'US dollar' },
  { code: 'GBP', label: 'Pound sterling' },
  { code: 'JPY', label: 'Japanese yen' },
  { code: 'ISK', label: 'Icelandic króna' },
  { code: 'CHF', label: 'Swiss franc' },
  { code: 'CAD', label: 'Canadian dollar' },
  { code: 'AUD', label: 'Australian dollar' },
  { code: 'NZD', label: 'New Zealand dollar' },
  { code: 'SEK', label: 'Swedish krona' },
  { code: 'NOK', label: 'Norwegian krone' },
  { code: 'DKK', label: 'Danish krone' },
  { code: 'PLN', label: 'Polish złoty' },
  { code: 'CZK', label: 'Czech koruna' },
  { code: 'HUF', label: 'Hungarian forint' },
  { code: 'TRY', label: 'Turkish lira' },
  { code: 'THB', label: 'Thai baht' },
  { code: 'SGD', label: 'Singapore dollar' },
  { code: 'HKD', label: 'Hong Kong dollar' },
  { code: 'KRW', label: 'South Korean won' },
  { code: 'CNY', label: 'Chinese yuan' },
  { code: 'INR', label: 'Indian rupee' },
  { code: 'MXN', label: 'Mexican peso' },
  { code: 'BRL', label: 'Brazilian real' },
  { code: 'ZAR', label: 'South African rand' },
  { code: 'AED', label: 'UAE dirham' },
]);
