import { createId } from '../../utils/id.js';

const DATABASE_NAME = 'tripflow-attachments';
const DATABASE_VERSION = 1;
const STORE_NAME = 'attachments';
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_MIME_PREFIXES = ['image/'];
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

/**
 * Stores binary travel files outside LocalStorage.
 *
 * IndexedDB keeps PDFs and images as Blob values while trip documents only
 * retain lightweight metadata. This preserves the synchronous trip domain API
 * and avoids LocalStorage quota failures.
 */
class AttachmentStorageService {
  #databasePromise = null;

  isSupported() {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  validateFile(file) {
    if (!file) throw new Error('A file is required.');
    if (file.size <= 0) throw new Error('The selected file is empty.');
    if (file.size > MAX_FILE_SIZE) throw new Error('The selected file is larger than 15 MB.');

    const isAllowed = ALLOWED_MIME_TYPES.has(file.type)
      || ALLOWED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix))
      || !file.type;

    if (!isAllowed) throw new Error('This file type is not supported.');
    return true;
  }

  async saveFile({ file, tripId, documentId, reservationId = null }) {
    this.validateFile(file);
    const now = new Date().toISOString();
    const record = {
      id: createId('attachment'),
      tripId: String(tripId),
      documentId: String(documentId),
      reservationId: reservationId ? String(reservationId) : null,
      name: file.name || 'attachment',
      type: file.type || 'application/octet-stream',
      size: Number(file.size) || 0,
      lastModified: Number(file.lastModified) || Date.now(),
      createdAt: now,
      updatedAt: now,
      blob: file,
    };

    await this.#put(record);
    return this.toMetadata(record);
  }

  async get(id) {
    const database = await this.#openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(String(id));
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Unable to read the file.'));
    });
  }

  async listByTrip(tripId) {
    return this.#getAllByIndex('tripId', String(tripId));
  }

  async listByDocument(documentId) {
    return this.#getAllByIndex('documentId', String(documentId));
  }

  async rename(id, name) {
    const record = await this.get(id);
    if (!record) return null;
    const nextName = String(name || '').trim();
    if (!nextName) throw new Error('A file name is required.');
    const updated = { ...record, name: nextName, updatedAt: new Date().toISOString() };
    await this.#put(updated);
    return this.toMetadata(updated);
  }

  async updateDocumentAssociation(documentId, reservationId = null) {
    const records = await this.listByDocument(documentId);
    await Promise.all(records.map((record) => this.#put({
      ...record,
      reservationId: reservationId ? String(reservationId) : null,
      updatedAt: new Date().toISOString(),
    })));
    return records.length;
  }

  async delete(id) {
    const database = await this.#openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(String(id));
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error || new Error('Unable to delete the file.'));
    });
  }

  async deleteByDocument(documentId) {
    const records = await this.listByDocument(documentId);
    await Promise.all(records.map((record) => this.delete(record.id)));
    return records.length;
  }

  async deleteByTrip(tripId) {
    const records = await this.listByTrip(tripId);
    await Promise.all(records.map((record) => this.delete(record.id)));
    return records.length;
  }

  async clear() {
    if (!this.isSupported()) return true;
    const database = await this.#openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).clear();
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error || new Error('Unable to clear local files.'));
    });
  }

  async getUsage() {
    if (!this.isSupported()) {
      return { supported: false, attachmentCount: 0, attachmentBytes: 0, originUsage: 0, quota: 0 };
    }

    const records = await this.#getAll();
    let estimate = null;
    if (navigator.storage?.estimate) {
      try {
        estimate = await navigator.storage.estimate();
      } catch {
        estimate = null;
      }
    }
    return {
      supported: true,
      attachmentCount: records.length,
      attachmentBytes: records.reduce((sum, record) => sum + (Number(record.size) || 0), 0),
      originUsage: Number(estimate?.usage) || 0,
      quota: Number(estimate?.quota) || 0,
    };
  }

  async exportRecords() {
    if (!this.isSupported()) return [];
    const records = await this.#getAll();
    return Promise.all(records.map(async (record) => ({
      ...this.toMetadata(record),
      tripId: record.tripId,
      documentId: record.documentId,
      reservationId: record.reservationId || null,
      dataUrl: await this.#blobToDataUrl(record.blob),
    })));
  }

  async importRecords(records) {
    if (!Array.isArray(records) || records.length === 0) return 0;
    let imported = 0;

    for (const source of records) {
      if (!source?.id || !source?.tripId || !source?.documentId || !source?.dataUrl) continue;
      const blob = await this.#dataUrlToBlob(source.dataUrl);
      const record = {
        id: String(source.id),
        tripId: String(source.tripId),
        documentId: String(source.documentId),
        reservationId: source.reservationId ? String(source.reservationId) : null,
        name: String(source.name || 'attachment'),
        type: String(source.type || blob.type || 'application/octet-stream'),
        size: Number(source.size) || blob.size,
        lastModified: Number(source.lastModified) || Date.now(),
        createdAt: source.createdAt || new Date().toISOString(),
        updatedAt: source.updatedAt || source.createdAt || new Date().toISOString(),
        blob,
      };
      await this.#put(record);
      imported += 1;
    }

    return imported;
  }

  toMetadata(record) {
    return {
      id: String(record.id),
      name: String(record.name || 'attachment'),
      type: String(record.type || 'application/octet-stream'),
      size: Number(record.size) || 0,
      lastModified: Number(record.lastModified) || 0,
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
    };
  }

  async #put(record) {
    const database = await this.#openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(record);
      transaction.oncomplete = () => resolve(record);
      transaction.onerror = () => reject(transaction.error || new Error('Unable to save the file.'));
    });
  }

  async #getAll() {
    const database = await this.#openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error('Unable to list local files.'));
    });
  }

  async #getAllByIndex(indexName, value) {
    const database = await this.#openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).index(indexName).getAll(value);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error('Unable to list local files.'));
    });
  }

  #openDatabase() {
    if (!this.isSupported()) return Promise.reject(new Error('IndexedDB is not available in this browser.'));
    if (this.#databasePromise) return this.#databasePromise;

    this.#databasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        const store = database.objectStoreNames.contains(STORE_NAME)
          ? request.transaction.objectStore(STORE_NAME)
          : database.createObjectStore(STORE_NAME, { keyPath: 'id' });

        if (!store.indexNames.contains('tripId')) store.createIndex('tripId', 'tripId', { unique: false });
        if (!store.indexNames.contains('documentId')) store.createIndex('documentId', 'documentId', { unique: false });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Unable to open local file storage.'));
      request.onblocked = () => reject(new Error('Local file storage is blocked by another tab.'));
    });

    return this.#databasePromise;
  }

  #blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('Unable to encode the file.'));
      reader.readAsDataURL(blob);
    });
  }

  async #dataUrlToBlob(dataUrl) {
    const response = await fetch(dataUrl);
    return response.blob();
  }
}

export const attachmentStorageService = new AttachmentStorageService();
export const ATTACHMENT_MAX_FILE_SIZE = MAX_FILE_SIZE;
