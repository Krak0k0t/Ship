import test from 'node:test';
import assert from 'node:assert/strict';
import { ACT_IDS, ACT_SPECS } from './campaign';
import {
  SECRET_QUEST_IDS,
  SECRET_QUEST_SPECS,
  canHarpoonReefChest,
  checkShoalBrazierVisit,
  didChainShotStrikeStormBuoy,
  didStormWakeShatterRift,
  getBeamBellPosition,
  getFogHulkPosition,
  getLighthouseRelicPosition,
  getReefChestPosition,
  getShadowStraitBuoys,
  getShoalBrazierPositions,
  getStormBuoyPosition,
  getStormRiftPosition,
  isBeamSweepingBell,
  isNearLighthouseRelic,
  isSurgeOverMaelstrom,
  stepFogHulkHold,
  stepShadowStraitPass,
} from './secrets';

test('all 9 secret quests define positive doubloon and score rewards', () => {
  assert.equal(SECRET_QUEST_IDS.length, 9);
  for (const id of SECRET_QUEST_IDS) {
    const spec = SECRET_QUEST_SPECS[id];
    assert.ok(spec.rewardDoubloons >= 80);
    assert.ok(spec.rewardScore >= 400);
  }
});

test('all secret props sit safely clear of headlands and inside arena across all acts', () => {
  for (const actId of ACT_IDS) {
    const act = ACT_SPECS[actId];
    const relic = getLighthouseRelicPosition(act.headlands);
    assert.ok(relic, `Act ${actId} should have a lighthouse relic`);
    const lh = act.headlands.find((h) => h.lighthouse)!;
    const distFromCliff = Math.hypot(relic.x - lh.x, relic.z - lh.z);
    assert.ok(distFromCliff > 15, 'Relic must sit outside reef collision radius');
    assert.ok(Math.hypot(relic.x, relic.z) < 135, 'Relic must sit inside arena boundary');

    const bell = getBeamBellPosition(act.headlands, act.whirlpools);
    assert.ok(bell, `Act ${actId} should place sunken beam bell`);
    assert.ok(Math.hypot(bell.x, bell.z) < 130, 'Beam bell inside arena');
    for (const h of act.headlands) {
      assert.ok(Math.hypot(bell.x - h.x, bell.z - h.z) > 15, 'Beam bell clear of headlands');
    }

    const hulk = getFogHulkPosition(act.headlands, act.whirlpools);
    assert.ok(Math.hypot(hulk.x, hulk.z) < 120, 'Fog hulk inside arena mist edge');
    for (const h of act.headlands) {
      assert.ok(Math.hypot(hulk.x - h.x, hulk.z - h.z) > 18, 'Fog hulk clear of headlands');
    }

    const stormBuoy = getStormBuoyPosition(act.headlands, act.whirlpools);
    assert.ok(Math.hypot(stormBuoy.x, stormBuoy.z) < 120, 'Storm buoy inside arena');
    for (const h of act.headlands) {
      assert.ok(Math.hypot(stormBuoy.x - h.x, stormBuoy.z - h.z) > 16, 'Storm buoy clear of headlands');
    }

    const reefChest = getReefChestPosition(act.headlands, act.whirlpools);
    assert.ok(reefChest, `Act ${actId} should place sunken reef chest`);
    assert.ok(Math.hypot(reefChest.x, reefChest.z) < 125, 'Reef chest inside arena');
    for (const h of act.headlands) {
      assert.ok(Math.hypot(reefChest.x - h.x, reefChest.z - h.z) > 15, 'Reef chest clear of reef collision');
    }

    const straitBuoys = getShadowStraitBuoys(act.headlands, act.whirlpools);
    assert.equal(straitBuoys.length, 3);
    for (const b of straitBuoys) {
      assert.ok(Math.hypot(b.x, b.z) < 110, 'Shadow strait buoy inside arena');
      for (const h of act.headlands) {
        assert.ok(Math.hypot(b.x - h.x, b.z - h.z) > 14, 'Shadow strait buoy clear of headlands');
      }
    }

    const rift = getStormRiftPosition(act.headlands, act.whirlpools);
    assert.ok(Math.hypot(rift.x, rift.z) < 100, 'Storm rift inside arena');
    for (const h of act.headlands) {
      assert.ok(Math.hypot(rift.x - h.x, rift.z - h.z) > 16, 'Storm rift clear of headlands');
    }

    assert.equal(isNearLighthouseRelic(relic.x, relic.z, relic), true);
    assert.equal(isNearLighthouseRelic(relic.x + 20, relic.z, relic), false);
  }
});

test('maelstrom surge quest requires both active wave surge height and whirlpool center proximity', () => {
  const whirlpools = [{ x: -48, z: -14 }];
  assert.equal(isSurgeOverMaelstrom(-48, -14, 0.2, whirlpools), null);
  assert.equal(isSurgeOverMaelstrom(0, 0, 1.4, whirlpools), null);
  const hit = isSurgeOverMaelstrom(-45, -12, 1.1, whirlpools);
  assert.deepEqual(hit, { x: -48, z: -14 });
});

test('shoal braziers track perimeter headland discoveries until all shoals are lit', () => {
  const shoals = getShoalBrazierPositions(ACT_SPECS[1].headlands);
  assert.equal(shoals.length, 2);

  const lit = new Set<number>();
  const first = checkShoalBrazierVisit(shoals[0].x + 15, shoals[0].z, shoals, lit);
  assert.deepEqual(first.newlyLitIndices, [0]);
  assert.equal(first.allLit, false);

  lit.add(0);
  const second = checkShoalBrazierVisit(shoals[1].x, shoals[1].z - 16, shoals, lit);
  assert.deepEqual(second.newlyLitIndices, [1]);
  assert.equal(second.allLit, true);
});

test('beam bell triggers only when firing near bell inside rotating lighthouse cone', () => {
  const lh = { x: 0, z: 0 };
  const bell = { x: 0, z: -42 }; // angle (-sin(0), -cos(0)) = (0, -1) -> beamRotationY = 0
  assert.equal(isBeamSweepingBell(lh, bell, 0, 2, -40, false), false);
  assert.equal(isBeamSweepingBell(lh, bell, Math.PI, 2, -40, true), false);
  assert.equal(isBeamSweepingBell(lh, bell, 0, 30, -40, true), false);
  assert.equal(isBeamSweepingBell(lh, bell, 0.1, 2, -40, true), true);
});

test('fog hulk requires anchoring (sailLevel 0) inside mist zone for full hold duration', () => {
  const hulk = { x: -102, z: 0 };
  const moving = stepFogHulkHold(0.8, 0.5, -100, 0, 0.5, hulk);
  assert.equal(moving.triggered, false);
  assert.equal(moving.inZoneMoving, true);
  assert.ok(moving.holdSec < 0.8);

  const hold1 = stepFogHulkHold(0.9, 0.8, -100, 2, 0, hulk);
  assert.equal(hold1.triggered, true);
  assert.equal(hold1.inZoneAnchored, true);
});

test('thunder chain secret requires player chain shot plus squall or wave crest', () => {
  const buoy = { x: 64, z: 0 };
  assert.equal(didChainShotStrikeStormBuoy(64, 1, 'round', false, true, 'squall', buoy), false);
  assert.equal(didChainShotStrikeStormBuoy(64, 1, 'chain', true, true, 'squall', buoy), false);
  assert.equal(didChainShotStrikeStormBuoy(64, 1, 'chain', false, false, 'calm', buoy), false);
  assert.equal(didChainShotStrikeStormBuoy(64, 1, 'chain', false, true, 'calm', buoy), true);
  assert.equal(didChainShotStrikeStormBuoy(64, 1, 'chain', false, false, 'squall', buoy), true);
});

test('reef chest harpoon latch requires proximity, incomplete state, and scores forward arc', () => {
  const chest = { x: 0, z: -30 };
  assert.equal(canHarpoonReefChest(0, 0, 0, chest, false).canLatch, true);
  assert.equal(canHarpoonReefChest(0, 0, 0, chest, true).canLatch, false);
  assert.equal(canHarpoonReefChest(0, 80, 0, chest, false).canLatch, false);
  const ahead = canHarpoonReefChest(0, 0, 0, chest, false);
  const behind = canHarpoonReefChest(0, 0, Math.PI, chest, false);
  assert.ok(ahead.score < behind.score);
});

test('shadow strait requires active phantom smoke veil across all 3 buoys and resets if veil fades', () => {
  const buoys = [
    { index: 0, x: 0, z: -30 },
    { index: 1, x: 22, z: -30 },
    { index: 2, x: 44, z: -30 },
  ];
  const lit = new Set<number>();
  const noSmoke = stepShadowStraitPass(buoys, lit, 0, -30, false);
  assert.equal(noSmoke.newlyLitIndices.length, 0);

  const p1 = stepShadowStraitPass(buoys, lit, 2, -28, true);
  assert.deepEqual(p1.newlyLitIndices, [0]);
  assert.equal(p1.allLit, false);
  lit.add(0);

  const faded = stepShadowStraitPass(buoys, lit, 22, -30, false);
  assert.equal(faded.reset, true);

  lit.add(1);
  const p3 = stepShadowStraitPass(buoys, lit, 44, -30, true);
  assert.deepEqual(p3.newlyLitIndices, [2]);
  assert.equal(p3.allLit, true);
});

test('storm eye rift shatters when slicing through core or firing broadside during storm wake overdrive', () => {
  const rift = { x: 40, z: 20 };
  assert.equal(didStormWakeShatterRift(40, 20, false, true, rift), false);
  assert.equal(didStormWakeShatterRift(10, 20, true, true, rift), false);
  assert.equal(didStormWakeShatterRift(52, 20, true, false, rift), false);
  assert.equal(didStormWakeShatterRift(52, 20, true, true, rift), true);
  assert.equal(didStormWakeShatterRift(44, 22, true, false, rift), true);
});

