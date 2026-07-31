import { Card } from '../../common/Card.jsx';
import { Icon } from '../../common/Icon.jsx';
import { formatTemperature, formatWeatherDay, getWeatherPresentation } from '../../../utils/weather.js';

export function WeatherCard({ forecast, location, status, error, onRefresh }) {
  const currentPresentation = getWeatherPresentation(forecast?.current?.weatherCode);

  return (
    <Card className="travel-tool-card weather-card">
      <header className="travel-tool-card__header">
        <div>
          <p className="eyebrow">Live conditions</p>
          <h2>Destination weather</h2>
          <small>{location?.label || 'Mapped destination required'}</small>
        </div>
        <button className="icon-button icon-button--small" type="button" onClick={onRefresh} disabled={status === 'loading'} aria-label="Refresh weather">
          <Icon name="refresh" size={17} />
        </button>
      </header>

      {status === 'loading' && !forecast && (
        <div className="travel-tool-loading">
          <span className="loading-spinner" />
          <p>Loading the latest forecast…</p>
        </div>
      )}

      {error && !forecast && (
        <div className="travel-tool-error">
          <Icon name="cloud" size={28} />
          <strong>Weather unavailable</strong>
          <p>{error}</p>
          <button className="text-link" type="button" onClick={onRefresh}>Try again</button>
        </div>
      )}

      {forecast && (
        <>
          <section className="weather-current">
            <span className="weather-current__icon"><Icon name={currentPresentation.icon} size={35} /></span>
            <div>
              <strong>{formatTemperature(forecast.current.temperature)}</strong>
              <span>{currentPresentation.label}</span>
            </div>
            <dl>
              <div><dt>Feels like</dt><dd>{formatTemperature(forecast.current.apparentTemperature)}</dd></div>
              <div><dt>Humidity</dt><dd>{Number.isFinite(forecast.current.humidity) ? `${forecast.current.humidity}%` : '—'}</dd></div>
              <div><dt>Wind</dt><dd>{Number.isFinite(forecast.current.windSpeed) ? `${Math.round(forecast.current.windSpeed)} km/h` : '—'}</dd></div>
            </dl>
          </section>

          <div className="weather-forecast" aria-label="Seven day weather forecast">
            {forecast.days.slice(0, 7).map((day) => {
              const presentation = getWeatherPresentation(day.weatherCode);
              return (
                <article key={day.date}>
                  <strong>{formatWeatherDay(day.date)}</strong>
                  <Icon name={presentation.icon} size={20} />
                  <span>{formatTemperature(day.temperatureMax)} / {formatTemperature(day.temperatureMin)}</span>
                  <small>{Number.isFinite(day.precipitationProbability) ? `${day.precipitationProbability}% rain` : presentation.label}</small>
                </article>
              );
            })}
          </div>

          <footer className="travel-tool-card__footer">
            <span>{forecast.fromCache ? 'Cached forecast' : 'Forecast refreshed'}</span>
            <span>Open-Meteo</span>
          </footer>
        </>
      )}
    </Card>
  );
}
