# Release checklist — V0.1.22 rc.1

## Automated gate

- [ ] `npm run quality` passes.
- [ ] `npm run test` passes with no skipped or exclusive test.
- [ ] `npm run build` passes in GitHub Actions.
- [ ] `npm run performance:audit` passes.
- [ ] `npm run release:audit:ci` passes and checks the generated `dist` directory.
- [ ] GitHub Pages deployment completes successfully.

## Data safety

- [ ] Creating, updating and deleting a trip behaves as expected.
- [ ] Duplicate IDs are regenerated and private attachments are not copied.
- [ ] JSON backup export and import restore the complete test trip.
- [ ] Invalid and oversized imports are rejected with a clear error.
- [ ] Data-health cleanup removes only orphaned or obsolete cache records.
- [ ] A browser-storage reset is never performed without a backup warning.

## User experience

- [ ] Chrome, Safari, Firefox and Edge have no blocking issue.
- [ ] Desktop, tablet and mobile layouts have no horizontal page overflow.
- [ ] The sidebar, trip tabs, activity actions and dialogs remain usable.
- [ ] Keyboard navigation, visible focus and dialog focus trapping work.
- [ ] French and English interfaces are complete.
- [ ] Light, dark and system themes remain readable.

## Privacy and launch locks

- [ ] Search indexing remains disabled.
- [ ] No final domain, legal entity or definitive brand is implied.
- [ ] Affiliate providers remain disabled by default.
- [ ] Shared snapshots omit private reservation and document information.
- [ ] No analytics or diagnostic information is sent to a remote server.

## Release decision

- [ ] All blocker defects are closed.
- [ ] Major defects have either been fixed or explicitly accepted.
- [ ] Known limitations are current.
- [ ] A rollback path has been tested or reviewed.
- [ ] The candidate is approved for external user testing.
