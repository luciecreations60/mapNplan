const BACKUP_FORMAT = 'travel-planner-backup';
const BACKUP_VERSION = 1;

/**
 * Creates and validates portable JSON backups.
 *
 * Only application domain data is exported. Browser-specific caches and theme
 * preferences remain local because they are safe to recreate on any device.
 */
class DataPortabilityService {
  createBackup(trips) {
    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      trips,
    };
  }

  downloadBackup(trips) {
    const backup = this.createBackup(trips);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = this.#buildFileName();
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }

  async readBackup(file) {
    if (!file) throw new Error('Choose a backup file first.');
    if (file.size > 10 * 1024 * 1024) throw new Error('The backup file is larger than 10 MB.');

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

    return payload.trips;
  }

  #buildFileName() {
    const timestamp = new Date().toISOString().replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z');
    return `travel-planner-backup-${timestamp}.json`;
  }
}

export const dataPortabilityService = new DataPortabilityService();
