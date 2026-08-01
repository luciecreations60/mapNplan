# TripFlow — Every journey starts here.

TripFlow is a modular travel planning application built with React and Vite. It currently runs without a paid backend and stores private trip data locally in the browser.

## V0.1.18 highlights

- complete trip planning workspace;
- responsive French/English interface;
- itinerary, map, reservations, budgets, shared expenses and documents;
- local collaboration, templates, saved places and booking comparison;
- SEO content studio;
- automatic generation of public static destination guides;
- `sitemap.xml`, `robots.txt`, structured data and build-time SEO audit.

## Main commands

```bash
npm install
npm run dev
npm run seo:generate
npm run seo:audit
npm run build
```

`npm run build` automatically regenerates public SEO pages from:

```text
content/seo-pages.json
```

## Public SEO outputs

```text
public/guides/
public/sitemap.xml
public/robots.txt
public/seo-status.json
```

See [SEO_GUIDE.md](SEO_GUIDE.md) for the complete publication and Google Search Console workflow.

## Deployment

The repository deploys automatically to GitHub Pages through `.github/workflows/deploy.yml` whenever `main` changes.
