export type SailLevel = 0 | 0.5 | 1;

export type AmmoType =
  | 'round'
  | 'chain'
  | 'grape'
  | 'incendiary'
  | 'mortar'
  | 'harpoonBolt'
  | 'cursed';

export interface RogueWaveState {
  active: boolean;
  x: number;
  z: number;
  radius: number;
  amplitude: number;
  dirX: number;
  dirZ: number;
}

export type PointOfSail = 'irons' | 'close' | 'beam' | 'broad' | 'run';

export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'nightmare';

export interface DifficultySpec {
  id: DifficultyLevel;
  playerHpMax: number;
  enemyHpMultiplier: number;
  enemyReloadMultiplier: number;
  enemyDamageMultiplier: number;
  enemyCount: number;
}

export const DIFFICULTY_SPECS: Record<DifficultyLevel, DifficultySpec> = {
  easy: {
    id: 'easy',
    playerHpMax: 140,
    enemyHpMultiplier: 0.78,
    enemyReloadMultiplier: 1.35,
    enemyDamageMultiplier: 0.65,
    enemyCount: 3,
  },
  normal: {
    id: 'normal',
    playerHpMax: 100,
    enemyHpMultiplier: 1.0,
    enemyReloadMultiplier: 1.0,
    enemyDamageMultiplier: 1.0,
    enemyCount: 3,
  },
  hard: {
    id: 'hard',
    playerHpMax: 90,
    enemyHpMultiplier: 1.25,
    enemyReloadMultiplier: 0.8,
    enemyDamageMultiplier: 1.25,
    enemyCount: 4,
  },
  nightmare: {
    id: 'nightmare',
    playerHpMax: 75,
    enemyHpMultiplier: 1.5,
    enemyReloadMultiplier: 0.64,
    enemyDamageMultiplier: 1.55,
    enemyCount: 5,
  },
};

export interface ShipState {
  x: number;
  z: number;
  heading: number;
  speed: number;
  sailLevel: SailLevel;
  rudder: number;
  roll: number;
  pitch: number;
  heave: number;
  surgeY: number;
  surgeVelY: number;
  surgeCooldown: number;
  squashY: number;
  squashVel: number;
}

export interface SeaParams {
  waveHeight: number;
  windAngle: number;
  windSpeed: number;
  turnSpeed: number;
  crestThreshold: number;
}

export interface ShipControls {
  steer: number;
  dt: number;
}

export const DEFAULT_SEA_PARAMS: SeaParams = {
  waveHeight: 1.05,
  windAngle: 0.65,
  windSpeed: 13.5,
  turnSpeed: 1.28,
  crestThreshold: 0.56,
};

export const SURGE_DURATION_SEC = 0.95;
export const SURGE_COOLDOWN_SEC = 3.2;
export const MINE_COOLDOWN_SEC = 5.5;

export function createInitialShipState(): ShipState {
  return {
    x: 0,
    z: 10,
    heading: 0,
    speed: 3.5,
    sailLevel: 0.5,
    rudder: 0,
    roll: 0,
    pitch: 0,
    heave: 0,
    surgeY: 0,
    surgeVelY: 0,
    surgeCooldown: 0,
    squashY: 1,
    squashVel: 0,
  };
}

export function stepSailLevel(current: SailLevel, delta: -1 | 1): SailLevel {
  const levels: SailLevel[] = [0, 0.5, 1];
  const idx = levels.indexOf(current);
  const nextIdx = Math.max(0, Math.min(levels.length - 1, idx + delta));
  return levels[nextIdx];
}

export function normalizeAngle(rad: number): number {
  let a = rad % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function computeWindEfficiency(
  heading: number,
  windAngle: number,
  headwindBoost = 0,
): { efficiency: number; pointOfSail: PointOfSail } {
  const rel = Math.abs(normalizeAngle(heading - windAngle));
  const deg = (rel * 180) / Math.PI;
  if (deg < 28) {
    return { efficiency: Math.min(0.85, 0.14 + headwindBoost), pointOfSail: 'irons' };
  }
  if (deg < 64) {
    return { efficiency: Math.min(1.0, 0.68 + headwindBoost * 0.5), pointOfSail: 'close' };
  }
  if (deg < 118) {
    return { efficiency: 1.08, pointOfSail: 'beam' };
  }
  if (deg < 156) {
    return { efficiency: 1.04, pointOfSail: 'broad' };
  }
  return { efficiency: 0.94, pointOfSail: 'run' };
}

export function sampleRogueWaveOffset(
  x: number,
  z: number,
  rogue?: RogueWaveState | null,
): number {
  if (!rogue || !rogue.active || rogue.radius <= 0.1 || rogue.amplitude <= 0.01) return 0;
  const dx = x - rogue.x;
  const dz = z - rogue.z;
  const distSq = dx * dx + dz * dz;
  const rSq = rogue.radius * rogue.radius;
  if (distSq >= rSq) return 0;
  // Asymmetric rolling wall-of-water ridge aligned perpendicular to travel dir
  const along = dx * rogue.dirX + dz * rogue.dirZ;
  const perp = -dx * rogue.dirZ + dz * rogue.dirX;
  const radialFalloff = Math.pow(1 - distSq / rSq, 1.5);
  const ridgeProfile = Math.exp(-Math.pow(along / (rogue.radius * 0.34), 2) - Math.pow(perp / (rogue.radius * 0.85), 2));
  return rogue.amplitude * Math.max(radialFalloff * 0.35, ridgeProfile);
}

export function sampleWaveHeight(
  x: number,
  z: number,
  time: number,
  waveHeight: number,
  rogue?: RogueWaveState | null,
): number {
  const w1 = Math.sin(x * 0.082 + z * 0.044 + time * 1.38) * 0.56;
  const w2 = Math.cos(x * -0.052 + z * 0.095 + time * 1.02) * 0.32;
  const w3 = Math.sin((x + z) * 0.14 - time * 1.85) * 0.12;
  return (w1 + w2 + w3) * waveHeight + sampleRogueWaveOffset(x, z, rogue);
}

export function computeWaveCrestScore(
  x: number,
  z: number,
  time: number,
  waveHeight: number,
  rogue?: RogueWaveState | null,
): number {
  if (waveHeight <= 0.001) return 0.5;
  const h = sampleWaveHeight(x, z, time, waveHeight, rogue);
  const norm = (h / waveHeight + 1) * 0.5;
  return Math.max(0, Math.min(1, norm));
}

export function triggerWaveSurge(
  ship: ShipState,
  cooldownSec = SURGE_COOLDOWN_SEC,
): { ship: ShipState; triggered: boolean } {
  if (ship.surgeCooldown > 0.01 || ship.surgeY > 0.05) {
    return { ship, triggered: false };
  }
  return {
    triggered: true,
    ship: {
      ...ship,
      surgeVelY: 7.4,
      surgeCooldown: cooldownSec,
      speed: Math.min(ship.speed + 4.2, 24),
      squashY: 1.24,
      squashVel: -1.4,
    },
  };
}

export interface ShipPhysicsModifiers {
  speedMult?: number;
  turnMult?: number;
  headwindBoost?: number;
  rogueWave?: RogueWaveState | null;
}

export function stepShipState(
  ship: ShipState,
  controls: ShipControls,
  sea: SeaParams,
  time: number,
  modifiers?: ShipPhysicsModifiers,
): ShipState {
  const dt = Math.min(0.05, Math.max(0.001, controls.dt));
  const speedMult = modifiers?.speedMult ?? 1;
  const turnMult = modifiers?.turnMult ?? 1;
  const headwindBoost = modifiers?.headwindBoost ?? 0;
  const rogueWave = modifiers?.rogueWave ?? null;
  const rudderTarget = Math.max(-1, Math.min(1, controls.steer));
  const rudder = ship.rudder + (rudderTarget - ship.rudder) * Math.min(1, dt * 8);

  const clubhaulActive = ship.sailLevel === 0 && Math.abs(rudder) > 0.1 && ship.speed > 2.2;
  const clubhaulMult = clubhaulActive ? 1.48 : 1.0;
  const speedFactor = 0.45 + Math.min(1, ship.speed / 12) * 0.55;
  const heading = normalizeAngle(
    ship.heading - rudder * sea.turnSpeed * turnMult * clubhaulMult * speedFactor * dt,
  );

  const { efficiency } = computeWindEfficiency(heading, sea.windAngle, headwindBoost);
  const targetSpeed =
    ship.sailLevel === 0 ? 0 : sea.windSpeed * ship.sailLevel * efficiency * 0.96 * speedMult;
  const accel = targetSpeed > ship.speed ? 2.8 : 1.9;
  const speed = ship.speed + (targetSpeed - ship.speed) * Math.min(1, dt * accel);

  const dirX = Math.sin(heading);
  const dirZ = -Math.cos(heading);
  const x = ship.x + dirX * speed * dt;
  const z = ship.z + dirZ * speed * dt;

  const hCenter = sampleWaveHeight(x, z, time, sea.waveHeight, rogueWave);
  const hBow = sampleWaveHeight(x + dirX * 2.5, z + dirZ * 2.5, time, sea.waveHeight, rogueWave);
  const hStarboard = sampleWaveHeight(x + dirZ * 1.4, z - dirX * 1.4, time, sea.waveHeight, rogueWave);

  const pitchBob = Math.sin(time * 2.15 + x * 0.04) * 0.028;
  const pitchTarget = Math.max(-0.28, Math.min(0.28, (hBow - hCenter) * 0.16 + pitchBob));
  const pitch = ship.pitch + (pitchTarget - ship.pitch) * Math.min(1, dt * 6);

  const windSide = Math.sin(normalizeAngle(sea.windAngle - heading));
  const turnBank = -rudder * Math.min(1, speed / 9) * (clubhaulActive ? 0.25 : 0.18);
  const waveBobRoll = Math.cos(time * 1.65 + z * 0.04) * 0.032;
  const heelTarget =
    windSide * ship.sailLevel * 0.14 + (hStarboard - hCenter) * 0.14 + turnBank + waveBobRoll;
  const roll = ship.roll + (heelTarget - ship.roll) * Math.min(1, dt * 5.2);
  const heaveBob = Math.sin(time * 2.4 + (x + z) * 0.045) * 0.055 * Math.max(0.35, sea.waveHeight);

  let surgeY = ship.surgeY;
  let surgeVelY = ship.surgeVelY;
  let squashY = ship.squashY;
  let squashVel = ship.squashVel;

  if (surgeY > 0 || surgeVelY > 0) {
    surgeVelY -= 16.5 * dt;
    surgeY += surgeVelY * dt;
    if (surgeY <= 0) {
      surgeY = 0;
      surgeVelY = 0;
      squashY = 0.78;
      squashVel = 2.6;
    }
  }

  const squashForce = (1 - squashY) * 44 - squashVel * 8.5;
  squashVel += squashForce * dt;
  squashY = Math.max(0.72, Math.min(1.32, squashY + squashVel * dt));

  const surgeCooldown = Math.max(0, ship.surgeCooldown - dt);

  return {
    ...ship,
    x,
    z,
    heading,
    speed,
    rudder,
    roll,
    pitch,
    heave: hCenter + heaveBob + surgeY,
    surgeY,
    surgeVelY,
    surgeCooldown,
    squashY,
    squashVel,
  };
}

export interface BroadsideSpec {
  ammo: AmmoType;
  projectiles: number;
  damagePerHit: number;
  spreadRad: number;
  speed: number;
  crestBoosted: boolean;
  crestMultiplier: number;
}

export function computeBroadsideShot(
  ammo: AmmoType,
  crestScore: number,
  crestThreshold = DEFAULT_SEA_PARAMS.crestThreshold,
  damageMult = 1,
  extraProjectiles = 0,
): BroadsideSpec {
  const crestBoosted = crestScore >= crestThreshold;
  const crestMultiplier = crestBoosted ? 1.35 : 1.0;
  const totalMult = crestMultiplier * damageMult;

  switch (ammo) {
    case 'chain':
      return {
        ammo,
        projectiles: 3 + extraProjectiles,
        damagePerHit: Math.round(14 * totalMult),
        spreadRad: 0.16,
        speed: 44,
        crestBoosted,
        crestMultiplier,
      };
    case 'grape':
      return {
        ammo,
        projectiles: 7 + extraProjectiles,
        damagePerHit: Math.round(7 * totalMult),
        spreadRad: 0.34,
        speed: 38,
        crestBoosted,
        crestMultiplier,
      };
    case 'incendiary':
      return {
        ammo,
        projectiles: 3 + extraProjectiles,
        damagePerHit: Math.round(12 * totalMult),
        spreadRad: 0.14,
        speed: 44,
        crestBoosted,
        crestMultiplier,
      };
    case 'mortar':
      return {
        ammo,
        projectiles: Math.max(2, Math.round((2 + extraProjectiles * 0.5))),
        damagePerHit: Math.round(28 * totalMult),
        spreadRad: 0.22,
        speed: 31,
        crestBoosted,
        crestMultiplier,
      };
    case 'harpoonBolt':
      return {
        ammo,
        projectiles: 2 + Math.floor(extraProjectiles * 0.5),
        damagePerHit: Math.round(13 * totalMult),
        spreadRad: 0.08,
        speed: 56,
        crestBoosted,
        crestMultiplier,
      };
    case 'cursed':
      return {
        ammo,
        projectiles: 3 + extraProjectiles,
        damagePerHit: Math.round(16 * totalMult),
        spreadRad: 0.12,
        speed: 46,
        crestBoosted,
        crestMultiplier,
      };
    case 'round':
    default:
      return {
        ammo: 'round',
        projectiles: 4 + extraProjectiles,
        damagePerHit: Math.round(18 * totalMult),
        spreadRad: 0.11,
        speed: 48,
        crestBoosted,
        crestMultiplier,
      };
  }
}

export interface ShipPose {
  x: number;
  z: number;
  heading: number;
  speed: number;
  surgeY?: number;
}

export interface ShipCollisionResult {
  ax: number;
  az: number;
  bx: number;
  bz: number;
  nx: number;
  nz: number;
  contactX: number;
  contactZ: number;
  damageToA: number;
  damageToB: number;
  aRamming: boolean;
  bRamming: boolean;
  closingSpeed: number;
}

export interface StaticObstacleCollision {
  x: number;
  z: number;
  nx: number;
  nz: number;
  contactX: number;
  contactZ: number;
  damage: number;
}

export function resolveShipPairCollision(
  a: ShipPose,
  b: ShipPose,
  hullCircleRadius = 2.15,
  hullHalfLength = 2.35,
): ShipCollisionResult | null {
  // High Wave Surge leap clears a low obstacle only if airborne well above deck height
  if ((a.surgeY ?? 0) > 2.35 || (b.surgeY ?? 0) > 2.35) {
    return null;
  }

  const fAx = Math.sin(a.heading);
  const fAz = -Math.cos(a.heading);
  const fBx = Math.sin(b.heading);
  const fBz = -Math.cos(b.heading);

  const offsets = [hullHalfLength, 0, -hullHalfLength];
  const minDist = hullCircleRadius * 2;

  let bestPen = 0;
  let bestNx = 0;
  let bestNz = 0;
  let bestCx = (a.x + b.x) * 0.5;
  let bestCz = (a.z + b.z) * 0.5;

  for (const oa of offsets) {
    const ax = a.x + fAx * oa;
    const az = a.z + fAz * oa;
    for (const ob of offsets) {
      const bx = b.x + fBx * ob;
      const bz = b.z + fBz * ob;
      const dx = bx - ax;
      const dz = bz - az;
      const dist = Math.hypot(dx, dz);
      if (dist < minDist) {
        const pen = minDist - dist;
        if (pen > bestPen) {
          bestPen = pen;
          if (dist > 0.001) {
            bestNx = dx / dist;
            bestNz = dz / dist;
          } else {
            const centerDx = b.x - a.x;
            const centerDz = b.z - a.z;
            const cDist = Math.hypot(centerDx, centerDz);
            bestNx = cDist > 0.001 ? centerDx / cDist : 1;
            bestNz = cDist > 0.001 ? centerDz / cDist : 0;
          }
          bestCx = (ax + bx) * 0.5;
          bestCz = (az + bz) * 0.5;
        }
      }
    }
  }

  if (bestPen <= 0) return null;

  const push = bestPen * 0.5 + 0.06;
  const ax = a.x - bestNx * push;
  const az = a.z - bestNz * push;
  const bx = b.x + bestNx * push;
  const bz = b.z + bestNz * push;

  const vAx = fAx * a.speed;
  const vAz = fAz * a.speed;
  const vBx = fBx * b.speed;
  const vBz = fBz * b.speed;

  const relAlongNormal = (vAx - vBx) * bestNx + (vAz - vBz) * bestNz;
  const closingSpeed = Math.max(0, relAlongNormal);
  const aBowDot = fAx * bestNx + fAz * bestNz;
  const bBowDot = -(fBx * bestNx + fBz * bestNz);

  const aRamming = aBowDot > 0.45 && a.speed > 4.5;
  const bRamming = bBowDot > 0.45 && b.speed > 4.5;

  const impactEnergy = Math.max(4.5, closingSpeed + (a.speed + b.speed) * 0.32);
  const damageToB = Math.round(
    Math.min(38, Math.max(7, impactEnergy * (aRamming ? 2.0 : bRamming ? 0.72 : 1.18))),
  );
  const damageToA = Math.round(
    Math.min(32, Math.max(6, impactEnergy * (bRamming ? 1.85 : aRamming ? 0.62 : 1.15))),
  );

  return {
    ax,
    az,
    bx,
    bz,
    nx: bestNx,
    nz: bestNz,
    contactX: bestCx,
    contactZ: bestCz,
    damageToA,
    damageToB,
    aRamming,
    bRamming,
    closingSpeed,
  };
}

export function resolveStaticObstacleCollision(
  ship: ShipPose,
  obsX: number,
  obsZ: number,
  obsRadius = 11.8,
  hullCircleRadius = 2.0,
  hullHalfLength = 2.2,
): StaticObstacleCollision | null {
  const fX = Math.sin(ship.heading);
  const fZ = -Math.cos(ship.heading);
  const offsets = [hullHalfLength, 0, -hullHalfLength];
  const minDist = obsRadius + hullCircleRadius;

  let bestPen = 0;
  let bestNx = 0;
  let bestNz = 0;
  let bestCx = obsX;
  let bestCz = obsZ;

  for (const off of offsets) {
    const px = ship.x + fX * off;
    const pz = ship.z + fZ * off;
    const dx = px - obsX;
    const dz = pz - obsZ;
    const dist = Math.hypot(dx, dz);
    if (dist < minDist) {
      const pen = minDist - dist;
      if (pen > bestPen) {
        bestPen = pen;
        bestNx = dist > 0.001 ? dx / dist : 0;
        bestNz = dist > 0.001 ? dz / dist : 1;
        bestCx = obsX + bestNx * obsRadius;
        bestCz = obsZ + bestNz * obsRadius;
      }
    }
  }

  if (bestPen <= 0) return null;

  const push = bestPen + 0.12;
  const damage = Math.round(Math.min(24, Math.max(5, ship.speed * 1.15)));

  return {
    x: ship.x + bestNx * push,
    z: ship.z + bestNz * push,
    nx: bestNx,
    nz: bestNz,
    contactX: bestCx,
    contactZ: bestCz,
    damage,
  };
}

export interface AmmoEffectSpec {
  sailSlowDuration: number;
  crewSlowDuration: number;
  burnDuration: number;
  pullForce: number;
  splashRadius: number;
  armorRendDuration: number;
  piercesShield: boolean;
}

export function computeAmmoEffect(ammo: AmmoType): AmmoEffectSpec {
  switch (ammo) {
    case 'chain':
      return {
        sailSlowDuration: 7.0,
        crewSlowDuration: 0,
        burnDuration: 0,
        pullForce: 0,
        splashRadius: 0,
        armorRendDuration: 0,
        piercesShield: false,
      };
    case 'grape':
      return {
        sailSlowDuration: 0,
        crewSlowDuration: 6.5,
        burnDuration: 0,
        pullForce: 0,
        splashRadius: 0,
        armorRendDuration: 0,
        piercesShield: false,
      };
    case 'incendiary':
      return {
        sailSlowDuration: 0,
        crewSlowDuration: 0,
        burnDuration: 5.5,
        pullForce: 0,
        splashRadius: 0,
        armorRendDuration: 0,
        piercesShield: true,
      };
    case 'mortar':
      return {
        sailSlowDuration: 0,
        crewSlowDuration: 0,
        burnDuration: 2.0,
        pullForce: 0,
        splashRadius: 9.5,
        armorRendDuration: 0,
        piercesShield: false,
      };
    case 'harpoonBolt':
      return {
        sailSlowDuration: 5.5,
        crewSlowDuration: 0,
        burnDuration: 0,
        pullForce: 11.5,
        splashRadius: 0,
        armorRendDuration: 0,
        piercesShield: false,
      };
    case 'cursed':
      return {
        sailSlowDuration: 0,
        crewSlowDuration: 6.0,
        burnDuration: 0,
        pullForce: 0,
        splashRadius: 0,
        armorRendDuration: 8.0,
        piercesShield: true,
      };
    case 'round':
    default:
      return {
        sailSlowDuration: 0,
        crewSlowDuration: 0,
        burnDuration: 0,
        pullForce: 0,
        splashRadius: 0,
        armorRendDuration: 0,
        piercesShield: false,
      };
  }
}

export function canBoardEnemy(
  playerX: number,
  playerZ: number,
  enemyX: number,
  enemyZ: number,
  enemyHp: number,
  enemyMaxHp: number,
  enemySailDebuff: number,
  maxDist = 14.5,
): boolean {
  const dist = Math.hypot(enemyX - playerX, enemyZ - playerZ);
  if (dist > maxDist) return false;
  return enemyHp <= enemyMaxHp * 0.58 || enemySailDebuff > 0;
}

export interface WhirlpoolPull {
  fx: number;
  fz: number;
  inCore: boolean;
  strength: number;
}

export function computeWhirlpoolPull(
  shipX: number,
  shipZ: number,
  vortexX: number,
  vortexZ: number,
  outerRadius = 16,
  coreRadius = 4.6,
): WhirlpoolPull | null {
  const dx = vortexX - shipX;
  const dz = vortexZ - shipZ;
  const dist = Math.hypot(dx, dz);
  if (dist >= outerRadius || dist < 0.001) return null;

  const strength = 1 - dist / outerRadius;
  const invD = 1 / dist;
  const rx = dx * invD;
  const rz = dz * invD;
  // Tangential swirl + inward pull
  const tx = -rz;
  const tz = rx;

  return {
    fx: (rx * 3.8 + tx * 6.2) * strength,
    fz: (rz * 3.8 + tz * 6.2) * strength,
    inCore: dist <= coreRadius,
    strength,
  };
}

export function computeExplosionFalloff(
  dist: number,
  blastRadius = 17,
  maxDamage = 48,
): number {
  if (dist >= blastRadius) return 0;
  const factor = Math.max(0.2, 1 - dist / blastRadius);
  return Math.round(maxDamage * factor);
}

export interface BroadsideAlignmentResult {
  inPortArc: boolean;
  inStbdArc: boolean;
  dist: number;
  localRight: number;
  localForward: number;
}

export function computeBroadsideAlignment(
  shipX: number,
  shipZ: number,
  heading: number,
  targetX: number,
  targetZ: number,
  maxRange = 48,
  halfAngleRad = 0.44,
): BroadsideAlignmentResult {
  const dx = targetX - shipX;
  const dz = targetZ - shipZ;
  const dist = Math.hypot(dx, dz);
  const sinH = Math.sin(heading);
  const cosH = Math.cos(heading);
  // Local ship frame: forward = (sinH, -cosH), starboard (+right) = (cosH, sinH)
  const localForward = dx * sinH - dz * cosH;
  const localRight = dx * cosH + dz * sinH;

  if (dist > maxRange || dist < 1.5) {
    return { inPortArc: false, inStbdArc: false, dist, localRight, localForward };
  }

  const inStbdArc =
    localRight > 2.2 && Math.abs(Math.atan2(localForward, localRight)) <= halfAngleRad;
  const inPortArc =
    localRight < -2.2 && Math.abs(Math.atan2(localForward, -localRight)) <= halfAngleRad;

  return { inPortArc, inStbdArc, dist, localRight, localForward };
}

export function computePlungingRamBonus(
  playerSurgeY: number,
  rogueLift = 0,
): number {
  if (playerSurgeY > 1.05 || rogueLift > 1.8) return 1.55;
  if (playerSurgeY > 0.35 || rogueLift > 0.85) return 1.25;
  return 1.0;
}

export function computeRockfallSplash(
  dist: number,
  radius = 18,
  maxDamage = 44,
): number {
  if (dist >= radius) return 0;
  const factor = Math.max(0.28, 1 - dist / radius);
  return Math.round(maxDamage * factor);
}

export function computeRakingShotMultiplier(
  projVx: number,
  projVz: number,
  targetHeading: number,
): number {
  const len = Math.hypot(projVx, projVz);
  if (len < 0.01) return 1.0;
  const nx = projVx / len;
  const nz = projVz / len;
  const fwdX = Math.sin(targetHeading);
  const fwdZ = -Math.cos(targetHeading);
  const alignment = Math.abs(nx * fwdX + nz * fwdZ);
  return alignment >= 0.72 ? 1.55 : 1.0;
}

