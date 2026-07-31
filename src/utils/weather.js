const WEATHER_PRESENTATIONS = [
  { codes: [0], labelKey: 'tools.clearSky', icon: 'sun' },
  { codes: [1, 2], labelKey: 'tools.partlyCloudy', icon: 'cloudSun' },
  { codes: [3], labelKey: 'tools.overcast', icon: 'cloud' },
  { codes: [45, 48], labelKey: 'tools.foggy', icon: 'cloud' },
  { codes: [51, 53, 55, 56, 57], labelKey: 'tools.drizzle', icon: 'cloudRain' },
  { codes: [61, 63, 65, 66, 67, 80, 81, 82], labelKey: 'tools.rainLabel', icon: 'cloudRain' },
  { codes: [71, 73, 75, 77, 85, 86], labelKey: 'tools.snow', icon: 'snowflake' },
  { codes: [95, 96, 99], labelKey: 'tools.thunderstorm', icon: 'cloudLightning' },
];

export function getWeatherPresentation(code) {
  return WEATHER_PRESENTATIONS.find((item) => item.codes.includes(Number(code))) || {
    labelKey: 'tools.unavailable',
    icon: 'cloud',
  };
}

export function formatTemperature(value) {
  return Number.isFinite(value) ? `${Math.round(value)}°` : '—';
}

export function formatWeatherDay(date, locale = 'en-GB') {
  const parsedDate = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric' })
    .format(parsedDate);
}
