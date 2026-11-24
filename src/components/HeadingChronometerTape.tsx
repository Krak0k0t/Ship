import React from 'react';
import { buildHeadingTicks, computeWindTapeOffsets } from '../game/uiEffects';

interface HeadingChronometerTapeProps {
  headingDeg: number;
  windDeg: number;
  idealWind: boolean;
}

export const HeadingChronometerTape: React.FC<HeadingChronometerTapeProps> = ({
  headingDeg,
  windDeg,
  idealWind,
}) => {
  const ticks = buildHeadingTicks(headingDeg, 130, 15);
  const { windXPct, windVisible, sweetSpotsXPct } = computeWindTapeOffsets(
    headingDeg,
    windDeg,
    130,
  );

  return (
    <div
      aria-hidden="true"
      data-testid="heading-chronometer-tape"
      className="pointer-events-none relative mx-auto flex h-9 w-64 items-center overflow-hidden rounded-full border border-[#F4C97A]/35 bg-[#070B1A]/90 px-2 shadow-[0_6px_18px_rgba(2,5,16,0.6),inset_0_1px_0_rgba(255,228,174,0.18)] sm:w-80"
      style={{
        maskImage:
          'linear-gradient(90deg, transparent 0%, black 14%, black 86%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(90deg, transparent 0%, black 14%, black 86%, transparent 100%)',
      }}
    >
      {/* Top center brass lubber needle */}
      <span
        className={`absolute top-0 left-1/2 z-20 h-2.5 w-[2px] -translate-x-1/2 rounded-b-full transition-colors ${
          idealWind ? 'bg-[#7BE0FF] shadow-[0_0_8px_#7BE0FF]' : 'bg-[#FFD27D]'
        }`}
      />

      {/* Ideal wind sweet-spot tack gold notches */}
      {sweetSpotsXPct.map((xp, idx) => (
        <span
          key={idx}
          className="absolute top-0 h-1.5 w-2.5 -translate-x-1/2 rounded-b-sm bg-[#FFD27D]/75 shadow-[0_0_6px_rgba(255,210,125,0.6)]"
          style={{ left: `${xp}%` }}
        />
      ))}

      {/* Wind bearing diamond */}
      {windVisible && (
        <span
          className="absolute top-1 z-10 h-2 w-2 -translate-x-1/2 rotate-45 border border-[#FFF7E6]/70 bg-[#70C2FF] shadow-[0_0_8px_rgba(112,194,255,0.85)]"
          style={{ left: `${windXPct}%` }}
        />
      )}

      {/* Sliding degree ticks & cardinals */}
      {ticks.map((tick) => (
        <div
          key={tick.deg}
          className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${tick.xPct}%` }}
        >
          <span
            className={`w-px ${
              tick.cardinal
                ? 'h-2.5 bg-[#FFD27D]/85'
                : tick.major
                  ? 'h-2 bg-[#F4C97A]/50'
                  : 'h-1.5 bg-[#F4C97A]/28'
            }`}
          />
          {tick.cardinal && (
            <span className="mt-0.5 text-[8px] leading-none font-black tracking-wider text-[#F4C97A]/95">
              {tick.cardinal}
            </span>
          )}
        </div>
      ))}

      {/* Bottom center heading degree badge (clear of cardinal rail) */}
      <span className="font-mono-num absolute bottom-0.5 left-1/2 z-20 -translate-x-1/2 rounded-full border border-[#F4C97A]/25 bg-[#070B1A]/90 px-1.5 py-[1px] text-[8.5px] leading-none font-extrabold tracking-wider text-[#FFF7E6]">
        {String(Math.round(headingDeg) % 360).padStart(3, '0')}°
      </span>
    </div>
  );
};
