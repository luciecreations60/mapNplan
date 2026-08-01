# V0.1 Part 18 — Delivery notes

## Version

- Application: `0.1.17`
- Trip schema: unchanged at `16`
- SEO content schema: `1`
- Service-worker cache: `tripflow-v0.1.17`

## Added

- Content studio page in the main navigation.
- Local French/English destination-guide library.
- Draft and published statuses.
- Live SEO score with nine checks.
- Search, language and status filters.
- Article duplication and deletion.
- JSON import/export.
- Local public preview route: `#/guides/:slug`.
- Standalone HTML export.
- Canonical, Open Graph, Twitter and JSON-LD metadata.
- Sitemap and robots exports.
- Optional affiliate categories resolved through enabled provider settings.

## Important behaviour

- The code name and placeholder domain remain configurable.
- The default base URL is `https://example.com` and must be changed before
  production exports.
- Local previews are not public SEO pages.
- Partner links only appear when a provider is enabled and has a valid URL.
- Content remains on the current device until exported.

## Main files added

```text
src/config/seo.config.js
src/data/builtInSeoContent.js
src/utils/seoContent.js
src/services/content/ContentStudioService.js
src/contexts/ContentStudioContext.jsx
src/hooks/useContentStudio.js
src/pages/ContentStudioPage.jsx
src/pages/PublicDestinationPage.jsx
```

## Validation performed

- TypeScript parser check over every JavaScript and JSX source file.
- Direct Node syntax checks for the new non-JSX modules.
- Translation dictionary import and French/English section-count comparison.
- Content-service creation, normalization and static-HTML generation test with
  an isolated LocalStorage mock.
- Relative import resolution check.
- JSON parsing and ZIP integrity checks.
