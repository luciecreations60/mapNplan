# Definition of Done

A user story or feature is considered **Done** when **all** of the following criteria are met.

---

## Code Quality
- [ ] Code has been reviewed and approved by at least one other team member
- [ ] No critical or high-severity linting errors
- [ ] No `console.log` / debug statements left in production code
- [ ] No hardcoded credentials, API keys, or environment-specific values committed

## Testing
- [ ] Unit tests written and passing (coverage ≥ 80 % for changed files)
- [ ] Integration / E2E tests updated or added where applicable
- [ ] All existing tests continue to pass in CI
- [ ] Edge cases and error paths are covered

## Functionality
- [ ] Acceptance criteria from the linked issue are fully met
- [ ] Feature has been manually verified in a staging or preview environment
- [ ] No known regressions introduced

## Accessibility
- [ ] UI changes meet WCAG 2.1 AA standards
- [ ] Keyboard navigation tested
- [ ] Screen-reader labels and ARIA attributes are correct where applicable

## Performance & Observability
- [ ] No unnecessary re-renders or expensive operations introduced
- [ ] Relevant metrics / logs / traces are in place for new code paths
- [ ] Bundle size impact assessed (front-end changes)

## Security
- [ ] Input validation and sanitization applied to user-supplied data
- [ ] Authentication / authorisation checks enforced on new endpoints
- [ ] Dependency vulnerabilities checked (e.g., `npm audit`)

## Documentation
- [ ] In-code documentation (JSDoc / comments) updated where helpful
- [ ] `CHANGELOG.md` entry added for user-facing changes
- [ ] API or architectural docs updated if the contract changed
- [ ] README updated if setup steps changed

## Deployment
- [ ] Feature flag or environment variable added if gradual roll-out is needed
- [ ] Migration scripts (DB / config) reviewed and tested
- [ ] PR merged to the target branch and CI pipeline green
- [ ] Deployment to staging verified; production deployment approved by lead
