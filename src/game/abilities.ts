export const HARPOON_COOLDOWN_SEC = 7.5;
export const HARPOON_DURATION_SEC = 3.5;
export const HARPOON_MAX_RANGE = 54;
export const HARPOON_SNAP_RANGE = 68;
export const HARPOON_REEL_DAMAGE = 16;

export const SMOKE_COOLDOWN_SEC = 11.0;
export const SMOKE_DURATION_SEC = 5.0;
export const SMOKE_RELOAD_SPEED_MULT = 1.35;

export const STORM_WAKE_DURATION_SEC = 4.5;
export const STORM_WAKE_INITIAL_RAGE = 35;
export const STORM_WAKE_MAX_RAGE = 100;

export interface AbilityState {
  harpoonTargetId: number | null;
  harpoonActiveTimer: number;
  harpoonCooldown: number;
  smokeTimer: number;
  smokeCooldown: number;
  stormRage: number;
  stormWakeTimer: number;
}

export function createInitialAbilityState(): AbilityState {
  return {
    harpoonTargetId: null,
    harpoonActiveTimer: 0,
    harpoonCooldown: 0,
    smokeTimer: 0,
    smokeCooldown: 0,
    stormRage: STORM_WAKE_INITIAL_RAGE,
    stormWakeTimer: 0,
  };
}

export interface HarpoonCandidate {
  id: number;
  x: number;
  z: number;
  alive: boolean;
}

export function findHarpoonTarget(
  playerX: number,
  playerZ: number,
  playerHeading: number,
  candidates: HarpoonCandidate[],
  maxRange = HARPOON_MAX_RANGE,
): HarpoonCandidate | null {
  const fwdX = Math.sin(playerHeading);
  const fwdZ = -Math.cos(playerHeading);

  let best: HarpoonCandidate | null = null;
  let bestScore = Infinity;

  for (const c of candidates) {
    if (!c.alive) continue;
    const dx = c.x - playerX;
    const dz = c.z - playerZ;
    const dist = Math.hypot(dx, dz);
    if (dist > maxRange || dist < 0.01) continue;

    const dot = (dx * fwdX + dz * fwdZ) / dist;
    // Favor targets in front/broadside arc; still allow rear targets at a modest penalty
    const arcPenalty = dot >= -0.2 ? (1 - dot) * 14 : 28 + Math.abs(dot) * 10;
    const score = dist + arcPenalty;
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }

  return best;
}

export function stepAbilityState(
  state: AbilityState,
  dt: number,
  isSquall = false,
): AbilityState {
  const step = Math.max(0, dt);
  const harpoonActiveTimer = Math.max(0, state.harpoonActiveTimer - step);
  const harpoonTargetId = harpoonActiveTimer > 0 ? state.harpoonTargetId : null;
  const harpoonCooldown = Math.max(0, state.harpoonCooldown - step);
  const smokeTimer = Math.max(0, state.smokeTimer - step);
  const smokeCooldown = Math.max(0, state.smokeCooldown - step);
  const stormWakeTimer = Math.max(0, state.stormWakeTimer - step);

  let stormRage = state.stormRage;
  if (stormWakeTimer <= 0 && isSquall) {
    stormRage = Math.min(STORM_WAKE_MAX_RAGE, stormRage + 4.5 * step);
  }

  return {
    harpoonTargetId,
    harpoonActiveTimer,
    harpoonCooldown,
    smokeTimer,
    smokeCooldown,
    stormRage,
    stormWakeTimer,
  };
}

export function gainStormRage(state: AbilityState, amount: number): AbilityState {
  if (state.stormWakeTimer > 0 || amount <= 0) return state;
  return {
    ...state,
    stormRage: Math.min(STORM_WAKE_MAX_RAGE, state.stormRage + amount),
  };
}

export function activateSmokeAbility(state: AbilityState): {
  state: AbilityState;
  triggered: boolean;
} {
  if (state.smokeCooldown > 0.05 || state.smokeTimer > 0.05) {
    return { state, triggered: false };
  }
  return {
    triggered: true,
    state: {
      ...state,
      smokeTimer: SMOKE_DURATION_SEC,
      smokeCooldown: SMOKE_COOLDOWN_SEC,
    },
  };
}

export function activateStormWakeAbility(state: AbilityState): {
  state: AbilityState;
  triggered: boolean;
} {
  if (state.stormWakeTimer > 0.05 || state.stormRage < STORM_WAKE_MAX_RAGE) {
    return { state, triggered: false };
  }
  return {
    triggered: true,
    state: {
      ...state,
      stormRage: 0,
      stormWakeTimer: STORM_WAKE_DURATION_SEC,
    },
  };
}

export interface TetherForces {
  playerPullX: number;
  playerPullZ: number;
  enemyPullX: number;
  enemyPullZ: number;
  snapped: boolean;
  dist: number;
}

export function computeHarpoonTetherForces(
  playerX: number,
  playerZ: number,
  enemyX: number,
  enemyZ: number,
  dt: number,
): TetherForces {
  const dx = enemyX - playerX;
  const dz = enemyZ - playerZ;
  const dist = Math.hypot(dx, dz);
  if (dist > HARPOON_SNAP_RANGE || dist < 0.01) {
    return {
      playerPullX: 0,
      playerPullZ: 0,
      enemyPullX: 0,
      enemyPullZ: 0,
      snapped: dist > HARPOON_SNAP_RANGE,
      dist,
    };
  }

  const nx = dx / dist;
  const nz = dz / dist;
  // Gentle tension pull keeping enemy close enough for tight broadside / boarding orbit
  const tension = dist > 20 ? Math.min(1, (dist - 20) / 26) : 0;
  const enemyPull = (2.6 + tension * 4.8) * dt;
  const playerPull = tension * 2.4 * dt;

  return {
    playerPullX: nx * playerPull,
    playerPullZ: nz * playerPull,
    enemyPullX: -nx * enemyPull,
    enemyPullZ: -nz * enemyPull,
    snapped: false,
    dist,
  };
}

export interface HarpoonReelResult {
  playerX: number;
  playerZ: number;
  enemyX: number;
  enemyZ: number;
  midX: number;
  midZ: number;
}

export function computeHarpoonReelPull(
  playerX: number,
  playerZ: number,
  enemyX: number,
  enemyZ: number,
): HarpoonReelResult {
  const dx = enemyX - playerX;
  const dz = enemyZ - playerZ;
  const dist = Math.hypot(dx, dz);
  if (dist <= 7.5 || dist < 0.01) {
    return {
      playerX,
      playerZ,
      enemyX,
      enemyZ,
      midX: (playerX + enemyX) * 0.5,
      midZ: (playerZ + enemyZ) * 0.5,
    };
  }
  const nx = dx / dist;
  const nz = dz / dist;
  const pullTotal = Math.min(dist - 7.0, 12.5);
  const pShift = pullTotal * 0.42;
  const eShift = pullTotal * 0.58;
  const px = playerX + nx * pShift;
  const pz = playerZ + nz * pShift;
  const ex = enemyX - nx * eShift;
  const ez = enemyZ - nz * eShift;
  return {
    playerX: px,
    playerZ: pz,
    enemyX: ex,
    enemyZ: ez,
    midX: (px + ex) * 0.5,
    midZ: (pz + ez) * 0.5,
  };
}
