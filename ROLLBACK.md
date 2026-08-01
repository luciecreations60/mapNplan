# Rollback procedure

GitHub and browser storage must be treated separately: reverting deployed code does not automatically restore local user data.

## Before uploading the release candidate

1. Download a complete JSON backup from the currently deployed application.
2. Keep the previous working ZIP and note its commit hash in GitHub.
3. Avoid resetting browser data while the new deployment is being verified.

## Revert the deployed code

Preferred GitHub method:

1. Open the repository commit history.
2. Locate the commit that uploaded V0.1.22 rc.1.
3. Use GitHub's revert action when available, or restore the complete previous archive.
4. Commit the restored files to `main`.
5. Wait for the validation and Pages deployment workflow to finish.
6. Hard-refresh the browser and allow the versioned service worker to update.

## Restore local data

If trips are missing or incorrect after a browser reset:

1. Open **Settings → Backup and restore**.
2. Import the JSON backup created before the update.
3. Verify trips, documents and attachment counts before continuing.
4. Keep the backup until several sessions have completed successfully.

## Service-worker recovery

When a browser keeps an obsolete shell after a rollback:

1. Close all tabs for the site.
2. Reopen the site and hard-refresh.
3. In developer tools, unregister the service worker only as a last resort.
4. Do not clear site storage unless a valid backup is available.

## Incident information to record

Capture the deployed version, browser, device, exact action, expected result, actual result, console error and whether the issue reproduces with demonstration data. This information determines whether the fix belongs in the candidate or a later maintenance release.
