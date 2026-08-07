import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const globalCss = fs.readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
const pagesCss = fs.readFileSync(new URL('../src/styles/pages.css', import.meta.url), 'utf8');
const layoutCss = fs.readFileSync(new URL('../src/styles/layout.css', import.meta.url), 'utf8');

test('motion and forced-colour preferences are respected', () => {
  assert.match(globalCss, /prefers-reduced-motion/);
  assert.match(globalCss, /forced-colors: active/);
});

test('touch targets receive a coarse-pointer minimum size', () => {
  assert.match(globalCss, /pointer: coarse/);
  assert.match(globalCss, /min-height: 44px/);
});

test('workspace tabs and itinerary actions stay within their containers', () => {
  assert.match(pagesCss, /\.trip-tabs[\s\S]*width: 100%/);
  assert.match(pagesCss, /grid-template-columns: repeat\(4, minmax\(40px, 1fr\)\)/);
  assert.match(pagesCss, /grid-template-columns: repeat\(2, minmax\(44px, 1fr\)\)/);
});

test('mobile drawer is removed from pointer interaction when hidden', () => {
  assert.match(layoutCss, /\.sidebar\[aria-hidden="true"\]/);
  assert.match(layoutCss, /pointer-events: none/);
});
