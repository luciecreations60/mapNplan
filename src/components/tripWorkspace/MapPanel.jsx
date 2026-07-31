import { useMemo } from 'react';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { TripMap } from './TripMap.jsx';
import { getTripMapPoints } from '../../utils/map.js';

export function MapPanel({ trip, onOpenTab }) {
  const points = useMemo(() => getTripMapPoints(trip), [trip]);

  return (
    <div className="workspace-section">
      <section className="workspace-section__heading">
        <div>
          <p className="eyebrow">Visual planning</p>
          <h2>Trip map</h2>
          <p>See itinerary stops and geolocated reservations in one place.</p>
        </div>
      </section>

      <div className="map-workspace-grid">
        <Card className="map-card">
          {points.length > 0 ? (
            <TripMap points={points} />
          ) : (
            <section className="workspace-large-empty workspace-large-empty--compact">
              <span><Icon name="map" size={28} /></span>
              <h3>No mapped places yet</h3>
              <p>Add latitude and longitude to itinerary activities or reservations.</p>
              <button className="button button--primary button--medium" type="button" onClick={() => onOpenTab('itinerary')}>
                Add itinerary coordinates
              </button>
            </section>
          )}
        </Card>

        <Card className="map-place-list">
          <header className="workspace-panel__header">
            <div>
              <p className="eyebrow">Mapped places</p>
              <h2>{points.length} location{points.length === 1 ? '' : 's'}</h2>
            </div>
          </header>

          {points.length > 0 ? (
            <div className="map-place-list__items">
              {points.map((point, index) => (
                <article key={point.id} className="map-place-row">
                  <span className="map-place-row__number">{index + 1}</span>
                  <div>
                    <small>{point.source === 'reservation' ? 'Reservation' : 'Itinerary'}</small>
                    <strong>{point.title}</strong>
                    <p><Icon name="pin" size={13} /> {point.subtitle || 'Saved coordinates'}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="map-place-list__empty">Mapped locations will appear here.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
