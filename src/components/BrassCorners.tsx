import React from 'react';

interface BrassCornersProps {
  tone?: 'gold' | 'azure';
  size?: number;
}

export const BrassCorners: React.FC<BrassCornersProps> = ({ tone = 'gold', size = 14 }) => {
  const stroke = tone === 'azure' ? '#7BE0FF' : '#F4C97A';
  const corners = [
    'top-2 left-2',
    'top-2 right-2 rotate-90',
    'bottom-2 right-2 rotate-180',
    'bottom-2 left-2 -rotate-90',
  ];

  return (
    <>
      {corners.map((pos) => (
        <svg
          key={pos}
          aria-hidden="true"
          width={size}
          height={size}
          viewBox="0 0 16 16"
          fill="none"
          className={`pointer-events-none absolute ${pos} opacity-65`}
        >
          <path
            d="M1.5 11.5 V2.5 H10.5 M1.5 5.5 H5.5 V1.5"
            stroke={stroke}
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="2.5" cy="2.5" r="1" fill={stroke} />
        </svg>
      ))}
    </>
  );
};
