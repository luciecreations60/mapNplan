# Quality report — V0.1.21

## Automated validation

- 26 automated tests passed.
- 0 automated test failures.
- 1,544 translation keys are synchronized per locale.
- 146 JavaScript/JSX/MJS files were parsed successfully with the TypeScript parser.
- Relative imports and JSON files passed the project quality checker.
- Public indexing remains locked.

## Performance controls

- Top-level pages are loaded with `React.lazy`.
- React, Leaflet and icons are emitted as separate vendor chunks.
- A single JavaScript chunk may not exceed 750 KB.
- Total JavaScript may not exceed 2.5 MB.
- A CSS asset may not exceed 350 KB.
- GitHub Actions runs the bundle audit after the production build.

## Storage controls

- Orphan attachments can be detected and removed.
- External-response caches are bounded and can be pruned.
- Recovery snapshots remain bounded.
- Browser storage persistence can be requested when supported.
- Maintenance does not silently delete valid trips or documents.

## Limitation

The production Vite build could not be executed in the assistant environment because its internal npm mirror does not provide `@vitejs/plugin-react`. GitHub Actions remains the source of truth for the real production build and bundle audit.
