import React from 'react';

interface AstrolabeCrestProps {
  className?: string;
  color?: string;
  reverse?: boolean;
}

export const AstrolabeCrest: React.FC<AstrolabeCrestProps> = ({
  className = 'h-48 w-48',
  color = '#FFD27D',
  reverse = false,
}) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 120 120"
    fill="none"
    className={`${reverse ? 'animate-compass-reverse' : 'animate-compass-slow'} pointer-events-none select-none ${className}`}
  >
    <circle cx="60" cy="60" r="54" stroke={color} strokeWidth="0.9" strokeOpacity="0.5" strokeDasharray="3 4" />
    <circle cx="60" cy="60" r="44" stroke={color} strokeWidth="1" strokeOpacity="0.65" />
    <circle cx="60" cy="60" r="28" stroke={color} strokeWidth="0.8" strokeOpacity="0.45" />
    <circle cx="60" cy="60" r="6" stroke={color} strokeWidth="1.2" strokeOpacity="0.8" />
    {/* Cardinal compass points */}
    <path
      d="M60 6 L64.5 52 L60 60 L55.5 52 Z M60 114 L64.5 68 L60 60 L55.5 68 Z M6 60 L52 55.5 L60 60 L52 64.5 Z M114 60 L68 55.5 L60 60 L68 64.5 Z"
      fill={color}
      fillOpacity="0.5"
    />
    {/* Ordinal rays */}
    <path
      d="M21 21 L54 54 L60 60 L56 50 Z M99 21 L66 54 L60 60 L70 56 Z M99 99 L66 66 L60 60 L64 70 Z M21 99 L54 66 L60 60 L50 64 Z"
      stroke={color}
      strokeWidth="0.85"
      strokeOpacity="0.55"
    />
    {/* Degree ticks around rim */}
    <path
      d="M60 10 v4 M60 106 v4 M10 60 h4 M106 60 h4 M24.6 24.6 l3 3 M92.4 92.4 l3 3 M95.4 24.6 l-3 3 M27.6 92.4 l-3 3"
      stroke={color}
      strokeWidth="1.1"
      strokeOpacity="0.7"
    />
  </svg>
);
