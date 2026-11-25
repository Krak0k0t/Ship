import React from 'react';
import {
  Anchor,
  Check,
  CloudLightning,
  Coins,
  Compass,
  Flame,
  Hammer,
  MapPin,
  PackageOpen,
  ShieldAlert,
  Skull,
  Sparkles,
  Store,
  Sword,
  Swords,
  Waves,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import {
  MERCHANT_OFFER_IDS,
  MERCHANT_OFFER_SPECS,
  type MerchantOfferId,
  type RunMerchantBuffs,
  type WreckageChoice,
} from '../game/encounters';
import {
  SEA_ROUTE_SPECS,
  type BoardingSpoilChoice,
  type EndlessMutatorId,
  type SeaRouteId,
} from '../game/voyageSystems';
import { applySpecularVarsToTarget } from '../game/uiEffects';
import { getExtraT } from '../i18n/extraTranslations';
import { TRANSLATIONS, getLanguageMeta, type LanguageCode } from '../i18n/translations';
import { BrassCorners } from './BrassCorners';
import { RollingNumber } from './RollingNumber';

export type EncounterModalKind = 'wreckage' | 'merchant' | 'route' | 'mutator' | 'boarding';

interface EncounterModalProps {
  kind: EncounterModalKind;
  language: LanguageCode;
  spendableDoubloons: number;
  merchantBuffs: RunMerchantBuffs;
  fleetCharmBought: boolean;
  routeChoices?: SeaRouteId[];
  mutatorChoices?: EndlessMutatorId[];
  onResolveWreckage: (choice: WreckageChoice) => void;
  onBuyOffer: (offerId: MerchantOfferId) => void;
  onChooseRoute?: (id: SeaRouteId) => void;
  onChooseMutator?: (id: EndlessMutatorId) => void;
  onResolveBoarding?: (choice: BoardingSpoilChoice) => void;
  onClose: () => void;
}

export const EncounterModal: React.FC<EncounterModalProps> = ({
  kind,
  language,
  spendableDoubloons,
  merchantBuffs,
  fleetCharmBought,
  routeChoices = [],
  mutatorChoices = [],
  onResolveWreckage,
  onBuyOffer,
  onChooseRoute,
  onChooseMutator,
  onResolveBoarding,
  onClose,
}) => {
  const t = TRANSLATIONS[language];
  const et = getExtraT(language);
  const rtl = getLanguageMeta(language).rtl;
  const isOptionalModal = kind === 'wreckage' || kind === 'merchant';

  const offerMeta: Record<
    MerchantOfferId,
    { name: string; desc: string; icon: React.ReactNode }
  > = {
    hullPatch: {
      name: et.offerHullName,
      desc: et.offerHullDesc,
      icon: <Hammer className="h-4 w-4 text-emerald-300" />,
    },
    powderTemper: {
      name: et.offerPowderName,
      desc: et.offerPowderDesc,
      icon: <Sword className="h-4 w-4 text-[#FF8A5C]" />,
    },
    greekPitch: {
      name: et.offerPitchName,
      desc: et.offerPitchDesc,
      icon: <Flame className="h-4 w-4 text-[#FFB84D]" />,
    },
    moraleFeast: {
      name: et.offerFeastName,
      desc: et.offerFeastDesc,
      icon: <Sparkles className="h-4 w-4 text-[#7BE0FF]" />,
    },
    fleetCharm: {
      name: et.offerCharmName,
      desc: et.offerCharmDesc,
      icon: <Wind className="h-4 w-4 text-[#FFE082]" />,
    },
  };

  const routeMeta: Record<
    SeaRouteId,
    { name: string; desc: string; icon: React.ReactNode; cardStyle: string }
  > = {
    calmChannel: {
      name: et.routeCalmName,
      desc: et.routeCalmDesc,
      icon: <Store className="h-4 w-4 text-emerald-300" />,
      cardStyle:
        'border-emerald-400/55 bg-gradient-to-b from-[#112B29]/95 to-[#09131C]/95 hover:border-emerald-300 hover:shadow-[0_0_22px_rgba(84,242,168,0.25)]',
    },
    smugglerReefs: {
      name: et.routeSmugglerName,
      desc: et.routeSmugglerDesc,
      icon: <MapPin className="h-4 w-4 text-[#FFD27D]" />,
      cardStyle:
        'border-[#FFD27D]/55 bg-gradient-to-b from-[#2B2010]/95 to-[#120E09]/95 hover:border-[#FFE082] hover:shadow-[0_0_22px_rgba(255,210,125,0.25)]',
    },
    stormTrench: {
      name: et.routeStormName,
      desc: et.routeStormDesc,
      icon: <CloudLightning className="h-4 w-4 text-[#FF8A5C]" />,
      cardStyle:
        'border-[#FF7B54]/60 bg-gradient-to-b from-[#331418]/95 to-[#160B12]/95 hover:border-[#FFD27D] hover:shadow-[0_0_24px_rgba(255,123,84,0.28)]',
    },
    escortConvoy: {
      name: et.routeConvoyName,
      desc: et.routeConvoyDesc,
      icon: <Compass className="h-4 w-4 text-[#7BE0FF]" />,
      cardStyle:
        'border-[#7BE0FF]/55 bg-gradient-to-b from-[#11263D]/95 to-[#08111F]/95 hover:border-[#A6ECFF] hover:shadow-[0_0_22px_rgba(123,224,255,0.28)]',
    },
  };

  const mutatorMeta: Record<
    EndlessMutatorId,
    { name: string; desc: string; icon: React.ReactNode; cardStyle: string }
  > = {
    galeForce: {
      name: et.mutatorGaleName,
      desc: et.mutatorGaleDesc,
      icon: <Wind className="h-4 w-4 text-[#7BE0FF]" />,
      cardStyle:
        'border-[#7BE0FF]/55 bg-gradient-to-b from-[#10263D]/95 to-[#08111F]/95 hover:border-[#A6ECFF]',
    },
    glassPowder: {
      name: et.mutatorGlassName,
      desc: et.mutatorGlassDesc,
      icon: <Skull className="h-4 w-4 text-[#FF8A5C]" />,
      cardStyle:
        'border-[#FF7B54]/60 bg-gradient-to-b from-[#331418]/95 to-[#160B12]/95 hover:border-[#FFD27D]',
    },
    goldenTide: {
      name: et.mutatorGoldenName,
      desc: et.mutatorGoldenDesc,
      icon: <Coins className="h-4 w-4 text-[#FFE082]" />,
      cardStyle:
        'border-[#FFD27D]/55 bg-gradient-to-b from-[#2B2010]/95 to-[#120E09]/95 hover:border-[#FFE082]',
    },
    lightningSea: {
      name: et.mutatorLightningName,
      desc: et.mutatorLightningDesc,
      icon: <Zap className="h-4 w-4 text-[#D99BFF]" />,
      cardStyle:
        'border-[#C77DFF]/55 bg-gradient-to-b from-[#25143B]/95 to-[#10091E]/95 hover:border-[#E3B8FF]',
    },
  };

  const boardingOptions: Array<{
    id: BoardingSpoilChoice;
    title: string;
    desc: string;
    icon: React.ReactNode;
    cardStyle: string;
  }> = [
    {
      id: 'repair',
      title: et.boardingRepairBtn,
      desc: et.boardingRepairDesc,
      icon: <Hammer className="h-4 w-4 text-emerald-300" />,
      cardStyle:
        'border-emerald-400/55 bg-gradient-to-b from-[#112A28]/95 to-[#09131B]/95 hover:border-emerald-300',
    },
    {
      id: 'plunder',
      title: et.boardingPlunderBtn,
      desc: et.boardingPlunderDesc,
      icon: <Coins className="h-4 w-4 text-[#FFE082]" />,
      cardStyle:
        'border-[#FFD27D]/55 bg-gradient-to-b from-[#2B2010]/95 to-[#120E09]/95 hover:border-[#FFE082]',
    },
    {
      id: 'powder',
      title: et.boardingPowderBtn,
      desc: et.boardingPowderDesc,
      icon: <Zap className="h-4 w-4 text-[#7BE0FF]" />,
      cardStyle:
        'border-[#7BE0FF]/55 bg-gradient-to-b from-[#11263D]/95 to-[#08111F]/95 hover:border-[#A6ECFF]',
    },
  ];

  const headerConfig =
    kind === 'merchant'
      ? {
          kicker: et.merchantKicker,
          title: et.merchantTitle,
          badgeStyle: 'border-emerald-400/60 bg-gradient-to-br from-[#133834] to-[#0B142B] text-emerald-300',
          icon: <Store className="h-5 w-5" />,
        }
      : kind === 'route'
        ? {
            kicker: et.routeModalKicker,
            title: et.routeModalTitle,
            badgeStyle: 'border-[#7BE0FF]/60 bg-gradient-to-br from-[#122D4A] to-[#0A1328] text-[#8CE2FF]',
            icon: <Compass className="h-5 w-5" />,
          }
        : kind === 'mutator'
          ? {
              kicker: et.mutatorModalKicker,
              title: et.mutatorModalTitle,
              badgeStyle: 'border-[#C77DFF]/60 bg-gradient-to-br from-[#2B1646] to-[#0D0B1F] text-[#D99BFF]',
              icon: <Waves className="h-5 w-5" />,
            }
          : kind === 'boarding'
            ? {
                kicker: et.boardingModalKicker,
                title: et.boardingModalTitle,
                badgeStyle: 'border-[#FF7B54]/60 bg-gradient-to-br from-[#3D1518] to-[#140B16] text-[#FF9C7A]',
                icon: <Swords className="h-5 w-5" />,
              }
            : {
                kicker: et.wreckageModalKicker,
                title: et.wreckageModalTitle,
                badgeStyle: 'border-[#FFD27D]/60 bg-gradient-to-br from-[#3B2613] to-[#111734] text-[#FFD27D]',
                icon: <PackageOpen className="h-5 w-5" />,
              };

  const dmgBonusPct = Math.round((merchantBuffs.damageMult - 1) * 100);
  const burnBonusPct = Math.round((merchantBuffs.splashBurnMult - 1) * 100);
  const speedBonusPct = Math.round((merchantBuffs.speedMult - 1) * 100);

  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="encounter-modal-title"
      data-testid="encounter-modal"
      className="pointer-events-auto animate-backdrop-in absolute inset-0 z-50 flex items-center justify-center bg-[#040712]/88 p-3 sm:p-6"
      onClick={(e) => {
        if (isOptionalModal && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onPointerMove={(e) => {
          if (e.pointerType !== 'touch') {
            applySpecularVarsToTarget(e.currentTarget, e.clientX, e.clientY);
          }
        }}
        className="landscape-modal-card glass-obsidian-strong specular-glass animate-panel-in relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-2xl p-5 sm:p-6"
      >
        <BrassCorners size={15} />

        {/* Header */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${headerConfig.badgeStyle}`}
            >
              {headerConfig.icon}
            </div>
            <div>
              <p className="text-[10px] font-extrabold tracking-[0.18em] text-[#F4C97A] uppercase">
                {headerConfig.kicker}
              </p>
              <h2
                id="encounter-modal-title"
                className="font-display text-xl font-black tracking-[0.04em] text-[#FFF8EA] sm:text-2xl"
              >
                {headerConfig.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {kind === 'merchant' && (
              <div
                data-testid="merchant-wallet-badge"
                className="flex items-center gap-1.5 rounded-xl border border-[#FFD27D]/45 bg-[#090E22]/95 px-3 py-1.5 text-xs font-bold text-[#FFD27D]"
              >
                <Coins className="h-4 w-4 text-[#FFB84D]" />
                <span className="hidden sm:inline">{et.merchantWalletLabel}:</span>
                <RollingNumber
                  value={spendableDoubloons}
                  className="font-mono-num text-sm font-black text-[#FFF8EA]"
                />
              </div>
            )}
            {isOptionalModal && (
              <button
                type="button"
                aria-label={t.close}
                onClick={onClose}
                className="btn-premium cursor-pointer rounded-xl border border-[#F4C97A]/25 bg-[#0E1532]/90 p-2 text-[#D8D0C2] hover:border-[#FFB84D] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {kind === 'wreckage' && (
          <div className="flex flex-col gap-4">
            <p className="font-prose rounded-xl border border-[#F4C97A]/20 bg-[#080D20]/90 p-4 text-sm leading-relaxed text-[#E7DEC8]/95">
              {et.wreckageModalBody}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                data-testid="wreckage-risk-btn"
                onClick={() => onResolveWreckage('risk')}
                className="btn-premium group flex cursor-pointer flex-col justify-between rounded-xl border border-[#FF7B54]/60 bg-gradient-to-b from-[#331418]/95 to-[#160B12]/95 p-4 text-left hover:border-[#FFD27D] hover:shadow-[0_0_24px_rgba(255,123,84,0.28)]"
              >
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[#FF9C7A]">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span className="font-display text-sm font-black tracking-wide text-[#FFF7E6]">
                      {et.wreckageRiskBtn}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-[#E7DEC8]/90">
                    {et.wreckageRiskDesc}
                  </p>
                </div>
              </button>

              <button
                type="button"
                data-testid="wreckage-safe-btn"
                onClick={() => onResolveWreckage('safe')}
                className="btn-premium group flex cursor-pointer flex-col justify-between rounded-xl border border-emerald-400/50 bg-gradient-to-b from-[#112A28]/95 to-[#09131B]/95 p-4 text-left hover:border-emerald-300 hover:shadow-[0_0_22px_rgba(84,242,168,0.22)]"
              >
                <div>
                  <div className="mb-2 flex items-center gap-2 text-emerald-300">
                    <Anchor className="h-4 w-4 shrink-0" />
                    <span className="font-display text-sm font-black tracking-wide text-[#FFF7E6]">
                      {et.wreckageSafeBtn}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-[#E7DEC8]/90">
                    {et.wreckageSafeDesc}
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {kind === 'merchant' && (
          <div className="flex flex-col gap-4">
            <p className="text-xs leading-relaxed text-[#E2D9C8]/90 sm:text-sm">
              {et.merchantSub}
            </p>

            {merchantBuffs.purchasesCount > 0 && (
              <div
                data-testid="merchant-active-buffs"
                className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-400/35 bg-[#0A1E24]/90 px-3 py-2 text-xs font-bold text-emerald-200"
              >
                <span className="text-[10px] tracking-[0.12em] text-emerald-300 uppercase">
                  {et.merchantBuffsActive}:
                </span>
                {dmgBonusPct > 0 && (
                  <span className="font-mono-num rounded bg-[#071319] px-2 py-0.5 text-[#FF9C7A]">
                    +{dmgBonusPct}% {et.statDmg}
                  </span>
                )}
                {burnBonusPct > 0 && (
                  <span className="font-mono-num rounded bg-[#071319] px-2 py-0.5 text-[#FFD27D]">
                    +{burnBonusPct}% Burn/AoE
                  </span>
                )}
                {speedBonusPct > 0 && (
                  <span className="font-mono-num rounded bg-[#071319] px-2 py-0.5 text-[#8CE2FF]">
                    +{speedBonusPct}% {et.statSpeed}
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {MERCHANT_OFFER_IDS.map((offerId) => {
                const spec = MERCHANT_OFFER_SPECS[offerId];
                const meta = offerMeta[offerId];
                const boughtOneTime = offerId === 'fleetCharm' && fleetCharmBought;
                const canAfford = spendableDoubloons >= spec.cost && !boughtOneTime;

                return (
                  <div
                    key={offerId}
                    data-testid={`merchant-offer-${offerId}`}
                    className={`flex flex-col justify-between rounded-xl border p-3.5 ${
                      boughtOneTime
                        ? 'border-emerald-400/50 bg-[#0E2422]/90'
                        : 'border-[#F4C97A]/25 bg-[#0B122C]/92'
                    }`}
                  >
                    <div>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {meta.icon}
                          <h3 className="text-sm font-extrabold text-[#FFF7E6]">{meta.name}</h3>
                        </div>
                        {boughtOneTime && <Check className="h-4 w-4 text-emerald-300" />}
                      </div>
                      <p className="mb-3 text-xs leading-relaxed text-[#D7CEBE]/90">{meta.desc}</p>
                    </div>

                    <button
                      type="button"
                      data-testid={`merchant-buy-${offerId}`}
                      disabled={!canAfford}
                      onClick={() => onBuyOffer(offerId)}
                      className={`btn-premium font-mono-num flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-extrabold ${
                        boughtOneTime
                          ? 'border-emerald-400/50 bg-emerald-950/60 text-emerald-200'
                          : canAfford
                            ? 'border-[#FFD27D]/80 bg-gradient-to-r from-[#B82D24] to-[#E0792C] text-[#FFF8EC] glow-amber'
                            : 'border-[#F4C97A]/18 bg-[#0D1430]/80 text-[#9DA5BA] opacity-55'
                      }`}
                    >
                      {boughtOneTime ? (
                        <span>{et.merchantBoughtBtn}</span>
                      ) : (
                        <>
                          <Coins className="h-3.5 w-3.5 text-[#FFE082]" />
                          <span>{spec.cost}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {kind === 'route' && (
          <div className="flex flex-col gap-4">
            <p className="text-xs leading-relaxed text-[#E2D9C8]/90 sm:text-sm">
              {et.routeModalSub}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {routeChoices.map((routeId) => {
                const meta = routeMeta[routeId];
                const accent = SEA_ROUTE_SPECS[routeId]?.accent;
                return (
                  <button
                    key={routeId}
                    type="button"
                    data-testid={`route-choice-${routeId}`}
                    data-accent={accent}
                    onClick={() => onChooseRoute?.(routeId)}
                    className={`btn-premium flex cursor-pointer flex-col justify-between rounded-xl border p-4 text-left transition-all ${meta.cardStyle}`}
                  >
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        {meta.icon}
                        <span className="font-display text-sm font-black tracking-wide text-[#FFF7E6]">
                          {meta.name}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-[#E7DEC8]/92">{meta.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {kind === 'mutator' && (
          <div className="flex flex-col gap-4">
            <p className="text-xs leading-relaxed text-[#E2D9C8]/90 sm:text-sm">
              {et.mutatorModalSub}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {mutatorChoices.map((mutId) => {
                const meta = mutatorMeta[mutId];
                return (
                  <button
                    key={mutId}
                    type="button"
                    data-testid={`mutator-choice-${mutId}`}
                    onClick={() => onChooseMutator?.(mutId)}
                    className={`btn-premium flex cursor-pointer flex-col justify-between rounded-xl border p-4 text-left transition-all ${meta.cardStyle}`}
                  >
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        {meta.icon}
                        <span className="font-display text-sm font-black tracking-wide text-[#FFF7E6]">
                          {meta.name}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-[#E7DEC8]/92">{meta.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {kind === 'boarding' && (
          <div className="flex flex-col gap-4">
            <p className="font-prose rounded-xl border border-[#F4C97A]/20 bg-[#080D20]/90 p-3.5 text-xs leading-relaxed text-[#E7DEC8]/95 sm:text-sm">
              {et.boardingModalSub}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {boardingOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={`boarding-choice-${opt.id}`}
                  onClick={() => onResolveBoarding?.(opt.id)}
                  className={`btn-premium flex cursor-pointer flex-col justify-between rounded-xl border p-4 text-left transition-all ${opt.cardStyle}`}
                >
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      {opt.icon}
                      <span className="font-display text-sm font-black tracking-wide text-[#FFF7E6]">
                        {opt.title}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-[#E7DEC8]/92">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {isOptionalModal && (
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-premium cursor-pointer rounded-xl border border-[#F4C97A]/35 bg-gradient-to-b from-[#131C3E] to-[#090E22] px-5 py-2 text-xs font-extrabold tracking-[0.08em] text-[#F4C97A] uppercase hover:border-[#FFB84D] hover:text-white"
            >
              {t.close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
