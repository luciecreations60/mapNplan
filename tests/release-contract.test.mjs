import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECT_CONFIG } from '../project.config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), 'utf8');
}

test('release candidate identity and privacy switches are locked', () => {
  assert.equal(PROJECT_CONFIG.version, '0.1.23');
  assert.equal(PROJECT_CONFIG.release.stage, 'release-candidate');
  assert.equal(PROJECT_CONFIG.release.candidate, 'rc.2');
  assert.equal(PROJECT_CONFIG.release.publicIndexingEnabled, false);
  assert.equal(PROJECT_CONFIG.release.brandFinalized, false);
  assert.equal(PROJECT_CONFIG.release.productionDomain, '');
});

test('continuous delivery requires the complete release-candidate gate', async () => {
  const workflow = await read('.github/workflows/deploy.yml');
  const packageJson = JSON.parse(await read('package.json'));
  assert.match(workflow, /Project quality checks/);
  assert.match(workflow, /Automated tests/);
  assert.match(workflow, /Production build/);
  assert.match(workflow, /Build size audit/);
  assert.match(workflow, /Release candidate audit/);
  assert.match(workflow, /npm run release:audit:ci/);
  assert.equal(packageJson.scripts['release:audit:ci'], 'node scripts/audit-release-candidate.mjs --require-build');
});

test('release documentation covers acceptance, limitations and rollback', async () => {
  const requiredFiles = [
    'RELEASE_CANDIDATE_TEST_PLAN.md',
    'RELEASE_CHECKLIST.md',
    'KNOWN_LIMITATIONS.md',
    'V1_READINESS_REPORT.md',
    'ROLLBACK.md',
  ];
  for (const file of requiredFiles) {
    const content = await read(file);
    assert.ok(content.trim().length > 200, `${file} is incomplete`);
  }
});
