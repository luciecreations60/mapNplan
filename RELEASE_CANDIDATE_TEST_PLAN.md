# Release Candidate test plan — V0.1.22 rc.1

This plan validates existing journeys only. It must not be used to introduce new business features before V1.0.

## Entry conditions

- GitHub Actions is green for quality, tests, production build, bundle budget and release audit.
- The deployed application displays version `0.1.22`.
- Public indexing is disabled and the provisional brand remains marked as non-final.
- A JSON backup has been downloaded before destructive browser-storage tests.

## Core journey

1. Reset demonstration data and open the Japan trip.
2. Create a new trip with destination, dates, travelers, currency and budget.
3. Add one itinerary day and two activities with times, places, costs and notes.
4. Edit, move, complete, duplicate and delete an activity.
5. Add one reservation, one document, one saved place and one booking option.
6. Add checklist entries, expenses, participants and a partial settlement.
7. Verify overview, calendar, map, statistics, today view and printable plan.
8. Export the trip calendar and verify that the ICS file opens in a calendar application.
9. Export a complete JSON backup, delete the test trip, import the backup and verify restoration.
10. Duplicate, favorite, pin, archive, restore and finally delete the copied trip.

## Privacy journey

- Create a read-only share without budget or notes.
- Confirm that confirmation numbers, document references, attachments and discussion comments are absent.
- Confirm that affiliate providers remain disabled unless explicitly configured locally.
- Confirm that `robots.txt`, the application HTML and generated guide pages stay non-indexable.

## Browser matrix

Test the deployed URL, not only the GitHub preview editor.

| Environment | Required coverage |
|---|---|
| Chrome desktop | full core journey, keyboard navigation, file import/export |
| Safari desktop or iPhone | trip editing, sticky tabs, map, file downloads |
| Firefox desktop | forms, dialogs, print view, offline reload |
| Edge desktop | responsive sidebar, focus, storage diagnostics |
| Mobile width | menu drawer, activity actions, horizontal tabs, modals |
| Tablet width | two-column layouts, map panels, forms and cards |

## Accessibility checks

- Navigate the main journey with `Tab`, `Shift+Tab`, arrow keys, `Enter`, `Space` and `Escape`.
- Verify visible focus and logical focus order.
- Verify that dialogs retain focus and restore it after closing.
- Verify French and English labels with a screen reader when available.
- Verify reduced motion and Windows forced-colour mode when available.

## Offline and storage checks

- Load the site once online, switch developer tools to Offline and reload.
- Confirm that the application shell and local trip data remain readable.
- Run **Settings → Data health and maintenance**.
- Verify that safe cleanup never removes valid trips or linked documents.
- Test recovery from intentionally corrupted application LocalStorage only after exporting a backup.

## Exit criteria

The candidate can be discussed as V1.0 only when:

- GitHub Actions is green;
- no blocker or data-loss bug remains;
- the core journey passes on Chrome and Safari;
- no major layout issue remains on mobile;
- backup restoration has been manually confirmed;
- known limitations are accepted and documented.
