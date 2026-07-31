# Upload V0.1 Part 10 to GitHub

1. Extract `travel-planner-v0.1-part10.zip`.
2. Open the `travel-planner` repository on GitHub.
3. Choose **Add file → Upload files**.
4. Upload the contents of the extracted folder and replace existing files.
5. Commit directly to `main` with:

```text
feat: add v0.1.9 itinerary route optimization
```

6. Open **Actions** and wait for the deployment workflow to become green.
7. Refresh Chrome with `Ctrl + F5` after deployment.

Existing trips are preserved and migrated automatically to schema 9.

After deployment, open a trip and select **Optimisation** / **Route planner**. At least two activities with coordinates are required for route calculations.
