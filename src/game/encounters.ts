export type MerchantOfferId =
  | 'hullPatch'
  | 'powderTemper'
  | 'greekPitch'
  | 'moraleFeast'
  | 'fleetCharm';

export interface RunMerchantBuffs {
  damageMult: number;
  reloadMult: number;
  speedMult: number;
  splashBurnMult: number;
  purchasesCount: number;
}

export interface MerchantOfferSpec {
  id: MerchantOfferId;
  cost: number;
  repeatable: boolean;
}

export const MERCHANT_OFFER_IDS: MerchantOfferId[] = [
  'hullPatch',
  'powderTemper',
  'greekPitch',
  'moraleFeast',
  'fleetCharm',
];

export const MERCHANT_OFFER_SPECS: Record<MerchantOfferId, MerchantOfferSpec> = {
  hullPatch: { id: 'hullPatch', cost: 40, repeatable: true },
  powderTemper: { id: 'powderTemper', cost: 55, repeatable: true },
  greekPitch: { id: 'greekPitch', cost: 45, repeatable: true },
  moraleFeast: { id: 'moraleFeast', cost: 30, repeatable: true },
  fleetCharm: { id: 'fleetCharm', cost: 70, repeatable: false },
};

export function createDefaultRunMerchantBuffs(): RunMerchantBuffs {
  return {
    damageMult: 1.0,
    reloadMult: 1.0,
    speedMult: 1.0,
    splashBurnMult: 1.0,
    purchasesCount: 0,
  };
}

export interface MerchantPurchaseInput {
  offerId: MerchantOfferId;
  spendableDoubloons: number;
  buffs: RunMerchantBuffs;
  hullHp: number;
  hullMaxHp: number;
  morale: number;
  fleetCharmBought?: boolean;
}

export interface MerchantPurchaseResult {
  purchased: boolean;
  cost: number;
  nextBuffs: RunMerchantBuffs;
  nextHullHp: number;
  nextMorale: number;
  fleetCharmBought: boolean;
}

export function purchaseMerchantOffer(input: MerchantPurchaseInput): MerchantPurchaseResult {
  const spec = MERCHANT_OFFER_SPECS[input.offerId];
  const alreadyOwnedCharm = input.offerId === 'fleetCharm' && Boolean(input.fleetCharmBought);

  if (!spec || alreadyOwnedCharm || input.spendableDoubloons < spec.cost) {
    return {
      purchased: false,
      cost: 0,
      nextBuffs: input.buffs,
      nextHullHp: input.hullHp,
      nextMorale: input.morale,
      fleetCharmBought: Boolean(input.fleetCharmBought),
    };
  }

  let nextHullHp = input.hullHp;
  let nextMorale = input.morale;
  const nextBuffs: RunMerchantBuffs = {
    ...input.buffs,
    purchasesCount: input.buffs.purchasesCount + 1,
  };
  let fleetCharmBought = Boolean(input.fleetCharmBought);

  switch (input.offerId) {
    case 'hullPatch':
      nextHullHp = Math.min(input.hullMaxHp, input.hullHp + Math.round(input.hullMaxHp * 0.45));
      break;
    case 'powderTemper':
      nextBuffs.damageMult = Number(Math.min(2.1, nextBuffs.damageMult + 0.18).toFixed(2));
      break;
    case 'greekPitch':
      nextBuffs.splashBurnMult = Number(Math.min(2.2, nextBuffs.splashBurnMult + 0.25).toFixed(2));
      break;
    case 'moraleFeast':
      nextMorale = Math.min(100, input.morale + 25);
      break;
    case 'fleetCharm':
      nextBuffs.speedMult = Number((nextBuffs.speedMult * 1.12).toFixed(2));
      nextBuffs.reloadMult = Number((nextBuffs.reloadMult * 0.8).toFixed(2));
      fleetCharmBought = true;
      break;
  }

  return {
    purchased: true,
    cost: spec.cost,
    nextBuffs,
    nextHullHp,
    nextMorale,
    fleetCharmBought,
  };
}

export type WreckageChoice = 'risk' | 'safe';

export interface WreckageOutcome {
  choice: WreckageChoice;
  doubloonsGain: number;
  healRatio: number;
  moraleDelta: number;
  ambushSpawnCount: number;
  armExtraMines: number;
}

export function resolveWreckageChoice(
  choice: WreckageChoice,
  actId: 1 | 2 | 3,
  ambushSeed = 0.5,
): WreckageOutcome {
  if (choice === 'safe') {
    return {
      choice,
      doubloonsGain: 28 + actId * 8,
      healRatio: 0.12,
      moraleDelta: 8,
      ambushSpawnCount: 0,
      armExtraMines: 0,
    };
  }
  const triggeredAmbush = ambushSeed >= 0.42;
  return {
    choice,
    doubloonsGain: 68 + actId * 20,
    healRatio: 0.25,
    moraleDelta: triggeredAmbush ? -4 : 12,
    ambushSpawnCount: triggeredAmbush ? 1 : 0,
    armExtraMines: triggeredAmbush ? 2 : 1,
  };
}
