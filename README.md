# TripFlow — V0.1.17

> Every journey starts here.

TripFlow is a responsive, bilingual travel-planning application built with
React and Vite. It runs without a paid backend and keeps planning data in the
browser while the architecture remains ready for remote services later.

## SEO content studio

Part 18 adds an editorial workspace for the future organic-acquisition and
affiliate strategy:

- create destination guides in French or English;
- manage drafts and locally published content;
- assess title length, meta description, keyword placement, content depth,
  URL slug, image alternative text, FAQ and required sections;
- preview destination pages without leaving the application;
- export a standalone HTML page with canonical metadata, Open Graph fields,
  Twitter card metadata and JSON-LD structured data;
- export `sitemap.xml` and `robots.txt` for a future production domain;
- export and import the local editorial library as JSON;
- include commercial blocks only for partner providers explicitly enabled in
  Settings.

The in-app preview is a local product tool. Search engines will only index a
page after its exported HTML is deployed on a public, crawlable URL.

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

GitHub Actions deploys the generated `dist` directory to GitHub Pages.
