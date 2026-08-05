import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECT_CONFIG } from '../project.config.js';
import { DEMO_TRIPS } from '../src/data/demoTrips.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireBuild = process.argv.includes('--require-build');
const errors = [];
const warnings = [];
const checks = [];

async function exists(relativePath) {
  try {
    await fs.access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), 'utf8');
}

function check(name, condition, failureMessage, severity = 'error') {
  checks.push({ name, passed: Boolean(condition) });
  if (condition) return;
  if (severity === 'warning') warnings.push(failureMessage);
  else errors.push(failureMessage);
}

const packageJson = JSON.parse(await read('package.json'));
check('Version synchronization', packageJson.version === PROJECT_CONFIG.version, 'package.json and project.config.js versions differ.');
check('Release-candidate stage', PROJECT_CONFIG.release.stage === 'release-candidate', 'Release stage is not release-candidate.');
check('Candidate identifier', /^rc\.\d+$/.test(PROJECT_CONFIG.release.candidate || ''), 'Release candidate identifier is invalid.');
check('SEO lock', PROJECT_CONFIG.release.publicIndexingEnabled === false, 'Public indexing must remain disabled.');
check('Brand identity selected', PROJECT_CONFIG.release.brandFinalized === true, 'The approved mapNplan identity must be marked final.');
check('Brand name', PROJECT_CONFIG.brandName === 'mapNplan', 'The public brand name is not mapNplan.');
check('No production domain', PROJECT_CONFIG.release.productionDomain === '', 'A production domain must not be set yet.');

const rootHtml = await read('index.html');
check('Root noindex', rootHtml.includes('noindex'), 'index.html does not contain noindex.');
const robots = await read('public/robots.txt');
check('Robots keeps page-level noindex visible', /page-level noindex metadata/i.test(robots), 'robots.txt does not document the page-level noindex lock.');
check('No provisional sitemap submission', !/^Sitemap:/im.test(robots), 'robots.txt must not advertise a sitemap before launch.');

const requiredDocs = [
  'RELEASE_CANDIDATE_TEST_PLAN.md',
  'RELEASE_CHECKLIST.md',
  'KNOWN_LIMITATIONS.md',
  'V1_READINESS_REPORT.md',
  'ROLLBACK.md',
];
for (const file of requiredDocs) {
  check(`Documentation: ${file}`, await exists(file), `Missing release document: ${file}`);
}

check('Demo data available', DEMO_TRIPS.length > 0, 'No demonstration trip is available for acceptance testing.');
for (const trip of DEMO_TRIPS) {
  check(`Demo trip dates: ${trip.id}`, Boolean(trip.id && trip.startDate && trip.endDate && trip.startDate <= trip.endDate), `Invalid dates in demo trip ${trip.id}.`);
  for (const day of trip.itinerary || []) {
    check(`Demo itinerary date: ${day.id}`, day.date >= trip.startDate && day.date <= trip.endDate, `Itinerary day ${day.id} is outside trip ${trip.id}.`);
  }
}

const testFiles = (await fs.readdir(path.join(root, 'tests'))).filter((name) => name.endsWith('.test.mjs'));
check('Automated test suite', testFiles.length >= 12, 'The release candidate does not contain the expected automated test suite.');
for (const testFile of testFiles) {
  const source = await read(path.join('tests', testFile));
  check(`No disabled tests: ${testFile}`, !/\b(?:test|describe)\.(?:skip|only)\b/.test(source), `Disabled or exclusive test found in ${testFile}.`);
}

const distExists = await exists('dist/index.html');
if (requireBuild) check('Production build exists', distExists, 'dist/index.html is missing after the production build.');
else if (!distExists) warnings.push('Production build not present: source-only release audit completed.');

if (distExists) {
  const distHtml = await read('dist/index.html');
  check('Built noindex', distHtml.includes('noindex'), 'The production build does not contain noindex.');
  check('Built application entry', /<script[^>]+src=/.test(distHtml), 'The production build does not reference an application script.');
  check('Built service worker', await exists('dist/service-worker.js'), 'The production build does not include the service worker.');
}

const report = {
  format: 'mapnplan-release-readiness',
  formatVersion: 1,
  version: PROJECT_CONFIG.version,
  candidate: PROJECT_CONFIG.release.candidate,
  stage: PROJECT_CONFIG.release.stage,
  generatedAt: new Date().toISOString(),
  buildChecked: distExists,
  passed: errors.length === 0,
  summary: {
    checks: checks.length,
    passed: checks.filter((item) => item.passed).length,
    errors: errors.length,
    warnings: warnings.length,
    automatedTestFiles: testFiles.length,
  },
  checks,
  errors,
  warnings,
};

const serializedReport = `${JSON.stringify(report, null, 2)}\n`;
await fs.writeFile(path.join(root, 'public', 'release-status.json'), serializedReport, 'utf8');
if (distExists) await fs.writeFile(path.join(root, 'dist', 'release-status.json'), serializedReport, 'utf8');

for (const warning of warnings) console.warn(`WARN  ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
console.log(`Release candidate audit: ${report.summary.passed}/${report.summary.checks} checks passed.`);
if (errors.length) process.exitCode = 1;
