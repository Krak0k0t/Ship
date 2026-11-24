import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  Infinity as InfinityIcon,
  Lock,
  Map as MapIcon,
  Play,
  X,
} from 'lucide-react';
import {
  ACT_IDS,
  ACT_SPECS,
  type ActId,
  type CaptainProfile,
} from '../game/campaign';
import { applySpecularVarsToTarget } from '../game/uiEffects';
import { getExtraT } from '../i18n/extraTranslations';
import { TRANSLATIONS, getLanguageMeta, type LanguageCode } from '../i18n/translations';
import { BrassCorners } from './BrassCorners';

interface ChapterSelectModalProps {
  language: LanguageCode;
  profile: CaptainProfile;
  inMidVoyage: boolean;
  onLaunchChapter: (mode: 'campaign' | 'endless', actId?: ActId) => void;
  onClose: () => void;
}

export const ChapterSelectModal: React.FC<ChapterSelectModalProps> = ({
  language,
  profile,
  inMidVoyage,
  onLaunchChapter,
  onClose,
}) => {
  const t = TRANSLATIONS[language];
  const et = getExtraT(language);
  const rtl = getLanguageMeta(language).rtl;
  const [pendingTarget, setPendingTarget] = useState<{
    mode: 'campaign' | 'endless';
    actId?: ActId;
  } | null>(null);

  const handleChoose = (mode: 'campaign' | 'endless', actId?: ActId) => {
    if (inMidVoyage) {
      setPendingTarget({ mode, actId });
      return;
    }
    onLaunchChapter(mode, actId);
  };

  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chapters-modal-title"
      data-testid="chapters-modal"
      className="pointer-events-auto animate-backdrop-in absolute inset-0 z-50 flex items-center justify-center bg-[#040712]/76 p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pendingTarget) onClose();
      }}
    >
      <div
        onPointerMove={(e) => {
          if (e.pointerType !== 'touch') {
            applySpecularVarsToTarget(e.currentTarget, e.clientX, e.clientY);
          }
        }}
        className="landscape-modal-card glass-obsidian-strong specular-glass animate-panel-in relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl p-5 sm:p-6"
      >
        <BrassCorners size={15} />

        {/* Header */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#FFD27D]/55 bg-gradient-to-br from-[#232F5C] to-[#0D132B] text-[#FFD27D] glow-amber">
              <MapIcon className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="chapters-modal-title"
                className="font-display text-xl font-black tracking-[0.04em] text-[#FFF8EA] sm:text-2xl"
              >
                {et.chaptersTitle}
              </h2>
              <p className="text-xs text-[#E2D9C8]/85 sm:text-sm">{et.chaptersSub}</p>
            </div>
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

        {/* Mid-Voyage Switch Confirmation */}
        {pendingTarget && (
          <div
            data-testid="chapter-switch-confirm"
            className="mb-5 rounded-xl border border-[#FF7B54]/70 bg-gradient-to-r from-[#4B1814]/92 to-[#220B10]/95 p-4 glow-crimson"
          >
            <div className="mb-1.5 flex items-center gap-2 text-sm font-black text-[#FFE0C4]">
              <AlertTriangle className="h-4 w-4 text-[#FF8A5C]" />
              <span>{et.switchConfirmTitle}</span>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-[#E7D8CD]">{et.switchConfirmBody}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="confirm-chapter-switch-btn"
                onClick={() => {
                  const chosen = pendingTarget;
                  setPendingTarget(null);
                  onLaunchChapter(chosen.mode, chosen.actId);
                }}
                className="btn-premium cursor-pointer rounded-lg border border-[#FFD27D]/80 bg-gradient-to-r from-[#B82D24] to-[#E0792C] px-3.5 py-1.5 text-xs font-extrabold text-[#FFF8EC]"
              >
                {et.confirmSwitchBtn}
              </button>
              <button
                type="button"
                onClick={() => setPendingTarget(null)}
                className="btn-premium cursor-pointer rounded-lg border border-white/20 bg-[#0D132B]/90 px-3.5 py-1.5 text-xs font-bold text-[#E2D9C8]"
              >
                {et.cancelBtn}
              </button>
            </div>
          </div>
        )}

        {/* Acts 1–3 + Endless Maelstrom */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ACT_IDS.map((actId) => {
            const spec = ACT_SPECS[actId];
            const cleared =
              actId < profile.unlockedAct || (actId === 3 && profile.campaignCleared);
            const available = actId <= profile.unlockedAct;

            return (
              <div
                key={actId}
                data-testid={`chapter-modal-act-${actId}`}
                className={`flex flex-col justify-between rounded-xl border p-4 ${
                  available
                    ? 'border-[#F4C97A]/35 bg-gradient-to-br from-[#121C40]/92 to-[#080D20]/95'
                    : 'border-white/10 bg-[#070B18]/85 opacity-70'
                }`}
              >
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold tracking-[0.14em] text-[#FFD27D] uppercase">
                      {t.actLabel} {actId}
                    </span>
                    {cleared ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/45 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300 uppercase">
                        <CheckCircle2 className="h-3 w-3" />
                        {et.statusCleared}
                      </span>
                    ) : available ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#7BE0FF]/45 bg-[#12305A]/60 px-2 py-0.5 text-[10px] font-extrabold text-[#9CE6FF] uppercase">
                        {et.statusAvailable}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-[#0A0E1E] px-2 py-0.5 text-[10px] font-extrabold text-[#9AA5BE] uppercase">
                        <Lock className="h-3 w-3" />
                        {et.statusLocked}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display mb-1 text-base font-black text-[#FFF8EA]">
                    {available ? t[spec.nameKey] : `${t.actLabel} ${actId} · ${et.statusLocked}`}
                  </h3>
                  <p className="font-prose mb-3 text-xs leading-relaxed text-[#D8D0C2]/85">
                    {available ? t[spec.descKey] : et.lockedTeaser}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#FFE082]">
                    <Coins className="h-3.5 w-3.5 text-[#FFB84D]" />
                    <span>{et.rewardLabel}:</span>
                    <span className="font-mono-num">{spec.rewardDoubloons}</span>
                  </div>

                  <button
                    type="button"
                    data-testid={`chapter-play-${actId}`}
                    disabled={!available}
                    onClick={() => handleChoose('campaign', actId)}
                    className={`btn-premium flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-extrabold ${
                      available
                        ? 'cursor-pointer border-[#FFD27D]/75 bg-gradient-to-r from-[#B82D24] to-[#E0792C] text-[#FFF8EC] glow-amber'
                        : 'border-white/10 bg-[#0D132B]/70 text-[#8F98B0] opacity-50'
                    }`}
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>{et.playChapterBtn}</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Endless Maelstrom Card */}
          <div
            data-testid="chapter-modal-endless"
            className="flex flex-col justify-between rounded-xl border border-[#7BE0FF]/40 bg-gradient-to-br from-[#0F2448]/92 to-[#070E22]/95 p-4"
          >
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-[11px] font-extrabold tracking-[0.14em] text-[#8CE2FF] uppercase">
                  <InfinityIcon className="h-3.5 w-3.5" />
                  {t.endlessBadge}
                </span>
                {profile.endlessBestWave > 0 && (
                  <span className="font-mono-num rounded-md border border-[#FFD27D]/35 bg-[#090F24] px-2 py-0.5 text-[10px] font-extrabold text-[#FFD27D]">
                    {t.bestWaveLabel}: {profile.endlessBestWave}
                  </span>
                )}
              </div>
              <h3 className="font-display mb-1 text-base font-black text-[#FFF8EA]">
                {t.endlessName}
              </h3>
              <p className="font-prose mb-3 text-xs leading-relaxed text-[#D8D0C2]/85">
                {t.endlessDesc}
              </p>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                data-testid="chapter-play-endless"
                onClick={() => handleChoose('endless')}
                className="btn-premium flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#7BE0FF]/70 bg-gradient-to-r from-[#1A4B7C] to-[#2778A8] px-3.5 py-1.5 text-xs font-extrabold text-[#FFF8EA] glow-azure"
              >
                <Play className="h-3.5 w-3.5" />
                <span>{et.playChapterBtn}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
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
