# Upload V0.1 Part 11 to GitHub

1. Extract `travel-planner-v0.1-part11.zip`.
2. Open the GitHub repository `luciecreations60/travel-planner`.
3. Choose **Add file → Upload files**.
4. Upload the complete contents of the extracted folder.
5. Confirm replacement of existing files.
6. Commit directly to `main` with:

```text
feat: add v0.1.10 shared expenses and settlements
```

7. Open **Actions** and wait for the deployment workflow to become green.
8. Refresh Chrome with `Ctrl + F5` after deployment.

No GitHub Pages setting needs to be changed.

## Recommended acceptance test

1. Open a trip and select **Group expenses / Dépenses de groupe**.
2. Rename the generated second traveller.
3. Add a €100 expense paid by the first traveller and split between both.
4. Confirm that the second traveller owes €50.
5. Record a €20 reimbursement.
6. Confirm that the remaining suggested reimbursement is €30.
7. Add a €200 expense with only €50 paid and confirm the partial status.
8. Export the CSV and open it in a spreadsheet application.
