import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHeadingTicks,
  classifyHullDelta,
  computeOffscreenEdgeMarker,
  computeSpecularSample,
  computeWindTapeOffsets,
  getCrossedBossThresholds,
  getSignedAngleDiffDeg,
  sampleQuadraticBezier,
  stepComboStreak,
} from './uiEffects';

test('computeSpecularSample centers percentages and bounds tilt', () => {
  const center = computeSpecularSample(200, 150, {
    left: 100,
    top: 50,
    width: 200,
    height: 200,
  });
  assert.equal(center.mxPct, 50);
  assert.equal(center.myPct, 50);
  assert.equal(center.rx, 0);
  assert.equal(center.ry, 0);

  const corner = computeSpecularSample(999, -50, {
    left: 100,
    top: 50,
    width: 200,
    height: 200,
  });
  assert.equal(corner.mxPct, 100);
  assert.equal(corner.myPct, 0);
  assert.equal(corner.rx, 2.1);
  assert.equal(corner.ry, 2.1);
});

test('getCrossedBossThresholds detects single and multiple threshold breaks', () => {
  assert.deepEqual(getCrossedBossThresholds(100, 100, 80, 100), []);
  assert.deepEqual(getCrossedBossThresholds(80, 100, 72, 100), [0.75]);
  assert.deepEqual(getCrossedBossThresholds(80, 100, 20, 100), [0.75, 0.5, 0.25]);
  assert.deepEqual(getCrossedBossThresholds(null, null, 70, 100), []);
  assert.deepEqual(getCrossedBossThresholds(50, 100, 120, 120), []);
});

test('sampleQuadraticBezier hits endpoints and arched midpoint', () => {
  const start = sampleQuadraticBezier(10, 20, 60, 0, 110, 80, 0);
  assert.deepEqual(start, { x: 10, y: 20 });

  const end = sampleQuadraticBezier(10, 20, 60, 0, 110, 80, 1);
  assert.deepEqual(end, { x: 110, y: 80 });

  const mid = sampleQuadraticBezier(0, 100, 50, 0, 100, 100, 0.5);
  assert.equal(mid.x, 50);
  assert.equal(mid.y, 50);
});

test('heading chronometer tape wraps angles cleanly and projects cardinal ticks and wind sweet spots', () => {
  assert.equal(getSignedAngleDiffDeg(350, 10), -20);
  assert.equal(getSignedAngleDiffDeg(10, 350), 20);

  const ticks = buildHeadingTicks(0, 130, 15);
  const north = ticks.find((t) => t.deg === 0);
  assert.ok(north);
  assert.equal(north.cardinal, 'N');
  assert.equal(north.xPct, 50);

  const wind = computeWindTapeOffsets(108, 0, 130);
  assert.equal(wind.sweetSpotsXPct.includes(50), true);
});

test('combo streak increments on scored events and decays to zero after window expires', () => {
  const s1 = stepComboStreak(0, 0, 0.016, true);
  assert.equal(s1.streak, 1);
  assert.ok(s1.timer > 7);

  const s2 = stepComboStreak(s1.streak, s1.timer, 0.5, true);
  assert.equal(s2.streak, 2);

  const decayed = stepComboStreak(s2.streak, 0.4, 0.5, false);
  assert.equal(decayed.streak, 0);
  assert.equal(decayed.timer, 0);
});

test('computeOffscreenEdgeMarker hides onscreen targets and clamps offscreen & behind-camera bearings', () => {
  const onscreen = computeOffscreenEdgeMarker(720, 450, true, 1440, 900);
  assert.equal(onscreen.visible, false);

  const right = computeOffscreenEdgeMarker(2000, 450, true, 1440, 900);
  assert.equal(right.visible, true);
  assert.ok(right.xPct > 95);
  assert.equal(right.angleDeg, 0);

  const behind = computeOffscreenEdgeMarker(720, 100, false, 1440, 900);
  assert.equal(behind.visible, true);
  assert.ok(behind.yPct > 80);
  assert.equal(behind.angleDeg, 90);
});

test('classifyHullDelta distinguishes damage, heal, and unchanged states', () => {
  assert.equal(classifyHullDelta(80, 62), 'damage');
  assert.equal(classifyHullDelta(62, 86), 'heal');
  assert.equal(classifyHullDelta(86, 86), 'none');
});


