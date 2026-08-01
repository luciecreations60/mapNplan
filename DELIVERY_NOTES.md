# V0.1 — Part 17 delivery notes

## Versions

- Application: `0.1.16`
- Trip schema: `16`
- Affiliate settings schema: `1`
- Service-worker cache: `tripflow-v0.1.16`

## Main additions

- New **Book & compare / Réserver et comparer** trip tab.
- Manual offer comparison across six commercial categories.
- Saved, shortlisted, booked and rejected option states.
- Provider configuration in Settings.
- Central URL templates with trip variables.
- Optional affiliate parameter injection.
- Local click and declared-conversion analytics.
- Search results for saved booking options.
- Sample comparison data in the Japan demonstration trip.

## Safety rules

- Every provider is disabled by default.
- No tracking identifier is shipped in source code.
- Enabling a provider only enables its configured URL.
- Local analytics are not presented as verified commission reports.
- Public share snapshots still exclude comparison and commercial data.

## Migration

Existing trips are preserved. Migration adds an empty `bookingOptions`
collection when none exists. No itinerary, reservation, expense, document,
attachment or saved place is modified.

## Suggested checks

1. Open Japan Discovery and select **Book & compare**.
2. Review the demonstration options.
3. Add and edit a manual hotel option.
4. Mark it shortlisted, then booked.
5. Search its title with Ctrl/Cmd + K.
6. Open Settings and find **Partners and affiliation**.
7. Confirm every provider starts disabled.
8. Configure a harmless test URL template, enable it and open the provider.
9. Confirm the local click counter changes.
