import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { analyzeReservationText, findLikelyDuplicateReservation } from '../src/utils/reservationImport.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('reservation import detects a French accommodation booking without re-entry', () => {
  const result = analyzeReservationText(`
Booking.com
Camping Kaliste
Adresse : Saint-Florent, Corse, France
Numéro de réservation : ABCD1234
Arrivée 29/08/2026 23:00
Départ 05/09/2026 10:00
Prix total 693,00 €
Réservation confirmée
`, { currency: 'EUR', tripStartDate: '2026-08-29', tripEndDate: '2026-09-12' });

  assert.equal(result.type, 'accommodation');
  assert.equal(result.provider, 'Booking.com');
  assert.equal(result.title, 'Camping Kaliste');
  assert.equal(result.confirmationNumber, 'ABCD1234');
  assert.equal(result.startDate, '2026-08-29');
  assert.equal(result.startTime, '23:00');
  assert.equal(result.endDate, '2026-09-05');
  assert.equal(result.endTime, '10:00');
  assert.equal(result.location, 'Saint-Florent, Corse, France');
  assert.equal(result.amount, 693);
});

test('reservation import keeps four digit amounts and detects duplicates', () => {
  const result = analyzeReservationText(`
Air France
Flight AF1234
Booking reference: Q7L2PX
Departure 03 September 2026 10:25
Arrival 04 September 2026 07:10
Total EUR 1218.70
Confirmed
`, { currency: 'EUR' });
  assert.equal(result.type, 'flight');
  assert.equal(result.amount, 1218.7);
  assert.equal(result.confirmationNumber, 'Q7L2PX');

  const duplicate = findLikelyDuplicateReservation([
    { id: 'reservation-1', title: 'Flight AF1234', provider: 'Air France', confirmationNumber: 'Q7L2PX', startDate: '2026-09-03' },
  ], result);
  assert.equal(duplicate?.reservation?.id, 'reservation-1');
  assert.equal(duplicate?.reason, 'reference');
});

test('import UI requires review before updating trip sections', () => {
  const dialog = read('src/components/tripWorkspace/ReservationImportDialog.jsx');
  const panel = read('src/components/tripWorkspace/ReservationsPanel.jsx');
  const service = read('src/services/import/ReservationDocumentImportService.js');

  assert.match(dialog, /importReviewTitle/);
  assert.match(dialog, /duplicateConfirmed/);
  assert.match(dialog, /importTargetItinerary/);
  assert.match(dialog, /importTargetExpense/);
  assert.match(dialog, /importTargetDocument/);
  assert.match(dialog, /onConfirm\(\{/);
  assert.match(panel, /confirmImportedReservation/);
  assert.match(panel, /upsertActivityAcrossDates/);
  assert.match(panel, /sourceActivitySeriesId/);
  assert.match(panel, /attachmentStorageService\.saveFile/);
  assert.match(panel, /expenses: nextExpenses/);
  assert.match(service, /pdfjs-dist/);
  assert.match(service, /tesseract\.js/);
  assert.doesNotMatch(service, /api[_-]?key/i);
});
