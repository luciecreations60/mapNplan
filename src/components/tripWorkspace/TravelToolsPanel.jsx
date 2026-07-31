import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { weatherService } from '../../services/weather/WeatherService.js';
import { getPrimaryTripLocation } from '../../utils/travelTools.js';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { CurrencyConverter } from './tools/CurrencyConverter.jsx';
import { LocalTimeCard } from './tools/LocalTimeCard.jsx';
import { WeatherCard } from './tools/WeatherCard.jsx';

export function TravelToolsPanel({ trip, onOpenTab }) {
  const { t } = useI18n();
  const location = getPrimaryTripLocation(trip);
  const [forecast, setForecast] = useState(null);
  const [status, setStatus] = useState(location ? 'loading' : 'idle');
  const [error, setError] = useState('');

  const loadForecast = useCallback(async (forceRefresh = false) => {
    if (!location) return;
    setStatus('loading');
    setError('');
    try {
      const result = await weatherService.getForecast({
        latitude: location.latitude,
        longitude: location.longitude,
        forceRefresh,
      });
      setForecast(result);
      setStatus('success');
    } catch (loadError) {
      setError(loadError.message || t('tools.forecastLoadError'));
      setStatus('error');
    }
  }, [location?.latitude, location?.longitude, t]);

  useEffect(() => {
    loadForecast(false);
  }, [loadForecast]);

  if (!location) {
    return (
      <Card className="travel-tools-empty">
        <span><Icon name="map" size={30} /></span>
        <p className="eyebrow">{t('tools.title')}</p>
        <h2>{t('tools.emptyTitle')}</h2>
        <p>{t('tools.emptyText')}</p>
        <div>
          <button className="button button--primary button--medium" type="button" onClick={() => onOpenTab('itinerary')}>{t('tools.openItinerary')}</button>
          <button className="button button--secondary button--medium" type="button" onClick={() => onOpenTab('reservations')}>{t('tools.openReservations')}</button>
        </div>
      </Card>
    );
  }

  return (
    <div className="travel-tools-panel">
      <section className="travel-tools-heading">
        <div>
          <p className="eyebrow">{t('tools.eyebrow')}</p>
          <h2>{t('tools.heading')}</h2>
          <p>{t('tools.liveFrom')} <strong>{location.label}</strong>.</p>
        </div>
        <span><Icon name="sparkles" /> {t('tools.noKey')}</span>
      </section>

      <div className="travel-tools-grid">
        <WeatherCard forecast={forecast} location={location} status={status} error={error} onRefresh={() => loadForecast(true)} />
        <div className="travel-tools-grid__side">
          <LocalTimeCard timezone={forecast?.timezone} timezoneAbbreviation={forecast?.timezoneAbbreviation} locationLabel={location.label} />
          <CurrencyConverter baseCurrency={trip.currency} destinationCurrency={trip.destinationCurrency} />
        </div>
      </div>

      <Card className="travel-tools-disclaimer"><Icon name="info" size={18} /><p>{t('tools.disclaimer')}</p></Card>
    </div>
  );
}
