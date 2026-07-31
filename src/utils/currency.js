export function formatCurrency(value, currency = 'EUR', locale = 'en-GB') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}
