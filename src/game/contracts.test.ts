import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BLACK_CONTRACT_IDS,
  CAPTAIN_MEDAL_IDS,
  SHIP_CREST_IDS,
  applyContractRunMultiplier,
  computeContractModifiers,
  getBossPhase2Key,
  getUnlockedMedals,
} from './contracts';
import {
  applyActCompletion,
  createDefaultProfile,
  loadCaptainProfile,
  saveCaptainProfile,
  unlockOrEquipCrest,
  type MinimalStorage,
} from './campaign';

test('computeContractModifiers stacks combat tradeoffs and doubloon/score rewards', () => {
  const base = computeContractModifiers([]);
  assert.equal(base.damageMult, 1);
  assert.equal(base.doubloonMult, 1);
  assert.equal(base.forceSquall, false);

  const classicThree = computeContractModifiers(['powderPact', 'stormPact', 'bloodPact']);
  assert.equal(classicThree.damageMult, 1.4);
  assert.equal(classicThree.reloadMult, 0.85);
  assert.equal(classicThree.maxHpMult, 0.75);
  assert.equal(classicThree.enemyReloadMult, 0.8);
  assert.equal(classicThree.enemyDmgMult, 1.25);
  assert.equal(classicThree.boardingHealBonus, 0.25);
  assert.equal(classicThree.ramMult, 1.35);
  assert.equal(classicThree.rageGainMult, 1.35);
  assert.equal(classicThree.forceSquall, true);
  assert.equal(classicThree.doubloonBonusPct, 120);
  assert.equal(classicThree.scoreBonusPct, 80);

  const cursed = computeContractModifiers(['cursedHold']);
  assert.equal(cursed.goldDrainPerSec, 0.45);
  assert.equal(cursed.damageMult, 1.45);

  const calm = computeContractModifiers(['deadCalm']);
  assert.equal(calm.speedMult, 0.55);
  assert.equal(calm.damageMult, 2.0);

  const combined = computeContractModifiers(BLACK_CONTRACT_IDS);
  assert.equal(combined.doubloonBonusPct, 225);
  assert.equal(combined.scoreBonusPct, 160);
  assert.equal(combined.speedMult, 0.55);
  assert.equal(combined.goldDrainPerSec, 0.45);
  assert.ok(combined.damageMult > 4);

  const scaled = applyContractRunMultiplier(100, 1000, ['powderPact', 'stormPact']);
  assert.equal(scaled.doubloons, 180);
  assert.equal(scaled.score, 1550);
});

test('unlockOrEquipCrest allows purchasing with doubloons and equipping unlocked crests', () => {
  let profile = createDefaultProfile();
  const denied = unlockOrEquipCrest(profile, 'crimson');
  assert.equal(denied.changed, false);

  profile = { ...profile, doubloons: 200 };
  const bought = unlockOrEquipCrest(profile, 'crimson');
  assert.equal(bought.changed, true);
  assert.equal(bought.action, 'unlocked');
  assert.equal(bought.profile.doubloons, 80);
  assert.equal(bought.profile.equippedCrest, 'crimson');
  assert.ok(bought.profile.ownedCrests.includes('crimson'));

  const swapBack = unlockOrEquipCrest(bought.profile, 'corsair');
  assert.equal(swapBack.changed, true);
  assert.equal(swapBack.action, 'equipped');
  assert.equal(swapBack.profile.equippedCrest, 'corsair');
  assert.equal(SHIP_CREST_IDS.length, 4);
});

test('applyActCompletion updates contractVictories, bossesDefeated, milestone crests, and score scaling', () => {
  const start = createDefaultProfile();
  const { profile, doubloonsEarned } = applyActCompletion(start, 1, 1000, 5, 1, 20, {
    activeContracts: ['powderPact'],
    bossesDefeatedInRun: 1,
    bestComboInRun: 3,
  });

  // (140 + 20) * 1.35 (powderPact) * 1.10 (corsair crest) = 238
  assert.equal(doubloonsEarned, 238);
  assert.equal(profile.contractVictories, 1);
  assert.equal(profile.bossesDefeated, 1);
  assert.equal(profile.bestComboStreak, 3);
  assert.ok(profile.ownedCrests.includes('crimson'));
});

test('getUnlockedMedals evaluates all 6 captain honors cleanly', () => {
  assert.equal(getUnlockedMedals(createDefaultProfile()).length, 0);

  const full = getUnlockedMedals({
    unlockedAct: 3,
    campaignCleared: true,
    bossesDefeated: 3,
    completedSecrets: ['lighthouse', 'maelstrom', 'shoals'],
    totalBoarded: 5,
    endlessBestWave: 6,
    contractVictories: 2,
  });
  assert.deepEqual(full, CAPTAIN_MEDAL_IDS);
  assert.equal(getBossPhase2Key(1), 'bossPhase2Act1');
  assert.equal(getBossPhase2Key(2), 'bossPhase2Act2');
  assert.equal(getBossPhase2Key(3), 'bossPhase2Act3');
});

test('all 9 secrets including reefChest, shadowStrait, stormEye persist through save/load', () => {
  const mem = new Map<string, string>();
  const storage: MinimalStorage = {
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => mem.set(k, v),
    removeItem: (k) => mem.delete(k),
  };

  const base = createDefaultProfile();
  saveCaptainProfile(
    {
      ...base,
      ownedCrests: ['corsair', 'ashen'],
      equippedCrest: 'ashen',
      completedSecrets: ['lighthouse', 'reefChest', 'shadowStrait', 'stormEye'],
      bossesDefeated: 2,
      contractVictories: 1,
      bestComboStreak: 4,
    },
    storage,
  );
  const loaded = loadCaptainProfile(storage);
  assert.deepEqual(loaded.completedSecrets, ['lighthouse', 'reefChest', 'shadowStrait', 'stormEye']);
  assert.equal(loaded.equippedCrest, 'ashen');
  assert.equal(loaded.bossesDefeated, 2);
  assert.equal(loaded.contractVictories, 1);
  assert.equal(loaded.bestComboStreak, 4);
});
