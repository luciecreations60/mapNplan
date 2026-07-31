const WEATHER_GROUPS = [
  { codes: [0], label: 'Clear sky', icon: 'sun' },
  { codes: [1, 2], label: 'Partly cloudy', icon: 'cloudSun' },
  { codes: [3], label: 'Overcast', icon: 'cloud' },
  { codes: [45, 48], label: 'Foggy', icon: 'cloud' },
  { codes: [51, 53, 55, 56, 57], label: 'Drizzle', icon: 'cloudRain' },
  { codes: [61, 63, 65, 66, 67, 80, 81, 82], label: 'Rain', icon: 'cloudRain' },
  { codes: [71, 73, 75, 77, 85, 86], label: 'Snow', icon: 'snowflake' },
  { codes: [95, 96, 99], label: 'Thunderstorm', icon: 'cloudLightning' },
];

export function getWeatherPresentation(code) {
  return WEATHER_GROUPS.find((group) => group.codes.includes(Number(code))) || {
    label: 'Conditions unavailable',
    icon: 'cloud',
  };
}

export function formatTemperature(value) {
  return Number.isFinite(Number(value)) ? `${Math.round(Number(value))}°` : '—';
}

export function formatWeatherDay(date, locale = 'en-GB') {
  if (!date) return '';
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric' })
    .format(new Date(`${date}T12:00:00`));
}
