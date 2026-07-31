# V0.1 — Part 8 delivery notes

## Version

- Application: `0.1.7`
- Trip schema: `7`

## Added

- Privacy-aware read-only sharing links.
- Standalone shared trip page that does not require local trip data.
- Downloadable `.tripflow-share.json` fallback.
- Participants with owner, editor and viewer roles.
- Local discussions attached to itinerary activities and reservations.
- Language-neutral collaboration activity log.
- Local notification centre in the top navigation.
- Automatic migration of existing trips and nested entities.

## Privacy model

Shared snapshots never contain:

- booking confirmation numbers;
- document references or URLs;
- private booking links;
- internal discussion comments;
- participant email addresses.

Budget, notes and checklist inclusion are explicitly configurable when generating a link.

## Current limitation

Collaboration is local in this version. Members and roles prepare the future data model, but real-time multi-device editing requires authentication and a backend planned for a later milestone.
