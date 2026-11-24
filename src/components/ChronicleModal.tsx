import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Coins,
  Compass,
  Crosshair,
  HeartPulse,
  Lock,
  ScrollText,
  Skull,
  Sparkles,
  X,
} from 'lucide-react';
import type { CaptainProfile, OfficerId } from '../game/campaign';
import { BESTIARY_IDS, type BestiaryId } from '../game/shipClasses';
import {
  CAPTAIN_MEDAL_IDS,
  CAPTAIN_MEDAL_SPECS,
  getUnlockedMedals,
} from '../game/contracts';
import {
  LORE_SEAS,
  OFFICER_DOSSIERS,
  SECRET_RELIC_LORE,
  TOTAL_LORE_ENTRIES,
  countUnlockedLoreEntries,
  isSeaLoreUnlocked,
} from '../game/lore';
import { applySpecularVarsToTarget } from '../game/uiEffects';
import { getExtraT } from '../i18n/extraTranslations';
import { TRANSLATIONS, getLanguageMeta, type LanguageCode } from '../i18n/translations';
import { AstrolabeCrest } from './AstrolabeCrest';
import { BrassCorners } from './BrassCorners';

type ChronicleTab = 'world' | 'crew' | 'relics' | 'bestiary' | 'medals';

interface ChronicleModalProps {
  language: LanguageCode;
  profile: CaptainProfile;
  onClose: () => void;
}

const OFFICER_ICONS: Record<OfficerId, React.ReactNode> = {
  gunner: <Crosshair className="h-5 w-5 text-[#FF8A5C]" />,
  bosun: <Coins className="h-5 w-5 text-[#54F2A8]" />,
  navigator: <Compass className="h-5 w-5 text-[#8CE2FF]" />,
  surgeon: <HeartPulse className="h-5 w-5 text-[#54F2A8]" />,
};

export const ChronicleModal: React.FC<ChronicleModalProps> = ({
  language,
  profile,
  onClose,
}) => {
  const t = TRANSLATIONS[language];
  const et = getExtraT(language);
  const rtl = getLanguageMeta(language).rtl;
  const [tab, setTab] = useState<ChronicleTab>('world');
  const unlockedEntries = countUnlockedLoreEntries(profile);
  const unlockedMedals = getUnlockedMedals(profile);

  const bestiaryEntries: Record<BestiaryId, { name: string; lore: string; weak: string }> = {
    brig: { name: et.bestiaryBrigName, lore: et.bestiaryBrigLore, weak: et.bestiaryBrigWeak },
    fireship: { name: et.bestiaryFireshipName, lore: et.bestiaryFireshipLore, weak: et.bestiaryFireshipWeak },
    mortar: { name: et.bestiaryMortarName, lore: et.bestiaryMortarLore, weak: et.bestiaryMortarWeak },
    healer: { name: et.bestiaryHealerName, lore: et.bestiaryHealerLore, weak: et.bestiaryHealerWeak },
    wraith: { name: et.bestiaryWraithName, lore: et.bestiaryWraithLore, weak: et.bestiaryWraithWeak },
    seafort: { name: et.bestiarySeafortName, lore: et.bestiarySeafortLore, weak: et.bestiarySeafortWeak },
    kraken: { name: et.bestiaryKrakenName, lore: et.bestiaryKrakenLore, weak: et.bestiaryKrakenWeak },
    boss: { name: et.bestiaryBossName, lore: et.bestiaryBossLore, weak: et.bestiaryBossWeak },
  };

  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chronicle-modal-title"
      data-testid="chronicle-modal"
      className="pointer-events-auto animate-backdrop-in absolute inset-0 z-40 flex items-center justify-center bg-[#040712]/82 p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onPointerMove={(e) => {
          if (e.pointerType !== 'touch') {
            applySpecularVarsToTarget(e.currentTarget, e.clientX, e.clientY);
          }
        }}
        className="landscape-modal-card glass-obsidian-strong specular-glass animate-panel-in relative max-h-[92dvh] w-full max-w-5xl overflow-y-auto rounded-2xl p-5 sm:p-6"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <AstrolabeCrest color="#FFD27D" className="absolute -right-12 -bottom-14 h-52 w-52 opacity-[0.06]" />
        </div>
        <BrassCorners size={16} />

        {/* Header */}
        <div className="relative z-10 mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#FFD27D]/55 bg-gradient-to-br from-[#2C1F12] to-[#121936] text-[#FFD27D]">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="chronicle-modal-title"
                className="font-display text-xl font-black tracking-[0.04em] text-[#FFF8EA] sm:text-2xl"
              >
                {t.chronicleTitle}
              </h2>
              <p className="text-xs text-[#D8D0C2]/85">{t.chronicleSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              data-testid="chronicle-progress-badge"
              className="font-mono-num rounded-xl border border-[#FFD27D]/35 bg-[#080D21]/85 px-2.5 py-1.5 text-xs font-extrabold text-[#FFD27D]"
            >
              {unlockedEntries}/{TOTAL_LORE_ENTRIES}
            </span>
            <button
              type="button"
              aria-label={t.close}
              onClick={onClose}
              className="btn-premium cursor-pointer rounded-xl border border-[#F4C97A]/25 bg-[#0A0F24]/85 p-2 text-[#D8D0C2] hover:border-[#FFB84D] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="relative z-10 mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="chronicle-tab-world"
            aria-pressed={tab === 'world'}
            onClick={() => setTab('world')}
            className={`btn-premium flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-extrabold tracking-[0.06em] uppercase transition-all ${
              tab === 'world'
                ? 'border-[#FFD27D]/85 bg-gradient-to-b from-[#9E241C]/90 to-[#471416]/90 text-[#FFF8EA] glow-crimson'
                : 'border-[#F4C97A]/25 bg-[#0A1026]/85 text-[#D8D0C2] hover:border-[#F4C97A]/55 hover:text-white'
            }`}
          >
            <ScrollText className="h-3.5 w-3.5 text-[#FFD27D]" />
            <span>{t.chronicleTabWorld}</span>
          </button>

          <button
            type="button"
            data-testid="chronicle-tab-crew"
            aria-pressed={tab === 'crew'}
            onClick={() => setTab('crew')}
            className={`btn-premium flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-extrabold tracking-[0.06em] uppercase transition-all ${
              tab === 'crew'
                ? 'border-[#FFD27D]/85 bg-gradient-to-b from-[#9E241C]/90 to-[#471416]/90 text-[#FFF8EA] glow-crimson'
                : 'border-[#F4C97A]/25 bg-[#0A1026]/85 text-[#D8D0C2] hover:border-[#F4C97A]/55 hover:text-white'
            }`}
          >
            <Compass className="h-3.5 w-3.5 text-[#8CE2FF]" />
            <span>{t.chronicleTabCrew}</span>
          </button>

          <button
            type="button"
            data-testid="chronicle-tab-relics"
            aria-pressed={tab === 'relics'}
            onClick={() => setTab('relics')}
            className={`btn-premium flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-extrabold tracking-[0.06em] uppercase transition-all ${
              tab === 'relics'
                ? 'border-[#FFD27D]/85 bg-gradient-to-b from-[#9E241C]/90 to-[#471416]/90 text-[#FFF8EA] glow-crimson'
                : 'border-[#F4C97A]/25 bg-[#0A1026]/85 text-[#D8D0C2] hover:border-[#F4C97A]/55 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#FFD27D]" />
            <span>{t.chronicleTabRelics}</span>
          </button>

          <button
            type="button"
            data-testid="chronicle-tab-bestiary"
            aria-pressed={tab === 'bestiary'}
            onClick={() => setTab('bestiary')}
            className={`btn-premium flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-extrabold tracking-[0.06em] uppercase transition-all ${
              tab === 'bestiary'
                ? 'border-[#FFD27D]/85 bg-gradient-to-b from-[#9E241C]/90 to-[#471416]/90 text-[#FFF8EA] glow-crimson'
                : 'border-[#F4C97A]/25 bg-[#0A1026]/85 text-[#D8D0C2] hover:border-[#F4C97A]/55 hover:text-white'
            }`}
          >
            <Skull className="h-3.5 w-3.5 text-[#FF8A5C]" />
            <span>{et.bestiaryTab}</span>
          </button>

          <button
            type="button"
            data-testid="chronicle-tab-medals"
            aria-pressed={tab === 'medals'}
            onClick={() => setTab('medals')}
            className={`btn-premium flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-extrabold tracking-[0.06em] uppercase transition-all ${
              tab === 'medals'
                ? 'border-[#FFD27D]/85 bg-gradient-to-b from-[#9E241C]/90 to-[#471416]/90 text-[#FFF8EA] glow-crimson'
                : 'border-[#F4C97A]/25 bg-[#0A1026]/85 text-[#D8D0C2] hover:border-[#F4C97A]/55 hover:text-white'
            }`}
          >
            <Award className="h-3.5 w-3.5 text-[#FFE082]" />
            <span>{t.chronicleTabMedals}</span>
            <span className="font-mono-num rounded bg-[#070B19]/70 px-1.5 py-0.5 text-[10px] text-[#FFD27D]">
              {unlockedMedals.length}/{CAPTAIN_MEDAL_IDS.length}
            </span>
          </button>
        </div>

        {/* Tab 1: World & Seas */}
        {tab === 'world' && (
          <div className="relative z-10 flex flex-col gap-3.5">
            <div className="rounded-xl border border-[#FFD27D]/35 bg-gradient-to-br from-[#1C1420]/90 via-[#101836]/90 to-[#080C1C]/95 p-4">
              <div className="mb-1.5 flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-[#FFD27D]" />
                <h3 className="font-display text-base font-black tracking-[0.04em] text-[#FFE8B8]">
                  {t.chronicleOathTitle}
                </h3>
              </div>
              <p className="font-prose text-xs leading-relaxed text-[#E7DEC8]/95 sm:text-[13px]">
                {t.chronicleOathBody}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {LORE_SEAS.map((sea) => {
                const unlocked = isSeaLoreUnlocked(profile, sea.actId);
                const borderColor =
                  sea.accent === 'crimson'
                    ? 'border-[#FF7B54]/35'
                    : sea.accent === 'azure'
                      ? 'border-[#7BE0FF]/35'
                      : 'border-[#FFD27D]/35';

                return (
                  <div
                    key={sea.actId}
                    data-testid={`chronicle-sea-card-${sea.actId}`}
                    className={`flex flex-col justify-between rounded-xl border p-4 ${
                      unlocked
                        ? `${borderColor} bg-gradient-to-br from-[#101A3B]/90 to-[#070B19]/95`
                        : 'border-white/10 bg-[#070A16]/85 opacity-80'
                    }`}
                  >
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold tracking-[0.14em] text-[#FFD27D] uppercase">
                          {t.actLabel} {sea.actId}
                        </span>
                        {!unlocked && <Lock className="h-3.5 w-3.5 text-[#9AA5BE]" />}
                      </div>
                      <h4 className="font-display mb-1 text-base font-black text-[#FFF8EA]">
                        {t[sea.nameKey]}
                      </h4>
                      <p className="mb-2.5 text-[11px] font-bold text-[#FF9C7A]">
                        {t[sea.bossKey]}
                      </p>
                      <p className="font-prose text-xs leading-relaxed text-[#E2D9C8]/90">
                        {unlocked ? t[sea.loreKey] : t.chronicleLockedSeaHint}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Crew Dossiers */}
        {tab === 'crew' && (
          <div className="relative z-10 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {OFFICER_DOSSIERS.map((officer) => {
              const recruited = profile.hiredOfficers.includes(officer.officerId);
              return (
                <div
                  key={officer.officerId}
                  data-testid={`chronicle-crew-card-${officer.officerId}`}
                  className={`flex flex-col justify-between rounded-xl border p-4 ${
                    recruited
                      ? 'border-emerald-400/40 bg-gradient-to-br from-[#0F242A]/90 to-[#08101E]/95'
                      : 'border-[#F4C97A]/25 bg-gradient-to-br from-[#10193A]/88 to-[#070B19]/94'
                  }`}
                >
                  <div>
                    <div className="mb-2.5 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-[#070B18]/85">
                          {OFFICER_ICONS[officer.officerId]}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-[#FFF8EA]">
                            {t[officer.nameKey]}
                          </h3>
                          <p className="text-[11px] font-bold text-[#8CE2FF]">
                            {t[officer.descKey]}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="font-prose text-xs leading-relaxed text-[#E2D9C8]/92">
                      {t[officer.loreKey]}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-end">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-extrabold uppercase ${
                        recruited
                          ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                          : 'border-[#F4C97A]/25 bg-[#090E22]/85 text-[#D8D0C2]/80'
                      }`}
                    >
                      {recruited && <CheckCircle2 className="h-3 w-3" />}
                      {recruited ? t.chronicleOfficerRecruited : t.chronicleOfficerWaiting}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Relic Tablets (9 Secret Quests Lore) */}
        {tab === 'relics' && (
          <div className="relative z-10 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {SECRET_RELIC_LORE.map((relic, idx) => {
              const discovered = profile.completedSecrets.includes(relic.secretId);
              return (
                <div
                  key={relic.secretId}
                  data-testid={`chronicle-relic-card-${relic.secretId}`}
                  className={`flex flex-col justify-between rounded-xl border p-3.5 sm:p-4 ${
                    discovered
                      ? 'border-[#FFD27D]/45 bg-gradient-to-br from-[#211C12]/88 via-[#111936]/90 to-[#080C1C]/95'
                      : 'border-white/12 bg-[#070B17]/85 opacity-80'
                  }`}
                >
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold tracking-[0.14em] text-[#F4C97A]/80 uppercase">
                        0{idx + 1}
                      </span>
                      {discovered ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#FFD27D]" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-[#9AA5BE]" />
                      )}
                    </div>
                    <h3 className="mb-1.5 text-sm font-extrabold text-[#FFF8EA]">
                      {t[relic.titleKey]}
                    </h3>
                    <p
                      className={`font-prose text-xs leading-relaxed ${
                        discovered ? 'text-[#EFE4CA]/95' : 'italic text-[#A4B0C8]/80'
                      }`}
                    >
                      {discovered ? t[relic.loreKey] : t.chronicleRelicSealed}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 4: Bestiary & Mythic Codex */}
        {tab === 'bestiary' && (
          <div className="relative z-10 grid grid-cols-1 gap-3 md:grid-cols-2">
            {BESTIARY_IDS.map((bId) => {
              const info = bestiaryEntries[bId];
              const kills = profile.bestiaryKills?.[bId] ?? 0;
              const isMythic = bId === 'kraken' || bId === 'wraith' || bId === 'seafort';
              return (
                <div
                  key={bId}
                  data-testid={`chronicle-bestiary-card-${bId}`}
                  className={`flex flex-col justify-between rounded-xl border p-4 ${
                    isMythic
                      ? 'border-[#7BE0FF]/40 bg-gradient-to-br from-[#102145]/92 to-[#070B1A]/95'
                      : 'border-[#F4C97A]/25 bg-gradient-to-br from-[#10193A]/88 to-[#070B19]/94'
                  }`}
                >
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <h3 className="font-display text-sm font-black text-[#FFF8EA]">
                        {info.name}
                      </h3>
                      <span className="font-mono-num rounded-md border border-[#FFD27D]/35 bg-[#090E22] px-2 py-0.5 text-[10px] font-bold text-[#FFD27D]">
                        {et.bestiaryKillsLabel}: {kills}
                      </span>
                    </div>
                    <p className="font-prose mb-2.5 text-xs leading-relaxed text-[#E2D9C8]/92">
                      {info.lore}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#FF7B54]/30 bg-[#1B0E18]/80 px-2.5 py-1.5 text-[11px] font-semibold text-[#FFB48A]">
                    <span className="font-extrabold text-[#FFD27D] uppercase">
                      {et.bestiaryWeaknessLabel}:{' '}
                    </span>
                    <span>{info.weak}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 5: Captain Honors / Medals */}
        {tab === 'medals' && (
          <div className="relative z-10 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {CAPTAIN_MEDAL_IDS.map((medalId) => {
              const spec = CAPTAIN_MEDAL_SPECS[medalId];
              const earned = unlockedMedals.includes(medalId);
              return (
                <div
                  key={medalId}
                  data-testid={`chronicle-medal-card-${medalId}`}
                  className={`flex flex-col justify-between rounded-xl border p-4 ${
                    earned
                      ? 'border-[#FFD27D]/65 bg-gradient-to-br from-[#281E12]/90 via-[#151D3D]/90 to-[#080C1C]/95 glow-amber'
                      : 'border-white/12 bg-[#070B17]/85 opacity-80'
                  }`}
                >
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Award
                          className={`h-4 w-4 ${earned ? 'text-[#FFE082]' : 'text-[#8994AC]'}`}
                        />
                        <h3 className="text-sm font-extrabold text-[#FFF8EA]">
                          {t[spec.titleKey]}
                        </h3>
                      </div>
                      {earned ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#FFD27D]" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 shrink-0 text-[#9AA5BE]" />
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-[#E2D9C8]/90">
                      {t[spec.descKey]}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-end">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-extrabold uppercase ${
                        earned
                          ? 'border-[#FFD27D]/55 bg-[#FFD27D]/15 text-[#FFE082]'
                          : 'border-white/15 bg-[#090E22]/85 text-[#9AA5BE]'
                      }`}
                    >
                      {earned ? t.medalUnlockedBadge : t.medalLockedBadge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="relative z-10 mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-premium cursor-pointer rounded-xl border border-[#F4C97A]/35 bg-gradient-to-b from-[#131C3E] to-[#090E22] px-5 py-2.5 text-xs font-extrabold tracking-[0.08em] text-[#F4C97A] uppercase hover:border-[#FFB84D] hover:text-white"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
