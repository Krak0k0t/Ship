import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MERCHANT_OFFER_IDS,
  MERCHANT_OFFER_SPECS,
  createDefaultRunMerchantBuffs,
  purchaseMerchantOffer,
  resolveWreckageChoice,
} from './encounters';
import {
  computePlayerStats,
  createDefaultProfile,
  hireOrToggleOfficer,
} from './campaign';
import { SHIP_CREST_SPECS } from './contracts';

test('encounters: merchant offers purchase repairs and temporary run buffs cleanly', () => {
  let buffs = createDefaultRunMerchantBuffs();
  let gold = 150;
  let hp = 45;
  const maxHp = 100;
  let morale = 50;
  let charmBought = false;

  assert.equal(MERCHANT_OFFER_IDS.length, 5);

  const hullBuy = purchaseMerchantOffer({
    offerId: 'hullPatch',
    spendableDoubloons: gold,
    buffs,
    hullHp: hp,
    hullMaxHp: maxHp,
    morale,
    fleetCharmBought: charmBought,
  });
  assert.equal(hullBuy.purchased, true);
  assert.equal(hullBuy.cost, MERCHANT_OFFER_SPECS.hullPatch.cost);
  assert.equal(hullBuy.nextHullHp, 90);
  gold -= hullBuy.cost;
  hp = hullBuy.nextHullHp;
  buffs = hullBuy.nextBuffs;

  const charmBuy = purchaseMerchantOffer({
    offerId: 'fleetCharm',
    spendableDoubloons: gold,
    buffs,
    hullHp: hp,
    hullMaxHp: maxHp,
    morale,
    fleetCharmBought: charmBought,
  });
  assert.equal(charmBuy.purchased, true);
  assert.ok(charmBuy.nextBuffs.speedMult > 1.0);
  assert.ok(charmBuy.nextBuffs.reloadMult < 1.0);
  gold -= charmBuy.cost;
  charmBought = charmBuy.fleetCharmBought;
  buffs = charmBuy.nextBuffs;

  // One-time Fleet Charm cannot be purchased twice even with gold
  const duplicateCharm = purchaseMerchantOffer({
    offerId: 'fleetCharm',
    spendableDoubloons: 999,
    buffs,
    hullHp: hp,
    hullMaxHp: maxHp,
    morale,
    fleetCharmBought: charmBought,
  });
  assert.equal(duplicateCharm.purchased, false);

  // Insufficient funds rejected cleanly
  const tooExpensive = purchaseMerchantOffer({
    offerId: 'powderTemper',
    spendableDoubloons: 10,
    buffs,
    hullHp: hp,
    hullMaxHp: maxHp,
    morale,
    fleetCharmBought: charmBought,
  });
  assert.equal(tooExpensive.purchased, false);
});

test('encounters: interactive wreckage safe vs risk choice scales plunder and ambush risk', () => {
  const safe = resolveWreckageChoice('safe', 2);
  assert.equal(safe.ambushSpawnCount, 0);
  assert.equal(safe.armExtraMines, 0);
  assert.ok(safe.doubloonsGain > 30);
  assert.ok(safe.moraleDelta > 0);

  const riskyAmbush = resolveWreckageChoice('risk', 2, 0.75);
  assert.ok(riskyAmbush.doubloonsGain > safe.doubloonsGain * 1.8);
  assert.equal(riskyAmbush.ambushSpawnCount, 1);
  assert.ok(riskyAmbush.armExtraMines >= 2);
});

test('campaign: Surgeon regenerates hull, 3 officers can equip, and crests grant passive combat bonuses', () => {
  let profile = { ...createDefaultProfile(), doubloons: 1000 };
  for (const id of ['gunner', 'bosun', 'surgeon'] as const) {
    const res = hireOrToggleOfficer(profile, id);
    assert.equal(res.changed, true);
    profile = res.profile;
  }
  assert.equal(profile.activeOfficers.length, 3);
  assert.ok(profile.activeOfficers.includes('surgeon'));

  const baseStats = computePlayerStats('normal', profile.upgrades, [], [], {
    crestId: 'corsair',
  });
  const officerCrimsonStats = computePlayerStats(
    'normal',
    profile.upgrades,
    profile.activeOfficers,
    [],
    { crestId: 'crimson' },
  );
  const abyssalStats = computePlayerStats(
    'normal',
    profile.upgrades,
    profile.activeOfficers,
    [],
    { crestId: 'abyssal' },
  );

  assert.equal(baseStats.hullRegenPerSec, 0);
  assert.ok(officerCrimsonStats.hullRegenPerSec > 1.0);
  assert.ok(officerCrimsonStats.reloadTime < baseStats.reloadTime);
  assert.ok(officerCrimsonStats.damageMult > baseStats.damageMult);
  assert.ok(abyssalStats.armorPierceBonus >= SHIP_CREST_SPECS.abyssal.armorPierceBonus);
  assert.ok(baseStats.doubloonGainMult > 1.0);
});
