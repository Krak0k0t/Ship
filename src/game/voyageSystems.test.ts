import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeRakingShotMultiplier,
  createInitialShipState,
  DEFAULT_SEA_PARAMS,
  stepShipState,
} from './sailingPhysics';
import {
  computeEndlessMutatorModifiers,
  computeRelicModifiers,
  pickEndlessMutators,
  pickRandomUnownedRelic,
  pickRouteChoices,
  resolveBoardingSpoils,
} from './voyageSystems';

test('computeRakingShotMultiplier rewards bow/stern crossing-the-T shots', () => {
  // Enemy facing North (heading = 0 -> forward = (0, -1)), projectile moving South/North along Z
  assert.equal(computeRakingShotMultiplier(0, -40, 0), 1.55);
  assert.equal(computeRakingShotMultiplier(0, 40, 0), 1.55);
  // Broadside hit perpendicular along X
  assert.equal(computeRakingShotMultiplier(40, 0, 0), 1.0);
});

test('anchor clubhaul boosts turning rate when sails dropped while carrying speed', () => {
  const anchored = { ...createInitialShipState(), sailLevel: 0 as const, speed: 6, heading: 0 };
  const halfSail = { ...createInitialShipState(), sailLevel: 0.5 as const, speed: 6, heading: 0 };
  const nextAnchored = stepShipState(anchored, { steer: 1, dt: 0.04 }, DEFAULT_SEA_PARAMS, 1);
  const nextHalf = stepShipState(halfSail, { steer: 1, dt: 0.04 }, DEFAULT_SEA_PARAMS, 1);
  assert.ok(Math.abs(nextAnchored.heading) > Math.abs(nextHalf.heading));
});

test('computeRelicModifiers aggregates multiple relics and picks unowned relics', () => {
  const mods = computeRelicModifiers(['stormCompass', 'alchemistPowder', 'vampiricTimber']);
  assert.equal(mods.barrelImmunity, true);
  assert.equal(mods.healPerKill, 12);
  assert.ok(mods.headwindSpeedBonus > 0.2);
  const next = pickRandomUnownedRelic(['stormCompass', 'alchemistPowder'], 0);
  assert.equal(next, 'vampiricTimber');
});

test('sea routes, endless mutators, and boarding spoils resolve deterministically', () => {
  const routes = pickRouteChoices(0.25);
  assert.equal(routes.length, 3);
  assert.equal(new Set(routes).size, 3);

  const muts = pickEndlessMutators(['galeForce'], 0);
  assert.equal(muts.length, 2);
  assert.ok(!muts.includes('galeForce'));

  const mMods = computeEndlessMutatorModifiers(['glassPowder', 'goldenTide']);
  assert.ok(mMods.damageMult > 1.35);
  assert.ok(mMods.doubloonMult > 1.8);

  const repairSpoil = resolveBoardingSpoils('repair', 40, 100, 20, 24);
  assert.equal(repairSpoil.nextHullHp, 74);
  const plunderSpoil = resolveBoardingSpoils('plunder', 40, 100, 20, 24);
  assert.equal(plunderSpoil.doubloonsGain, 48);
  const powderSpoil = resolveBoardingSpoils('powder', 40, 100, 20, 24);
  assert.equal(powderSpoil.resetCooldowns, true);
  assert.equal(powderSpoil.nextStormRage, 55);
});
