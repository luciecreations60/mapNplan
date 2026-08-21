import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { dataPortabilityService } from '../services/data/DataPortabilityService.js';
import { attachmentStorageService } from '../services/storage/AttachmentStorageService.js';
import { tripService } from '../services/trips/TripService.js';
import {
  deleteTripRemote,
  mergeTripsByRecency,
  pullTrips,
  pushAllTrips,
  pushTrip,
} from '../services/trips/TripCloudSyncService.js';
import { useAuth } from '../auth/AuthContext.jsx';

export const TripContext = createContext(null);

/**
 * Keeps React synchronized with the persistence service.
 *
 * Components never access LocalStorage (or Supabase) directly. Every trip
 * read stays local-first and synchronous (localStorage), so existing pages
 * are unaffected. Cloud sync runs as a best-effort side effect: on sign-in,
 * local and remote trips are merged (most recently updated wins); after every
 * mutation, the affected trip is pushed to Supabase in the background.
 */
export function TripProvider({ children }) {
  const { user } = useAuth();
  const ownerId = user?.id || null;
  const [trips, setTrips] = useState(() => tripService.getAll());

  useEffect(() => {
    if (!ownerId) return undefined;
    let cancelled = false;

    (async () => {
      const remoteTrips = await pullTrips(ownerId);
      if (cancelled) return;
      const localTrips = tripService.getAll();
      const merged = mergeTripsByRecency(localTrips, remoteTrips);
      const normalized = tripService.replaceAll(merged);
      if (cancelled) return;
      setTrips(normalized);
      pushAllTrips(normalized, ownerId);
    })();

    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  const refreshTrips = useCallback(() => {
    const nextTrips = tripService.getAll();
    setTrips(nextTrips);
    return nextTrips;
  }, []);

  const getTripById = useCallback(
    (id) => trips.find((trip) => trip.id === id) || null,
    [trips],
  );

  const createTrip = useCallback((payload) => {
    const createdTrip = tripService.create(payload);
    setTrips(tripService.getAll());
    if (ownerId) pushTrip(createdTrip, ownerId);
    return createdTrip;
  }, [ownerId]);

  const updateTrip = useCallback((id, patch) => {
    const updatedTrip = tripService.update(id, patch);
    setTrips(tripService.getAll());
    if (ownerId && updatedTrip) pushTrip(updatedTrip, ownerId);
    return updatedTrip;
  }, [ownerId]);

  const duplicateTrip = useCallback((id, name) => {
    const duplicatedTrip = tripService.duplicate(id, name);
    if (duplicatedTrip) {
      setTrips(tripService.getAll());
      if (ownerId) pushTrip(duplicatedTrip, ownerId);
    }
    return duplicatedTrip;
  }, [ownerId]);

  const toggleTripFavorite = useCallback((id) => {
    const updatedTrip = tripService.toggleFavorite(id);
    if (updatedTrip) {
      setTrips(tripService.getAll());
      if (ownerId) pushTrip(updatedTrip, ownerId);
    }
    return updatedTrip;
  }, [ownerId]);

  const toggleTripPinned = useCallback((id) => {
    const updatedTrip = tripService.togglePinned(id);
    if (updatedTrip) {
      setTrips(tripService.getAll());
      if (ownerId) pushTrip(updatedTrip, ownerId);
    }
    return updatedTrip;
  }, [ownerId]);

  const archiveTrip = useCallback((id) => {
    const archivedTrip = tripService.archive(id);
    if (archivedTrip) {
      setTrips(tripService.getAll());
      if (ownerId) pushTrip(archivedTrip, ownerId);
    }
    return archivedTrip;
  }, [ownerId]);

  const restoreTrip = useCallback((id) => {
    const restoredTrip = tripService.restore(id);
    if (restoredTrip) {
      setTrips(tripService.getAll());
      if (ownerId) pushTrip(restoredTrip, ownerId);
    }
    return restoredTrip;
  }, [ownerId]);

  const deleteTrip = useCallback((id) => {
    const deleted = tripService.remove(id);
    if (deleted) {
      setTrips(tripService.getAll());
      attachmentStorageService.deleteByTrip(id).catch(() => undefined);
      if (ownerId) deleteTripRemote(id, ownerId);
    }
    return deleted;
  }, [ownerId]);

  const exportBackup = useCallback(async () => {
    const currentTrips = tripService.getAll();
    const validDocumentKeys = new Set(
      currentTrips.flatMap((trip) => trip.documents.map((document) => `${trip.id}:${document.id}`)),
    );
    const attachments = (await attachmentStorageService.exportRecords())
      .filter((attachment) => validDocumentKeys.has(`${attachment.tripId}:${attachment.documentId}`));
    return dataPortabilityService.downloadBackup(currentTrips, attachments);
  }, []);

  const importBackup = useCallback(async (file) => {
    const backup = await dataPortabilityService.readBackup(file);
    const attachmentMetadataByDocument = backup.attachments.reduce((result, attachment) => {
      if (!attachment?.tripId || !attachment?.documentId || !attachment?.id) return result;
      const key = `${attachment.tripId}:${attachment.documentId}`;
      const metadata = {
        id: String(attachment.id),
        name: String(attachment.name || 'attachment'),
        type: String(attachment.type || 'application/octet-stream'),
        size: Math.max(0, Number(attachment.size) || 0),
        lastModified: Math.max(0, Number(attachment.lastModified) || 0),
        createdAt: attachment.createdAt || new Date().toISOString(),
        updatedAt: attachment.updatedAt || attachment.createdAt || new Date().toISOString(),
      };
      result.set(key, [...(result.get(key) || []), metadata]);
      return result;
    }, new Map());

    const preparedTrips = backup.trips.map((trip) => ({
      ...trip,
      documents: Array.isArray(trip.documents)
        ? trip.documents.map((document) => ({
            ...document,
            attachments: attachmentMetadataByDocument.get(`${trip.id}:${document.id}`) || [],
          }))
        : [],
    }));
    const normalizedTrips = tripService.replaceAll(preparedTrips);
    const validDocumentKeys = new Set(
      normalizedTrips.flatMap((trip) => trip.documents.map((document) => `${trip.id}:${document.id}`)),
    );
    const validAttachments = backup.attachments
      .filter((attachment) => validDocumentKeys.has(`${attachment.tripId}:${attachment.documentId}`));

    await attachmentStorageService.clear();
    await attachmentStorageService.importRecords(validAttachments);
    setTrips(normalizedTrips);
    if (ownerId) pushAllTrips(normalizedTrips, ownerId);
    return { trips: normalizedTrips, attachmentCount: validAttachments.length };
  }, [ownerId]);

  const clearLocalTripData = useCallback(async () => {
    await attachmentStorageService.clear();
    const emptyTripLibrary = tripService.clearLocalTripData();
    setTrips(emptyTripLibrary);
    return emptyTripLibrary;
  }, []);

  const value = useMemo(
    () => ({
      trips,
      getTripById,
      createTrip,
      updateTrip,
      duplicateTrip,
      toggleTripFavorite,
      toggleTripPinned,
      archiveTrip,
      restoreTrip,
      deleteTrip,
      clearLocalTripData,
      exportBackup,
      importBackup,
      refreshTrips,
    }),
    [
      trips,
      getTripById,
      createTrip,
      updateTrip,
      duplicateTrip,
      toggleTripFavorite,
      toggleTripPinned,
      archiveTrip,
      restoreTrip,
      deleteTrip,
      clearLocalTripData,
      exportBackup,
      importBackup,
      refreshTrips,
    ],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}
