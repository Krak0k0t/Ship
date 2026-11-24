import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SEA_PARAMS,
  DIFFICULTY_SPECS,
  computeBroadsideAlignment,
  computeBroadsideShot,
  computeWaveCrestScore,
  computeWindEfficiency,
  createInitialShipState,
  stepSailLevel,
  stepShipState,
  triggerWaveSurge,
  resolveShipPairCollision,
  resolveStaticObstacleCollision,
  computeAmmoEffect,
  canBoardEnemy,
  computeWhirlpoolPull,
  computeExplosionFalloff,
  sampleWaveHeight,
  computePlungingRamBonus,
  computeRockfallSplash,
} from './sailingPhysics';

test('stepSailLevel steps cleanly between 0, 0.5, and 1', () => {
  assert.equal(stepSailLevel(0, 1), 0.5);
  assert.equal(stepSailLevel(0.5, 1), 1);
  assert.equal(stepSailLevel(1, 1), 1);
  assert.equal(stepSailLevel(0.5, -1), 0);
  assert.equal(stepSailLevel(0, -1), 0);
});

test('computeWindEfficiency penalizes head-to-wind and rewards beam/broad reach', () => {
  const irons = computeWindEfficiency(0.65, 0.65);
  const beam = computeWindEfficiency(0.65 + Math.PI / 2, 0.65);
  assert.equal(irons.pointOfSail, 'irons');
  assert.equal(beam.pointOfSail, 'beam');
  assert.ok(beam.efficiency > irons.efficiency * 4);
});

test('computeBroadsideShot triggers +35% crest bonus above threshold and specializes ammo', () => {
  const normal = computeBroadsideShot('round', 0.3, 0.56);
  const boosted = computeBroadsideShot('round', 0.72, 0.56);
  const grape = computeBroadsideShot('grape', 0.72, 0.56);
  assert.equal(normal.crestBoosted, false);
  assert.equal(boosted.crestBoosted, true);
  assert.ok(boosted.damagePerHit > normal.damagePerHit);
  assert.ok(grape.projectiles > boosted.projectiles);
});

test('computeWaveCrestScore bounds output between 0 and 1', () => {
  for (let t = 0; t < 20; t += 0.5) {
    const score = computeWaveCrestScore(t * 2, -t, t, 1.4);
    assert.ok(score >= 0 && score <= 1);
  }
});

test('stepShipState moves ship forward when sails are up and slows when anchored', () => {
  let ship = createInitialShipState();
  const startZ = ship.z;
  for (let i = 0; i < 30; i += 1) {
    ship = stepShipState(ship, { steer: 0, dt: 0.033 }, DEFAULT_SEA_PARAMS, i * 0.033);
  }
  assert.ok(ship.z < startZ);

  ship = { ...ship, sailLevel: 0 };
  const speedBefore = ship.speed;
  for (let i = 0; i < 40; i += 1) {
    ship = stepShipState(ship, { steer: 0, dt: 0.033 }, DEFAULT_SEA_PARAMS, i * 0.033);
  }
  assert.ok(ship.speed < speedBefore);
});

test('triggerWaveSurge launches wave leap with stretch and elastic landing squash', () => {
  const initial = createInitialShipState();
  const { ship: jumped, triggered } = triggerWaveSurge(initial);
  assert.equal(triggered, true);
  assert.ok(jumped.surgeVelY > 5);
  assert.ok(jumped.squashY > 1.1);

  const blocked = triggerWaveSurge(jumped);
  assert.equal(blocked.triggered, false);

  let s = jumped;
  for (let i = 0; i < 60; i += 1) {
    s = stepShipState(s, { steer: 0, dt: 0.033 }, DEFAULT_SEA_PARAMS, i * 0.033);
  }
  assert.equal(s.surgeY, 0);
});

test('difficulty levels scale enemy toughness and player survivability monotonically', () => {
  assert.ok(DIFFICULTY_SPECS.easy.playerHpMax > DIFFICULTY_SPECS.normal.playerHpMax);
  assert.ok(DIFFICULTY_SPECS.normal.playerHpMax > DIFFICULTY_SPECS.hard.playerHpMax);
  assert.ok(DIFFICULTY_SPECS.hard.playerHpMax > DIFFICULTY_SPECS.nightmare.playerHpMax);
  assert.ok(DIFFICULTY_SPECS.easy.enemyHpMultiplier < DIFFICULTY_SPECS.nightmare.enemyHpMultiplier);
});

test('resolveShipPairCollision separates overlapping ships and grants bow ramming advantage', () => {
  // Ship A sailing north (heading=0 -> -Z) straight into broadside of Ship B at z=-2
  const res = resolveShipPairCollision(
    { x: 0, z: 0, heading: 0, speed: 12 },
    { x: 0, z: -3.2, heading: Math.PI / 2, speed: 5 },
  );
  assert.ok(res !== null);
  assert.equal(res.aRamming, true);
  assert.ok(res.damageToB > res.damageToA);
  // Ships must be pushed farther apart along separation axis
  const sepAfter = Math.hypot(res.bx - res.ax, res.bz - res.az);
  assert.ok(sepAfter > 3.2);

  // Ships far apart do not collide
  const far = resolveShipPairCollision(
    { x: 0, z: 0, heading: 0, speed: 10 },
    { x: 25, z: 0, heading: 0, speed: 10 },
  );
  assert.equal(far, null);
});

test('resolveStaticObstacleCollision pushes ship outside headland reef radius', () => {
  const hit = resolveStaticObstacleCollision(
    { x: 10, z: 0, heading: -Math.PI / 2, speed: 9 },
    0,
    0,
    11.8,
  );
  assert.ok(hit !== null);
  assert.ok(Math.hypot(hit.x, hit.z) > 10);
  assert.ok(hit.damage >= 5);
});

test('ammo specialization, boarding eligibility, whirlpool pull, and explosion falloff work cleanly', () => {
  assert.ok(computeAmmoEffect('chain').sailSlowDuration > 0);
  assert.ok(computeAmmoEffect('grape').crewSlowDuration > 0);
  assert.equal(computeAmmoEffect('round').sailSlowDuration, 0);

  assert.equal(canBoardEnemy(0, 0, 10, 0, 40, 100, 0), true);
  assert.equal(canBoardEnemy(0, 0, 10, 0, 95, 100, 3.0), true);
  assert.equal(canBoardEnemy(0, 0, 10, 0, 95, 100, 0), false);
  assert.equal(canBoardEnemy(0, 0, 25, 0, 20, 100, 0), false);

  const pull = computeWhirlpoolPull(10, 0, 0, 0, 16, 4.6);
  assert.ok(pull !== null && pull.fx < 0 && !pull.inCore);
  const core = computeWhirlpoolPull(2, 0, 0, 0, 16, 4.6);
  assert.ok(core !== null && core.inCore);
  assert.equal(computeWhirlpoolPull(22, 0, 0, 0, 16, 4.6), null);

  assert.ok(computeExplosionFalloff(2, 17, 48) > computeExplosionFalloff(12, 17, 48));
  assert.equal(computeExplosionFalloff(18, 17, 48), 0);
});

test('stepShipState banks into turns when steering and bobs gently on waves', () => {
  let portTurn = { ...createInitialShipState(), speed: 10, roll: 0 };
  let stbdTurn = { ...createInitialShipState(), speed: 10, roll: 0 };
  for (let i = 0; i < 12; i += 1) {
    portTurn = stepShipState(portTurn, { steer: -1, dt: 0.033 }, DEFAULT_SEA_PARAMS, i * 0.033);
    stbdTurn = stepShipState(stbdTurn, { steer: 1, dt: 0.033 }, DEFAULT_SEA_PARAMS, i * 0.033);
  }
  assert.ok(portTurn.roll > stbdTurn.roll + 0.12);

  // Downwind / broad reach speed beats headwind speed significantly
  const downwind = computeWindEfficiency(Math.PI, 0);
  const headwind = computeWindEfficiency(0, 0);
  assert.ok(downwind.efficiency > headwind.efficiency * 5);
});

test('computeBroadsideAlignment accurately detects port, starboard, ahead, and out-of-range foes', () => {
  // Heading 0 = facing north (-Z), starboard = +X, port = -X
  const stbd = computeBroadsideAlignment(0, 0, 0, 24, -2, 48, 0.44);
  assert.equal(stbd.inStbdArc, true);
  assert.equal(stbd.inPortArc, false);

  const port = computeBroadsideAlignment(0, 0, 0, -24, 2, 48, 0.44);
  assert.equal(port.inPortArc, true);
  assert.equal(port.inStbdArc, false);

  // Dead ahead is in neither broadside arc
  const ahead = computeBroadsideAlignment(0, 0, 0, 0, -24, 48, 0.44);
  assert.equal(ahead.inPortArc, false);
  assert.equal(ahead.inStbdArc, false);

  // Rotated 90 deg east (heading = PI/2 -> facing +X, starboard = +Z)
  const rotatedStbd = computeBroadsideAlignment(0, 0, Math.PI / 2, 0, 26, 48, 0.44);
  assert.equal(rotatedStbd.inStbdArc, true);
  assert.equal(rotatedStbd.inPortArc, false);

  // Out of range
  const tooFar = computeBroadsideAlignment(0, 0, 0, 65, 0, 48, 0.44);
  assert.equal(tooFar.inStbdArc, false);
  assert.equal(tooFar.inPortArc, false);
});

test('mortar, harpoonBolt, cursed ammo and rogue wave / plunging ram / rockfall mechanics behave accurately', () => {
  const mortarShot = computeBroadsideShot('mortar', 0.4, 0.56);
  const mortarFx = computeAmmoEffect('mortar');
  assert.ok(mortarShot.damagePerHit > 20);
  assert.ok(mortarFx.splashRadius >= 9);

  const boltFx = computeAmmoEffect('harpoonBolt');
  assert.ok(boltFx.pullForce > 8);
  assert.ok(boltFx.sailSlowDuration > 0);

  const cursedFx = computeAmmoEffect('cursed');
  assert.equal(cursedFx.piercesShield, true);
  assert.ok(cursedFx.armorRendDuration > 5);
  assert.ok(cursedFx.crewSlowDuration > 4);

  const baseWave = sampleWaveHeight(0, 0, 2.0, 1.0);
  const rogueWave = sampleWaveHeight(0, 0, 2.0, 1.0, {
    active: true,
    x: 0,
    z: 0,
    radius: 34,
    amplitude: 3.4,
    dirX: 1,
    dirZ: 0,
  });
  assert.ok(rogueWave > baseWave + 2.5);

  assert.ok(computePlungingRamBonus(1.4, 0) > 1.4);
  assert.equal(computePlungingRamBonus(0, 0), 1.0);
  assert.ok(computeRockfallSplash(6, 18, 44) > computeRockfallSplash(14, 18, 44));
  assert.equal(computeRockfallSplash(20, 18, 44), 0);
});

