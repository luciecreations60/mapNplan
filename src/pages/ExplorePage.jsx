import { Button } from '../components/common/Button.jsx';
import { Card } from '../components/common/Card.jsx';
import { Icon } from '../components/common/Icon.jsx';
import { useI18n } from '../hooks/useI18n.js';

const DESTINATIONS = [
  { city: 'Kyoto', country: 'Japan', tagKey: 'explore.cultureFood', accent: 'violet', range: '5–7' },
  { city: 'Reykjavík', country: 'Iceland', tagKey: 'explore.natureRoadTrip', accent: 'aqua', range: '7–10' },
  { city: 'Florence', country: 'Italy', tagKey: 'explore.artFood', accent: 'coral', range: '3–5' },
];

export function ExplorePage() {
  const { t } = useI18n();

  return (
    <div className="page-stack">
      <section className="explore-hero">
        <div>
          <p className="eyebrow">{t('explore.eyebrow')}</p>
          <h1>{t('explore.title')}</h1>
          <p>{t('explore.intro')}</p>
          <div className="explore-search">
            <Icon name="search" size={20} />
            <input aria-label={t('explore.searchAria')} placeholder={t('explore.searchPlaceholder')} />
            <Button>{t('explore.action')}</Button>
          </div>
        </div>
        <div className="explore-hero__art" aria-hidden="true">
          <span className="explore-hero__globe"><Icon name="globe" size={86} strokeWidth={1.15} /></span>
          <span className="explore-hero__pin explore-hero__pin--one"><Icon name="pin" size={24} /></span>
          <span className="explore-hero__pin explore-hero__pin--two"><Icon name="pin" size={20} /></span>
          <span className="explore-hero__plane"><Icon name="plane" size={36} /></span>
        </div>
      </section>

      <section className="content-section">
        <header className="section-heading">
          <div>
            <p className="eyebrow">{t('explore.ideas')}</p>
            <h2>{t('explore.destinations')}</h2>
          </div>
        </header>
        <div className="destination-grid">
          {DESTINATIONS.map((destination) => (
            <Card key={destination.city} className={`destination-card destination-card--${destination.accent}`}>
              <div className="destination-card__art"><Icon name="map" size={42} /></div>
              <div className="destination-card__body">
                <span>{t(destination.tagKey)}</span>
                <h3>{destination.city}</h3>
                <p>{destination.country} · {t('explore.days', { range: destination.range })}</p>
                <button className="text-link" type="button">{t('explore.seeIdea')} <Icon name="arrowRight" size={16} /></button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
