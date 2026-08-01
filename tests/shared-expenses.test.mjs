import test from 'node:test';
import assert from 'node:assert/strict';
import { buildParticipantBalances, buildSettlementSuggestions, getExpensePaidAmount, getExpenseShares } from '../src/utils/sharedExpenses.js';

test('partial payments drive balances', () => {
  const trip = { travelParty: [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }], expenses: [{ amount: 100, paidAmount: 40, paidById: 'a', splitBetweenIds: ['a', 'b'] }], settlements: [] };
  assert.equal(getExpensePaidAmount(trip.expenses[0]), 40);
  assert.deepEqual(buildParticipantBalances(trip).map(({ id, balance }) => ({ id, balance })), [{ id: 'a', balance: 20 }, { id: 'b', balance: -20 }]);
  assert.equal(buildSettlementSuggestions(trip)[0].amount, 20);
});

test('rounding keeps the complete paid amount', () => {
  const people = ['a', 'b', 'c'].map((id) => ({ id }));
  const shares = getExpenseShares({ amount: 10, paidAmount: 10, splitBetweenIds: ['a', 'b', 'c'] }, people);
  assert.equal(shares.reduce((sum, share) => sum + share.amount, 0), 10);
});
