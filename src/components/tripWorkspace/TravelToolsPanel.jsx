import { useCallback, useEffect, useState } from 'react';
import { weatherService } from '../../services/weather/WeatherService.js';
import { getPrimaryTripLocation } from '../../utils/travelTools.js';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { CurrencyConverter } from './tools/CurrencyConverter.jsx';
import { LocalTimeCard } from './tools/LocalTimeCard.jsx';
import { WeatherCard } from './tools/WeatherCard.jsx';

export function TravelToolsPanel({ trip, onOpenTab }) {
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
      setError(loadError.message || 'The forecast could not be loaded.');
      setStatus('error');
    }
  }, [location?.latitude, location?.longitude]);

  useEffect(() => {
    loadForecast(false);
  }, [loadForecast]);

  if (!location) {
    return (
      <Card className="travel-tools-empty">
        <span><Icon name="map" size={30} /></span>
        <p className="eyebrow">Travel tools</p>
        <h2>Add one mapped place first</h2>
        <p>Weather and local time need coordinates. Add latitude and longitude to an itinerary activity or reservation.</p>
        <div>
          <button className="button button--primary button--medium" type="button" onClick={() => onOpenTab('itinerary')}>Open itinerary</button>
          <button className="button button--secondary button--medium" type="button" onClick={() => onOpenTab('reservations')}>Open reservations</button>
        </div>
      </Card>
    );
  }

  return (
    <div className="travel-tools-panel">
      <section className="travel-tools-heading">
        <div>
          <p className="eyebrow">Travel companion</p>
          <h2>Useful information at a glance</h2>
          <p>Live conditions use the first mapped itinerary location: <strong>{location.label}</strong>.</p>
        </div>
        <span><Icon name="sparkles" /> No account or API key required</span>
      </section>

      <div className="travel-tools-grid">
        <WeatherCard
          forecast={forecast}
          location={location}
          status={status}
          error={error}
          onRefresh={() => loadForecast(true)}
        />
        <div className="travel-tools-grid__side">
          <LocalTimeCard
            timezone={forecast?.timezone}
            timezoneAbbreviation={forecast?.timezoneAbbreviation}
            locationLabel={location.label}
          />
          <CurrencyConverter
            baseCurrency={trip.currency}
            destinationCurrency={trip.destinationCurrency}
          />
        </div>
      </div>

      <Card className="travel-tools-disclaimer">
        <Icon name="info" size={18} />
        <p>Weather forecasts and exchange rates are informational. Confirm critical travel decisions with official providers and your bank.</p>
      </Card>
    </div>
  );
}
