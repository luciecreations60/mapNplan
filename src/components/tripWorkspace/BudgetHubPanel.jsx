import { useI18n } from '../../hooks/useI18n.js';
import { BudgetPanel } from './BudgetPanel.jsx';
import { SharedExpensesPanel } from './SharedExpensesPanel.jsx';

export function BudgetHubPanel({ trip, onUpdate }) {
  const { t } = useI18n();
  return (
    <div className="budget-hub budget-hub--unified">
      <section aria-labelledby="budget-overview-title">
        <h2 id="budget-overview-title" className="sr-only">{t('budgetHub.overview')}</h2>
        <BudgetPanel trip={trip} onUpdate={onUpdate} />
      </section>
      <section aria-labelledby="budget-group-title">
        <h2 id="budget-group-title" className="sr-only">{t('budgetHub.group')}</h2>
        <SharedExpensesPanel trip={trip} onUpdate={onUpdate} />
      </section>
    </div>
  );
}
