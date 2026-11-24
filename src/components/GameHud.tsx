import React, { useEffect, useRef, useState } from 'react';
import {
  Anchor,
  Bomb,
  ChevronLeft,
  ChevronRight,
  CloudFog,
  CloudLightning,
  Coins,
  Compass,
  Crosshair,
  Flame,
  HeartHandshake,
  HeartPulse,
  Home,
  Map as MapIcon,
  MapPin,
  Maximize2,
  Minimize2,
  Pause,
  PackageOpen,
  RotateCcw,
  Skull,
  Sliders,
  SlidersHorizontal,
  Sparkles,
  Store,
  Sun,
  Swords,
  Users,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import { MAX_ACTIVE_OFFICERS, WEATHER_SPECS } from '../game/campaign';
import { computeContractModifiers } from '../game/contracts';
import { MINE_COOLDOWN_SEC, type AmmoType, type PointOfSail } from '../game/sailingPhysics';
import { formatBindingLabel, type KeyBindings } from '../game/settings';
import { getExtraT } from '../i18n/extraTranslations';
import {
  LANGUAGE_OPTIONS,
  TRANSLATIONS,
  getLanguageMeta,
  type LanguageCode,
} from '../i18n/translations';
import {
  BOSS_HP_THRESHOLDS,
  STREAK_WINDOW_SEC,
  classifyHullDelta,
  dispatchSparkBurst,
  getCrossedBossThresholds,
} from '../game/uiEffects';
import { HARPOON_COOLDOWN_SEC, SMOKE_COOLDOWN_SEC } from '../game/abilities';
import type { HudSnapshot } from '../scene/NavalGymScene';
import { BrassCorners } from './BrassCorners';
import { HeadingChronometerTape } from './HeadingChronometerTape';
import { RollingNumber } from './RollingNumber';

interface GameHudProps {
  hud: HudSnapshot;
  language: LanguageCode;
  doubloons: number;
  bindings: KeyBindings;
  muted: boolean;
  tuningOpen: boolean;
  isFullscreen: boolean;
  onChangeLanguage: (lang: LanguageCode) => void;
  onStepSail: (delta: -1 | 1) => void;
  onSelectAmmo: (ammo: AmmoType) => void;
  onFire: (side: 'port' | 'starboard') => void;
  onTriggerSurge: () => void;
  onTriggerHarpoon: () => void;
  onTriggerSmoke: () => void;
  onTriggerStormWake: () => void;
  onDropMine: () => void;
  onBoard: () => void;
  onInteract: () => void;
  onClearWaypoint: () => void;
  onTouchSteer: (steer: number) => void;
  onToggleTuning: () => void;
  onOpenControls: () => void;
  onOpenChapters: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onReset: () => void;
  onReturnMenu: () => void;
  onPause: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  language,
  doubloons,
  bindings,
  muted,
  tuningOpen,
  isFullscreen,
  onChangeLanguage,
  onStepSail,
  onSelectAmmo,
  onFire,
  onTriggerSurge,
  onTriggerHarpoon,
  onTriggerSmoke,
  onTriggerStormWake,
  onDropMine,
  onBoard,
  onInteract,
  onClearWaypoint,
  onTouchSteer,
  onToggleTuning,
  onOpenControls,
  onOpenChapters,
  onToggleMute,
  onToggleFullscreen,
  onReset,
  onReturnMenu,
  onPause,
}) => {
  const t = TRANSLATIONS[language];
  const et = getExtraT(language);
  const rtl = getLanguageMeta(language).rtl;
  const contractMods = computeContractModifiers(hud.activeContracts);
  const replaceKeyTag = (text: string, code: string) =>
    text.replace(/\[.*?\]/, `[${formatBindingLabel(code)}]`);

  const pointLabels: Record<PointOfSail, string> = {
    irons: t.pointHead,
    close: t.pointClose,
    beam: t.pointBeam,
    broad: t.pointBroad,
    run: t.pointRun,
  };

  const sailPct = `${Math.round(hud.sailLevel * 100)}%`;
  const headingDeg = Math.round(((hud.headingRad * 180) / Math.PI + 360) % 360);
  const windDeg = Math.round(((hud.windAngleRad * 180) / Math.PI + 360) % 360);
  const hpPct = Math.max(0, Math.min(100, Math.round((hud.hullHp / Math.max(1, hud.hullMaxHp)) * 100)));
  const isLowHull = hpPct > 0 && hpPct <= 30;
  const isIdealWind = hud.pointOfSail === 'beam' || hud.pointOfSail === 'broad';
  const portCrestReady = hud.crestReady && hud.portCooldown <= 0.05;
  const stbdCrestReady = hud.crestReady && hud.stbdCooldown <= 0.05;
  const portLockedReady = hud.portTargetInArc && hud.portCooldown <= 0.05;
  const stbdLockedReady = hud.stbdTargetInArc && hud.stbdCooldown <= 0.05;

  const bossBarRef = useRef<HTMLDivElement | null>(null);
  const prevBossRef = useRef<{ hp: number | null; max: number | null }>({
    hp: hud.bossHp,
    max: hud.bossMaxHp,
  });
  const [bossShake, setBossShake] = useState(false);

  const prevCooldownsRef = useRef({
    port: hud.portCooldown,
    stbd: hud.stbdCooldown,
    harpoon: hud.harpoonCooldown,
    smoke: hud.smokeCooldown,
  });
  const portBtnRef = useRef<HTMLButtonElement | null>(null);
  const stbdBtnRef = useRef<HTMLButtonElement | null>(null);
  const [readyFlash, setReadyFlash] = useState({
    port: false,
    stbd: false,
    harpoon: false,
    smoke: false,
  });
  const [recoil, setRecoil] = useState({ port: false, stbd: false });

  const prevHpPctRef = useRef(hpPct);
  const [trailHpPct, setTrailHpPct] = useState(hpPct);
  const [hullHitFlash, setHullHitFlash] = useState(false);
  const [hullHealFlash, setHullHealFlash] = useState(false);

  useEffect(() => {
    const prevHp = prevHpPctRef.current;
    prevHpPctRef.current = hpPct;
    const delta = classifyHullDelta(prevHp, hpPct);
    if (delta === 'none') return;

    if (delta === 'damage') {
      setTrailHpPct(prevHp);
      setHullHitFlash(true);
      if (typeof window !== 'undefined') {
        dispatchSparkBurst(20, window.innerHeight * 0.48, '#FF7256');
        dispatchSparkBurst(window.innerWidth - 20, window.innerHeight * 0.52, '#FFB84D');
      }
      const dropTimer = window.setTimeout(() => setTrailHpPct(hpPct), 150);
      const flashTimer = window.setTimeout(() => setHullHitFlash(false), 430);
      return () => {
        window.clearTimeout(dropTimer);
        window.clearTimeout(flashTimer);
      };
    }

    setTrailHpPct(hpPct);
    setHullHealFlash(true);
    const healTimer = window.setTimeout(() => setHullHealFlash(false), 440);
    return () => window.clearTimeout(healTimer);
  }, [hpPct]);

  useEffect(() => {
    const prev = prevCooldownsRef.current;
    const justFinished: Array<'port' | 'stbd' | 'harpoon' | 'smoke'> = [];
    if (prev.port > 0.05 && hud.portCooldown <= 0.05) justFinished.push('port');
    if (prev.stbd > 0.05 && hud.stbdCooldown <= 0.05) justFinished.push('stbd');
    if (prev.harpoon > 0.05 && hud.harpoonCooldown <= 0.05) justFinished.push('harpoon');
    if (prev.smoke > 0.05 && hud.smokeCooldown <= 0.05) justFinished.push('smoke');

    const portFired = hud.portCooldown > prev.port + 0.25;
    const stbdFired = hud.stbdCooldown > prev.stbd + 0.25;

    prevCooldownsRef.current = {
      port: hud.portCooldown,
      stbd: hud.stbdCooldown,
      harpoon: hud.harpoonCooldown,
      smoke: hud.smokeCooldown,
    };

    const timers: number[] = [];

    if (portFired || stbdFired) {
      setRecoil((cur) => ({
        port: cur.port || portFired,
        stbd: cur.stbd || stbdFired,
      }));
      if (portFired && portBtnRef.current) {
        const rect = portBtnRef.current.getBoundingClientRect();
        dispatchSparkBurst(rect.left + rect.width * 0.25, rect.top + rect.height * 0.5, '#FFD27D');
      }
      if (stbdFired && stbdBtnRef.current) {
        const rect = stbdBtnRef.current.getBoundingClientRect();
        dispatchSparkBurst(rect.right - rect.width * 0.25, rect.top + rect.height * 0.5, '#FFD27D');
      }
      timers.push(
        window.setTimeout(() => {
          setRecoil((cur) => ({
            port: portFired ? false : cur.port,
            stbd: stbdFired ? false : cur.stbd,
          }));
        }, 250),
      );
    }

    if (justFinished.length > 0) {
      setReadyFlash((cur) => {
        const next = { ...cur };
        for (const k of justFinished) next[k] = true;
        return next;
      });
      timers.push(
        window.setTimeout(() => {
          setReadyFlash((cur) => {
            const next = { ...cur };
            for (const k of justFinished) next[k] = false;
            return next;
          });
        }, 500),
      );
    }

    if (timers.length === 0) return;
    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [hud.portCooldown, hud.stbdCooldown, hud.harpoonCooldown, hud.smokeCooldown]);

  useEffect(() => {
    const prev = prevBossRef.current;
    const crossed = getCrossedBossThresholds(prev.hp, prev.max, hud.bossHp, hud.bossMaxHp);
    prevBossRef.current = { hp: hud.bossHp, max: hud.bossMaxHp };

    if (crossed.length === 0) return;
    setBossShake(true);
    const barEl = bossBarRef.current;
    if (barEl) {
      const rect = barEl.getBoundingClientRect();
      crossed.forEach((threshold) => {
        dispatchSparkBurst(
          rect.left + rect.width * threshold,
          rect.top + rect.height * 0.5,
          '#FFE082',
        );
      });
    }
    const timer = window.setTimeout(() => setBossShake(false), 260);
    return () => window.clearTimeout(timer);
  }, [hud.bossHp, hud.bossMaxHp]);

  const reloadMax = Math.max(0.2, hud.reloadMaxTime);
  const portFusePct = Math.max(0, Math.min(100, (1 - hud.portCooldown / reloadMax) * 100));
  const stbdFusePct = Math.max(0, Math.min(100, (1 - hud.stbdCooldown / reloadMax) * 100));
  const harpoonFusePct = Math.max(0, Math.min(100, (1 - hud.harpoonCooldown / HARPOON_COOLDOWN_SEC) * 100));
  const smokeFusePct = Math.max(0, Math.min(100, (1 - hud.smokeCooldown / SMOKE_COOLDOWN_SEC) * 100));
  const mineFusePct = Math.max(0, Math.min(100, (1 - hud.mineCooldown / MINE_COOLDOWN_SEC) * 100));
  const streakPct = Math.max(0, Math.min(100, (hud.comboTimer / STREAK_WINDOW_SEC) * 100));
  const moraleRounded = Math.round(hud.morale);

  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      className="landscape-hud-root pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-2 sm:p-3 lg:p-4"
    >
      {isLowHull && (
        <div
          aria-hidden="true"
          data-testid="low-hull-vignette"
          className="low-hull-vignette pointer-events-none fixed inset-0 z-0"
        />
      )}
      {hullHitFlash && (
        <div
          aria-hidden="true"
          data-testid="hull-hit-rim"
          className="hull-hit-rim pointer-events-none fixed inset-0 z-0"
        />
      )}
      {hud.offscreenTarget && (
        <div
          aria-hidden="true"
          data-testid="offscreen-target-marker"
          className="pointer-events-none fixed z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-100"
          style={{
            left: `${hud.offscreenTarget.xPct}%`,
            top: `${hud.offscreenTarget.yPct}%`,
          }}
        >
          <div
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 shadow-[0_6px_18px_rgba(2,5,16,0.72)] ${
              hud.offscreenTarget.isBoss
                ? 'border-[#FF7B54]/85 bg-[#2A0E12]/88 text-[#FFD27D]'
                : 'border-[#F4C97A]/55 bg-[#090F24]/86 text-[#F7EEDB]'
            }`}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 12 12"
              className="shrink-0"
              style={{ transform: `rotate(${hud.offscreenTarget.angleDeg}deg)` }}
            >
              <polygon
                points="11,6 2,1.5 4.2,6 2,10.5"
                fill={hud.offscreenTarget.isBoss ? '#FF7B54' : '#FFD27D'}
              />
            </svg>
            <span className="font-mono-num text-[9.5px] font-extrabold tracking-tight">
              {hud.offscreenTarget.distMeters}m
            </span>
          </div>
        </div>
      )}
      {/* Top Group: Row + Chronometer Tape + Optional Boss Banner */}
      <div className="landscape-hud-top flex flex-col gap-1.5">
        <div className="landscape-hud-top flex flex-wrap items-start justify-between gap-2 xl:flex-nowrap">
          {/* Top-Left Compass + Speed + Hull + Sails (+ Combo Streak) */}
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div className="landscape-hud-card pointer-events-auto glass-obsidian animate-panel-in flex items-center gap-2.5 rounded-2xl px-3 py-2 sm:gap-3 sm:px-3.5 sm:py-2.5">
          <svg
            width="42"
            height="42"
            viewBox="0 0 44 44"
            role="img"
            aria-label={`${headingDeg}° / ${windDeg}°`}
            className={`landscape-hud-compass shrink-0 transition-all duration-300 sm:h-[44px] sm:w-[44px] ${
              isIdealWind
                ? 'drop-shadow-[0_0_12px_rgba(123,224,255,0.65)]'
                : 'drop-shadow-[0_0_8px_rgba(255,184,77,0.3)]'
            }`}
          >
            <defs>
              <radialGradient id="compassFace" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="#141E42" />
                <stop offset="100%" stopColor="#070B19" />
              </radialGradient>
            </defs>
            <circle
              cx="22"
              cy="22"
              r="20"
              fill="url(#compassFace)"
              stroke={isIdealWind ? '#7BE0FF' : '#F4C97A'}
              strokeOpacity={isIdealWind ? '0.85' : '0.55'}
              strokeWidth={isIdealWind ? '1.8' : '1.5'}
            />
            <circle cx="22" cy="22" r="15.5" fill="none" stroke="#F4C97A" strokeOpacity="0.18" strokeDasharray="2 3" />
            <g transform={`translate(22 22) rotate(${windDeg})`}>
              <polygon points="0,-17 3.8,-8.5 -3.8,-8.5" fill="#70C2FF" />
            </g>
            <g transform={`translate(22 22) rotate(${headingDeg})`}>
              <polygon points="0,-14.5 4.2,6 0,3 -4.2,6" fill="#FFB84D" />
            </g>
            <circle cx="22" cy="22" r="2.6" fill="#FFF7E6" />
          </svg>

          <div className="flex flex-col gap-0.5 sm:gap-1">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono-num text-lg font-extrabold text-[#FFF8EA] sm:text-xl">
                {hud.speedKnots.toFixed(1)}
              </span>
              <span className="text-[11px] font-semibold text-[#D8D0C2] sm:text-xs">{t.knots}</span>
              <span aria-hidden="true" className="text-[#F4C97A]/45">
                ·
              </span>
              <span className="text-[11px] font-bold tracking-wide text-[#84CEFF] sm:text-xs">
                {pointLabels[hud.pointOfSail]}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:gap-2 sm:text-xs">
              <div className="flex items-center gap-1.5" aria-label={t.hull}>
                <span className="landscape-hide font-semibold text-[#D8D0C2]">{t.hull}</span>
                <div
                  className={`h-2.5 w-14 overflow-hidden rounded-full bg-[#070B19] p-[1px] ring-1 transition-shadow duration-200 sm:w-16 ${
                    hullHealFlash
                      ? 'ring-[#54F2A8] shadow-[0_0_12px_rgba(84,242,168,0.65)]'
                      : hullHitFlash
                        ? 'ring-[#FF6B54] shadow-[0_0_12px_rgba(255,107,84,0.65)]'
                        : 'ring-[#F4C97A]/30'
                  }`}
                >
                  <div className="relative h-full w-full overflow-hidden rounded-full">
                    <div
                      data-testid="hull-damage-trail"
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#FFF1C4] to-[#FF7B54] opacity-85 transition-all duration-500 ease-out"
                      style={{ width: `${trailHpPct}%` }}
                    />
                    <div
                      className={`relative h-full rounded-full transition-all duration-150 ${
                        hpPct > 50
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-300 shadow-[0_0_8px_rgba(52,211,153,0.45)]'
                          : hpPct > 25
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-300 shadow-[0_0_8px_rgba(251,191,36,0.45)]'
                            : 'bg-gradient-to-r from-rose-600 to-orange-400 shadow-[0_0_10px_rgba(244,63,94,0.55)]'
                      }`}
                      style={{ width: `${hpPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <span aria-hidden="true" className="hidden text-[#F4C97A]/35 sm:inline">
                ·
              </span>

              <div className="flex items-center gap-1">
                <span className="landscape-hide font-semibold text-[#D8D0C2]">{t.sails}</span>
                <button
                  type="button"
                  aria-label="Sails -"
                  onClick={() => onStepSail(-1)}
                  disabled={hud.sailLevel <= 0}
                  className="btn-premium flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border border-[#F4C97A]/30 bg-gradient-to-b from-[#131C3E] to-[#090E22] text-xs font-bold text-[#F5EAD2] hover:border-[#FFB84D] disabled:opacity-35"
                >
                  −
                </button>
                <span className="font-mono-num min-w-[34px] text-center font-bold text-[#F4C97A]">
                  {sailPct}
                </span>
                <button
                  type="button"
                  aria-label="Sails +"
                  onClick={() => onStepSail(1)}
                  disabled={hud.sailLevel >= 1}
                  className="btn-premium flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border border-[#F4C97A]/30 bg-gradient-to-b from-[#131C3E] to-[#090E22] text-xs font-bold text-[#F5EAD2] hover:border-[#FFB84D] disabled:opacity-35"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          </div>

          {hud.comboStreak >= 2 && (
            <div
              data-testid="combo-streak-badge"
              className="pointer-events-none glass-obsidian-strong animate-panel-in glow-amber relative overflow-hidden rounded-xl border border-[#FFD27D]/60 px-3 py-1.5"
            >
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono-num text-sm font-black text-[#FFE082] sm:text-base">
                  ×{hud.comboStreak}
                </span>
                <span className="text-[10px] font-extrabold tracking-[0.14em] text-[#F4C97A] uppercase">
                  {t.streakLabel}
                </span>
              </div>
              <div className="mt-1 h-[2.5px] w-full overflow-hidden rounded-full bg-[#070B19]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF9838] to-[#FFF2B2] transition-all duration-100"
                  style={{ width: `${streakPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Top-Right Wind Compass, Telemetry & System Actions */}
        <div className="landscape-hud-top pointer-events-auto flex w-full flex-wrap items-center justify-between gap-1.5 sm:w-auto sm:justify-end xl:flex-nowrap">
          {/* Top-Right Dedicated Wind Compass */}
          <div
            data-testid="wind-compass-badge"
            className={`landscape-hud-card glass-obsidian animate-panel-in flex shrink-0 items-center gap-2 rounded-xl border px-2.5 py-1.5 sm:rounded-2xl sm:px-3 sm:py-1.5 ${
              isIdealWind
                ? 'border-[#7BE0FF]/55 shadow-[0_0_12px_rgba(123,224,255,0.28)]'
                : 'border-[#F4C97A]/25'
            }`}
          >
            <svg
              width="34"
              height="34"
              viewBox="0 0 36 36"
              role="img"
              aria-label={`${t.windLabel ?? 'Wind'} ${windDeg}° ${hud.windSpeedKnots} ${t.knots}`}
              className="h-[30px] w-[30px] shrink-0 sm:h-[32px] sm:w-[32px]"
            >
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="#070B19"
                stroke={isIdealWind ? '#7BE0FF' : '#F4C97A'}
                strokeOpacity="0.5"
                strokeWidth="1.4"
              />
              <circle cx="18" cy="18" r="11.5" fill="none" stroke="#7BE0FF" strokeOpacity="0.18" strokeDasharray="2 2.5" />
              <text x="18" y="6.8" textAnchor="middle" fill="#F4C97A" fillOpacity="0.72" fontSize="5" fontWeight="700">
                N
              </text>
              <g transform={`translate(18 18) rotate(${(windDeg + 180) % 360})`} style={{ transition: 'transform 160ms linear' }}>
                <polygon points="0,-12 3.4,-2 0,-4.4 -3.4,-2" fill="#7BE0FF" />
                <line x1="0" y1="-4" x2="0" y2="10.5" stroke="#7BE0FF" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.78" />
                <circle cx="0" cy="0" r="1.9" fill="#FFF8EA" />
              </g>
            </svg>
            <div className="leading-tight">
              <p className="text-[9px] font-bold tracking-[0.12em] text-[#7BE0FF]/90 uppercase sm:text-[10px]">
                {t.windLabel ?? 'Wind'}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="font-mono-num text-xs font-extrabold text-[#FFF7E6] sm:text-sm">
                  {hud.windSpeedKnots}
                </span>
                <span className="text-[10px] font-semibold text-[#D8D0C2]">{t.knots}</span>
                <span className="font-mono-num text-[10px] font-bold text-[#7BE0FF]/85">
                  {windDeg}°
                </span>
              </div>
            </div>
          </div>

          <div className="landscape-hud-card glass-obsidian animate-panel-in flex shrink-0 items-center gap-2 rounded-xl px-2.5 py-1.5 sm:gap-2.5 sm:rounded-2xl sm:px-3.5 sm:py-2">
            <div>
              <p className="text-[9px] font-bold tracking-[0.12em] text-[#F4C97A]/80 uppercase sm:text-[10px]">
                {t.actLabel}
              </p>
              <p className="font-mono-num text-xs font-extrabold text-[#FFD27D] sm:text-sm">
                {hud.playMode === 'endless' ? '∞' : `${hud.act}/3`}
              </p>
            </div>
            <div className="h-6 w-px bg-gradient-to-b from-transparent via-[#F4C97A]/30 to-transparent" />
            <div>
              <p className="text-[9px] font-bold tracking-[0.12em] text-[#F4C97A]/80 uppercase sm:text-[10px]">
                {t.waveLabel}
              </p>
              <p className="font-mono-num text-xs font-extrabold text-[#8CE2FF] sm:text-sm">
                {hud.playMode === 'endless' ? hud.wave : `${hud.wave}/2`}
              </p>
            </div>
            <div className="h-6 w-px bg-gradient-to-b from-transparent via-[#F4C97A]/30 to-transparent" />
            <div>
              <p className="text-[9px] font-bold tracking-[0.12em] text-[#F4C97A]/80 uppercase sm:text-[10px]">
                {t.ships}
              </p>
              <p className="font-mono-num text-xs font-extrabold text-[#FFF7E6] sm:text-sm">
                {hud.sunkCount}/{hud.targetShips}
              </p>
            </div>
            <div className="h-6 w-px bg-gradient-to-b from-transparent via-[#F4C97A]/30 to-transparent" />
            <div>
              <p className="text-[9px] font-bold tracking-[0.12em] text-[#F4C97A]/80 uppercase sm:text-[10px]">
                {t.score}
              </p>
              <p className="font-mono-num text-xs font-extrabold text-[#FFB84D] sm:text-sm">
                <RollingNumber value={hud.score} />
              </p>
            </div>
            <div className="landscape-hide hidden h-6 w-px bg-gradient-to-b from-transparent via-[#F4C97A]/30 to-transparent sm:block" />
            <div data-testid="hud-weather-badge" className="landscape-hide hidden items-center gap-1 text-xs font-bold text-[#9CE6FF] sm:flex">
              {hud.weather === 'calm' ? (
                <Sun className="h-3.5 w-3.5 text-[#FFD27D]" />
              ) : hud.weather === 'tailwind' ? (
                <Wind className="h-3.5 w-3.5 text-[#7BE0FF]" />
              ) : (
                <CloudLightning className="h-3.5 w-3.5 text-[#D98CFF]" />
              )}
              <span>{t[WEATHER_SPECS[hud.weather].labelKey]}</span>
            </div>
            {hud.activeOfficers.length > 0 && (
              <>
                <div className="landscape-hide hidden h-6 w-px bg-gradient-to-b from-transparent via-[#F4C97A]/30 to-transparent md:block" />
                <div className="landscape-hide hidden items-center gap-1 text-xs font-bold text-[#FFD27D] md:flex">
                  <Users className="h-3.5 w-3.5" />
                  <span className="font-mono-num">
                    {hud.activeOfficers.length}/{MAX_ACTIVE_OFFICERS}
                  </span>
                  {hud.surgeonActive && (
                    <span
                      title={et.officerSurgeonName}
                      data-testid="hud-surgeon-badge"
                      className="inline-flex items-center text-emerald-300"
                    >
                      <HeartPulse className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </>
            )}
            {hud.merchantBuffs.purchasesCount > 0 && (
              <>
                <div className="landscape-hide hidden h-6 w-px bg-gradient-to-b from-transparent via-emerald-400/35 to-transparent lg:block" />
                <div
                  data-testid="hud-merchant-buffs-badge"
                  title={et.merchantBuffsActive}
                  className="landscape-hide hidden items-center gap-1 text-xs font-extrabold text-emerald-300 lg:flex"
                >
                  <Store className="h-3.5 w-3.5" />
                  <span className="font-mono-num">×{hud.merchantBuffs.purchasesCount}</span>
                </div>
              </>
            )}
            {hud.activeContracts.length > 0 && (
              <>
                <div className="h-6 w-px bg-gradient-to-b from-transparent via-[#FF7B54]/40 to-transparent" />
                <div
                  data-testid="hud-contracts-badge"
                  className="flex items-center gap-1 text-xs font-extrabold text-[#FF9C7A]"
                >
                  <Skull className="h-3.5 w-3.5 text-[#FF7B54]" />
                  <span className="font-mono-num">+{contractMods.doubloonBonusPct}%</span>
                </div>
              </>
            )}
            <div className="landscape-hide hidden h-6 w-px bg-gradient-to-b from-transparent via-[#F4C97A]/30 to-transparent sm:block" />
            <div
              data-testid="hud-morale-badge"
              tabIndex={-1}
              className="hud-tip-host landscape-hide hidden items-center gap-1 text-xs font-bold sm:flex"
            >
              <HeartHandshake
                className={`h-3.5 w-3.5 ${
                  moraleRounded >= 75
                    ? 'text-emerald-300'
                    : moraleRounded >= 40
                      ? 'text-[#FFD27D]'
                      : 'text-rose-400'
                }`}
              />
              <span
                className={`font-mono-num ${
                  moraleRounded >= 75
                    ? 'text-emerald-300'
                    : moraleRounded >= 40
                      ? 'text-[#FFE082]'
                      : 'text-rose-300'
                }`}
              >
                {moraleRounded}%
              </span>
              <span className="hud-tooltip" style={{ bottom: 'auto', top: 'calc(100% + 8px)' }}>
                {et.moraleLabel} · {moraleRounded >= 75 ? et.moraleHigh : moraleRounded < 40 ? et.moraleLow : `${moraleRounded}%`} — {et.tipMorale}
              </span>
            </div>
            <div className="landscape-hide hidden h-6 w-px bg-gradient-to-b from-transparent via-[#F4C97A]/30 to-transparent sm:block" />
            <div
              data-doubloons-wallet="true"
              className="landscape-hide hidden rounded-lg px-1.5 py-0.5 transition-shadow sm:block"
            >
              <p className="text-[9px] font-bold tracking-[0.12em] text-[#F4C97A]/80 uppercase sm:text-[10px]">
                {t.doubloonsLabel}
              </p>
              <p className="font-mono-num text-xs font-extrabold text-[#FFE082] sm:text-sm">
                <RollingNumber value={doubloons + hud.runDoubloonsBonus} />
              </p>
            </div>
          </div>

          <div className="landscape-hud-card glass-obsidian animate-panel-in flex shrink-0 flex-nowrap items-center gap-0.5 rounded-xl p-1 sm:gap-1 sm:rounded-2xl sm:p-1.5">
            <select
              aria-label={t.languageLabel}
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value as LanguageCode)}
              className="max-w-[58px] cursor-pointer truncate rounded-lg bg-[#0A0F24]/80 px-1.5 py-1 text-[11px] font-semibold text-[#F7EEDB] outline-none lg:max-w-[112px] lg:px-2 lg:py-1.5 lg:text-xs"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code} className="bg-[#0B1024] text-[#F5EAD2]">
                  {opt.shortCode} · {opt.nativeLabel}
                </option>
              ))}
            </select>

            <button
              type="button"
              tabIndex={-1}
              aria-label={t.tuning}
              onClick={onToggleTuning}
              className={`btn-premium flex cursor-pointer items-center gap-1.5 rounded-lg border p-1.5 text-xs font-bold 2xl:px-2.5 ${
                tuningOpen
                  ? 'border-[#FFB84D] bg-gradient-to-b from-[#FFB84D]/25 to-[#D97224]/20 text-[#FFF7E6] glow-amber'
                  : 'border-transparent text-[#E6DEC8] hover:bg-[#17224B]/80'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden 2xl:inline">{t.tuning}</span>
            </button>

            <button
              type="button"
              tabIndex={-1}
              data-testid="hud-chapters-btn"
              aria-label={et.chaptersBtn}
              onClick={onOpenChapters}
              className="btn-premium cursor-pointer rounded-lg p-1.5 text-[#9CE6FF] hover:bg-[#17224B]/80 hover:text-white"
            >
              <MapIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            <button
              type="button"
              tabIndex={-1}
              data-testid="hud-controls-btn"
              aria-label={et.controlsBtn}
              onClick={onOpenControls}
              className="btn-premium cursor-pointer rounded-lg p-1.5 text-[#FFD27D] hover:bg-[#17224B]/80 hover:text-white"
            >
              <Sliders className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={isFullscreen ? t.exitFullscreen : t.fullscreen}
              onClick={onToggleFullscreen}
              className="btn-premium cursor-pointer rounded-lg p-1.5 text-[#E6DEC8] hover:bg-[#17224B]/80 hover:text-white"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={muted ? t.unmute : t.mute}
              onClick={onToggleMute}
              className="btn-premium cursor-pointer rounded-lg p-1.5 text-[#E6DEC8] hover:bg-[#17224B]/80 hover:text-white"
            >
              {muted ? <VolumeX className="h-3.5 w-3.5 text-rose-400 sm:h-4 sm:w-4" /> : <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={t.reset}
              onClick={onReset}
              className="btn-premium cursor-pointer rounded-lg p-1.5 text-[#E6DEC8] hover:bg-[#17224B]/80 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={t.menu}
              onClick={onReturnMenu}
              className="btn-premium cursor-pointer rounded-lg p-1.5 text-[#E6DEC8] hover:bg-[#17224B]/80 hover:text-white"
            >
              <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={t.pause}
              onClick={onPause}
              className="btn-premium cursor-pointer rounded-lg p-1.5 text-[#E6DEC8] hover:bg-[#17224B]/80 hover:text-white"
            >
              <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Centered Sliding Compass Tape & Optional Flagship Galleon Boss HP Banner */}
      <div className="pointer-events-none mx-auto flex w-full max-w-sm flex-col items-center gap-1.5">
        <div className="landscape-hide">
          <HeadingChronometerTape
            headingDeg={headingDeg}
            windDeg={windDeg}
            idealWind={isIdealWind}
          />
        </div>

        {hud.bossHp !== null && hud.bossMaxHp !== null && (
          <div
            className={`landscape-hud-card glass-obsidian-strong animate-panel-in relative w-full rounded-2xl border px-4 py-2.5 ${
              hud.bossEnraged
                ? 'border-[#FF5A42]/85 glow-crimson'
                : 'border-[#FFB84D]/50'
            } ${bossShake ? 'animate-boss-hit' : ''}`}
          >
            <BrassCorners size={11} />
            <div className="mb-1.5 flex items-center justify-between gap-2 text-xs font-extrabold tracking-wide text-[#FFD27D]">
              <div className="flex items-center gap-1.5">
                <span className="font-display tracking-[0.06em]">{t[hud.bossKey]}</span>
                {hud.bossEnraged && (
                  <span
                    data-testid="boss-enraged-tag"
                    className="inline-flex items-center gap-0.5 rounded bg-[#9E1C16]/80 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-[#FFE0C4] uppercase"
                  >
                    <Flame className="h-2.5 w-2.5 text-[#FF8A5C]" />
                    <span>II</span>
                  </span>
                )}
              </div>
              <span className="font-mono-num text-[#FFF7E6]">
                {hud.bossHp}/{hud.bossMaxHp}
              </span>
            </div>
            <div
              ref={bossBarRef}
              className="relative h-2.5 w-full overflow-hidden rounded-full bg-[#070B19] p-[1px] ring-1 ring-[#FFB84D]/40"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#B8241C] via-[#E85B38] to-[#FFD27D] shadow-[0_0_14px_rgba(255,148,56,0.6)] transition-all duration-200"
                style={{
                  width: `${Math.max(0, Math.min(100, (hud.bossHp / Math.max(1, hud.bossMaxHp)) * 100))}%`,
                }}
              />
              {BOSS_HP_THRESHOLDS.map((tick) => (
                <span
                  key={tick}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 w-px bg-[#FFF3C4]/45"
                  style={{ left: `${tick * 100}%` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Plotted Course Waypoint Distance Pill (Desktop, positioned cleanly above tactical radar) */}
      {hud.waypointDistMeters !== null && (
        <div
          data-testid="hud-waypoint-pill"
          className="pointer-events-auto fixed bottom-[126px] left-4 z-20 hidden items-center gap-2 rounded-xl border border-[#FFD27D]/55 bg-[#090E24]/92 px-3 py-1.5 text-xs font-extrabold text-[#FFE082] shadow-[0_8px_22px_rgba(2,5,16,0.72)] md:flex"
        >
          <MapPin className="h-3.5 w-3.5 text-[#FFD27D]" />
          <span className="font-mono-num">
            {et.waypointDistLabel}: {hud.waypointDistMeters}m
          </span>
          <button
            type="button"
            aria-label="Clear waypoint"
            onClick={onClearWaypoint}
            className="btn-premium ml-0.5 cursor-pointer rounded p-0.5 text-[#D8D0C2] hover:bg-white/10 hover:text-white"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Bottom Controls + Mobile Touch Bar */}
      <div className="landscape-hud-bottom flex flex-col items-center gap-2">
        {/* Contextual [G] Wreckage / Floating Merchant Interact CTA */}
        {hud.nearbyInteract !== null && (
          <button
            type="button"
            data-testid="hud-interact-btn"
            data-spark-burst="true"
            onClick={onInteract}
            className={`pointer-events-auto btn-premium sheen-gold flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-xs font-black tracking-wide text-[#FFF8EA] shadow-[0_10px_28px_rgba(2,5,16,0.78)] ${
              hud.nearbyInteract === 'merchant'
                ? 'border-emerald-300/85 bg-gradient-to-r from-[#134A42] via-[#1C6B5B] to-[#94641B]'
                : 'border-[#FFD27D]/90 bg-gradient-to-r from-[#7C3914] via-[#B8541E] to-[#DF8B2B]'
            }`}
          >
            {hud.nearbyInteract === 'merchant' ? (
              <Store className="h-4 w-4 text-emerald-200" />
            ) : (
              <PackageOpen className="h-4 w-4 text-[#FFE082]" />
            )}
            <span>
              {replaceKeyTag(
                hud.nearbyInteract === 'merchant' ? et.merchantPrompt : et.wreckagePrompt,
                bindings.interact,
              )}
            </span>
          </button>
        )}

        {/* Touch Controls (mobile portrait & landscape smartphones) */}
        <div className="touch-controls-bar pointer-events-auto w-full max-w-2xl items-center justify-between gap-2">
          <div className="flex gap-1.5">
            <button
              type="button"
              aria-label={`◀ ${t.touchPort}`}
              onPointerDown={() => onTouchSteer(-1)}
              onPointerUp={() => onTouchSteer(0)}
              onPointerLeave={() => onTouchSteer(0)}
              className="landscape-hud-touch btn-premium glass-obsidian flex items-center gap-1 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#FFF7E6]"
            >
              <ChevronLeft className="h-4 w-4" />
              {t.touchPort}
            </button>
            <button
              type="button"
              aria-label={`${t.touchStbd} ▶`}
              onPointerDown={() => onTouchSteer(1)}
              onPointerUp={() => onTouchSteer(0)}
              onPointerLeave={() => onTouchSteer(0)}
              className="landscape-hud-touch btn-premium glass-obsidian flex items-center gap-1 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#FFF7E6]"
            >
              {t.touchStbd}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {hud.canBoard && (
              <button
                type="button"
                onClick={onBoard}
                className="landscape-hud-touch btn-premium glass-obsidian glow-crimson flex items-center gap-1 rounded-xl border border-[#FFB84D] bg-gradient-to-r from-[#C83228] to-[#DE6A24] px-3 py-2.5 text-xs font-black text-[#FFF7E6]"
              >
                <Swords className="h-3.5 w-3.5" />
                {t.boardBtn}
              </button>
            )}
            <button
              type="button"
              disabled={hud.surgeCooldown > 0.05}
              onClick={onTriggerSurge}
              className="landscape-hud-touch btn-premium glass-obsidian glow-azure rounded-xl border-[#6CD4FF]/50 px-3.5 py-2.5 text-xs font-extrabold text-[#8CE2FF] disabled:opacity-50"
            >
              {hud.surgeCooldown > 0.05 ? `${hud.surgeCooldown.toFixed(1)}s` : t.surgeReady}
            </button>
          </div>
        </div>

        {/* Dynamic Tactical Callout (+ Reactive Officer Combat Bark Badge) */}
        <div
          data-testid="hud-callout-pill"
          className={`landscape-hud-callout glass-obsidian animate-panel-in flex items-center justify-center gap-2 rounded-xl px-4 py-1.5 text-center text-xs font-semibold tracking-wide ${
            hud.calloutSpeaker === 'gunner'
              ? 'border-[#FF7B54]/45 text-[#FFE0C4]'
              : hud.calloutSpeaker === 'bosun'
                ? 'border-emerald-400/45 text-[#CFFFE8]'
                : hud.calloutSpeaker === 'navigator'
                  ? 'border-[#7BE0FF]/45 text-[#D2F4FF]'
                  : 'text-[#F4C97A]'
          }`}
        >
          {hud.calloutSpeaker && (
            <span
              data-testid="officer-bark-badge"
              className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${
                hud.calloutSpeaker === 'gunner'
                  ? 'border-[#FF7B54]/50 bg-[#4A1814]/80 text-[#FFB48A]'
                  : hud.calloutSpeaker === 'bosun'
                    ? 'border-emerald-400/50 bg-[#0F3526]/80 text-emerald-300'
                    : 'border-[#7BE0FF]/50 bg-[#102B4A]/80 text-[#8CE2FF]'
              }`}
            >
              {hud.calloutSpeaker === 'gunner' ? (
                <Crosshair className="h-3 w-3" />
              ) : hud.calloutSpeaker === 'bosun' ? (
                <Coins className="h-3 w-3" />
              ) : (
                <Compass className="h-3 w-3" />
              )}
              <span>
                {hud.calloutSpeaker === 'gunner'
                  ? t.officerGunnerName
                  : hud.calloutSpeaker === 'bosun'
                    ? t.officerBosunName
                    : t.officerNavName}
              </span>
            </span>
          )}
          <span>{hud.callout}</span>
        </div>

        {/* Captain Special Abilities Bar: Harpoon · Phantom Smoke · Storm Wake · Sea Mine */}
        <div
          data-testid="abilities-bar"
          className="landscape-hud-abilities pointer-events-auto glass-obsidian animate-panel-in flex flex-wrap items-center justify-center gap-1 rounded-xl px-1.5 py-1 sm:gap-1.5 sm:rounded-2xl sm:px-2.5 sm:py-1.5"
        >
          <button
            type="button"
            data-testid="ability-harpoon-btn"
            disabled={!hud.harpoonActive && hud.harpoonCooldown > 0.05}
            onClick={onTriggerHarpoon}
            className={`hud-tip-host btn-premium font-mono-num relative flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold whitespace-nowrap transition-all disabled:opacity-65 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs ${
              hud.harpoonActive
                ? 'crest-ready-btn border-[#FFD27D] bg-gradient-to-b from-[#6B3B12]/95 to-[#3D1D08]/95 text-[#FFF7E6]'
                : 'border-[#F4C97A]/35 bg-gradient-to-b from-[#131C3F]/90 to-[#090E22]/90 text-[#F7EEDB] hover:border-[#FFB84D]'
            } ${readyFlash.harpoon ? 'fuse-ready-flash' : ''}`}
          >
            {!hud.harpoonActive && hud.harpoonCooldown > 0.05 && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[2.5px] overflow-hidden rounded-b-lg bg-[#060916]/85"
              >
                <span
                  className="relative block h-full bg-gradient-to-r from-[#C85A18] via-[#FFB84D] to-[#FFF2B2]"
                  style={{ width: `${harpoonFusePct}%` }}
                />
              </span>
            )}
            <Anchor className="h-3 w-3 shrink-0 text-[#FFD27D] sm:h-3.5 sm:w-3.5" />
            <span>
              {hud.harpoonActive
                ? t.harpoonReelBtn
                : hud.harpoonCooldown > 0.05
                  ? `${replaceKeyTag(t.harpoonBtn, bindings.harpoon)} · ${hud.harpoonCooldown.toFixed(1)}s`
                  : replaceKeyTag(t.harpoonBtn, bindings.harpoon)}
            </span>
            <span className="hud-tooltip">{et.tipHarpoon}</span>
          </button>

          <button
            type="button"
            data-testid="ability-smoke-btn"
            disabled={!hud.smokeActive && hud.smokeCooldown > 0.05}
            onClick={onTriggerSmoke}
            className={`hud-tip-host btn-premium font-mono-num relative flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold whitespace-nowrap transition-all disabled:opacity-65 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs ${
              hud.smokeActive
                ? 'border-[#5CE8D8] bg-gradient-to-b from-[#10494A]/95 to-[#09292E]/95 text-[#C6FFF6] shadow-[0_0_16px_rgba(92,232,216,0.45)]'
                : 'border-[#5CE8D8]/35 bg-gradient-to-b from-[#131C3F]/90 to-[#090E22]/90 text-[#D8F9F4] hover:border-[#5CE8D8]'
            } ${readyFlash.smoke ? 'fuse-ready-flash' : ''}`}
          >
            {!hud.smokeActive && hud.smokeCooldown > 0.05 && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[2.5px] overflow-hidden rounded-b-lg bg-[#060916]/85"
              >
                <span
                  className="relative block h-full bg-gradient-to-r from-[#1A7A76] via-[#5CE8D8] to-[#D6FFF8]"
                  style={{ width: `${smokeFusePct}%` }}
                />
              </span>
            )}
            <CloudFog className="h-3 w-3 shrink-0 text-[#6CE8D6] sm:h-3.5 sm:w-3.5" />
            <span>
              {hud.smokeActive
                ? `${replaceKeyTag(t.smokeBtn, bindings.smoke)} · ON`
                : hud.smokeCooldown > 0.05
                  ? `${replaceKeyTag(t.smokeBtn, bindings.smoke)} · ${hud.smokeCooldown.toFixed(1)}s`
                  : replaceKeyTag(t.smokeBtn, bindings.smoke)}
            </span>
            <span className="hud-tooltip">{et.tipSmoke}</span>
          </button>

          <button
            type="button"
            data-testid="ability-storm-btn"
            disabled={!hud.stormWakeActive && hud.stormRage < 100}
            onClick={onTriggerStormWake}
            className={`hud-tip-host btn-premium font-mono-num relative flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-extrabold whitespace-nowrap transition-all sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs ${
              hud.stormWakeActive
                ? 'crest-ready-btn border-[#7BE0FF] bg-gradient-to-r from-[#13426B] via-[#1B5E7A] to-[#8F5914] text-[#FFF8EA] shadow-[0_0_20px_rgba(123,224,255,0.55)]'
                : hud.stormRage >= 100
                  ? 'sheen-gold crest-ready-btn border-[#FFD27D] bg-gradient-to-r from-[#193B68] to-[#8D4F12] text-[#FFF8EA]'
                  : 'border-white/15 bg-[#0A1024]/90 text-[#CBD8EE] disabled:opacity-80'
            }`}
          >
            {!hud.stormWakeActive && hud.stormRage < 100 && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 rounded-l-lg bg-gradient-to-r from-[#3A84D6]/35 to-[#7BE0FF]/45 transition-all duration-200"
                style={{ width: `${Math.max(0, Math.min(100, hud.stormRage))}%` }}
              />
            )}
            <Zap
              className={`relative h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5 ${
                hud.stormWakeActive || hud.stormRage >= 100 ? 'text-[#FFE082]' : 'text-[#7BE0FF]'
              }`}
            />
            <span className="relative">
              {hud.stormWakeActive
                ? `${replaceKeyTag(t.stormWakeBtn, bindings.stormWake)} · ${hud.stormWakeTimer.toFixed(1)}s`
                : hud.stormRage >= 100
                  ? replaceKeyTag(t.stormWakeBtn, bindings.stormWake)
                  : `${replaceKeyTag(t.stormWakeBtn, bindings.stormWake)} · ${hud.stormRage}%`}
            </span>
            <span className="hud-tooltip">{et.tipStorm}</span>
          </button>

          <button
            type="button"
            data-testid="ability-mine-btn"
            disabled={hud.mineCooldown > 0.05}
            onClick={onDropMine}
            className="hud-tip-host btn-premium font-mono-num relative flex cursor-pointer items-center gap-1 rounded-lg border border-[#FF7B54]/45 bg-gradient-to-b from-[#2A1416]/92 to-[#12090C]/92 px-2 py-1 text-[10px] font-bold whitespace-nowrap text-[#FFE0C4] transition-all hover:border-[#FF9C7A] disabled:opacity-65 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs"
          >
            {hud.mineCooldown > 0.05 && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[2.5px] overflow-hidden rounded-b-lg bg-[#060916]/85"
              >
                <span
                  className="relative block h-full bg-gradient-to-r from-[#C83B18] via-[#FF7B54] to-[#FFD27D]"
                  style={{ width: `${mineFusePct}%` }}
                />
              </span>
            )}
            <Skull className="h-3 w-3 shrink-0 text-[#FF8A5C] sm:h-3.5 sm:w-3.5" />
            <span>
              {hud.mineCooldown > 0.05
                ? `${replaceKeyTag(et.mineBtn, bindings.dropMine)} · ${hud.mineCooldown.toFixed(1)}s`
                : replaceKeyTag(et.mineBtn, bindings.dropMine)}
            </span>
            <span className="hud-tooltip">{et.tipMine}</span>
          </button>
        </div>

        {/* Bottom Combat & Swell Console (subtle wave-crest parallax breathing) */}
        <div
          style={{ transform: `translateY(${((hud.crestScore - 0.5) * -3).toFixed(1)}px)` }}
          className="landscape-hud-console pointer-events-auto glass-obsidian-strong animate-panel-in flex flex-wrap items-center justify-center gap-2 rounded-2xl p-2 transition-transform duration-150"
        >
          <button
            ref={portBtnRef}
            type="button"
            data-target-locked={portLockedReady ? 'true' : undefined}
            disabled={hud.portCooldown > 0.05}
            onClick={() => onFire('port')}
            className={`landscape-hud-btn btn-premium font-mono-num relative min-w-[94px] cursor-pointer overflow-hidden rounded-xl border px-3.5 py-2 text-xs font-bold text-[#FFF7E6] hover:border-[#FFB84D] hover:shadow-[0_0_16px_rgba(255,184,77,0.3)] disabled:opacity-65 ${
              portLockedReady
                ? 'border-[#FFD27D] bg-gradient-to-b from-[#4B2910]/95 to-[#221208]/95 shadow-[0_0_18px_rgba(255,196,86,0.45)]'
                : 'border-[#F4C97A]/35 bg-gradient-to-b from-[#131C3F]/95 to-[#090E22]/95'
            } ${portCrestReady ? 'crest-ready-btn' : ''} ${readyFlash.port ? 'fuse-ready-flash' : ''} ${
              recoil.port ? 'btn-recoil-left' : ''
            }`}
          >
            {hud.portCooldown > 0.05 && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-[#060916]/85"
              >
                <span
                  className="relative block h-full bg-gradient-to-r from-[#C85A18] via-[#FFB84D] to-[#FFF2B2]"
                  style={{ width: `${portFusePct}%` }}
                >
                  <span className="absolute top-1/2 -right-0.5 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#FFF7D6] shadow-[0_0_6px_#FFD27D]" />
                </span>
              </span>
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {portLockedReady && <Crosshair className="h-3.5 w-3.5 text-[#FFD27D]" />}
              {hud.portCooldown > 0.05
                ? `${hud.portCooldown.toFixed(1)}s`
                : replaceKeyTag(t.portBtn, bindings.firePort)}
            </span>
          </button>

          <div className="flex flex-wrap items-center justify-center gap-1 rounded-xl border border-white/10 bg-[#060A18]/90 p-1">
            {(
              ['round', 'chain', 'grape', 'incendiary', 'mortar', 'harpoonBolt', 'cursed'] as AmmoType[]
            ).map((type) => {
              const active = hud.ammo === type;
              const label =
                type === 'round'
                  ? replaceKeyTag(t.ammoRound, bindings.ammo1)
                  : type === 'chain'
                    ? replaceKeyTag(t.ammoChain, bindings.ammo2)
                    : type === 'grape'
                      ? replaceKeyTag(t.ammoGrape, bindings.ammo3)
                      : type === 'incendiary'
                        ? replaceKeyTag(et.ammoFire, bindings.ammo4)
                        : type === 'mortar'
                          ? replaceKeyTag(et.ammoMortar, bindings.ammo5)
                          : type === 'harpoonBolt'
                            ? replaceKeyTag(et.ammoHarpoonBolt, bindings.ammo6)
                            : replaceKeyTag(et.ammoCursed, bindings.ammo7);
              const tip =
                type === 'round'
                  ? et.tipRound
                  : type === 'chain'
                    ? et.tipChain
                    : type === 'grape'
                      ? et.tipGrape
                      : type === 'incendiary'
                        ? et.tipFire
                        : type === 'mortar'
                          ? et.tipMortar
                          : type === 'harpoonBolt'
                            ? et.tipHarpoonBolt
                            : et.tipCursed;
              const activeClasses =
                type === 'incendiary'
                  ? 'bg-gradient-to-b from-[#DF6520] to-[#A62916] text-[#FFF7E6] glow-crimson'
                  : type === 'mortar'
                    ? 'bg-gradient-to-b from-[#C87624] to-[#8C3616] text-[#FFF7E6] glow-amber'
                    : type === 'harpoonBolt'
                      ? 'bg-gradient-to-b from-[#1E8A8C] to-[#114A5E] text-[#E6FFFC] shadow-[0_0_14px_rgba(92,232,216,0.45)]'
                      : type === 'cursed'
                        ? 'bg-gradient-to-b from-[#8A3EC8] to-[#4A1C7C] text-[#F9EEFF] shadow-[0_0_14px_rgba(199,125,255,0.5)]'
                        : 'bg-gradient-to-b from-[#D9432F] to-[#A6221B] text-[#FFF7E6] glow-crimson';
              return (
                <button
                  key={type}
                  type="button"
                  data-testid={`ammo-${type}-btn`}
                  aria-pressed={active}
                  onClick={() => onSelectAmmo(type)}
                  className={`hud-tip-host landscape-hud-btn btn-premium cursor-pointer rounded-lg px-2 py-1 text-[11px] font-bold whitespace-nowrap sm:px-2.5 sm:py-1.5 sm:text-xs ${
                    active ? activeClasses : 'text-[#D7CEBE] hover:bg-[#17224B]/80 hover:text-white'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {type === 'incendiary' && <Flame className="h-3 w-3 text-[#FFB84D]" />}
                    {type === 'mortar' && <Bomb className="h-3 w-3 text-[#FFD27D]" />}
                    {type === 'harpoonBolt' && <Anchor className="h-3 w-3 text-[#7BE0FF]" />}
                    {type === 'cursed' && <Sparkles className="h-3 w-3 text-[#D99BFF]" />}
                    {label}
                  </span>
                  <span className="hud-tooltip">{tip}</span>
                </button>
              );
            })}
          </div>

          {/* Swell Crest Meter */}
          <div className="flex min-w-[78px] flex-col gap-1 px-1.5 sm:min-w-[104px] sm:px-2">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className={hud.crestReady ? 'text-[#FFB84D]' : 'text-[#D7CEBE]'}>{t.swell}</span>
              <span className="font-mono-num text-[#FFF7E6]">{Math.round(hud.crestScore * 100)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#070B18] p-[1px] ring-1 ring-white/10">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  hud.crestReady
                    ? 'bg-gradient-to-r from-[#FF9838] to-[#FFE082] shadow-[0_0_10px_#FFB84D]'
                    : 'bg-gradient-to-r from-[#3D76C4] to-[#7CC4FF]'
                }`}
                style={{ width: `${Math.round(hud.crestScore * 100)}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={hud.surgeCooldown > 0.05}
            onClick={onTriggerSurge}
            className="hud-tip-host landscape-hide btn-premium font-mono-num hidden min-w-[110px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#6CD4FF]/45 bg-gradient-to-b from-[#132E54]/95 to-[#0B1C36]/95 px-3.5 py-2 text-xs font-bold text-[#9CE6FF] hover:border-[#9CE6FF] hover:shadow-[0_0_18px_rgba(108,212,255,0.35)] disabled:opacity-45 md:flex"
          >
            <Waves className="h-3.5 w-3.5 shrink-0" />
            <span>
              {hud.surgeCooldown > 0.05
                ? `${hud.surgeCooldown.toFixed(1)}s`
                : /\[.*?\]/.test(t.surge)
                  ? replaceKeyTag(t.surge, bindings.surge)
                  : `${t.surge} [${formatBindingLabel(bindings.surge)}]`}
            </span>
            <span className="hud-tooltip">{et.tipSurge}</span>
          </button>

          {hud.canBoard && (
            <button
              type="button"
              data-spark-burst="true"
              onClick={onBoard}
              className="landscape-hide btn-premium sheen-gold glow-crimson hidden cursor-pointer items-center gap-1.5 rounded-xl border border-[#FFD27D] bg-gradient-to-r from-[#C83228] via-[#DF532B] to-[#E8842E] px-3.5 py-2 text-xs font-black text-[#FFF7E6] md:flex"
            >
              <Swords className="h-3.5 w-3.5 shrink-0" />
              <span>{replaceKeyTag(t.boardBtn, bindings.board)}</span>
            </button>
          )}

          <button
            ref={stbdBtnRef}
            type="button"
            data-target-locked={stbdLockedReady ? 'true' : undefined}
            disabled={hud.stbdCooldown > 0.05}
            onClick={() => onFire('starboard')}
            className={`landscape-hud-btn btn-premium font-mono-num relative min-w-[94px] cursor-pointer overflow-hidden rounded-xl border px-3.5 py-2 text-xs font-bold text-[#FFF7E6] hover:border-[#FFB84D] hover:shadow-[0_0_16px_rgba(255,184,77,0.3)] disabled:opacity-65 ${
              stbdLockedReady
                ? 'border-[#FFD27D] bg-gradient-to-b from-[#4B2910]/95 to-[#221208]/95 shadow-[0_0_18px_rgba(255,196,86,0.45)]'
                : 'border-[#F4C97A]/35 bg-gradient-to-b from-[#131C3F]/95 to-[#090E22]/95'
            } ${stbdCrestReady ? 'crest-ready-btn' : ''} ${readyFlash.stbd ? 'fuse-ready-flash' : ''} ${
              recoil.stbd ? 'btn-recoil-right' : ''
            }`}
          >
            {hud.stbdCooldown > 0.05 && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-[#060916]/85"
              >
                <span
                  className="relative block h-full bg-gradient-to-r from-[#C85A18] via-[#FFB84D] to-[#FFF2B2]"
                  style={{ width: `${stbdFusePct}%` }}
                >
                  <span className="absolute top-1/2 -right-0.5 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#FFF7D6] shadow-[0_0_6px_#FFD27D]" />
                </span>
              </span>
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {stbdLockedReady && <Crosshair className="h-3.5 w-3.5 text-[#FFD27D]" />}
              {hud.stbdCooldown > 0.05
                ? `${hud.stbdCooldown.toFixed(1)}s`
                : replaceKeyTag(t.stbdBtn, bindings.fireStbd)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
