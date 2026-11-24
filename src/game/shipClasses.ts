export type ShipClassId = 'sloop' | 'frigate' | 'manowar';
export type FigureheadId = 'none' | 'ram' | 'serpent' | 'phoenix';
export type CaptainPerkId =
  | 'ironDiscipline'
  | 'greekFiremaster'
  | 'krakenbane'
  | 'tempestRider'
  | 'corsairGreed';

export type BestiaryId =
  | 'brig'
  | 'fireship'
  | 'mortar'
  | 'healer'
  | 'wraith'
  | 'seafort'
  | 'kraken'
  | 'boss';

export interface ShipClassSpec {
  id: ShipClassId;
  cost: number;
  hpBonus: number;
  damageMult: number;
  speedMult: number;
  turnMult: number;
  surgeCooldownMult: number;
  extraProjectiles: number;
  ramBonusMult: number;
  upgradeCap: number;
  hullScale: number;
}

export const SHIP_CLASS_IDS: ShipClassId[] = ['sloop', 'frigate', 'manowar'];

export const SHIP_CLASS_SPECS: Record<ShipClassId, ShipClassSpec> = {
  sloop: {
    id: 'sloop',
    cost: 0,
    hpBonus: 0,
    damageMult: 1.0,
    speedMult: 1.04,
    turnMult: 1.14,
    surgeCooldownMult: 0.88,
    extraProjectiles: 0,
    ramBonusMult: 1.0,
    upgradeCap: 3,
    hullScale: 1.0,
  },
  frigate: {
    id: 'frigate',
    cost: 260,
    hpBonus: 35,
    damageMult: 1.12,
    speedMult: 1.0,
    turnMult: 0.94,
    surgeCooldownMult: 1.0,
    extraProjectiles: 1,
    ramBonusMult: 1.1,
    upgradeCap: 4,
    hullScale: 1.12,
  },
  manowar: {
    id: 'manowar',
    cost: 480,
    hpBonus: 75,
    damageMult: 1.24,
    speedMult: 0.9,
    turnMult: 0.84,
    surgeCooldownMult: 1.08,
    extraProjectiles: 2,
    ramBonusMult: 1.3,
    upgradeCap: 5,
    hullScale: 1.24,
  },
};

export interface FigureheadSpec {
  id: FigureheadId;
  cost: number;
  ramMult: number;
  burnBonusMult: number;
  hpBonus: number;
  goldBonusPct: number;
}

export const FIGUREHEAD_IDS: FigureheadId[] = ['none', 'ram', 'serpent', 'phoenix'];

export const FIGUREHEAD_SPECS: Record<FigureheadId, FigureheadSpec> = {
  none: {
    id: 'none',
    cost: 0,
    ramMult: 1.0,
    burnBonusMult: 1.0,
    hpBonus: 0,
    goldBonusPct: 0,
  },
  ram: {
    id: 'ram',
    cost: 150,
    ramMult: 1.35,
    burnBonusMult: 1.0,
    hpBonus: 15,
    goldBonusPct: 0,
  },
  serpent: {
    id: 'serpent',
    cost: 210,
    ramMult: 1.1,
    burnBonusMult: 1.0,
    hpBonus: 0,
    goldBonusPct: 18,
  },
  phoenix: {
    id: 'phoenix',
    cost: 260,
    ramMult: 1.15,
    burnBonusMult: 1.45,
    hpBonus: 20,
    goldBonusPct: 10,
  },
};

export interface CaptainPerkSpec {
  id: CaptainPerkId;
  cost: number;
  reloadMult: number;
  burnDurationBonus: number;
  harpoonMonsterMult: number;
  rageGainMult: number;
  doubloonGainMult: number;
}

export const CAPTAIN_PERK_IDS: CaptainPerkId[] = [
  'ironDiscipline',
  'greekFiremaster',
  'krakenbane',
  'tempestRider',
  'corsairGreed',
];

export const CAPTAIN_PERK_SPECS: Record<CaptainPerkId, CaptainPerkSpec> = {
  ironDiscipline: {
    id: 'ironDiscipline',
    cost: 110,
    reloadMult: 0.9,
    burnDurationBonus: 0,
    harpoonMonsterMult: 1.0,
    rageGainMult: 1.0,
    doubloonGainMult: 1.0,
  },
  greekFiremaster: {
    id: 'greekFiremaster',
    cost: 135,
    reloadMult: 1.0,
    burnDurationBonus: 2.5,
    harpoonMonsterMult: 1.0,
    rageGainMult: 1.0,
    doubloonGainMult: 1.0,
  },
  krakenbane: {
    id: 'krakenbane',
    cost: 165,
    reloadMult: 1.0,
    burnDurationBonus: 0,
    harpoonMonsterMult: 1.45,
    rageGainMult: 1.0,
    doubloonGainMult: 1.0,
  },
  tempestRider: {
    id: 'tempestRider',
    cost: 150,
    reloadMult: 1.0,
    burnDurationBonus: 0,
    harpoonMonsterMult: 1.0,
    rageGainMult: 1.35,
    doubloonGainMult: 1.0,
  },
  corsairGreed: {
    id: 'corsairGreed',
    cost: 180,
    reloadMult: 1.0,
    burnDurationBonus: 0,
    harpoonMonsterMult: 1.0,
    rageGainMult: 1.0,
    doubloonGainMult: 1.25,
  },
};

export const BESTIARY_IDS: BestiaryId[] = [
  'brig',
  'fireship',
  'mortar',
  'healer',
  'wraith',
  'seafort',
  'kraken',
  'boss',
];

export function createEmptyBestiary(): Record<BestiaryId, number> {
  return {
    brig: 0,
    fireship: 0,
    mortar: 0,
    healer: 0,
    wraith: 0,
    seafort: 0,
    kraken: 0,
    boss: 0,
  };
}
