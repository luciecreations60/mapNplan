# Upload V0.1 Part 6 to GitHub

1. Extract `travel-planner-v0.1-part6.zip`.
2. Open the GitHub repository `luciecreations60/travel-planner`.
3. Select **Add file → Upload files**.
4. Drag every file and folder contained inside the extracted directory.
5. Allow GitHub to replace files with identical paths.
6. Commit directly to `main` with:

```text
feat: add v0.1.5 editing and trip lifecycle
```

7. Open **Actions** and wait for the deployment workflow to display a green check.
8. Open the deployed website and refresh Chrome with `Ctrl + F5` if the previous cache is still visible.

No change is required in **Settings → Pages**.

## Recommended checks after deployment

- **My trips → edit icon**: update a trip.
- **My trips → duplicate icon**: create a copy.
- **My trips → Archive**: move a trip to **Archived**.
- **Archived → Restore**: return it to active trips.
- Open a trip and edit an activity, reservation and document.
