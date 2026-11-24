import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACT_IDS,
  ACT_SPECS,
  MAX_ACTIVE_OFFICERS,
  MAX_UPGRADE_LEVEL,
  WEATHER_CYCLE,
  WEATHER_SPECS,
  applyActCompletion,
  applyEndlessResult,
  computePlayerStats,
  createDefaultProfile,
  getTotalUpgradeLevel,
  getUpgradeCost,
  hireOrToggleOfficer,
  loadCaptainProfile,
  pickWaveArchetypes,
  purchaseUpgrade,
  recordSecretCompletion,
  resetCaptainProfile,
  saveCaptainProfile,
  type MinimalStorage,
} from './campaign';

function createMemoryStorage(): MinimalStorage {
  const data = new Map<string, string>();
  return {
    getItem(k) {
      return data.get(k) ?? null;
    },
    setItem(k, v) {
      data.set(k, v);
    },
    removeItem(k) {
      data.delete(k);
    },
  };
}

test('all 3 campaign acts define escalating threat, unique biomes, and valid rewards', () => {
  assert.deepEqual(ACT_IDS, [1, 2, 3]);
  assert.ok(ACT_SPECS[1].waveHeight < ACT_SPECS[2].waveHeight);
  assert.ok(ACT_SPECS[2].waveHeight < ACT_SPECS[3].waveHeight);
  assert.ok(ACT_SPECS[1].bossHp < ACT_SPECS[2].bossHp);
  assert.ok(ACT_SPECS[2].bossHp < ACT_SPECS[3].bossHp);
  assert.ok(ACT_SPECS[1].rewardDoubloons < ACT_SPECS[3].rewardDoubloons);
  assert.notEqual(ACT_SPECS[1].palette.seaTint, ACT_SPECS[2].palette.seaTint);
  assert.notEqual(ACT_SPECS[2].palette.seaTint, ACT_SPECS[3].palette.seaTint);
});

test('computePlayerStats scales upgrades and active officers accurately', () => {
  const base = computePlayerStats('normal', { hull: 0, cannons: 0, sails: 0, rigging: 0 }, []);
  const upgraded = computePlayerStats(
    'normal',
    { hull: 3, cannons: 3, sails: 3, rigging: 3 },
    ['gunner', 'bosun', 'navigator'],
  );

  assert.equal(base.maxHp, 100);
  assert.equal(upgraded.maxHp, 175);
  assert.ok(upgraded.damageMult > base.damageMult);
  assert.ok(upgraded.reloadTime < base.reloadTime);
  assert.ok(upgraded.speedMult > base.speedMult);
  assert.ok(upgraded.turnMult > base.turnMult);
  assert.ok(upgraded.surgeCooldown < base.surgeCooldown);
  assert.ok(upgraded.boardingHealRatio > base.boardingHealRatio);
  assert.equal(upgraded.extraProjectiles, 1);
  assert.ok(upgraded.lootMagnetRadius > 10);
  assert.ok(upgraded.crestThresholdOffset < 0);
  assert.ok(upgraded.headwindBoost > 0);
});

test('purchaseUpgrade deducts doubloons, increments up to MAX_UPGRADE_LEVEL, and rejects insufficient funds', () => {
  let profile = createDefaultProfile();
  const poorAttempt = purchaseUpgrade(profile, 'hull');
  assert.equal(poorAttempt.purchased, false);

  profile = { ...profile, doubloons: 1000 };
  for (let lv = 0; lv < MAX_UPGRADE_LEVEL; lv += 1) {
    const cost = getUpgradeCost('cannons', profile.upgrades.cannons);
    assert.ok(cost !== null && cost > 0);
    const res = purchaseUpgrade(profile, 'cannons');
    assert.equal(res.purchased, true);
    profile = res.profile;
  }

  assert.equal(profile.upgrades.cannons, MAX_UPGRADE_LEVEL);
  assert.equal(getUpgradeCost('cannons', profile.upgrades.cannons), null);
  const maxedAttempt = purchaseUpgrade(profile, 'cannons');
  assert.equal(maxedAttempt.purchased, false);
  assert.equal(getTotalUpgradeLevel(profile.upgrades), MAX_UPGRADE_LEVEL);
});

test('hireOrToggleOfficer enforces doubloon cost and 3-slot active cap', () => {
  let profile = createDefaultProfile();
  assert.equal(hireOrToggleOfficer(profile, 'gunner').action, 'denied');

  profile = { ...profile, doubloons: 700 };
  const h1 = hireOrToggleOfficer(profile, 'gunner');
  assert.equal(h1.action, 'hired');
  profile = h1.profile;

  const h2 = hireOrToggleOfficer(profile, 'bosun');
  assert.equal(h2.action, 'hired');
  profile = h2.profile;

  const h3 = hireOrToggleOfficer(profile, 'navigator');
  assert.equal(h3.action, 'hired');
  profile = h3.profile;

  const h4 = hireOrToggleOfficer(profile, 'surgeon');
  assert.equal(h4.action, 'hired');
  profile = h4.profile;

  // Hired 4, active stays capped at MAX_ACTIVE_OFFICERS (3)
  assert.equal(profile.hiredOfficers.length, 4);
  assert.equal(profile.activeOfficers.length, MAX_ACTIVE_OFFICERS);

  // Equipping the 4th officer swaps cleanly without exceeding cap
  const eq = hireOrToggleOfficer(profile, 'surgeon');
  assert.equal(eq.action, 'equipped');
  assert.equal(eq.profile.activeOfficers.length, MAX_ACTIVE_OFFICERS);
  assert.ok(eq.profile.activeOfficers.includes('surgeon'));
});

test('pickWaveArchetypes introduces fireships, mortars, and healers across acts and endless waves', () => {
  const act2Squad = pickWaveArchetypes(2, 1, 4, 'campaign');
  assert.ok(act2Squad.includes('fireship'));
  assert.ok(act2Squad.includes('mortar'));

  const endlessWave3 = pickWaveArchetypes(3, 3, 5, 'endless');
  assert.ok(endlessWave3.includes('fireship'));
  assert.ok(endlessWave3.includes('mortar'));
  assert.ok(endlessWave3.includes('healer'));

  assert.equal(WEATHER_CYCLE.length, 3);
  assert.ok(WEATHER_SPECS.squall.waveMult > WEATHER_SPECS.calm.waveMult);
});

test('applyActCompletion and applyEndlessResult unlock progress and award doubloons', () => {
  const initial = createDefaultProfile();
  const afterAct1 = applyActCompletion(initial, 1, 1650, 5, 1, 80);
  assert.equal(afterAct1.profile.unlockedAct, 2);
  assert.equal(afterAct1.profile.campaignCleared, false);
  // Corsair default crest adds +10% Doubloon passive
  assert.equal(afterAct1.doubloonsEarned, Math.round((ACT_SPECS[1].rewardDoubloons + 80) * 1.1));

  const afterEndless = applyEndlessResult(afterAct1.profile, 4, 3200, 12, 2, 90);
  assert.equal(afterEndless.profile.endlessBestWave, 4);
  assert.equal(afterEndless.profile.endlessBestScore, 3200);
  assert.ok(afterEndless.doubloonsEarned > 90);
});

test('captain profile persists officers & endless stats and recovers from corrupt JSON', () => {
  const mem = createMemoryStorage();
  const base = createDefaultProfile();
  const modified = {
    ...base,
    unlockedAct: 2 as const,
    doubloons: 420,
    upgrades: { hull: 2, cannons: 1, sails: 3, rigging: 0 },
    hiredOfficers: ['gunner' as const, 'bosun' as const],
    activeOfficers: ['gunner' as const, 'bosun' as const],
    ownedCrests: ['corsair' as const, 'crimson' as const],
    bestScore: 2100,
    endlessBestWave: 6,
    endlessBestScore: 4100,
    totalSunk: 9,
    totalBoarded: 3,
    campaignCleared: false,
    completedSecrets: ['lighthouse' as const],
  };
  saveCaptainProfile(modified, mem);
  const loaded = loadCaptainProfile(mem);
  assert.deepEqual(loaded, modified);

  const firstSecret = recordSecretCompletion(base, 'maelstrom');
  assert.equal(firstSecret.newlyCompleted, true);
  assert.equal(firstSecret.doubloonsEarned, 100);
  assert.deepEqual(firstSecret.profile.completedSecrets, ['maelstrom']);
  const duplicateSecret = recordSecretCompletion(firstSecret.profile, 'maelstrom');
  assert.equal(duplicateSecret.newlyCompleted, false);
  assert.equal(duplicateSecret.doubloonsEarned, 0);

  mem.setItem('black_pennant_captain_profile_v1', '{broken-json');
  assert.deepEqual(loadCaptainProfile(mem), createDefaultProfile());

  const reset = resetCaptainProfile(mem);
  assert.deepEqual(reset, createDefaultProfile());
});
