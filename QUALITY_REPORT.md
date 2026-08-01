# Quality report — V0.1 Part 21

## Scope

This release contains no new travel feature. It consolidates cross-browser layout, responsive containment, keyboard navigation and accessibility semantics.

## Automated gates

- existing business and migration tests;
- accessibility source contracts;
- responsive CSS contracts;
- translation parity;
- relative import validation;
- JSON validation;
- production build in GitHub Actions.

## Main corrections

- skip link and focusable main landmark;
- modal and mobile-drawer focus containment;
- focus restoration after temporary surfaces close;
- accessible tablist with arrow, Home and End keys;
- accessible global-search combobox navigation;
- notification panel Escape/outside-click handling;
- 44 px touch targets for coarse pointers;
- reduced-motion and forced-colour support;
- Chrome-safe activity action grid;
- full-width scrollable trip tabs;
- fallback styling when backdrop filters are unavailable.

## Validation boundary

Static and unit tests can prove structural contracts, not rendering in every browser engine. The manual browser matrix is documented in `BROWSER_ACCESSIBILITY_TESTING.md` and will be executed during the release-candidate pass.
