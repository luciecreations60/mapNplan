# Browser, responsive and accessibility testing

## Supported validation matrix

The stabilization target is the current stable release of:

- Chrome / Chromium desktop and Android;
- Safari desktop and iOS;
- Firefox desktop;
- Microsoft Edge desktop.

Automated source contracts run on every GitHub Actions deployment. They verify the keyboard tab pattern, modal focus trap, skip link, responsive action layout, reduced-motion support and mobile drawer semantics.

## Manual viewport matrix

Test every release at these representative widths:

| Width | Usage |
|---:|---|
| 360 px | Small phone |
| 390 px | Modern iPhone |
| 768 px | Tablet portrait |
| 1024 px | Tablet landscape / small laptop |
| 1366 px | Common office laptop |
| 1920 px | Large desktop |

At every width verify:

1. no horizontal page scrolling;
2. all activity actions remain visible and clickable;
3. the sidebar becomes a drawer below 960 px;
4. the trip tab strip scrolls horizontally without moving the entire page;
5. modals remain fully reachable and their action buttons wrap;
6. maps, tables and long user content do not widen the page.

## Keyboard smoke test

1. Reload the application and press `Tab`.
2. The **Skip to main content** link must appear.
3. Activate it with `Enter`; focus must move to the main region.
4. Open the mobile menu using only the keyboard. Focus must remain inside the drawer until it closes.
5. Open a modal. `Tab` and `Shift+Tab` must cycle inside it; `Escape` must close it and restore focus.
6. In a trip, focus the tab strip and use `Left`, `Right`, `Home` and `End`.
7. Open global search with `Ctrl+K` / `Cmd+K`, type a query and use arrow keys plus `Enter`.

## Accessibility checks

- Zoom to 200%: controls and content must remain available.
- Enable reduced motion at operating-system level: animations must become effectively instant.
- Test Windows High Contrast / forced colours when available.
- Check visible focus on every actionable element.
- Ensure every icon-only control has an accessible name.
- Verify error and success notices are announced as `alert` or `status`.

## Current limitation

The project does not yet include a real browser automation farm. The GitHub workflow validates source contracts, unit tests and the production build. Final Chrome, Safari, Firefox and Edge verification remains a manual release-candidate task in Part 23.
