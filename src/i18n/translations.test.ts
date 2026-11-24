import test from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGE_OPTIONS, TRANSLATIONS, getLanguageMeta } from './translations';

test('all 16 requested languages exist with complete non-empty keys', () => {
  assert.equal(LANGUAGE_OPTIONS.length, 16);
  const enKeys = Object.keys(TRANSLATIONS.en) as Array<keyof typeof TRANSLATIONS.en>;
  for (const opt of LANGUAGE_OPTIONS) {
    const dict = TRANSLATIONS[opt.code];
    assert.ok(dict, `Missing dictionary for ${opt.code}`);
    for (const k of enKeys) {
      assert.ok(
        typeof dict[k] === 'string' && dict[k].trim().length > 0,
        `Missing or empty translation key "${k}" in ${opt.code}`,
      );
    }
  }
});

test('RTL flag is correctly set for Arabic and Farsi only', () => {
  assert.equal(getLanguageMeta('ar').rtl, true);
  assert.equal(getLanguageMeta('fa').rtl, true);
  assert.equal(getLanguageMeta('en').rtl, false);
  assert.equal(getLanguageMeta('ru').rtl, false);
  assert.equal(getLanguageMeta('ork').rtl, false);
});
