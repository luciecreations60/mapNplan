import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMailLink, buildMailSearchQuery } from '../src/utils/mailLink.js';

test('the search combines provider and confirmation number', () => {
  const query = buildMailSearchQuery({
    provider: 'Booking.com',
    confirmationNumber: '4872913055',
    title: 'Hôtel du Vieux Port',
  });

  assert.equal(query, 'Booking.com 4872913055');
});

test('an independent provider still searches on its reference alone', () => {
  const query = buildMailSearchQuery({
    provider: '',
    confirmationNumber: 'CFB-2026-0417',
    title: 'CAMPING LES FLOTS BLEUS',
  });

  assert.equal(query, 'CFB-2026-0417');
});

test('without a reference the title keeps the link useful', () => {
  const query = buildMailSearchQuery({ provider: '', confirmationNumber: '', title: 'Location Nice' });
  assert.equal(query, 'Location Nice');
});

test('a reservation with nothing identifiable produces no link', () => {
  assert.equal(buildMailLink({ provider: '', confirmationNumber: '', title: '' }, 'gmail'), '');
});

test('a pasted direct link always wins over the generated search', () => {
  const link = buildMailLink({
    provider: 'Airbnb',
    confirmationNumber: 'HMQK3XZ8T2',
    emailUrl: 'https://mail.google.com/mail/u/0/#inbox/FMfcgz123',
  }, 'gmail');

  assert.equal(link, 'https://mail.google.com/mail/u/0/#inbox/FMfcgz123');
});

test('search terms are URL encoded for each supported mailbox', () => {
  const reservation = { provider: 'SNCF Connect', confirmationNumber: 'XKPLMN' };

  assert.equal(
    buildMailLink(reservation, 'gmail'),
    'https://mail.google.com/mail/u/0/#search/SNCF%20Connect%20XKPLMN',
  );
  assert.equal(
    buildMailLink(reservation, 'outlook'),
    'https://outlook.live.com/mail/0/?search=SNCF%20Connect%20XKPLMN',
  );
});

test('a mailbox without search support falls back to no generated link', () => {
  assert.equal(buildMailLink({ provider: 'Booking.com', confirmationNumber: '123456' }, 'other'), '');
});
