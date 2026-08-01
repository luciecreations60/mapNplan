import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStorage } from './helpers/MemoryStorage.mjs';

globalThis.localStorage = new MemoryStorage();
const { localStorageService } = await import('../src/services/storage/LocalStorageService.js');

test('corrupted JSON is quarantined before fallback data is used', () => {
  localStorage.setItem('tripflow:trips', '{broken');
  assert.deepEqual(localStorageService.get('trips', []), []);
  const recovery = localStorageService.listRecoveryEntries();
  assert.equal(recovery.length, 1);
  assert.equal(recovery[0].originalKey, 'trips');
  assert.equal(recovery[0].rawValue, '{broken');
});
