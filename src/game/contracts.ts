export type ShipCrestId = 'corsair' | 'crimson' | 'ashen' | 'abyssal';

export interface ShipCrestSpec {
  id: ShipCrestId;
  cost: number;
  nameKey: 'crestCorsairName' | 'crestCrimsonName' | 'crestAshenName' | 'crestAbyssalName';
  descKey: 'crestCorsairDesc' | 'crestCrimsonDesc' | 'crestAshenDesc' | 'crestAbyssalDesc';
  sailHex: number;
  sailEmissiveHex: number;
  pennantHex: number;
  lanternHex: number;
  trimHex: number;
  goldBonusPct: number;
  damageMult: number;
  speedMult: number;
  rageGainMult: number;
  burnBonusMult: number;
  armorPierceBonus: number;
  freeUnlockAct?: 2 | 3;
  freeUnlockCampaign?: boolean;
  freeUnlockSecrets?: number;
}

export const SHIP_CREST_IDS: ShipCrestId[] = ['corsair', 'crimson', 'ashen', 'abyssal'];

export const SHIP_CREST_SPECS: Record<ShipCrestId, ShipCrestSpec> = {
  corsair: {
    id: 'corsair',
    cost: 0,
    nameKey: 'crestCorsairName',
    descKey: 'crestCorsairDesc',
    sailHex: 0xffffff,
    sailEmissiveHex: 0x453520,
    pennantHex: 0xf4c97a,
    lanternHex: 0xffcc66,
    trimHex: 0xd9a84e,
    goldBonusPct: 10,
    damageMult: 1.0,
    speedMult: 1.0,
    rageGainMult: 1.0,
    burnBonusMult: 1.0,
    armorPierceBonus: 0,
  },
  crimson: {
    id: 'crimson',
    cost: 120,
    nameKey: 'crestCrimsonName',
    descKey: 'crestCrimsonDesc',
    sailHex: 0xe36252,
    sailEmissiveHex: 0x701e18,
    pennantHex: 0xff5a42,
    lanternHex: 0xff6b42,
    trimHex: 0xe88a4c,
    goldBonusPct: 0,
    damageMult: 1.12,
    speedMult: 1.0,
    rageGainMult: 1.08,
    burnBonusMult: 1.0,
    armorPierceBonus: 0,
    freeUnlockAct: 2,
  },
  ashen: {
    id: 'ashen',
    cost: 180,
    nameKey: 'crestAshenName',
    descKey: 'crestAshenDesc',
    sailHex: 0x86d1e3,
    sailEmissiveHex: 0x164656,
    pennantHex: 0x7be0ff,
    lanternHex: 0x5ce8d8,
    trimHex: 0x9ac6ea,
    goldBonusPct: 0,
    damageMult: 1.0,
    speedMult: 1.1,
    rageGainMult: 1.2,
    burnBonusMult: 1.0,
    armorPierceBonus: 0,
    freeUnlockAct: 3,
  },
  abyssal: {
    id: 'abyssal',
    cost: 240,
    nameKey: 'crestAbyssalName',
    descKey: 'crestAbyssalDesc',
    sailHex: 0x3b4166,
    sailEmissiveHex: 0x4b2f88,
    pennantHex: 0xffe082,
    lanternHex: 0xc77dff,
    trimHex: 0xffd27d,
    goldBonusPct: 8,
    damageMult: 1.08,
    speedMult: 1.0,
    rageGainMult: 1.0,
    burnBonusMult: 1.2,
    armorPierceBonus: 0.2,
    freeUnlockCampaign: true,
    freeUnlockSecrets: 5,
  },
};

export type BlackContractId =
  | 'powderPact'
  | 'stormPact'
  | 'bloodPact'
  | 'cursedHold'
  | 'deadCalm';

export interface BlackContractSpec {
  id: BlackContractId;
  nameKey:
    | 'contractPowderName'
    | 'contractStormName'
    | 'contractBloodName'
    | 'contractCursedName'
    | 'contractCalmName';
  descKey:
    | 'contractPowderDesc'
    | 'contractStormDesc'
    | 'contractBloodDesc'
    | 'contractCursedDesc'
    | 'contractCalmDesc';
  doubloonBonusPct: number;
  scoreBonusPct: number;
  damageMult: number;
  reloadMult: number;
  maxHpMult: number;
  speedMult: number;
  goldDrainPerSec: number;
  enemyReloadMult: number;
  enemyDmgMult: number;
  boardingHealBonus: number;
  ramMult: number;
  rageGainMult: number;
  forceSquall: boolean;
}

export const BLACK_CONTRACT_IDS: BlackContractId[] = [
  'powderPact',
  'stormPact',
  'bloodPact',
  'cursedHold',
  'deadCalm',
];

export const BLACK_CONTRACT_SPECS: Record<BlackContractId, BlackContractSpec> = {
  powderPact: {
    id: 'powderPact',
    nameKey: 'contractPowderName',
    descKey: 'contractPowderDesc',
    doubloonBonusPct: 35,
    scoreBonusPct: 25,
    damageMult: 1.4,
    reloadMult: 0.85,
    maxHpMult: 0.75,
    speedMult: 1,
    goldDrainPerSec: 0,
    enemyReloadMult: 1,
    enemyDmgMult: 1,
    boardingHealBonus: 0,
    ramMult: 1,
    rageGainMult: 1,
    forceSquall: false,
  },
  stormPact: {
    id: 'stormPact',
    nameKey: 'contractStormName',
    descKey: 'contractStormDesc',
    doubloonBonusPct: 45,
    scoreBonusPct: 30,
    damageMult: 1,
    reloadMult: 1,
    maxHpMult: 1,
    speedMult: 1,
    goldDrainPerSec: 0,
    enemyReloadMult: 0.8,
    enemyDmgMult: 1,
    boardingHealBonus: 0,
    ramMult: 1,
    rageGainMult: 1.35,
    forceSquall: true,
  },
  bloodPact: {
    id: 'bloodPact',
    nameKey: 'contractBloodName',
    descKey: 'contractBloodDesc',
    doubloonBonusPct: 40,
    scoreBonusPct: 25,
    damageMult: 1,
    reloadMult: 1,
    maxHpMult: 1,
    speedMult: 1,
    goldDrainPerSec: 0,
    enemyReloadMult: 1,
    enemyDmgMult: 1.25,
    boardingHealBonus: 0.25,
    ramMult: 1.35,
    rageGainMult: 1,
    forceSquall: false,
  },
  cursedHold: {
    id: 'cursedHold',
    nameKey: 'contractCursedName',
    descKey: 'contractCursedDesc',
    doubloonBonusPct: 50,
    scoreBonusPct: 35,
    damageMult: 1.45,
    reloadMult: 0.92,
    maxHpMult: 1,
    speedMult: 1,
    goldDrainPerSec: 0.45,
    enemyReloadMult: 1,
    enemyDmgMult: 1.15,
    boardingHealBonus: 0,
    ramMult: 1,
    rageGainMult: 1,
    forceSquall: false,
  },
  deadCalm: {
    id: 'deadCalm',
    nameKey: 'contractCalmName',
    descKey: 'contractCalmDesc',
    doubloonBonusPct: 55,
    scoreBonusPct: 45,
    damageMult: 2.0,
    reloadMult: 1,
    maxHpMult: 1,
    speedMult: 0.55,
    goldDrainPerSec: 0,
    enemyReloadMult: 1,
    enemyDmgMult: 1,
    boardingHealBonus: 0,
    ramMult: 1.25,
    rageGainMult: 1,
    forceSquall: false,
  },
};

export interface ContractModifiers {
  damageMult: number;
  reloadMult: number;
  maxHpMult: number;
  speedMult: number;
  goldDrainPerSec: number;
  enemyReloadMult: number;
  enemyDmgMult: number;
  boardingHealBonus: number;
  ramMult: number;
  rageGainMult: number;
  forceSquall: boolean;
  doubloonMult: number;
  scoreMult: number;
  doubloonBonusPct: number;
  scoreBonusPct: number;
}

export function computeContractModifiers(
  activeContracts: readonly BlackContractId[] = [],
): ContractModifiers {
  const unique = Array.from(new Set(activeContracts));
  let damageMult = 1;
  let reloadMult = 1;
  let maxHpMult = 1;
  let speedMult = 1;
  let goldDrainPerSec = 0;
  let enemyReloadMult = 1;
  let enemyDmgMult = 1;
  let boardingHealBonus = 0;
  let ramMult = 1;
  let rageGainMult = 1;
  let forceSquall = false;
  let doubloonBonusPct = 0;
  let scoreBonusPct = 0;

  for (const id of unique) {
    const spec = BLACK_CONTRACT_SPECS[id];
    if (!spec) continue;
    damageMult *= spec.damageMult;
    reloadMult *= spec.reloadMult;
    maxHpMult *= spec.maxHpMult;
    speedMult *= spec.speedMult;
    goldDrainPerSec += spec.goldDrainPerSec;
    enemyReloadMult *= spec.enemyReloadMult;
    enemyDmgMult *= spec.enemyDmgMult;
    boardingHealBonus += spec.boardingHealBonus;
    ramMult *= spec.ramMult;
    rageGainMult *= spec.rageGainMult;
    forceSquall = forceSquall || spec.forceSquall;
    doubloonBonusPct += spec.doubloonBonusPct;
    scoreBonusPct += spec.scoreBonusPct;
  }

  return {
    damageMult: Number(damageMult.toFixed(3)),
    reloadMult: Number(reloadMult.toFixed(3)),
    maxHpMult: Number(maxHpMult.toFixed(3)),
    speedMult: Number(speedMult.toFixed(3)),
    goldDrainPerSec: Number(goldDrainPerSec.toFixed(2)),
    enemyReloadMult: Number(enemyReloadMult.toFixed(3)),
    enemyDmgMult: Number(enemyDmgMult.toFixed(3)),
    boardingHealBonus: Number(boardingHealBonus.toFixed(2)),
    ramMult: Number(ramMult.toFixed(3)),
    rageGainMult: Number(rageGainMult.toFixed(3)),
    forceSquall,
    doubloonMult: Number((1 + doubloonBonusPct / 100).toFixed(2)),
    scoreMult: Number((1 + scoreBonusPct / 100).toFixed(2)),
    doubloonBonusPct,
    scoreBonusPct,
  };
}

export function applyContractRunMultiplier(
  baseDoubloons: number,
  baseScore: number,
  activeContracts: readonly BlackContractId[] = [],
): { doubloons: number; score: number } {
  const mods = computeContractModifiers(activeContracts);
  return {
    doubloons: Math.round(Math.max(0, baseDoubloons) * mods.doubloonMult),
    score: Math.round(Math.max(0, baseScore) * mods.scoreMult),
  };
}

export function getBossPhase2Key(
  actId: 1 | 2 | 3,
): 'bossPhase2Act1' | 'bossPhase2Act2' | 'bossPhase2Act3' {
  if (actId === 1) return 'bossPhase2Act1';
  if (actId === 2) return 'bossPhase2Act2';
  return 'bossPhase2Act3';
}

export type CaptainMedalId =
  | 'firstFlagship'
  | 'secretHunter'
  | 'masterBoarder'
  | 'stormBreaker'
  | 'pactCaptain'
  | 'beaconSovereign';

export interface CaptainMedalSpec {
  id: CaptainMedalId;
  titleKey:
    | 'medal1Title'
    | 'medal2Title'
    | 'medal3Title'
    | 'medal4Title'
    | 'medal5Title'
    | 'medal6Title';
  descKey:
    | 'medal1Desc'
    | 'medal2Desc'
    | 'medal3Desc'
    | 'medal4Desc'
    | 'medal5Desc'
    | 'medal6Desc';
}

export const CAPTAIN_MEDAL_IDS: CaptainMedalId[] = [
  'firstFlagship',
  'secretHunter',
  'masterBoarder',
  'stormBreaker',
  'pactCaptain',
  'beaconSovereign',
];

export const CAPTAIN_MEDAL_SPECS: Record<CaptainMedalId, CaptainMedalSpec> = {
  firstFlagship: { id: 'firstFlagship', titleKey: 'medal1Title', descKey: 'medal1Desc' },
  secretHunter: { id: 'secretHunter', titleKey: 'medal2Title', descKey: 'medal2Desc' },
  masterBoarder: { id: 'masterBoarder', titleKey: 'medal3Title', descKey: 'medal3Desc' },
  stormBreaker: { id: 'stormBreaker', titleKey: 'medal4Title', descKey: 'medal4Desc' },
  pactCaptain: { id: 'pactCaptain', titleKey: 'medal5Title', descKey: 'medal5Desc' },
  beaconSovereign: { id: 'beaconSovereign', titleKey: 'medal6Title', descKey: 'medal6Desc' },
};

export interface MedalProgressInput {
  unlockedAct: number;
  campaignCleared: boolean;
  bossesDefeated: number;
  completedSecrets: readonly string[];
  totalBoarded: number;
  endlessBestWave: number;
  contractVictories: number;
}

export function getUnlockedMedals(input: MedalProgressInput): CaptainMedalId[] {
  const result: CaptainMedalId[] = [];
  if (input.bossesDefeated >= 1 || input.unlockedAct >= 2 || input.campaignCleared) {
    result.push('firstFlagship');
  }
  if (input.completedSecrets.length >= 3) {
    result.push('secretHunter');
  }
  if (input.totalBoarded >= 5) {
    result.push('masterBoarder');
  }
  if (input.endlessBestWave >= 5) {
    result.push('stormBreaker');
  }
  if (input.contractVictories >= 1) {
    result.push('pactCaptain');
  }
  if (input.campaignCleared) {
    result.push('beaconSovereign');
  }
  return result;
}
