import { validateBackupPayload } from '../validation/ImportValidationService.js';

const BACKUP_FORMAT = 'travel-planner-backup';
const BACKUP_VERSION = 2;
const MAX_BACKUP_SIZE = 120 * 1024 * 1024;

/** Creates and validates portable JSON backups. */
class DataPortabilityService {
  createBackup(trips, attachments = []) {
    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      trips: Array.isArray(trips) ? trips : [],
      attachments: Array.isArray(attachments) ? attachments : [],
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
    if (file.size <= 0) throw new Error('The selected backup file is empty.');
    if (file.size > MAX_BACKUP_SIZE) throw new Error('The backup file is larger than 120 MB.');

    let payload;
    try {
      payload = JSON.parse(await file.text());
    } catch {
      throw new Error('This file is not valid JSON.');
    }

    return validateBackupPayload(payload);
  }

  validatePayload(payload) {
    return validateBackupPayload(payload);
  }

  #buildFileName() {
    const timestamp = new Date().toISOString().replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z');
    return `travel-planner-backup-${timestamp}.json`;
  }
}

export const dataPortabilityService = new DataPortabilityService();
