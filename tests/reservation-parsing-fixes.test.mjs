import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeReservationText } from '../src/utils/reservationImport.js';

const OPTIONS = Object.freeze({
  currency: 'EUR',
  tripStartDate: '2026-04-10',
  tripEndDate: '2026-04-20',
  fileName: 'confirmation.pdf',
});

test('a heading line never yields a fragment of a French word as the reference', () => {
  const draft = analyzeReservationText([
    'Booking.com',
    'Confirmation de réservation',
    'Numéro de confirmation : 4872913055',
    'Hôtel du Vieux Port',
    'Prix total : 342,50 €',
  ].join('\n'), OPTIONS);

  assert.equal(draft.confirmationNumber, '4872913055');
});

test('an all-caps rail booking file number is detected from the French keyword', () => {
  const draft = analyzeReservationText([
    'SNCF Connect',
    'Votre billet électronique',
    'Dossier : XKPLMN',
    'Paris Gare de Lyon 12/04/2026 08h14',
    'Montant payé : 89,00 EUR',
  ].join('\n'), OPTIONS);

  assert.equal(draft.confirmationNumber, 'XKPLMN');
  assert.equal(draft.type, 'transport');
});

test('a reference mixing letters, digits and dashes survives the keyword line', () => {
  const draft = analyzeReservationText([
    'CAMPING LES FLOTS BLEUS',
    'Confirmation de séjour n° CFB-2026-0417',
    'Du 17 avril 2026 au 20 avril 2026',
    'Total séjour : 156,00 €',
  ].join('\n'), OPTIONS);

  assert.equal(draft.confirmationNumber, 'CFB-2026-0417');
});

test('abbreviated French months followed by a period are parsed as dates', () => {
  const draft = analyzeReservationText([
    'Airbnb',
    'Code de confirmation HMQK3XZ8T2',
    'Appartement lumineux vue mer - Nice',
    'Arrivée jeu. 16 avr. 2026',
    'Départ dim. 19 avr. 2026',
    'Total (3 nuits) 428,00 €',
  ].join('\n'), OPTIONS);

  assert.equal(draft.startDate, '2026-04-16');
  assert.equal(draft.endDate, '2026-04-19');
  assert.ok(!draft.warnings.includes('startDate'));
});
