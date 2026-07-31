import { Button } from '../components/common/Button.jsx';
import { Card } from '../components/common/Card.jsx';
import { Icon } from '../components/common/Icon.jsx';

const DESTINATIONS = [
  { city: 'Kyoto', country: 'Japan', tag: 'Culture & food', accent: 'violet', days: '5–7 days' },
  { city: 'Reykjavík', country: 'Iceland', tag: 'Nature & road trip', accent: 'aqua', days: '7–10 days' },
  { city: 'Florence', country: 'Italy', tag: 'Art & gastronomy', accent: 'coral', days: '3–5 days' },
];

export function ExplorePage() {
  return (
    <div className="page-stack">
      <section className="explore-hero">
        <div>
          <p className="eyebrow">Inspiration</p>
          <h1>Where will you go next?</h1>
          <p>Discover a destination, estimate the rhythm of your stay and turn inspiration into a trip.</p>
          <div className="explore-search">
            <Icon name="search" size={20} />
            <input aria-label="Search a destination" placeholder="Search a city, country or travel style" />
            <Button>Explore</Button>
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
            <p className="eyebrow">Starter ideas</p>
            <h2>Destinations to explore</h2>
          </div>
        </header>
        <div className="destination-grid">
          {DESTINATIONS.map((destination) => (
            <Card key={destination.city} className={`destination-card destination-card--${destination.accent}`}>
              <div className="destination-card__art"><Icon name="map" size={42} /></div>
              <div className="destination-card__body">
                <span>{destination.tag}</span>
                <h3>{destination.city}</h3>
                <p>{destination.country} · {destination.days}</p>
                <button className="text-link" type="button">See trip idea <Icon name="arrowRight" size={16} /></button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
