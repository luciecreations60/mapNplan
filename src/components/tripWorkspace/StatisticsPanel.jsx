import { useMemo } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { formatCurrency } from '../../utils/currency.js';
import { buildTripStatistics } from '../../utils/tripStatistics.js';
import { getOptionLabel } from '../../utils/tripWorkspace.js';
import { Icon } from '../common/Icon.jsx';
import { ProgressBar } from '../common/ProgressBar.jsx';

export function StatisticsPanel({ trip }) {
  const { locale, t } = useI18n();
  const statistics = useMemo(() => buildTripStatistics(trip), [trip]);
  const maxCategoryAmount = Math.max(1, ...statistics.expenseCategories.map((item) => item.amount));

  const metrics = [
    { icon: 'calendarDays', label: t('statistics.tripLength'), value: t('statistics.days', { count: statistics.tripDays }), detail: t('statistics.plannedDays', { count: statistics.plannedDays }) },
    { icon: 'ticket', label: t('statistics.activities'), value: statistics.activities, detail: t('statistics.averagePerDay', { count: statistics.averageActivitiesPerPlannedDay.toFixed(1) }) },
    { icon: 'pin', label: t('statistics.mappedPlaces'), value: statistics.mappedPlaces, detail: t('statistics.readyForMap') },
    { icon: 'folder', label: t('statistics.travelRecords'), value: statistics.reservations + statistics.documents, detail: t('statistics.recordsDetail', { reservations: statistics.reservations, documents: statistics.documents }) },
  ];

  return (
    <div className="workspace-section statistics-panel">
      <section className="workspace-section__heading">
        <div>
          <p className="eyebrow">{t('statistics.eyebrow')}</p>
          <h2>{t('statistics.title')}</h2>
          <p>{t('statistics.intro')}</p>
        </div>
      </section>

      <div className="statistics-metrics">
        {metrics.map((metric) => (
          <article key={metric.label} className="statistics-metric">
            <span><Icon name={metric.icon} size={20} /></span>
            <div>
              <small>{metric.label}</small>
              <strong>{metric.value}</strong>
              <p>{metric.detail}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="statistics-grid">
        <article className="statistics-card">
          <div className="statistics-card__heading">
            <div>
              <p className="eyebrow">{t('statistics.budget')}</p>
              <h3>{t('statistics.expenseBreakdown')}</h3>
            </div>
            <strong>{formatCurrency(statistics.plannedExpense, trip.currency, locale)}</strong>
          </div>

          <div className="statistics-budget-summary">
            <div>
              <span>{t('statistics.paid')}</span>
              <strong>{formatCurrency(statistics.paidExpense, trip.currency, locale)}</strong>
            </div>
            <div>
              <span>{t('statistics.activityEstimates')}</span>
              <strong>{formatCurrency(statistics.estimatedActivityCost, trip.currency, locale)}</strong>
            </div>
            <div>
              <span>{t('statistics.budgetUsage')}</span>
              <strong>{Math.round(statistics.budgetUsage)}%</strong>
            </div>
          </div>
          <ProgressBar value={statistics.budgetUsage} label={t('statistics.budgetUsage')} />

          {statistics.expenseCategories.length > 0 ? (
            <div className="statistics-bars">
              {statistics.expenseCategories.map((category) => (
                <div key={category.id} className="statistics-bar">
                  <div>
                    <span>{getOptionLabel(statistics.expenseCategories, category.id, t)}</span>
                    <strong>{formatCurrency(category.amount, trip.currency, locale)}</strong>
                  </div>
                  <span className="statistics-bar__track">
                    <span style={{ width: `${(category.amount / maxCategoryAmount) * 100}%` }} />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="statistics-empty">{t('statistics.noExpenses')}</p>
          )}
        </article>

        <article className="statistics-card">
          <div className="statistics-card__heading">
            <div>
              <p className="eyebrow">{t('statistics.readiness')}</p>
              <h3>{t('statistics.preparationStatus')}</h3>
            </div>
          </div>

          <div className="statistics-ring-row">
            <div className="statistics-ring" style={{ '--progress': `${statistics.checklistProgress * 3.6}deg` }}>
              <span>{statistics.checklistProgress}%</span>
            </div>
            <div>
              <strong>{t('statistics.checklistReady')}</strong>
              <p>{t('statistics.checklistText')}</p>
            </div>
          </div>

          <div className="statistics-status-list">
            {statistics.reservationStatuses.map((status) => (
              <div key={status.id}>
                <span className={`statistics-status-dot statistics-status-dot--${status.id}`} />
                <span>{getOptionLabel(statistics.reservationStatuses, status.id, t)}</span>
                <strong>{status.count}</strong>
              </div>
            ))}
          </div>

          <div className="statistics-duration">
            <Icon name="clock" size={18} />
            <span>{t('statistics.plannedTime')}</span>
            <strong>{formatDuration(statistics.totalActivityMinutes, t)}</strong>
          </div>
        </article>
      </div>
    </div>
  );
}

function formatDuration(totalMinutes, t) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return t('statistics.minutes', { count: minutes });
  if (!minutes) return t('statistics.hours', { count: hours });
  return t('statistics.hoursMinutes', { hours, minutes });
}
