import React from 'react';
import {
  Anchor,
  CheckCircle2,
  CloudFog,
  Coins,
  Compass,
  Flame,
  Gem,
  Sparkles,
  Sun,
  Waves,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import type { CaptainProfile } from '../game/campaign';
import {
  SECRET_QUEST_IDS,
  SECRET_QUEST_SPECS,
  type SecretQuestId,
} from '../game/secrets';
import { applySpecularVarsToTarget } from '../game/uiEffects';
import { TRANSLATIONS, getLanguageMeta, type LanguageCode } from '../i18n/translations';
import { AstrolabeCrest } from './AstrolabeCrest';
import { BrassCorners } from './BrassCorners';

interface SecretsModalProps {
  language: LanguageCode;
  profile: CaptainProfile;
  onClose: () => void;
}

const SECRET_ICONS: Record<SecretQuestId, React.ReactNode> = {
  lighthouse: <Compass className="h-5 w-5 text-[#FFD27D]" />,
  maelstrom: <Waves className="h-5 w-5 text-[#7BE0FF]" />,
  shoals: <Flame className="h-5 w-5 text-[#FF9E44]" />,
  beamBell: <Sun className="h-5 w-5 text-[#6CE8D6]" />,
  fogHulk: <Anchor className="h-5 w-5 text-[#54F2A8]" />,
  thunderChain: <Zap className="h-5 w-5 text-[#9CE6FF]" />,
  reefChest: <Gem className="h-5 w-5 text-[#3EF09C]" />,
  shadowStrait: <CloudFog className="h-5 w-5 text-[#5CE8D8]" />,
  stormEye: <Wind className="h-5 w-5 text-[#FFE082]" />,
};

export const SecretsModal: React.FC<SecretsModalProps> = ({
  language,
  profile,
  onClose,
}) => {
  const t = TRANSLATIONS[language];
  const rtl = getLanguageMeta(language).rtl;

  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="secrets-modal-title"
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
          <AstrolabeCrest color="#7BE0FF" className="absolute -right-10 -bottom-12 h-44 w-44 opacity-[0.055]" />
        </div>
        <BrassCorners size={16} />

        <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#FFD27D]/55 bg-[#121C44] text-[#FFD27D]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="secrets-modal-title"
                className="font-display text-xl font-black tracking-[0.04em] text-[#FFF8EA] sm:text-2xl"
              >
                {t.secretsTitle}
              </h2>
              <p className="text-xs text-[#D8D0C2]/85">{t.secretsSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono-num rounded-xl border border-[#FFD27D]/35 bg-[#080D21]/85 px-2.5 py-1.5 text-xs font-extrabold text-[#FFD27D]">
              {profile.completedSecrets.length}/{SECRET_QUEST_IDS.length}
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

        <div className="relative z-10 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {SECRET_QUEST_IDS.map((id, idx) => {
            const spec = SECRET_QUEST_SPECS[id];
            const done = profile.completedSecrets.includes(id);
            return (
              <div
                key={id}
                data-testid={`secret-quest-card-${id}`}
                className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all sm:p-4 ${
                  done
                    ? 'border-emerald-400/45 bg-gradient-to-br from-[#0F2A2A]/85 to-[#08131B]/92'
                    : 'border-[#F4C97A]/25 bg-gradient-to-br from-[#10193A]/88 to-[#070B19]/92'
                }`}
              >
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#070B18]/80">
                        {SECRET_ICONS[id]}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold tracking-[0.14em] text-[#F4C97A]/80 uppercase">
                          0{idx + 1}
                        </span>
                        <h3 className="text-sm font-extrabold text-[#FFF8EA]">
                          {t[spec.titleKey]}
                        </h3>
                      </div>
                    </div>

                    {done ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t.secretCompletedBadge}
                      </span>
                    ) : (
                      <span className="font-mono-num inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#FFD27D]/30 bg-[#080D21]/85 px-2.5 py-1 text-[11px] font-bold text-[#FFD27D]">
                        <Coins className="h-3 w-3 text-[#FFB84D]" />+{spec.rewardDoubloons}
                      </span>
                    )}
                  </div>

                  <p className="text-xs leading-relaxed text-[#E2D9C8]/90">{t[spec.clueKey]}</p>
                </div>

                <p className="mt-2 text-[11px] font-semibold text-[#8CE2FF]">
                  {t[spec.rewardKey]}
                </p>
              </div>
            );
          })}
        </div>

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
