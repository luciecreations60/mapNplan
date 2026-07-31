import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';

export function StatCard({ icon, label, value, detail, tone = 'violet' }) {
  return (
    <Card className="stat-card">
      <span className={`stat-card__icon stat-card__icon--${tone}`}>
        <Icon name={icon} size={20} />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </Card>
  );
}
