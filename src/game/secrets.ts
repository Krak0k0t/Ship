import type { WeatherId } from './campaign';
import type { AmmoType } from './sailingPhysics';

export type SecretQuestId =
  | 'lighthouse'
  | 'maelstrom'
  | 'shoals'
  | 'beamBell'
  | 'fogHulk'
  | 'thunderChain'
  | 'reefChest'
  | 'shadowStrait'
  | 'stormEye';

export const HARPOON_CHEST_TARGET_ID = -999;

export const SECRET_QUEST_IDS: SecretQuestId[] = [
  'lighthouse',
  'maelstrom',
  'shoals',
  'beamBell',
  'fogHulk',
  'thunderChain',
  'reefChest',
  'shadowStrait',
  'stormEye',
];

export type SecretTitleKey =
  | 'secret1Title'
  | 'secret2Title'
  | 'secret3Title'
  | 'secret4Title'
  | 'secret5Title'
  | 'secret6Title'
  | 'secret7Title'
  | 'secret8Title'
  | 'secret9Title';

export type SecretClueKey =
  | 'secret1Clue'
  | 'secret2Clue'
  | 'secret3Clue'
  | 'secret4Clue'
  | 'secret5Clue'
  | 'secret6Clue'
  | 'secret7Clue'
  | 'secret8Clue'
  | 'secret9Clue';

export type SecretRewardKey =
  | 'secret1Reward'
  | 'secret2Reward'
  | 'secret3Reward'
  | 'secret4Reward'
  | 'secret5Reward'
  | 'secret6Reward'
  | 'secret7Reward'
  | 'secret8Reward'
  | 'secret9Reward';

export interface SecretQuestSpec {
  id: SecretQuestId;
  rewardDoubloons: number;
  rewardScore: number;
  titleKey: SecretTitleKey;
  clueKey: SecretClueKey;
  rewardKey: SecretRewardKey;
}

export const SECRET_QUEST_SPECS: Record<SecretQuestId, SecretQuestSpec> = {
  lighthouse: {
    id: 'lighthouse',
    rewardDoubloons: 80,
    rewardScore: 400,
    titleKey: 'secret1Title',
    clueKey: 'secret1Clue',
    rewardKey: 'secret1Reward',
  },
  maelstrom: {
    id: 'maelstrom',
    rewardDoubloons: 100,
    rewardScore: 500,
    titleKey: 'secret2Title',
    clueKey: 'secret2Clue',
    rewardKey: 'secret2Reward',
  },
  shoals: {
    id: 'shoals',
    rewardDoubloons: 120,
    rewardScore: 600,
    titleKey: 'secret3Title',
    clueKey: 'secret3Clue',
    rewardKey: 'secret3Reward',
  },
  beamBell: {
    id: 'beamBell',
    rewardDoubloons: 140,
    rewardScore: 700,
    titleKey: 'secret4Title',
    clueKey: 'secret4Clue',
    rewardKey: 'secret4Reward',
  },
  fogHulk: {
    id: 'fogHulk',
    rewardDoubloons: 150,
    rewardScore: 750,
    titleKey: 'secret5Title',
    clueKey: 'secret5Clue',
    rewardKey: 'secret5Reward',
  },
  thunderChain: {
    id: 'thunderChain',
    rewardDoubloons: 160,
    rewardScore: 800,
    titleKey: 'secret6Title',
    clueKey: 'secret6Clue',
    rewardKey: 'secret6Reward',
  },
  reefChest: {
    id: 'reefChest',
    rewardDoubloons: 180,
    rewardScore: 900,
    titleKey: 'secret7Title',
    clueKey: 'secret7Clue',
    rewardKey: 'secret7Reward',
  },
  shadowStrait: {
    id: 'shadowStrait',
    rewardDoubloons: 170,
    rewardScore: 850,
    titleKey: 'secret8Title',
    clueKey: 'secret8Clue',
    rewardKey: 'secret8Reward',
  },
  stormEye: {
    id: 'stormEye',
    rewardDoubloons: 200,
    rewardScore: 1000,
    titleKey: 'secret9Title',
    clueKey: 'secret9Clue',
    rewardKey: 'secret9Reward',
  },
};

export interface HeadlandMarkerInput {
  x: number;
  z: number;
  lighthouse: boolean;
}

function minClearance(
  x: number,
  z: number,
  headlands: ReadonlyArray<HeadlandMarkerInput>,
  whirlpools: ReadonlyArray<[number, number] | { x: number; z: number }>,
): number {
  let minDist = Infinity;
  for (const h of headlands) {
    minDist = Math.min(minDist, Math.hypot(x - h.x, z - h.z));
  }
  for (const wp of whirlpools) {
    const wx = Array.isArray(wp) ? wp[0] : wp.x;
    const wz = Array.isArray(wp) ? wp[1] : wp.z;
    minDist = Math.min(minDist, Math.hypot(x - wx, z - wz));
  }
  return minDist;
}

export function getLighthouseRelicPosition(
  headlands: ReadonlyArray<HeadlandMarkerInput>,
): { x: number; z: number } | null {
  const lh = headlands.find((h) => h.lighthouse);
  if (!lh) return null;
  const len = Math.hypot(lh.x, lh.z);
  const nx = len > 0.01 ? lh.x / len : 0;
  const nz = len > 0.01 ? lh.z / len : -1;
  return {
    x: Number((lh.x + nx * 18.5).toFixed(2)),
    z: Number((lh.z + nz * 18.5).toFixed(2)),
  };
}

export function getShoalBrazierPositions(
  headlands: ReadonlyArray<HeadlandMarkerInput>,
): Array<{ index: number; x: number; z: number }> {
  const result: Array<{ index: number; x: number; z: number }> = [];
  let idx = 0;
  for (const h of headlands) {
    if (!h.lighthouse) {
      result.push({ index: idx, x: h.x, z: h.z });
      idx += 1;
    }
  }
  return result;
}

export function getBeamBellPosition(
  headlands: ReadonlyArray<HeadlandMarkerInput>,
  whirlpools: ReadonlyArray<[number, number] | { x: number; z: number }> = [],
): { x: number; z: number } | null {
  const lh = headlands.find((h) => h.lighthouse);
  if (!lh) return null;

  const baseAngle = Math.atan2(-lh.x, -lh.z);
  const offsets = [0.22, -0.22, 0.45, -0.45, 0, 0.75, -0.75];
  let best: { x: number; z: number; clearance: number } | null = null;

  for (const off of offsets) {
    const a = baseAngle + off;
    const distFromLh = 42;
    const cx = Number((lh.x + Math.sin(a) * distFromLh).toFixed(2));
    const cz = Number((lh.z + Math.cos(a) * distFromLh).toFixed(2));
    if (Math.hypot(cx, cz) > 122) continue;
    const clear = minClearance(cx, cz, headlands, whirlpools);
    if (!best || clear > best.clearance) {
      best = { x: cx, z: cz, clearance: clear };
    }
    if (clear >= 24) break;
  }

  return best ? { x: best.x, z: best.z } : null;
}

export function getFogHulkPosition(
  headlands: ReadonlyArray<HeadlandMarkerInput>,
  whirlpools: ReadonlyArray<[number, number] | { x: number; z: number }> = [],
): { x: number; z: number } {
  let best = { x: -96, z: 32, clearance: -1 };
  for (let i = 0; i < 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2 + 0.35;
    const cx = Number((Math.cos(angle) * 102).toFixed(2));
    const cz = Number((Math.sin(angle) * 102).toFixed(2));
    const clear = minClearance(cx, cz, headlands, whirlpools);
    if (clear > best.clearance) {
      best = { x: cx, z: cz, clearance: clear };
    }
  }
  return { x: best.x, z: best.z };
}

export function getStormBuoyPosition(
  headlands: ReadonlyArray<HeadlandMarkerInput>,
  whirlpools: ReadonlyArray<[number, number] | { x: number; z: number }> = [],
): { x: number; z: number } {
  let best = { x: 64, z: -8, clearance: -1 };
  for (let i = 0; i < 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2 + 0.12;
    const cx = Number((Math.cos(angle) * 66).toFixed(2));
    const cz = Number((Math.sin(angle) * 66).toFixed(2));
    const clear = minClearance(cx, cz, headlands, whirlpools);
    if (clear > best.clearance) {
      best = { x: cx, z: cz, clearance: clear };
    }
  }
  return { x: best.x, z: best.z };
}

export function isNearLighthouseRelic(
  shipX: number,
  shipZ: number,
  relicPos: { x: number; z: number } | null,
  triggerRadius = 8.2,
): boolean {
  if (!relicPos) return false;
  return Math.hypot(shipX - relicPos.x, shipZ - relicPos.z) <= triggerRadius;
}

export function isSurgeOverMaelstrom(
  shipX: number,
  shipZ: number,
  surgeY: number,
  whirlpools: ReadonlyArray<{ x: number; z: number }>,
  triggerRadius = 10.5,
  minSurgeY = 0.72,
): { x: number; z: number } | null {
  if (surgeY < minSurgeY) return null;
  for (const wp of whirlpools) {
    if (Math.hypot(shipX - wp.x, shipZ - wp.z) <= triggerRadius) {
      return { x: wp.x, z: wp.z };
    }
  }
  return null;
}

export function checkShoalBrazierVisit(
  shipX: number,
  shipZ: number,
  shoals: ReadonlyArray<{ index: number; x: number; z: number }>,
  alreadyLitIndices: ReadonlySet<number>,
  triggerRadius = 20.5,
): { newlyLitIndices: number[]; allLit: boolean } {
  const newlyLitIndices: number[] = [];
  for (const shoal of shoals) {
    if (alreadyLitIndices.has(shoal.index)) continue;
    if (Math.hypot(shipX - shoal.x, shipZ - shoal.z) <= triggerRadius) {
      newlyLitIndices.push(shoal.index);
    }
  }
  const totalLit = alreadyLitIndices.size + newlyLitIndices.length;
  return {
    newlyLitIndices,
    allLit: shoals.length > 0 && totalLit >= shoals.length,
  };
}

export function isBeamIlluminatingPoint(
  lighthousePos: { x: number; z: number } | null,
  targetPos: { x: number; z: number } | null,
  beamRotationY: number,
  cosThreshold = 0.87,
): boolean {
  if (!lighthousePos || !targetPos) return false;
  const dx = targetPos.x - lighthousePos.x;
  const dz = targetPos.z - lighthousePos.z;
  const len = Math.hypot(dx, dz);
  if (len < 0.01) return false;

  // ConeGeometry beam tip is rotated +PI/2 on X then Y-rotated by beamRotationY -> points along (-sin(y), -cos(y))
  const beamDirX = -Math.sin(beamRotationY);
  const beamDirZ = -Math.cos(beamRotationY);
  const dot = (dx / len) * beamDirX + (dz / len) * beamDirZ;
  return dot >= cosThreshold;
}

export function isBeamSweepingBell(
  lighthousePos: { x: number; z: number } | null,
  bellPos: { x: number; z: number } | null,
  beamRotationY: number,
  shipX: number,
  shipZ: number,
  justFiredBroadside: boolean,
  triggerRadius = 16.0,
  cosThreshold = 0.87,
): boolean {
  if (!justFiredBroadside || !bellPos) return false;
  if (Math.hypot(shipX - bellPos.x, shipZ - bellPos.z) > triggerRadius) return false;
  return isBeamIlluminatingPoint(lighthousePos, bellPos, beamRotationY, cosThreshold);
}

export function stepFogHulkHold(
  currentHoldSec: number,
  dt: number,
  shipX: number,
  shipZ: number,
  sailLevel: number,
  hulkPos: { x: number; z: number } | null,
  triggerRadius = 17.5,
  requiredHoldSec = 1.6,
): {
  holdSec: number;
  triggered: boolean;
  inZoneAnchored: boolean;
  inZoneMoving: boolean;
} {
  if (!hulkPos) {
    return {
      holdSec: 0,
      triggered: false,
      inZoneAnchored: false,
      inZoneMoving: false,
    };
  }
  const near = Math.hypot(shipX - hulkPos.x, shipZ - hulkPos.z) <= triggerRadius;
  const anchored = sailLevel <= 0.05;
  if (near && anchored) {
    const nextHold = Math.min(requiredHoldSec, currentHoldSec + dt);
    return {
      holdSec: nextHold,
      triggered: nextHold >= requiredHoldSec,
      inZoneAnchored: true,
      inZoneMoving: false,
    };
  }
  return {
    holdSec: Math.max(0, currentHoldSec - dt * 1.4),
    triggered: false,
    inZoneAnchored: false,
    inZoneMoving: near && !anchored,
  };
}

export function didChainShotStrikeStormBuoy(
  projX: number,
  projZ: number,
  projAmmo: AmmoType,
  projFromEnemy: boolean,
  projCrestBoosted: boolean,
  weather: WeatherId,
  buoyPos: { x: number; z: number } | null,
  hitRadius = 5.8,
): boolean {
  if (projFromEnemy || projAmmo !== 'chain' || !buoyPos) return false;
  if (weather !== 'squall' && !projCrestBoosted) return false;
  return Math.hypot(projX - buoyPos.x, projZ - buoyPos.z) <= hitRadius;
}

export function getReefChestPosition(
  headlands: ReadonlyArray<HeadlandMarkerInput>,
  whirlpools: ReadonlyArray<[number, number] | { x: number; z: number }> = [],
): { x: number; z: number } | null {
  const anchor = headlands.find((h) => !h.lighthouse) ?? headlands[0];
  if (!anchor) return null;

  let best: { x: number; z: number; clearance: number } | null = null;
  for (let i = 0; i < 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2;
    const cx = Number((anchor.x + Math.cos(angle) * 16.8).toFixed(2));
    const cz = Number((anchor.z + Math.sin(angle) * 16.8).toFixed(2));
    if (Math.hypot(cx, cz) > 124) continue;
    const clear = minClearance(cx, cz, headlands, whirlpools);
    if (!best || clear > best.clearance) {
      best = { x: cx, z: cz, clearance: clear };
    }
  }
  return best ? { x: best.x, z: best.z } : null;
}

export function getShadowStraitBuoys(
  headlands: ReadonlyArray<HeadlandMarkerInput>,
  whirlpools: ReadonlyArray<[number, number] | { x: number; z: number }> = [],
): Array<{ index: number; x: number; z: number }> {
  let bestAngle = 0.65;
  let bestScore = -1;

  for (let i = 0; i < 16; i += 1) {
    const baseAngle = (i / 16) * Math.PI * 2;
    let minClear = Infinity;
    for (let k = -1; k <= 1; k += 1) {
      const theta = baseAngle + k * 0.28;
      const bx = Math.cos(theta) * 58;
      const bz = Math.sin(theta) * 58;
      minClear = Math.min(minClear, minClearance(bx, bz, headlands, whirlpools));
    }
    if (minClear > bestScore) {
      bestScore = minClear;
      bestAngle = baseAngle;
    }
  }

  return [-1, 0, 1].map((offset, index) => {
    const theta = bestAngle + offset * 0.31;
    return {
      index,
      x: Number((Math.cos(theta) * 58).toFixed(2)),
      z: Number((Math.sin(theta) * 58).toFixed(2)),
    };
  });
}

export function getStormRiftPosition(
  headlands: ReadonlyArray<HeadlandMarkerInput>,
  whirlpools: ReadonlyArray<[number, number] | { x: number; z: number }> = [],
): { x: number; z: number } {
  const straits = getShadowStraitBuoys(headlands, whirlpools);
  let best = { x: -46, z: -48, clearance: -1 };
  for (let i = 0; i < 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2 + 0.55;
    const cx = Number((Math.cos(angle) * 52).toFixed(2));
    const cz = Number((Math.sin(angle) * 52).toFixed(2));
    let clear = minClearance(cx, cz, headlands, whirlpools);
    for (const b of straits) {
      clear = Math.min(clear, Math.hypot(cx - b.x, cz - b.z));
    }
    if (clear > best.clearance) {
      best = { x: cx, z: cz, clearance: clear };
    }
  }
  return { x: best.x, z: best.z };
}

export function canHarpoonReefChest(
  playerX: number,
  playerZ: number,
  playerHeading: number,
  chestPos: { x: number; z: number } | null,
  completed: boolean,
  maxRange = 54,
): { canLatch: boolean; dist: number; score: number } {
  if (!chestPos || completed) {
    return { canLatch: false, dist: Infinity, score: Infinity };
  }
  const dx = chestPos.x - playerX;
  const dz = chestPos.z - playerZ;
  const dist = Math.hypot(dx, dz);
  if (dist > maxRange || dist < 0.01) {
    return { canLatch: false, dist, score: Infinity };
  }
  const fwdX = Math.sin(playerHeading);
  const fwdZ = -Math.cos(playerHeading);
  const dot = (dx * fwdX + dz * fwdZ) / dist;
  const arcPenalty = dot >= -0.2 ? (1 - dot) * 14 : 28 + Math.abs(dot) * 10;
  return {
    canLatch: true,
    dist,
    score: dist + arcPenalty,
  };
}

export function stepShadowStraitPass(
  buoys: ReadonlyArray<{ index: number; x: number; z: number }>,
  alreadyLitIndices: ReadonlySet<number>,
  shipX: number,
  shipZ: number,
  smokeActive: boolean,
  triggerRadius = 16.5,
): {
  newlyLitIndices: number[];
  allLit: boolean;
  reset: boolean;
} {
  if (!smokeActive) {
    return {
      newlyLitIndices: [],
      allLit: false,
      reset: alreadyLitIndices.size > 0,
    };
  }

  const newlyLitIndices: number[] = [];
  for (const buoy of buoys) {
    if (alreadyLitIndices.has(buoy.index)) continue;
    if (Math.hypot(shipX - buoy.x, shipZ - buoy.z) <= triggerRadius) {
      newlyLitIndices.push(buoy.index);
    }
  }
  const totalLit = alreadyLitIndices.size + newlyLitIndices.length;
  return {
    newlyLitIndices,
    allLit: buoys.length > 0 && totalLit >= buoys.length,
    reset: false,
  };
}

export function didStormWakeShatterRift(
  shipX: number,
  shipZ: number,
  stormWakeActive: boolean,
  broadsideFiredThisTick: boolean,
  riftPos: { x: number; z: number } | null,
  triggerRadius = 16.5,
): boolean {
  if (!stormWakeActive || !riftPos) return false;
  const dist = Math.hypot(shipX - riftPos.x, shipZ - riftPos.z);
  if (dist > triggerRadius) return false;
  return broadsideFiredThisTick || dist <= 8.0;
}

