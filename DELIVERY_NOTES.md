# V0.1 — Part 13 delivery notes

## Version

- Application: `0.1.12`
- Trip schema: `12`
- Backup format: `2`

## Added

- Local document vault backed by IndexedDB.
- PDF, image, text, Word and spreadsheet attachments.
- Maximum size of 15 MB per file.
- Multiple-file upload, limited to five files per selection.
- Image and PDF preview inside the application.
- Download, rename and deletion actions.
- Optional link between a document and a reservation.
- File metadata stored in the trip domain; binary content stored separately.
- Storage usage summary in Settings.
- Backup export/import including local attachments.
- Search support for attachment file names.

## Privacy and lifecycle

- Files stay inside the browser profile until exported.
- Shared-trip links never contain local attachment data.
- Deleting a document also deletes its binary files.
- Deleting a trip removes every attachment associated with it.
- Resetting or importing a backup clears the previous attachment vault first.
- Duplicating a trip keeps document records but does not duplicate binary files.

## Browser notes

IndexedDB is supported by current Chrome and Safari. Private browsing modes may
apply stricter quotas or remove data when the session ends.
