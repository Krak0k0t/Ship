import React, { useState } from 'react';
import {
  Anchor,
  Check,
  Coins,
  Compass,
  Crosshair,
  Crown,
  Flag,
  Hammer,
  HeartPulse,
  Play,
  Shield,
  Ship,
  Sparkles,
  Users,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import {
  ACT_SPECS,
  MAX_ACTIVE_OFFICERS,
  OFFICER_IDS,
  OFFICER_SPECS,
  UPGRADE_STATS,
  clampLevel,
  getShipyardStatsBreakdown,
  getUpgradeCost,
  type ActId,
  type CaptainProfile,
  type OfficerId,
  type PlayModeId,
  type UpgradeStat,
} from '../game/campaign';
import {
  SHIP_CREST_IDS,
  SHIP_CREST_SPECS,
  type BlackContractId,
  type ShipCrestId,
} from '../game/contracts';
import type { DifficultyLevel } from '../game/sailingPhysics';
import {
  CAPTAIN_PERK_IDS,
  CAPTAIN_PERK_SPECS,
  FIGUREHEAD_IDS,
  FIGUREHEAD_SPECS,
  SHIP_CLASS_IDS,
  SHIP_CLASS_SPECS,
  type CaptainPerkId,
  type FigureheadId,
  type ShipClassId,
} from '../game/shipClasses';
import { applySpecularVarsToTarget } from '../game/uiEffects';
import { getExtraT } from '../i18n/extraTranslations';
import { TRANSLATIONS, getLanguageMeta, type LanguageCode } from '../i18n/translations';
import { BrassCorners } from './BrassCorners';
import { RollingNumber } from './RollingNumber';

interface HarborModalProps {
  language: LanguageCode;
  profile: CaptainProfile;
  difficulty: DifficultyLevel;
  activeContracts: BlackContractId[];
  selectedAct: ActId;
  selectedMode: PlayModeId;
  onBuyUpgrade: (stat: UpgradeStat) => void;
  onSelectShipClass: (shipClassId: ShipClassId) => void;
  onHireOrToggleOfficer: (officerId: OfficerId) => void;
  onUnlockPerk: (perkId: CaptainPerkId) => void;
  onSelectCrest: (crestId: ShipCrestId) => void;
  onSelectFigurehead: (figureheadId: FigureheadId) => void;
  onSailSelectedAct: () => void;
  onClose: () => void;
}

type HarborTab = 'upgrades' | 'classes' | 'officers' | 'perks' | 'flagship';

export const HarborModal: React.FC<HarborModalProps> = ({
  language,
  profile,
  difficulty,
  activeContracts,
  selectedAct,
  selectedMode,
  onBuyUpgrade,
  onSelectShipClass,
  onHireOrToggleOfficer,
  onUnlockPerk,
  onSelectCrest,
  onSelectFigurehead,
  onSailSelectedAct,
  onClose,
}) => {
  const t = TRANSLATIONS[language];
  const et = getExtraT(language);
  const rtl = getLanguageMeta(language).rtl;
  const [tab, setTab] = useState<HarborTab>('upgrades');

  const breakdown = getShipyardStatsBreakdown(profile, difficulty, activeContracts);
  const upgradeCap = breakdown.upgradeCap;

  const statMeta: Record<
    UpgradeStat,
    { title: string; desc: string; icon: React.ReactNode; getDeltaLabel: () => string | null }
  > = {
    hull: {
      title: t.upgHull,
      desc: t.upgHullDesc,
      icon: <Shield className="h-4 w-4 text-emerald-300" />,
      getDeltaLabel: () => {
        const nxt = breakdown.next.hull;
        if (!nxt) return null;
        return `+${nxt.maxHp - breakdown.current.maxHp} HP`;
      },
    },
    cannons: {
      title: t.upgCannons,
      desc: t.upgCannonsDesc,
      icon: <Crosshair className="h-4 w-4 text-amber-300" />,
      getDeltaLabel: () => {
        const nxt = breakdown.next.cannons;
        if (!nxt) return null;
        const dmgDelta = Math.round((nxt.damageMult - breakdown.current.damageMult) * 100);
        const relDelta = Number((breakdown.current.reloadTime - nxt.reloadTime).toFixed(2));
        return `+${dmgDelta}% / -${relDelta}s`;
      },
    },
    sails: {
      title: t.upgSails,
      desc: t.upgSailsDesc,
      icon: <Wind className="h-4 w-4 text-sky-300" />,
      getDeltaLabel: () => {
        const nxt = breakdown.next.sails;
        if (!nxt) return null;
        const spdDelta = Math.round((nxt.speedMult - breakdown.current.speedMult) * 100);
        return `+${spdDelta}%`;
      },
    },
    rigging: {
      title: t.upgRigging,
      desc: t.upgRiggingDesc,
      icon: <Zap className="h-4 w-4 text-orange-300" />,
      getDeltaLabel: () => {
        const nxt = breakdown.next.rigging;
        if (!nxt) return null;
        const surgeDelta = Number((breakdown.current.surgeCooldown - nxt.surgeCooldown).toFixed(2));
        return `-${surgeDelta}s`;
      },
    },
  };

  const officerIcons: Record<OfficerId, React.ReactNode> = {
    gunner: <Crosshair className="h-4 w-4 text-amber-300" />,
    bosun: <Hammer className="h-4 w-4 text-emerald-300" />,
    navigator: <Compass className="h-4 w-4 text-sky-300" />,
    surgeon: <HeartPulse className="h-4 w-4 text-emerald-300" />,
  };

  const crestPassives: Record<ShipCrestId, string> = {
    corsair: et.crestCorsairPassive,
    crimson: et.crestCrimsonPassive,
    ashen: et.crestAshenPassive,
    abyssal: et.crestAbyssalPassive,
  };

  const classLabel: Record<ShipClassId, { name: string; desc: string }> = {
    sloop: { name: et.classSloopName, desc: et.classSloopDesc },
    frigate: { name: et.classFrigateName, desc: et.classFrigateDesc },
    manowar: { name: et.classManowarName, desc: et.classManowarDesc },
  };

  const figLabel: Record<FigureheadId, { name: string; desc: string }> = {
    none: { name: et.figNoneName, desc: et.figNoneDesc },
    ram: { name: et.figRamName, desc: et.figRamDesc },
    serpent: { name: et.figSerpentName, desc: et.figSerpentDesc },
    phoenix: { name: et.figPhoenixName, desc: et.figPhoenixDesc },
  };

  const perkLabel: Record<CaptainPerkId, { name: string; desc: string }> = {
    ironDiscipline: { name: et.perkIronName, desc: et.perkIronDesc },
    greekFiremaster: { name: et.perkFireName, desc: et.perkFireDesc },
    krakenbane: { name: et.perkKrakenName, desc: et.perkKrakenDesc },
    tempestRider: { name: et.perkTempestName, desc: et.perkTempestDesc },
    corsairGreed: { name: et.perkGreedName, desc: et.perkGreedDesc },
  };

  const actTitle =
    selectedMode === 'endless' ? t.endlessName : t[ACT_SPECS[selectedAct].nameKey];

  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="harbor-modal-title"
      className="pointer-events-auto animate-backdrop-in absolute inset-0 z-40 flex items-center justify-center bg-[#040712]/82 p-4"
    >
      <div
        onPointerMove={(e) => {
          if (e.pointerType !== 'touch') {
            applySpecularVarsToTarget(e.currentTarget, e.clientX, e.clientY);
          }
        }}
        className="landscape-modal-card glass-obsidian-strong specular-glass animate-panel-in relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl p-5 sm:p-7"
      >
        <BrassCorners size={15} />
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#FFD27D]/60 bg-gradient-to-br from-[#232F5C] to-[#0D132B] text-[#FFD27D] glow-amber">
              <Anchor className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="harbor-modal-title"
                className="font-display text-xl font-black tracking-[0.04em] text-[#FFF8EA] sm:text-2xl"
              >
                {t.harborTitle}
              </h2>
              <p className="text-xs text-[#E2D9C8]/85 sm:text-sm">{t.harborSub}</p>
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div
              data-doubloons-wallet="true"
              className="flex items-center gap-2 rounded-xl border border-[#FFD27D]/45 bg-[#090E22]/90 px-3.5 py-2 text-xs font-bold whitespace-nowrap text-[#FFD27D]"
            >
              <Coins className="h-4 w-4 text-[#FFB84D]" />
              <span>{t.doubloonsLabel}:</span>
              <span data-testid="harbor-doubloons">
                <RollingNumber
                  value={profile.doubloons}
                  className="font-mono-num text-sm font-black text-[#FFF8EA]"
                />
              </span>
            </div>

            <button
              type="button"
              aria-label={t.close}
              onClick={onClose}
              className="btn-premium cursor-pointer rounded-xl border border-[#F4C97A]/25 bg-[#0E1532]/90 p-2 text-[#D8D0C2] hover:border-[#FFB84D] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1 rounded-xl border border-[#F4C97A]/20 bg-[#080C1E]/90 p-1">
            <button
              type="button"
              data-testid="tab-upgrades"
              onClick={() => setTab('upgrades')}
              className={`btn-premium flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                tab === 'upgrades'
                  ? 'bg-gradient-to-r from-[#B82D24] to-[#E0792C] text-[#FFF8EC] glow-amber'
                  : 'text-[#D8D0C2] hover:text-white'
              }`}
            >
              <Anchor className="h-3.5 w-3.5" />
              <span>{t.tabUpgrades}</span>
            </button>

            <button
              type="button"
              data-testid="tab-classes"
              onClick={() => setTab('classes')}
              className={`btn-premium flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                tab === 'classes'
                  ? 'bg-gradient-to-r from-[#B82D24] to-[#E0792C] text-[#FFF8EC] glow-amber'
                  : 'text-[#D8D0C2] hover:text-white'
              }`}
            >
              <Ship className="h-3.5 w-3.5" />
              <span>{et.tabClasses}</span>
            </button>

            <button
              type="button"
              data-testid="tab-officers"
              onClick={() => setTab('officers')}
              className={`btn-premium flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                tab === 'officers'
                  ? 'bg-gradient-to-r from-[#B82D24] to-[#E0792C] text-[#FFF8EC] glow-amber'
                  : 'text-[#D8D0C2] hover:text-white'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>{t.tabOfficers}</span>
              <span className="font-mono-num rounded bg-[#070B19]/60 px-1.5 py-0.5 text-[10px] text-[#FFD27D]">
                {profile.activeOfficers.length}/{MAX_ACTIVE_OFFICERS}
              </span>
            </button>

            <button
              type="button"
              data-testid="tab-perks"
              onClick={() => setTab('perks')}
              className={`btn-premium flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                tab === 'perks'
                  ? 'bg-gradient-to-r from-[#B82D24] to-[#E0792C] text-[#FFF8EC] glow-amber'
                  : 'text-[#D8D0C2] hover:text-white'
              }`}
            >
              <Crown className="h-3.5 w-3.5" />
              <span>{et.tabPerks}</span>
              <span className="font-mono-num rounded bg-[#070B19]/60 px-1.5 py-0.5 text-[10px] text-[#FFD27D]">
                {profile.unlockedPerks.length}/{CAPTAIN_PERK_IDS.length}
              </span>
            </button>

            <button
              type="button"
              data-testid="tab-flagship"
              onClick={() => setTab('flagship')}
              className={`btn-premium flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                tab === 'flagship'
                  ? 'bg-gradient-to-r from-[#B82D24] to-[#E0792C] text-[#FFF8EC] glow-amber'
                  : 'text-[#D8D0C2] hover:text-white'
              }`}
            >
              <Flag className="h-3.5 w-3.5" />
              <span>{t.tabFlagship}</span>
            </button>
          </div>

          {tab === 'officers' && (
            <span className="text-[11px] font-semibold text-[#F4C97A]/85">
              {t.maxOfficersHint}
            </span>
          )}
          {tab === 'flagship' && (
            <span className="text-[11px] font-semibold text-[#F4C97A]/85">
              {t.crestUnlockHint}
            </span>
          )}
        </div>

        {/* Live Telemetry Summary Strip */}
        <div
          data-testid="shipyard-telemetry-strip"
          className="mb-4 rounded-xl border border-[#7BE0FF]/25 bg-[#080E24]/88 px-3.5 py-2.5"
        >
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-extrabold tracking-[0.12em] text-[#8CE2FF] uppercase">
            <span>{et.shipyardSummaryTitle}</span>
            <span className="text-[#FFD27D]">{classLabel[profile.shipClass].name}</span>
          </div>
          <div className="grid grid-cols-5 gap-2 text-center">
            <div className="rounded-lg bg-[#0D1634]/85 px-2 py-1">
              <p className="text-[9px] font-bold text-[#B8C4DC] uppercase">{et.statHp}</p>
              <p className="font-mono-num text-xs font-black text-emerald-300">
                {breakdown.current.maxHp}
              </p>
            </div>
            <div className="rounded-lg bg-[#0D1634]/85 px-2 py-1">
              <p className="text-[9px] font-bold text-[#B8C4DC] uppercase">{et.statDmg}</p>
              <p className="font-mono-num text-xs font-black text-amber-300">
                {Math.round(breakdown.current.damageMult * 100)}%
              </p>
            </div>
            <div className="rounded-lg bg-[#0D1634]/85 px-2 py-1">
              <p className="text-[9px] font-bold text-[#B8C4DC] uppercase">{et.statReload}</p>
              <p className="font-mono-num text-xs font-black text-[#FFF7E6]">
                {breakdown.current.reloadTime.toFixed(2)}s
              </p>
            </div>
            <div className="rounded-lg bg-[#0D1634]/85 px-2 py-1">
              <p className="text-[9px] font-bold text-[#B8C4DC] uppercase">{et.statSpeed}</p>
              <p className="font-mono-num text-xs font-black text-sky-300">
                {Math.round(breakdown.current.speedMult * 100)}%
              </p>
            </div>
            <div className="rounded-lg bg-[#0D1634]/85 px-2 py-1">
              <p className="text-[9px] font-bold text-[#B8C4DC] uppercase">{et.statSalvo}</p>
              <p className="font-mono-num text-xs font-black text-[#FFD27D]">
                {3 + breakdown.current.extraProjectiles}
              </p>
            </div>
          </div>
        </div>

        {/* Tab 1: Upgrades */}
        {tab === 'upgrades' && (
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {UPGRADE_STATS.map((stat) => {
              const level = clampLevel(profile.upgrades[stat], upgradeCap);
              const cost = getUpgradeCost(stat, level, upgradeCap);
              const isMax = cost === null;
              const canAfford = cost !== null && profile.doubloons >= cost;
              const meta = statMeta[stat];
              const deltaText = meta.getDeltaLabel();

              return (
                <div
                  key={stat}
                  className="flex flex-col justify-between rounded-xl border border-[#F4C97A]/22 bg-gradient-to-b from-[#11193A]/88 to-[#080D20]/92 p-4"
                >
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {meta.icon}
                        <h3 className="text-sm font-extrabold text-[#FFF7E6]">{meta.title}</h3>
                      </div>
                      <span className="font-mono-num text-[11px] font-bold text-[#F4C97A]">
                        {t.upgTier} {level}/{upgradeCap}
                      </span>
                    </div>
                    <p className="mb-2 text-xs text-[#D7CEBE]/85">{meta.desc}</p>
                    {deltaText && (
                      <p className="mb-3 inline-flex items-center gap-1 rounded-md border border-[#7BE0FF]/30 bg-[#0D1F3F]/85 px-2 py-0.5 text-[10px] font-bold text-[#9CE6FF]">
                        <span>{et.statNextDelta}:</span>
                        <span className="font-mono-num text-[#FFF7E6]">{deltaText}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: upgradeCap }).map((_, idx) => (
                        <span
                          key={idx}
                          className={`h-2 w-5 rounded-full transition-all ${
                            idx < level
                              ? 'bg-gradient-to-r from-[#FF9838] to-[#FFE082] shadow-[0_0_8px_rgba(255,184,77,0.55)]'
                              : 'bg-[#182247]'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      data-testid={`upgrade-${stat}`}
                      data-spark-burst="true"
                      disabled={isMax || !canAfford}
                      onClick={() => onBuyUpgrade(stat)}
                      className={`btn-premium font-mono-num flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-extrabold ${
                        isMax
                          ? 'border-emerald-400/35 bg-emerald-950/50 text-emerald-300'
                          : canAfford
                            ? 'border-[#FFD27D]/75 bg-gradient-to-r from-[#B82D24] to-[#E0792C] text-[#FFF8EC] glow-amber'
                            : 'border-[#F4C97A]/18 bg-[#0D1430]/80 text-[#9DA5BA] opacity-55'
                      }`}
                    >
                      {isMax ? (
                        <span>{t.upgMaxed}</span>
                      ) : (
                        <>
                          <Coins className="h-3.5 w-3.5 text-[#FFE082]" />
                          <span>{cost}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Ship Classes */}
        {tab === 'classes' && (
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {SHIP_CLASS_IDS.map((classId) => {
              const spec = SHIP_CLASS_SPECS[classId];
              const owned = profile.ownedShipClasses.includes(classId);
              const equipped = profile.shipClass === classId;
              const canAfford = profile.doubloons >= spec.cost;

              return (
                <div
                  key={classId}
                  data-testid={`ship-class-card-${classId}`}
                  className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                    equipped
                      ? 'border-[#FFD27D]/80 bg-gradient-to-b from-[#251A2A]/90 to-[#0C1026]/95 glow-amber'
                      : 'border-[#F4C97A]/22 bg-gradient-to-b from-[#11193A]/88 to-[#080D20]/92'
                  }`}
                >
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Ship className="h-4 w-4 text-[#FFD27D]" />
                        <h3 className="text-sm font-extrabold text-[#FFF7E6]">
                          {classLabel[classId].name}
                        </h3>
                      </div>
                      {equipped && <Check className="h-4 w-4 text-emerald-300" />}
                    </div>
                    <p className="mb-3 text-xs leading-relaxed text-[#D7CEBE]/90">
                      {classLabel[classId].desc}
                    </p>
                    <div className="mb-4 grid grid-cols-2 gap-1 text-[10px] font-bold text-[#9CE6FF]">
                      <span>HP +{spec.hpBonus}</span>
                      <span>{et.statDmg} {Math.round(spec.damageMult * 100)}%</span>
                      <span>{et.statSalvo} +{spec.extraProjectiles}</span>
                      <span>Max {t.upgTier} {spec.upgradeCap}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    data-testid={`ship-class-btn-${classId}`}
                    disabled={equipped || (!owned && !canAfford)}
                    onClick={() => onSelectShipClass(classId)}
                    className={`btn-premium flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-extrabold ${
                      equipped
                        ? 'border-emerald-400/60 bg-emerald-950/60 text-emerald-200'
                        : owned
                          ? 'border-[#7BE0FF]/55 bg-[#102446]/90 text-[#9CE6FF] hover:border-[#9CE6FF]'
                          : canAfford
                            ? 'border-[#FFD27D]/75 bg-gradient-to-r from-[#B82D24] to-[#E0792C] text-[#FFF8EC] glow-amber'
                            : 'border-[#F4C97A]/18 bg-[#0D1430]/80 text-[#9DA5BA] opacity-55'
                    }`}
                  >
                    {equipped ? (
                      <span>{t.crestEquippedBtn}</span>
                    ) : owned ? (
                      <span>{t.crestEquipBtn}</span>
                    ) : (
                      <>
                        <Coins className="h-3.5 w-3.5 text-[#FFE082]" />
                        <span className="font-mono-num">{spec.cost}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Officers */}
        {tab === 'officers' && (
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {OFFICER_IDS.map((officerId) => {
              const spec = OFFICER_SPECS[officerId];
              const isHired = profile.hiredOfficers.includes(officerId);
              const isActive = profile.activeOfficers.includes(officerId);
              const canAfford = profile.doubloons >= spec.cost;

              return (
                <div
                  key={officerId}
                  className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                    isActive
                      ? 'border-[#FFD27D]/80 bg-gradient-to-b from-[#251A2A]/90 to-[#0C1026]/95 glow-amber'
                      : 'border-[#F4C97A]/22 bg-gradient-to-b from-[#11193A]/88 to-[#080D20]/92'
                  }`}
                >
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {officerIcons[officerId]}
                        <h3 className="text-sm font-extrabold text-[#FFF7E6]">
                          {spec.nameKey in et
                            ? et[spec.nameKey as keyof typeof et]
                            : t[spec.nameKey as keyof typeof t]}
                        </h3>
                      </div>
                      {isActive && <Check className="h-4 w-4 text-emerald-300" />}
                    </div>
                    <p className="mb-4 text-xs leading-relaxed text-[#D7CEBE]/90">
                      {spec.descKey in et
                        ? et[spec.descKey as keyof typeof et]
                        : t[spec.descKey as keyof typeof t]}
                    </p>
                  </div>

                  <button
                    type="button"
                    data-testid={`officer-${officerId}`}
                    data-spark-burst="true"
                    disabled={!isHired && !canAfford}
                    onClick={() => onHireOrToggleOfficer(officerId)}
                    className={`btn-premium flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-extrabold ${
                      isActive
                        ? 'border-emerald-400/60 bg-emerald-950/60 text-emerald-200'
                        : isHired
                          ? 'border-[#7BE0FF]/55 bg-[#102446]/90 text-[#9CE6FF] hover:border-[#9CE6FF]'
                          : canAfford
                            ? 'border-[#FFD27D]/75 bg-gradient-to-r from-[#B82D24] to-[#E0792C] text-[#FFF8EC] glow-amber'
                            : 'border-[#F4C97A]/18 bg-[#0D1430]/80 text-[#9DA5BA] opacity-55'
                    }`}
                  >
                    {isHired ? (
                      <span>{isActive ? t.equippedLabel : t.equipBtn}</span>
                    ) : (
                      <>
                        <span>{t.hireBtn}</span>
                        <span className="font-mono-num flex items-center gap-1 text-[#FFE082]">
                          <Coins className="h-3.5 w-3.5" />
                          {spec.cost}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 4: Captain Perks */}
        {tab === 'perks' && (
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CAPTAIN_PERK_IDS.map((perkId) => {
              const spec = CAPTAIN_PERK_SPECS[perkId];
              const unlocked = profile.unlockedPerks.includes(perkId);
              const canAfford = profile.doubloons >= spec.cost;

              return (
                <div
                  key={perkId}
                  data-testid={`perk-card-${perkId}`}
                  className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                    unlocked
                      ? 'border-emerald-400/55 bg-gradient-to-b from-[#122624]/90 to-[#08101E]/95'
                      : 'border-[#F4C97A]/22 bg-gradient-to-b from-[#11193A]/88 to-[#080D20]/92'
                  }`}
                >
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Crown
                          className={`h-4 w-4 ${unlocked ? 'text-emerald-300' : 'text-[#FFD27D]'}`}
                        />
                        <h3 className="text-sm font-extrabold text-[#FFF7E6]">
                          {perkLabel[perkId].name}
                        </h3>
                      </div>
                      {unlocked && <Check className="h-4 w-4 text-emerald-300" />}
                    </div>
                    <p className="mb-3 text-xs leading-relaxed text-[#D7CEBE]/90">
                      {perkLabel[perkId].desc}
                    </p>
                  </div>

                  <button
                    type="button"
                    data-testid={`perk-btn-${perkId}`}
                    disabled={unlocked || !canAfford}
                    onClick={() => onUnlockPerk(perkId)}
                    className={`btn-premium flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-extrabold ${
                      unlocked
                        ? 'border-emerald-400/60 bg-emerald-950/60 text-emerald-200'
                        : canAfford
                          ? 'border-[#FFD27D]/75 bg-gradient-to-r from-[#B82D24] to-[#E0792C] text-[#FFF8EC] glow-amber'
                          : 'border-[#F4C97A]/18 bg-[#0D1430]/80 text-[#9DA5BA] opacity-55'
                    }`}
                  >
                    {unlocked ? (
                      <span>{et.perkUnlocked}</span>
                    ) : (
                      <>
                        <Coins className="h-3.5 w-3.5 text-[#FFE082]" />
                        <span className="font-mono-num">{spec.cost}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 5: Flagship (Crests + 3D Bow Figureheads) */}
        {tab === 'flagship' && (
          <div className="mb-6 flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SHIP_CREST_IDS.map((crestId) => {
                const spec = SHIP_CREST_SPECS[crestId];
                const owned = profile.ownedCrests.includes(crestId);
                const equipped = profile.equippedCrest === crestId;
                const canAfford = profile.doubloons >= spec.cost;
                const toCssHex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

                return (
                  <div
                    key={crestId}
                    className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                      equipped
                        ? 'border-[#FFD27D]/80 bg-gradient-to-b from-[#251A2A]/90 to-[#0C1026]/95 glow-amber'
                        : 'border-[#F4C97A]/22 bg-gradient-to-b from-[#11193A]/88 to-[#080D20]/92'
                    }`}
                  >
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 rounded-md border border-white/15 bg-[#070B18]/85 px-1.5 py-1">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: toCssHex(spec.sailHex) }}
                            />
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: toCssHex(spec.pennantHex) }}
                            />
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: toCssHex(spec.lanternHex) }}
                            />
                          </div>
                          <h3 className="text-sm font-extrabold text-[#FFF7E6]">
                            {t[spec.nameKey]}
                          </h3>
                        </div>
                        {equipped && <Check className="h-4 w-4 text-emerald-300" />}
                      </div>
                      <p className="mb-2.5 text-xs leading-relaxed text-[#D7CEBE]/90">
                        {t[spec.descKey]}
                      </p>
                      <p className="mb-4 rounded-lg border border-[#7BE0FF]/25 bg-[#0A1432]/85 px-2.5 py-1.5 text-[11px] font-bold text-[#9CE6FF]">
                        {crestPassives[crestId]}
                      </p>
                    </div>

                    <button
                      type="button"
                      data-testid={`crest-${crestId}`}
                      data-spark-burst="true"
                      disabled={equipped || (!owned && !canAfford)}
                      onClick={() => onSelectCrest(crestId)}
                      className={`btn-premium flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-extrabold ${
                        equipped
                          ? 'border-emerald-400/60 bg-emerald-950/60 text-emerald-200'
                          : owned
                            ? 'border-[#7BE0FF]/55 bg-[#102446]/90 text-[#9CE6FF] hover:border-[#9CE6FF]'
                            : canAfford
                              ? 'border-[#FFD27D]/75 bg-gradient-to-r from-[#B82D24] to-[#E0792C] text-[#FFF8EC] glow-amber'
                              : 'border-[#F4C97A]/18 bg-[#0D1430]/80 text-[#9DA5BA] opacity-55'
                      }`}
                    >
                      {equipped ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>{t.crestEquippedBtn}</span>
                        </>
                      ) : owned ? (
                        <span>{t.crestEquipBtn}</span>
                      ) : (
                        <>
                          <Coins className="h-3.5 w-3.5 text-[#FFE082]" />
                          <span className="font-mono-num">{spec.cost}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 3D Bow Figureheads Section */}
            <div>
              <div className="mb-2.5 flex items-center gap-2 text-xs font-bold tracking-[0.1em] text-[#FFD27D] uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{et.figureheadsTitle}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {FIGUREHEAD_IDS.map((figId) => {
                  const spec = FIGUREHEAD_SPECS[figId];
                  const owned = profile.ownedFigureheads.includes(figId);
                  const equipped = profile.equippedFigurehead === figId;
                  const canAfford = profile.doubloons >= spec.cost;

                  return (
                    <div
                      key={figId}
                      data-testid={`figurehead-card-${figId}`}
                      className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                        equipped
                          ? 'border-[#FFD27D]/80 bg-gradient-to-b from-[#251A2A]/90 to-[#0C1026]/95 glow-amber'
                          : 'border-[#F4C97A]/22 bg-gradient-to-b from-[#11193A]/88 to-[#080D20]/92'
                      }`}
                    >
                      <div>
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <h4 className="text-sm font-extrabold text-[#FFF7E6]">
                            {figLabel[figId].name}
                          </h4>
                          {equipped && <Check className="h-4 w-4 text-emerald-300" />}
                        </div>
                        <p className="mb-3 text-xs leading-relaxed text-[#D7CEBE]/90">
                          {figLabel[figId].desc}
                        </p>
                      </div>

                      <button
                        type="button"
                        data-testid={`figurehead-btn-${figId}`}
                        disabled={equipped || (!owned && !canAfford)}
                        onClick={() => onSelectFigurehead(figId)}
                        className={`btn-premium flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-extrabold ${
                          equipped
                            ? 'border-emerald-400/60 bg-emerald-950/60 text-emerald-200'
                            : owned
                              ? 'border-[#7BE0FF]/55 bg-[#102446]/90 text-[#9CE6FF] hover:border-[#9CE6FF]'
                              : canAfford
                                ? 'border-[#FFD27D]/75 bg-gradient-to-r from-[#B82D24] to-[#E0792C] text-[#FFF8EC] glow-amber'
                                : 'border-[#F4C97A]/18 bg-[#0D1430]/80 text-[#9DA5BA] opacity-55'
                        }`}
                      >
                        {equipped ? (
                          <span>{t.crestEquippedBtn}</span>
                        ) : owned ? (
                          <span>{t.crestEquipBtn}</span>
                        ) : (
                          <>
                            <Coins className="h-3.5 w-3.5 text-[#FFE082]" />
                            <span className="font-mono-num">{spec.cost}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-[#D8D0C2]/80">
            {selectedMode === 'endless' ? (
              <span className="font-bold text-[#9CE6FF]">{actTitle}</span>
            ) : (
              <>
                <span className="font-bold text-[#F4C97A]">
                  {t.actLabel} {selectedAct}:
                </span>{' '}
                <span>{actTitle}</span>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="btn-premium cursor-pointer rounded-xl border border-[#F4C97A]/30 bg-[#10183A]/90 px-4 py-2.5 text-xs font-bold tracking-wider text-[#F5EAD2] uppercase hover:border-[#FFB84D]"
            >
              {t.close}
            </button>
            <button
              type="button"
              onClick={onSailSelectedAct}
              className="btn-premium sheen-gold glow-crimson flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#FFD27D]/80 bg-gradient-to-r from-[#B82D24] via-[#DA422B] to-[#E0792C] px-5 py-2.5 text-xs font-extrabold tracking-[0.12em] text-[#FFF8EC] uppercase"
            >
              <Play className="h-4 w-4" />
              <span>{t.sailSelectedAct}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
