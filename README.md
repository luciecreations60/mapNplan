# TripFlow — V0.1 Foundation

> Every journey starts here.

TripFlow is the temporary code name for a modern travel-planning application. This first delivery establishes the visual system, navigation, persistence abstraction, dashboard, trip library, creation form, responsive layout, dark mode, PWA foundation and GitHub Pages deployment.

## Included in V0.1 — Part 1

- React 19 + Vite 8
- GitHub Pages deployment workflow
- Responsive application shell
- Light, dark and system themes
- Centralised project and branding configuration
- LocalStorage adapter hidden behind a service layer
- Trip context and CRUD foundation
- Dashboard with demonstration data
- Trip library and filters
- New trip form with validation
- Explore and Settings pages
- PWA manifest and basic service worker
- Architecture and roadmap documentation

## Repository structure

```text
travel-planner/
├── .github/workflows/deploy.yml
├── public/
├── src/
│   ├── components/
│   ├── config/
│   ├── contexts/
│   ├── data/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   └── utils/
├── ARCHITECTURE.md
├── CHANGELOG.md
├── ROADMAP.md
├── index.html
├── package.json
├── project.config.js
└── vite.config.js
```

## Upload directly through GitHub

1. Download and unzip this delivery.
2. Open the `travel-planner` repository on GitHub.
3. Select **Add file → Upload files**.
4. Drag every item inside the unzipped folder into the upload area.
5. Enter the commit message: `feat: add v0.1 foundation`.
6. Select **Commit directly to the main branch** and confirm.
7. Open **Settings → Pages**.
8. Under **Build and deployment**, select **GitHub Actions** as the source.
9. Open the **Actions** tab and wait for the deployment workflow to finish.

The site will then be available under the repository's GitHub Pages address.

## Local development later

```bash
npm install
npm run dev
```

Production verification:

```bash
npm run build
npm run preview
```

## Changing the temporary name

Edit only `project.config.js`. The application, browser title and main navigation branding derive from this central file. Additional SEO copy and assets will be centralised before the public launch.

## Data storage

V0.1 stores trips in browser LocalStorage. React components never access LocalStorage directly. They use `TripService`, which depends on `LocalStorageService`. This is intentional: a later migration to Supabase or another backend will not require rewriting the pages.
