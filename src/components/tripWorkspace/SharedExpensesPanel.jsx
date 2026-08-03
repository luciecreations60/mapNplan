import { useMemo, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { formatLocalizedDate } from '../../utils/date.js';
import { formatCurrency } from '../../utils/currency.js';
import { createId } from '../../utils/id.js';
import { buildTripDateRange } from '../../utils/itinerary.js';
import {
  buildParticipantBalances,
  buildSettlementSuggestions,
  calculateSharedExpenseSummary,
  downloadExpensesCsv,
  getExpensePaidAmount,
  getExpenseStatus,
  getExpenseStatusTone,
} from '../../utils/sharedExpenses.js';
import {
  EXPENSE_CATEGORIES,
  getCategoryLabel,
} from '../../utils/tripWorkspace.js';
import { Badge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { ConfirmDialog } from '../common/ConfirmDialog.jsx';
import { Icon } from '../common/Icon.jsx';
import { Modal } from '../common/Modal.jsx';
import { ProgressBar } from '../common/ProgressBar.jsx';
import { InlineNotice } from '../feedback/InlineNotice.jsx';

const TODAY = new Date().toISOString().slice(0, 10);

const EMPTY_PARTICIPANT_FORM = Object.freeze({ id: null, name: '', email: '' });
const EMPTY_SETTLEMENT_FORM = Object.freeze({
  fromParticipantId: '',
  toParticipantId: '',
  amount: '',
  date: TODAY,
  notes: '',
});

/**
 * Shared expense workspace.
 *
 * This component deliberately stores only domain data on the trip object. All
 * balance and reimbursement calculations are pure derived values, which makes
 * a future backend implementation straightforward and avoids persisted totals
 * becoming inconsistent.
 */
export function SharedExpensesPanel({ trip, onUpdate }) {
  const { locale, t } = useI18n();
  const participants = trip.travelParty || [];
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState(() => createEmptyExpenseForm(participants));
  const [participantForm, setParticipantForm] = useState(EMPTY_PARTICIPANT_FORM);
  const [settlementForm, setSettlementForm] = useState(() => createEmptySettlementForm(participants));
  const [filters, setFilters] = useState({ search: '', participantId: 'all', category: 'all', status: 'all', sort: 'dateDesc' });
  const [notice, setNotice] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const summary = useMemo(() => calculateSharedExpenseSummary(trip), [trip]);
  const balances = useMemo(() => buildParticipantBalances(trip), [trip]);
  const suggestions = useMemo(() => buildSettlementSuggestions(trip), [trip]);
  const participantsById = useMemo(
    () => new Map(participants.map((participant) => [participant.id, participant])),
    [participants],
  );
  const itineraryDates = useMemo(
    () => buildTripDateRange(trip.startDate, trip.endDate),
    [trip.startDate, trip.endDate],
  );

  const filteredExpenses = useMemo(() => {
    const query = filters.search.trim().toLocaleLowerCase(locale);
    return [...(trip.expenses || [])]
      .filter((expense) => {
        const status = getExpenseStatus(expense);
        const matchesSearch = !query
          || expense.label.toLocaleLowerCase(locale).includes(query)
          || String(expense.notes || '').toLocaleLowerCase(locale).includes(query);
        const matchesParticipant = filters.participantId === 'all'
          || expense.paidById === filters.participantId
          || (expense.splitBetweenIds || []).includes(filters.participantId);
        const matchesCategory = filters.category === 'all' || expense.category === filters.category;
        const matchesStatus = filters.status === 'all' || status === filters.status;
        return matchesSearch && matchesParticipant && matchesCategory && matchesStatus;
      })
      .sort((left, right) => compareExpenses(left, right, filters.sort, locale));
  }, [filters, locale, trip.expenses]);

  function showNotice(tone, title, message) {
    setNotice({ tone, title, message });
    window.setTimeout(() => setNotice(null), 4500);
  }

  function openNewExpense() {
    setExpenseForm(createEmptyExpenseForm(participants));
    setExpenseModalOpen(true);
  }

  function openEditExpense(expense) {
    setExpenseForm({
      id: expense.id,
      label: expense.label,
      category: expense.category,
      amount: Number(expense.amount || 0).toFixed(2),
      paidAmount: Number(getExpensePaidAmount(expense) || 0).toFixed(2),
      date: expense.date || TODAY,
      paidById: expense.paidById || participants[0]?.id || '',
      splitBetweenIds: [...(expense.splitBetweenIds || participants.map((participant) => participant.id))],
      notes: expense.notes || '',
    });
    setExpenseModalOpen(true);
  }

  function updateExpenseField(event) {
    const { name, value } = event.target;
    setExpenseForm((current) => ({ ...current, [name]: value }));
  }

  function normalizeMoneyField(fieldName) {
    setExpenseForm((current) => ({ ...current, [fieldName]: normalizeMoney(current[fieldName]) }));
  }

  function toggleSplitParticipant(participantId) {
    setExpenseForm((current) => {
      const selected = current.splitBetweenIds.includes(participantId);
      const nextIds = selected
        ? current.splitBetweenIds.filter((id) => id !== participantId)
        : [...current.splitBetweenIds, participantId];
      return { ...current, splitBetweenIds: nextIds };
    });
  }

  function submitExpense(event) {
    event.preventDefault();
    const amount = Math.max(0, Number(expenseForm.amount) || 0);
    const paidAmount = Math.min(amount, Math.max(0, Number(expenseForm.paidAmount) || 0));

    if (!expenseForm.label.trim() || amount <= 0 || expenseForm.splitBetweenIds.length === 0) {
      showNotice('danger', t('sharedExpenses.validationTitle'), t('sharedExpenses.validationExpense'));
      return;
    }

    const payload = {
      id: expenseForm.id || createId('expense'),
      label: expenseForm.label.trim(),
      category: expenseForm.category,
      amount,
      paidAmount,
      paid: paidAmount >= amount,
      date: expenseForm.date,
      paidById: expenseForm.paidById || participants[0]?.id || null,
      splitBetweenIds: expenseForm.splitBetweenIds,
      notes: expenseForm.notes.trim(),
    };

    const nextExpenses = expenseForm.id
      ? trip.expenses.map((expense) => (expense.id === expenseForm.id ? payload : expense))
      : [...trip.expenses, payload];

    onUpdate({ expenses: nextExpenses });
    setExpenseModalOpen(false);
    showNotice(
      'success',
      expenseForm.id ? t('sharedExpenses.expenseUpdatedTitle') : t('sharedExpenses.expenseAddedTitle'),
      t('sharedExpenses.expenseSavedMessage', { name: payload.label }),
    );
  }

  function updateParticipantField(event) {
    const { name, value } = event.target;
    setParticipantForm((current) => ({ ...current, [name]: value }));
  }

  function startEditingParticipant(participant) {
    setParticipantForm({ id: participant.id, name: participant.name, email: participant.email || '' });
  }

  function submitParticipant(event) {
    event.preventDefault();
    const name = participantForm.name.trim();
    if (!name) return;

    const now = new Date().toISOString();
    const nextParty = participantForm.id
      ? participants.map((participant) => (
          participant.id === participantForm.id
            ? { ...participant, name, email: participantForm.email.trim().toLowerCase() }
            : participant
        ))
      : [...participants, {
          id: createId('traveller'),
          name,
          email: participantForm.email.trim().toLowerCase(),
          isCurrentUser: participants.length === 0,
          createdAt: now,
        }];

    onUpdate({ travelParty: nextParty, travelers: nextParty.length });
    setParticipantForm(EMPTY_PARTICIPANT_FORM);
    showNotice('success', t('sharedExpenses.partyUpdatedTitle'), t('sharedExpenses.partyUpdatedText'));
  }

  function requestParticipantRemoval(participant) {
    const referenced = trip.expenses.some((expense) => (
      expense.paidById === participant.id || (expense.splitBetweenIds || []).includes(participant.id)
    )) || trip.settlements.some((settlement) => (
      settlement.fromParticipantId === participant.id || settlement.toParticipantId === participant.id
    ));

    if (participant.isCurrentUser || participants.length <= 1 || referenced) {
      showNotice('warning', t('sharedExpenses.cannotRemoveTitle'), t('sharedExpenses.cannotRemoveText'));
      return;
    }

    setPendingDelete({ type: 'participant', item: participant });
  }

  function updateSettlementField(event) {
    const { name, value } = event.target;
    setSettlementForm((current) => ({ ...current, [name]: value }));
  }

  function submitSettlement(event) {
    event.preventDefault();
    const amount = Math.max(0, Number(settlementForm.amount) || 0);
    if (
      amount <= 0
      || !settlementForm.fromParticipantId
      || !settlementForm.toParticipantId
      || settlementForm.fromParticipantId === settlementForm.toParticipantId
    ) {
      showNotice('danger', t('sharedExpenses.validationTitle'), t('sharedExpenses.validationSettlement'));
      return;
    }

    const settlement = {
      id: createId('settlement'),
      fromParticipantId: settlementForm.fromParticipantId,
      toParticipantId: settlementForm.toParticipantId,
      amount,
      date: settlementForm.date || TODAY,
      notes: settlementForm.notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onUpdate({ settlements: [...trip.settlements, settlement] });
    setSettlementForm(createEmptySettlementForm(participants));
    showNotice('success', t('sharedExpenses.paymentRecordedTitle'), t('sharedExpenses.paymentRecordedText'));
  }

  function recordSuggestion(suggestion) {
    const settlement = {
      id: createId('settlement'),
      fromParticipantId: suggestion.fromParticipantId,
      toParticipantId: suggestion.toParticipantId,
      amount: suggestion.amount,
      date: TODAY,
      notes: t('sharedExpenses.suggestedPaymentNote'),
      createdAt: new Date().toISOString(),
    };
    onUpdate({ settlements: [...trip.settlements, settlement] });
    showNotice('success', t('sharedExpenses.paymentRecordedTitle'), t('sharedExpenses.paymentRecordedText'));
  }

  function confirmDeletion() {
    if (!pendingDelete) return;
    if (pendingDelete.type === 'expense') {
      onUpdate({ expenses: trip.expenses.filter((expense) => expense.id !== pendingDelete.item.id) });
    } else if (pendingDelete.type === 'settlement') {
      onUpdate({ settlements: trip.settlements.filter((settlement) => settlement.id !== pendingDelete.item.id) });
    } else if (pendingDelete.type === 'participant') {
      const nextParty = participants.filter((participant) => participant.id !== pendingDelete.item.id);
      onUpdate({ travelParty: nextParty, travelers: nextParty.length });
    }
    setPendingDelete(null);
  }

  function exportCsv() {
    downloadExpensesCsv(trip, [
      t('sharedExpenses.csv.date'),
      t('sharedExpenses.csv.label'),
      t('sharedExpenses.csv.category'),
      t('sharedExpenses.csv.plannedAmount'),
      t('sharedExpenses.csv.paidAmount'),
      t('sharedExpenses.csv.status'),
      t('sharedExpenses.csv.paidBy'),
      t('sharedExpenses.csv.splitBetween'),
      t('sharedExpenses.csv.notes'),
    ]);
    showNotice('success', t('sharedExpenses.csvCreatedTitle'), t('sharedExpenses.csvCreatedText'));
  }

  const deletionTitle = pendingDelete?.type === 'expense'
    ? t('sharedExpenses.deleteExpenseTitle')
    : pendingDelete?.type === 'settlement'
      ? t('sharedExpenses.deleteSettlementTitle')
      : t('sharedExpenses.deleteParticipantTitle');
  const deletionDescription = pendingDelete
    ? t('sharedExpenses.deleteConfirm', { name: pendingDelete.item.label || pendingDelete.item.name || pendingDelete.item.notes || '' })
    : '';

  return (
    <div className="workspace-section shared-expenses">
      <section className="workspace-section__heading">
        <div>
          <p className="eyebrow">{t('sharedExpenses.eyebrow')}</p>
          <h2>{t('sharedExpenses.title')}</h2>
          <p>{t('sharedExpenses.intro')}</p>
        </div>
        <div className="workspace-heading-actions">
          <Button variant="secondary" icon="download" onClick={exportCsv}>{t('sharedExpenses.exportCsv')}</Button>
          <Button icon="plus" onClick={openNewExpense}>{t('sharedExpenses.addExpense')}</Button>
        </div>
      </section>

      {notice && (
        <InlineNotice tone={notice.tone} title={notice.title} className="page-notice">
          {notice.message}
        </InlineNotice>
      )}

      <section className="shared-expense-kpis">
        <SummaryCard label={t('sharedExpenses.planned')} value={formatCurrency(summary.plannedTotal, trip.currency, locale)} hint={t('sharedExpenses.expenseCount', { count: trip.expenses.length })} />
        <SummaryCard label={t('sharedExpenses.paidToProviders')} value={formatCurrency(summary.paidTotal, trip.currency, locale)} hint={t('sharedExpenses.paidAndPartial', { paid: summary.paidCount, partial: summary.partialCount })} />
        <SummaryCard label={t('sharedExpenses.stillToPay')} value={formatCurrency(summary.outstandingTotal, trip.currency, locale)} hint={t('sharedExpenses.providerBalance')} />
        <SummaryCard label={t('sharedExpenses.reimbursements')} value={formatCurrency(summary.settlementsTotal, trip.currency, locale)} hint={t('sharedExpenses.recordedPayments', { count: trip.settlements.length })} primary />
      </section>

      <div className="shared-expenses__main-grid">
        <Card className="workspace-panel shared-balance-card">
          <header className="workspace-panel__header">
            <div><p className="eyebrow">{t('sharedExpenses.balancesEyebrow')}</p><h3>{t('sharedExpenses.balancesTitle')}</h3></div>
            <span>{t('sharedExpenses.peopleCount', { count: participants.length })}</span>
          </header>

          <div className="participant-balances">
            {balances.map((participant) => (
              <article key={participant.id} className="participant-balance-row">
                <span className="member-avatar">{getInitials(participant.name)}</span>
                <div>
                  <strong>{participant.name}</strong>
                  <small>{participant.isCurrentUser ? t('sharedExpenses.you') : participant.email || t('sharedExpenses.traveller')}</small>
                </div>
                <BalanceValue participant={participant} currency={trip.currency} locale={locale} t={t} />
              </article>
            ))}
          </div>

          <div className="settlement-suggestions">
            <h4>{t('sharedExpenses.suggestionsTitle')}</h4>
            {suggestions.length > 0 ? suggestions.map((suggestion) => (
              <article key={`${suggestion.fromParticipantId}-${suggestion.toParticipantId}`} className="settlement-suggestion">
                <div>
                  <Icon name="exchange" size={18} />
                  <p>{t('sharedExpenses.owes', { from: suggestion.fromName, to: suggestion.toName })}</p>
                </div>
                <strong>{formatCurrency(suggestion.amount, trip.currency, locale)}</strong>
                <Button size="small" variant="secondary" onClick={() => recordSuggestion(suggestion)}>
                  {t('sharedExpenses.recordPayment')}
                </Button>
              </article>
            )) : (
              <p className="workspace-muted-copy">{t('sharedExpenses.allSettled')}</p>
            )}
          </div>
        </Card>

        <Card className="workspace-panel travel-party-card">
          <header className="workspace-panel__header">
            <div><p className="eyebrow">{t('sharedExpenses.partyEyebrow')}</p><h3>{t('sharedExpenses.partyTitle')}</h3></div>
          </header>

          <div className="travel-party-list">
            {participants.map((participant) => (
              <article key={participant.id} className="travel-party-row">
                <span className="member-avatar">{getInitials(participant.name)}</span>
                <div><strong>{participant.name}</strong><small>{participant.email || t('sharedExpenses.noEmail')}</small></div>
                {participant.isCurrentUser && <Badge tone="success">{t('sharedExpenses.you')}</Badge>}
                <button className="icon-button icon-button--small" type="button" aria-label={t('common.edit')} onClick={() => startEditingParticipant(participant)}><Icon name="edit" size={15} /></button>
                <button className="icon-button icon-button--small" type="button" aria-label={t('common.delete')} onClick={() => requestParticipantRemoval(participant)}><Icon name="trash" size={15} /></button>
              </article>
            ))}
          </div>

          <form className="travel-party-form" onSubmit={submitParticipant}>
            <h4>{participantForm.id ? t('sharedExpenses.editTraveller') : t('sharedExpenses.addTraveller')}</h4>
            <label><span>{t('sharedExpenses.name')}</span><input name="name" value={participantForm.name} maxLength="80" onChange={updateParticipantField} required /></label>
            <label><span>{t('sharedExpenses.emailOptional')}</span><input name="email" type="email" value={participantForm.email} onChange={updateParticipantField} /></label>
            <div className="workspace-form__actions">
              {participantForm.id && <Button variant="ghost" size="small" onClick={() => setParticipantForm(EMPTY_PARTICIPANT_FORM)}>{t('common.cancel')}</Button>}
              <Button type="submit" size="small" icon={participantForm.id ? 'save' : 'userPlus'}>{participantForm.id ? t('common.save') : t('sharedExpenses.addTraveller')}</Button>
            </div>
          </form>
        </Card>
      </div>

      <Card className="workspace-panel expense-ledger-card">
        <header className="workspace-panel__header expense-ledger-header">
          <div><p className="eyebrow">{t('sharedExpenses.ledgerEyebrow')}</p><h3>{t('sharedExpenses.ledgerTitle')}</h3></div>
          <span>{t('sharedExpenses.filteredCount', { visible: filteredExpenses.length, total: trip.expenses.length })}</span>
        </header>

        <div className="shared-expense-filters">
          <label className="shared-expense-search"><Icon name="search" size={17} /><input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder={t('sharedExpenses.searchPlaceholder')} /></label>
          <select value={filters.participantId} aria-label={t('sharedExpenses.filterPerson')} onChange={(event) => setFilters((current) => ({ ...current, participantId: event.target.value }))}>
            <option value="all">{t('sharedExpenses.allPeople')}</option>
            {participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.name}</option>)}
          </select>
          <select value={filters.category} aria-label={t('sharedExpenses.filterCategory')} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}>
            <option value="all">{t('sharedExpenses.allCategories')}</option>
            {EXPENSE_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{t(category.labelKey)}</option>)}
          </select>
          <select value={filters.status} aria-label={t('sharedExpenses.filterStatus')} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="all">{t('sharedExpenses.allStatuses')}</option>
            <option value="planned">{t('sharedExpenses.statuses.planned')}</option>
            <option value="partial">{t('sharedExpenses.statuses.partial')}</option>
            <option value="paid">{t('sharedExpenses.statuses.paid')}</option>
          </select>
          <select value={filters.sort} aria-label={t('sharedExpenses.sortLabel')} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}>
            <option value="dateDesc">{t('sharedExpenses.sort.dateDesc')}</option>
            <option value="dateAsc">{t('sharedExpenses.sort.dateAsc')}</option>
            <option value="labelAsc">{t('sharedExpenses.sort.labelAsc')}</option>
            <option value="labelDesc">{t('sharedExpenses.sort.labelDesc')}</option>
          </select>
        </div>

        {filteredExpenses.length > 0 ? (
          <div className="shared-expense-list">
            {filteredExpenses.map((expense) => {
              const status = getExpenseStatus(expense);
              const paidAmount = getExpensePaidAmount(expense);
              const payer = participantsById.get(expense.paidById);
              const splitNames = (expense.splitBetweenIds || [])
                .map((participantId) => participantsById.get(participantId)?.name)
                .filter(Boolean);
              return (
                <article key={expense.id} className="shared-expense-row">
                  <div className="shared-expense-row__icon"><Icon name="receipt" size={19} /></div>
                  <div className="shared-expense-row__main">
                    <div className="shared-expense-row__title">
                      <strong>{expense.label}</strong>
                      <Badge tone={getExpenseStatusTone(status)}>{t(`sharedExpenses.statuses.${status}`)}</Badge>
                    </div>
                    <small>{getCategoryLabel(EXPENSE_CATEGORIES, expense.category, t)}{expense.date ? ` · ${formatDate(expense.date, locale)}` : ''}</small>
                    <p>{t('sharedExpenses.paidByAndSplit', { payer: payer?.name || t('common.none'), count: splitNames.length })}</p>
                    {expense.notes && <p className="shared-expense-row__notes">{expense.notes}</p>}
                    <ProgressBar value={expense.amount > 0 ? (paidAmount / expense.amount) * 100 : 0} label={t('sharedExpenses.paymentProgress')} />
                  </div>
                  <div className="shared-expense-row__amounts">
                    <strong>{formatCurrency(expense.amount, trip.currency, locale)}</strong>
                    <small>{t('sharedExpenses.paidAmountValue', { amount: formatCurrency(paidAmount, trip.currency, locale) })}</small>
                  </div>
                  <div className="shared-expense-row__actions">
                    <button className="icon-button icon-button--small" type="button" aria-label={t('common.edit')} onClick={() => openEditExpense(expense)}><Icon name="edit" size={15} /></button>
                    <button className="icon-button icon-button--small" type="button" aria-label={t('common.delete')} onClick={() => setPendingDelete({ type: 'expense', item: expense })}><Icon name="trash" size={15} /></button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : <div className="workspace-empty workspace-empty--compact"><span><Icon name="receipt" size={24} /></span><h3>{t('sharedExpenses.noExpenses')}</h3><p>{t('sharedExpenses.noExpensesText')}</p></div>}
      </Card>

      <Card className="workspace-panel settlement-history-card">
        <header className="workspace-panel__header">
          <div><p className="eyebrow">{t('sharedExpenses.settlementsEyebrow')}</p><h3>{t('sharedExpenses.settlementsTitle')}</h3></div>
          <span>{trip.settlements.length}</span>
        </header>

        <form className="settlement-form" onSubmit={submitSettlement}>
          <label><span>{t('sharedExpenses.from')}</span><select name="fromParticipantId" value={settlementForm.fromParticipantId} onChange={updateSettlementField} required><option value="">{t('common.none')}</option>{participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.name}</option>)}</select></label>
          <label><span>{t('sharedExpenses.to')}</span><select name="toParticipantId" value={settlementForm.toParticipantId} onChange={updateSettlementField} required><option value="">{t('common.none')}</option>{participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.name}</option>)}</select></label>
          <label><span>{t('sharedExpenses.amount')} ({trip.currency})</span><input name="amount" type="number" min="0.01" step="0.01" value={settlementForm.amount} onChange={updateSettlementField} required /></label>
          <label><span>{t('common.date')}</span><input name="date" type="date" value={settlementForm.date} onChange={updateSettlementField} /></label>
          <label className="settlement-form__notes"><span>{t('common.notes')}</span><input name="notes" value={settlementForm.notes} onChange={updateSettlementField} placeholder={t('sharedExpenses.settlementNotePlaceholder')} /></label>
          <Button type="submit" size="small" icon="exchange">{t('sharedExpenses.recordPayment')}</Button>
        </form>

        {trip.settlements.length > 0 ? (
          <div className="settlement-history">
            {[...trip.settlements].reverse().map((settlement) => (
              <article key={settlement.id} className="settlement-history-row">
                <span><Icon name="exchange" size={17} /></span>
                <div>
                  <strong>{t('sharedExpenses.paymentFromTo', {
                    from: participantsById.get(settlement.fromParticipantId)?.name || t('common.none'),
                    to: participantsById.get(settlement.toParticipantId)?.name || t('common.none'),
                  })}</strong>
                  <small>{settlement.date ? formatDate(settlement.date, locale) : ''}{settlement.notes ? ` · ${settlement.notes}` : ''}</small>
                </div>
                <strong>{formatCurrency(settlement.amount, trip.currency, locale)}</strong>
                <button className="icon-button icon-button--small" type="button" aria-label={t('common.delete')} onClick={() => setPendingDelete({ type: 'settlement', item: settlement })}><Icon name="trash" size={15} /></button>
              </article>
            ))}
          </div>
        ) : <p className="workspace-muted-copy">{t('sharedExpenses.noSettlements')}</p>}
      </Card>

      <ExpenseDialog
        isOpen={isExpenseModalOpen}
        form={expenseForm}
        participants={participants}
        currency={trip.currency}
        itineraryDates={itineraryDates}
        locale={locale}
        t={t}
        onClose={() => setExpenseModalOpen(false)}
        onFieldChange={updateExpenseField}
        onMoneyBlur={normalizeMoneyField}
        onToggleParticipant={toggleSplitParticipant}
        onSubmit={submitExpense}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title={deletionTitle}
        description={deletionDescription}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmDeletion}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}

function ExpenseDialog({ isOpen, form, participants, currency, itineraryDates, locale, t, onClose, onFieldChange, onMoneyBlur, onToggleParticipant, onSubmit }) {
  return (
    <Modal
      isOpen={isOpen}
      title={form.id ? t('sharedExpenses.editExpense') : t('sharedExpenses.newExpense')}
      description={t('sharedExpenses.expenseFormDescription')}
      onClose={onClose}
    >
      <form className="workspace-form shared-expense-form" onSubmit={onSubmit}>
        <div className="workspace-form__grid">
          <label className="workspace-field workspace-form__wide"><span>{t('sharedExpenses.expenseLabel')}</span><input name="label" value={form.label} onChange={onFieldChange} placeholder={t('sharedExpenses.expensePlaceholder')} required /></label>
          <label className="workspace-field"><span>{t('sharedExpenses.category')}</span><select name="category" value={form.category} onChange={onFieldChange}>{EXPENSE_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{t(category.labelKey)}</option>)}</select></label>
          <label className="workspace-field"><span>{t('sharedExpenses.totalAmount')} ({currency})</span><input name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={onFieldChange} onBlur={() => onMoneyBlur('amount')} required /></label>
          <label className="workspace-field"><span>{t('sharedExpenses.paidAmount')} ({currency})</span><input name="paidAmount" type="number" min="0" step="0.01" max={form.amount || undefined} value={form.paidAmount} onChange={onFieldChange} onBlur={() => onMoneyBlur('paidAmount')} /></label>
          <label className="workspace-field"><span>{t('sharedExpenses.itineraryDate')}</span><select name="date" value={form.date} onChange={onFieldChange}>
            <option value="">{t('common.none')}</option>
            {itineraryDates.map((date) => <option key={date} value={date}>{formatDate(date, locale)}</option>)}
          </select></label>
          <label className="workspace-field"><span>{t('sharedExpenses.paidBy')}</span><select name="paidById" value={form.paidById} onChange={onFieldChange}>{participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.name}</option>)}</select></label>
          <fieldset className="participant-split-field workspace-form__wide">
            <legend>{t('sharedExpenses.splitBetween')}</legend>
            <div className="participant-split-options">
              {participants.map((participant) => (
                <label key={participant.id} className="share-option">
                  <input type="checkbox" checked={form.splitBetweenIds.includes(participant.id)} onChange={() => onToggleParticipant(participant.id)} />
                  <span><Icon name={form.splitBetweenIds.includes(participant.id) ? 'checkCircle' : 'circle'} size={18} /> {participant.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="workspace-field workspace-form__wide"><span>{t('common.notes')}</span><textarea name="notes" rows="3" value={form.notes} onChange={onFieldChange} placeholder={t('sharedExpenses.notesPlaceholder')} /></label>
        </div>
        <InlineNotice tone="neutral" title={t('sharedExpenses.partialPaymentTitle')}>{t('sharedExpenses.partialPaymentText')}</InlineNotice>
        <div className="workspace-form__actions">
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" icon="save">{form.id ? t('common.save') : t('sharedExpenses.addExpense')}</Button>
        </div>
      </form>
    </Modal>
  );
}

function normalizeMoney(value) {
  if (value === '') return '';
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number).toFixed(2) : '';
}

function compareExpenses(left, right, sort, locale) {
  if (sort === 'labelAsc') return String(left.label || '').localeCompare(String(right.label || ''), locale, { sensitivity: 'base' });
  if (sort === 'labelDesc') return String(right.label || '').localeCompare(String(left.label || ''), locale, { sensitivity: 'base' });
  const dateComparison = String(left.date || '').localeCompare(String(right.date || ''));
  if (dateComparison !== 0) return sort === 'dateAsc' ? dateComparison : -dateComparison;
  return String(left.label || '').localeCompare(String(right.label || ''), locale, { sensitivity: 'base' });
}

function SummaryCard({ label, value, hint, primary = false }) {
  return (
    <Card className={primary ? 'budget-kpi budget-kpi--primary' : 'budget-kpi'}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </Card>
  );
}

function BalanceValue({ participant, currency, locale, t }) {
  if (Math.abs(participant.balance) <= 0.005) {
    return <Badge tone="success">{t('sharedExpenses.settled')}</Badge>;
  }
  const isCredit = participant.balance > 0;
  return (
    <div className={isCredit ? 'participant-balance participant-balance--credit' : 'participant-balance participant-balance--debt'}>
      <small>{isCredit ? t('sharedExpenses.shouldReceive') : t('sharedExpenses.owesBalance')}</small>
      <strong>{formatCurrency(Math.abs(participant.balance), currency, locale)}</strong>
    </div>
  );
}

function createEmptyExpenseForm(participants) {
  const currentParticipant = participants.find((participant) => participant.isCurrentUser) || participants[0];
  return {
    id: null,
    label: '',
    category: 'transport',
    amount: '',
    paidAmount: '',
    date: TODAY,
    paidById: currentParticipant?.id || '',
    splitBetweenIds: participants.map((participant) => participant.id),
    notes: '',
  };
}

function createEmptySettlementForm(participants) {
  return {
    ...EMPTY_SETTLEMENT_FORM,
    fromParticipantId: participants[1]?.id || participants[0]?.id || '',
    toParticipantId: participants[0]?.id || '',
  };
}

function getInitials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatDate(date, locale) {
  return formatLocalizedDate(date, locale, 'short');
}

