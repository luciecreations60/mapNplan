import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeReservationText } from '../src/utils/reservationImport.js';

const OPTIONS = Object.freeze({
  currency: 'EUR',
  tripStartDate: '2026-04-10',
  tripEndDate: '2026-04-20',
  fileName: 'confirmation.pdf',
});

test('a document with no matching keyword is not classified as accommodation by default', () => {
  const draft = analyzeReservationText([
    'Prestataire local',
    'Confirmation ABC123',
    'Total : 156,00 EUR',
  ].join('\n'), OPTIONS);

  assert.notEqual(draft.type, 'accommodation');
});

test('the airline decides the type even when the wording is neutral', () => {
  const draft = analyzeReservationText([
    'Air France',
    'Réservation confirmée',
    'Dossier : ABC123',
    'Départ : Paris Charles de Gaulle',
    'Arrivée : Ajaccio Napoléon Bonaparte',
    'Total : 156,00 EUR',
  ].join('\n'), OPTIONS);

  assert.equal(draft.type, 'flight');
  assert.equal(draft.origin, 'Paris Charles de Gaulle');
  assert.equal(draft.destination, 'Ajaccio Napoléon Bonaparte');
});

test('a rail operator outweighs an isolated flight keyword', () => {
  const draft = analyzeReservationText([
    'Trenitalia',
    'PNR: QWERTY',
    'Roma Termini 16/04/2026 10h20',
    'Firenze SMN 16/04/2026 11h55',
  ].join('\n'), OPTIONS);

  assert.equal(draft.type, 'transport');
  assert.equal(draft.origin, 'Roma Termini');
  assert.equal(draft.destination, 'Firenze SMN');
});

test('two stop lines carrying a date become the origin and destination', () => {
  const draft = analyzeReservationText([
    'SNCF Connect',
    'Dossier : XKPLMN',
    'Paris Gare de Lyon 12/04/2026 08h14',
    'Marseille St-Charles 12/04/2026 11h33',
  ].join('\n'), OPTIONS);

  assert.equal(draft.location, 'Paris Gare de Lyon → Marseille St-Charles');
});

test('an arrow between two places is read as a route', () => {
  const draft = analyzeReservationText([
    'Corsica Ferries',
    'Billet n° CF-889221',
    'Toulon → Bastia',
    '14/04/2026 20h00',
  ].join('\n'), OPTIONS);

  assert.equal(draft.origin, 'Toulon');
  assert.equal(draft.destination, 'Bastia');
});

test('an accommodation never produces a route from its check-in and check-out labels', () => {
  const draft = analyzeReservationText([
    'Booking.com',
    'Numéro de confirmation : 4872913055',
    'Hôtel du Vieux Port',
    'Arrivée : mardi 14 avril 2026 à partir de 15:00',
    'Départ : vendredi 17 avril 2026 avant 11:00',
  ].join('\n'), OPTIONS);

  assert.equal(draft.type, 'accommodation');
  assert.equal(draft.origin, '');
  assert.equal(draft.location, 'Hôtel du Vieux Port');
});
