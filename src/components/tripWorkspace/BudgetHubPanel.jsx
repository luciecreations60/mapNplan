import { SharedExpensesPanel } from './SharedExpensesPanel.jsx';

export function BudgetHubPanel({ trip, onUpdate }) {
  return <SharedExpensesPanel trip={trip} onUpdate={onUpdate} />;
}
