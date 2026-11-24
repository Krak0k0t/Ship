import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultProfile } from './campaign';
import {
  TOTAL_LORE_ENTRIES,
  countUnlockedLoreEntries,
  getBossUltimatumKey,
  isSeaLoreUnlocked,
  pickOfficerBark,
} from './lore';

test('chronicle tracks unlocked seas, crew dossiers, and secret relic inscriptions accurately', () => {
  const base = createDefaultProfile();
  assert.equal(TOTAL_LORE_ENTRIES, 16);
  assert.equal(isSeaLoreUnlocked(base, 1), true);
  assert.equal(isSeaLoreUnlocked(base, 2), false);
  assert.equal(countUnlockedLoreEntries(base), 1);

  const progressed = {
    ...base,
    unlockedAct: 3 as const,
    hiredOfficers: ['gunner' as const, 'navigator' as const],
    completedSecrets: ['lighthouse' as const, 'stormEye' as const],
  };
  assert.equal(isSeaLoreUnlocked(progressed, 2), true);
  assert.equal(isSeaLoreUnlocked(progressed, 3), true);
  assert.equal(countUnlockedLoreEntries(progressed), 3 + 2 + 2);
});

test('getBossUltimatumKey maps all 3 campaign acts to unique ultimatum keys', () => {
  assert.equal(getBossUltimatumKey(1), 'bossUltimatum1');
  assert.equal(getBossUltimatumKey(2), 'bossUltimatum2');
  assert.equal(getBossUltimatumKey(3), 'bossUltimatum3');
});

test('pickOfficerBark matches active officer specialties and respects cooldown', () => {
  assert.equal(pickOfficerBark([], 'combo', 20, 0), null);
  assert.equal(pickOfficerBark(['bosun'], 'combo', 20, 0), null);

  const gunnerBark = pickOfficerBark(['gunner', 'bosun'], 'combo', 20, 0);
  assert.deepEqual(gunnerBark, { officer: 'gunner', textKey: 'barkGunnerCombo' });

  const tooSoon = pickOfficerBark(['gunner', 'bosun'], 'lowHull', 24, 20);
  assert.equal(tooSoon, null);

  const bosunBark = pickOfficerBark(['bosun'], 'lowHull', 32, 20);
  assert.deepEqual(bosunBark, { officer: 'bosun', textKey: 'barkBosunHull' });

  const navBark = pickOfficerBark(['navigator'], 'squall', 45, 32);
  assert.deepEqual(navBark, { officer: 'navigator', textKey: 'barkNavSquall' });
});
