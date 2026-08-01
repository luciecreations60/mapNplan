# V0.1 — Part 23 delivery notes

## Purpose

This release creates V0.1.22 rc.1 without adding a business feature. It closes the planned stabilization sequence and prepares an evidence-based V1.0 decision.

## Changes

- Changed the release stage from stabilization to release candidate.
- Added a candidate identifier while keeping the brand, domain, SEO and commercial activation locked.
- Added end-to-end domain tests for the complete local trip lifecycle.
- Added demonstration-data integrity and default-partner privacy tests.
- Added release identity, CI and documentation contract tests.
- Added a release-candidate audit that checks source and built files.
- Added a deployed `release-status.json` report.
- Added the browser acceptance plan, release checklist, limitations, readiness report and rollback procedure.
- Added a mandatory Release candidate audit step to GitHub Actions.

## Data compatibility

- Trip schema remains version 16.
- Backup format remains version 2.
- No migration or data reset is required.
- Existing trips, settings and attachments remain compatible.

## Decision

This archive is ready for controlled testing. It should become V1.0 only after the conditions in `V1_READINESS_REPORT.md` and `RELEASE_CHECKLIST.md` are met.
