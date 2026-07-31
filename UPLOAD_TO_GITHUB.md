# Upload V0.1 Part 12 to GitHub

1. Extract `travel-planner-v0.1-part12.zip`.
2. Open `luciecreations60/travel-planner` on GitHub.
3. Choose **Add file → Upload files**.
4. Upload the complete contents of the extracted folder.
5. Confirm replacement of existing files.
6. Commit directly to `main` with:

```text
feat: add v0.1.11 travel-day companion and Chrome fixes
```

7. Open **Actions** and wait for the deployment workflow to become green.
8. Refresh Chrome with `Ctrl + F5` after deployment.

No GitHub Pages setting needs to be changed.

## Recommended acceptance test

1. Open a trip containing several activities.
2. Verify that the move, edit and delete buttons remain inside every activity
   card in Chrome.
3. Change between Overview, Itinerary, Today and Reservations and confirm that
   the horizontal tab bar remains the visible navigation reference.
4. Edit an activity and confirm that the page moves to the activity form rather
   than the large trip header.
5. Open **Today / Aujourd’hui**, choose a planned date and mark an activity as
   completed.
6. Add a quick paid expense and verify it in Group expenses.
7. Save emergency information and reload the page to confirm persistence.
