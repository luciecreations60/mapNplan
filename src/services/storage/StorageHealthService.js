import { estimateJsonBytes, findOrphanAttachmentIds, summarizeTripVolume } from '../../utils/storageMaintenance.js';
import { attachmentStorageService } from './AttachmentStorageService.js';
import { localStorageService } from './LocalStorageService.js';
import { responseCacheService } from './ResponseCacheService.js';

/**
 * Coordinates browser-storage diagnostics and conservative maintenance.
 *
 * Repair operations only remove cache entries, stale recovery snapshots and
 * binary attachments whose parent document no longer exists. Trip data is
 * never silently rewritten or deleted by this service.
 */
class StorageHealthService {
  async analyse(trips) {
    const [attachmentRecords, attachmentUsage, persistence] = await Promise.all([
      attachmentStorageService.listAllMetadata().catch(() => []),
      attachmentStorageService.getUsage().catch(() => ({
        supported: false,
        attachmentCount: 0,
        attachmentBytes: 0,
        originUsage: 0,
        quota: 0,
      })),
      this.#readPersistenceStatus(),
    ]);

    const orphanAttachmentIds = findOrphanAttachmentIds(attachmentRecords, trips);
    const namespaceEntries = localStorageService.listNamespaceEntries();
    const localBytes = namespaceEntries.reduce((total, entry) => total + entry.bytes, 0);
    const recoveryEntries = localStorageService.listRecoveryEntries();
    const cacheSummary = responseCacheService.getSummary();
    const volume = summarizeTripVolume(trips);

    return {
      checkedAt: new Date().toISOString(),
      status: orphanAttachmentIds.length > 0 ? 'attention' : 'healthy',
      localStorage: {
        entryCount: namespaceEntries.length,
        bytes: localBytes,
        tripsBytes: estimateJsonBytes(trips),
        recoveryCount: recoveryEntries.length,
      },
      indexedDb: {
        ...attachmentUsage,
        orphanCount: orphanAttachmentIds.length,
        orphanAttachmentIds,
      },
      cache: cacheSummary,
      persistence,
      volume,
    };
  }

  async clean(trips) {
    const attachments = await attachmentStorageService.listAllMetadata().catch(() => []);
    const orphanAttachmentIds = findOrphanAttachmentIds(attachments, trips);
    let deletedAttachments = 0;

    for (const attachmentId of orphanAttachmentIds) {
      await attachmentStorageService.delete(attachmentId);
      deletedAttachments += 1;
    }

    const removedCacheEntries = responseCacheService.cleanup();
    const removedRecoveryEntries = localStorageService.pruneRecoveryEntries(2);

    return {
      deletedAttachments,
      removedCacheEntries,
      removedRecoveryEntries,
    };
  }

  async requestPersistentStorage() {
    if (!navigator.storage?.persist) return false;
    try {
      return Boolean(await navigator.storage.persist());
    } catch {
      return false;
    }
  }

  async #readPersistenceStatus() {
    if (!navigator.storage?.persisted) return { supported: false, persisted: false };
    try {
      return { supported: true, persisted: Boolean(await navigator.storage.persisted()) };
    } catch {
      return { supported: true, persisted: false };
    }
  }
}

export const storageHealthService = new StorageHealthService();
