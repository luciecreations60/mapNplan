# Upload V0.1 Part 23 to GitHub

1. Download and extract `travel-planner-v0.1-part23.zip`.
2. Export a JSON backup from the currently deployed application.
3. Open the GitHub repository.
4. Choose **Add file → Upload files**.
5. Upload the complete extracted contents and replace existing files.
6. Commit directly to `main` with:

```text
chore: publish v0.1.22 release candidate 1
```

7. Open **Actions** and confirm these steps are green:

```text
Project quality checks
Automated tests
Production build
Build size audit
Release candidate audit
Upload production artifact
Deploy to GitHub Pages
```

8. Open the deployed site and verify that Settings displays version `0.1.22`.
9. Open `/release-status.json` under the GitHub Pages site and confirm `passed: true` and `buildChecked: true`.
10. Follow `RELEASE_CANDIDATE_TEST_PLAN.md` before discussing V1.0.

## Rollback

Keep the Part 22 archive and the pre-update JSON backup until the complete acceptance plan passes. See `ROLLBACK.md` for the recovery procedure.
