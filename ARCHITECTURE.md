# Architecture — V0.1.17

## Commercial preparation boundary

Part 17 keeps trip-owned booking comparisons separate from global partner
configuration.

### Trip-owned booking options

```js
{
  id,
  category,       // hotels | flights | activities | cars | esim | insurance
  providerId,
  providerName,
  title,
  price,
  currency,
  url,
  status,         // saved | shortlisted | booked | rejected
  notes,
  createdAt,
  updatedAt,
  bookedAt
}
```

Booking options belong to a trip because they are part of the planning record,
normal backup and future remote-sync boundary.

### Global provider configuration

Provider credentials and URL templates are not duplicated inside trips. They
are stored under a dedicated LocalStorage key through `AffiliateService`:

```js
{
  schemaVersion: 1,
  disclosureEnabled,
  providers: [{
    id,
    name,
    category,
    enabled,
    affiliateCapable,
    homepageUrl,
    searchUrlTemplate,
    affiliateParameter,
    affiliateValue
  }]
}
```

Every built-in provider is disabled by default. This is an intentional safety
rule: source code never implies an active programme or inserts an invented
tracking identifier.

## URL template tokens

The service supports these encoded variables:

```text
{{destination}} {{country}} {{startDate}} {{endDate}}
{{travelers}} {{currency}} {{locale}} {{category}}
```

The provider adapter validates HTTP/HTTPS output through `normalizeExternalUrl`
before exposing a link. The affiliate parameter is appended only when the
provider is affiliate-capable and both configuration fields are present.

## Local analytics

`AffiliateService` records a maximum of 1,000 lightweight local events:

- provider clicks;
- bookings explicitly marked by the user;
- declared booking value.

These values are product-development indicators, not verified commission or
conversion reports. A future backend can replace this adapter without changing
the booking workspace.

## Trip schema 16

Trip schema 16 adds:

```js
{
  bookingOptions: BookingOption[]
}
```

Legacy trips receive an empty collection. Demonstration trips can receive
sample comparisons. Duplication regenerates identifiers and turns a previously
booked option back into a saved comparison.

## Main boundaries

- `affiliate.config.js`: categories, built-in providers and template tokens.
- `AffiliateService.js`: settings persistence, URL generation and analytics.
- `AffiliateContext.jsx`: React synchronization boundary.
- `BookingPanel.jsx`: provider discovery and per-trip comparison UI.
- `AffiliateSettingsCard.jsx`: central provider administration.
- `bookingOptions.js`: domain normalization and summaries.
- `TripService.js`: schema migration, persistence and duplication.

## V0.1.17 — SEO content studio

Editorial content is deliberately separated from trips and partner settings.
It uses its own local repository boundary:

```text
ContentStudioPage
        ↓
ContentStudioContext
        ↓
ContentStudioService
        ↓
LocalStorageService
```

The service owns normalization, slug uniqueness, JSON import/export, static
HTML generation, sitemap generation and robots-file generation. React pages do
not write editorial content directly to browser storage.

### Editorial article model

```js
{
  id,
  slug,
  language,          // en | fr
  status,            // draft | published
  title,
  metaTitle,
  metaDescription,
  destination,
  country,
  primaryKeyword,
  secondaryKeywords,
  heroImageUrl,
  heroAlt,
  excerpt,
  introduction,
  itineraryBody,
  practicalTips,
  faq,
  affiliateCategories,
  createdAt,
  updatedAt,
  publishedAt
}
```

### Static export boundary

`ContentStudioService.generateHtml()` produces one self-contained HTML page
with:

- title and meta description;
- canonical URL;
- Open Graph and Twitter metadata;
- TravelAction and FAQPage JSON-LD;
- escaped user-authored content;
- optional partner links resolved through `AffiliateService`;
- a small embedded responsive stylesheet.

No disabled provider appears in exported HTML. A selected category alone never
creates a commercial link.

### Indexation limitation

Hash-routed, LocalStorage-backed previews are not independently crawlable
public pages. The exported HTML must be committed or published to a real route
before a search engine can index it. The future CMS/backend layer can replace
the local adapter while retaining the editor and export contracts.
