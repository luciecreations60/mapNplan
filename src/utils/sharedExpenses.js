const MONEY_PRECISION = 100;

function roundMoney(value) {
  return Math.round((Number(value) || 0) * MONEY_PRECISION) / MONEY_PRECISION;
}

export function getExpensePaidAmount(expense) {
  const amount = Math.max(0, Number(expense?.amount) || 0);
  if (expense?.paidAmount !== null && expense?.paidAmount !== undefined) {
    return Math.min(amount, Math.max(0, roundMoney(expense.paidAmount)));
  }
  return expense?.paid ? amount : 0;
}

export function getExpenseStatus(expense) {
  const amount = Math.max(0, Number(expense?.amount) || 0);
  const paidAmount = getExpensePaidAmount(expense);
  if (amount <= 0 || paidAmount <= 0) return 'planned';
  if (paidAmount + 0.005 >= amount) return 'paid';
  return 'partial';
}

export function getExpenseStatusTone(status) {
  return {
    paid: 'success',
    partial: 'warning',
    planned: 'neutral',
  }[status] || 'neutral';
}

export function getExpenseSplitIds(expense, participants = []) {
  const validIds = new Set(participants.map((participant) => participant.id));
  const source = Array.isArray(expense?.splitBetweenIds) ? expense.splitBetweenIds : [];
  const splitIds = [...new Set(source.map(String).filter((id) => validIds.has(id)))];
  return splitIds.length > 0 ? splitIds : participants.map((participant) => participant.id);
}

export function getExpenseShares(expense, participants = []) {
  const paidAmount = getExpensePaidAmount(expense);
  const splitIds = getExpenseSplitIds(expense, participants);
  if (paidAmount <= 0 || splitIds.length === 0) return [];

  const configuredShares = Array.isArray(expense?.splitShares)
    ? expense.splitShares
        .map((share) => ({ participantId: String(share.participantId || ''), amount: Math.max(0, roundMoney(share.amount)) }))
        .filter((share) => splitIds.includes(share.participantId) && share.amount > 0)
    : [];
  const configuredTotal = roundMoney(configuredShares.reduce((sum, share) => sum + share.amount, 0));

  if (configuredShares.length > 0 && configuredTotal > 0) {
    let allocated = 0;
    return configuredShares.map((share, index) => {
      const isLast = index === configuredShares.length - 1;
      const proportionalAmount = isLast
        ? roundMoney(paidAmount - allocated)
        : roundMoney((paidAmount * share.amount) / configuredTotal);
      allocated = roundMoney(allocated + proportionalAmount);
      return { participantId: share.participantId, amount: proportionalAmount };
    });
  }

  const baseShare = Math.floor((paidAmount * MONEY_PRECISION) / splitIds.length) / MONEY_PRECISION;
  let allocated = 0;

  return splitIds.map((participantId, index) => {
    const isLast = index === splitIds.length - 1;
    const amount = isLast ? roundMoney(paidAmount - allocated) : baseShare;
    allocated = roundMoney(allocated + amount);
    return { participantId, amount };
  });
}

export function getConfiguredExpenseShares(expense, participants = []) {
  const splitIds = getExpenseSplitIds(expense, participants);
  const amount = Math.max(0, roundMoney(expense?.amount));
  const configuredShares = Array.isArray(expense?.splitShares)
    ? expense.splitShares
        .map((share) => ({ participantId: String(share.participantId || ''), amount: Math.max(0, roundMoney(share.amount)) }))
        .filter((share) => splitIds.includes(share.participantId))
    : [];
  if (configuredShares.length > 0) return configuredShares;
  if (splitIds.length === 0) return [];

  const baseShare = Math.floor((amount * MONEY_PRECISION) / splitIds.length) / MONEY_PRECISION;
  let allocated = 0;
  return splitIds.map((participantId, index) => {
    const shareAmount = index === splitIds.length - 1 ? roundMoney(amount - allocated) : baseShare;
    allocated = roundMoney(allocated + shareAmount);
    return { participantId, amount: shareAmount };
  });
}

export function buildParticipantBalances(trip) {
  const participants = Array.isArray(trip?.travelParty) ? trip.travelParty : [];
  const balances = new Map(participants.map((participant) => [participant.id, 0]));

  for (const expense of trip?.expenses || []) {
    const paidAmount = getExpensePaidAmount(expense);
    if (paidAmount <= 0) continue;

    const payerId = balances.has(expense.paidById)
      ? expense.paidById
      : participants[0]?.id;
    if (!payerId) continue;

    balances.set(payerId, roundMoney((balances.get(payerId) || 0) + paidAmount));

    for (const share of getExpenseShares(expense, participants)) {
      balances.set(
        share.participantId,
        roundMoney((balances.get(share.participantId) || 0) - share.amount),
      );
    }
  }

  for (const settlement of trip?.settlements || []) {
    const amount = Math.max(0, roundMoney(settlement.amount));
    if (amount <= 0 || !balances.has(settlement.fromParticipantId) || !balances.has(settlement.toParticipantId)) {
      continue;
    }

    balances.set(
      settlement.fromParticipantId,
      roundMoney((balances.get(settlement.fromParticipantId) || 0) + amount),
    );
    balances.set(
      settlement.toParticipantId,
      roundMoney((balances.get(settlement.toParticipantId) || 0) - amount),
    );
  }

  return participants.map((participant) => ({
    ...participant,
    balance: roundMoney(balances.get(participant.id) || 0),
  }));
}

export function buildSettlementSuggestions(trip) {
  const participants = Array.isArray(trip?.travelParty) ? trip.travelParty : [];
  const participantById = new Map(participants.map((participant) => [participant.id, participant]));
  const debts = new Map();

  const keyFor = (fromId, toId) => `${fromId}::${toId}`;
  const getDebt = (fromId, toId) => debts.get(keyFor(fromId, toId)) || 0;
  const setDebt = (fromId, toId, amount) => {
    const key = keyFor(fromId, toId);
    const rounded = roundMoney(amount);
    if (rounded > 0.005) debts.set(key, rounded);
    else debts.delete(key);
  };

  // Keep each person's obligation to the person who actually paid. This makes
  // overpayments reversible to the original sender instead of rerouting money
  // through another traveller, which is easier to understand and audit.
  function addDebt(fromId, toId, amount) {
    let remainder = Math.max(0, roundMoney(amount));
    if (!fromId || !toId || fromId === toId || remainder <= 0.005) return;

    const reverse = getDebt(toId, fromId);
    if (reverse > 0.005) {
      const offset = Math.min(reverse, remainder);
      setDebt(toId, fromId, reverse - offset);
      remainder = roundMoney(remainder - offset);
    }
    if (remainder > 0.005) setDebt(fromId, toId, getDebt(fromId, toId) + remainder);
  }

  for (const expense of trip?.expenses || []) {
    const paidAmount = getExpensePaidAmount(expense);
    if (paidAmount <= 0) continue;
    const payerId = participantById.has(expense.paidById) ? expense.paidById : participants[0]?.id;
    if (!payerId) continue;
    for (const share of getExpenseShares(expense, participants)) {
      if (share.participantId !== payerId) addDebt(share.participantId, payerId, share.amount);
    }
  }

  // A recorded reimbursement first reduces the matching debt. If it exceeds
  // what was owed, the excess becomes an explicit refund owed back to the
  // sender instead of being silently redistributed to a third traveller.
  for (const settlement of trip?.settlements || []) {
    const fromId = settlement.fromParticipantId;
    const toId = settlement.toParticipantId;
    let amount = Math.max(0, roundMoney(settlement.amount));
    if (!participantById.has(fromId) || !participantById.has(toId) || amount <= 0.005) continue;

    const currentDebt = getDebt(fromId, toId);
    const applied = Math.min(currentDebt, amount);
    setDebt(fromId, toId, currentDebt - applied);
    amount = roundMoney(amount - applied);
    if (amount > 0.005) addDebt(toId, fromId, amount);
  }

  return [...debts.entries()]
    .map(([key, amount]) => {
      const [fromParticipantId, toParticipantId] = key.split('::');
      return {
        fromParticipantId,
        fromName: participantById.get(fromParticipantId)?.name || '',
        toParticipantId,
        toName: participantById.get(toParticipantId)?.name || '',
        amount: roundMoney(amount),
      };
    })
    .filter((item) => item.amount > 0.005)
    .sort((left, right) => right.amount - left.amount);
}

export function calculateSharedExpenseSummary(trip) {
  const expenses = trip?.expenses || [];
  const plannedTotal = roundMoney(expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0));
  const paidTotal = roundMoney(expenses.reduce((sum, expense) => sum + getExpensePaidAmount(expense), 0));
  const outstandingTotal = roundMoney(Math.max(0, plannedTotal - paidTotal));
  const settlementsTotal = roundMoney((trip?.settlements || []).reduce(
    (sum, settlement) => sum + Number(settlement.amount || 0),
    0,
  ));

  return {
    plannedTotal,
    paidTotal,
    outstandingTotal,
    settlementsTotal,
    paidCount: expenses.filter((expense) => getExpenseStatus(expense) === 'paid').length,
    partialCount: expenses.filter((expense) => getExpenseStatus(expense) === 'partial').length,
    plannedCount: expenses.filter((expense) => getExpenseStatus(expense) === 'planned').length,
  };
}

function escapeCsvCell(value) {
  const text = String(value ?? '');
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildExpensesCsv(trip, headers) {
  const participantsById = new Map((trip.travelParty || []).map((participant) => [participant.id, participant.name]));
  const rows = (trip.expenses || []).map((expense) => {
    const splitNames = getExpenseSplitIds(expense, trip.travelParty || [])
      .map((participantId) => participantsById.get(participantId) || participantId)
      .join(', ');

    return [
      expense.date,
      expense.label,
      expense.category,
      Number(expense.amount || 0).toFixed(2),
      getExpensePaidAmount(expense).toFixed(2),
      getExpenseStatus(expense),
      participantsById.get(expense.paidById) || '',
      splitNames,
      expense.notes || '',
    ];
  });

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(';'))
    .join('\n');
}

export function downloadExpensesCsv(trip, headers) {
  const csv = `\uFEFF${buildExpensesCsv(trip, headers)}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${slugify(trip.name || 'trip')}-expenses.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function slugify(value) {
  return String(value || 'trip')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'trip';
}