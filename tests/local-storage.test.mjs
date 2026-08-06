import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStorage } from './helpers/MemoryStorage.mjs';

globalThis.localStorage = new MemoryStorage();
const { localStorageService } = await import('../src/services/storage/LocalStorageService.js');

test('corrupted JSON is quarantined before fallback data is used', () => {
  localStorage.setItem('mapnplan:trips', '{broken');
  assert.deepEqual(localStorageService.get('trips', []), []);
  const recovery = localStorageService.listRecoveryEntries();
  assert.equal(recovery.length, 1);
  assert.equal(recovery[0].originalKey, 'trips');
  assert.equal(recovery[0].rawValue, '{broken');
});

test('namespace usage and recovery pruning stay bounded', () => {
  localStorage.clear();
  localStorageService.set('one', { value: 1 });
  localStorage.setItem('mapnplan:recovery:1', JSON.stringify({ originalKey: 'a' }));
  localStorage.setItem('mapnplan:recovery:2', JSON.stringify({ originalKey: 'b' }));
  localStorage.setItem('mapnplan:recovery:3', JSON.stringify({ originalKey: 'c' }));
  const entries = localStorageService.listNamespaceEntries();
  assert.ok(entries.length >= 4);
  assert.ok(entries.every((entry) => entry.bytes > 0));
  assert.equal(localStorageService.pruneRecoveryEntries(2), 1);
  assert.equal(localStorageService.listRecoveryEntries().length, 2);
});
