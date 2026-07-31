const BACKUP_FORMAT = 'travel-planner-backup';
const BACKUP_VERSION = 2;
const MAX_BACKUP_SIZE = 120 * 1024 * 1024;

/**
 * Creates and validates portable JSON backups.
 *
 * Version 2 can include IndexedDB attachment records encoded as data URLs.
 * Version 1 backups remain supported and simply import without binary files.
 */
class DataPortabilityService {
  createBackup(trips, attachments = []) {
    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      trips,
      attachments,
    };
  }

  downloadBackup(trips, attachments = []) {
    const backup = this.createBackup(trips, attachments);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = this.#buildFileName();
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    return backup;
  }

  async readBackup(file) {
    if (!file) throw new Error('Choose a backup file first.');
    if (file.size > MAX_BACKUP_SIZE) throw new Error('The backup file is larger than 120 MB.');

    let payload;
    try {
      payload = JSON.parse(await file.text());
    } catch {
      throw new Error('This file is not valid JSON.');
    }

    if (payload?.format !== BACKUP_FORMAT) {
      throw new Error('This file is not a compatible travel-planner backup.');
    }

    if (!Array.isArray(payload.trips)) {
      throw new Error('The backup does not contain a valid trips collection.');
    }

    return {
      trips: payload.trips,
      attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
      version: Number(payload.version) || 1,
    };
  }

  #buildFileName() {
    const timestamp = new Date().toISOString().replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z');
    return `travel-planner-backup-${timestamp}.json`;
  }
}

export const dataPortabilityService = new DataPortabilityService();
