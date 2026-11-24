import React from 'react';
import { Anchor, Coins, Home, Map as MapIcon, Play, Skull, Sliders, Trophy } from 'lucide-react';
import type { ActId, PlayModeId } from '../game/campaign';
import { applySpecularVarsToTarget } from '../game/uiEffects';
import { getExtraT } from '../i18n/extraTranslations';
import { TRANSLATIONS, getLanguageMeta, type LanguageCode } from '../i18n/translations';
import type { SceneMode } from '../scene/NavalGymScene';
import { AstrolabeCrest } from './AstrolabeCrest';
import { BrassCorners } from './BrassCorners';
import { RollingNumber } from './RollingNumber';

interface StatusModalProps {
  mode: Exclude<SceneMode, 'title' | 'playing'>;
  language: LanguageCode;
  act: ActId;
  playMode: PlayModeId;
  wave: number;
  score: number;
  doubloonsEarned: number;
  milesSailed: number;
  sunkCount: number;
  shotsFired: number;
  shotsHit: number;
  bestComboInRun: number;
  morale: number;
  onResumeOrReplay: () => void;
  onNextAct: () => void;
  onOpenHarbor: () => void;
  onOpenChapters: () => void;
  onOpenControls: () => void;
  onReturnMenu: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  mode,
  language,
  act,
  playMode,
  wave,
  score,
  doubloonsEarned,
  milesSailed,
  sunkCount,
  shotsFired,
  shotsHit,
  bestComboInRun,
  morale,
  onResumeOrReplay,
  onNextAct,
  onOpenHarbor,
  onOpenChapters,
  onOpenControls,
  onReturnMenu,
}) => {
  const t = TRANSLATIONS[language];
  const et = getExtraT(language);
  const rtl = getLanguageMeta(language).rtl;

  const isVictory = mode === 'victory';
  const isDefeat = mode === 'defeat';
  const isPaused = mode === 'paused';
  const isEndlessDefeat = isDefeat && playMode === 'endless';
  const isFinalActVictory = isVictory && act === 3;
  const canAdvanceAct = isVictory && playMode === 'campaign' && act < 3;

  const accuracyPct = shotsFired > 0 ? Math.min(100, Math.round((shotsHit / shotsFired) * 100)) : 0;

  const heading = isFinalActVictory
    ? t.campaignVictoryTitle
    : isVictory
      ? t.victoryTitle
      : isEndlessDefeat
        ? t.endlessDefeatTitle
        : isDefeat
          ? t.defeatTitle
          : t.pausedTitle;

  const body = isFinalActVictory
    ? t.campaignVictoryBody
    : isVictory
      ? t.victoryBody
      : isEndlessDefeat
        ? t.endlessDefeatBody
        : isDefeat
          ? t.defeatBody
          : t.pausedBody;

  const primaryLabel = canAdvanceAct
    ? t.nextActBtn
    : isVictory || isDefeat
      ? t.playAgain
      : t.resume;

  const handlePrimary = canAdvanceAct ? onNextAct : onResumeOrReplay;

  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-modal-title"
      className="pointer-events-auto animate-backdrop-in absolute inset-0 z-40 flex items-center justify-center overflow-hidden bg-[#040712]/80 p-4"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <AstrolabeCrest
          className="h-[460px] w-[460px] opacity-[0.06]"
          color={isVictory ? '#FFD27D' : isDefeat ? '#FF7B6B' : '#8CE2FF'}
        />
        <AstrolabeCrest
          reverse
          className="absolute h-[320px] w-[320px] opacity-[0.05]"
          color="#F4C97A"
        />
      </div>
      <div
        onPointerMove={(e) => {
          if (e.pointerType !== 'touch') {
            applySpecularVarsToTarget(e.currentTarget, e.clientX, e.clientY);
          }
        }}
        className="landscape-modal-card glass-obsidian-strong specular-glass animate-panel-in relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-2xl p-6 text-center sm:p-7"
      >
        <BrassCorners size={14} />
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border ${
            isVictory
              ? 'border-[#FFD27D]/70 bg-gradient-to-br from-[#2B325E] to-[#121936] text-[#FFD27D] glow-amber'
              : isDefeat
                ? 'border-rose-400/60 bg-gradient-to-br from-[#4D1724] to-[#1A0B14] text-rose-300 glow-crimson'
                : 'border-[#F4C97A]/50 bg-gradient-to-br from-[#19244D] to-[#0B1024] text-[#FFB84D] glow-amber'
          }`}
        >
          {isVictory ? (
            <Trophy className="h-7 w-7" />
          ) : isDefeat ? (
            <Skull className="h-7 w-7" />
          ) : (
            <Anchor className="h-7 w-7" />
          )}
        </div>

        <h2
          id="status-modal-title"
          className="font-display mb-2 text-2xl font-black tracking-[0.04em] text-[#FFF8EA] sm:text-3xl"
        >
          {heading}
        </h2>
        <p className="font-prose mb-5 text-sm leading-relaxed text-[#E2D9C8]/90">{body}</p>

        <div className="mb-5 flex flex-wrap items-center justify-center gap-2.5">
          {isEndlessDefeat && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#7BE0FF]/40 bg-[#0D1C3D]/90 px-4 py-2 text-xs font-bold text-[#9CE6FF]">
              <span className="tracking-wider uppercase">{t.waveLabel}</span>
              <span className="font-mono-num text-base font-extrabold text-[#FFF7E6]">{wave}</span>
            </div>
          )}

          <div className="inline-flex items-center gap-2 rounded-xl border border-[#F4C97A]/30 bg-gradient-to-r from-[#0B1026]/90 to-[#141D42]/80 px-4 py-2 text-xs font-bold text-[#F4C97A]">
            <span className="tracking-wider uppercase">{t.score}</span>
            <span aria-hidden="true" className="text-[#F4C97A]/40">
              ·
            </span>
            <RollingNumber value={score} className="font-mono-num text-base font-extrabold text-[#FFF7E6]" />
          </div>

          {(isVictory || isEndlessDefeat) && doubloonsEarned > 0 && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#FFD27D]/45 bg-[#121B3E]/90 px-4 py-2 text-xs font-bold text-[#FFE082]">
              <Coins className="h-4 w-4 text-[#FFB84D]" />
              <span className="font-mono-num text-base font-extrabold text-[#FFF8EA]">
                +<RollingNumber value={doubloonsEarned} />
              </span>
            </div>
          )}
        </div>

        {/* Post-Voyage Telemetry Grid on Victory / Defeat */}
        {(isVictory || isDefeat) && (
          <div
            data-testid="post-voyage-stats"
            className="mb-5 rounded-xl border border-[#F4C97A]/22 bg-[#080D21]/85 p-3 text-left"
          >
            <p className="mb-2 text-center text-[10px] font-extrabold tracking-[0.14em] text-[#F4C97A] uppercase">
              {et.statsHeader}
            </p>
            <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-5">
              <div className="rounded-lg bg-[#0E1634]/85 px-2 py-1.5">
                <p className="text-[9px] font-bold text-[#B8C4DC] uppercase">{et.statMiles}</p>
                <p className="font-mono-num text-xs font-black text-[#8CE2FF]">
                  {milesSailed.toFixed(1)}
                </p>
              </div>
              <div className="rounded-lg bg-[#0E1634]/85 px-2 py-1.5">
                <p className="text-[9px] font-bold text-[#B8C4DC] uppercase">{et.statSunk}</p>
                <p className="font-mono-num text-xs font-black text-[#FFF7E6]">{sunkCount}</p>
              </div>
              <div className="rounded-lg bg-[#0E1634]/85 px-2 py-1.5">
                <p className="text-[9px] font-bold text-[#B8C4DC] uppercase">{et.statAccuracy}</p>
                <p className="font-mono-num text-xs font-black text-amber-300">{accuracyPct}%</p>
              </div>
              <div className="rounded-lg bg-[#0E1634]/85 px-2 py-1.5">
                <p className="text-[9px] font-bold text-[#B8C4DC] uppercase">{et.statCombo}</p>
                <p className="font-mono-num text-xs font-black text-[#FFE082]">×{bestComboInRun}</p>
              </div>
              <div className="col-span-3 rounded-lg bg-[#0E1634]/85 px-2 py-1.5 sm:col-span-1">
                <p className="text-[9px] font-bold text-[#B8C4DC] uppercase">{et.statMorale}</p>
                <p className="font-mono-num text-xs font-black text-emerald-300">{Math.round(morale)}%</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={handlePrimary}
            className="btn-premium sheen-gold glow-crimson flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#FFD27D]/80 bg-gradient-to-r from-[#B82D24] via-[#DA422B] to-[#E0792C] px-4 py-3 text-xs font-extrabold tracking-[0.12em] text-[#FFF8EC] uppercase"
          >
            <Play className="h-4 w-4" />
            <span>{primaryLabel}</span>
          </button>

          {isPaused && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                data-testid="pause-chapters-btn"
                onClick={onOpenChapters}
                className="btn-premium flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#7BE0FF]/40 bg-gradient-to-b from-[#12264D]/95 to-[#0A132A]/95 px-3 py-2.5 text-xs font-bold tracking-[0.06em] text-[#9CE6FF] uppercase hover:border-[#7BE0FF]"
              >
                <MapIcon className="h-4 w-4" />
                <span>{et.chaptersBtn}</span>
              </button>
              <button
                type="button"
                data-testid="pause-controls-btn"
                onClick={onOpenControls}
                className="btn-premium flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#F4C97A]/40 bg-gradient-to-b from-[#17234E]/95 to-[#0D132C]/95 px-3 py-2.5 text-xs font-bold tracking-[0.06em] text-[#FFD27D] uppercase hover:border-[#FFB84D]"
              >
                <Sliders className="h-4 w-4" />
                <span>{et.controlsBtn}</span>
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2.5 sm:flex-row">
            {(isVictory || isDefeat) && (
              <button
                type="button"
                onClick={onOpenHarbor}
                className="btn-premium flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#F4C97A]/45 bg-gradient-to-b from-[#17234E]/95 to-[#0D132C]/95 px-4 py-2.5 text-xs font-bold tracking-[0.08em] text-[#FFD27D] uppercase hover:border-[#FFB84D]"
              >
                <Anchor className="h-4 w-4" />
                <span>{t.harborBtn}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onReturnMenu}
              className="btn-premium flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#F4C97A]/35 bg-gradient-to-b from-[#131C3E]/95 to-[#0A0F24]/95 px-4 py-2.5 text-xs font-bold tracking-[0.1em] text-[#F5EAD2] uppercase hover:border-[#FFB84D]"
            >
              <Home className="h-4 w-4" />
              <span>{t.backToMenu}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
