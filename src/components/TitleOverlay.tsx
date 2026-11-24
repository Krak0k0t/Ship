import React from 'react';
import {
  Anchor,
  BookOpen,
  Coins,
  Compass,
  Globe,
  Infinity as InfinityIcon,
  Lock,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  RotateCcw,
  Shield,
  Ship,
  Skull,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  ACT_IDS,
  ACT_SPECS,
  MAX_ACTIVE_OFFICERS,
  getTotalUpgradeLevel,
  type ActId,
  type CaptainProfile,
  type PlayModeId,
} from '../game/campaign';
import { SECRET_QUEST_IDS } from '../game/secrets';
import { TOTAL_LORE_ENTRIES, countUnlockedLoreEntries } from '../game/lore';
import {
  BLACK_CONTRACT_IDS,
  BLACK_CONTRACT_SPECS,
  computeContractModifiers,
  type BlackContractId,
} from '../game/contracts';
import type { DifficultyLevel } from '../game/sailingPhysics';
import { getExtraT } from '../i18n/extraTranslations';
import {
  LANGUAGE_OPTIONS,
  TRANSLATIONS,
  getLanguageMeta,
  type LanguageCode,
} from '../i18n/translations';
import { applySpecularVarsToTarget } from '../game/uiEffects';
import { AstrolabeCrest } from './AstrolabeCrest';
import { BrassCorners } from './BrassCorners';
import { RollingNumber } from './RollingNumber';

interface TitleOverlayProps {
  language: LanguageCode;
  difficulty: DifficultyLevel;
  selectedAct: ActId;
  selectedMode: PlayModeId;
  profile: CaptainProfile;
  activeContracts: BlackContractId[];
  isFullscreen: boolean;
  onChangeLanguage: (lang: LanguageCode) => void;
  onChangeDifficulty: (diff: DifficultyLevel) => void;
  onSelectAct: (actId: ActId) => void;
  onSelectEndless: () => void;
  onToggleContract: (id: BlackContractId) => void;
  onOpenHarbor: () => void;
  onOpenSecrets: () => void;
  onOpenChronicle: () => void;
  onOpenChapters: () => void;
  onOpenControls: () => void;
  onResetCampaign: () => void;
  onToggleFullscreen: () => void;
  onStart: () => void;
}

const DIFF_IDS: DifficultyLevel[] = ['easy', 'normal', 'hard', 'nightmare'];

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  language,
  difficulty,
  selectedAct,
  selectedMode,
  profile,
  activeContracts,
  isFullscreen,
  onChangeLanguage,
  onChangeDifficulty,
  onSelectAct,
  onSelectEndless,
  onToggleContract,
  onOpenHarbor,
  onOpenSecrets,
  onOpenChronicle,
  onOpenChapters,
  onOpenControls,
  onResetCampaign,
  onToggleFullscreen,
  onStart,
}) => {
  const t = TRANSLATIONS[language];
  const et = getExtraT(language);
  const rtl = getLanguageMeta(language).rtl;
  const contractMods = computeContractModifiers(activeContracts);
  const shipClassName =
    profile.shipClass === 'frigate'
      ? et.classFrigateName
      : profile.shipClass === 'manowar'
        ? et.classManowarName
        : et.classSloopName;
  const getContractCopy = (id: BlackContractId) => {
    if (id === 'cursedHold') return { name: et.contractCursedName, desc: et.contractCursedDesc };
    if (id === 'deadCalm') return { name: et.contractCalmName, desc: et.contractCalmDesc };
    const spec = BLACK_CONTRACT_SPECS[id];
    const base = t as Record<string, string>;
    return { name: base[spec.nameKey], desc: base[spec.descKey] };
  };
  const [tilt, setTilt] = React.useState({ rx: 0, ry: 0 });
  const [astroParallax, setAstroParallax] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      const ny = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
      setAstroParallax({
        x: Number((nx * 9).toFixed(1)),
        y: Number((ny * 7).toFixed(1)),
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  const handleCardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const sample = applySpecularVarsToTarget(e.currentTarget, e.clientX, e.clientY, 2.1);
    setTilt({ rx: sample.rx, ry: sample.ry });
  };

  const diffLabels: Record<DifficultyLevel, string> = {
    easy: t.diffEasy,
    normal: t.diffNormal,
    hard: t.diffHard,
    nightmare: t.diffNightmare,
  };

  const hasProgress =
    profile.unlockedAct > 1 ||
    profile.doubloons > 0 ||
    getTotalUpgradeLevel(profile.upgrades) > 0 ||
    profile.hiredOfficers.length > 0 ||
    profile.endlessBestWave > 0 ||
    profile.bestScore > 0 ||
    profile.completedSecrets.length > 0;

  const actHoverGlow: Record<ActId, string> = {
    1: 'hover:border-[#FFD27D]/65 hover:shadow-[0_0_20px_rgba(255,184,77,0.22)]',
    2: 'hover:border-[#FF7B54]/65 hover:shadow-[0_0_20px_rgba(224,78,44,0.26)]',
    3: 'hover:border-[#8CE2FF]/65 hover:shadow-[0_0_20px_rgba(116,184,255,0.26)]',
  };

  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between gap-2 p-2.5 sm:gap-3 sm:p-4 lg:p-6"
      style={{
        background:
          'radial-gradient(circle at 18% 24%, rgba(255, 168, 72, 0.08), transparent 44%), radial-gradient(circle at 86% 18%, rgba(88, 138, 248, 0.08), transparent 42%)',
      }}
    >
      {/* Interactive Parallax Dual-Ring Brass Astrolabe */}
      <div
        aria-hidden="true"
        data-testid="title-astrolabe-parallax"
        className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block"
      >
        <div
          className="absolute -top-20 -left-20 transition-transform duration-300 ease-out"
          style={{
            transform: `translate3d(${astroParallax.x}px, ${astroParallax.y}px, 0)`,
          }}
        >
          <AstrolabeCrest className="h-[460px] w-[460px] opacity-[0.07]" color="#FFD27D" />
          <AstrolabeCrest
            reverse
            className="absolute top-1/2 left-1/2 h-[330px] w-[330px] -translate-x-1/2 -translate-y-1/2 opacity-[0.06]"
            color="#8CE2FF"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse items-start justify-between gap-2 sm:flex-row sm:gap-3">
        {/* Main Campaign Title Card */}
        <div
          onPointerMove={handleCardPointerMove}
          onPointerLeave={() => setTilt({ rx: 0, ry: 0 })}
          style={{
            transform: `perspective(1200px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          }}
          className="landscape-title-card pointer-events-auto glass-obsidian-strong specular-glass animate-panel-in relative max-h-[calc(100dvh-4.5rem)] w-full max-w-xl flex-1 overflow-y-auto rounded-2xl p-4 sm:max-h-[calc(100dvh-1.75rem)] lg:p-7"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <AstrolabeCrest className="absolute -top-12 -right-12 h-56 w-56 opacity-[0.065]" />
          </div>
          <BrassCorners size={15} />
          <div className="relative z-10 mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#FFE09E]/60 bg-gradient-to-br from-[#D94332] via-[#B42820] to-[#7A1815] text-[#FFF4DC] glow-crimson">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-[#F4C97A]/90 uppercase sm:text-[11px]">
                  {t.eyebrow}
                </p>
                <h1
                  className="font-display text-2xl font-black tracking-[0.04em] text-[#FFF8EA] sm:text-[38px] sm:leading-[1.06]"
                  style={{ textShadow: '0 4px 24px rgba(255, 176, 68, 0.25)' }}
                >
                  {t.title}
                </h1>
              </div>
            </div>

            <div
              data-doubloons-wallet="true"
              className="flex items-center gap-1.5 rounded-xl border border-[#FFD27D]/35 bg-[#080D21]/85 px-2.5 py-1.5 text-xs font-bold text-[#FFD27D]"
            >
              <Coins className="h-3.5 w-3.5 text-[#FFB84D]" />
              <RollingNumber value={profile.doubloons} className="font-mono-num text-[#FFF8EA]" />
            </div>
          </div>

          <p className="font-prose landscape-hide mb-3 text-xs leading-relaxed text-[#E2D9C8]/95 sm:mb-3 sm:text-sm">
            {t.subtitle}
          </p>

          {/* 3-Act + Endless Maelstrom Sea Chart Selector */}
          <div className="mb-3 sm:mb-4">
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold tracking-[0.12em] text-[#F4C97A] uppercase sm:mb-2">
              <div className="flex items-center gap-2">
                <MapIcon className="h-3.5 w-3.5" />
                <span>{t.seaChartLabel}</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-md border border-[#F4C97A]/25 bg-[#090F24]/85 px-2 py-0.5 text-[10px] text-[#FFE082] normal-case">
                <Ship className="h-3 w-3 text-[#7BE0FF]" />
                {shipClassName}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2">
              {ACT_IDS.map((actId) => {
                const spec = ACT_SPECS[actId];
                const unlocked = actId <= profile.unlockedAct;
                const active = selectedMode === 'campaign' && selectedAct === actId;
                return (
                  <button
                    key={actId}
                    type="button"
                    data-testid={`act-card-${actId}`}
                    disabled={!unlocked}
                    aria-pressed={active}
                    onClick={() => onSelectAct(actId)}
                    className={`btn-premium flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                      !unlocked
                        ? 'cursor-not-allowed border-[#F4C97A]/12 bg-[#070B1A]/75 opacity-55'
                        : active
                          ? 'sheen-gold cursor-pointer border-[#FFD27D]/85 bg-gradient-to-b from-[#9E241C]/90 to-[#3D1214]/90 text-[#FFF8EA] glow-crimson'
                          : `cursor-pointer border-[#F4C97A]/22 bg-gradient-to-b from-[#111938]/85 to-[#090E22]/85 text-[#D8D0C2] ${actHoverGlow[actId]} hover:text-white`
                    }`}
                  >
                    <div className="mb-1 flex w-full items-center justify-between text-[10px] font-extrabold tracking-wider uppercase">
                      <span className="text-[#FFD27D]">
                        {t.actLabel} {actId}
                      </span>
                      {!unlocked && <Lock className="h-3 w-3 text-[#B6BDD1]" />}
                    </div>
                    <span className="text-xs font-extrabold leading-snug text-[#FFF8EA]">
                      {t[spec.nameKey]}
                    </span>
                    <span className="mt-0.5 text-[10px] leading-snug text-[#D8D0C2]/80">
                      {unlocked ? t[spec.descKey] : t.lockedLabel}
                    </span>
                  </button>
                );
              })}

              {/* 4th Card: Endless Maelstrom */}
              <button
                type="button"
                data-testid="endless-card"
                aria-pressed={selectedMode === 'endless'}
                onClick={onSelectEndless}
                className={`btn-premium flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                  selectedMode === 'endless'
                    ? 'sheen-gold cursor-pointer border-[#7BE0FF]/85 bg-gradient-to-b from-[#173A6B]/95 to-[#0B1732]/95 text-[#FFF8EA] glow-azure'
                    : 'cursor-pointer border-[#7BE0FF]/28 bg-gradient-to-b from-[#0E1E3F]/88 to-[#070D20]/88 text-[#D8D0C2] hover:border-[#7BE0FF]/75 hover:shadow-[0_0_20px_rgba(123,224,255,0.24)] hover:text-white'
                }`}
              >
                <div className="mb-1 flex w-full items-center justify-between text-[10px] font-extrabold tracking-wider uppercase">
                  <span className="flex items-center gap-1 text-[#8CE2FF]">
                    <InfinityIcon className="h-3 w-3" />
                    {t.endlessBadge}
                  </span>
                  {profile.endlessBestWave > 0 && (
                    <span className="font-mono-num text-[10px] text-[#FFD27D]">
                      {t.bestWaveLabel}: {profile.endlessBestWave}
                    </span>
                  )}
                </div>
                <span className="text-xs font-extrabold leading-snug text-[#FFF8EA]">
                  {t.endlessName}
                </span>
                <span className="mt-0.5 text-[10px] leading-snug text-[#D8D0C2]/80">
                  {t.endlessDesc}
                </span>
              </button>
            </div>
          </div>

          {/* Difficulty Selector */}
          <div className="mb-3 sm:mb-4">
            <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] text-[#F4C97A] uppercase sm:mb-2">
              <Shield className="h-3.5 w-3.5" />
              <span>{t.difficultyLabel}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
              {DIFF_IDS.map((id) => {
                const active = difficulty === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChangeDifficulty(id)}
                    className={`btn-premium cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap sm:py-2 ${
                      active
                        ? 'border-[#FFD27D]/85 bg-gradient-to-b from-[#D43E2D] to-[#9E211A] text-[#FFF8EA] glow-crimson'
                        : 'border-[#F4C97A]/20 bg-gradient-to-b from-[#111938]/85 to-[#090E22]/85 text-[#D8D0C2] hover:border-[#F4C97A]/55 hover:text-white'
                    }`}
                  >
                    {diffLabels[id]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Black Contracts (Optional Risk/Reward Pacts) */}
          <div className="mb-3.5 sm:mb-4">
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold tracking-[0.12em] text-[#FF9C7A] uppercase">
              <div className="flex items-center gap-1.5">
                <Skull className="h-3.5 w-3.5 text-[#FF7B54]" />
                <span>{t.contractsTitle}</span>
              </div>
              <span
                className={`font-mono-num text-[10px] font-extrabold ${
                  activeContracts.length > 0 ? 'text-[#FFE082]' : 'normal-case text-[#D8D0C2]/75'
                }`}
              >
                {activeContracts.length > 0
                  ? `+${contractMods.doubloonBonusPct}% ${t.doubloonsLabel} · +${contractMods.scoreBonusPct}% ${t.score}`
                  : t.contractsHint}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {BLACK_CONTRACT_IDS.map((id) => {
                const spec = BLACK_CONTRACT_SPECS[id];
                const copy = getContractCopy(id);
                const active = activeContracts.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    data-testid={`contract-toggle-${id}`}
                    aria-pressed={active}
                    onClick={() => onToggleContract(id)}
                    className={`btn-premium flex cursor-pointer flex-col items-start rounded-xl border p-2 text-left transition-all ${
                      active
                        ? 'border-[#FF7B54]/85 bg-gradient-to-b from-[#5E1614]/90 to-[#23090C]/95 text-[#FFF8EA] glow-crimson'
                        : 'border-[#F4C97A]/20 bg-gradient-to-b from-[#111938]/82 to-[#080C1E]/88 text-[#D8D0C2] hover:border-[#FF7B54]/55 hover:text-white'
                    }`}
                  >
                    <div className="mb-0.5 flex w-full items-center justify-between gap-1 text-[11px] font-extrabold">
                      <span className={active ? 'text-[#FFD27D]' : 'text-[#FFF7E6]'}>
                        {copy.name}
                      </span>
                      <span className="font-mono-num text-[10px] text-[#FFE082]">
                        +{spec.doubloonBonusPct}%
                      </span>
                    </div>
                    <span className="text-[10px] leading-snug text-[#D8D0C2]/80">
                      {copy.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              data-start="true"
              onClick={onStart}
              className="btn-premium sheen-gold glow-crimson w-full cursor-pointer rounded-xl border border-[#FFD27D]/80 bg-gradient-to-r from-[#AE261E] via-[#DA422B] to-[#E58A35] px-5 py-2.5 text-xs font-extrabold tracking-[0.14em] text-[#FFF9EC] uppercase sm:w-auto sm:min-w-[175px] sm:px-6 sm:py-3 sm:text-sm"
            >
              {t.setSail}
            </button>

            <button
              type="button"
              data-testid="open-chapters-btn"
              onClick={onOpenChapters}
              className="btn-premium flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#7BE0FF]/40 bg-gradient-to-b from-[#12264D]/92 to-[#091228]/95 px-3 py-2.5 text-xs font-extrabold tracking-[0.06em] text-[#9CE6FF] uppercase hover:border-[#7BE0FF] hover:text-white sm:flex-initial sm:py-3"
            >
              <MapIcon className="h-3.5 w-3.5 text-[#7BE0FF]" />
              <span>{et.chaptersBtn}</span>
            </button>

            <button
              type="button"
              data-testid="open-harbor-btn"
              onClick={onOpenHarbor}
              className="btn-premium flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#F4C97A]/40 bg-gradient-to-b from-[#141F46]/92 to-[#0B1026]/95 px-3.5 py-2.5 text-xs font-extrabold tracking-[0.08em] text-[#F4C97A] uppercase hover:border-[#FFD27D] hover:text-[#FFF8EA] sm:flex-initial sm:px-4 sm:py-3"
            >
              <Anchor className="h-4 w-4" />
              <span>{t.harborBtn}</span>
              {profile.activeOfficers.length > 0 && (
                <span className="font-mono-num rounded bg-[#232F5C] px-1.5 py-0.5 text-[10px] text-[#FFD27D]">
                  {profile.activeOfficers.length}/{MAX_ACTIVE_OFFICERS}
                </span>
              )}
            </button>

            <button
              type="button"
              data-testid="open-secrets-btn"
              onClick={onOpenSecrets}
              className="btn-premium flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#7BE0FF]/35 bg-gradient-to-b from-[#11244A]/92 to-[#091228]/95 px-3.5 py-2.5 text-xs font-extrabold tracking-[0.06em] text-[#9CE6FF] uppercase hover:border-[#7BE0FF] hover:text-white sm:flex-initial sm:py-3"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#FFD27D]" />
              <span>{t.secretsBtn}</span>
              <span className="font-mono-num rounded bg-[#18305E] px-1.5 py-0.5 text-[10px] text-[#FFD27D]">
                {profile.completedSecrets.length}/{SECRET_QUEST_IDS.length}
              </span>
            </button>

            <button
              type="button"
              data-testid="open-chronicle-btn"
              onClick={onOpenChronicle}
              className="btn-premium flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#FFD27D]/35 bg-gradient-to-b from-[#23193A]/92 to-[#0E0B1E]/95 px-3.5 py-2.5 text-xs font-extrabold tracking-[0.06em] text-[#FFE082] uppercase hover:border-[#FFD27D] hover:text-white sm:flex-initial sm:py-3"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#FFD27D]" />
              <span>{t.chronicleBtn}</span>
              <span className="font-mono-num rounded bg-[#2B1F48] px-1.5 py-0.5 text-[10px] text-[#FFE082]">
                {countUnlockedLoreEntries(profile)}/{TOTAL_LORE_ENTRIES}
              </span>
            </button>

            <button
              type="button"
              data-testid="open-controls-btn"
              onClick={onOpenControls}
              className="btn-premium flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#F4C97A]/30 bg-[#0D1430]/92 px-3 py-2.5 text-xs font-extrabold tracking-[0.06em] text-[#E6DEC8] uppercase hover:border-[#FFB84D] hover:text-white sm:flex-initial sm:py-3"
            >
              <Sliders className="h-3.5 w-3.5 text-[#FFD27D]" />
              <span>{et.controlsBtn}</span>
            </button>

            {hasProgress && (
              <button
                type="button"
                title={t.newCampaignBtn}
                aria-label={t.newCampaignBtn}
                onClick={onResetCampaign}
                className="btn-premium cursor-pointer rounded-xl border border-white/15 bg-[#0A0F24]/85 p-2.5 text-[#C2C8D8] hover:border-rose-400/50 hover:text-rose-300 sm:p-3"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Top-Right Language + Fullscreen Strip */}
        <div className="landscape-hud-card pointer-events-auto glass-obsidian animate-panel-in flex shrink-0 items-center gap-2 self-end rounded-2xl px-3 py-1.5 sm:self-start sm:px-3.5 sm:py-2">
          <Globe className="h-4 w-4 text-[#F4C97A]" aria-hidden="true" />
          <label htmlFor="title-lang-select" className="sr-only">
            {t.languageLabel}
          </label>
          <select
            id="title-lang-select"
            aria-label={t.languageLabel}
            value={language}
            onChange={(e) => onChangeLanguage(e.target.value as LanguageCode)}
            className="cursor-pointer rounded-lg bg-transparent py-1 pr-2 text-xs font-semibold text-[#F7EEDB] outline-none sm:text-sm"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code} className="bg-[#0B1024] text-[#F5EAD2]">
                {opt.nativeLabel}
              </option>
            ))}
          </select>

          <button
            type="button"
            aria-label={isFullscreen ? t.exitFullscreen : t.fullscreen}
            onClick={onToggleFullscreen}
            className="btn-premium cursor-pointer rounded-xl border border-[#F4C97A]/30 bg-gradient-to-b from-[#141D40]/80 to-[#0A0F24]/90 p-2 text-[#F4C97A] hover:border-[#FFB84D] hover:text-[#FFF7E6]"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <p className="glass-obsidian animate-panel-in hidden rounded-xl px-4 py-2 text-center text-[11px] font-medium tracking-wide text-[#E2D9C8]/90 lg:block lg:text-xs">
          {t.controlsHint
            .replace('1/2/3', '1-7')
            .replace('F ', 'F11 ')}{' '}
          · {et.mineBtn} · {et.actInteract} [G]
        </p>
      </div>
    </div>
  );
};
