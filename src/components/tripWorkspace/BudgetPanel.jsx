import { useMemo, useState } from 'react';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { ProgressBar } from '../common/ProgressBar.jsx';
import { formatCurrency } from '../../utils/currency.js';
import { createId } from '../../utils/id.js';
import {
  EXPENSE_CATEGORIES,
  getCategoryLabel,
  getPaidExpenseTotal,
  getPlannedExpenseTotal,
} from '../../utils/tripWorkspace.js';

const EMPTY_FORM = {
  label: '',
  category: 'transport',
  amount: '',
  date: '',
  paid: true,
};

export function BudgetPanel({ trip, onUpdate }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    date: new Date().toISOString().slice(0, 10),
  }));
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
          .reduce((sum, expense) => sum + expense.amount, 0),
      }))
      .filter((category) => category.total > 0)
      .sort((left, right) => right.total - left.total),
    [trip.expenses],
  );

  function updateField(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  function submitExpense(event) {
    event.preventDefault();
    if (!form.label.trim() || Number(form.amount) <= 0) return;

    onUpdate({
      expenses: [
        ...trip.expenses,
        {
          id: createId('expense'),
          label: form.label.trim(),
          category: form.category,
          amount: Number(form.amount),
          date: form.date,
          paid: form.paid,
        },
      ],
    });

    setForm((current) => ({ ...EMPTY_FORM, date: current.date, paid: true }));
    setFormOpen(false);
  }

  function togglePaid(expenseId) {
    onUpdate({
      expenses: trip.expenses.map((expense) => (
        expense.id === expenseId ? { ...expense, paid: !expense.paid } : expense
      )),
    });
  }

  function removeExpense(expenseId) {
    onUpdate({
      expenses: trip.expenses.filter((expense) => expense.id !== expenseId),
    });
  }

  return (
    <div className="workspace-section">
      <section className="workspace-section__heading">
        <div>
          <p className="eyebrow">Money without spreadsheets</p>
          <h2>Budget</h2>
          <p>Separate paid expenses from future estimates and keep the total visible.</p>
        </div>
        <Button icon={isFormOpen ? 'close' : 'plus'} onClick={() => setFormOpen((value) => !value)}>
          {isFormOpen ? 'Close' : 'Add expense'}
        </Button>
      </section>

      <section className="budget-kpi-grid">
        <Card className="budget-kpi">
          <span>Trip budget</span>
          <strong>{formatCurrency(trip.budget, trip.currency)}</strong>
          <small>Maximum planned amount</small>
        </Card>
        <Card className="budget-kpi">
          <span>Paid</span>
          <strong>{formatCurrency(paidTotal, trip.currency)}</strong>
          <small>Confirmed transactions</small>
        </Card>
        <Card className="budget-kpi">
          <span>Planned total</span>
          <strong>{formatCurrency(plannedTotal, trip.currency)}</strong>
          <small>Paid and estimated</small>
        </Card>
        <Card className="budget-kpi budget-kpi--primary">
          <span>Remaining</span>
          <strong>{formatCurrency(remaining, trip.currency)}</strong>
          <ProgressBar value={progress} label="Budget used" tone="light" />
        </Card>
      </section>

      {isFormOpen && (
        <Card className="workspace-form-card">
          <form className="workspace-form" onSubmit={submitExpense}>
            <div className="workspace-form__grid">
              <Field label="Expense" className="workspace-form__wide">
                <input name="label" value={form.label} onChange={updateField} placeholder="Flights, hotel, museum tickets…" required />
              </Field>
              <Field label="Category">
                <select name="category" value={form.category} onChange={updateField}>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </select>
              </Field>
              <Field label={`Amount (${trip.currency})`}>
                <input name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={updateField} required />
              </Field>
              <Field label="Date">
                <input name="date" type="date" value={form.date} onChange={updateField} />
              </Field>
              <label className="workspace-checkbox-field">
                <input name="paid" type="checkbox" checked={form.paid} onChange={updateField} />
                <span>
                  <strong>Already paid</strong>
                  <small>Include this expense in the amount spent.</small>
                </span>
              </label>
            </div>
            <div className="workspace-form__actions">
              <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" icon="plus">Save expense</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="budget-content-grid">
        <Card className="workspace-panel">
          <header className="workspace-panel__header">
            <div>
              <p className="eyebrow">Breakdown</p>
              <h2>By category</h2>
            </div>
          </header>
          {categoryTotals.length > 0 ? (
            <div className="category-breakdown">
              {categoryTotals.map((category) => {
                const percentage = plannedTotal > 0 ? (category.total / plannedTotal) * 100 : 0;
                return (
                  <div key={category.id} className="category-breakdown__row">
                    <div>
                      <span>{category.label}</span>
                      <strong>{formatCurrency(category.total, trip.currency)}</strong>
                    </div>
                    <ProgressBar value={percentage} label={`${category.label} share`} />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="workspace-muted-copy">Add an expense to create the category breakdown.</p>
          )}
        </Card>

        <Card className="workspace-panel">
          <header className="workspace-panel__header">
            <div>
              <p className="eyebrow">Transactions</p>
              <h2>Expenses</h2>
            </div>
            <span className="workspace-count">{trip.expenses.length}</span>
          </header>

          {trip.expenses.length > 0 ? (
            <div className="expense-list">
              {[...trip.expenses].reverse().map((expense) => (
                <article key={expense.id} className="expense-row">
                  <button
                    className={expense.paid ? 'expense-row__status expense-row__status--paid' : 'expense-row__status'}
                    type="button"
                    aria-label={expense.paid ? `Mark ${expense.label} as unpaid` : `Mark ${expense.label} as paid`}
                    onClick={() => togglePaid(expense.id)}
                  >
                    <Icon name={expense.paid ? 'check' : 'circle'} size={16} />
                  </button>
                  <div>
                    <strong>{expense.label}</strong>
                    <small>
                      {getCategoryLabel(EXPENSE_CATEGORIES, expense.category)}
                      {expense.date && ` · ${formatExpenseDate(expense.date)}`}
                    </small>
                  </div>
                  <span className={expense.paid ? 'expense-row__amount' : 'expense-row__amount expense-row__amount--planned'}>
                    {formatCurrency(expense.amount, trip.currency)}
                  </span>
                  <button className="icon-button icon-button--small" type="button" aria-label={`Delete ${expense.label}`} onClick={() => removeExpense(expense.id)}>
                    <Icon name="trash" size={16} />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className="workspace-muted-copy">No expenses yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Field({ label, className = '', children }) {
  return (
    <label className={`workspace-field ${className}`.trim()}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function formatExpenseDate(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })
    .format(new Date(`${date}T12:00:00`));
}
