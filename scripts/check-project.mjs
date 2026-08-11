import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECT_CONFIG } from '../project.config.js';
import { TRANSLATIONS } from '../src/i18n/translations.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceExtensions = new Set(['.js', '.jsx', '.mjs']);
const ignoredDirectories = new Set(['node_modules', 'dist', '.git']);
const errors = [];
const warnings = [];

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function flattenKeys(value, prefix = '') {
  return Object.entries(value || {}).flatMap(([key, nested]) => {
    const current = prefix ? `${prefix}.${key}` : key;
    return nested && typeof nested === 'object' && !Array.isArray(nested)
      ? flattenKeys(nested, current)
      : [current];
  });
}

function relativeCandidates(filePath, specifier) {
  const candidate = path.resolve(path.dirname(filePath), specifier);
  return path.extname(candidate)
    ? [candidate]
    : [candidate, `${candidate}.js`, `${candidate}.jsx`, `${candidate}.mjs`, path.join(candidate, 'index.js'), path.join(candidate, 'index.jsx')];
}

const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
if (packageJson.version !== PROJECT_CONFIG.version) errors.push(`Version mismatch: ${packageJson.version} vs ${PROJECT_CONFIG.version}`);
if (PROJECT_CONFIG.release.publicIndexingEnabled !== false) errors.push('Public indexing must remain disabled during stabilization.');
if (PROJECT_CONFIG.release.brandFinalized !== true) errors.push('The approved mapnplan identity must be marked final.');
if (PROJECT_CONFIG.brandName !== 'mapnplan') errors.push('The public brand name must be mapnplan.');

const enKeys = flattenKeys(TRANSLATIONS.en).sort();
const frKeys = flattenKeys(TRANSLATIONS.fr).sort();
if (JSON.stringify(enKeys) !== JSON.stringify(frKeys)) {
  errors.push(`Translation dictionaries differ (${enKeys.length} EN / ${frKeys.length} FR).`);
}

const files = await walk(root);
for (const filePath of files) {
  const extension = path.extname(filePath);
  if (extension === '.json') {
    try { JSON.parse(await fs.readFile(filePath, 'utf8')); }
    catch (error) { errors.push(`Invalid JSON: ${path.relative(root, filePath)} (${error.message})`); }
  }
  if (!sourceExtensions.has(extension) && extension !== '.html') continue;
  const source = await fs.readFile(filePath, 'utf8');
  if (/^(<{7}|={7}|>{7})/m.test(source)) errors.push(`Merge conflict marker: ${path.relative(root, filePath)}`);
  if (filePath.includes(`${path.sep}src${path.sep}`) && /console\.log\s*\(/.test(source)) warnings.push(`console.log in source: ${path.relative(root, filePath)}`);
  if (!sourceExtensions.has(extension)) continue;
  const importPattern = /(?:from\s+|import\s*\()(['"])(\.\.?\/[^'"]+)\1/g;
  for (const match of source.matchAll(importPattern)) {
    let found = false;
    for (const candidate of relativeCandidates(filePath, match[2])) {
      try { if ((await fs.stat(candidate)).isFile()) { found = true; break; } } catch { /* continue */ }
    }
    if (!found) errors.push(`Missing import ${match[2]} in ${path.relative(root, filePath)}`);
  }
}

const rootHtml = await fs.readFile(path.join(root, 'index.html'), 'utf8');
if (!rootHtml.includes('noindex')) errors.push('index.html must contain noindex during stabilization.');
for (const generatedFile of ['public/guides/index.html', 'public/guides/three-days-in-paris/index.html']) {
  try {
    const html = await fs.readFile(path.join(root, generatedFile), 'utf8');
    if (!html.includes('noindex')) errors.push(`${generatedFile} must contain noindex.`);
  } catch { warnings.push(`${generatedFile} is not generated yet.`); }
}

for (const warning of warnings) console.warn(`WARN  ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
console.log(`Checked ${files.length} files and ${enKeys.length} translation keys per locale.`);
if (errors.length) process.exitCode = 1;
