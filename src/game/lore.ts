import {
  ACT_IDS,
  OFFICER_IDS,
  type ActId,
  type CaptainProfile,
  type OfficerId,
} from './campaign';
import { SECRET_QUEST_IDS, type SecretQuestId } from './secrets';

export interface LoreSeaSpec {
  actId: ActId;
  nameKey: 'act1Name' | 'act2Name' | 'act3Name';
  bossKey: 'bossAct1' | 'bossAct2' | 'bossAct3';
  loreKey: 'chronicleSea1Lore' | 'chronicleSea2Lore' | 'chronicleSea3Lore';
  accent: 'amber' | 'crimson' | 'azure';
}

export const LORE_SEAS: LoreSeaSpec[] = [
  {
    actId: 1,
    nameKey: 'act1Name',
    bossKey: 'bossAct1',
    loreKey: 'chronicleSea1Lore',
    accent: 'amber',
  },
  {
    actId: 2,
    nameKey: 'act2Name',
    bossKey: 'bossAct2',
    loreKey: 'chronicleSea2Lore',
    accent: 'crimson',
  },
  {
    actId: 3,
    nameKey: 'act3Name',
    bossKey: 'bossAct3',
    loreKey: 'chronicleSea3Lore',
    accent: 'azure',
  },
];

export interface OfficerDossierSpec {
  officerId: OfficerId;
  nameKey: 'officerGunnerName' | 'officerBosunName' | 'officerNavName' | 'officerSurgeonName';
  descKey: 'officerGunnerDesc' | 'officerBosunDesc' | 'officerNavDesc' | 'officerSurgeonDesc';
  loreKey:
    | 'chronicleOfficerVaneLore'
    | 'chronicleOfficerKlaraLore'
    | 'chronicleOfficerSorenLore'
    | 'chronicleOfficerSurgeonLore';
}

export const OFFICER_DOSSIERS: OfficerDossierSpec[] = [
  {
    officerId: 'gunner',
    nameKey: 'officerGunnerName',
    descKey: 'officerGunnerDesc',
    loreKey: 'chronicleOfficerVaneLore',
  },
  {
    officerId: 'bosun',
    nameKey: 'officerBosunName',
    descKey: 'officerBosunDesc',
    loreKey: 'chronicleOfficerKlaraLore',
  },
  {
    officerId: 'navigator',
    nameKey: 'officerNavName',
    descKey: 'officerNavDesc',
    loreKey: 'chronicleOfficerSorenLore',
  },
  {
    officerId: 'surgeon',
    nameKey: 'officerSurgeonName',
    descKey: 'officerSurgeonDesc',
    loreKey: 'chronicleOfficerSurgeonLore',
  },
];

export interface SecretRelicLoreSpec {
  secretId: SecretQuestId;
  titleKey:
    | 'secret1Title'
    | 'secret2Title'
    | 'secret3Title'
    | 'secret4Title'
    | 'secret5Title'
    | 'secret6Title'
    | 'secret7Title'
    | 'secret8Title'
    | 'secret9Title';
  loreKey:
    | 'chronicleSecret1Lore'
    | 'chronicleSecret2Lore'
    | 'chronicleSecret3Lore'
    | 'chronicleSecret4Lore'
    | 'chronicleSecret5Lore'
    | 'chronicleSecret6Lore'
    | 'chronicleSecret7Lore'
    | 'chronicleSecret8Lore'
    | 'chronicleSecret9Lore';
}

export const SECRET_RELIC_LORE: SecretRelicLoreSpec[] = [
  { secretId: 'lighthouse', titleKey: 'secret1Title', loreKey: 'chronicleSecret1Lore' },
  { secretId: 'maelstrom', titleKey: 'secret2Title', loreKey: 'chronicleSecret2Lore' },
  { secretId: 'shoals', titleKey: 'secret3Title', loreKey: 'chronicleSecret3Lore' },
  { secretId: 'beamBell', titleKey: 'secret4Title', loreKey: 'chronicleSecret4Lore' },
  { secretId: 'fogHulk', titleKey: 'secret5Title', loreKey: 'chronicleSecret5Lore' },
  { secretId: 'thunderChain', titleKey: 'secret6Title', loreKey: 'chronicleSecret6Lore' },
  { secretId: 'reefChest', titleKey: 'secret7Title', loreKey: 'chronicleSecret7Lore' },
  { secretId: 'shadowStrait', titleKey: 'secret8Title', loreKey: 'chronicleSecret8Lore' },
  { secretId: 'stormEye', titleKey: 'secret9Title', loreKey: 'chronicleSecret9Lore' },
];

export const TOTAL_LORE_ENTRIES =
  ACT_IDS.length + OFFICER_IDS.length + SECRET_QUEST_IDS.length;

export function isSeaLoreUnlocked(profile: CaptainProfile, actId: ActId): boolean {
  return profile.campaignCleared || actId <= profile.unlockedAct;
}

export function countUnlockedLoreEntries(profile: CaptainProfile): number {
  const seasUnlocked = ACT_IDS.filter((id) => isSeaLoreUnlocked(profile, id)).length;
  const crewUnlocked = OFFICER_IDS.filter((id) => profile.hiredOfficers.includes(id)).length;
  const relicsUnlocked = SECRET_QUEST_IDS.filter((id) =>
    profile.completedSecrets.includes(id),
  ).length;
  return seasUnlocked + crewUnlocked + relicsUnlocked;
}

export function getBossUltimatumKey(
  actId: ActId,
): 'bossUltimatum1' | 'bossUltimatum2' | 'bossUltimatum3' {
  if (actId === 1) return 'bossUltimatum1';
  if (actId === 2) return 'bossUltimatum2';
  return 'bossUltimatum3';
}

export type OfficerBarkEvent = 'combo' | 'lowHull' | 'squall';

export type OfficerBarkKey = 'barkGunnerCombo' | 'barkBosunHull' | 'barkNavSquall';

export interface OfficerBarkSelection {
  officer: OfficerId;
  textKey: OfficerBarkKey;
}

export function pickOfficerBark(
  activeOfficers: readonly OfficerId[],
  event: OfficerBarkEvent,
  nowSec: number,
  lastBarkSec: number,
  cooldownSec = 11,
): OfficerBarkSelection | null {
  if (activeOfficers.length === 0) return null;
  if (nowSec - lastBarkSec < cooldownSec) return null;

  if (event === 'combo' && activeOfficers.includes('gunner')) {
    return { officer: 'gunner', textKey: 'barkGunnerCombo' };
  }
  if (event === 'lowHull' && activeOfficers.includes('bosun')) {
    return { officer: 'bosun', textKey: 'barkBosunHull' };
  }
  if (event === 'squall' && activeOfficers.includes('navigator')) {
    return { officer: 'navigator', textKey: 'barkNavSquall' };
  }
  return null;
}
