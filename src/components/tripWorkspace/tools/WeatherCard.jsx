import { useI18n } from '../../../hooks/useI18n.js';
import { formatTemperature, formatWeatherDay, getWeatherPresentation } from '../../../utils/weather.js';
import { Card } from '../../common/Card.jsx';
import { Icon } from '../../common/Icon.jsx';

export function WeatherCard({ forecast, location, status, error, onRefresh }) {
  const { locale, t } = useI18n();
  const currentPresentation = getWeatherPresentation(forecast?.current?.weatherCode);

  return (
    <Card className="travel-tool-card weather-card">
      <header className="travel-tool-card__header">
        <div>
          <p className="eyebrow">{t('tools.liveConditions')}</p>
          <h2>{t('tools.weather')}</h2>
          <small>{location?.label || t('tools.mappedRequired')}</small>
        </div>
        <button className="icon-button icon-button--small" type="button" onClick={onRefresh} disabled={status === 'loading'} aria-label={t('tools.refreshWeather')}>
          <Icon name="refresh" size={17} />
        </button>
      </header>

      {status === 'loading' && !forecast && <div className="travel-tool-loading"><span className="loading-spinner" /><p>{t('tools.loadingForecast')}</p></div>}

      {error && !forecast && (
        <div className="travel-tool-error"><Icon name="cloud" size={28} /><strong>{t('tools.weatherUnavailable')}</strong><p>{error}</p><button className="text-link" type="button" onClick={onRefresh}>{t('common.retry')}</button></div>
      )}

      {forecast && (
        <>
          <section className="weather-current">
            <span className="weather-current__icon"><Icon name={currentPresentation.icon} size={35} /></span>
            <div><strong>{formatTemperature(forecast.current.temperature)}</strong><span>{t(currentPresentation.labelKey)}</span></div>
            <dl>
              <div><dt>{t('tools.feelsLike')}</dt><dd>{formatTemperature(forecast.current.apparentTemperature)}</dd></div>
              <div><dt>{t('tools.humidity')}</dt><dd>{Number.isFinite(forecast.current.humidity) ? `${forecast.current.humidity}%` : '—'}</dd></div>
              <div><dt>{t('tools.wind')}</dt><dd>{Number.isFinite(forecast.current.windSpeed) ? `${Math.round(forecast.current.windSpeed)} km/h` : '—'}</dd></div>
            </dl>
          </section>

          <div className="weather-forecast" aria-label={t('tools.sevenDay')}>
            {forecast.days.slice(0, 7).map((day) => {
              const presentation = getWeatherPresentation(day.weatherCode);
              return (
                <article key={day.date}>
                  <strong>{formatWeatherDay(day.date, locale)}</strong>
                  <Icon name={presentation.icon} size={20} />
                  <span>{formatTemperature(day.temperatureMax)} / {formatTemperature(day.temperatureMin)}</span>
                  <small>{Number.isFinite(day.precipitationProbability) ? t('tools.rain', { count: day.precipitationProbability }) : t(presentation.labelKey)}</small>
                </article>
              );
            })}
          </div>

          <footer className="travel-tool-card__footer"><span>{forecast.fromCache ? t('tools.cachedForecast') : t('tools.refreshedForecast')}</span><span>Open-Meteo</span></footer>
        </>
      )}
    </Card>
  );
}
