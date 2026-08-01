# Known limitations — V0.1.22 rc.1

These limitations are deliberate and do not represent hidden promises for the current release candidate.

## Local-only data

Trips, settings and most application data are stored in the current browser profile. There is no account, cloud synchronization or automatic multi-device recovery. Users must export JSON backups themselves. Private files use IndexedDB and are included in backup version 2 when the export completes successfully.

## Local collaboration

Participants, comments, notifications and read-only sharing simulate collaboration locally. They do not provide real-time multi-user editing, access revocation, server permissions or durable shared links.

## External services

Weather, currency, geocoding and map functions depend on third-party network services and may be unavailable, rate-limited or changed outside the application. Cached or local fallback information may be shown when supported.

## Route estimates

Itinerary optimisation and travel-time calculations are deterministic planning estimates, not live navigation. They do not replace a routing or transit provider and must not be used as guaranteed journey times.

## Offline mode

The installed application shell and existing local data can remain available offline after a successful online visit. First load, external maps, searches, live weather, currency updates and partner websites still require a network connection.

## Browser storage

Storage quotas and persistence policies differ by browser and device. Private browsing, browser cleanup, device policies and low-storage conditions can remove local data. A downloaded backup remains the safest recovery method.

## Brand, legal and commercial status

TripFlow is a provisional code name. The final company, brand, domain, legal pages, consent setup, analytics and affiliate agreements are intentionally not activated. Search-engine indexing remains disabled.

## Verification boundary

Automated source and service tests are included, but the assistant environment cannot execute the complete Vite production build because its internal npm mirror lacks `@vitejs/plugin-react`. GitHub Actions and the user's manual browser matrix are the release sources of truth.
