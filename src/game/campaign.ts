import {
  DIFFICULTY_SPECS,
  SURGE_COOLDOWN_SEC,
  type DifficultyLevel,
} from './sailingPhysics';
import {
  SECRET_QUEST_SPECS,
  type SecretQuestId,
} from './secrets';
import {
  SHIP_CREST_SPECS,
  applyContractRunMultiplier,
  computeContractModifiers,
  type BlackContractId,
  type ShipCrestId,
} from './contracts';

import {
  BESTIARY_IDS,
  CAPTAIN_PERK_SPECS,
  FIGUREHEAD_SPECS,
  SHIP_CLASS_SPECS,
  createEmptyBestiary,
  type BestiaryId,
  type CaptainPerkId,
  type FigureheadId,
  type ShipClassId,
} from './shipClasses';
import {
  CAPTAIN_LOG_IDS,
  OFFICER_LOYALTY_SPECS,
  type CaptainLogId,
} from './voyageSystems';

export type ActId = 1 | 2 | 3;
export type PlayModeId = 'campaign' | 'endless';
export type UpgradeStat = 'hull' | 'cannons' | 'sails' | 'rigging';
export type OfficerId = 'gunner' | 'bosun' | 'navigator' | 'surgeon';
export type EnemyArchetype =
  | 'brig'
  | 'fireship'
  | 'mortar'
  | 'healer'
  | 'wraith'
  | 'seafort'
  | 'kraken'
  | 'boss';
export type WeatherId = 'calm' | 'tailwind' | 'squall';

export type ShipUpgrades = Record<UpgradeStat, number>;

export const MAX_UPGRADE_LEVEL = 3;
export const MAX_ACTIVE_OFFICERS = 3;

export const UPGRADE_STATS: UpgradeStat[] = ['hull', 'cannons', 'sails', 'rigging'];
export const OFFICER_IDS: OfficerId[] = ['gunner', 'bosun', 'navigator', 'surgeon'];

export interface OfficerSpec {
  id: OfficerId;
  cost: number;
  nameKey:
    | 'officerGunnerName'
    | 'officerBosunName'
    | 'officerNavName'
    | 'officerSurgeonName';
  descKey:
    | 'officerGunnerDesc'
    | 'officerBosunDesc'
    | 'officerNavDesc'
    | 'officerSurgeonDesc';
}

export const OFFICER_SPECS: Record<OfficerId, OfficerSpec> = {
  gunner: {
    id: 'gunner',
    cost: 140,
    nameKey: 'officerGunnerName',
    descKey: 'officerGunnerDesc',
  },
  bosun: {
    id: 'bosun',
    cost: 120,
    nameKey: 'officerBosunName',
    descKey: 'officerBosunDesc',
  },
  navigator: {
    id: 'navigator',
    cost: 130,
    nameKey: 'officerNavName',
    descKey: 'officerNavDesc',
  },
  surgeon: {
    id: 'surgeon',
    cost: 150,
    nameKey: 'officerSurgeonName',
    descKey: 'officerSurgeonDesc',
  },
};

export interface WeatherSpec {
  id: WeatherId;
  labelKey: 'weatherCalm' | 'weatherTailwind' | 'weatherSquall';
  waveMult: number;
  windMult: number;
  stormBoost: number;
}

export const WEATHER_CYCLE: WeatherId[] = ['calm', 'tailwind', 'squall'];

export const WEATHER_SPECS: Record<WeatherId, WeatherSpec> = {
  calm: {
    id: 'calm',
    labelKey: 'weatherCalm',
    waveMult: 0.78,
    windMult: 0.94,
    stormBoost: 0,
  },
  tailwind: {
    id: 'tailwind',
    labelKey: 'weatherTailwind',
    waveMult: 1.0,
    windMult: 1.2,
    stormBoost: 0.15,
  },
  squall: {
    id: 'squall',
    labelKey: 'weatherSquall',
    waveMult: 1.32,
    windMult: 1.12,
    stormBoost: 0.65,
  },
};

export interface CaptainProfile {
  unlockedAct: ActId;
  doubloons: number;
  upgrades: ShipUpgrades;
  hiredOfficers: OfficerId[];
  activeOfficers: OfficerId[];
  ownedCrests: ShipCrestId[];
  equippedCrest: ShipCrestId;
  shipClass: ShipClassId;
  ownedShipClasses: ShipClassId[];
  equippedFigurehead: FigureheadId;
  ownedFigureheads: FigureheadId[];
  unlockedPerks: CaptainPerkId[];
  bestiaryKills: Record<BestiaryId, number>;
  totalMiles: number;
  bestScore: number;
  endlessBestWave: number;
  endlessBestScore: number;
  totalSunk: number;
  totalBoarded: number;
  bossesDefeated: number;
  contractVictories: number;
  bestComboStreak: number;
  campaignCleared: boolean;
  completedSecrets: SecretQuestId[];
  unlockedLogs: CaptainLogId[];
  completedLoyalty: OfficerId[];
}

export interface BiomePalette {
  bgColor: number;
  fogColor: number;
  fogDensity: number;
  seaTint: number;
  zenith: [number, number, number];
  midSky: [number, number, number];
  horizon: [number, number, number];
  sunColor: [number, number, number];
  mistColor: [number, number, number];
  farRidgeColor: number;
  nearRidgeColor: number;
  cloudColor: number;
  mistRingColor: number;
  hemiSky: number;
  hemiGround: number;
  sunLightColor: number;
}

export interface ActSpec {
  id: ActId;
  nameKey: 'act1Name' | 'act2Name' | 'act3Name';
  descKey: 'act1Desc' | 'act2Desc' | 'act3Desc';
  bossKey: 'bossAct1' | 'bossAct2' | 'bossAct3';
  waveHeight: number;
  windSpeed: number;
  windAngle: number;
  wave1CountBonus: number;
  enemyHpMult: number;
  bossHp: number;
  escortCount: number;
  rewardDoubloons: number;
  headlands: Array<{ x: number; z: number; lighthouse: boolean }>;
  whirlpools: Array<[number, number]>;
  barrels: Array<[number, number]>;
  palette: BiomePalette;
}

export const ACT_IDS: ActId[] = [1, 2, 3];

export const ACT_SPECS: Record<ActId, ActSpec> = {
  1: {
    id: 1,
    nameKey: 'act1Name',
    descKey: 'act1Desc',
    bossKey: 'bossAct1',
    waveHeight: 1.05,
    windSpeed: 13.5,
    windAngle: 0.65,
    wave1CountBonus: 0,
    enemyHpMult: 1.0,
    bossHp: 220,
    escortCount: 1,
    rewardDoubloons: 140,
    headlands: [
      { x: 48, z: -96, lighthouse: true },
      { x: -78, z: -64, lighthouse: false },
      { x: 88, z: 52, lighthouse: false },
    ],
    whirlpools: [
      [-48, -14],
      [38, -56],
    ],
    barrels: [
      [-30, -18],
      [26, -40],
      [-16, 26],
      [44, 14],
    ],
    palette: {
      bgColor: 0x101938,
      fogColor: 0x1d2b57,
      fogDensity: 0.0032,
      seaTint: 0x9cbcf2,
      zenith: [0.055, 0.08, 0.21],
      midSky: [0.16, 0.18, 0.40],
      horizon: [0.46, 0.25, 0.34],
      sunColor: [1.0, 0.50, 0.20],
      mistColor: [0.22, 0.26, 0.46],
      farRidgeColor: 0x262c59,
      nearRidgeColor: 0x161f42,
      cloudColor: 0x3b4175,
      mistRingColor: 0x283666,
      hemiSky: 0x9bb5ff,
      hemiGround: 0x2b3e6e,
      sunLightColor: 0xffc680,
    },
  },
  2: {
    id: 2,
    nameKey: 'act2Name',
    descKey: 'act2Desc',
    bossKey: 'bossAct2',
    waveHeight: 1.34,
    windSpeed: 15.2,
    windAngle: -0.9,
    wave1CountBonus: 1,
    enemyHpMult: 1.24,
    bossHp: 300,
    escortCount: 1,
    rewardDoubloons: 220,
    headlands: [
      { x: -58, z: -88, lighthouse: true },
      { x: 66, z: -56, lighthouse: false },
      { x: -64, z: 54, lighthouse: false },
      { x: 74, z: 48, lighthouse: false },
    ],
    whirlpools: [
      [-36, 22],
      [48, -32],
    ],
    barrels: [
      [-26, -24],
      [28, -28],
      [-44, -6],
      [40, 22],
      [0, -56],
      [-18, 44],
    ],
    palette: {
      bgColor: 0x240f17,
      fogColor: 0x381922,
      fogDensity: 0.0034,
      seaTint: 0xc9968a,
      zenith: [0.095, 0.032, 0.072],
      midSky: [0.27, 0.09, 0.12],
      horizon: [0.68, 0.29, 0.16],
      sunColor: [1.0, 0.48, 0.16],
      mistColor: [0.34, 0.16, 0.15],
      farRidgeColor: 0x452028,
      nearRidgeColor: 0x29131a,
      cloudColor: 0x632928,
      mistRingColor: 0x482224,
      hemiSky: 0xeba088,
      hemiGround: 0x3d1c24,
      sunLightColor: 0xffa466,
    },
  },
  3: {
    id: 3,
    nameKey: 'act3Name',
    descKey: 'act3Desc',
    bossKey: 'bossAct3',
    waveHeight: 1.72,
    windSpeed: 17.0,
    windAngle: 1.25,
    wave1CountBonus: 1,
    enemyHpMult: 1.48,
    bossHp: 390,
    escortCount: 2,
    rewardDoubloons: 350,
    headlands: [
      { x: 0, z: -102, lighthouse: true },
      { x: -76, z: -48, lighthouse: false },
      { x: 78, z: -44, lighthouse: false },
      { x: -62, z: 68, lighthouse: false },
    ],
    whirlpools: [
      [-44, -18],
      [44, -18],
      [0, 38],
    ],
    barrels: [
      [-32, -36],
      [32, -36],
      [-20, 14],
      [24, 18],
      [0, -64],
    ],
    palette: {
      bgColor: 0x0d1730,
      fogColor: 0x16284a,
      fogDensity: 0.0036,
      seaTint: 0x8ab4eb,
      zenith: [0.04, 0.07, 0.16],
      midSky: [0.11, 0.19, 0.35],
      horizon: [0.26, 0.39, 0.52],
      sunColor: [0.74, 0.90, 1.0],
      mistColor: [0.15, 0.25, 0.40],
      farRidgeColor: 0x1e325c,
      nearRidgeColor: 0x13203d,
      cloudColor: 0x2c4373,
      mistRingColor: 0x1d3459,
      hemiSky: 0x9bc8ff,
      hemiGround: 0x1e335c,
      sunLightColor: 0xc2e2ff,
    },
  },
};

export interface PlayerComputedStats {
  maxHp: number;
  damageMult: number;
  reloadTime: number;
  speedMult: number;
  turnMult: number;
  surgeCooldown: number;
  boardingHealRatio: number;
  extraProjectiles: number;
  ramBonusMult: number;
  lootMagnetRadius: number;
  healCrateMult: number;
  crestThresholdOffset: number;
  headwindBoost: number;
  burnDamageMult: number;
  burnDurationBonus: number;
  harpoonMonsterMult: number;
  rageGainMult: number;
  doubloonGainMult: number;
  hullRegenPerSec: number;
  armorPierceBonus: number;
}

export interface PlayerStatsLoadoutOptions {
  shipClass?: ShipClassId;
  figurehead?: FigureheadId;
  crestId?: ShipCrestId;
  perks?: readonly CaptainPerkId[];
  morale?: number;
}

export function getCrewMoraleReloadMult(morale: number): number {
  const clamped = Math.max(0, Math.min(100, morale));
  if (clamped >= 75) return 0.92;
  if (clamped >= 40) return 1.0;
  return 1.15;
}

export function computePlayerStats(
  difficulty: DifficultyLevel,
  upgrades: ShipUpgrades,
  activeOfficers: OfficerId[] = [],
  activeContracts: readonly BlackContractId[] = [],
  options?: PlayerStatsLoadoutOptions,
): PlayerComputedStats {
  const shipClass: ShipClassId = options?.shipClass ?? 'sloop';
  const figurehead: FigureheadId = options?.figurehead ?? 'none';
  const crestId: ShipCrestId = options?.crestId ?? 'corsair';
  const perks = options?.perks ?? [];
  const morale = options?.morale ?? 75;

  const classSpec = SHIP_CLASS_SPECS[shipClass] ?? SHIP_CLASS_SPECS.sloop;
  const figSpec = FIGUREHEAD_SPECS[figurehead] ?? FIGUREHEAD_SPECS.none;
  const crestSpec = SHIP_CREST_SPECS[crestId] ?? SHIP_CREST_SPECS.corsair;
  const cap = classSpec.upgradeCap;

  const baseHp = DIFFICULTY_SPECS[difficulty].playerHpMax;
  const hullLv = clampLevel(upgrades.hull, cap);
  const cannonLv = clampLevel(upgrades.cannons, cap);
  const sailLv = clampLevel(upgrades.sails, cap);
  const rigLv = clampLevel(upgrades.rigging, cap);

  const hasGunner = activeOfficers.includes('gunner');
  const hasBosun = activeOfficers.includes('bosun');
  const hasNav = activeOfficers.includes('navigator');
  const hasSurgeon = activeOfficers.includes('surgeon');
  const mods = computeContractModifiers(activeContracts);

  let perkReloadMult = 1.0;
  let burnDurationBonus = 0;
  let harpoonMonsterMult = 1.0;
  let perkRageGainMult = 1.0;
  let perkDoubloonGainMult = 1.0;
  for (const perkId of perks) {
    const p = CAPTAIN_PERK_SPECS[perkId];
    if (!p) continue;
    perkReloadMult *= p.reloadMult;
    burnDurationBonus += p.burnDurationBonus;
    harpoonMonsterMult *= p.harpoonMonsterMult;
    perkRageGainMult *= p.rageGainMult;
    perkDoubloonGainMult *= p.doubloonGainMult;
  }

  const moraleReloadMult = options?.morale !== undefined ? getCrewMoraleReloadMult(morale) : 1.0;
  const bosunReloadMult = hasBosun ? 0.92 : 1.0;

  return {
    maxHp: Math.max(
      40,
      Math.round((baseHp + hullLv * 25 + classSpec.hpBonus + figSpec.hpBonus) * mods.maxHpMult),
    ),
    damageMult: Number(
      ((1 + cannonLv * 0.18) * classSpec.damageMult * mods.damageMult * crestSpec.damageMult).toFixed(2),
    ),
    reloadTime: Number(
      Math.max(
        0.72,
        (2.0 - cannonLv * 0.18) * mods.reloadMult * perkReloadMult * moraleReloadMult * bosunReloadMult,
      ).toFixed(2),
    ),
    speedMult: Number(
      ((1 + sailLv * 0.12) * classSpec.speedMult * mods.speedMult * crestSpec.speedMult).toFixed(2),
    ),
    turnMult: Number(((1 + sailLv * 0.15) * classSpec.turnMult).toFixed(2)),
    surgeCooldown: Number(
      Math.max(1.3, (SURGE_COOLDOWN_SEC - rigLv * 0.5) * classSpec.surgeCooldownMult).toFixed(2),
    ),
    boardingHealRatio: Number((0.25 + rigLv * 0.08 + mods.boardingHealBonus).toFixed(2)),
    extraProjectiles: (hasGunner ? 1 : 0) + classSpec.extraProjectiles,
    ramBonusMult: Number(
      ((hasGunner ? 1.15 : 1.0) * classSpec.ramBonusMult * figSpec.ramMult * mods.ramMult).toFixed(2),
    ),
    lootMagnetRadius: hasBosun ? 16 : 0,
    healCrateMult: hasBosun ? 1.25 : 1.0,
    crestThresholdOffset: hasNav ? -0.08 : 0,
    headwindBoost: hasNav ? 0.22 : 0,
    burnDamageMult: Number((figSpec.burnBonusMult * crestSpec.burnBonusMult).toFixed(2)),
    burnDurationBonus: Number(burnDurationBonus.toFixed(2)),
    harpoonMonsterMult: Number(harpoonMonsterMult.toFixed(2)),
    rageGainMult: Number((mods.rageGainMult * perkRageGainMult * crestSpec.rageGainMult).toFixed(2)),
    doubloonGainMult: Number(
      ((1 + (figSpec.goldBonusPct + crestSpec.goldBonusPct) / 100) * perkDoubloonGainMult).toFixed(2),
    ),
    hullRegenPerSec: hasSurgeon ? 1.6 : 0,
    armorPierceBonus: Number(crestSpec.armorPierceBonus.toFixed(2)),
  };
}

export interface ShipyardStatsBreakdown {
  current: PlayerComputedStats;
  next: Record<UpgradeStat, PlayerComputedStats | null>;
  upgradeCap: number;
}

export function getShipyardStatsBreakdown(
  profile: CaptainProfile,
  difficulty: DifficultyLevel,
  activeContracts: readonly BlackContractId[] = [],
): ShipyardStatsBreakdown {
  const cap = SHIP_CLASS_SPECS[profile.shipClass]?.upgradeCap ?? MAX_UPGRADE_LEVEL;
  const opts: PlayerStatsLoadoutOptions = {
    shipClass: profile.shipClass,
    figurehead: profile.equippedFigurehead,
    crestId: profile.equippedCrest,
    perks: profile.unlockedPerks,
  };
  const current = computePlayerStats(
    difficulty,
    profile.upgrades,
    profile.activeOfficers,
    activeContracts,
    opts,
  );
  const next = {} as Record<UpgradeStat, PlayerComputedStats | null>;
  for (const stat of UPGRADE_STATS) {
    const lv = clampLevel(profile.upgrades[stat], cap);
    if (lv >= cap) {
      next[stat] = null;
    } else {
      next[stat] = computePlayerStats(
        difficulty,
        { ...profile.upgrades, [stat]: lv + 1 },
        profile.activeOfficers,
        activeContracts,
        opts,
      );
    }
  }
  return { current, next, upgradeCap: cap };
}

export function pickWaveArchetypes(
  actId: ActId,
  waveNum: number,
  count: number,
  playMode: PlayModeId,
): Exclude<EnemyArchetype, 'boss'>[] {
  const result: Exclude<EnemyArchetype, 'boss'>[] = [];
  for (let i = 0; i < count; i += 1) {
    if (playMode === 'endless') {
      if (waveNum >= 2 && i % 4 === 1) result.push('fireship');
      else if (waveNum >= 2 && i % 4 === 2) result.push('mortar');
      else if (waveNum >= 3 && i % 4 === 3) result.push('healer');
      else if (waveNum >= 4 && i === count - 1 && count >= 4) result.push('wraith');
      else result.push('brig');
      continue;
    }

    if (actId === 1) {
      if (waveNum === 1 && i === count - 1 && count >= 3) {
        result.push('fireship');
      } else {
        result.push('brig');
      }
    } else if (actId === 2) {
      if (waveNum >= 2 && i === count - 1 && count >= 4) result.push('wraith');
      else if (i % 3 === 1) result.push('fireship');
      else if (i % 3 === 2) result.push('mortar');
      else result.push('brig');
    } else {
      if (i === count - 1 && count >= 4) result.push('wraith');
      else if (i % 4 === 1) result.push('fireship');
      else if (i % 4 === 2) result.push('mortar');
      else if (i % 4 === 3) result.push('healer');
      else result.push('brig');
    }
  }
  return result;
}

export function clampLevel(val: number, maxCap = MAX_UPGRADE_LEVEL): number {
  if (!Number.isFinite(val)) return 0;
  return Math.max(0, Math.min(maxCap, Math.floor(val)));
}

export function getUpgradeCost(
  stat: UpgradeStat,
  currentLevel: number,
  maxCap = MAX_UPGRADE_LEVEL,
): number | null {
  const lv = clampLevel(currentLevel, maxCap);
  if (lv >= maxCap) return null;
  const baseCost: Record<UpgradeStat, number> = {
    hull: 80,
    cannons: 100,
    sails: 90,
    rigging: 85,
  };
  return Math.round(baseCost[stat] * (1 + lv * 0.75));
}

export function getTotalUpgradeLevel(upgrades: ShipUpgrades, maxCap = 5): number {
  return (
    clampLevel(upgrades.hull, maxCap) +
    clampLevel(upgrades.cannons, maxCap) +
    clampLevel(upgrades.sails, maxCap) +
    clampLevel(upgrades.rigging, maxCap)
  );
}

export function createDefaultProfile(): CaptainProfile {
  return {
    unlockedAct: 1,
    doubloons: 0,
    upgrades: {
      hull: 0,
      cannons: 0,
      sails: 0,
      rigging: 0,
    },
    hiredOfficers: [],
    activeOfficers: [],
    ownedCrests: ['corsair'],
    equippedCrest: 'corsair',
    shipClass: 'sloop',
    ownedShipClasses: ['sloop'],
    equippedFigurehead: 'none',
    ownedFigureheads: ['none'],
    unlockedPerks: [],
    bestiaryKills: createEmptyBestiary(),
    totalMiles: 0,
    bestScore: 0,
    endlessBestWave: 0,
    endlessBestScore: 0,
    totalSunk: 0,
    totalBoarded: 0,
    bossesDefeated: 0,
    contractVictories: 0,
    bestComboStreak: 0,
    campaignCleared: false,
    completedSecrets: [],
    unlockedLogs: ['logFirstSail'],
    completedLoyalty: [],
  };
}

export function purchaseUpgrade(
  profile: CaptainProfile,
  stat: UpgradeStat,
): { profile: CaptainProfile; purchased: boolean } {
  const maxCap = SHIP_CLASS_SPECS[profile.shipClass]?.upgradeCap ?? MAX_UPGRADE_LEVEL;
  const currentLv = clampLevel(profile.upgrades[stat], maxCap);
  const cost = getUpgradeCost(stat, currentLv, maxCap);
  if (cost === null || profile.doubloons < cost) {
    return { profile, purchased: false };
  }
  return {
    purchased: true,
    profile: {
      ...profile,
      doubloons: profile.doubloons - cost,
      upgrades: {
        ...profile.upgrades,
        [stat]: currentLv + 1,
      },
    },
  };
}

export function unlockOrEquipShipClass(
  profile: CaptainProfile,
  shipClassId: ShipClassId,
): {
  profile: CaptainProfile;
  changed: boolean;
  action: 'unlocked' | 'equipped' | 'denied';
} {
  const owned = profile.ownedShipClasses.includes(shipClassId);
  if (owned) {
    if (profile.shipClass === shipClassId) {
      return { profile, changed: false, action: 'equipped' };
    }
    return {
      changed: true,
      action: 'equipped',
      profile: { ...profile, shipClass: shipClassId },
    };
  }
  const cost = SHIP_CLASS_SPECS[shipClassId].cost;
  if (profile.doubloons < cost) {
    return { profile, changed: false, action: 'denied' };
  }
  return {
    changed: true,
    action: 'unlocked',
    profile: {
      ...profile,
      doubloons: profile.doubloons - cost,
      ownedShipClasses: [...profile.ownedShipClasses, shipClassId],
      shipClass: shipClassId,
    },
  };
}

export function unlockOrEquipFigurehead(
  profile: CaptainProfile,
  figureheadId: FigureheadId,
): {
  profile: CaptainProfile;
  changed: boolean;
  action: 'unlocked' | 'equipped' | 'denied';
} {
  const owned = profile.ownedFigureheads.includes(figureheadId);
  if (owned) {
    if (profile.equippedFigurehead === figureheadId) {
      return { profile, changed: false, action: 'equipped' };
    }
    return {
      changed: true,
      action: 'equipped',
      profile: { ...profile, equippedFigurehead: figureheadId },
    };
  }
  const cost = FIGUREHEAD_SPECS[figureheadId].cost;
  if (profile.doubloons < cost) {
    return { profile, changed: false, action: 'denied' };
  }
  return {
    changed: true,
    action: 'unlocked',
    profile: {
      ...profile,
      doubloons: profile.doubloons - cost,
      ownedFigureheads: [...profile.ownedFigureheads, figureheadId],
      equippedFigurehead: figureheadId,
    },
  };
}

export function unlockCaptainPerk(
  profile: CaptainProfile,
  perkId: CaptainPerkId,
): {
  profile: CaptainProfile;
  changed: boolean;
  action: 'unlocked' | 'owned' | 'denied';
} {
  if (profile.unlockedPerks.includes(perkId)) {
    return { profile, changed: false, action: 'owned' };
  }
  const cost = CAPTAIN_PERK_SPECS[perkId].cost;
  if (profile.doubloons < cost) {
    return { profile, changed: false, action: 'denied' };
  }
  return {
    changed: true,
    action: 'unlocked',
    profile: {
      ...profile,
      doubloons: profile.doubloons - cost,
      unlockedPerks: [...profile.unlockedPerks, perkId],
    },
  };
}

export function hireOrToggleOfficer(
  profile: CaptainProfile,
  officerId: OfficerId,
): {
  profile: CaptainProfile;
  changed: boolean;
  action: 'hired' | 'equipped' | 'unequipped' | 'denied';
} {
  const isHired = profile.hiredOfficers.includes(officerId);
  if (!isHired) {
    const cost = OFFICER_SPECS[officerId].cost;
    if (profile.doubloons < cost) {
      return { profile, changed: false, action: 'denied' };
    }
    const nextHired = [...profile.hiredOfficers, officerId];
    const nextActive =
      profile.activeOfficers.length < MAX_ACTIVE_OFFICERS
        ? [...profile.activeOfficers, officerId]
        : profile.activeOfficers;
    return {
      changed: true,
      action: 'hired',
      profile: {
        ...profile,
        doubloons: profile.doubloons - cost,
        hiredOfficers: nextHired,
        activeOfficers: nextActive,
      },
    };
  }

  const isActive = profile.activeOfficers.includes(officerId);
  if (isActive) {
    return {
      changed: true,
      action: 'unequipped',
      profile: {
        ...profile,
        activeOfficers: profile.activeOfficers.filter((id) => id !== officerId),
      },
    };
  }

  // Equipping a hired officer: if full (2), replace the oldest slot cleanly
  const trimmed =
    profile.activeOfficers.length >= MAX_ACTIVE_OFFICERS
      ? profile.activeOfficers.slice(1)
      : profile.activeOfficers;

  return {
    changed: true,
    action: 'equipped',
    profile: {
      ...profile,
      activeOfficers: [...trimmed, officerId],
    },
  };
}

export function syncMilestoneCrests(profile: CaptainProfile): CaptainProfile {
  const owned = new Set<ShipCrestId>(profile.ownedCrests ?? ['corsair']);
  owned.add('corsair');
  if (profile.unlockedAct >= 2 || profile.campaignCleared) owned.add('crimson');
  if (profile.unlockedAct >= 3 || profile.campaignCleared) owned.add('ashen');
  if (profile.campaignCleared || profile.completedSecrets.length >= 5) owned.add('abyssal');
  const ownedCrests = Array.from(owned);

  const loyalty = new Set<OfficerId>(profile.completedLoyalty ?? []);
  for (const officerId of OFFICER_IDS) {
    if (!profile.hiredOfficers.includes(officerId)) continue;
    const spec = OFFICER_LOYALTY_SPECS[officerId];
    const progress =
      spec.targetType === 'sunk'
        ? profile.totalSunk
        : spec.targetType === 'boarded'
          ? profile.totalBoarded
          : spec.targetType === 'miles'
            ? profile.totalMiles
            : profile.completedSecrets.length;
    if (progress >= spec.targetValue) loyalty.add(officerId);
  }
  const completedLoyalty = Array.from(loyalty);

  if (
    ownedCrests.length === profile.ownedCrests?.length &&
    completedLoyalty.length === (profile.completedLoyalty?.length ?? 0)
  ) {
    return profile;
  }
  return { ...profile, ownedCrests, completedLoyalty };
}

export function recordCaptainLog(
  profile: CaptainProfile,
  logId: CaptainLogId,
): { profile: CaptainProfile; newlyUnlocked: boolean } {
  const existing = profile.unlockedLogs ?? ['logFirstSail'];
  if (existing.includes(logId)) return { profile, newlyUnlocked: false };
  return {
    newlyUnlocked: true,
    profile: {
      ...profile,
      unlockedLogs: [...existing, logId],
    },
  };
}

export function unlockOrEquipCrest(
  profile: CaptainProfile,
  crestId: ShipCrestId,
): {
  profile: CaptainProfile;
  changed: boolean;
  action: 'unlocked' | 'equipped' | 'denied';
} {
  const owned = profile.ownedCrests.includes(crestId);
  if (owned) {
    if (profile.equippedCrest === crestId) {
      return { profile, changed: false, action: 'equipped' };
    }
    return {
      changed: true,
      action: 'equipped',
      profile: { ...profile, equippedCrest: crestId },
    };
  }

  const cost = SHIP_CREST_SPECS[crestId].cost;
  if (profile.doubloons < cost) {
    return { profile, changed: false, action: 'denied' };
  }

  return {
    changed: true,
    action: 'unlocked',
    profile: {
      ...profile,
      doubloons: profile.doubloons - cost,
      ownedCrests: [...profile.ownedCrests, crestId],
      equippedCrest: crestId,
    },
  };
}

function mergeBestiaryKills(
  current: Record<BestiaryId, number>,
  additions?: Partial<Record<BestiaryId, number>>,
): Record<BestiaryId, number> {
  const next = { ...createEmptyBestiary(), ...current };
  if (!additions) return next;
  for (const id of BESTIARY_IDS) {
    const val = additions[id];
    if (typeof val === 'number' && val > 0) {
      next[id] = (next[id] ?? 0) + Math.floor(val);
    }
  }
  return next;
}

export function applyActCompletion(
  profile: CaptainProfile,
  actId: ActId,
  score: number,
  sunkInRun: number,
  boardedInRun: number,
  bonusGoldCollected: number,
  runMeta?: {
    activeContracts?: readonly BlackContractId[];
    bossesDefeatedInRun?: number;
    bestComboInRun?: number;
    milesSailed?: number;
    bestiaryKillsInRun?: Partial<Record<BestiaryId, number>>;
  },
): { profile: CaptainProfile; doubloonsEarned: number; finalScore: number } {
  const spec = ACT_SPECS[actId];
  const contracts = runMeta?.activeContracts ?? [];
  const goldMult = computePlayerStats('normal', profile.upgrades, profile.activeOfficers, contracts, {
    shipClass: profile.shipClass,
    figurehead: profile.equippedFigurehead,
    crestId: profile.equippedCrest,
    perks: profile.unlockedPerks,
  }).doubloonGainMult;
  const rawDoubloons = Math.round((spec.rewardDoubloons + bonusGoldCollected) * goldMult);
  const scaled = applyContractRunMultiplier(rawDoubloons, score, contracts);
  const nextAct: ActId =
    actId === 1 ? (Math.max(profile.unlockedAct, 2) as ActId) : 3;

  const nextProfile = syncMilestoneCrests({
    ...profile,
    unlockedAct: Math.max(profile.unlockedAct, nextAct) as ActId,
    doubloons: profile.doubloons + scaled.doubloons,
    bestScore: Math.max(profile.bestScore, scaled.score),
    totalSunk: profile.totalSunk + sunkInRun,
    totalBoarded: profile.totalBoarded + boardedInRun,
    totalMiles: Number((profile.totalMiles + (runMeta?.milesSailed ?? 0)).toFixed(1)),
    bestiaryKills: mergeBestiaryKills(profile.bestiaryKills, runMeta?.bestiaryKillsInRun),
    bossesDefeated: profile.bossesDefeated + (runMeta?.bossesDefeatedInRun ?? 1),
    contractVictories: profile.contractVictories + (contracts.length > 0 ? 1 : 0),
    bestComboStreak: Math.max(profile.bestComboStreak, runMeta?.bestComboInRun ?? 0),
    campaignCleared: profile.campaignCleared || actId === 3,
  });

  return {
    doubloonsEarned: scaled.doubloons,
    finalScore: scaled.score,
    profile: nextProfile,
  };
}

export function applyEndlessResult(
  profile: CaptainProfile,
  waveReached: number,
  score: number,
  sunkInRun: number,
  boardedInRun: number,
  bonusGoldCollected: number,
  runMeta?: {
    activeContracts?: readonly BlackContractId[];
    bossesDefeatedInRun?: number;
    bestComboInRun?: number;
    milesSailed?: number;
    bestiaryKillsInRun?: Partial<Record<BestiaryId, number>>;
  },
): { profile: CaptainProfile; doubloonsEarned: number; finalScore: number } {
  const waveBonus = Math.max(0, waveReached - 1) * 45;
  const contracts = runMeta?.activeContracts ?? [];
  const goldMult = computePlayerStats('normal', profile.upgrades, profile.activeOfficers, contracts, {
    shipClass: profile.shipClass,
    figurehead: profile.equippedFigurehead,
    crestId: profile.equippedCrest,
    perks: profile.unlockedPerks,
  }).doubloonGainMult;
  const rawDoubloons = Math.round((waveBonus + bonusGoldCollected) * goldMult);
  const scaled = applyContractRunMultiplier(rawDoubloons, score, contracts);

  const nextProfile = syncMilestoneCrests({
    ...profile,
    doubloons: profile.doubloons + scaled.doubloons,
    bestScore: Math.max(profile.bestScore, scaled.score),
    endlessBestWave: Math.max(profile.endlessBestWave, waveReached),
    endlessBestScore: Math.max(profile.endlessBestScore, scaled.score),
    totalSunk: profile.totalSunk + sunkInRun,
    totalBoarded: profile.totalBoarded + boardedInRun,
    totalMiles: Number((profile.totalMiles + (runMeta?.milesSailed ?? 0)).toFixed(1)),
    bestiaryKills: mergeBestiaryKills(profile.bestiaryKills, runMeta?.bestiaryKillsInRun),
    bossesDefeated: profile.bossesDefeated + (runMeta?.bossesDefeatedInRun ?? 0),
    contractVictories:
      profile.contractVictories + (contracts.length > 0 && waveReached >= 3 ? 1 : 0),
    bestComboStreak: Math.max(profile.bestComboStreak, runMeta?.bestComboInRun ?? 0),
  });

  return {
    doubloonsEarned: scaled.doubloons,
    finalScore: scaled.score,
    profile: nextProfile,
  };
}

export function applyDefeatProgress(
  profile: CaptainProfile,
  sunkInRun: number,
  boardedInRun: number,
  milesSailed: number,
  bestComboInRun: number,
  bestiaryKillsInRun?: Partial<Record<BestiaryId, number>>,
): CaptainProfile {
  return syncMilestoneCrests({
    ...profile,
    totalSunk: profile.totalSunk + Math.max(0, sunkInRun),
    totalBoarded: profile.totalBoarded + Math.max(0, boardedInRun),
    totalMiles: Number((profile.totalMiles + Math.max(0, milesSailed)).toFixed(1)),
    bestComboStreak: Math.max(profile.bestComboStreak, bestComboInRun),
    bestiaryKills: mergeBestiaryKills(profile.bestiaryKills, bestiaryKillsInRun),
  });
}

export function recordSecretCompletion(
  profile: CaptainProfile,
  secretId: SecretQuestId,
): { profile: CaptainProfile; newlyCompleted: boolean; doubloonsEarned: number } {
  if (profile.completedSecrets.includes(secretId)) {
    return { profile, newlyCompleted: false, doubloonsEarned: 0 };
  }
  const doubloonsEarned = SECRET_QUEST_SPECS[secretId].rewardDoubloons;
  const nextProfile = syncMilestoneCrests({
    ...profile,
    doubloons: profile.doubloons + doubloonsEarned,
    completedSecrets: [...profile.completedSecrets, secretId],
  });
  return {
    newlyCompleted: true,
    doubloonsEarned,
    profile: nextProfile,
  };
}

const STORAGE_KEY = 'black_pennant_captain_profile_v1';

export interface MinimalStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getSafeStorage(storage?: MinimalStorage): MinimalStorage | null {
  if (storage) return storage;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

function isValidOfficerId(v: unknown): v is OfficerId {
  return v === 'gunner' || v === 'bosun' || v === 'navigator' || v === 'surgeon';
}

function isValidCrestId(v: unknown): v is ShipCrestId {
  return v === 'corsair' || v === 'crimson' || v === 'ashen' || v === 'abyssal';
}

function isValidSecretId(v: unknown): v is SecretQuestId {
  return (
    v === 'lighthouse' ||
    v === 'maelstrom' ||
    v === 'shoals' ||
    v === 'beamBell' ||
    v === 'fogHulk' ||
    v === 'thunderChain' ||
    v === 'reefChest' ||
    v === 'shadowStrait' ||
    v === 'stormEye'
  );
}

function isValidShipClassId(v: unknown): v is ShipClassId {
  return v === 'sloop' || v === 'frigate' || v === 'manowar';
}

function isValidFigureheadId(v: unknown): v is FigureheadId {
  return v === 'none' || v === 'ram' || v === 'serpent' || v === 'phoenix';
}

function isValidPerkId(v: unknown): v is CaptainPerkId {
  return (
    v === 'ironDiscipline' ||
    v === 'greekFiremaster' ||
    v === 'krakenbane' ||
    v === 'tempestRider' ||
    v === 'corsairGreed'
  );
}

function isValidLogId(v: unknown): v is CaptainLogId {
  return typeof v === 'string' && CAPTAIN_LOG_IDS.includes(v as CaptainLogId);
}

export function loadCaptainProfile(storage?: MinimalStorage): CaptainProfile {
  const store = getSafeStorage(storage);
  if (!store) return createDefaultProfile();
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return createDefaultProfile();
    const parsed = JSON.parse(raw) as Partial<CaptainProfile>;
    const def = createDefaultProfile();
    const unlockedRaw = parsed.unlockedAct;
    const unlockedAct: ActId =
      unlockedRaw === 3 ? 3 : unlockedRaw === 2 ? 2 : 1;
    const hiredOfficers = Array.isArray(parsed.hiredOfficers)
      ? Array.from(new Set(parsed.hiredOfficers.filter(isValidOfficerId)))
      : [];
    const activeOfficers = Array.isArray(parsed.activeOfficers)
      ? Array.from(
          new Set(
            parsed.activeOfficers.filter((id) => isValidOfficerId(id) && hiredOfficers.includes(id)),
          ),
        ).slice(0, MAX_ACTIVE_OFFICERS)
      : [];
    const ownedCrests = Array.isArray(parsed.ownedCrests)
      ? Array.from(new Set<ShipCrestId>(['corsair', ...parsed.ownedCrests.filter(isValidCrestId)]))
      : ['corsair' as ShipCrestId];
    const equippedCrest =
      isValidCrestId(parsed.equippedCrest) && ownedCrests.includes(parsed.equippedCrest)
        ? parsed.equippedCrest
        : 'corsair';
    const ownedShipClasses = Array.isArray(parsed.ownedShipClasses)
      ? Array.from(new Set<ShipClassId>(['sloop', ...parsed.ownedShipClasses.filter(isValidShipClassId)]))
      : ['sloop' as ShipClassId];
    const shipClass =
      isValidShipClassId(parsed.shipClass) && ownedShipClasses.includes(parsed.shipClass)
        ? parsed.shipClass
        : 'sloop';
    const maxCap = SHIP_CLASS_SPECS[shipClass]?.upgradeCap ?? MAX_UPGRADE_LEVEL;
    const ownedFigureheads = Array.isArray(parsed.ownedFigureheads)
      ? Array.from(new Set<FigureheadId>(['none', ...parsed.ownedFigureheads.filter(isValidFigureheadId)]))
      : ['none' as FigureheadId];
    const equippedFigurehead =
      isValidFigureheadId(parsed.equippedFigurehead) &&
      ownedFigureheads.includes(parsed.equippedFigurehead)
        ? parsed.equippedFigurehead
        : 'none';
    const unlockedPerks = Array.isArray(parsed.unlockedPerks)
      ? Array.from(new Set(parsed.unlockedPerks.filter(isValidPerkId)))
      : [];
    const bestiaryKills = createEmptyBestiary();
    if (parsed.bestiaryKills && typeof parsed.bestiaryKills === 'object') {
      for (const bId of BESTIARY_IDS) {
        const val = (parsed.bestiaryKills as Record<string, unknown>)[bId];
        if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
          bestiaryKills[bId] = Math.floor(val);
        }
      }
    }

    return syncMilestoneCrests({
      unlockedAct,
      doubloons:
        typeof parsed.doubloons === 'number' && parsed.doubloons >= 0
          ? Math.floor(parsed.doubloons)
          : 0,
      upgrades: {
        hull: clampLevel(parsed.upgrades?.hull ?? def.upgrades.hull, maxCap),
        cannons: clampLevel(parsed.upgrades?.cannons ?? def.upgrades.cannons, maxCap),
        sails: clampLevel(parsed.upgrades?.sails ?? def.upgrades.sails, maxCap),
        rigging: clampLevel(parsed.upgrades?.rigging ?? def.upgrades.rigging, maxCap),
      },
      hiredOfficers,
      activeOfficers,
      ownedCrests,
      equippedCrest,
      shipClass,
      ownedShipClasses,
      equippedFigurehead,
      ownedFigureheads,
      unlockedPerks,
      bestiaryKills,
      totalMiles:
        typeof parsed.totalMiles === 'number' && parsed.totalMiles >= 0
          ? Number(parsed.totalMiles.toFixed(1))
          : 0,
      bestScore:
        typeof parsed.bestScore === 'number' && parsed.bestScore >= 0
          ? Math.floor(parsed.bestScore)
          : 0,
      endlessBestWave:
        typeof parsed.endlessBestWave === 'number' && parsed.endlessBestWave >= 0
          ? Math.floor(parsed.endlessBestWave)
          : 0,
      endlessBestScore:
        typeof parsed.endlessBestScore === 'number' && parsed.endlessBestScore >= 0
          ? Math.floor(parsed.endlessBestScore)
          : 0,
      totalSunk:
        typeof parsed.totalSunk === 'number' && parsed.totalSunk >= 0
          ? Math.floor(parsed.totalSunk)
          : 0,
      totalBoarded:
        typeof parsed.totalBoarded === 'number' && parsed.totalBoarded >= 0
          ? Math.floor(parsed.totalBoarded)
          : 0,
      bossesDefeated:
        typeof parsed.bossesDefeated === 'number' && parsed.bossesDefeated >= 0
          ? Math.floor(parsed.bossesDefeated)
          : 0,
      contractVictories:
        typeof parsed.contractVictories === 'number' && parsed.contractVictories >= 0
          ? Math.floor(parsed.contractVictories)
          : 0,
      bestComboStreak:
        typeof parsed.bestComboStreak === 'number' && parsed.bestComboStreak >= 0
          ? Math.floor(parsed.bestComboStreak)
          : 0,
      campaignCleared: Boolean(parsed.campaignCleared),
      completedSecrets: Array.isArray(parsed.completedSecrets)
        ? Array.from(new Set(parsed.completedSecrets.filter(isValidSecretId)))
        : [],
      unlockedLogs: Array.isArray(parsed.unlockedLogs)
        ? Array.from(new Set<CaptainLogId>(['logFirstSail', ...parsed.unlockedLogs.filter(isValidLogId)]))
        : ['logFirstSail'],
      completedLoyalty: Array.isArray(parsed.completedLoyalty)
        ? Array.from(new Set(parsed.completedLoyalty.filter(isValidOfficerId)))
        : [],
    });
  } catch {
    return createDefaultProfile();
  }
}

export function saveCaptainProfile(profile: CaptainProfile, storage?: MinimalStorage): void {
  const store = getSafeStorage(storage);
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage restriction errors
  }
}

export function resetCaptainProfile(storage?: MinimalStorage): CaptainProfile {
  const fresh = createDefaultProfile();
  const store = getSafeStorage(storage);
  if (store) {
    try {
      store.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
  return fresh;
}
