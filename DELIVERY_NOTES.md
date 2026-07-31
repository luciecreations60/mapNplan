# V0.1 — Part 11 delivery notes

## Release

- Application version: `0.1.10`
- Data schema: `10`
- Delivery date: `2026-07-31`

## Purpose

Part 11 introduces a finance layer designed for real group travel. The existing
Budget tab remains the high-level planning view. The new **Group expenses** tab
handles actual payments, partial provider payments, cost splitting and traveller
reimbursements.

## Main additions

- Independent travel-party list for finance calculations.
- Planned, partially paid and fully paid expense states.
- Payer selection and multi-person cost splitting.
- Pure balance engine: persisted totals are never trusted or duplicated.
- Simplified reimbursement suggestions.
- Manual reimbursement history.
- Participant, category, status and text filters.
- CSV export compatible with common spreadsheet applications.
- Responsive desktop, tablet and mobile layouts.
- Complete French and English interface copy.

## Data migration

Schema 10 is non-destructive.

Existing expenses receive:

- `paidAmount` from the legacy `paid` flag;
- a default payer;
- a split across all trip travellers;
- an empty note.

Existing trips receive:

- `travelParty` generated from collaboration members and traveller count;
- `settlements: []`.

## Important calculation rule

Group balances use the amount that has actually been paid (`paidAmount`), not
the full planned cost. A partially paid hotel therefore affects traveller
balances only for the portion already advanced.

## Files added

- `src/components/tripWorkspace/SharedExpensesPanel.jsx`
- `src/utils/sharedExpenses.js`

## Main files updated

- `src/services/trips/TripService.js`
- `src/components/tripWorkspace/BudgetPanel.jsx`
- `src/components/tripWorkspace/TripTabs.jsx`
- `src/pages/TripWorkspacePage.jsx`
- `src/utils/tripWorkspace.js`
- `src/utils/tripStatistics.js`
- `src/i18n/translations.js`
- `src/styles/pages.css`
- `src/config/app.config.js`
- version and documentation files
