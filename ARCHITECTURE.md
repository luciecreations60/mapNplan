# Architecture — V0.1.12

## Data boundaries

### Trip domain data

Trip metadata, itinerary, reservations, expenses, document records and file
metadata are normalized by `TripService` and persisted through
`LocalStorageService`.

### Binary attachments

`AttachmentStorageService` stores `Blob` values in IndexedDB. Each record is
indexed by `tripId` and `documentId` and contains:

- file identifier;
- trip and document identifiers;
- optional reservation identifier;
- name, MIME type, size and timestamps;
- the binary `Blob`.

React components never access IndexedDB directly. They call the storage service,
which can later be replaced by Supabase Storage, S3 or another provider.

## Document model

Each trip document now contains:

```js
{
  id,
  type,
  title,
  reference,
  url,
  expiryDate,
  notes,
  linkedReservationId,
  attachments: [{ id, name, type, size, lastModified, createdAt, updatedAt }]
}
```

The metadata allows rendering and searching without reading binary values.

## Backup format 2

`DataPortabilityService` exports trips and attachment records. Binary values are
encoded as data URLs only during export. Version 1 backups remain importable and
produce an empty attachment collection.

## Privacy rules

- Public share snapshots do not contain documents or binary files.
- Local attachments remain in the current browser profile.
- Deletion and reset operations clean up IndexedDB records.
- Imported backups replace both trips and the local file vault atomically at the
  application workflow level.

## Future backend migration

The attachment service boundary maps directly to a future object-storage API.
Only the service implementation and synchronization orchestration should need
to change; document components and domain metadata can remain stable.
