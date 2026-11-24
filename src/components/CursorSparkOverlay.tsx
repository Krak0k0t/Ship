import React, { useEffect, useRef } from 'react';
import { sampleQuadraticBezier } from '../game/uiEffects';

interface CursorSparkOverlayProps {
  trailEnabled: boolean;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  maxLife: number;
  color: string;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  maxR: number;
  life: number;
  maxLife: number;
  color: string;
}

interface Ember {
  x: number;
  y: number;
  r: number;
  vy: number;
  swayPhase: number;
  swayAmp: number;
  alpha: number;
  color: string;
}

interface CoinArc {
  p0x: number;
  p0y: number;
  cx: number;
  cy: number;
  p1x: number;
  p1y: number;
  progress: number;
  duration: number;
  delay: number;
  spinPhase: number;
}

function findWalletTarget(): { el: HTMLElement | null; x: number; y: number } {
  const candidates = document.querySelectorAll<HTMLElement>('[data-doubloons-wallet="true"]');
  for (let i = candidates.length - 1; i >= 0; i -= 1) {
    const el = candidates[i];
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return { el, x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 };
    }
  }
  return {
    el: null,
    x: window.innerWidth * 0.88,
    y: 44,
  };
}

export const CursorSparkOverlay: React.FC<CursorSparkOverlayProps> = ({ trailEnabled }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trailRef = useRef(trailEnabled);
  trailRef.current = trailEnabled;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sparks: Spark[] = [];
    const ripples: Ripple[] = [];
    const coinArcs: CoinArc[] = [];
    const embers: Ember[] = Array.from({ length: 18 }, (_, idx) => {
      const marginLeft = idx % 2 === 0;
      const x = marginLeft
        ? Math.random() * window.innerWidth * 0.22
        : window.innerWidth * (0.78 + Math.random() * 0.22);
      return {
        x,
        y: Math.random() * window.innerHeight,
        r: 2.2 + Math.random() * 3.4,
        vy: 11 + Math.random() * 16,
        swayPhase: Math.random() * Math.PI * 2,
        swayAmp: 7 + Math.random() * 13,
        alpha: 0.14 + Math.random() * 0.22,
        color: idx % 3 === 0 ? '#7BE0FF' : idx % 2 === 0 ? '#FFD27D' : '#FFAE52',
      };
    });

    let pointerX = -9999;
    let pointerY = -9999;
    let rafId: number | null = null;
    let lastTime = performance.now();
    let lastMoveSpawn = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const startLoop = () => {
      if (rafId !== null) return;
      lastTime = performance.now();
      rafId = requestAnimationFrame(loop);
    };

    const pulseWallet = (el: HTMLElement | null) => {
      if (!el) return;
      el.classList.remove('is-wallet-pulsing');
      // Force reflow only on discrete arrival tick so consecutive pickups retrigger smoothly.
      void el.offsetWidth;
      el.classList.add('is-wallet-pulsing');
      window.setTimeout(() => {
        el.classList.remove('is-wallet-pulsing');
      }, 420);
    };

    const spawnBurst = (x: number, y: number, count: number, color = '#FFD27D', ripple = true) => {
      if (ripple) {
        ripples.push({ x, y, r: 4, maxR: 32, life: 0.38, maxLife: 0.38, color });
      }
      for (let i = 0; i < count; i += 1) {
        if (sparks.length >= 72) sparks.shift();
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
        const speed = 42 + Math.random() * 88;
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 18,
          r: 1.5 + Math.random() * 1.8,
          life: 0.36 + Math.random() * 0.24,
          maxLife: 0.55,
          color,
        });
      }
      startLoop();
    };

    const spawnCoinArcs = (fromX: number, fromY: number, count = 5) => {
      const target = findWalletTarget();
      const total = Math.max(2, Math.min(8, count));
      for (let i = 0; i < total; i += 1) {
        if (coinArcs.length >= 18) coinArcs.shift();
        const spreadX = (Math.random() - 0.5) * 44;
        const spreadY = (Math.random() - 0.5) * 28;
        const midX = (fromX + target.x) * 0.5 + (Math.random() - 0.5) * 120;
        const midY = Math.min(fromY, target.y) - (55 + Math.random() * 75);
        coinArcs.push({
          p0x: fromX + spreadX,
          p0y: fromY + spreadY,
          cx: midX,
          cy: midY,
          p1x: target.x,
          p1y: target.y,
          progress: 0,
          duration: 0.56 + i * 0.055,
          delay: i * 0.055,
          spinPhase: Math.random() * Math.PI * 2,
        });
      }
      startLoop();
    };

    const onPointerMove = (e: PointerEvent) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (!trailRef.current || e.pointerType === 'touch') return;
      const now = performance.now();
      if (now - lastMoveSpawn < 32) return;
      lastMoveSpawn = now;
      if (sparks.length >= 64) sparks.shift();
      sparks.push({
        x: e.clientX + (Math.random() - 0.5) * 4,
        y: e.clientY + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 20,
        vy: 14 + Math.random() * 18,
        r: 1.2 + Math.random() * 1.4,
        life: 0.38,
        maxLife: 0.38,
        color: Math.random() > 0.35 ? '#FFD27D' : '#FFF4C8',
      });
      startLoop();
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest('button, [role="button"]');
      if (!btn) return;
      const isHeavy = btn.hasAttribute('data-spark-burst');
      spawnBurst(e.clientX, e.clientY, isHeavy ? 14 : 6, isHeavy ? '#FFE082' : '#F4C97A', true);
    };

    const onCustomBurst = (e: Event) => {
      const custom = e as CustomEvent<{ x: number; y: number; color?: string }>;
      if (!custom.detail) return;
      spawnBurst(custom.detail.x, custom.detail.y, 14, custom.detail.color ?? '#FFD27D', true);
    };

    const onCustomCoinFly = (e: Event) => {
      const custom = e as CustomEvent<{ fromX: number; fromY: number; count?: number }>;
      if (!custom.detail) return;
      spawnCoinArcs(custom.detail.fromX, custom.detail.fromY, custom.detail.count ?? 5);
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // 1. Ambient twilight bokeh embers (richer on Title/Modals, soft margin fireflies during voyage)
      const w = canvas.width;
      const h = canvas.height;
      const activeEmberCount = trailRef.current ? embers.length : 10;
      for (let i = 0; i < activeEmberCount; i += 1) {
        const em = embers[i];
        em.swayPhase += dt * 1.25;
        em.y -= em.vy * dt;
        let driftX = Math.sin(em.swayPhase) * em.swayAmp * dt;

        // Subtle cursor breeze push
        const dx = em.x - pointerX;
        const dy = em.y - pointerY;
        const distSq = dx * dx + dy * dy;
        if (distSq > 4 && distSq < 110 * 110) {
          const push = (1 - Math.sqrt(distSq) / 110) * 65 * dt;
          driftX += (dx / Math.sqrt(distSq)) * push;
        }

        em.x += driftX;
        if (em.y < -14) {
          em.y = h + 12;
          em.x = trailRef.current
            ? Math.random() * w
            : i % 2 === 0
              ? Math.random() * w * 0.22
              : w * (0.78 + Math.random() * 0.22);
        }
        if (em.x < -14) em.x = w + 8;
        if (em.x > w + 14) em.x = -8;

        const glowPulse = 0.72 + Math.sin(em.swayPhase * 1.7) * 0.28;
        const baseAlpha = em.alpha * glowPulse * (trailRef.current ? 1 : 0.65);

        // Soft outer bokeh halo + crisp bright core
        ctx.globalAlpha = baseAlpha * 0.38;
        ctx.fillStyle = em.color;
        ctx.beginPath();
        ctx.arc(em.x, em.y, em.r * 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = baseAlpha;
        ctx.beginPath();
        ctx.arc(em.x, em.y, em.r * 0.72, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Click / Event Ripples
      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const rp = ripples[i];
        rp.life -= dt;
        const prog = 1 - Math.max(0, rp.life / rp.maxLife);
        const radius = rp.r + (rp.maxR - rp.r) * prog;
        ctx.globalAlpha = Math.max(0, 1 - prog) * 0.65;
        ctx.strokeStyle = rp.color;
        ctx.lineWidth = 1.6 * (1 - prog * 0.5);
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        if (rp.life <= 0) ripples.splice(i, 1);
      }

      // 3. Sparks & Coin Trail Particles
      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const sp = sparks[i];
        sp.life -= dt;
        sp.vy += 46 * dt;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        const alpha = Math.max(0, sp.life / sp.maxLife);
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r * (0.45 + alpha * 0.55), 0, Math.PI * 2);
        ctx.fill();
        if (sp.life <= 0) sparks.splice(i, 1);
      }

      // 4. Fly-to-Wallet Gold Doubloon Arcs
      for (let i = coinArcs.length - 1; i >= 0; i -= 1) {
        const coin = coinArcs[i];
        if (coin.delay > 0) {
          coin.delay -= dt;
          continue;
        }
        coin.progress += dt / coin.duration;
        coin.spinPhase += dt * 16;

        if (coin.progress >= 1) {
          const target = findWalletTarget();
          spawnBurst(target.x, target.y, 5, '#FFE082', false);
          pulseWallet(target.el);
          coinArcs.splice(i, 1);
          continue;
        }

        const ease = 1 - Math.pow(1 - coin.progress, 2.2);
        const pos = sampleQuadraticBezier(
          coin.p0x,
          coin.p0y,
          coin.cx,
          coin.cy,
          coin.p1x,
          coin.p1y,
          ease,
        );

        if (Math.random() < 0.45 && sparks.length < 72) {
          sparks.push({
            x: pos.x,
            y: pos.y,
            vx: (Math.random() - 0.5) * 18,
            vy: (Math.random() - 0.5) * 18,
            r: 1.4,
            life: 0.24,
            maxLife: 0.24,
            color: '#FFE69C',
          });
        }

        const spinScaleX = Math.max(0.28, Math.abs(Math.cos(coin.spinPhase)));
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.scale(spinScaleX, 1);
        ctx.globalAlpha = 0.94;
        ctx.fillStyle = '#FFB84D';
        ctx.beginPath();
        ctx.arc(0, 0, 6.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFF5C4';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();

      rafId = requestAnimationFrame(loop);
    };

    startLoop();

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('blackpennant:burst', onCustomBurst);
    window.addEventListener('blackpennant:coin-fly', onCustomCoinFly);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('blackpennant:burst', onCustomBurst);
      window.removeEventListener('blackpennant:coin-fly', onCustomCoinFly);
    };
  }, []);

  useEffect(() => {
    if (!trailEnabled) return;
    // Nudge RAF awake cleanly if transitioning back into Title/Modal view
    window.dispatchEvent(
      new CustomEvent('blackpennant:burst', {
        detail: { x: -100, y: -100, color: 'transparent' },
      }),
    );
  }, [trailEnabled]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
};
