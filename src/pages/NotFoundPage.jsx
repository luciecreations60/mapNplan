import { Link } from 'react-router-dom';
import { Icon } from '../components/common/Icon.jsx';
import { useI18n } from '../hooks/useI18n.js';

export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <section className="empty-state empty-state--page">
      <span><Icon name="map" size={32} /></span>
      <p className="eyebrow">404</p>
      <h1>{t('notFound.title')}</h1>
      <p>{t('notFound.text')}</p>
      <Link className="button button--primary button--medium" to="/dashboard">{t('notFound.back')}</Link>
    </section>
  );
}
