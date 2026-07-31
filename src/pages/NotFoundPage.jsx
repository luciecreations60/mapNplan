import { Link } from 'react-router-dom';
import { Icon } from '../components/common/Icon.jsx';

export function NotFoundPage() {
  return (
    <section className="empty-state empty-state--page">
      <span><Icon name="map" size={32} /></span>
      <p className="eyebrow">404</p>
      <h1>This route is not on the map</h1>
      <p>Return to your dashboard and continue planning.</p>
      <Link className="button button--primary button--medium" to="/dashboard">Back to dashboard</Link>
    </section>
  );
}
