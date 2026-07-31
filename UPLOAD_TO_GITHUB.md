# Upload V0.1 Part 7 to GitHub

1. Extract `travel-planner-v0.1-part7.zip`.
2. Open the `luciecreations60/travel-planner` repository.
3. Select **Add file → Upload files**.
4. Upload every file and folder contained inside the extracted directory.
5. Allow GitHub to replace files with identical paths.
6. Commit directly to `main` with:

```text
feat: add v0.1.6 search calendar and reporting
```

7. Open **Actions** and wait for the deployment workflow to show a green check.
8. Refresh Chrome with `Ctrl + F5` after deployment so the new service-worker cache is loaded immediately.

No change is required in **Settings → Pages**.

Existing local trips are preserved and migrated automatically to schema 6.
