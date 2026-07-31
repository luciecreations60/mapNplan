import { useMemo } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { getTripMapPoints } from '../../utils/map.js';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { TripMap } from './TripMap.jsx';

export function MapPanel({ trip, onOpenTab }) {
  const { t } = useI18n();
  const points = useMemo(() => getTripMapPoints(trip), [trip]);

  return (
    <div className="workspace-section">
      <section className="workspace-section__heading">
        <div><p className="eyebrow">{t('map.eyebrow')}</p><h2>{t('map.title')}</h2><p>{t('map.intro')}</p></div>
      </section>

      <div className="map-workspace-grid">
        <Card className="map-card">
          {points.length > 0 ? (
            <TripMap points={points} />
          ) : (
            <section className="workspace-large-empty workspace-large-empty--compact">
              <span><Icon name="map" size={28} /></span>
              <h3>{t('map.emptyTitle')}</h3>
              <p>{t('map.emptyText')}</p>
              <button className="button button--primary button--medium" type="button" onClick={() => onOpenTab('itinerary')}>
                {t('map.addCoordinates')}
              </button>
            </section>
          )}
        </Card>

        <Card className="map-place-list">
          <header className="workspace-panel__header">
            <div>
              <p className="eyebrow">{t('map.mappedPlaces')}</p>
              <h2>{t(points.length === 1 ? 'map.location' : 'map.locations', { count: points.length })}</h2>
            </div>
          </header>

          {points.length > 0 ? (
            <div className="map-place-list__items">
              {points.map((point, index) => (
                <article key={point.id} className="map-place-row">
                  <span className="map-place-row__number">{index + 1}</span>
                  <div>
                    <small>{point.source === 'reservation' ? t('map.reservation') : point.source === 'destination' ? t('map.destination') : t('map.itinerary')}</small>
                    <strong>{point.title}</strong>
                    <p><Icon name="pin" size={13} /> {point.subtitle || t('map.savedCoordinates')}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : <p className="map-place-list__empty">{t('map.mappedEmpty')}</p>}
        </Card>
      </div>
    </div>
  );
}
