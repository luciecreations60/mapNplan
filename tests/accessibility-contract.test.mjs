import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function source(path) {
  return fs.readFileSync(new URL(path, import.meta.url), 'utf8');
}

test('application shell provides a keyboard skip link and focusable main landmark', () => {
  const layout = source('../src/layouts/AppLayout.jsx');
  assert.match(layout, /className="skip-link"/);
  assert.match(layout, /id="main-content"/);
  assert.match(layout, /tabIndex="-1"/);
});

test('modal traps focus and exposes unique labelled dialog semantics', () => {
  const modal = source('../src/components/common/Modal.jsx');
  assert.match(modal, /useFocusTrap/);
  assert.match(modal, /useId/);
  assert.match(modal, /aria-modal="true"/);
  assert.match(modal, /role="dialog"/);
});

test('trip workspace implements the tab keyboard pattern', () => {
  const tabs = source('../src/components/tripWorkspace/TripTabs.jsx');
  const workspace = source('../src/pages/TripWorkspacePage.jsx');
  assert.match(tabs, /role="tablist"/);
  assert.match(tabs, /role="tab"/);
  assert.match(tabs, /aria-selected/);
  assert.match(tabs, /ArrowRight/);
  assert.match(tabs, /ArrowLeft/);
  assert.match(workspace, /role="tabpanel"/);
});

test('global search exposes an accessible combobox and result list', () => {
  const search = source('../src/components/navigation/GlobalSearch.jsx');
  assert.match(search, /role="combobox"/);
  assert.match(search, /aria-activedescendant/);
  assert.match(search, /role="listbox"/);
  assert.match(search, /aria-live="polite"/);
});
