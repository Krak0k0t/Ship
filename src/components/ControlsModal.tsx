import React, { useEffect, useState } from 'react';
import { Keyboard, Monitor, RotateCcw, Sliders, Volume2, X } from 'lucide-react';
import {
  GRAPHICS_QUALITY_IDS,
  KEYBIND_ACTIONS,
  createDefaultSettings,
  formatBindingLabel,
  rebindAction,
  type GameSettings,
  type GraphicsQuality,
  type KeybindAction,
} from '../game/settings';
import { applySpecularVarsToTarget } from '../game/uiEffects';
import { getExtraT } from '../i18n/extraTranslations';
import { TRANSLATIONS, getLanguageMeta, type LanguageCode } from '../i18n/translations';
import { BrassCorners } from './BrassCorners';

interface ControlsModalProps {
  language: LanguageCode;
  settings: GameSettings;
  onChangeSettings: (next: GameSettings) => void;
  onSliderRustle?: () => void;
  onClose: () => void;
}

const ACTION_LABEL_KEY: Record<
  KeybindAction,
  | 'actSteerPort'
  | 'actSteerStbd'
  | 'actSailUp'
  | 'actSailDown'
  | 'actFirePort'
  | 'actFireStbd'
  | 'actFireBoth'
  | 'actSurge'
  | 'actHarpoon'
  | 'actSmoke'
  | 'actStormWake'
  | 'actDropMine'
  | 'actBoard'
  | 'actInteract'
  | 'actAmmo1'
  | 'actAmmo2'
  | 'actAmmo3'
  | 'actAmmo4'
  | 'actAmmo5'
  | 'actAmmo6'
  | 'actAmmo7'
  | 'actPause'
> = {
  steerPort: 'actSteerPort',
  steerStbd: 'actSteerStbd',
  sailUp: 'actSailUp',
  sailDown: 'actSailDown',
  firePort: 'actFirePort',
  fireStbd: 'actFireStbd',
  fireBoth: 'actFireBoth',
  surge: 'actSurge',
  harpoon: 'actHarpoon',
  smoke: 'actSmoke',
  stormWake: 'actStormWake',
  dropMine: 'actDropMine',
  board: 'actBoard',
  interact: 'actInteract',
  ammo1: 'actAmmo1',
  ammo2: 'actAmmo2',
  ammo3: 'actAmmo3',
  ammo4: 'actAmmo4',
  ammo5: 'actAmmo5',
  ammo6: 'actAmmo6',
  ammo7: 'actAmmo7',
  pause: 'actPause',
};

const GFX_LABEL_KEY: Record<GraphicsQuality, 'gfxLow' | 'gfxMedium' | 'gfxHigh' | 'gfxUltra'> = {
  low: 'gfxLow',
  medium: 'gfxMedium',
  high: 'gfxHigh',
  ultra: 'gfxUltra',
};

export const ControlsModal: React.FC<ControlsModalProps> = ({
  language,
  settings,
  onChangeSettings,
  onSliderRustle,
  onClose,
}) => {
  const t = TRANSLATIONS[language];
  const et = getExtraT(language);
  const rtl = getLanguageMeta(language).rtl;
  const [capturingAction, setCapturingAction] = useState<KeybindAction | null>(null);

  useEffect(() => {
    if (!capturingAction) return;

    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === 'Escape' && capturingAction !== 'pause') {
        setCapturingAction(null);
        return;
      }
      onChangeSettings({
        ...settings,
        bindings: rebindAction(settings.bindings, capturingAction, e.code),
      });
      setCapturingAction(null);
    };

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const mouseCode = `Mouse${e.button}`;
      onChangeSettings({
        ...settings,
        bindings: rebindAction(settings.bindings, capturingAction, mouseCode),
      });
      setCapturingAction(null);
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('mousedown', onMouseDown, true);
    window.addEventListener('contextmenu', onContextMenu, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('mousedown', onMouseDown, true);
      window.removeEventListener('contextmenu', onContextMenu, true);
    };
  }, [capturingAction, settings, onChangeSettings]);

  const handleResetDefaults = () => {
    setCapturingAction(null);
    onChangeSettings(createDefaultSettings());
  };

  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="controls-modal-title"
      data-testid="controls-modal"
      className="pointer-events-auto animate-backdrop-in absolute inset-0 z-50 flex items-center justify-center bg-[#040712]/76 p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && !capturingAction) onClose();
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
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="controls-modal-title"
                className="font-display text-xl font-black tracking-[0.04em] text-[#FFF8EA] sm:text-2xl"
              >
                {et.controlsTitle}
              </h2>
              <p className="text-xs text-[#E2D9C8]/85 sm:text-sm">{et.controlsSub}</p>
            </div>
          </div>

          <button
            type="button"
            aria-label={t.close}
            onClick={() => {
              setCapturingAction(null);
              onClose();
            }}
            className="btn-premium cursor-pointer rounded-xl border border-[#F4C97A]/25 bg-[#0E1532]/90 p-2 text-[#D8D0C2] hover:border-[#FFB84D] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Graphics Quality & Master Volume */}
        <div className="mb-5 grid grid-cols-1 gap-4 rounded-xl border border-[#F4C97A]/22 bg-[#080D20]/85 p-4 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-[0.08em] text-[#F4C97A] uppercase">
              <Monitor className="h-3.5 w-3.5" />
              <span>{et.graphicsLabel}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {GRAPHICS_QUALITY_IDS.map((qId) => {
                const active = settings.graphicsQuality === qId;
                return (
                  <button
                    key={qId}
                    type="button"
                    data-testid={`gfx-preset-${qId}`}
                    aria-pressed={active}
                    onClick={() => onChangeSettings({ ...settings, graphicsQuality: qId })}
                    className={`btn-premium cursor-pointer rounded-lg border px-2 py-2 text-xs font-extrabold ${
                      active
                        ? 'border-[#FFD27D]/85 bg-gradient-to-b from-[#B82D24] to-[#E0792C] text-[#FFF8EC] glow-amber'
                        : 'border-[#F4C97A]/20 bg-[#0D1430]/90 text-[#D8D0C2] hover:border-[#F4C97A]/55 hover:text-white'
                    }`}
                  >
                    {et[GFX_LABEL_KEY[qId]]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#F4C97A]">
              <span className="flex items-center gap-1.5 tracking-[0.08em] uppercase">
                <Volume2 className="h-3.5 w-3.5" />
                {et.masterVolLabel}
              </span>
              <span className="font-mono-num text-sm font-black text-[#FFF8EA]">
                {Math.round(settings.masterVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              aria-label={et.masterVolLabel}
              data-testid="master-volume-slider"
              min={0}
              max={1}
              step={0.02}
              value={settings.masterVolume}
              onPointerDown={() => onSliderRustle?.()}
              onChange={(e) => {
                onSliderRustle?.();
                onChangeSettings({ ...settings, masterVolume: Number(e.target.value) });
              }}
              className="wax-slider w-full"
            />
          </div>
        </div>

        {/* Key & Mouse Bindings */}
        <div className="mb-5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold tracking-[0.08em] text-[#F4C97A] uppercase">
              <Keyboard className="h-3.5 w-3.5" />
              <span>{et.keybindsTitle}</span>
            </div>
            <button
              type="button"
              data-testid="reset-keybinds-btn"
              onClick={handleResetDefaults}
              className="btn-premium flex cursor-pointer items-center gap-1 rounded-lg border border-[#F4C97A]/25 bg-[#0C132D]/90 px-2.5 py-1 text-[11px] font-bold text-[#D8D0C2] hover:border-[#FFB84D] hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
              <span>{et.resetDefaultsBtn}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {KEYBIND_ACTIONS.map((action) => {
              const isCapturing = capturingAction === action;
              return (
                <div
                  key={action}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[#F4C97A]/18 bg-[#0B1128]/90 px-3 py-2"
                >
                  <span className="text-xs font-semibold text-[#E5DCC9]">
                    {et[ACTION_LABEL_KEY[action]]}
                  </span>
                  <button
                    type="button"
                    data-testid={`rebind-${action}`}
                    onClick={() => setCapturingAction(isCapturing ? null : action)}
                    className={`btn-premium font-mono-num min-w-[74px] cursor-pointer rounded-lg border px-2.5 py-1 text-center text-[11px] font-extrabold ${
                      isCapturing
                        ? 'crest-ready-btn border-[#7BE0FF] bg-[#143058] text-[#FFF8EA]'
                        : 'border-[#F4C97A]/35 bg-[#121B3E] text-[#FFD27D] hover:border-[#FFB84D]'
                    }`}
                  >
                    {isCapturing ? et.rebindPrompt : formatBindingLabel(settings.bindings[action])}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setCapturingAction(null);
              onClose();
            }}
            className="btn-premium cursor-pointer rounded-xl border border-[#F4C97A]/35 bg-gradient-to-b from-[#131C3E] to-[#090E22] px-5 py-2.5 text-xs font-extrabold tracking-[0.08em] text-[#F4C97A] uppercase hover:border-[#FFB84D] hover:text-white"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
