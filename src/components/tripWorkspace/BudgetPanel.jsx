import { useMemo, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { formatCurrency } from '../../utils/currency.js';
import { formatLocalizedDate } from '../../utils/date.js';
import { createId } from '../../utils/id.js';
import {
  EXPENSE_CATEGORIES,
  getCategoryLabel,
  getPaidExpenseTotal,
  getPlannedExpenseTotal,
} from '../../utils/tripWorkspace.js';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { ProgressBar } from '../common/ProgressBar.jsx';

const EMPTY_FORM = {
  label: '', category: 'transport', amount: '', date: '', paid: true,
};

export function BudgetPanel({ trip, onUpdate }) {
  const { locale, t } = useI18n();
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, date: new Date().toISOString().slice(0, 10) }));
  const [isFormOpen, setFormOpen] = useState(false);

  const paidTotal = getPaidExpenseTotal(trip.expenses);
  const plannedTotal = getPlannedExpenseTotal(trip.expenses);
  const remaining = Math.max(0, trip.budget - paidTotal);
  const progress = trip.budget > 0 ? (paidTotal / trip.budget) * 100 : 0;

  const categoryTotals = useMemo(
    () => EXPENSE_CATEGORIES
      .map((category) => ({
        ...category,
        total: trip.expenses
          .filter((expense) => expense.category === category.id)
          .reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
      }))
      .filter((category) => category.total > 0)
      .sort((left, right) => right.total - left.total),
    [trip.expenses],
  );

  function updateField(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  function normalizeAmount() {
    setForm((current) => ({ ...current, amount: formatMoneyInput(current.amount) }));
  }

  function submitExpense(event) {
    event.preventDefault();
    if (!form.label.trim() || Number(form.amount) <= 0) return;

    const amount = Number(form.amount);
    const currentParticipant = trip.travelParty?.find((participant) => participant.isCurrentUser)
      || trip.travelParty?.[0];

    onUpdate({
      expenses: [
        ...trip.expenses,
        {
          id: createId('expense'),
          label: form.label.trim(),
          category: form.category,
          amount,
          paidAmount: form.paid ? amount : 0,
          date: form.date,
          paid: form.paid,
          paidById: currentParticipant?.id || null,
          splitBetweenIds: (trip.travelParty || []).map((participant) => participant.id),
          notes: '',
        },
      ],
    });

    setForm((current) => ({ ...EMPTY_FORM, date: current.date, paid: true }));
    setFormOpen(false);
  }

  function togglePaid(expenseId) {
    onUpdate({
      expenses: trip.expenses.map((expense) => {
        if (expense.id !== expenseId) return expense;
        const isFullyPaid = Number(expense.paidAmount || 0) >= Number(expense.amount || 0);
        return {
          ...expense,
          paid: !isFullyPaid,
          paidAmount: isFullyPaid ? 0 : Number(expense.amount || 0),
        };
      }),
    });
  }

  function removeExpense(expenseId) {
    onUpdate({ expenses: trip.expenses.filter((expense) => expense.id !== expenseId) });
  }

  return (
    <div className="workspace-section">
      <section className="workspace-section__heading">
        <div>
          <p className="eyebrow">{t('budget.eyebrow')}</p>
          <h2>{t('budget.title')}</h2>
          <p>{t('budget.intro')}</p>
        </div>
        <Button icon={isFormOpen ? 'close' : 'plus'} onClick={() => setFormOpen((value) => !value)}>
          {isFormOpen ? t('common.close') : t('budget.addExpense')}
        </Button>
      </section>

      <section className="budget-kpi-grid">
        <Card className="budget-kpi">
          <span>{t('budget.tripBudget')}</span>
          <strong>{formatCurrency(trip.budget, trip.currency, locale)}</strong>
          <small>{t('budget.maxPlanned')}</small>
        </Card>
        <Card className="budget-kpi">
          <span>{t('budget.paid')}</span>
          <strong>{formatCurrency(paidTotal, trip.currency, locale)}</strong>
          <small>{t('budget.confirmed')}</small>
        </Card>
        <Card className="budget-kpi">
          <span>{t('budget.plannedTotal')}</span>
          <strong>{formatCurrency(plannedTotal, trip.currency, locale)}</strong>
          <small>{t('budget.paidEstimated')}</small>
        </Card>
        <Card className="budget-kpi budget-kpi--primary">
          <span>{t('budget.remaining')}</span>
          <strong>{formatCurrency(remaining, trip.currency, locale)}</strong>
          <ProgressBar value={progress} label={t('budget.budgetUsed')} tone="light" />
        </Card>
      </section>

      {isFormOpen && (
        <Card className="workspace-form-card">
          <form className="workspace-form" onSubmit={submitExpense}>
            <div className="workspace-form__grid">
              <Field label={t('budget.expense')} className="workspace-form__wide">
                <input name="label" value={form.label} onChange={updateField} placeholder={t('budget.placeholder')} required />
              </Field>
              <Field label={t('budget.category')}>
                <select name="category" value={form.category} onChange={updateField}>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>{t(category.labelKey)}</option>
                  ))}
                </select>
              </Field>
              <Field label={`${t('tools.amount')} (${trip.currency})`}>
                <input name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={updateField} onBlur={normalizeAmount} required />
              </Field>
              <Field label={t('budget.date')}>
                <input name="date" type="date" value={form.date} onChange={updateField} />
              </Field>
              <label className="workspace-checkbox-field">
                <input name="paid" type="checkbox" checked={form.paid} onChange={updateField} />
                <span><strong>{t('budget.alreadyPaid')}</strong><small>{t('budget.includePaid')}</small></span>
              </label>
            </div>
            <div className="workspace-form__actions">
              <Button variant="ghost" onClick={() => setFormOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit" icon="plus">{t('budget.saveExpense')}</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="budget-content-grid">
        <Card className="workspace-panel">
          <header className="workspace-panel__header">
            <div><p className="eyebrow">{t('budget.breakdown')}</p><h2>{t('budget.byCategory')}</h2></div>
          </header>
          {categoryTotals.length > 0 ? (
            <div className="category-breakdown">
              {categoryTotals.map((category) => {
                const percentage = plannedTotal > 0 ? (category.total / plannedTotal) * 100 : 0;
                const categoryLabel = t(category.labelKey);
                return (
                  <div key={category.id} className="category-breakdown__row">
                    <div><span>{categoryLabel}</span><strong>{formatCurrency(category.total, trip.currency, locale)}</strong></div>
                    <ProgressBar value={percentage} label={categoryLabel} />
                  </div>
                );
              })}
            </div>
          ) : <p className="workspace-muted-copy">{t('budget.noBreakdown')}</p>}
        </Card>

        <Card className="workspace-panel">
          <header className="workspace-panel__header">
            <div><p className="eyebrow">{t('budget.transactions')}</p><h2>{t('budget.expenses')}</h2></div>
            <span className="workspace-count">{trip.expenses.length}</span>
          </header>

          {trip.expenses.length > 0 ? (
            <div className="expense-list">
              {[...trip.expenses].reverse().map((expense) => (
                <article key={expense.id} className="expense-row">
                  <button
                    className={Number(expense.paidAmount || 0) >= Number(expense.amount || 0) ? 'expense-row__status expense-row__status--paid' : 'expense-row__status'}
                    type="button"
                    aria-label={Number(expense.paidAmount || 0) >= Number(expense.amount || 0) ? `${t('budget.paid')}: ${expense.label}` : `${t('budget.plannedTotal')}: ${expense.label}`}
                    onClick={() => togglePaid(expense.id)}
                  >
                    <Icon name={Number(expense.paidAmount || 0) >= Number(expense.amount || 0) ? 'check' : 'circle'} size={16} />
                  </button>
                  <div>
                    <strong>{expense.label}</strong>
                    <small>
                      {getCategoryLabel(EXPENSE_CATEGORIES, expense.category, t)}
                      {expense.date && ` · ${formatExpenseDate(expense.date, locale)}`}
                    </small>
                  </div>
                  <span className={Number(expense.paidAmount || 0) >= Number(expense.amount || 0) ? 'expense-row__amount' : 'expense-row__amount expense-row__amount--planned'}>
                    {formatCurrency(expense.amount, trip.currency, locale)}
                  </span>
                  <button className="icon-button icon-button--small" type="button" aria-label={`${t('common.delete')} ${expense.label}`} onClick={() => removeExpense(expense.id)}>
                    <Icon name="trash" size={16} />
                  </button>
                </article>
              ))}
            </div>
          ) : <p className="workspace-muted-copy">{t('budget.noExpenses')}</p>}
        </Card>
      </div>
    </div>
  );
}

function Field({ label, className = '', children }) {
  return <label className={`workspace-field ${className}`.trim()}><span>{label}</span>{children}</label>;
}

function formatMoneyInput(value) {
  if (value === '') return '';
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number).toFixed(2) : '';
}

function formatExpenseDate(date, locale) {
  return formatLocalizedDate(date, locale, 'dayMonth');
}
