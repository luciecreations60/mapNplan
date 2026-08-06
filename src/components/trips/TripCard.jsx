import { Link } from 'react-router-dom';
import { useI18n } from '../../hooks/useI18n.js';
import { formatCurrency } from '../../utils/currency.js';
import { formatDateRange, getTripStatus } from '../../utils/date.js';
import { Badge } from '../common/Badge.jsx';
import { Icon } from '../common/Icon.jsx';
import { ProgressBar } from '../common/ProgressBar.jsx';

const STATUS_KEYS = {
  upcoming: 'trips.statusUpcoming',
  ongoing: 'trips.statusOngoing',
  past: 'trips.statusPast',
  draft: 'trips.statusDraft',
  archived: 'trips.statusArchived',
};

const STATUS_TONES = {
  upcoming: 'primary',
  ongoing: 'success',
  past: 'neutral',
  draft: 'warning',
  archived: 'neutral',
};

export function TripCard({
  trip,
  onEdit,
  onDuplicate,
  onToggleFavorite,
  onTogglePinned,
  onArchive,
  onRestore,
  onDelete,
}) {
  const { locale, t } = useI18n();
  const status = trip.archivedAt ? 'archived' : getTripStatus(trip);
  const budgetProgress = trip.budget > 0 ? (trip.spent / trip.budget) * 100 : 0;
  const coverStyle = trip.coverImageUrl ? {
    backgroundImage: `linear-gradient(135deg, rgba(8, 38, 49, .26), rgba(8, 38, 49, .58)), url(${JSON.stringify(trip.coverImageUrl)})`,
  } : undefined;

  return (
    <article className={`trip-card trip-card--${trip.accent}${trip.archivedAt ? ' trip-card--archived' : ''}${trip.pinnedAt ? ' trip-card--pinned' : ''}`}>
      <div className={trip.coverImageUrl ? "trip-card__visual trip-card__visual--cover" : "trip-card__visual"} style={coverStyle}>
        <div className="trip-card__visual-grid" />
        <span className="trip-card__country">{trip.countryCode || '✦'}</span>
        <Badge tone={STATUS_TONES[status]}>{t(STATUS_KEYS[status])}</Badge>
      </div>

      <div className="trip-card__body">
        <div className="trip-card__heading">
          <div>
            <p className="trip-card__destination"><Icon name="pin" size={15} /> {trip.destination}</p>
            <h3>{trip.name}</h3>
          </div>
          {(onEdit || onDuplicate || onToggleFavorite || onTogglePinned) && <div className="trip-card__quick-actions">
            {!trip.archivedAt && onToggleFavorite && (
              <button
                className={trip.isFavorite ? 'icon-button icon-button--small icon-button--active' : 'icon-button icon-button--small'}
                type="button"
                aria-pressed={trip.isFavorite}
                aria-label={t(trip.isFavorite ? 'tripLibrary.removeFavoriteAria' : 'tripLibrary.addFavoriteAria', { name: trip.name })}
                title={t(trip.isFavorite ? 'tripLibrary.removeFavorite' : 'tripLibrary.addFavorite')}
                onClick={() => onToggleFavorite(trip)}
              >
                <Icon name="star" size={16} />
              </button>
            )}
            {!trip.archivedAt && onTogglePinned && (
              <button
                className={trip.pinnedAt ? 'icon-button icon-button--small icon-button--active' : 'icon-button icon-button--small'}
                type="button"
                aria-pressed={Boolean(trip.pinnedAt)}
                aria-label={t(trip.pinnedAt ? 'tripLibrary.unpinAria' : 'tripLibrary.pinAria', { name: trip.name })}
                title={t(trip.pinnedAt ? 'tripLibrary.unpin' : 'tripLibrary.pin')}
                onClick={() => onTogglePinned(trip)}
              >
                <Icon name={trip.pinnedAt ? 'pinOff' : 'pinTrip'} size={16} />
              </button>
            )}
            {!trip.archivedAt && onEdit && (
              <button
                className="icon-button icon-button--small"
                type="button"
                aria-label={`${t('common.edit')} ${trip.name}`}
                title={t('common.edit')}
                onClick={() => onEdit(trip)}
              >
                <Icon name="edit" size={16} />
              </button>
            )}
            {onDuplicate && (
              <button
                className="icon-button icon-button--small"
                type="button"
                aria-label={`${t('trips.duplicate')} ${trip.name}`}
                title={t('trips.duplicate')}
                onClick={() => onDuplicate(trip)}
              >
                <Icon name="copy" size={16} />
              </button>
            )}
          </div>}
        </div>

        <p className="trip-card__dates">
          <Icon name="calendar" size={16} />
          {formatDateRange(trip.startDate, trip.endDate, locale, t('trips.datesTbc'))}
        </p>
        <p className="trip-card__summary">{trip.summary}</p>

        <div className="trip-card__budget">
          <div className="trip-card__budget-label">
            <span>{t('trips.spent', { amount: formatCurrency(trip.spent, trip.currency, locale) })}</span>
            <strong>{formatCurrency(trip.budget, trip.currency, locale)}</strong>
          </div>
          <ProgressBar value={budgetProgress} label={t('trips.budgetAria', { name: trip.name })} />
        </div>

        <footer className="trip-card__footer">
          <span>
            <Icon name="users" size={16} />
            {t(trip.travelers === 1 ? 'trips.traveller' : 'trips.travellers', { count: trip.travelers })}
          </span>
          {!trip.archivedAt && (
            <Link className="text-link" to={`/trips/${trip.id}`}>
              {t('trips.openPlanner')} <Icon name="arrowRight" size={16} />
            </Link>
          )}
        </footer>

        {(onArchive || onRestore || onDelete) && (
          <div className="trip-card__management">
            {trip.archivedAt && onRestore && (
              <button className="trip-card__management-button" type="button" onClick={() => onRestore(trip)}>
                <Icon name="restore" size={15} /> {t('trips.restore')}
              </button>
            )}
            {!trip.archivedAt && onArchive && (
              <button className="trip-card__management-button" type="button" onClick={() => onArchive(trip)}>
                <Icon name="archive" size={15} /> {t('trips.archive')}
              </button>
            )}
            {onDelete && (
              <button className="trip-card__management-button trip-card__management-button--danger" type="button" onClick={() => onDelete(trip)}>
                <Icon name="trash" size={15} /> {t('common.delete')}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
