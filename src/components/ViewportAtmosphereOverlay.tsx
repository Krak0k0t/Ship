import React from 'react';
import type { WeatherId } from '../game/campaign';
import type { SceneMode } from '../scene/NavalGymScene';

interface ViewportAtmosphereOverlayProps {
  mode: SceneMode;
  weather: WeatherId;
  speedKnots: number;
  crestReady: boolean;
  smokeActive: boolean;
  stormWakeActive: boolean;
}

const SQUALL_DROPS = [
  { left: '6%', top: '18%', delay: '0s', duration: '2.9s', scale: 1 },
  { left: '13%', top: '42%', delay: '0.9s', duration: '3.4s', scale: 0.85 },
  { left: '91%', top: '22%', delay: '0.4s', duration: '3.1s', scale: 1.05 },
  { left: '84%', top: '52%', delay: '1.3s', duration: '2.8s', scale: 0.9 },
  { left: '22%', top: '76%', delay: '1.8s', duration: '3.3s', scale: 0.8 },
  { left: '76%', top: '78%', delay: '0.7s', duration: '3.2s', scale: 0.95 },
];

const WIND_STREAKS = [
  { side: 'left' as const, top: '24%', delay: '0s', width: '92px' },
  { side: 'left' as const, top: '58%', delay: '0.45s', width: '74px' },
  { side: 'right' as const, top: '32%', delay: '0.2s', width: '88px' },
  { side: 'right' as const, top: '67%', delay: '0.7s', width: '78px' },
];

export const ViewportAtmosphereOverlay: React.FC<ViewportAtmosphereOverlayProps> = ({
  mode,
  weather,
  speedKnots,
  crestReady,
  smokeActive,
  stormWakeActive,
}) => {
  const isPlaying = mode === 'playing';
  const speedRatio = isPlaying ? Math.max(0, Math.min(1, (speedKnots - 6.5) / 8.5)) : 0;
  const streakOpacity = isPlaying
    ? stormWakeActive
      ? 0.72
      : Math.max(crestReady ? 0.36 : 0, speedRatio * 0.42)
    : 0;
  const isSquall = isPlaying && weather === 'squall';

  return (
    <div
      aria-hidden="true"
      data-testid="viewport-atmosphere"
      className="pointer-events-none fixed inset-0 z-[5] overflow-hidden"
    >
      {/* Subtle Spyglass Vignette & Fine Brass Chart Perimeter */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 58%, rgba(4, 7, 18, 0.36) 88%, rgba(3, 5, 14, 0.62) 100%)',
        }}
      />

      {isPlaying && smokeActive && (
        <div
          data-testid="smoke-veil-overlay"
          className="smoke-veil-vignette absolute inset-0 transition-opacity duration-300"
        />
      )}

      {isPlaying && stormWakeActive && (
        <div
          data-testid="storm-wake-overlay"
          className="storm-wake-rim absolute inset-0 transition-opacity duration-200"
        />
      )}

      <div className="absolute inset-2.5 rounded-2xl border border-[#F4C97A]/[0.11] sm:inset-3.5" />

      {/* Top & Bottom Cardinal Bearing Hairlines */}
      <div className="absolute inset-x-1/2 top-2.5 flex -translate-x-1/2 items-center gap-6 opacity-30 sm:top-3.5">
        <span className="h-1.5 w-px bg-[#F4C97A]" />
        <span className="h-2.5 w-px bg-[#FFD27D]" />
        <span className="h-1.5 w-px bg-[#F4C97A]" />
      </div>
      <div className="absolute inset-x-1/2 bottom-2.5 flex -translate-x-1/2 items-center gap-6 opacity-30 sm:bottom-3.5">
        <span className="h-1.5 w-px bg-[#F4C97A]" />
        <span className="h-2.5 w-px bg-[#FFD27D]" />
        <span className="h-1.5 w-px bg-[#F4C97A]" />
      </div>

      {/* High-Speed / Swell Crest / Storm Wake Edge Wind Streaks */}
      {streakOpacity > 0.04 && (
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{ opacity: streakOpacity }}
        >
          {WIND_STREAKS.map((st, idx) => (
            <span
              key={idx}
              className="animate-wind-streak absolute h-[1.5px] rounded-full"
              style={{
                top: st.top,
                width: stormWakeActive ? '128px' : st.width,
                left: st.side === 'left' ? '14px' : undefined,
                right: st.side === 'right' ? '14px' : undefined,
                animationDelay: st.delay,
                background:
                  crestReady || stormWakeActive
                    ? 'linear-gradient(90deg, transparent, rgba(255, 210, 125, 0.9), rgba(123, 224, 255, 0.85), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(123, 224, 255, 0.7), transparent)',
              }}
            />
          ))}
        </div>
      )}

      {/* Silky Bottom-Edge Drifting Twilight Sea Mist */}
      <div
        data-testid="edge-sea-mist"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 overflow-hidden sm:h-36"
      >
        <div
          className="animate-mist-slow absolute -inset-x-16 bottom-0 h-full opacity-75 transition-opacity duration-500"
          style={{
            background: stormWakeActive
              ? 'radial-gradient(60% 90% at 30% 100%, rgba(123, 224, 255, 0.16), transparent 72%), radial-gradient(55% 85% at 75% 100%, rgba(255, 206, 112, 0.12), transparent 70%)'
              : crestReady
                ? 'radial-gradient(60% 90% at 32% 100%, rgba(255, 200, 98, 0.14), transparent 72%), radial-gradient(55% 85% at 72% 100%, rgba(112, 194, 255, 0.11), transparent 70%)'
                : 'radial-gradient(60% 90% at 30% 100%, rgba(102, 164, 236, 0.1), transparent 72%), radial-gradient(55% 85% at 75% 100%, rgba(255, 184, 77, 0.06), transparent 70%)',
          }}
        />
        <div
          className="animate-mist-reverse absolute -inset-x-16 bottom-0 h-20 opacity-65 sm:h-24"
          style={{
            background:
              'radial-gradient(50% 85% at 52% 100%, rgba(132, 196, 255, 0.08), transparent 72%)',
          }}
        />
      </div>

      {/* Squall Lens Spray Droplets (Outer Margin Only) */}
      {isSquall && (
        <div className="absolute inset-0">
          {SQUALL_DROPS.map((drop, idx) => (
            <span
              key={idx}
              className="animate-lens-drop absolute h-3.5 w-2 rounded-full border border-[#CBEFFF]/35 bg-[#8CE2FF]/15 shadow-[0_0_8px_rgba(140,226,255,0.22)]"
              style={{
                left: drop.left,
                top: drop.top,
                animationDelay: drop.delay,
                animationDuration: drop.duration,
                transform: `scale(${drop.scale})`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
