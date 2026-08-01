# Architecture — TripFlow V0.1.18

## Runtime application

The private planning application is a React/Vite single-page application using `HashRouter`, local browser storage and service boundaries.

```text
src/
├── components/
├── config/
├── contexts/
├── data/
├── hooks/
├── layouts/
├── pages/
├── services/
├── styles/
└── utils/
```

Private trip information remains in LocalStorage and IndexedDB until a future authenticated backend is introduced.

## Static SEO publication pipeline

Search engines must not depend on the browser's private LocalStorage. Public editorial pages therefore use a separate build-time pipeline.

```text
Content Studio in browser
        │
        ├── exports seo-pages.json
        ▼
content/seo-pages.json
        │
        ├── npm run seo:generate
        ▼
public/guides/<slug>/index.html
public/guides/index.html
public/sitemap.xml
public/robots.txt
public/seo-status.json
        │
        ├── vite build
        ▼
dist/ → GitHub Pages
```

## Key SEO files

### `project.config.js`

Single source of truth for brand, version, production URL and optional Search Console verification value.

### `src/config/seo.config.js`

SEO thresholds, public path, languages and publication format.

### `content/seo-pages.json`

Versioned source file containing only reviewed public editorial content.

### `scripts/generate-seo-pages.mjs`

Creates crawlable HTML, guide index, sitemap, robots and build report.

### `scripts/audit-seo.mjs`

Checks HTTPS, placeholder domains, duplicate slugs, page availability and minimum editorial score.

### `src/services/content/ContentStudioService.js`

Maintains local drafts and exports a publication file without coupling the React page to storage details.

## Structured data

Generated guide pages include:

- `Article`;
- `BreadcrumbList`;
- `FAQPage` when questions are available.

Structured data is generated from the same normalized article model as the visible page to reduce inconsistencies.

## Design constraints

- draft content is never published automatically;
- only articles marked `published` enter the static build;
- duplicate public slugs are blocking build errors;
- partner links remain separate from SEO publication data;
- a future custom domain is changed centrally;
- generated public pages work without JavaScript.
