# Architecture — V0.1.10

## Finance domain introduced in Part 11

The finance implementation keeps persisted source data separate from derived
calculations.

```text
Trip
├── budget                  Planned maximum for the whole trip
├── expenses[]              Provider expenses and payment progress
├── travelParty[]           People participating in expense splits
└── settlements[]           Reimbursements made between travellers
```

### Expense shape

```js
{
  id,
  label,
  category,
  amount,                   // planned provider amount
  paidAmount,               // amount actually advanced so far
  paid,                     // compatibility/derived full-payment flag
  date,
  paidById,                 // traveller who advanced the money
  splitBetweenIds,          // travellers sharing the paid amount
  notes
}
```

### Traveller shape

```js
{
  id,
  name,
  email,
  isCurrentUser,
  createdAt
}
```

### Settlement shape

```js
{
  id,
  fromParticipantId,
  toParticipantId,
  amount,
  date,
  notes,
  createdAt
}
```

## Calculation boundary

`src/utils/sharedExpenses.js` contains pure functions for:

- payment status;
- equal-share allocation with cent-safe rounding;
- participant balances;
- simplified reimbursement suggestions;
- finance summaries;
- CSV generation.

No balance is persisted. Every total is recalculated from expenses and
settlements, preventing stale or contradictory data.

## Persistence boundary

`TripService` remains the only persistence façade. It normalizes legacy data,
validates participant references and migrates schema 9 to schema 10 without
removing user content.

## Future backend compatibility

The current structures map directly to relational entities:

- `trip_participants`;
- `expenses`;
- `expense_participants`;
- `settlements`.

The React components do not access LocalStorage and therefore will not require a
UI rewrite when Supabase or another backend is introduced.
