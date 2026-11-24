import React from 'react';
import { AstrolabeCrest } from './AstrolabeCrest';

interface CeremonialBannerProps {
  id: number;
  kicker: string;
  title: string;
  accent?: 'gold' | 'azure' | 'crimson';
}

export const CeremonialBanner: React.FC<CeremonialBannerProps> = ({
  id,
  kicker,
  title,
  accent = 'gold',
}) => {
  const accentColor =
    accent === 'azure' ? '#8CE2FF' : accent === 'crimson' ? '#FF8B6A' : '#FFD27D';

  return (
    <div
      key={id}
      aria-live="polite"
      className="landscape-banner pointer-events-none absolute inset-x-0 top-20 z-30 flex justify-center px-4 sm:top-24"
    >
      <div className="animate-banner-in banner-foil-sweep relative flex max-w-md flex-col items-center overflow-hidden rounded-2xl border border-[#F4C97A]/35 bg-[#060916]/92 px-8 py-3.5 text-center shadow-[0_14px_38px_rgba(2,4,14,0.78),inset_0_1px_0_rgba(255,224,158,0.22)]">
        <AstrolabeCrest
          color={accentColor}
          className="absolute top-1/2 left-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 opacity-[0.16]"
        />
        <div className="relative z-10 mb-1 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="banner-foil-line h-px w-12 bg-gradient-to-r from-transparent to-[#F4C97A]/80"
          />
          <span
            className="text-[10px] font-extrabold tracking-[0.22em] uppercase"
            style={{ color: accentColor }}
          >
            {kicker}
          </span>
          <span
            aria-hidden="true"
            className="banner-foil-line h-px w-12 bg-gradient-to-l from-transparent to-[#F4C97A]/80"
          />
        </div>
        <h2
          className="font-display relative z-10 text-lg font-black tracking-[0.06em] text-[#FFF8EA] sm:text-xl"
          style={{ textShadow: '0 2px 16px rgba(255, 184, 77, 0.35)' }}
        >
          {title}
        </h2>
      </div>
    </div>
  );
};
