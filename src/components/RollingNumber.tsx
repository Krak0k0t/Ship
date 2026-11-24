import React, { useEffect, useRef, useState } from 'react';

interface RollingNumberProps {
  value: number;
  className?: string;
}

export const RollingNumber: React.FC<RollingNumberProps> = ({ value, className = '' }) => {
  const [display, setDisplay] = useState(value);
  const [popping, setPopping] = useState(false);
  const fromRef = useRef(value);
  const displayRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const startVal = displayRef.current;
    if (startVal === value) return;

    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }

    fromRef.current = startVal;
    setPopping(true);
    const startTime = performance.now();
    const duration = 340;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(fromRef.current + (value - fromRef.current) * eased);
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPopping(false);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return (
    <span
      className={`inline-block transition-transform duration-200 ${
        popping ? 'scale-110 text-[#FFE8A3]' : 'scale-100'
      } ${className}`}
    >
      {display}
    </span>
  );
};
