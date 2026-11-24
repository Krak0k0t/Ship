import React from 'react';
import { X } from 'lucide-react';
import type { SeaParams } from '../game/sailingPhysics';
import { TRANSLATIONS, getLanguageMeta, type LanguageCode } from '../i18n/translations';

interface TuningDockProps {
  language: LanguageCode;
  params: SeaParams;
  bloomStrength: number;
  onChangeParam: <K extends keyof SeaParams>(key: K, value: SeaParams[K]) => void;
  onChangeBloom: (value: number) => void;
  onSliderRustle?: () => void;
  onClose: () => void;
}

export const TuningDock: React.FC<TuningDockProps> = ({
  language,
  params,
  bloomStrength,
  onChangeParam,
  onChangeBloom,
  onSliderRustle,
  onClose,
}) => {
  const t = TRANSLATIONS[language];
  const rtl = getLanguageMeta(language).rtl;

  return (
    <aside
      dir={rtl ? 'rtl' : 'ltr'}
      aria-label={t.tuningTitle}
      className="pointer-events-auto glass-obsidian-strong animate-dock-in absolute top-20 right-4 z-30 w-76 rounded-2xl p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-2 border-b border-[#F4C97A]/15 pb-3">
        <div>
          <h2 className="font-display text-base font-bold tracking-[0.03em] text-[#FFF8EA]">
            {t.tuningTitle}
          </h2>
          <p className="text-[11px] text-[#C6BDAE]">{t.tuningSub}</p>
        </div>
        <button
          type="button"
          aria-label={t.close}
          onClick={onClose}
          className="btn-premium cursor-pointer rounded-lg p-1.5 text-[#D8D0C2] hover:bg-[#17224B] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3.5 text-xs">
        <label className="flex flex-col gap-1.5">
          <div className="flex justify-between font-semibold text-[#E8DFCE]">
            <span>{t.tuningWaveHeight}</span>
            <span className="font-mono-num text-[#FFB84D]">{params.waveHeight.toFixed(2)} m</span>
          </div>
          <input
            type="range"
            min={0.2}
            max={2.1}
            step={0.05}
            value={params.waveHeight}
            onPointerDown={() => onSliderRustle?.()}
            onChange={(e) => {
              onSliderRustle?.();
              onChangeParam('waveHeight', Number(e.target.value));
            }}
            className="wax-slider"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <div className="flex justify-between font-semibold text-[#E8DFCE]">
            <span>{t.tuningWindSpeed}</span>
            <span className="font-mono-num text-[#FFB84D]">{params.windSpeed.toFixed(1)} kn</span>
          </div>
          <input
            type="range"
            min={6}
            max={22}
            step={0.5}
            value={params.windSpeed}
            onPointerDown={() => onSliderRustle?.()}
            onChange={(e) => {
              onSliderRustle?.();
              onChangeParam('windSpeed', Number(e.target.value));
            }}
            className="wax-slider"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <div className="flex justify-between font-semibold text-[#E8DFCE]">
            <span>{t.tuningTurnSpeed}</span>
            <span className="font-mono-num text-[#FFB84D]">{params.turnSpeed.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.6}
            max={2.2}
            step={0.05}
            value={params.turnSpeed}
            onPointerDown={() => onSliderRustle?.()}
            onChange={(e) => {
              onSliderRustle?.();
              onChangeParam('turnSpeed', Number(e.target.value));
            }}
            className="wax-slider"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <div className="flex justify-between font-semibold text-[#E8DFCE]">
            <span>{t.tuningCrestWindow}</span>
            <span className="font-mono-num text-[#FFB84D]">
              {Math.round(params.crestThreshold * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.4}
            max={0.8}
            step={0.02}
            value={params.crestThreshold}
            onPointerDown={() => onSliderRustle?.()}
            onChange={(e) => {
              onSliderRustle?.();
              onChangeParam('crestThreshold', Number(e.target.value));
            }}
            className="wax-slider"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <div className="flex justify-between font-semibold text-[#E8DFCE]">
            <span>{t.tuningBloom}</span>
            <span className="font-mono-num text-[#FFB84D]">{bloomStrength.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.05}
            max={0.8}
            step={0.05}
            value={bloomStrength}
            onPointerDown={() => onSliderRustle?.()}
            onChange={(e) => {
              onSliderRustle?.();
              onChangeBloom(Number(e.target.value));
            }}
            className="wax-slider"
          />
        </label>
      </div>
    </aside>
  );
};
