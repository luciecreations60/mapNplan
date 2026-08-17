import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../../hooks/useI18n.js';
import { formatTemperature, formatWeatherDay, getWeatherPresentation } from '../../../utils/weather.js';
import { Card } from '../../common/Card.jsx';
import { Icon } from '../../common/Icon.jsx';
import { LocationAutocomplete } from '../../common/LocationAutocomplete.jsx';

export function WeatherCard({ forecast, location, status, error, tripStartDate, tripEndDate, onRefresh, onLocationSelect, onResetLocation, isCustomLocation = false }) {
  const { locale, t } = useI18n();
  const [searchValue, setSearchValue] = useState(location?.label || '');
  const currentPresentation = getWeatherPresentation(forecast?.current?.weatherCode);
  const tripCoverage = useMemo(() => getTripCoverage(forecast?.days || [], tripEndDate), [forecast, tripEndDate]);
  useEffect(() => { setSearchValue(location?.label || ''); }, [location?.label]);

  return <Card className="travel-tool-card weather-card">
    <header className="travel-tool-card__header"><div><p className="eyebrow">{t('tools.liveConditions')}</p><h2>{t('tools.weather')}</h2><small>{location?.label || t('tools.mappedRequired')}</small></div><button className="icon-button icon-button--small" type="button" onClick={onRefresh} disabled={status === 'loading'} aria-label={t('tools.refreshWeather')}><Icon name="refresh" size={17} /></button></header>
    <div className="weather-location-search">
      <LocationAutocomplete id="weather-location-search" variant="workspace" label={t('tools.weatherSearchLabel')} value={searchValue} placeholder={t('tools.weatherSearchPlaceholder')} onValueChange={setSearchValue} onPlaceSelect={(place) => { if (!place) return; setSearchValue(place.label); onLocationSelect?.({ label: place.label, latitude: place.latitude, longitude: place.longitude }); }} />
      {isCustomLocation && <button className="text-link weather-location-search__reset" type="button" onClick={onResetLocation}>{t('tools.weatherResetDestination')}</button>}
    </div>
    {status === 'loading' && !forecast && <div className="travel-tool-loading"><span className="loading-spinner" /><p>{t('tools.loadingForecast')}</p></div>}
    {error && !forecast && <div className="travel-tool-error"><Icon name="cloud" size={28} /><strong>{t('tools.weatherUnavailable')}</strong><p>{error}</p><button className="text-link" type="button" onClick={onRefresh}>{t('common.retry')}</button></div>}
    {forecast && <>
      <section className="weather-current"><span className="weather-current__icon"><Icon name={currentPresentation.icon} size={35} /></span><div><strong>{formatTemperature(forecast.current.temperature)}</strong><span>{t(currentPresentation.labelKey)}</span></div><dl><div><dt>{t('tools.feelsLike')}</dt><dd>{formatTemperature(forecast.current.apparentTemperature)}</dd></div><div><dt>{t('tools.humidity')}</dt><dd>{Number.isFinite(forecast.current.humidity) ? `${forecast.current.humidity}%` : '—'}</dd></div><div><dt>{t('tools.wind')}</dt><dd>{Number.isFinite(forecast.current.windSpeed) ? `${Math.round(forecast.current.windSpeed)} km/h` : '—'}</dd></div></dl></section>
      <div className="weather-coverage-note"><Icon name={tripCoverage.fullyCovered ? 'checkCircle' : 'info'} size={16} /><span>{tripCoverage.fullyCovered ? t('tools.tripForecastCovered') : t('tools.tripForecastLimited', { date: tripCoverage.lastForecastDate ? formatWeatherDay(tripCoverage.lastForecastDate, locale) : '—' })}</span></div>
      <div className="weather-forecast weather-forecast--extended" aria-label={t('tools.sixteenDay')}>{forecast.days.map((day) => { const presentation = getWeatherPresentation(day.weatherCode); const isTripDay = Boolean(tripStartDate && tripEndDate && day.date >= tripStartDate && day.date <= tripEndDate); return <article key={day.date} className={isTripDay ? 'weather-forecast__trip-day' : ''}><strong>{formatWeatherDay(day.date, locale)}</strong><Icon name={presentation.icon} size={20} /><span>{formatTemperature(day.temperatureMax)} / {formatTemperature(day.temperatureMin)}</span><small>{Number.isFinite(day.precipitationProbability) ? t('tools.rain', { count: day.precipitationProbability }) : t(presentation.labelKey)}</small>{isTripDay && <em>{t('tools.tripDay')}</em>}</article>; })}</div>
      <footer className="travel-tool-card__footer"><span>{forecast.fromCache ? t('tools.cachedForecast') : t('tools.refreshedForecast')}</span><span>Open-Meteo</span></footer>
    </>}
  </Card>;
}
function getTripCoverage(days, endDate) { const lastForecastDate = days.at(-1)?.date || ''; return { lastForecastDate, fullyCovered: Boolean(endDate && lastForecastDate && endDate <= lastForecastDate) }; }
