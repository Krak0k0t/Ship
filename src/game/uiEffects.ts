export const BOSS_HP_THRESHOLDS = [0.75, 0.5, 0.25] as const;

export interface SpecularSample {
  mxPct: number;
  myPct: number;
  rx: number;
  ry: number;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function computeSpecularSample(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  maxTiltDeg = 2.1,
): SpecularSample {
  const w = Math.max(1, rect.width);
  const h = Math.max(1, rect.height);
  const relX = clamp((clientX - rect.left) / w, 0, 1);
  const relY = clamp((clientY - rect.top) / h, 0, 1);
  const nx = relX * 2 - 1;
  const ny = relY * 2 - 1;
  return {
    mxPct: Number((relX * 100).toFixed(1)),
    myPct: Number((relY * 100).toFixed(1)),
    rx: Number((-ny * maxTiltDeg).toFixed(2)),
    ry: Number((nx * maxTiltDeg).toFixed(2)),
  };
}

export function getCrossedBossThresholds(
  prevHp: number | null,
  prevMaxHp: number | null,
  nextHp: number | null,
  nextMaxHp: number | null,
): number[] {
  if (
    prevHp === null ||
    prevMaxHp === null ||
    nextHp === null ||
    nextMaxHp === null ||
    prevMaxHp <= 0 ||
    nextMaxHp <= 0 ||
    prevMaxHp !== nextMaxHp ||
    nextHp >= prevHp
  ) {
    return [];
  }

  const prevRatio = prevHp / prevMaxHp;
  const nextRatio = nextHp / nextMaxHp;
  return BOSS_HP_THRESHOLDS.filter((t) => prevRatio > t && nextRatio <= t);
}

export function sampleQuadraticBezier(
  p0x: number,
  p0y: number,
  cx: number,
  cy: number,
  p1x: number,
  p1y: number,
  t: number,
): { x: number; y: number } {
  const u = clamp(t, 0, 1);
  const inv = 1 - u;
  return {
    x: inv * inv * p0x + 2 * inv * u * cx + u * u * p1x,
    y: inv * inv * p0y + 2 * inv * u * cy + u * u * p1y,
  };
}

export function applySpecularVarsToTarget(
  el: HTMLElement,
  clientX: number,
  clientY: number,
  maxTiltDeg = 2.1,
): SpecularSample {
  const sample = computeSpecularSample(
    clientX,
    clientY,
    el.getBoundingClientRect(),
    maxTiltDeg,
  );
  el.style.setProperty('--mx', `${sample.mxPct}%`);
  el.style.setProperty('--my', `${sample.myPct}%`);
  return sample;
}

export function dispatchSparkBurst(x: number, y: number, color = '#FFD27D'): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('blackpennant:burst', {
      detail: { x, y, color },
    }),
  );
}

export function dispatchCoinFly(
  fromX: number,
  fromY: number,
  count = 5,
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('blackpennant:coin-fly', {
      detail: { fromX, fromY, count },
    }),
  );
}

export const STREAK_WINDOW_SEC = 8.0;

const CARDINAL_LABELS: Record<number, string> = {
  0: 'N',
  45: 'NE',
  90: 'E',
  135: 'SE',
  180: 'S',
  225: 'SW',
  270: 'W',
  315: 'NW',
};

export function getSignedAngleDiffDeg(targetDeg: number, referenceDeg: number): number {
  let diff = ((targetDeg - referenceDeg + 540) % 360) - 180;
  if (diff < -180) diff += 360;
  return diff;
}

export interface HeadingTick {
  deg: number;
  xPct: number;
  cardinal: string | null;
  major: boolean;
}

export function buildHeadingTicks(
  headingDeg: number,
  spanDeg = 130,
  stepDeg = 15,
): HeadingTick[] {
  const half = spanDeg * 0.5;
  const ticks: HeadingTick[] = [];
  for (let d = 0; d < 360; d += stepDeg) {
    const diff = getSignedAngleDiffDeg(d, headingDeg);
    if (Math.abs(diff) > half) continue;
    const xPct = Number((((diff + half) / spanDeg) * 100).toFixed(2));
    const cardinal = CARDINAL_LABELS[d] ?? null;
    ticks.push({
      deg: d,
      xPct,
      cardinal,
      major: cardinal !== null || d % 45 === 0,
    });
  }
  return ticks.sort((a, b) => a.xPct - b.xPct);
}

export interface WindTapeMarkers {
  windXPct: number;
  windVisible: boolean;
  sweetSpotsXPct: number[];
}

export function computeWindTapeOffsets(
  headingDeg: number,
  windDeg: number,
  spanDeg = 130,
): WindTapeMarkers {
  const half = spanDeg * 0.5;
  const windDiff = getSignedAngleDiffDeg(windDeg, headingDeg);
  const windVisible = Math.abs(windDiff) <= half;
  const windXPct = Number((((clamp(windDiff, -half, half) + half) / spanDeg) * 100).toFixed(2));

  // Ideal Beam / Broad Reach tacks sit at +/-108 deg from the wind axis
  const sweetSpotsXPct: number[] = [];
  for (const offset of [-108, 108]) {
    const idealHeading = (windDeg + offset + 360) % 360;
    const diff = getSignedAngleDiffDeg(idealHeading, headingDeg);
    if (Math.abs(diff) <= half) {
      sweetSpotsXPct.push(Number((((diff + half) / spanDeg) * 100).toFixed(2)));
    }
  }

  return { windXPct, windVisible, sweetSpotsXPct };
}

export function stepComboStreak(
  streak: number,
  timer: number,
  dt: number,
  scoredEvent = false,
): { streak: number; timer: number } {
  if (scoredEvent) {
    return {
      streak: Math.min(99, streak + 1),
      timer: STREAK_WINDOW_SEC,
    };
  }
  if (streak <= 0) {
    return { streak: 0, timer: 0 };
  }
  const nextTimer = Math.max(0, timer - Math.max(0, dt));
  return {
    streak: nextTimer > 0 ? streak : 0,
    timer: nextTimer,
  };
}

export interface OffscreenTargetIndicator {
  xPct: number;
  yPct: number;
  angleDeg: number;
  distMeters: number;
  isBoss: boolean;
}

export interface OffscreenEdgeProjection {
  visible: boolean;
  xPct: number;
  yPct: number;
  angleDeg: number;
}

export function computeOffscreenEdgeMarker(
  screenX: number,
  screenY: number,
  inFront: boolean,
  viewportW: number,
  viewportH: number,
  topSafePx = 112,
  bottomSafePx = 118,
  sideMarginPx = 38,
): OffscreenEdgeProjection {
  const w = Math.max(120, viewportW);
  const h = Math.max(240, viewportH);

  if (
    inFront &&
    screenX >= sideMarginPx &&
    screenX <= w - sideMarginPx &&
    screenY >= topSafePx &&
    screenY <= h - bottomSafePx
  ) {
    return { visible: false, xPct: 50, yPct: 50, angleDeg: 0 };
  }

  const cx = w * 0.5;
  const cy = h * 0.5;
  let dx = screenX - cx;
  let dy = screenY - cy;
  if (!inFront) {
    dx = -dx;
    dy = -dy;
  }

  const mag = Math.hypot(dx, dy);
  if (mag < 1e-4) {
    dy = 1;
    dx = 0;
  } else {
    dx /= mag;
    dy /= mag;
  }

  const minX = sideMarginPx;
  const maxX = Math.max(minX + 10, w - sideMarginPx);
  const minY = Math.min(cy - 10, topSafePx);
  const maxY = Math.max(cy + 10, h - bottomSafePx);

  let bestT = Infinity;
  if (dx > 1e-4) bestT = Math.min(bestT, (maxX - cx) / dx);
  if (dx < -1e-4) bestT = Math.min(bestT, (minX - cx) / dx);
  if (dy > 1e-4) bestT = Math.min(bestT, (maxY - cy) / dy);
  if (dy < -1e-4) bestT = Math.min(bestT, (minY - cy) / dy);
  if (!Number.isFinite(bestT)) bestT = 100;

  const px = clamp(cx + dx * bestT, minX, maxX);
  const py = clamp(cy + dy * bestT, minY, maxY);

  return {
    visible: true,
    xPct: Number(((px / w) * 100).toFixed(2)),
    yPct: Number(((py / h) * 100).toFixed(2)),
    angleDeg: Number(((Math.atan2(dy, dx) * 180) / Math.PI).toFixed(1)),
  };
}

export function classifyHullDelta(prevPct: number, nextPct: number): 'damage' | 'heal' | 'none' {
  if (nextPct < prevPct) return 'damage';
  if (nextPct > prevPct) return 'heal';
  return 'none';
}


