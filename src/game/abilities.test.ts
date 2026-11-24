import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HARPOON_COOLDOWN_SEC,
  HARPOON_DURATION_SEC,
  HARPOON_SNAP_RANGE,
  SMOKE_COOLDOWN_SEC,
  SMOKE_DURATION_SEC,
  STORM_WAKE_DURATION_SEC,
  STORM_WAKE_MAX_RAGE,
  activateSmokeAbility,
  activateStormWakeAbility,
  computeHarpoonReelPull,
  computeHarpoonTetherForces,
  createInitialAbilityState,
  findHarpoonTarget,
  gainStormRage,
  stepAbilityState,
} from './abilities';

test('findHarpoonTarget prefers alive enemies inside range and forward arc', () => {
  const target = findHarpoonTarget(0, 0, 0, [
    { id: 1, x: 0, z: 25, alive: true }, // directly behind (-cos(0) = -1, so +z is behind)
    { id: 2, x: 4, z: -28, alive: true }, // ahead
    { id: 3, x: 0, z: -12, alive: false }, // sunk
    { id: 4, x: 0, z: -80, alive: true }, // out of range
  ]);
  assert.equal(target?.id, 2);

  const none = findHarpoonTarget(0, 0, 0, [{ id: 4, x: 0, z: -80, alive: true }]);
  assert.equal(none, null);
});

test('harpoon tether forces pull ships closer and snap past max tether distance', () => {
  const pull = computeHarpoonTetherForces(0, 0, 0, -34, 0.5);
  assert.equal(pull.snapped, false);
  assert.ok(pull.playerPullZ < 0);
  assert.ok(pull.enemyPullZ > 0);

  const snap = computeHarpoonTetherForces(0, 0, 0, -(HARPOON_SNAP_RANGE + 4), 0.1);
  assert.equal(snap.snapped, true);

  const reel = computeHarpoonReelPull(0, 0, 0, -24);
  const newDist = Math.hypot(reel.enemyX - reel.playerX, reel.enemyZ - reel.playerZ);
  assert.ok(newDist < 24);
  assert.ok(newDist >= 7);
});

test('phantom smoke triggers once off cooldown and decays cleanly', () => {
  let state = createInitialAbilityState();
  const res1 = activateSmokeAbility(state);
  assert.equal(res1.triggered, true);
  assert.equal(res1.state.smokeTimer, SMOKE_DURATION_SEC);
  assert.equal(res1.state.smokeCooldown, SMOKE_COOLDOWN_SEC);

  const res2 = activateSmokeAbility(res1.state);
  assert.equal(res2.triggered, false);

  state = stepAbilityState(res1.state, SMOKE_COOLDOWN_SEC + 0.1, false);
  assert.equal(state.smokeTimer, 0);
  assert.equal(state.smokeCooldown, 0);
});

test('storm wake overdrive requires 100% rage, resets rage on use, and squall trickles charge', () => {
  let state = createInitialAbilityState();
  const early = activateStormWakeAbility(state);
  assert.equal(early.triggered, false);

  state = gainStormRage(state, 70);
  assert.equal(state.stormRage, STORM_WAKE_MAX_RAGE);

  const activated = activateStormWakeAbility(state);
  assert.equal(activated.triggered, true);
  assert.equal(activated.state.stormRage, 0);
  assert.equal(activated.state.stormWakeTimer, STORM_WAKE_DURATION_SEC);

  // Rage cannot recharge while overdrive is active, but trickles in squalls once ended
  const during = gainStormRage(activated.state, 50);
  assert.equal(during.stormRage, 0);

  const after = stepAbilityState(activated.state, STORM_WAKE_DURATION_SEC + 1.0, true);
  assert.equal(after.stormWakeTimer, 0);
  assert.ok(after.stormRage > 0);
});

test('harpoon active timer clears target id when duration expires', () => {
  const latched = {
    ...createInitialAbilityState(),
    harpoonTargetId: 42,
    harpoonActiveTimer: HARPOON_DURATION_SEC,
    harpoonCooldown: HARPOON_COOLDOWN_SEC,
  };
  const expired = stepAbilityState(latched, HARPOON_DURATION_SEC + 0.1, false);
  assert.equal(expired.harpoonActiveTimer, 0);
  assert.equal(expired.harpoonTargetId, null);
  assert.ok(expired.harpoonCooldown > 0);
});
