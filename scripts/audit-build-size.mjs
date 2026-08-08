import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const assetsDirectory = path.join(root, 'dist', 'assets');

const MAX_SINGLE_JS_BYTES = 750 * 1024;

// MapLibre GL génère volontairement un bundle plus lourd.
// On garde la limite générale à 750 Ko pour le reste,
// mais on autorise jusqu'à 1100 Ko pour le bundle map-vendor.
const MAX_MAP_VENDOR_JS_BYTES = 1100 * 1024;

const MAX_TOTAL_JS_BYTES = 2.5 * 1024 * 1024;
const MAX_SINGLE_CSS_BYTES = 350 * 1024;

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const target = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(target));
    } else {
      files.push(target);
    }
  }

  return files;
}

let files;

try {
  files = await walk(assetsDirectory);
} catch {
  console.error(
    'ERROR dist/assets is missing. Run the production build first.'
  );
  process.exit(1);
}

const reports = await Promise.all(
  files.map(async (file) => ({
    file: path.relative(path.join(root, 'dist'), file),
    bytes: (await fs.stat(file)).size,
    extension: path.extname(file),
  }))
);

const javascript = reports.filter(
  (item) => item.extension === '.js'
);

const css = reports.filter(
  (item) => item.extension === '.css'
);

const errors = [];

for (const item of javascript) {
  const isMapVendor =
    /(^|\/)map-vendor-[^/]+\.js$/.test(item.file);

  const budget = isMapVendor
    ? MAX_MAP_VENDOR_JS_BYTES
    : MAX_SINGLE_JS_BYTES;

  if (item.bytes > budget) {
    errors.push(
      `${item.file} exceeds the ${
        isMapVendor
          ? 'MapLibre vendor'
          : 'JavaScript chunk'
      } budget.`
    );
  }
}

for (const item of css) {
  if (item.bytes > MAX_SINGLE_CSS_BYTES) {
    errors.push(
      `${item.file} exceeds the CSS asset budget.`
    );
  }
}

const totalJavascript = javascript.reduce(
  (sum, item) => sum + item.bytes,
  0
);

if (totalJavascript > MAX_TOTAL_JS_BYTES) {
  errors.push(
    'The total JavaScript output exceeds the release budget.'
  );
}

console.log(`Build assets: ${reports.length}`);

console.log(
  `JavaScript chunks: ${javascript.length}, total ${(
    totalJavascript / 1024
  ).toFixed(1)} KB`
);

console.log(`CSS assets: ${css.length}`);

for (
  const item of reports
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 10)
) {
  console.log(
    ` - ${item.file}: ${(item.bytes / 1024).toFixed(1)} KB`
  );
}

for (const error of errors) {
  console.error(`ERROR ${error}`);
}

if (errors.length) {
  process.exitCode = 1;
}