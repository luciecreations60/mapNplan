# Architecture — V0.1.16

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
