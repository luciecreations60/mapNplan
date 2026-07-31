import { createContext, useCallback, useMemo, useState } from 'react';
import { dataPortabilityService } from '../services/data/DataPortabilityService.js';
import { attachmentStorageService } from '../services/storage/AttachmentStorageService.js';
import { tripService } from '../services/trips/TripService.js';

export const TripContext = createContext(null);

/**
 * Keeps React synchronized with the persistence service.
 *
 * Components never access LocalStorage directly. This boundary will later let
 * us replace the browser repository with a remote API without rewriting pages.
 */
export function TripProvider({ children }) {
  const [trips, setTrips] = useState(() => tripService.getAll());

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
    return createdTrip;
  }, []);

  const updateTrip = useCallback((id, patch) => {
    const updatedTrip = tripService.update(id, patch);
    setTrips(tripService.getAll());
    return updatedTrip;
  }, []);

  const duplicateTrip = useCallback((id, name) => {
    const duplicatedTrip = tripService.duplicate(id, name);
    if (duplicatedTrip) setTrips(tripService.getAll());
    return duplicatedTrip;
  }, []);

  const toggleTripFavorite = useCallback((id) => {
    const updatedTrip = tripService.toggleFavorite(id);
    if (updatedTrip) setTrips(tripService.getAll());
    return updatedTrip;
  }, []);

  const toggleTripPinned = useCallback((id) => {
    const updatedTrip = tripService.togglePinned(id);
    if (updatedTrip) setTrips(tripService.getAll());
    return updatedTrip;
  }, []);

  const archiveTrip = useCallback((id) => {
    const archivedTrip = tripService.archive(id);
    if (archivedTrip) setTrips(tripService.getAll());
    return archivedTrip;
  }, []);

  const restoreTrip = useCallback((id) => {
    const restoredTrip = tripService.restore(id);
    if (restoredTrip) setTrips(tripService.getAll());
    return restoredTrip;
  }, []);

  const deleteTrip = useCallback((id) => {
    const deleted = tripService.remove(id);
    if (deleted) {
      setTrips(tripService.getAll());
      attachmentStorageService.deleteByTrip(id).catch(() => undefined);
    }
    return deleted;
  }, []);

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
    return { trips: normalizedTrips, attachmentCount: validAttachments.length };
  }, []);

  const resetDemoData = useCallback(async () => {
    await attachmentStorageService.clear();
    const demoTrips = tripService.resetDemoData();
    setTrips(demoTrips);
    return demoTrips;
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
      resetDemoData,
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
      resetDemoData,
      exportBackup,
      importBackup,
      refreshTrips,
    ],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}
