import * as THREE from 'three';

const textureCache = new Map<string, THREE.CanvasTexture>();
const mapPairCache = new Map<string, { bumpMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture }>();

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  return [canvas, ctx];
}

function seededRand(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 10000) / 10000;
  };
}

export function createEngravedSeaTexture(): THREE.CanvasTexture {
  const key = 'sea-twilight-indigo';
  const cached = textureCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#12294F';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 16; i += 1) {
    const y = (i / 16) * 512;
    const band = ctx.createLinearGradient(0, y, 0, y + 32);
    band.addColorStop(0, 'rgba(36, 86, 152, 0)');
    band.addColorStop(0.5, 'rgba(48, 108, 182, 0.30)');
    band.addColorStop(1, 'rgba(18, 42, 88, 0)');
    ctx.fillStyle = band;
    ctx.fillRect(0, y, 512, 32);
  }

  ctx.strokeStyle = 'rgba(130, 194, 248, 0.25)';
  ctx.lineWidth = 1.25;
  for (let row = 0; row < 40; row += 1) {
    const yBase = (row + 0.5) * (512 / 40);
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 16) {
      const y = yBase + Math.sin((x / 512) * Math.PI * 4 + row * 0.7) * 3.0;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(244, 201, 122, 0.13)';
  ctx.lineWidth = 1;
  for (let g = 64; g < 512; g += 128) {
    ctx.beginPath();
    ctx.moveTo(g, 0);
    ctx.lineTo(g, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, g);
    ctx.lineTo(512, g);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 16);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

export function createEngravedOakTexture(tint: string): THREE.CanvasTexture {
  const key = `oak-${tint}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(256, 256);
  const rand = seededRand(419);
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, tint);
  grad.addColorStop(0.72, '#3d281d');
  grad.addColorStop(1, '#1d393d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle plank tonal variation & edge bevel highlights
  for (let y = 0; y < 256; y += 32) {
    ctx.fillStyle = `rgba(255, 220, 180, ${(0.03 + rand() * 0.06).toFixed(3)})`;
    ctx.fillRect(0, y + 2, 256, 3);
    ctx.fillStyle = `rgba(10, 6, 4, ${(0.08 + rand() * 0.1).toFixed(3)})`;
    ctx.fillRect(0, y + 27, 256, 4);

    // Plank seam
    ctx.strokeStyle = 'rgba(14, 8, 6, 0.72)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();

    // Vertical butt joints staggered per plank
    const offset = ((y / 32) % 2) * 64 + 32;
    for (let x = offset; x < 256; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 32);
      ctx.stroke();
    }

    // Rivets
    ctx.fillStyle = 'rgba(232, 188, 108, 0.56)';
    for (let x = 20; x < 256; x += 48) {
      ctx.beginPath();
      ctx.arc(x, y + 16, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Organic wood grain striations
  ctx.lineWidth = 1;
  for (let i = 0; i < 64; i += 1) {
    const y = (i * 4.1) % 256;
    ctx.strokeStyle =
      i % 2 === 0 ? 'rgba(255, 224, 178, 0.14)' : 'rgba(22, 12, 8, 0.18)';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(
      70,
      y + (rand() - 0.5) * 5,
      180,
      y + (rand() - 0.5) * 5,
      256,
      y + (rand() - 0.5) * 2,
    );
    ctx.stroke();
  }

  // Salt spray & moss grime near waterline
  ctx.fillStyle = 'rgba(56, 124, 96, 0.34)';
  for (let m = 0; m < 18; m += 1) {
    ctx.beginPath();
    ctx.ellipse(rand() * 256, 214 + rand() * 38, 11, 4.5, rand() * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(218, 226, 232, 0.12)';
  for (let s = 0; s < 14; s += 1) {
    ctx.beginPath();
    ctx.ellipse(rand() * 256, 180 + rand() * 44, 8, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

export function createOakDetailMaps(): { bumpMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const key = 'oak-detail';
  const cached = mapPairCache.get(key);
  if (cached) return cached;

  const [bCanvas, bCtx] = makeCanvas(256, 256);
  const [rCanvas, rCtx] = makeCanvas(256, 256);
  const rand = seededRand(811);

  bCtx.fillStyle = '#888888';
  bCtx.fillRect(0, 0, 256, 256);

  // Upper dry wood rougher (~0.76 = #c2c2c2), lower waterline wetter/glossy (~0.32 = #525252)
  const rGrad = rCtx.createLinearGradient(0, 0, 0, 256);
  rGrad.addColorStop(0, '#c0c0c0');
  rGrad.addColorStop(0.68, '#b4b4b4');
  rGrad.addColorStop(1, '#4c4c4c');
  rCtx.fillStyle = rGrad;
  rCtx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 32) {
    // Recessed plank seam
    bCtx.strokeStyle = '#181818';
    bCtx.lineWidth = 2.5;
    bCtx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.lineTo(256, y);
    bCtx.stroke();

    rCtx.strokeStyle = '#ededed';
    rCtx.lineWidth = 2.5;
    rCtx.beginPath();
    rCtx.moveTo(0, y);
    rCtx.lineTo(256, y);
    rCtx.stroke();

    // Raised bevel lip
    bCtx.strokeStyle = '#c8c8c8';
    bCtx.lineWidth = 1.2;
    bCtx.beginPath();
    bCtx.moveTo(0, y + 2);
    bCtx.lineTo(256, y + 2);
    bCtx.stroke();

    // Raised rivet bumps & metallic shine in roughness map
    for (let x = 20; x < 256; x += 48) {
      bCtx.fillStyle = '#e8e8e8';
      bCtx.beginPath();
      bCtx.arc(x, y + 16, 2.2, 0, Math.PI * 2);
      bCtx.fill();

      rCtx.fillStyle = '#383838';
      rCtx.beginPath();
      rCtx.arc(x, y + 16, 2.2, 0, Math.PI * 2);
      rCtx.fill();
    }
  }

  // Wood fiber bump grooves
  for (let i = 0; i < 90; i += 1) {
    const y = rand() * 256;
    bCtx.strokeStyle = i % 2 === 0 ? '#a4a4a4' : '#6c6c6c';
    bCtx.lineWidth = 1;
    bCtx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.lineTo(256, y + (rand() - 0.5) * 3);
    bCtx.stroke();
  }

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.colorSpace = THREE.NoColorSpace;

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.colorSpace = THREE.NoColorSpace;

  const pair = { bumpMap, roughnessMap };
  mapPairCache.set(key, pair);
  return pair;
}

export function createDeckPlankTexture(): THREE.CanvasTexture {
  const key = 'deck-teak';
  const cached = textureCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(256, 256);
  const rand = seededRand(271);
  ctx.fillStyle = '#7c5338';
  ctx.fillRect(0, 0, 256, 256);

  // Longitudinal teak deck planks (vertical in UV)
  for (let x = 0; x < 256; x += 24) {
    const shade = (rand() - 0.5) * 20;
    ctx.fillStyle = `rgb(${Math.round(126 + shade)}, ${Math.round(84 + shade * 0.7)}, ${Math.round(56 + shade * 0.5)})`;
    ctx.fillRect(x + 1, 0, 22, 256);

    // Caulked pitch seam
    ctx.fillStyle = '#1d140e';
    ctx.fillRect(x, 0, 2, 256);

    // Butt joint + treenail pegs
    const j = ((x / 24) % 3) * 76 + 32;
    ctx.fillRect(x, j, 24, 2);
    ctx.fillStyle = '#2d1c12';
    ctx.beginPath();
    ctx.arc(x + 7, j + 7, 1.4, 0, Math.PI * 2);
    ctx.arc(x + 17, j + 7, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sun-bleached foot traffic center path & grain lines
  const wear = ctx.createRadialGradient(128, 128, 24, 128, 128, 130);
  wear.addColorStop(0, 'rgba(235, 198, 156, 0.16)');
  wear.addColorStop(1, 'rgba(18, 12, 8, 0.14)');
  ctx.fillStyle = wear;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

export function createEngravedSailTexture(isEnemy: boolean): THREE.CanvasTexture {
  const key = `sail-${isEnemy ? 'enemy' : 'player'}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(256, 256);
  const rand = seededRand(isEnemy ? 631 : 107);
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  if (isEnemy) {
    grad.addColorStop(0, '#E4C59E');
    grad.addColorStop(0.75, '#BE996D');
    grad.addColorStop(1, '#96724A');
  } else {
    grad.addColorStop(0, '#F0DFBF');
    grad.addColorStop(0.76, '#D4BA8B');
    grad.addColorStop(1, '#B39362');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle canvas weave
  ctx.fillStyle = 'rgba(84, 58, 34, 0.055)';
  for (let i = 0; i < 256; i += 4) {
    ctx.fillRect(i, 0, 1, 256);
    ctx.fillRect(0, i, 256, 1);
  }

  // Stitched canvas panels & reef-point bands
  ctx.strokeStyle = 'rgba(72, 48, 28, 0.36)';
  ctx.lineWidth = 1.8;
  for (let x = 32; x < 256; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 42; y < 256; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  // Twin side trim stripes visible clear of the central mast
  ctx.fillStyle = isEnemy ? 'rgba(155, 36, 28, 0.58)' : 'rgba(22, 32, 58, 0.52)';
  ctx.fillRect(28, 0, 14, 256);
  ctx.fillRect(214, 0, 14, 256);

  // Reinforced stitched hem border
  ctx.strokeStyle = 'rgba(66, 44, 24, 0.48)';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 250, 250);

  // Weathered salt-stain patches near bottom hem
  for (let p = 0; p < 7; p += 1) {
    ctx.fillStyle = `rgba(68, 50, 32, ${(0.07 + rand() * 0.08).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(24 + rand() * 208, 195 + rand() * 48, 18, 10, rand(), 0, Math.PI * 2);
    ctx.fill();
  }

  // Corsair heraldic emblem (wide enough to frame cleanly past the central mast)
  ctx.fillStyle = isEnemy ? 'rgba(196, 44, 34, 0.9)' : 'rgba(18, 25, 48, 0.9)';
  ctx.fillRect(88, 66, 80, 98);
  ctx.strokeStyle = 'rgba(244, 201, 122, 0.86)';
  ctx.lineWidth = 2.6;
  ctx.strokeRect(88, 66, 80, 98);

  // Gold compass crest inside banner
  ctx.fillStyle = 'rgba(244, 201, 122, 0.84)';
  ctx.beginPath();
  ctx.moveTo(128, 84);
  ctx.lineTo(148, 115);
  ctx.lineTo(128, 146);
  ctx.lineTo(108, 115);
  ctx.closePath();
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

export function createBeamGradientTexture(): THREE.CanvasTexture {
  const key = 'lighthouse-beam-grad';
  const cached = textureCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(64, 256);
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(255, 232, 168, 0.95)');
  grad.addColorStop(0.25, 'rgba(255, 206, 108, 0.52)');
  grad.addColorStop(0.68, 'rgba(255, 214, 126, 0.12)');
  grad.addColorStop(1, 'rgba(255, 224, 148, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

export function createSailDetailMaps(): { bumpMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const key = 'sail-detail';
  const cached = mapPairCache.get(key);
  if (cached) return cached;

  const [bCanvas, bCtx] = makeCanvas(256, 256);
  const [rCanvas, rCtx] = makeCanvas(256, 256);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 256, 256);
  rCtx.fillStyle = '#cfcfcf';
  rCtx.fillRect(0, 0, 256, 256);

  // Crosshatch linen weave
  for (let i = 0; i < 256; i += 4) {
    bCtx.fillStyle = i % 8 === 0 ? '#969696' : '#6c6c6c';
    bCtx.fillRect(i, 0, 2, 256);
    bCtx.fillRect(0, i, 256, 2);
  }

  // Raised panel seams
  bCtx.strokeStyle = '#d4d4d4';
  bCtx.lineWidth = 2.5;
  rCtx.strokeStyle = '#ededed';
  rCtx.lineWidth = 2.5;
  for (let x = 32; x < 256; x += 32) {
    bCtx.beginPath();
    bCtx.moveTo(x, 0);
    bCtx.lineTo(x, 256);
    bCtx.stroke();
    rCtx.beginPath();
    rCtx.moveTo(x, 0);
    rCtx.lineTo(x, 256);
    rCtx.stroke();
  }
  for (let y = 42; y < 256; y += 64) {
    bCtx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.lineTo(256, y);
    bCtx.stroke();
  }

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.colorSpace = THREE.NoColorSpace;
  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;

  const pair = { bumpMap, roughnessMap };
  mapPairCache.set(key, pair);
  return pair;
}

export function createEngravedCliffTexture(): THREE.CanvasTexture {
  const key = 'cliff-basalt';
  const cached = textureCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(256, 256);
  const rand = seededRand(907);
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#53688f');
  grad.addColorStop(0.55, '#3b4b6d');
  grad.addColorStop(1, '#222c42');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Basalt strata & fractures
  ctx.strokeStyle = 'rgba(10, 14, 24, 0.72)';
  ctx.lineWidth = 2.2;
  for (let y = 14; y < 256; y += 22) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(80, y + (rand() - 0.5) * 10);
    ctx.lineTo(170, y + (rand() - 0.5) * 10);
    ctx.lineTo(256, y + (rand() - 0.5) * 8);
    ctx.stroke();
  }

  // Vertical columnar basalt cracks
  ctx.strokeStyle = 'rgba(14, 18, 30, 0.45)';
  ctx.lineWidth = 1.4;
  for (let x = 18; x < 256; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (rand() - 0.5) * 10, 128);
    ctx.lineTo(x + (rand() - 0.5) * 12, 256);
    ctx.stroke();
  }

  // Sea-moss & amber lichen patches
  ctx.fillStyle = 'rgba(68, 148, 118, 0.44)';
  for (let i = 0; i < 16; i += 1) {
    ctx.beginPath();
    ctx.ellipse(rand() * 240, 170 + rand() * 75, 16, 6.5, rand() * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(235, 182, 104, 0.25)';
  for (let i = 0; i < 10; i += 1) {
    ctx.beginPath();
    ctx.arc(rand() * 240, rand() * 140, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

export function createCliffDetailMaps(): { bumpMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const key = 'cliff-detail';
  const cached = mapPairCache.get(key);
  if (cached) return cached;

  const [bCanvas, bCtx] = makeCanvas(256, 256);
  const [rCanvas, rCtx] = makeCanvas(256, 256);
  const rand = seededRand(503);

  bCtx.fillStyle = '#828282';
  bCtx.fillRect(0, 0, 256, 256);

  // Porous upper basalt (rough) -> wave-slicked wet base (glossy)
  const rGrad = rCtx.createLinearGradient(0, 0, 0, 256);
  rGrad.addColorStop(0, '#dedede');
  rGrad.addColorStop(0.65, '#c4c4c4');
  rGrad.addColorStop(1, '#3e3e3e');
  rCtx.fillStyle = rGrad;
  rCtx.fillRect(0, 0, 256, 256);

  // Craggy facets & fissures
  for (let i = 0; i < 120; i += 1) {
    const x = rand() * 256;
    const y = rand() * 256;
    bCtx.fillStyle = i % 2 === 0 ? '#aeaeae' : '#585858';
    bCtx.beginPath();
    bCtx.ellipse(x, y, 6 + rand() * 14, 3 + rand() * 7, rand() * Math.PI, 0, Math.PI * 2);
    bCtx.fill();
  }
  bCtx.strokeStyle = '#1e1e1e';
  bCtx.lineWidth = 2.4;
  for (let y = 14; y < 256; y += 22) {
    bCtx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.lineTo(128, y + (rand() - 0.5) * 10);
    bCtx.lineTo(256, y);
    bCtx.stroke();
  }

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.colorSpace = THREE.NoColorSpace;

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.colorSpace = THREE.NoColorSpace;

  const pair = { bumpMap, roughnessMap };
  mapPairCache.set(key, pair);
  return pair;
}

export function createMasonryTexture(): THREE.CanvasTexture {
  const key = 'lighthouse-masonry';
  const cached = textureCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(256, 256);
  const rand = seededRand(331);
  ctx.fillStyle = '#5f687a';
  ctx.fillRect(0, 0, 256, 256);

  const rows = 8;
  const cols = 4;
  const rowH = 256 / rows;
  const colW = 256 / cols;

  for (let r = 0; r < rows; r += 1) {
    const stagger = (r % 2) * (colW * 0.5);
    const bandColor = r === 2 || r === 5 ? [142, 68, 56] : [132, 138, 150];
    for (let c = -1; c <= cols; c += 1) {
      const x = c * colW + stagger;
      const y = r * rowH;
      const delta = (rand() - 0.5) * 20;
      ctx.fillStyle = `rgb(${Math.round(bandColor[0] + delta)}, ${Math.round(bandColor[1] + delta)}, ${Math.round(bandColor[2] + delta)})`;
      ctx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(x + 2, y + 2, colW - 4, 3);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

export function createMasonryDetailMaps(): { bumpMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const key = 'masonry-detail';
  const cached = mapPairCache.get(key);
  if (cached) return cached;

  const [bCanvas, bCtx] = makeCanvas(256, 256);
  const [rCanvas, rCtx] = makeCanvas(256, 256);
  bCtx.fillStyle = '#282828';
  bCtx.fillRect(0, 0, 256, 256);
  rCtx.fillStyle = '#e5e5e5';
  rCtx.fillRect(0, 0, 256, 256);

  const rows = 8;
  const cols = 4;
  const rowH = 256 / rows;
  const colW = 256 / cols;
  for (let r = 0; r < rows; r += 1) {
    const stagger = (r % 2) * (colW * 0.5);
    for (let c = -1; c <= cols; c += 1) {
      const x = c * colW + stagger;
      const y = r * rowH;
      bCtx.fillStyle = '#c8c8c8';
      bCtx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);
      rCtx.fillStyle = '#a8a8a8';
      rCtx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);
    }
  }

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.colorSpace = THREE.NoColorSpace;

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.colorSpace = THREE.NoColorSpace;

  const pair = { bumpMap, roughnessMap };
  mapPairCache.set(key, pair);
  return pair;
}

export function createCrateDetailTexture(tint: string, bandTint = '#202636'): THREE.CanvasTexture {
  const key = `crate-${tint}-${bandTint}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(128, 128);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, 128, 128);

  // Horizontal planks
  for (let y = 0; y < 128; y += 24) {
    ctx.strokeStyle = 'rgba(8, 10, 16, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 224, 178, 0.08)';
    ctx.fillRect(0, y + 2, 128, 3);
  }

  // Border framing & iron rivets
  ctx.strokeStyle = bandTint;
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 118, 118);

  ctx.fillStyle = 'rgba(220, 185, 110, 0.72)';
  for (const px of [12, 64, 116]) {
    for (const py of [12, 116]) {
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

export function createBrushedMetalRoughnessMap(): THREE.CanvasTexture {
  const key = 'metal-roughness';
  const cached = textureCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(128, 128);
  const rand = seededRand(199);
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(0, 0, 128, 128);

  for (let i = 0; i < 64; i += 1) {
    const y = rand() * 128;
    ctx.strokeStyle = i % 2 === 0 ? '#6e6e6e' : '#2e2e2e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y + (rand() - 0.5) * 4);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  textureCache.set(key, tex);
  return tex;
}

export function createSoftShadowTexture(): THREE.CanvasTexture {
  const key = 'soft-shadow';
  const cached = textureCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(128, 128);
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(3, 5, 14, 0.72)');
  grad.addColorStop(0.55, 'rgba(5, 9, 24, 0.35)');
  grad.addColorStop(1, 'rgba(5, 9, 24, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  textureCache.set(key, tex);
  return tex;
}

export function createFoamSpriteTexture(): THREE.CanvasTexture {
  const key = 'foam-sprite-puff';
  const cached = textureCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(128, 128);
  const rand = seededRand(719);
  ctx.clearRect(0, 0, 128, 128);

  // Soft billowing radial base
  const baseGrad = ctx.createRadialGradient(64, 64, 4, 64, 64, 58);
  baseGrad.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
  baseGrad.addColorStop(0.38, 'rgba(235, 248, 255, 0.56)');
  baseGrad.addColorStop(0.75, 'rgba(198, 232, 255, 0.18)');
  baseGrad.addColorStop(1, 'rgba(180, 224, 255, 0)');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 128, 128);

  // Wispy sea-foam sub-lobes for organic aerated texture
  for (let i = 0; i < 18; i += 1) {
    const angle = rand() * Math.PI * 2;
    const dist = 8 + rand() * 26;
    const cx = 64 + Math.cos(angle) * dist;
    const cy = 64 + Math.sin(angle) * dist;
    const r = 10 + rand() * 18;
    const lobe = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
    lobe.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
    lobe.addColorStop(0.65, 'rgba(225, 245, 255, 0.14)');
    lobe.addColorStop(1, 'rgba(225, 245, 255, 0)');
    ctx.fillStyle = lobe;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

export function createPennantPatternTexture(
  crestId: string,
  pennantHex: number,
): THREE.CanvasTexture {
  const key = `pennant-${crestId}-${pennantHex.toString(16)}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(128, 64);
  const col = new THREE.Color(pennantHex);
  const baseHex = `#${col.getHexString()}`;
  const darkCol = col.clone().multiplyScalar(0.55);
  const darkHex = `#${darkCol.getHexString()}`;

  const grad = ctx.createLinearGradient(0, 0, 128, 0);
  grad.addColorStop(0, darkHex);
  grad.addColorStop(0.45, baseHex);
  grad.addColorStop(1, darkHex);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 64);

  // Decorative gold border stripes
  ctx.fillStyle = 'rgba(255, 232, 166, 0.72)';
  ctx.fillRect(0, 4, 128, 5);
  ctx.fillRect(0, 55, 128, 5);

  // Heraldic crest glyph
  ctx.save();
  ctx.translate(42, 32);
  ctx.fillStyle = crestId === 'crimson' ? '#1c080a' : '#fff4d2';
  ctx.strokeStyle = 'rgba(20, 16, 28, 0.75)';
  ctx.lineWidth = 2;

  if (crestId === 'crimson') {
    // Jagged crimson fang / skull diamond
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(13, 0);
    ctx.lineTo(5, 15);
    ctx.lineTo(0, 6);
    ctx.lineTo(-5, 15);
    ctx.lineTo(-13, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (crestId === 'ashen') {
    // Twin storm lightning bolt
    ctx.beginPath();
    ctx.moveTo(4, -16);
    ctx.lineTo(-9, 2);
    ctx.lineTo(0, 2);
    ctx.lineTo(-5, 16);
    ctx.lineTo(10, -2);
    ctx.lineTo(1, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (crestId === 'abyssal') {
    // Abyssal trident / crown
    ctx.beginPath();
    ctx.moveTo(-12, 12);
    ctx.lineTo(-14, -10);
    ctx.lineTo(-5, 0);
    ctx.lineTo(0, -16);
    ctx.lineTo(5, 0);
    ctx.lineTo(14, -10);
    ctx.lineTo(12, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Corsair 4-point compass rose
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(4, -4);
    ctx.lineTo(16, 0);
    ctx.lineTo(4, 4);
    ctx.lineTo(0, 16);
    ctx.lineTo(-4, 4);
    ctx.lineTo(-16, 0);
    ctx.lineTo(-4, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

