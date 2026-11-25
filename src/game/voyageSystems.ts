import type { OfficerId } from './campaign';

export type RunRelicId =
  | 'stormCompass'
  | 'alchemistPowder'
  | 'vampiricTimber'
  | 'thunderRod'
  | 'corsairBounty'
  | 'ironKeel'
  | 'phantomSails'
  | 'cursedLedger';

export interface RunRelicSpec {
  id: RunRelicId;
  accent: 'gold' | 'crimson' | 'azure' | 'emerald' | 'violet';
  headwindSpeedBonus: number;
  headwindDmgBonus: number;
  barrelImmunity: boolean;
  aoeRadiusMult: number;
  healPerKill: number;
  squallChainLightningDmg: number;
  doubloonBonusMult: number;
  collisionReduction: number;
  ramBonusMult: number;
  speedBonusMult: number;
  cooldownMult: number;
  damageBonusMult: number;
  rageGainMult: number;
}

export const RUN_RELIC_IDS: RunRelicId[] = [
  'stormCompass',
  'alchemistPowder',
  'vampiricTimber',
  'thunderRod',
  'corsairBounty',
  'ironKeel',
  'phantomSails',
  'cursedLedger',
];

export const RUN_RELIC_SPECS: Record<RunRelicId, RunRelicSpec> = {
  stormCompass: {
    id: 'stormCompass',
    accent: 'azure',
    headwindSpeedBonus: 0.24,
    headwindDmgBonus: 0.18,
    barrelImmunity: false,
    aoeRadiusMult: 1,
    healPerKill: 0,
    squallChainLightningDmg: 0,
    doubloonBonusMult: 1,
    collisionReduction: 0,
    ramBonusMult: 1,
    speedBonusMult: 1,
    cooldownMult: 1,
    damageBonusMult: 1,
    rageGainMult: 1,
  },
  alchemistPowder: {
    id: 'alchemistPowder',
    accent: 'crimson',
    headwindSpeedBonus: 0,
    headwindDmgBonus: 0,
    barrelImmunity: true,
    aoeRadiusMult: 1.25,
    healPerKill: 0,
    squallChainLightningDmg: 0,
    doubloonBonusMult: 1,
    collisionReduction: 0,
    ramBonusMult: 1,
    speedBonusMult: 1,
    cooldownMult: 1,
    damageBonusMult: 1.08,
    rageGainMult: 1,
  },
  vampiricTimber: {
    id: 'vampiricTimber',
    accent: 'emerald',
    headwindSpeedBonus: 0,
    headwindDmgBonus: 0,
    barrelImmunity: false,
    aoeRadiusMult: 1,
    healPerKill: 12,
    squallChainLightningDmg: 0,
    doubloonBonusMult: 1,
    collisionReduction: 0,
    ramBonusMult: 1,
    speedBonusMult: 1,
    cooldownMult: 1,
    damageBonusMult: 1,
    rageGainMult: 1,
  },
  thunderRod: {
    id: 'thunderRod',
    accent: 'azure',
    headwindSpeedBonus: 0,
    headwindDmgBonus: 0,
    barrelImmunity: false,
    aoeRadiusMult: 1,
    healPerKill: 0,
    squallChainLightningDmg: 30,
    doubloonBonusMult: 1,
    collisionReduction: 0,
    ramBonusMult: 1,
    speedBonusMult: 1,
    cooldownMult: 1,
    damageBonusMult: 1,
    rageGainMult: 1.15,
  },
  corsairBounty: {
    id: 'corsairBounty',
    accent: 'gold',
    headwindSpeedBonus: 0,
    headwindDmgBonus: 0,
    barrelImmunity: false,
    aoeRadiusMult: 1,
    healPerKill: 0,
    squallChainLightningDmg: 0,
    doubloonBonusMult: 1.32,
    collisionReduction: 0,
    ramBonusMult: 1,
    speedBonusMult: 1,
    cooldownMult: 1,
    damageBonusMult: 1,
    rageGainMult: 1,
  },
  ironKeel: {
    id: 'ironKeel',
    accent: 'gold',
    headwindSpeedBonus: 0,
    headwindDmgBonus: 0,
    barrelImmunity: false,
    aoeRadiusMult: 1,
    healPerKill: 0,
    squallChainLightningDmg: 0,
    doubloonBonusMult: 1,
    collisionReduction: 0.25,
    ramBonusMult: 1.35,
    speedBonusMult: 1,
    cooldownMult: 1,
    damageBonusMult: 1,
    rageGainMult: 1,
  },
  phantomSails: {
    id: 'phantomSails',
    accent: 'violet',
    headwindSpeedBonus: 0,
    headwindDmgBonus: 0,
    barrelImmunity: false,
    aoeRadiusMult: 1,
    healPerKill: 0,
    squallChainLightningDmg: 0,
    doubloonBonusMult: 1,
    collisionReduction: 0,
    ramBonusMult: 1,
    speedBonusMult: 1.15,
    cooldownMult: 0.78,
    damageBonusMult: 1,
    rageGainMult: 1,
  },
  cursedLedger: {
    id: 'cursedLedger',
    accent: 'violet',
    headwindSpeedBonus: 0,
    headwindDmgBonus: 0,
    barrelImmunity: false,
    aoeRadiusMult: 1,
    healPerKill: 0,
    squallChainLightningDmg: 0,
    doubloonBonusMult: 1.1,
    collisionReduction: 0,
    ramBonusMult: 1,
    speedBonusMult: 1,
    cooldownMult: 1,
    damageBonusMult: 1.24,
    rageGainMult: 1.2,
  },
};

export interface AggregatedRelicModifiers {
  headwindSpeedBonus: number;
  headwindDmgBonus: number;
  barrelImmunity: boolean;
  aoeRadiusMult: number;
  healPerKill: number;
  squallChainLightningDmg: number;
  doubloonBonusMult: number;
  collisionReduction: number;
  ramBonusMult: number;
  speedBonusMult: number;
  cooldownMult: number;
  damageBonusMult: number;
  rageGainMult: number;
}

export function computeRelicModifiers(relics: readonly RunRelicId[]): AggregatedRelicModifiers {
  const out: AggregatedRelicModifiers = {
    headwindSpeedBonus: 0,
    headwindDmgBonus: 0,
    barrelImmunity: false,
    aoeRadiusMult: 1,
    healPerKill: 0,
    squallChainLightningDmg: 0,
    doubloonBonusMult: 1,
    collisionReduction: 0,
    ramBonusMult: 1,
    speedBonusMult: 1,
    cooldownMult: 1,
    damageBonusMult: 1,
    rageGainMult: 1,
  };
  for (const id of relics) {
    const r = RUN_RELIC_SPECS[id];
    if (!r) continue;
    out.headwindSpeedBonus += r.headwindSpeedBonus;
    out.headwindDmgBonus += r.headwindDmgBonus;
    out.barrelImmunity = out.barrelImmunity || r.barrelImmunity;
    out.aoeRadiusMult *= r.aoeRadiusMult;
    out.healPerKill += r.healPerKill;
    out.squallChainLightningDmg += r.squallChainLightningDmg;
    out.doubloonBonusMult *= r.doubloonBonusMult;
    out.collisionReduction = Math.min(0.65, out.collisionReduction + r.collisionReduction);
    out.ramBonusMult *= r.ramBonusMult;
    out.speedBonusMult *= r.speedBonusMult;
    out.cooldownMult *= r.cooldownMult;
    out.damageBonusMult *= r.damageBonusMult;
    out.rageGainMult *= r.rageGainMult;
  }
  return out;
}

export function pickRandomUnownedRelic(
  owned: readonly RunRelicId[],
  seed = 0.5,
): RunRelicId | null {
  const pool = RUN_RELIC_IDS.filter((id) => !owned.includes(id));
  if (pool.length === 0) return null;
  const idx = Math.min(pool.length - 1, Math.max(0, Math.floor(seed * pool.length)));
  return pool[idx];
}

export type SeaRouteId = 'calmChannel' | 'smugglerReefs' | 'stormTrench' | 'escortConvoy';

export const SEA_ROUTE_IDS: SeaRouteId[] = [
  'calmChannel',
  'smugglerReefs',
  'stormTrench',
  'escortConvoy',
];

export interface SeaRouteSpec {
  id: SeaRouteId;
  accent: 'emerald' | 'gold' | 'crimson' | 'azure';
}

export const SEA_ROUTE_SPECS: Record<SeaRouteId, SeaRouteSpec> = {
  calmChannel: { id: 'calmChannel', accent: 'emerald' },
  smugglerReefs: { id: 'smugglerReefs', accent: 'gold' },
  stormTrench: { id: 'stormTrench', accent: 'crimson' },
  escortConvoy: { id: 'escortConvoy', accent: 'azure' },
};

export function pickRouteChoices(seed = 0.5): SeaRouteId[] {
  const idx = Math.floor(Math.max(0, Math.min(0.999, seed)) * SEA_ROUTE_IDS.length);
  const rotated = [...SEA_ROUTE_IDS.slice(idx), ...SEA_ROUTE_IDS.slice(0, idx)];
  return rotated.slice(0, 3);
}

export type EndlessMutatorId = 'galeForce' | 'glassPowder' | 'goldenTide' | 'lightningSea';

export const ENDLESS_MUTATOR_IDS: EndlessMutatorId[] = [
  'galeForce',
  'glassPowder',
  'goldenTide',
  'lightningSea',
];

export interface EndlessMutatorSpec {
  id: EndlessMutatorId;
  speedMult: number;
  reloadMult: number;
  waveHeightMult: number;
  damageMult: number;
  armorPenalty: number;
  doubloonMult: number;
  enemyHpMult: number;
  rageGainMult: number;
  forceSquall: boolean;
}

export const ENDLESS_MUTATOR_SPECS: Record<EndlessMutatorId, EndlessMutatorSpec> = {
  galeForce: {
    id: 'galeForce',
    speedMult: 1.25,
    reloadMult: 0.85,
    waveHeightMult: 1.22,
    damageMult: 1,
    armorPenalty: 0,
    doubloonMult: 1.15,
    enemyHpMult: 1,
    rageGainMult: 1,
    forceSquall: false,
  },
  glassPowder: {
    id: 'glassPowder',
    speedMult: 1,
    reloadMult: 1,
    waveHeightMult: 1,
    damageMult: 1.4,
    armorPenalty: 0.16,
    doubloonMult: 1.2,
    enemyHpMult: 1,
    rageGainMult: 1,
    forceSquall: false,
  },
  goldenTide: {
    id: 'goldenTide',
    speedMult: 1,
    reloadMult: 1,
    waveHeightMult: 1,
    damageMult: 1,
    armorPenalty: 0,
    doubloonMult: 1.55,
    enemyHpMult: 1.18,
    rageGainMult: 1,
    forceSquall: false,
  },
  lightningSea: {
    id: 'lightningSea',
    speedMult: 1.08,
    reloadMult: 0.92,
    waveHeightMult: 1.15,
    damageMult: 1.12,
    armorPenalty: 0,
    doubloonMult: 1.2,
    enemyHpMult: 1,
    rageGainMult: 1.35,
    forceSquall: true,
  },
};

export function pickEndlessMutators(
  active: readonly EndlessMutatorId[],
  seed = 0.5,
): EndlessMutatorId[] {
  const remaining = ENDLESS_MUTATOR_IDS.filter((id) => !active.includes(id));
  const pool = remaining.length >= 2 ? remaining : ENDLESS_MUTATOR_IDS;
  const i0 = Math.floor(Math.max(0, Math.min(0.999, seed)) * pool.length);
  const i1 = (i0 + 1) % pool.length;
  return [pool[i0], pool[i1]];
}

export function computeEndlessMutatorModifiers(mutators: readonly EndlessMutatorId[]) {
  let speedMult = 1;
  let reloadMult = 1;
  let waveHeightMult = 1;
  let damageMult = 1;
  let armorPenalty = 0;
  let doubloonMult = 1;
  let enemyHpMult = 1;
  let rageGainMult = 1;
  let forceSquall = false;
  for (const id of mutators) {
    const s = ENDLESS_MUTATOR_SPECS[id];
    if (!s) continue;
    speedMult *= s.speedMult;
    reloadMult *= s.reloadMult;
    waveHeightMult *= s.waveHeightMult;
    damageMult *= s.damageMult;
    armorPenalty = Math.min(0.45, armorPenalty + s.armorPenalty);
    doubloonMult *= s.doubloonMult;
    enemyHpMult *= s.enemyHpMult;
    rageGainMult *= s.rageGainMult;
    forceSquall = forceSquall || s.forceSquall;
  }
  return {
    speedMult,
    reloadMult,
    waveHeightMult,
    damageMult,
    armorPenalty,
    doubloonMult,
    enemyHpMult,
    rageGainMult,
    forceSquall,
  };
}

export type BoardingSpoilChoice = 'repair' | 'plunder' | 'powder';

export function resolveBoardingSpoils(
  choice: BoardingSpoilChoice,
  hullHp: number,
  hullMaxHp: number,
  stormRage: number,
  baseDoubloons = 24,
): { nextHullHp: number; doubloonsGain: number; nextStormRage: number; resetCooldowns: boolean } {
  if (choice === 'repair') {
    return {
      nextHullHp: Math.min(hullMaxHp, hullHp + Math.round(hullMaxHp * 0.34)),
      doubloonsGain: Math.round(baseDoubloons * 0.6),
      nextStormRage: stormRage,
      resetCooldowns: false,
    };
  }
  if (choice === 'plunder') {
    return {
      nextHullHp: Math.min(hullMaxHp, hullHp + Math.round(hullMaxHp * 0.12)),
      doubloonsGain: baseDoubloons * 2,
      nextStormRage: stormRage,
      resetCooldowns: false,
    };
  }
  return {
    nextHullHp: Math.min(hullMaxHp, hullHp + Math.round(hullMaxHp * 0.14)),
    doubloonsGain: baseDoubloons,
    nextStormRage: Math.min(100, stormRage + 35),
    resetCooldowns: true,
  };
}

export type CaptainLogId =
  | 'logFirstSail'
  | 'logCrimsonFang'
  | 'logAshenPyre'
  | 'logBlackSovereign'
  | 'logKrakenSlain'
  | 'logBottleTreasure'
  | 'logConvoyEscorted';

export const CAPTAIN_LOG_IDS: CaptainLogId[] = [
  'logFirstSail',
  'logCrimsonFang',
  'logAshenPyre',
  'logBlackSovereign',
  'logKrakenSlain',
  'logBottleTreasure',
  'logConvoyEscorted',
];

export interface OfficerLoyaltySpec {
  officerId: OfficerId;
  targetType: 'sunk' | 'boarded' | 'miles' | 'secrets';
  targetValue: number;
}

export const OFFICER_LOYALTY_SPECS: Record<OfficerId, OfficerLoyaltySpec> = {
  gunner: { officerId: 'gunner', targetType: 'sunk', targetValue: 18 },
  bosun: { officerId: 'bosun', targetType: 'boarded', targetValue: 6 },
  navigator: { officerId: 'navigator', targetType: 'miles', targetValue: 12 },
  surgeon: { officerId: 'surgeon', targetType: 'secrets', targetValue: 3 },
};
