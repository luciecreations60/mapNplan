# Automated testing — V0.1.19

The test suite uses the Node.js built-in test runner and does not add another test framework dependency.

## Covered areas

- Legacy trip migration and domain normalization
- Trip duplication and private attachment removal
- Shared-expense balances and settlement suggestions
- Partial-payment and money-rounding rules
- Route distance, optimization and restoration
- ICS calendar export/import round trip
- Backup format and attachment-data validation
- Shared-trip payload validation
- Corrupted LocalStorage quarantine
- Public SEO indexing lock

## Commands

```bash
npm run quality
npm run test
npm run build
npm run check
```

The GitHub Actions deployment executes quality checks, tests and the production build. A failure stops deployment.
