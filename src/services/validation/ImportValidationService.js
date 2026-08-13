const BACKUP_FORMAT = 'mapnplan-backup';
const SHARE_FORMAT = 'mapnplan-share';

export const IMPORT_LIMITS = Object.freeze({
  maximumTrips: 500,
  maximumAttachments: 2500,
  maximumStringLength: 100_000,
  maximumDataUrlLength: 24 * 1024 * 1024,
});

export class ImportValidationError extends Error {
  constructor(message, code = 'INVALID_IMPORT') {
    super(message);
    this.name = 'ImportValidationError';
    this.code = code;
  }
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertCollection(value, label, maximum) {
  if (!Array.isArray(value)) {
    throw new ImportValidationError(`${label} must be an array.`, 'INVALID_COLLECTION');
  }
  if (value.length > maximum) {
    throw new ImportValidationError(`${label} contains too many entries.`, 'IMPORT_LIMIT_EXCEEDED');
  }
}

function assertPlainRecords(records, label) {
  for (const record of records) {
    if (!isPlainObject(record)) {
      throw new ImportValidationError(`${label} contains an invalid record.`, 'INVALID_RECORD');
    }
  }
}

function containsOversizedString(value, seen = new WeakSet()) {
  if (typeof value === 'string') return value.length > IMPORT_LIMITS.maximumStringLength;
  if (!value || typeof value !== 'object') return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.some((item) => containsOversizedString(item, seen));
  return Object.values(value).some((item) => containsOversizedString(item, seen));
}

export function validateBackupPayload(payload) {
  if (!isPlainObject(payload) || payload.format !== BACKUP_FORMAT) {
    throw new ImportValidationError('This file is not a compatible mapnplan backup.', 'INVALID_FORMAT');
  }

  const version = Number(payload.version) || 1;
  if (![1, 2].includes(version)) {
    throw new ImportValidationError('This backup version is not supported.', 'UNSUPPORTED_VERSION');
  }

  assertCollection(payload.trips, 'Trips', IMPORT_LIMITS.maximumTrips);
  const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];
  assertCollection(attachments, 'Attachments', IMPORT_LIMITS.maximumAttachments);
  assertPlainRecords(payload.trips, 'Trips');
  assertPlainRecords(attachments, 'Attachments');

  if (containsOversizedString(payload.trips)) {
    throw new ImportValidationError('The backup contains an unexpectedly large text value.', 'IMPORT_LIMIT_EXCEEDED');
  }

  for (const attachment of attachments) {
    if (!attachment.id || !attachment.tripId || !attachment.documentId) {
      throw new ImportValidationError('An attachment is missing required identifiers.', 'INVALID_ATTACHMENT');
    }
    if (typeof attachment.dataUrl !== 'string' || !attachment.dataUrl.startsWith('data:')) {
      throw new ImportValidationError('An attachment contains invalid binary data.', 'INVALID_ATTACHMENT');
    }
    if (attachment.dataUrl.length > IMPORT_LIMITS.maximumDataUrlLength) {
      throw new ImportValidationError('An attachment exceeds the supported import size.', 'IMPORT_LIMIT_EXCEEDED');
    }
  }

  return { trips: payload.trips, attachments, version };
}

export function validateSharedTripPayload(snapshot) {
  if (!isPlainObject(snapshot)
    || snapshot.format !== SHARE_FORMAT
    || Number(snapshot.version) !== 1
    || !isPlainObject(snapshot.trip)
    || typeof snapshot.trip.name !== 'string') {
    throw new ImportValidationError('Unsupported shared trip format.', 'INVALID_SHARE');
  }

  assertCollection(snapshot.trip.itinerary, 'Itinerary', 1000);
  assertCollection(snapshot.trip.reservations, 'Reservations', 2000);
  assertPlainRecords(snapshot.trip.itinerary, 'Itinerary');
  assertPlainRecords(snapshot.trip.reservations, 'Reservations');

  if (containsOversizedString(snapshot.trip)) {
    throw new ImportValidationError('The shared trip contains an unexpectedly large text value.', 'IMPORT_LIMIT_EXCEEDED');
  }

  return snapshot;
}
