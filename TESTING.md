# Testing — V0.1.22 rc.1

## Automated commands

```bash
npm run quality
npm run test
npm run build
npm run performance:audit
npm run release:audit:ci
```

`npm run check` executes the same complete gate in sequence.

## Automated coverage

The Release Candidate contains 32 tests covering:

- accessibility and responsive contracts;
- calendar ICS round trips;
- import validation and unsupported formats;
- LocalStorage quarantine and bounded recovery;
- lazy loading, service-worker bounds and bundle budgets;
- release identity, documentation and CI contract;
- complete create/update/archive/restore/backup/share/duplicate/delete lifecycle;
- normalized demonstration-data integrity;
- affiliate providers disabled by default;
- route optimisation restoration;
- shared-expense calculations and rounding;
- storage-maintenance safety;
- trip migrations and private-file removal during duplication;
- public-indexing lock.

## Manual acceptance

Follow `RELEASE_CANDIDATE_TEST_PLAN.md`. The minimum V1.0 decision evidence is:

1. green GitHub Actions for this version;
2. complete core journey on the deployed site;
3. Chrome and Safari acceptance;
4. mobile layout acceptance;
5. successful JSON backup restoration;
6. zero blocker and data-loss defects.

## Release status

After deployment, `release-status.json` reports the source/build release audit. It is a technical signal only and does not replace manual browser acceptance.
