import { useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { Icon } from '../common/Icon.jsx';
import { BudgetPanel } from './BudgetPanel.jsx';
import { SharedExpensesPanel } from './SharedExpensesPanel.jsx';

export function BudgetHubPanel({ trip, onUpdate }) {
  const { t } = useI18n();
  const [section, setSection] = useState('overview');

  return (
    <div className="budget-hub">
      <div className="budget-hub__switch" role="tablist" aria-label={t('budgetHub.aria')}>
        <button
          type="button"
          role="tab"
          aria-selected={section === 'overview'}
          className={section === 'overview' ? 'budget-hub__button budget-hub__button--active' : 'budget-hub__button'}
          onClick={() => setSection('overview')}
        >
          <Icon name="wallet" size={17} />
          {t('budgetHub.overview')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === 'group'}
          className={section === 'group' ? 'budget-hub__button budget-hub__button--active' : 'budget-hub__button'}
          onClick={() => setSection('group')}
        >
          <Icon name="users" size={17} />
          {t('budgetHub.group')}
        </button>
      </div>

      <div role="tabpanel">
        {section === 'overview'
          ? <BudgetPanel trip={trip} onUpdate={onUpdate} />
          : <SharedExpensesPanel trip={trip} onUpdate={onUpdate} />}
      </div>
    </div>
  );
}
