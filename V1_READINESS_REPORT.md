# V1 readiness report — V0.1.22 rc.1

## Current assessment

**Status: ready for controlled acceptance testing, not yet declared V1.0 stable.**

The functional scope is frozen. Reliability, accessibility, responsive behaviour, storage maintenance, offline handling and automated release gates are now present. The release candidate adds end-to-end domain tests, demo-data integrity tests, privacy tests and a CI audit of the actual production build.

## Evidence available before manual acceptance

- automated service and contract tests cover migrations, trip lifecycle, backup validation, sharing privacy, calendar interoperability, expenses, storage recovery, accessibility contracts, responsive contracts, performance contracts and release locks;
- translations are checked for key parity;
- JavaScript, JSX, MJS, imports and JSON are checked by the project quality script;
- the production workflow must pass build, bundle budgets and a release-candidate audit before deployment;
- SEO and commercial activation remain locked.

## Evidence still required from the user environment

- a green GitHub Actions run for this exact archive;
- the complete core journey in the deployed application;
- at least Chrome and Safari acceptance;
- mobile layout acceptance;
- one successful backup deletion and restoration exercise;
- confirmation that no blocking or data-loss issue was found during normal use.

## Decision rule

After the user tests this candidate, classify findings as:

- **Blocker**: application cannot start, data is lost, backup cannot restore, or a core journey cannot complete;
- **Major**: important journey is severely impaired but a workaround exists;
- **Minor**: visual, wording or convenience defect that does not block the journey.

V1.0 should be created when blockers are zero, majors are zero or explicitly accepted, and the checklist is signed off. Minor corrections can be included in V1.0 or scheduled for V1.0.1 without reopening feature development.

## Recommendation

Do not add new product features before the acceptance result. Test this release candidate for several real planning sessions, record defects with browser and steps to reproduce, then make one evidence-based V1.0 decision.
