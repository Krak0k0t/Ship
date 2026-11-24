import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_KEY_BINDINGS,
  GRAPHICS_PRESETS,
  createDefaultSettings,
  formatBindingLabel,
  loadGameSettings,
  matchActionCode,
  rebindAction,
  saveGameSettings,
} from './settings';
import {
  BESTIARY_IDS,
  CAPTAIN_PERK_IDS,
  FIGUREHEAD_IDS,
  SHIP_CLASS_IDS,
  SHIP_CLASS_SPECS,
} from './shipClasses';
import {
  MINE_COOLDOWN_SEC,
  computeAmmoEffect,
  computeBroadsideShot,
} from './sailingPhysics';
import {
  applyActCompletion,
  applyDefeatProgress,
  computePlayerStats,
  createDefaultProfile,
  getCrewMoraleReloadMult,
  getShipyardStatsBreakdown,
  getUpgradeCost,
  loadCaptainProfile,
  pickWaveArchetypes,
  purchaseUpgrade,
  saveCaptainProfile,
  unlockCaptainPerk,
  unlockOrEquipFigurehead,
  unlockOrEquipShipClass,
  type MinimalStorage,
} from './campaign';

function createMem(): MinimalStorage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
}

test('settings: key rebinding swaps conflicting actions, formats mouse/key labels, and persists', () => {
  const def = createDefaultSettings();
  assert.equal(def.graphicsQuality, 'high');
  assert.equal(matchActionCode(def.bindings, 'KeyF'), 'dropMine');
  assert.equal(formatBindingLabel('Mouse2'), 'RMB');
  assert.equal(formatBindingLabel('KeyF'), 'F');

  // Rebind dropMine to Space (which was fireBoth) -> fireBoth receives KeyF cleanly
  const rebound = rebindAction(def.bindings, 'dropMine', 'Space');
  assert.equal(rebound.dropMine, 'Space');
  assert.equal(rebound.fireBoth, 'KeyF');
  assert.equal(DEFAULT_KEY_BINDINGS.fireBoth, 'Space');

  const mem = createMem();
  saveGameSettings({ ...def, graphicsQuality: 'ultra', masterVolume: 0.45, bindings: rebound }, mem);
  const loaded = loadGameSettings(mem);
  assert.equal(loaded.graphicsQuality, 'ultra');
  assert.equal(loaded.masterVolume, 0.45);
  assert.equal(loaded.bindings.dropMine, 'Space');
  assert.equal(loaded.bindings.fireBoth, 'KeyF');

  assert.ok(GRAPHICS_PRESETS.ultra.motesCount > GRAPHICS_PRESETS.low.motesCount);
  assert.equal(GRAPHICS_PRESETS.low.godRays, false);
});

test('sailingPhysics: incendiary ammo deals burn DoT and mine cooldown is defined', () => {
  const fireEffect = computeAmmoEffect('incendiary');
  assert.ok(fireEffect.burnDuration > 0);
  const shot = computeBroadsideShot('incendiary', 0.8, 0.56);
  assert.equal(shot.crestBoosted, true);
  assert.ok(shot.damagePerHit > 0);
  assert.ok(MINE_COOLDOWN_SEC >= 4);
});

test('campaign: ship classes unlock higher upgrade tiers, figureheads & perks scale stats, and replaying Act 1 keeps Act 3 unlocked', () => {
  let profile = { ...createDefaultProfile(), doubloons: 3000 };
  assert.equal(SHIP_CLASS_IDS.length, 3);
  assert.equal(FIGUREHEAD_IDS.length, 4);
  assert.equal(CAPTAIN_PERK_IDS.length, 5);
  assert.equal(BESTIARY_IDS.length, 8);

  const frag = unlockOrEquipShipClass(profile, 'frigate');
  assert.equal(frag.changed, true);
  assert.equal(frag.action, 'unlocked');
  profile = frag.profile;

  // Frigate allows tier 4 upgrades
  for (let i = 0; i < SHIP_CLASS_SPECS.frigate.upgradeCap; i += 1) {
    const res = purchaseUpgrade(profile, 'hull');
    assert.equal(res.purchased, true);
    profile = res.profile;
  }
  assert.equal(profile.upgrades.hull, 4);
  assert.equal(getUpgradeCost('hull', 4, 4), null);

  const fig = unlockOrEquipFigurehead(profile, 'phoenix');
  assert.equal(fig.changed, true);
  profile = fig.profile;

  const perk = unlockCaptainPerk(profile, 'greekFiremaster');
  assert.equal(perk.changed, true);
  profile = perk.profile;

  const stats = computePlayerStats('normal', profile.upgrades, profile.activeOfficers, [], {
    shipClass: profile.shipClass,
    figurehead: profile.equippedFigurehead,
    perks: profile.unlockedPerks,
    morale: 90,
  });
  assert.ok(stats.maxHp > 200);
  assert.ok(stats.burnDamageMult > 1);
  assert.ok(stats.burnDurationBonus > 0);
  assert.ok(getCrewMoraleReloadMult(90) < getCrewMoraleReloadMult(20));

  const breakdown = getShipyardStatsBreakdown(profile, 'normal', []);
  assert.equal(breakdown.upgradeCap, 4);
  assert.equal(breakdown.next.hull, null);
  assert.ok(breakdown.next.cannons !== null && breakdown.next.cannons.damageMult > breakdown.current.damageMult);

  // Unlock Act 3, then replay Act 1 -> unlockedAct remains 3
  profile = { ...profile, unlockedAct: 3 };
  const replayAct1 = applyActCompletion(profile, 1, 1500, 4, 1, 50, {
    milesSailed: 12.4,
    bestiaryKillsInRun: { wraith: 1, kraken: 1 },
  });
  assert.equal(replayAct1.profile.unlockedAct, 3);
  assert.equal(replayAct1.profile.bestiaryKills.kraken, 1);
  assert.ok(replayAct1.profile.totalMiles >= 12.4);

  const afterDefeat = applyDefeatProgress(replayAct1.profile, 3, 0, 5.2, 4, { brig: 2 });
  assert.equal(afterDefeat.bestiaryKills.brig, 2);
  assert.ok(afterDefeat.totalMiles >= 17.5);

  const mem = createMem();
  saveCaptainProfile(afterDefeat, mem);
  const reloaded = loadCaptainProfile(mem);
  assert.deepEqual(reloaded, afterDefeat);
});

test('pickWaveArchetypes spawns spectral wraiths in Act 3 and Endless', () => {
  const act3 = pickWaveArchetypes(3, 1, 5, 'campaign');
  assert.ok(act3.includes('wraith'));
  const endless4 = pickWaveArchetypes(1, 4, 5, 'endless');
  assert.ok(endless4.includes('wraith'));
});
