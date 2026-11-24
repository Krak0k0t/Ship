import test from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGE_OPTIONS } from './translations';
import { EXTRA_TRANSLATIONS } from './extraTranslations';

test('EXTRA_TRANSLATIONS populates every key cleanly across all 16 languages', () => {
  const refKeys = Object.keys(EXTRA_TRANSLATIONS.en) as Array<keyof typeof EXTRA_TRANSLATIONS.en>;
  assert.ok(refKeys.length > 80);

  for (const opt of LANGUAGE_OPTIONS) {
    const dict = EXTRA_TRANSLATIONS[opt.code];
    assert.ok(dict, `Missing extra dictionary for ${opt.code}`);
    for (const k of refKeys) {
      assert.equal(typeof dict[k], 'string', `Missing key ${k} in ${opt.code}`);
      assert.ok(dict[k].trim().length > 0, `Empty key ${k} in ${opt.code}`);
    }
  }
});
