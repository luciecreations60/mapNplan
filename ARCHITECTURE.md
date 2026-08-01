# Architecture — V0.1.20 stabilization baseline

## Reliability layers

1. **Domain normalization** — `TripService` remains the migration and normalization façade.
2. **Import validation** — `ImportValidationService` rejects incompatible versions, excessive collections, oversized text and malformed attachments.
3. **Storage recovery** — `LocalStorageService` keeps up to five small quarantine snapshots when JSON parsing fails.
4. **Runtime diagnostics** — `DiagnosticsService` captures React, window and promise errors in `sessionStorage`; nothing is transmitted.
5. **Continuous validation** — GitHub Actions requires project checks, Node tests and a Vite production build before deployment.

## SEO release lock

`PROJECT_CONFIG.release.publicIndexingEnabled` is the single public-indexing switch. It stays `false` until the final name and production domain are approved.

## Test strategy

The suite uses the Node 22 built-in test runner, avoiding an additional test framework. Browser compatibility and visual accessibility are handled in Part 21.


## V0.1.20 accessibility layer

Temporary surfaces use `useFocusTrap` to contain keyboard focus and restore it to the opener. The application shell exposes a skip link and a focusable `<main>` landmark. Workspace navigation follows the WAI-ARIA tab pattern and global search uses combobox/listbox semantics.

Responsive safety rules are additive and live at the end of the CSS layers. They guarantee container `min-width: 0`, page overflow containment, coarse-pointer target sizes, reduced-motion behaviour and forced-colour fallbacks without changing business components.
