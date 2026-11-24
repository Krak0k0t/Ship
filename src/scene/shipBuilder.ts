import * as THREE from 'three';
import {
  createBeamGradientTexture,
  createBrushedMetalRoughnessMap,
  createCliffDetailMaps,
  createCrateDetailTexture,
  createDeckPlankTexture,
  createEngravedCliffTexture,
  createEngravedOakTexture,
  createEngravedSailTexture,
  createMasonryDetailMaps,
  createMasonryTexture,
  createOakDetailMaps,
  createPennantPatternTexture,
  createSailDetailMaps,
  createSoftShadowTexture,
} from './engravingTextures';

import { SHIP_CREST_SPECS, type ShipCrestId } from '../game/contracts';
import type { EnemyArchetype } from '../game/campaign';
import {
  SHIP_CLASS_SPECS,
  type FigureheadId,
  type ShipClassId,
} from '../game/shipClasses';

export interface BuiltShip {
  root: THREE.Group;
  visualBody: THREE.Group;
  shadowDisc: THREE.Mesh;
  sailMesh: THREE.Mesh;
  extraSailMeshes: THREE.Mesh[];
  pennantMesh: THREE.Mesh;
  lanternGlowMesh: THREE.Mesh;
  lanternWorldTarget: THREE.Object3D;
  crestAuraMesh: THREE.Mesh;
  cannonMuzzlesPort: THREE.Vector3[];
  cannonMuzzlesStbd: THREE.Vector3[];
  setSailAmount: (level: number) => void;
  setCrestGlow: (active: boolean) => void;
  setSailDamaged: (damaged: boolean) => void;
  setUpgradeTier: (totalLevel: number) => void;
  setCrestStyle?: (crestId: ShipCrestId) => void;
  setShipLoadoutStyle?: (shipClass: ShipClassId, figurehead: FigureheadId) => void;
  setSpecialShieldBroken?: (broken: boolean) => void;
  setBossEnraged?: (enraged: boolean) => void;
  setHitFlash?: (amount: number) => void;
  setTelegraphFlash?: (amount: number) => void;
  setAbilityVfx: (opts: { smokeActive: boolean; stormWakeActive: boolean }) => void;
  updateAnimation: (time: number, squashY: number, speed: number) => void;
}

function addInkEdges(mesh: THREE.Mesh, thresholdAngle = 28, color = 0x0b0f1d, opacity = 0.42): void {
  const edges = new THREE.EdgesGeometry(mesh.geometry, thresholdAngle);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
  mesh.add(line);
}

function createBillowingSailGeometry(width: number, height: number): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(width, height, 10, 8);
  const pos = geo.attributes.position;
  const halfW = Math.max(0.5, width * 0.52);
  const halfH = Math.max(0.5, height * 0.52);
  for (let i = 0; i < pos.count; i += 1) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    const belly =
      Math.cos((px / halfW) * (Math.PI / 2)) *
      Math.cos((py / halfH) * (Math.PI / 2)) *
      0.62;
    pos.setZ(i, -belly);
  }
  geo.computeVertexNormals();
  return geo;
}

function hullHalfBeam(t: number): number {
  if (t <= 0.44) {
    const u = t / 0.44;
    return 0.04 + Math.pow(Math.sin(u * Math.PI * 0.5), 0.72) * 1.44;
  }
  if (t <= 0.74) {
    const u = (t - 0.44) / 0.3;
    return 1.48 - Math.sin(u * Math.PI * 0.5) * 0.08;
  }
  const u = (t - 0.74) / 0.26;
  return 1.4 - u * 0.26;
}

function hullSheerTop(t: number): number {
  const bowRise = Math.pow(Math.max(0, 1 - t / 0.38), 1.6) * 0.42;
  const sternRise = Math.pow(Math.max(0, (t - 0.65) / 0.35), 1.4) * 0.44;
  return 1.28 + bowRise + sternRise;
}

function createSculptedHullGeometry(): THREE.BufferGeometry {
  const stations = 18;
  const zBow = -5.85;
  const zStern = 3.85;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // 7 profile points per station around cross-section (port top -> chine -> keel -> stbd chine -> stbd top)
  const ringPts = 7;
  for (let i = 0; i <= stations; i += 1) {
    const t = i / stations;
    const z = zBow + (zStern - zBow) * t;
    const w = hullHalfBeam(t);
    const yTop = hullSheerTop(t);
    const yChine = 0.38 + (t < 0.2 ? (0.2 - t) * 0.8 : 0);
    const yKeel = -0.22 + (t < 0.14 ? (0.14 - t) * 1.1 : 0);
    const wChine = w * 0.76;

    const ring: Array<[number, number]> = [
      [-w, yTop],
      [-wChine, yChine],
      [-w * 0.22, yKeel],
      [0, yKeel - 0.06],
      [w * 0.22, yKeel],
      [wChine, yChine],
      [w, yTop],
    ];

    for (let j = 0; j < ringPts; j += 1) {
      const [rx, ry] = ring[j];
      positions.push(rx, ry, z);
      const u = (z - zBow) * 0.24;
      const v = 1 - THREE.MathUtils.clamp((ry + 0.28) / 1.95, 0, 1);
      uvs.push(u, v);
    }
  }

  for (let i = 0; i < stations; i += 1) {
    for (let j = 0; j < ringPts - 1; j += 1) {
      const a = i * ringPts + j;
      const b = (i + 1) * ringPts + j;
      const c = (i + 1) * ringPts + (j + 1);
      const d = i * ringPts + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  // Stern transom closure
  const sternBase = stations * ringPts;
  const sternCenterIdx = positions.length / 3;
  positions.push(0, 0.72, zStern);
  uvs.push((zStern - zBow) * 0.24, 0.45);
  for (let j = 0; j < ringPts - 1; j += 1) {
    indices.push(sternBase + j, sternCenterIdx, sternBase + j + 1);
  }

  // Top deck hull closure (subtle deck camber inside bulwarks)
  for (let i = 0; i < stations; i += 1) {
    const a = i * ringPts;
    const b = i * ringPts + (ringPts - 1);
    const c = (i + 1) * ringPts + (ringPts - 1);
    const d = (i + 1) * ringPts;
    indices.push(a, b, d);
    indices.push(b, c, d);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createHullDeckPlateGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const steps = 16;
  const zBow = -5.45;
  const zStern = 3.72;
  shape.moveTo(0, zBow);
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const z = zBow + (zStern - zBow) * t;
    const w = hullHalfBeam(t) * 0.89;
    shape.lineTo(w, z);
  }
  for (let i = steps; i >= 1; i -= 1) {
    const t = i / steps;
    const z = zBow + (zStern - zBow) * t;
    const w = hullHalfBeam(t) * 0.89;
    shape.lineTo(-w, z);
  }
  shape.closePath();

  const geo = new THREE.ShapeGeometry(shape, 12);
  geo.rotateX(Math.PI / 2);
  const uv = geo.attributes.uv;
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    uv.setXY(i, pos.getX(i) * 0.45 + 0.5, pos.getZ(i) * 0.24);
  }
  geo.computeVertexNormals();
  return geo;
}

function createCooperedBarrelGeometry(radius = 0.88, height = 1.95): THREE.BufferGeometry {
  const pts: THREE.Vector2[] = [];
  const halfH = height * 0.5;
  pts.push(new THREE.Vector2(0.01, -halfH));
  pts.push(new THREE.Vector2(radius * 0.76, -halfH));
  pts.push(new THREE.Vector2(radius * 0.92, -halfH * 0.55));
  pts.push(new THREE.Vector2(radius, 0));
  pts.push(new THREE.Vector2(radius * 0.92, halfH * 0.55));
  pts.push(new THREE.Vector2(radius * 0.76, halfH));
  pts.push(new THREE.Vector2(0.01, halfH));
  return new THREE.LatheGeometry(pts, 14);
}

function enableShadows(obj: THREE.Object3D, cast = true, receive = true): void {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = cast;
      child.receiveShadow = receive;
    }
  });
}

function buildLanternCage(brassMat: THREE.Material, radius = 0.28, height = 0.54): THREE.Group {
  const cage = new THREE.Group();
  const topCap = new THREE.Mesh(new THREE.ConeGeometry(radius * 1.15, height * 0.42, 6), brassMat);
  topCap.position.y = height * 0.58;
  cage.add(topCap);

  const botCap = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.82, radius * 0.52, height * 0.2, 6), brassMat);
  botCap.position.y = -height * 0.46;
  cage.add(botCap);

  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, height * 0.88, 5), brassMat);
    bar.position.set(Math.cos(a) * radius * 0.9, 0.05, Math.sin(a) * radius * 0.9);
    cage.add(bar);
  }
  return cage;
}

export function buildCorsairShip(
  options: {
    isEnemy?: boolean;
    isBoss?: boolean;
    scale?: number;
    archetype?: EnemyArchetype;
    shipClass?: ShipClassId;
    figurehead?: FigureheadId;
  } = {},
): BuiltShip {
  const isBoss = options.isBoss ?? options.archetype === 'boss';
  const archetype: EnemyArchetype = options.archetype ?? (isBoss ? 'boss' : 'brig');
  const isEnemy = options.isEnemy ?? isBoss;
  const isWraith = archetype === 'wraith';
  let activeShipClass: ShipClassId = options.shipClass ?? 'sloop';
  let scale =
    options.scale ??
    (isBoss ? 1.48 : !isEnemy ? (SHIP_CLASS_SPECS[activeShipClass]?.hullScale ?? 1) : 1);

  const root = new THREE.Group();
  const visualBody = new THREE.Group();
  visualBody.scale.setScalar(scale);
  root.add(visualBody);

  // Soft elliptical contact shadow anchored on waterline
  const shadowMat = new THREE.MeshBasicMaterial({
    map: createSoftShadowTexture(),
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(new THREE.PlaneGeometry(6.2 * scale, 12.2 * scale), shadowMat);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.08;
  root.add(shadowDisc);

  const hullColor = isWraith ? '#2e4e6e' : isEnemy ? '#734232' : '#94523A';
  const oakTex = createEngravedOakTexture(hullColor);
  const oakDetail = createOakDetailMaps();
  const metalRoughness = createBrushedMetalRoughnessMap();

  const hullMat = new THREE.MeshPhysicalMaterial({
    map: oakTex,
    bumpMap: oakDetail.bumpMap,
    bumpScale: 0.045,
    roughnessMap: oakDetail.roughnessMap,
    roughness: isWraith ? 0.42 : 0.72,
    metalness: isWraith ? 0.18 : 0.08,
    clearcoat: 0.22,
    clearcoatRoughness: 0.48,
    transparent: isWraith,
    opacity: isWraith ? 0.74 : 1.0,
    emissive: new THREE.Color(isWraith ? 0x1e6f8c : 0x000000),
    emissiveIntensity: isWraith ? 0.55 : 0,
  });

  const deckTex = createDeckPlankTexture();
  const deckMat = new THREE.MeshStandardMaterial({
    map: deckTex,
    bumpMap: oakDetail.bumpMap,
    bumpScale: 0.03,
    roughness: 0.78,
    metalness: 0.04,
  });

  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: isEnemy ? 0x3b2a24 : 0x4b3124,
    bumpMap: oakDetail.bumpMap,
    bumpScale: 0.025,
    roughness: 0.74,
    metalness: 0.08,
  });

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x262c38,
    roughnessMap: metalRoughness,
    roughness: 0.46,
    metalness: 0.82,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xe6b85c,
    roughnessMap: metalRoughness,
    roughness: 0.26,
    metalness: 0.86,
    emissive: 0x4f2e08,
    emissiveIntensity: 0.42,
  });

  const cabinGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffd27a,
    emissive: new THREE.Color(isEnemy ? 0xff7b36 : 0xffaa44),
    emissiveIntensity: 1.45,
    roughness: 0.2,
  });

  // 1. Sculpted Tapered Hull + Planked Main Deck + Keel + Rudder
  const hull = new THREE.Mesh(createSculptedHullGeometry(), hullMat);
  hull.castShadow = true;
  hull.receiveShadow = true;
  addInkEdges(hull, 38, 0x0b0f1d, 0.34);
  visualBody.add(hull);

  const mainDeck = new THREE.Mesh(createHullDeckPlateGeometry(), deckMat);
  mainDeck.position.y = 1.24;
  mainDeck.receiveShadow = true;
  visualBody.add(mainDeck);

  const keel = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.38, 8.6), darkTrimMat);
  keel.position.set(0, -0.05, -0.8);
  visualBody.add(keel);

  const rudder = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.85), darkTrimMat);
  rudder.position.set(0, 0.25, 4.18);
  visualBody.add(rudder);

  // Port & Starboard curved gunwale brass rails + oak bulwark stanchions
  for (const side of [-1, 1]) {
    for (let s = 0; s < 7; s += 1) {
      const t = 0.22 + (s / 6) * 0.68;
      const z = -5.85 + t * 9.7;
      const x = side * hullHalfBeam(t) * 0.94;
      const y = hullSheerTop(t);
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.14), darkTrimMat);
      post.position.set(x, y + 0.08, z);
      post.castShadow = true;
      visualBody.add(post);
    }
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.11, 6.9), brassMat);
    rail.position.set(side * 1.38, 1.38, 0.0);
    rail.castShadow = true;
    visualBody.add(rail);
  }

  // Bowsprit + carved golden figurehead prow + twin hawse anchors
  const bowsprit = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.14, 3.6, 8), darkTrimMat);
  bowsprit.rotation.x = -Math.PI * 0.38;
  bowsprit.position.set(0, 1.72, -5.85);
  bowsprit.castShadow = true;
  visualBody.add(bowsprit);

  const jibRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 6, 12), brassMat);
  jibRing.position.set(0, 2.2, -6.55);
  visualBody.add(jibRing);

  const figurehead = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.95, 6), brassMat);
  figurehead.rotation.x = -Math.PI * 0.42;
  figurehead.position.set(0, 1.15, -5.95);
  figurehead.castShadow = true;
  visualBody.add(figurehead);

  // Player Custom Bow Figurehead Variants ('ram' | 'serpent' | 'phoenix')
  const figRamGroup = new THREE.Group();
  const ironRamCone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.05, 8), ironMat);
  ironRamCone.rotation.x = -Math.PI / 2;
  ironRamCone.position.set(0, 0.58, -6.58);
  const ramCollar = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.08, 6, 12), brassMat);
  ramCollar.position.set(0, 0.58, -5.7);
  figRamGroup.add(ironRamCone, ramCollar);
  figRamGroup.visible = !isEnemy && options.figurehead === 'ram';
  visualBody.add(figRamGroup);

  const figSerpentGroup = new THREE.Group();
  const serpentNeck = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.14, 8, 16, Math.PI * 1.15), brassMat);
  serpentNeck.rotation.y = Math.PI / 2;
  serpentNeck.position.set(0, 1.4, -6.05);
  const serpentCrest = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), brassMat);
  serpentCrest.position.set(0, 1.88, -6.48);
  figSerpentGroup.add(serpentNeck, serpentCrest);
  figSerpentGroup.visible = !isEnemy && options.figurehead === 'serpent';
  visualBody.add(figSerpentGroup);

  const figPhoenixGroup = new THREE.Group();
  const emberMat = new THREE.MeshBasicMaterial({ color: 0xff8c38 });
  const phxCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), emberMat);
  phxCore.position.set(0, 1.48, -6.32);
  figPhoenixGroup.add(phxCore);
  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.12, 0.45), brassMat);
    wing.position.set(s * 0.42, 1.56, -6.12);
    wing.rotation.z = s * 0.45;
    wing.rotation.y = s * -0.35;
    figPhoenixGroup.add(wing);
  }
  figPhoenixGroup.visible = !isEnemy && options.figurehead === 'phoenix';
  visualBody.add(figPhoenixGroup);

  for (const side of [-1, 1]) {
    const anchorRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 6, 10), ironMat);
    anchorRing.position.set(side * 0.72, 1.18, -4.45);
    anchorRing.rotation.y = Math.PI / 2;
    visualBody.add(anchorRing);
  }

  // 2. Tapered Quarterdeck Castle (flush inside stern hull taper), Stern Gallery Windows & Helm
  const qShape = new THREE.Shape();
  qShape.moveTo(-1.24, 1.38);
  qShape.lineTo(1.24, 1.38);
  qShape.lineTo(1.04, 3.72);
  qShape.lineTo(-1.04, 3.72);
  qShape.closePath();
  const qGeo = new THREE.ExtrudeGeometry(qShape, { depth: 0.56, bevelEnabled: false });
  qGeo.rotateX(Math.PI / 2);
  qGeo.translate(0, 1.84, 0);
  const quarterDeck = new THREE.Mesh(qGeo, hullMat);
  quarterDeck.castShadow = true;
  quarterDeck.receiveShadow = true;
  addInkEdges(quarterDeck, 32, 0x0b0f1d, 0.3);
  visualBody.add(quarterDeck);

  const qpGeo = new THREE.ShapeGeometry(qShape);
  qpGeo.rotateX(Math.PI / 2);
  qpGeo.translate(0, 1.855, 0);
  const qpPos = qpGeo.attributes.position;
  const qpUv = qpGeo.attributes.uv;
  for (let i = 0; i < qpPos.count; i += 1) {
    qpUv.setXY(i, qpPos.getX(i) * 0.45 + 0.5, qpPos.getZ(i) * 0.24);
  }
  const quarterPlanks = new THREE.Mesh(qpGeo, deckMat);
  quarterPlanks.receiveShadow = true;
  visualBody.add(quarterPlanks);

  // Carved stern cabin windows with warm amber interior glow
  for (const wx of [-0.52, 0, 0.52]) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.34, 0.09), brassMat);
    frame.position.set(wx, 1.54, 3.73);
    visualBody.add(frame);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.24), cabinGlowMat);
    glass.position.set(wx, 1.54, 3.785);
    visualBody.add(glass);
  }

  // Tapered Forecastle raised deck + deck cargo grate + coiled rope
  const fShape = new THREE.Shape();
  fShape.moveTo(-0.56, -4.45);
  fShape.lineTo(0.56, -4.45);
  fShape.lineTo(1.16, -2.72);
  fShape.lineTo(-1.16, -2.72);
  fShape.closePath();
  const fGeo = new THREE.ExtrudeGeometry(fShape, { depth: 0.3, bevelEnabled: false });
  fGeo.rotateX(Math.PI / 2);
  fGeo.translate(0, 1.62, 0);
  const foreDeck = new THREE.Mesh(fGeo, hullMat);
  foreDeck.castShadow = true;
  foreDeck.receiveShadow = true;
  visualBody.add(foreDeck);

  const hatch = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.14, 1.15), darkTrimMat);
  hatch.position.set(0, 1.31, 0.55);
  hatch.receiveShadow = true;
  visualBody.add(hatch);

  const ropeCoil = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.06, 6, 14),
    new THREE.MeshStandardMaterial({ color: 0xb79765, roughness: 0.92 }),
  );
  ropeCoil.rotation.x = Math.PI / 2;
  ropeCoil.position.set(-0.62, 1.3, -1.7);
  visualBody.add(ropeCoil);

  // Helm pedestal + 8-spoke captain's wheel
  const helmStand = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.55, 0.24), darkTrimMat);
  helmStand.position.set(0, 2.1, 1.68);
  visualBody.add(helmStand);

  const wheelGroup = new THREE.Group();
  wheelGroup.position.set(0, 2.38, 1.58);
  const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.045, 8, 18), brassMat);
  wheelGroup.add(wheelRim);
  for (let s = 0; s < 4; s += 1) {
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.86, 6), brassMat);
    spoke.rotation.z = (s / 4) * Math.PI;
    wheelGroup.add(spoke);
  }
  visualBody.add(wheelGroup);

  // 3. Glowing Brass-Caged Stern Lantern
  const lanternHex = !isEnemy
    ? 0xffcc66
    : isBoss
      ? 0xff422a
      : isWraith
        ? 0x62f2ff
        : archetype === 'fireship'
          ? 0xff8b2e
          : archetype === 'mortar'
            ? 0xc76bff
            : archetype === 'healer'
              ? 0x3ef09c
              : 0xff5a36;

  const lanternMat = new THREE.MeshBasicMaterial({ color: lanternHex });
  const lanternGlowMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(isBoss ? 0.3 : 0.22, 0),
    lanternMat,
  );
  lanternGlowMesh.position.set(0, 2.26, 3.82);
  visualBody.add(lanternGlowMesh);

  const sternCage = buildLanternCage(brassMat, isBoss ? 0.34 : 0.26, isBoss ? 0.62 : 0.48);
  sternCage.position.copy(lanternGlowMesh.position);
  visualBody.add(sternCage);

  if (archetype === 'fireship') {
    const flameOrb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.42, 0),
      new THREE.MeshBasicMaterial({ color: 0xff8b2e }),
    );
    flameOrb.position.set(0, 1.55, -5.2);
    visualBody.add(flameOrb);
    const brazierCage = buildLanternCage(ironMat, 0.48, 0.72);
    brazierCage.position.copy(flameOrb.position);
    visualBody.add(brazierCage);
  } else if (archetype === 'mortar') {
    const mortarBase = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.76, 0.48, 12), darkTrimMat);
    mortarBase.position.set(0, 1.48, -0.9);
    mortarBase.castShadow = true;
    visualBody.add(mortarBase);
    const mortarTube = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.46, 1.55, 12), brassMat);
    mortarTube.rotation.x = Math.PI * 0.28;
    mortarTube.position.set(0, 1.98, -1.05);
    mortarTube.castShadow = true;
    visualBody.add(mortarTube);
  } else if (archetype === 'healer') {
    const healOrb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.34, 0),
      new THREE.MeshBasicMaterial({ color: 0x54f2a8 }),
    );
    healOrb.position.set(0, 2.68, 2.55);
    visualBody.add(healOrb);
    const healCage = buildLanternCage(brassMat, 0.4, 0.66);
    healCage.position.copy(healOrb.position);
    visualBody.add(healCage);
  }

  if (isBoss) {
    for (const sx of [-0.92, 0.92]) {
      const twin = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), lanternMat);
      twin.position.set(sx, 2.28, 3.68);
      visualBody.add(twin);
      const twinCage = buildLanternCage(brassMat, 0.26, 0.5);
      twinCage.position.copy(twin.position);
      visualBody.add(twinCage);
    }
    const ramGeo = new THREE.ConeGeometry(0.46, 2.2, 8);
    ramGeo.rotateX(-Math.PI / 2);
    const ram = new THREE.Mesh(ramGeo, brassMat);
    ram.position.set(0, 0.56, -6.75);
    ram.castShadow = true;
    visualBody.add(ram);
  }

  const lanternWorldTarget = new THREE.Object3D();
  lanternWorldTarget.position.copy(lanternGlowMesh.position);
  visualBody.add(lanternWorldTarget);

  // Crest ready halo ring at waterline
  const crestAuraMat = new THREE.MeshBasicMaterial({
    color: 0xffb84d,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const crestAuraMesh = new THREE.Mesh(new THREE.RingGeometry(2.85, 3.45, 32), crestAuraMat);
  crestAuraMesh.rotation.x = -Math.PI / 2;
  crestAuraMesh.position.y = 0.18;
  visualBody.add(crestAuraMesh);

  // Storm Wake Overdrive 3D Bow Surge Crest & Rigging Lightning Arcs
  const stormBowGroup = new THREE.Group();
  const stormBowMat = new THREE.MeshBasicMaterial({
    color: 0x7be0ff,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const stormBowGoldMat = new THREE.MeshBasicMaterial({
    color: 0xffd27d,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  for (const side of [-1, 1]) {
    const finGeo = new THREE.PlaneGeometry(1.15, 4.4, 2, 4);
    finGeo.rotateX(-Math.PI / 2);
    const fin = new THREE.Mesh(finGeo, stormBowMat);
    fin.position.set(side * 1.45, 0.36, -4.35);
    fin.rotation.y = side * 0.48;
    fin.rotation.z = side * -0.22;
    stormBowGroup.add(fin);

    const trimFin = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 3.8), stormBowGoldMat);
    trimFin.rotation.x = -Math.PI / 2;
    trimFin.position.set(side * 1.25, 0.44, -4.55);
    trimFin.rotation.y = side * 0.46;
    stormBowGroup.add(trimFin);
  }
  visualBody.add(stormBowGroup);

  const stormArcPts = [
    new THREE.Vector3(0, 6.8, -0.35),
    new THREE.Vector3(0.45, 4.9, -1.7),
    new THREE.Vector3(-0.35, 3.2, -3.4),
    new THREE.Vector3(0, 1.5, -5.8),
  ];
  const stormArcGeo = new THREE.BufferGeometry().setFromPoints(stormArcPts);
  const stormArcMat = new THREE.LineBasicMaterial({
    color: 0xffe082,
    transparent: true,
    opacity: 0,
  });
  const stormArcLine = new THREE.Line(stormArcGeo, stormArcMat);
  visualBody.add(stormArcLine);

  // 4. Main Mast, Iron Mast Bands, Crow's Nest Railing, Yardarm & Standing Rigging
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 7.25, 10), darkTrimMat);
  mast.position.set(0, 4.18, -0.35);
  mast.castShadow = true;
  visualBody.add(mast);

  for (const bandY of [2.2, 3.9, 6.6]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.14, 10), ironMat);
    band.position.set(0, bandY, -0.35);
    visualBody.add(band);
  }

  const crowsNest = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.34, 0.36, 10), darkTrimMat);
  crowsNest.position.set(0, 5.75, -0.35);
  crowsNest.castShadow = true;
  visualBody.add(crowsNest);

  const nestRail = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.035, 6, 12), brassMat);
  nestRail.rotation.x = Math.PI / 2;
  nestRail.position.set(0, 6.02, -0.35);
  visualBody.add(nestRail);

  const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, 4.85, 8), darkTrimMat);
  yard.rotation.z = Math.PI / 2;
  yard.position.set(0, 5.25, -0.35);
  yard.castShadow = true;
  visualBody.add(yard);

  for (const yx of [-2.42, 2.42]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), brassMat);
    cap.position.set(yx, 5.25, -0.35);
    visualBody.add(cap);
  }

  // Standing rigging shrouds, forestay & backstay
  const riggingPts: number[] = [];
  for (const side of [-1, 1]) {
    for (const rz of [-1.25, -0.35, 0.55]) {
      riggingPts.push(side * 1.32, 1.38, rz, side * 0.25, 5.65, -0.35);
    }
    // Yard lifts
    riggingPts.push(0, 7.1, -0.35, side * 2.15, 5.25, -0.35);
  }
  // Forestay (masthead -> bowsprit) + Backstay (masthead -> stern)
  riggingPts.push(0, 7.2, -0.35, 0, 2.45, -6.75);
  riggingPts.push(0, 7.2, -0.35, 0, 1.9, 3.65);
  const riggingGeo = new THREE.BufferGeometry();
  riggingGeo.setAttribute('position', new THREE.Float32BufferAttribute(riggingPts, 3));
  const riggingMat = new THREE.LineBasicMaterial({
    color: 0x201814,
    transparent: true,
    opacity: 0.78,
  });
  visualBody.add(new THREE.LineSegments(riggingGeo, riggingMat));

  // 5. Physical Woven Linen Sails
  const sailGeo = new THREE.PlaneGeometry(4.35, 3.2, 10, 8);
  const pos = sailGeo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    const belly = Math.cos((px / 2.25) * (Math.PI / 2)) * Math.cos((py / 1.65) * (Math.PI / 2)) * 0.68;
    pos.setZ(i, -belly);
  }
  sailGeo.computeVertexNormals();
  const sailTex = createEngravedSailTexture(isEnemy);
  const sailDetail = createSailDetailMaps();
  const baseSailColor = isBoss
    ? 0x6e1919
    : isWraith
      ? 0x72f0ff
      : archetype === 'fireship'
        ? 0x3b1e16
        : archetype === 'mortar'
          ? 0x3f2c5c
          : archetype === 'healer'
            ? 0x295948
            : 0xffffff;
  const baseSailEmissive = isBoss
    ? 0x5c1814
    : isWraith
      ? 0x2ca9c9
      : archetype === 'fireship'
        ? 0x54220f
        : archetype === 'mortar'
          ? 0x362052
          : archetype === 'healer'
            ? 0x164a37
            : isEnemy
              ? 0x3b261b
              : 0x453520;
  const sailMat = new THREE.MeshPhysicalMaterial({
    map: sailTex,
    bumpMap: sailDetail.bumpMap,
    bumpScale: 0.035,
    roughnessMap: sailDetail.roughnessMap,
    color: baseSailColor,
    emissive: new THREE.Color(baseSailEmissive),
    emissiveMap: sailTex,
    emissiveIntensity: isBoss ? 0.42 : isWraith ? 0.65 : 0.24,
    transparent: isWraith,
    opacity: isWraith ? 0.8 : 1.0,
    side: THREE.DoubleSide,
    roughness: 0.82,
    metalness: 0.02,
    sheen: 0.28,
    sheenRoughness: 0.68,
    sheenColor: new THREE.Color(0xffe6ba),
  });
  const sailMesh = new THREE.Mesh(sailGeo, sailMat);
  sailMesh.position.set(0, 3.65, -0.4);
  sailMesh.castShadow = true;
  sailMesh.receiveShadow = true;
  visualBody.add(sailMesh);

  const extraSailMeshes: THREE.Mesh[] = [];
  let foreRigGroup: THREE.Group | null = null;
  let mizzenRigGroup: THREE.Group | null = null;

  if (isBoss || !isEnemy) {
    const classMastDefs: Array<{ z: number; h: number; yW: number; sW: number; sH: number; key: 'fore' | 'mizzen' }> = [
      { z: -2.7, h: 5.8, yW: 3.6, sW: 3.3, sH: 2.5, key: 'fore' },
      { z: 2.1, h: 5.5, yW: 3.3, sW: 3.0, sH: 2.3, key: 'mizzen' },
    ];
    for (const bm of classMastDefs) {
      const rigGrp = new THREE.Group();
      const mMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, bm.h, 8), darkTrimMat);
      mMesh.position.set(0, bm.h * 0.5 + 0.6, bm.z);
      mMesh.castShadow = true;
      rigGrp.add(mMesh);

      const yMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, bm.yW, 8), darkTrimMat);
      yMesh.rotation.z = Math.PI / 2;
      yMesh.position.set(0, bm.h * 0.78, bm.z);
      yMesh.castShadow = true;
      rigGrp.add(yMesh);

      const sGeo = new THREE.PlaneGeometry(bm.sW, bm.sH, 8, 6);
      const sPos = sGeo.attributes.position;
      for (let i = 0; i < sPos.count; i += 1) {
        const px = sPos.getX(i);
        const py = sPos.getY(i);
        const belly =
          Math.cos((px / (bm.sW * 0.52)) * (Math.PI / 2)) *
          Math.cos((py / (bm.sH * 0.52)) * (Math.PI / 2)) *
          0.48;
        sPos.setZ(i, -belly);
      }
      sGeo.computeVertexNormals();
      const extraSail = new THREE.Mesh(sGeo, sailMat);
      extraSail.position.set(0, bm.h * 0.55, bm.z - 0.05);
      extraSail.castShadow = true;
      extraSail.receiveShadow = true;
      rigGrp.add(extraSail);
      extraSailMeshes.push(extraSail);

      if (!isBoss) {
        rigGrp.visible =
          bm.key === 'fore'
            ? activeShipClass === 'frigate' || activeShipClass === 'manowar'
            : activeShipClass === 'manowar';
      }
      if (bm.key === 'fore') foreRigGroup = rigGrp;
      else mizzenRigGroup = rigGrp;
      visualBody.add(rigGrp);
    }

    if (isBoss) {
      const bossCrown = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), brassMat);
      bossCrown.position.set(0, 6.45, -0.35);
      visualBody.add(bossCrown);
    }
  }

  // Pennant flag at masthead
  const pennantGeo = new THREE.ConeGeometry(isBoss ? 0.42 : 0.28, isBoss ? 2.1 : 1.5, 4);
  pennantGeo.rotateX(Math.PI / 2);
  const pennantHex = !isEnemy
    ? 0xf4c97a
    : isBoss
      ? 0xffb84d
      : isWraith
        ? 0x7be0ff
        : archetype === 'fireship'
          ? 0xff7b29
          : archetype === 'mortar'
            ? 0xb469ff
            : archetype === 'healer'
              ? 0x54f2a8
              : 0xd93a2f;
  const pennantMat = new THREE.MeshBasicMaterial(
    !isEnemy
      ? {
          color: 0xffffff,
          map: createPennantPatternTexture('corsair', pennantHex),
        }
      : { color: pennantHex },
  );
  const pennantMesh = new THREE.Mesh(pennantGeo, pennantMat);
  pennantMesh.position.set(0, 7.62, 0.35);
  visualBody.add(pennantMesh);

  // 6. Broadside Brass Cannons Mounted on Timber Gun Carriages
  const cannonMuzzlesPort: THREE.Vector3[] = [];
  const cannonMuzzlesStbd: THREE.Vector3[] = [];
  const cannonZOffsets = isBoss ? [-2.0, -1.0, 0, 1.0, 2.0] : [-1.4, -0.1, 1.2];
  for (const cz of cannonZOffsets) {
    for (const side of [-1, 1]) {
      const carriage = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 0.34), darkTrimMat);
      carriage.position.set(side * 1.12, 1.32, cz);
      carriage.castShadow = true;
      visualBody.add(carriage);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.115, 0.96, 10), brassMat);
      barrel.rotation.z = side === -1 ? Math.PI / 2 : -Math.PI / 2;
      barrel.position.set(side * 1.36, 1.42, cz);
      barrel.castShadow = true;
      visualBody.add(barrel);

      // Muzzle flare ring
      const muzzleRing = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.02, 6, 10), brassMat);
      muzzleRing.rotation.y = Math.PI / 2;
      muzzleRing.position.set(side * 1.82, 1.42, cz);
      visualBody.add(muzzleRing);

      if (side === -1) {
        cannonMuzzlesPort.push(new THREE.Vector3(-1.85 * scale, 1.42 * scale, cz * scale));
      } else {
        cannonMuzzlesStbd.push(new THREE.Vector3(1.85 * scale, 1.42 * scale, cz * scale));
      }
    }
  }

  let currentSail = 0.5;
  let crestActive = false;
  let sailDamaged = false;
  let smokeActive = false;
  let stormWakeActive = false;
  let bossEnraged = false;
  let hitFlashAmt = 0;
  let telegraphAmt = 0;
  let activeSailColor = baseSailColor;
  let activeSailEmissive = baseSailEmissive;
  let currentLanternHex = lanternHex;

  return {
    root,
    visualBody,
    shadowDisc,
    sailMesh,
    extraSailMeshes,
    pennantMesh,
    lanternGlowMesh,
    lanternWorldTarget,
    crestAuraMesh,
    cannonMuzzlesPort,
    cannonMuzzlesStbd,
    setSailAmount(level: number) {
      currentSail = level;
    },
    setCrestGlow(active: boolean) {
      crestActive = active;
    },
    setBossEnraged(enraged: boolean) {
      bossEnraged = enraged;
      if (enraged && isBoss) {
        activeSailColor = 0x9b1b1b;
        activeSailEmissive = 0xa82a1a;
        currentLanternHex = 0xff2a1e;
        if (!sailDamaged) {
          sailMat.color.setHex(activeSailColor);
          sailMat.emissive.setHex(activeSailEmissive);
          sailMat.emissiveIntensity = 0.62;
        }
        (lanternGlowMesh.material as THREE.MeshBasicMaterial).color.setHex(currentLanternHex);
      }
    },
    setCrestStyle(crestId: ShipCrestId) {
      if (isEnemy) return;
      const spec = SHIP_CREST_SPECS[crestId] ?? SHIP_CREST_SPECS.corsair;
      activeSailColor = spec.sailHex;
      activeSailEmissive = spec.sailEmissiveHex;
      currentLanternHex = spec.lanternHex;
      if (!sailDamaged) {
        sailMat.color.setHex(activeSailColor);
        sailMat.emissive.setHex(activeSailEmissive);
      }
      brassMat.color.setHex(spec.trimHex);
      const pMat = pennantMesh.material as THREE.MeshBasicMaterial;
      pMat.color.setHex(0xffffff);
      pMat.map = createPennantPatternTexture(crestId, spec.pennantHex);
      pMat.needsUpdate = true;
      if (!smokeActive && !stormWakeActive) {
        (lanternGlowMesh.material as THREE.MeshBasicMaterial).color.setHex(currentLanternHex);
      }
    },
    setShipLoadoutStyle(shipClass: ShipClassId, figId: FigureheadId) {
      if (isEnemy) return;
      activeShipClass = shipClass;
      scale = SHIP_CLASS_SPECS[shipClass]?.hullScale ?? 1.0;
      shadowDisc.scale.setScalar(scale);
      if (foreRigGroup) {
        foreRigGroup.visible = shipClass === 'frigate' || shipClass === 'manowar';
      }
      if (mizzenRigGroup) {
        mizzenRigGroup.visible = shipClass === 'manowar';
      }
      figurehead.visible = figId === 'none';
      figRamGroup.visible = figId === 'ram';
      figSerpentGroup.visible = figId === 'serpent';
      figPhoenixGroup.visible = figId === 'phoenix';
    },
    setSpecialShieldBroken(broken: boolean) {
      if (!isWraith) return;
      hullMat.opacity = broken ? 0.96 : 0.74;
      hullMat.emissive.setHex(broken ? 0x6b2820 : 0x1e6f8c);
      hullMat.emissiveIntensity = broken ? 0.45 : 0.55;
      sailMat.opacity = broken ? 0.95 : 0.8;
      sailMat.emissive.setHex(broken ? 0xff9456 : 0x2ca9c9);
    },
    setHitFlash(amount: number) {
      hitFlashAmt = Math.max(0, Math.min(1, amount));
      if (hitFlashAmt > 0.02) {
        hullMat.emissive.setHex(0xffb470);
        hullMat.emissiveIntensity = hitFlashAmt * 1.15;
        darkTrimMat.emissive.setHex(0xff8f44);
        darkTrimMat.emissiveIntensity = hitFlashAmt * 0.75;
      } else {
        hullMat.emissiveIntensity = 0;
        darkTrimMat.emissiveIntensity = 0;
      }
    },
    setTelegraphFlash(amount: number) {
      telegraphAmt = Math.max(0, Math.min(1, amount));
    },
    setAbilityVfx(opts: { smokeActive: boolean; stormWakeActive: boolean }) {
      smokeActive = opts.smokeActive;
      stormWakeActive = opts.stormWakeActive;
      const lMat = lanternGlowMesh.material as THREE.MeshBasicMaterial;
      if (stormWakeActive) {
        lMat.color.setHex(0x8beeff);
      } else if (smokeActive) {
        lMat.color.setHex(0x5ce8d8);
      } else {
        lMat.color.setHex(currentLanternHex);
      }
    },
    setUpgradeTier(totalLevel: number) {
      const ratio = Math.min(1, Math.max(0, totalLevel / 12));
      brassMat.emissiveIntensity = 0.22 + ratio * 0.45;
    },
    setSailDamaged(damaged: boolean) {
      if (sailDamaged === damaged) return;
      sailDamaged = damaged;
      if (damaged) {
        sailMat.color.setHex(0x6a6e7a);
        sailMat.emissive.setHex(0x1f222d);
        sailMat.emissiveIntensity = 0.18;
      } else {
        sailMat.color.setHex(activeSailColor);
        sailMat.emissive.setHex(activeSailEmissive);
        sailMat.emissiveIntensity = isBoss ? (bossEnraged ? 0.62 : 0.42) : 0.24;
      }
    },
    updateAnimation(time: number, squashY: number, speed: number) {
      const xz = 1 / Math.sqrt(Math.max(0.65, squashY));
      visualBody.scale.set(scale * xz, scale * squashY, scale * xz);

      const sailScaleY = 0.22 + currentSail * 0.82;
      const sailBreathe = 1 + Math.sin(time * 2.6 + (isEnemy ? 1.3 : 0)) * (0.025 + speed * 0.002);
      const tearSkew = sailDamaged ? 0.74 + Math.sin(time * 13) * 0.09 : 1;
      sailMesh.scale.set(sailDamaged ? 0.88 : 1, sailScaleY * tearSkew, sailBreathe);
      sailMesh.position.y = 5.25 - 1.55 * sailScaleY;
      sailMesh.rotation.z = sailDamaged ? Math.sin(time * 9.5) * 0.14 : 0;

      for (const es of extraSailMeshes) {
        es.scale.set(sailDamaged ? 0.88 : 1, sailScaleY * tearSkew, sailBreathe);
        es.rotation.z = sailDamaged ? -Math.sin(time * 9.5) * 0.12 : 0;
      }

      pennantMesh.rotation.y = Math.sin(time * 5.2) * 0.22;
      const lanternPulse = (1 + Math.sin(time * 6.4) * 0.14) * (1 + telegraphAmt * 0.58);
      lanternGlowMesh.scale.setScalar(lanternPulse);
      if (isEnemy) {
        const lMat = lanternGlowMesh.material as THREE.MeshBasicMaterial;
        lMat.color.setHex(telegraphAmt > 0.05 ? 0xff2b1f : currentLanternHex);
      }

      const mat = crestAuraMesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(
        telegraphAmt > 0.12
          ? 0xff3b2e
          : bossEnraged
            ? 0xff4936
            : stormWakeActive
              ? 0x7be0ff
              : smokeActive
                ? 0x54e8d2
                : 0xffb84d,
      );
      const targetOpacity =
        telegraphAmt > 0.12
          ? 0.35 + telegraphAmt * 0.45
          : bossEnraged
            ? 0.52 + Math.sin(time * 10) * 0.16
            : stormWakeActive
              ? 0.65 + Math.sin(time * 12) * 0.15
              : crestActive
                ? 0.42 + Math.sin(time * 7) * 0.14
                : smokeActive
                  ? 0.26 + Math.sin(time * 4) * 0.08
                  : 0;
      mat.opacity += (targetOpacity - mat.opacity) * 0.18;
      crestAuraMesh.rotation.z = time * (bossEnraged ? 1.9 : stormWakeActive ? 2.4 : 0.9);

      const targetBowOp = stormWakeActive ? 0.56 + Math.sin(time * 16) * 0.14 : 0;
      stormBowMat.opacity += (targetBowOp - stormBowMat.opacity) * 0.22;
      stormBowGoldMat.opacity = stormBowMat.opacity * 0.85;
      stormBowGroup.scale.setScalar(stormWakeActive ? 1 + Math.sin(time * 14) * 0.06 : 0.85);

      stormArcMat.opacity = stormWakeActive ? (Math.sin(time * 32) > -0.2 ? 0.88 : 0.25) : 0;
      if (stormWakeActive) {
        const attr = stormArcGeo.attributes.position as THREE.BufferAttribute;
        attr.setXYZ(1, Math.sin(time * 28) * 0.65, 4.9 + Math.cos(time * 22) * 0.25, -1.7);
        attr.setXYZ(2, -Math.cos(time * 26) * 0.55, 3.2 + Math.sin(time * 19) * 0.25, -3.5);
        attr.needsUpdate = true;
      }
    },
  };
}

export interface HeadlandBeacon {
  group: THREE.Group;
  beaconGroup: THREE.Group;
  beaconWorldTarget: THREE.Object3D;
  brazierWorldTarget: THREE.Object3D | null;
  setBrazierLit: (lit: boolean) => void;
  update: (time: number) => void;
}

function buildCragMesh(
  radius: number,
  height: number,
  detail: number,
  seed: number,
  mat: THREE.Material,
): THREE.Mesh {
  const geo = new THREE.DodecahedronGeometry(radius, detail);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const n = 0.82 + 0.26 * Math.sin(vx * 0.7 + seed) * Math.cos(vz * 0.7 - seed);
    const flatTop = vy > radius * 0.45 ? radius * 0.45 + (vy - radius * 0.45) * 0.35 : vy;
    pos.setXYZ(i, vx * n, (flatTop + radius * 0.35) * (height / (radius * 1.4)), vz * n);
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildEngravedHeadland(x: number, z: number, withLighthouse: boolean): HeadlandBeacon {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  // Soft waterline shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 36),
    new THREE.MeshBasicMaterial({
      map: createSoftShadowTexture(),
      transparent: true,
      opacity: 0.46,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.05;
  group.add(shadow);

  const cliffDetail = createCliffDetailMaps();
  const cliffMat = new THREE.MeshStandardMaterial({
    map: createEngravedCliffTexture(),
    bumpMap: cliffDetail.bumpMap,
    bumpScale: 0.28,
    roughnessMap: cliffDetail.roughnessMap,
    roughness: 0.84,
    metalness: 0.08,
  });

  const wetBasaltMat = new THREE.MeshStandardMaterial({
    color: 0x1c2538,
    bumpMap: cliffDetail.bumpMap,
    bumpScale: 0.2,
    roughness: 0.32,
    metalness: 0.12,
  });

  // Multi-tiered sculpted volcanic basalt headland + surrounding coastal sea stacks
  const mainCrag = buildCragMesh(11.4, 8.2, 1, 1.3, cliffMat);
  mainCrag.position.set(0, 0.2, 0);
  group.add(mainCrag);

  const wetShelf = buildCragMesh(12.6, 2.2, 1, 3.7, wetBasaltMat);
  wetShelf.position.set(0.4, -0.35, -0.4);
  group.add(wetShelf);

  const spurs: Array<[number, number, number, number, number, number]> = [
    [-7.8, 0.1, 4.4, 5.2, 4.4, 2.1],
    [6.6, -0.1, -5.2, 4.8, 3.9, 4.4],
    [4.9, 0.1, 6.2, 3.9, 3.1, 6.2],
  ];
  for (const [sx, sy, sz, sr, sh, sseed] of spurs) {
    const spur = buildCragMesh(sr, sh, 1, sseed, cliffMat);
    spur.position.set(sx, sy, sz);
    group.add(spur);
  }

  // Flat carved stone plateau crown for lighthouse or brazier
  const plateau = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.5, 1.1, 10), wetBasaltMat);
  plateau.position.y = 6.9;
  plateau.castShadow = true;
  plateau.receiveShadow = true;
  group.add(plateau);

  const beaconGroup = new THREE.Group();
  const beaconWorldTarget = new THREE.Object3D();
  beaconWorldTarget.position.set(0, 17.9, 0);
  group.add(beaconWorldTarget);

  let brazierWorldTarget: THREE.Object3D | null = null;
  let brazierOrb: THREE.Mesh | null = null;
  let brazierEmbers: THREE.Mesh | null = null;
  let brazierLit = false;

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x202634,
    roughnessMap: createBrushedMetalRoughnessMap(),
    roughness: 0.45,
    metalness: 0.85,
  });

  if (withLighthouse) {
    const masonryDetail = createMasonryDetailMaps();
    const masonryMat = new THREE.MeshStandardMaterial({
      map: createMasonryTexture(),
      bumpMap: masonryDetail.bumpMap,
      bumpScale: 0.18,
      roughnessMap: masonryDetail.roughnessMap,
      roughness: 0.82,
      metalness: 0.06,
    });

    // Stepped stone foundation plinth
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.65, 3.15, 1.4, 12), wetBasaltMat);
    plinth.position.y = 7.9;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    group.add(plinth);

    // Dressed stone masonry tower
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 2.35, 9.4, 14), masonryMat);
    tower.position.y = 12.6;
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    // Arched timber doorway at lighthouse base
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 1.55, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x452b1c, roughness: 0.8 }),
    );
    door.position.set(0, 8.75, 2.35);
    group.add(door);

    // Corbelled stone gallery + wrought-iron balcony railing
    const gallery = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 1.55, 0.65, 14), wetBasaltMat);
    gallery.position.y = 17.35;
    gallery.castShadow = true;
    group.add(gallery);

    const railRing = new THREE.Mesh(new THREE.TorusGeometry(1.96, 0.06, 6, 18), ironMat);
    railRing.rotation.x = Math.PI / 2;
    railRing.position.y = 18.08;
    group.add(railRing);

    for (let p = 0; p < 8; p += 1) {
      const a = (p / 8) * Math.PI * 2;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.52, 5), ironMat);
      post.position.set(Math.cos(a) * 1.96, 17.85, Math.sin(a) * 1.96);
      group.add(post);
    }

    // Glazed lantern room + vertical iron mullions + glowing Fresnel lens
    const lanternGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(1.18, 1.18, 1.45, 10),
      new THREE.MeshPhysicalMaterial({
        color: 0xffefc0,
        emissive: 0xffb84d,
        emissiveIntensity: 0.72,
        transparent: true,
        opacity: 0.52,
        roughness: 0.15,
      }),
    );
    lanternGlass.position.y = 18.35;
    group.add(lanternGlass);

    for (let m = 0; m < 6; m += 1) {
      const a = (m / 6) * Math.PI * 2;
      const mullion = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.55, 5), ironMat);
      mullion.position.set(Math.cos(a) * 1.22, 18.35, Math.sin(a) * 1.22);
      group.add(mullion);
    }

    const lantern = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.76, 1),
      new THREE.MeshBasicMaterial({ color: 0xffe08a }),
    );
    lantern.position.y = 18.35;
    group.add(lantern);

    // Copper cupola dome + brass spire finial
    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(1.72, 1.95, 12),
      new THREE.MeshStandardMaterial({ color: 0xb84636, roughness: 0.44, metalness: 0.35 }),
    );
    cap.position.y = 19.95;
    cap.castShadow = true;
    group.add(cap);

    const finial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.07, 1.1, 6),
      new THREE.MeshStandardMaterial({ color: 0xe6b85c, roughness: 0.26, metalness: 0.85 }),
    );
    finial.position.y = 21.25;
    group.add(finial);

    beaconGroup.position.set(0, 18.35, 0);
    const beamGeo = new THREE.ConeGeometry(8.8, 44, 24, 1, true);
    beamGeo.translate(0, -22, 0);
    beamGeo.rotateX(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffd27d,
      map: createBeamGradientTexture(),
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beaconGroup.add(beam);
    group.add(beaconGroup);
  } else {
    // Ancient Carved Bronze & Iron Signal Brazier on Tripod Pedestal
    const tripodRing = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.14, 6, 12), ironMat);
    tripodRing.rotation.x = Math.PI / 2;
    tripodRing.position.y = 7.75;
    group.add(tripodRing);

    for (let leg = 0; leg < 3; leg += 1) {
      const a = (leg / 3) * Math.PI * 2;
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 1.55, 6), ironMat);
      strut.position.set(Math.cos(a) * 1.15, 7.95, Math.sin(a) * 1.15);
      strut.rotation.z = Math.cos(a) * 0.25;
      strut.rotation.x = -Math.sin(a) * 0.25;
      strut.castShadow = true;
      group.add(strut);
    }

    const brazierBowl = new THREE.Mesh(
      new THREE.CylinderGeometry(1.45, 0.72, 1.05, 10),
      new THREE.MeshStandardMaterial({
        color: 0x4c4236,
        roughnessMap: createBrushedMetalRoughnessMap(),
        roughness: 0.44,
        metalness: 0.72,
      }),
    );
    brazierBowl.position.set(0, 8.35, 0);
    brazierBowl.castShadow = true;
    group.add(brazierBowl);

    brazierEmbers = new THREE.Mesh(
      new THREE.CylinderGeometry(1.18, 0.9, 0.3, 10),
      new THREE.MeshStandardMaterial({
        color: 0x261d24,
        emissive: 0x3b2452,
        emissiveIntensity: 0.7,
        roughness: 0.85,
      }),
    );
    brazierEmbers.position.set(0, 8.85, 0);
    group.add(brazierEmbers);

    brazierOrb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.68, 0),
      new THREE.MeshBasicMaterial({ color: 0x5c4f82 }),
    );
    brazierOrb.position.set(0, 9.45, 0);
    group.add(brazierOrb);

    brazierWorldTarget = new THREE.Object3D();
    brazierWorldTarget.position.set(0, 9.45, 0);
    group.add(brazierWorldTarget);
  }

  return {
    group,
    beaconGroup,
    beaconWorldTarget,
    brazierWorldTarget,
    setBrazierLit(lit: boolean) {
      brazierLit = lit;
      if (brazierOrb) {
        const mat = brazierOrb.material as THREE.MeshBasicMaterial;
        mat.color.setHex(lit ? 0xffcb68 : 0x5c4f82);
      }
      if (brazierEmbers) {
        const em = brazierEmbers.material as THREE.MeshStandardMaterial;
        em.emissive.setHex(lit ? 0xff6a24 : 0x3b2452);
        em.emissiveIntensity = lit ? 1.85 : 0.7;
      }
    },
    update(time: number) {
      if (withLighthouse) {
        beaconGroup.rotation.y = time * 0.42;
      } else if (brazierOrb) {
        brazierOrb.rotation.y = time * (brazierLit ? 2.1 : 0.45);
        const pulse = brazierLit ? 1.25 + Math.sin(time * 7.2) * 0.22 : 0.72 + Math.sin(time * 2.1) * 0.08;
        brazierOrb.scale.setScalar(pulse);
      }
    },
  };
}

export interface BiomeThemeSpec {
  zenith: [number, number, number];
  midSky: [number, number, number];
  horizon: [number, number, number];
  sunColor: [number, number, number];
  mistColor: [number, number, number];
  farRidgeColor: number;
  nearRidgeColor: number;
  cloudColor: number;
  mistRingColor: number;
}

export interface ParallaxEnvironment {
  group: THREE.Group;
  setBiomeTheme: (theme: BiomeThemeSpec) => void;
  update: (time: number, camX: number, camZ: number) => void;
}

function buildSerratedRidgeGeometry(
  radius: number,
  segments: number,
  baseY: number,
  amp1: number,
  amp2: number,
  seed: number,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  for (let i = 0; i < segments; i += 1) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;

    const h0 =
      baseY +
      Math.max(
        1.2,
        Math.sin(a0 * 5 + seed) * amp1 +
          Math.cos(a0 * 11 - seed * 1.4) * amp2 +
          Math.sin(a0 * 19 + seed * 0.5) * (amp2 * 0.45) +
          amp1,
      );
    const h1 =
      baseY +
      Math.max(
        1.2,
        Math.sin(a1 * 5 + seed) * amp1 +
          Math.cos(a1 * 11 - seed * 1.4) * amp2 +
          Math.sin(a1 * 19 + seed * 0.5) * (amp2 * 0.45) +
          amp1,
      );

    const x0 = Math.sin(a0) * radius;
    const z0 = Math.cos(a0) * radius;
    const x1 = Math.sin(a1) * radius;
    const z1 = Math.cos(a1) * radius;

    positions.push(x0, -4, z0, x1, -4, z1, x0, h0, z0);
    uvs.push(i / segments, 0, (i + 1) / segments, 0, i / segments, 1);
    positions.push(x1, -4, z1, x1, h1, z1, x0, h0, z0);
    uvs.push((i + 1) / segments, 0, (i + 1) / segments, 1, i / segments, 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

function createRidgeMaterial(baseHex: number, mistHex: number, opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: true,
    side: THREE.DoubleSide,
    uniforms: {
      uBaseColor: { value: new THREE.Color(baseHex) },
      uMistColor: { value: new THREE.Color(mistHex) },
      uOpacity: { value: opacity },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uBaseColor;
      uniform vec3 uMistColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float baseHaze = 1.0 - smoothstep(0.05, 0.65, vUv.y);
        vec3 col = mix(uBaseColor, uMistColor, baseHaze * 0.68);
        gl_FragColor = vec4(col, uOpacity);
      }
    `,
  });
}

export function buildTwilightParallaxEnvironment(): ParallaxEnvironment {
  const group = new THREE.Group();

  // Tier 1: Volumetric FBM Cloud + Sunset Scattering GLSL Sky Dome (zero rectangular cloud cards)
  const skyGeo = new THREE.SphereGeometry(520, 40, 24);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(-0.52, 0.13, -0.84).normalize() },
      uZenith: { value: new THREE.Vector3(0.02, 0.03, 0.088) },
      uMidSky: { value: new THREE.Vector3(0.082, 0.092, 0.245) },
      uHorizon: { value: new THREE.Vector3(0.32, 0.165, 0.255) },
      uSunColor: { value: new THREE.Vector3(0.96, 0.44, 0.17) },
      uMistColor: { value: new THREE.Vector3(0.12, 0.15, 0.29) },
      uCloudColor: { value: new THREE.Color(0x26294f) },
    },
    vertexShader: `
      varying vec3 vWorldDir;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uZenith;
      uniform vec3 uMidSky;
      uniform vec3 uHorizon;
      uniform vec3 uSunColor;
      uniform vec3 uMistColor;
      uniform vec3 uCloudColor;
      varying vec3 vWorldDir;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise2D(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
        for (int i = 0; i < 4; i++) {
          v += a * noise2D(p);
          p = rot * p * 2.05;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vWorldDir);
        float h = clamp(dir.y, -0.15, 1.0);

        vec3 col = mix(uHorizon, uMidSky, smoothstep(-0.04, 0.27, h));
        col = mix(col, uZenith, smoothstep(0.22, 0.80, h));

        float sunAmt = max(dot(dir, uSunDir), 0.0);
        col += uSunColor * pow(sunAmt, 5.5) * 0.62;
        col += mix(uSunColor, vec3(1.0, 0.88, 0.56), 0.65) * pow(sunAmt, 42.0) * 0.88;
        col += vec3(1.0, 0.94, 0.78) * smoothstep(0.9962, 0.9991, sunAmt);

        // Twinkling stars high in zenith dome
        float starCell = fract(sin(dot(floor(dir * 190.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        float starMask = smoothstep(0.9945, 0.9998, starCell) * smoothstep(0.18, 0.58, h);
        float twinkle = 0.65 + 0.35 * sin(uTime * 2.4 + starCell * 90.0);
        col += vec3(0.95, 0.91, 0.78) * starMask * twinkle * 0.85;

        // Volumetric drifting FBM twilight clouds projected on upper sky plane
        if (h > 0.015) {
          vec2 cloudUv = dir.xz / (h + 0.18) * 1.15 + vec2(uTime * 0.0085, uTime * 0.003);
          float c1 = fbm(cloudUv);
          float c2 = fbm(cloudUv * 2.1 - vec2(uTime * 0.006, 0.0));
          float density = smoothstep(0.46, 0.82, c1 * 0.72 + c2 * 0.28);
          float cloudBand = smoothstep(0.02, 0.14, h) * (1.0 - smoothstep(0.32, 0.74, h));
          density *= cloudBand;

          float sunRim = pow(sunAmt, 3.0);
          vec3 cloudShadow = mix(uCloudColor, uZenith, 0.35);
          vec3 cloudLit = mix(uHorizon, uSunColor, 0.65) * (0.65 + 0.85 * sunRim);
          float edgeLight = smoothstep(0.25, 0.78, 1.0 - c2) * (0.4 + 0.6 * sunRim);
          vec3 cloudCol = mix(cloudShadow, cloudLit, edgeLight);
          col = mix(col, cloudCol, density * 0.68);
        }

        // Soft horizon atmospheric mist ribbon
        float mist = exp(-abs(h - 0.01) * 17.0);
        col = mix(col, uMistColor, mist * 0.46);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  group.add(skyDome);

  // Tier 2: Far atmospheric ridge silhouette with base-mist vertical gradient
  const farRidgeMat = createRidgeMaterial(0x161936, 0x1c2444, 0.84);
  const farRidge = new THREE.Mesh(buildSerratedRidgeGeometry(340, 112, 5.5, 11, 5.8, 1.1), farRidgeMat);
  group.add(farRidge);

  // Tier 3: Closer dark obsidian coastal archipelago silhouette
  const nearRidgeMat = createRidgeMaterial(0x0b1024, 0x161d38, 0.94);
  const nearRidge = new THREE.Mesh(buildSerratedRidgeGeometry(275, 128, 2, 7.2, 4.2, 3.7), nearRidgeMat);
  group.add(nearRidge);

  // Atmospheric mist belt along horizon waterline
  const mistRingMat = new THREE.MeshBasicMaterial({
    color: 0x182040,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    fog: false,
  });
  const mistRing = new THREE.Mesh(
    new THREE.CylinderGeometry(265, 265, 18, 48, 1, true),
    mistRingMat,
  );
  mistRing.position.y = 4;
  group.add(mistRing);

  return {
    group,
    setBiomeTheme(theme: BiomeThemeSpec) {
      skyMat.uniforms.uZenith.value.set(...theme.zenith);
      skyMat.uniforms.uMidSky.value.set(...theme.midSky);
      skyMat.uniforms.uHorizon.value.set(...theme.horizon);
      skyMat.uniforms.uSunColor.value.set(...theme.sunColor);
      skyMat.uniforms.uMistColor.value.set(...theme.mistColor);
      skyMat.uniforms.uCloudColor.value.setHex(theme.cloudColor);
      farRidgeMat.uniforms.uBaseColor.value.setHex(theme.farRidgeColor);
      farRidgeMat.uniforms.uMistColor.value.setRGB(...theme.mistColor);
      nearRidgeMat.uniforms.uBaseColor.value.setHex(theme.nearRidgeColor);
      nearRidgeMat.uniforms.uMistColor.value.setRGB(...theme.mistColor);
      mistRingMat.color.setHex(theme.mistRingColor);
    },
    update(time: number, camX: number, camZ: number) {
      skyMat.uniforms.uTime.value = time;
      skyDome.position.set(camX, 0, camZ);
      farRidge.position.set(camX * 0.85, 0, camZ * 0.85);
      nearRidge.position.set(camX * 0.68, 0, camZ * 0.68);
      mistRing.position.set(camX * 0.72, 4, camZ * 0.72);
    },
  };
}

export type FloatingPropKind = 'repair' | 'powder' | 'gold' | 'barrel';

export interface BuiltFloatingProp {
  group: THREE.Group;
  beaconWorldTarget: THREE.Object3D;
  glowInner: string;
  glowOuter: string;
  update: (time: number) => void;
}

export function buildFloatingProp(kind: FloatingPropKind): BuiltFloatingProp {
  const group = new THREE.Group();
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 3.4),
    new THREE.MeshBasicMaterial({
      map: createSoftShadowTexture(),
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.06;
  group.add(shadow);

  let glowInner = 'rgba(255, 224, 130, 0.72)';
  let glowOuter = 'rgba(255, 165, 50, 0.22)';
  const oakDetail = createOakDetailMaps();
  const metalRough = createBrushedMetalRoughnessMap();
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x262c38,
    roughnessMap: metalRough,
    roughness: 0.44,
    metalness: 0.82,
  });

  if (kind === 'barrel') {
    glowInner = 'rgba(255, 118, 86, 0.78)';
    glowOuter = 'rgba(220, 44, 30, 0.24)';

    const barrelMat = new THREE.MeshStandardMaterial({
      map: createCrateDetailTexture('#6c271d', '#2b1815'),
      bumpMap: oakDetail.bumpMap,
      bumpScale: 0.04,
      roughness: 0.66,
      emissive: 0x260805,
      emissiveIntensity: 0.25,
    });
    const barrel = new THREE.Mesh(createCooperedBarrelGeometry(0.95, 2.05), barrelMat);
    barrel.position.y = 0.72;
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    bodyGroup.add(barrel);

    // Three strapped iron & crimson hazard bands
    for (const [by, br, color] of [
      [0.24, 0.87, 0x222630],
      [0.72, 0.99, 0xff4936],
      [1.22, 0.87, 0x222630],
    ] as Array<[number, number, number]>) {
      const hoop = new THREE.Mesh(
        new THREE.TorusGeometry(br, 0.055, 6, 16),
        color === 0xff4936
          ? new THREE.MeshBasicMaterial({ color })
          : ironMat,
      );
      hoop.rotation.x = Math.PI / 2;
      hoop.position.y = by;
      bodyGroup.add(hoop);
    }

    const fuseOrb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.3, 0),
      new THREE.MeshBasicMaterial({ color: 0xffb84d }),
    );
    fuseOrb.position.y = 1.92;
    bodyGroup.add(fuseOrb);
  } else {
    const colorMap: Record<
      'repair' | 'powder' | 'gold',
      { hexStr: string; bandStr: string; brass: boolean; crystal: number; inner: string; outer: string }
    > = {
      repair: {
        hexStr: '#3c5c43',
        bandStr: '#243428',
        brass: false,
        crystal: 0x45e8a4,
        inner: 'rgba(105, 255, 185, 0.78)',
        outer: 'rgba(42, 200, 132, 0.24)',
      },
      powder: {
        hexStr: '#344664',
        bandStr: '#1d2738',
        brass: false,
        crystal: 0x7be0ff,
        inner: 'rgba(130, 232, 255, 0.82)',
        outer: 'rgba(65, 168, 255, 0.24)',
      },
      gold: {
        hexStr: '#6d4722',
        bandStr: '#9a712c',
        brass: true,
        crystal: 0xffd257,
        inner: 'rgba(255, 224, 120, 0.85)',
        outer: 'rgba(255, 168, 46, 0.26)',
      },
    };
    const pal = colorMap[kind];
    glowInner = pal.inner;
    glowOuter = pal.outer;

    const crateMat = new THREE.MeshStandardMaterial({
      map: createCrateDetailTexture(pal.hexStr, pal.bandStr),
      bumpMap: oakDetail.bumpMap,
      bumpScale: 0.04,
      roughness: 0.68,
    });
    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.52, 1.16, 1.52), crateMat);
    crate.position.y = 0.65;
    crate.castShadow = true;
    crate.receiveShadow = true;
    bodyGroup.add(crate);

    const trimMat = pal.brass
      ? new THREE.MeshStandardMaterial({ color: 0xe6b85c, roughnessMap: metalRough, roughness: 0.28, metalness: 0.84 })
      : ironMat;

    // Cross battens & corner brackets
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.14, 1.62), trimMat);
    cap.position.y = 1.24;
    bodyGroup.add(cap);

    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.38, 0),
      new THREE.MeshBasicMaterial({ color: pal.crystal }),
    );
    gem.position.y = 1.78;
    bodyGroup.add(gem);

    const cage = buildLanternCage(trimMat, 0.42, 0.68);
    cage.position.copy(gem.position);
    bodyGroup.add(cage);
  }

  const beaconWorldTarget = new THREE.Object3D();
  beaconWorldTarget.position.set(0, 1.8, 0);
  bodyGroup.add(beaconWorldTarget);

  return {
    group,
    beaconWorldTarget,
    glowInner,
    glowOuter,
    update(time: number) {
      bodyGroup.position.y = Math.sin(time * 2.8) * 0.24;
      bodyGroup.rotation.y = time * (kind === 'barrel' ? 0.55 : 0.95);
      bodyGroup.rotation.z = Math.sin(time * 2.2) * 0.1;
    },
  };
}

export interface BuiltWhirlpool {
  group: THREE.Group;
  update: (time: number) => void;
}

export function buildWhirlpoolVortex(radius = 16): BuiltWhirlpool {
  const group = new THREE.Group();

  const rings: Array<{ mesh: THREE.Mesh; speed: number }> = [];
  const radii = [radius * 0.95, radius * 0.68, radius * 0.42, radius * 0.22];
  const colors = [0x3b6fb6, 0x62a8ff, 0x8ad8ff, 0xdcf4ff];
  const opacities = [0.28, 0.42, 0.58, 0.76];

  for (let i = 0; i < radii.length; i += 1) {
    const r = radii[i];
    const geo = new THREE.RingGeometry(r * 0.84, r, 36, 1, 0, Math.PI * (1.45 + (i % 2) * 0.35));
    const mat = new THREE.MeshBasicMaterial({
      color: colors[i],
      transparent: true,
      opacity: opacities[i],
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.09 + i * 0.02;
    mesh.rotation.z = i * 1.4;
    group.add(mesh);
    rings.push({ mesh, speed: (i + 1) * 0.95 });
  }

  return {
    group,
    update(time: number) {
      for (let i = 0; i < rings.length; i += 1) {
        rings[i].mesh.rotation.z = time * rings[i].speed + i * 1.4;
      }
    },
  };
}

export interface BuiltRelicBuoy {
  group: THREE.Group;
  beaconWorldTarget: THREE.Object3D;
  update: (time: number) => void;
}

export function buildRelicBuoy(): BuiltRelicBuoy {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 4.4),
    new THREE.MeshBasicMaterial({
      map: createSoftShadowTexture(),
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.07;
  group.add(shadow);

  const oakDetail = createOakDetailMaps();
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd9a84e,
    roughnessMap: createBrushedMetalRoughnessMap(),
    roughness: 0.3,
    metalness: 0.82,
    emissive: 0x3b2205,
    emissiveIntensity: 0.35,
  });

  const baseRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.24, 8, 18),
    new THREE.MeshStandardMaterial({
      map: createCrateDetailTexture('#4a3424', '#1d1612'),
      bumpMap: oakDetail.bumpMap,
      bumpScale: 0.04,
      roughness: 0.65,
      metalness: 0.22,
    }),
  );
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.35;
  baseRing.castShadow = true;
  body.add(baseRing);

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.68, 1.85, 8), brassMat);
  pedestal.position.y = 1.15;
  pedestal.castShadow = true;
  body.add(pedestal);

  const orb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.54, 0),
    new THREE.MeshBasicMaterial({ color: 0xffe082 }),
  );
  orb.position.y = 2.65;
  body.add(orb);

  const cage = buildLanternCage(brassMat, 0.62, 0.96);
  cage.position.copy(orb.position);
  body.add(cage);

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(1.75, 2.08, 28),
    new THREE.MeshBasicMaterial({
      color: 0xffd27d,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.14;
  group.add(halo);

  const beaconWorldTarget = new THREE.Object3D();
  beaconWorldTarget.position.set(0, 2.65, 0);
  body.add(beaconWorldTarget);

  return {
    group,
    beaconWorldTarget,
    update(time: number) {
      body.position.y = Math.sin(time * 2.4) * 0.24;
      orb.rotation.y = time * 1.9;
      orb.scale.setScalar(1 + Math.sin(time * 5.2) * 0.14);
      halo.rotation.z = time * 0.7;
    },
  };
}

export interface BuiltSecretProp {
  group: THREE.Group;
  beaconWorldTarget: THREE.Object3D;
  setHighlight?: (lit: boolean) => void;
  update: (time: number) => void;
}

export function buildSunkenBellBuoy(): BuiltSecretProp {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 4.8),
    new THREE.MeshBasicMaterial({
      map: createSoftShadowTexture(),
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.06;
  group.add(shadow);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.45, 0.22, 8, 18),
    new THREE.MeshStandardMaterial({
      color: 0x2f5f64,
      roughnessMap: createBrushedMetalRoughnessMap(),
      roughness: 0.48,
      metalness: 0.55,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.35;
  ring.castShadow = true;
  body.add(ring);

  // Bell-frame struts supporting the bronze ship's bell
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x242a38, roughness: 0.45, metalness: 0.8 });
  for (const sx of [-1.05, 1.05]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 2.2, 6), ironMat);
    leg.position.set(sx * 0.75, 1.3, 0);
    leg.rotation.z = sx * 0.22;
    body.add(leg);
  }

  const bell = new THREE.Mesh(
    new THREE.ConeGeometry(0.95, 1.45, 14),
    new THREE.MeshStandardMaterial({
      color: 0xc29040,
      roughnessMap: createBrushedMetalRoughnessMap(),
      roughness: 0.32,
      metalness: 0.82,
      emissive: 0x1a1405,
      emissiveIntensity: 0.35,
    }),
  );
  bell.position.y = 1.28;
  bell.castShadow = true;
  body.add(bell);

  const crystalMat = new THREE.MeshBasicMaterial({ color: 0x6ce8d6 });
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 0), crystalMat);
  crystal.position.y = 2.5;
  body.add(crystal);

  const haloMat = new THREE.MeshBasicMaterial({
    color: 0x6ce8d6,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const halo = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.25, 28), haloMat);
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.14;
  group.add(halo);

  const beaconWorldTarget = new THREE.Object3D();
  beaconWorldTarget.position.set(0, 2.5, 0);
  body.add(beaconWorldTarget);

  let highlighted = false;
  return {
    group,
    beaconWorldTarget,
    setHighlight(lit: boolean) {
      highlighted = lit;
      crystalMat.color.setHex(lit ? 0xffe082 : 0x6ce8d6);
      haloMat.color.setHex(lit ? 0xffd27d : 0x6ce8d6);
      haloMat.opacity = lit ? 0.78 : 0.38;
    },
    update(time: number) {
      body.position.y = Math.sin(time * 2.3 + 0.8) * 0.22;
      crystal.rotation.y = time * (highlighted ? 3.2 : 1.3);
      crystal.scale.setScalar((highlighted ? 1.32 : 1.0) + Math.sin(time * 5.0) * 0.1);
      halo.rotation.z = -time * 0.6;
    },
  };
}

export function buildSunkenHulk(): BuiltSecretProp {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(11.5, 11.5),
    new THREE.MeshBasicMaterial({
      map: createSoftShadowTexture(),
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.05;
  group.add(shadow);

  const oakDetail = createOakDetailMaps();
  const woodMat = new THREE.MeshStandardMaterial({
    map: createEngravedOakTexture('#343c44'),
    bumpMap: oakDetail.bumpMap,
    bumpScale: 0.05,
    roughnessMap: oakDetail.roughnessMap,
    roughness: 0.78,
    metalness: 0.06,
  });

  // Sculpted listing wreck hull + protruding exposed timber ribs + snapped yardarm + tattered sail
  const wreckGroup = new THREE.Group();
  wreckGroup.rotation.set(-0.34, 0.22, 0.32);
  wreckGroup.position.set(0, 0.35, 0);
  body.add(wreckGroup);

  const hull = new THREE.Mesh(createSculptedHullGeometry(), woodMat);
  hull.scale.set(1.08, 1.05, 0.85);
  wreckGroup.add(hull);

  // Exposed curved ship ribs along broken waist
  for (let r = -2; r <= 2; r += 1) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(1.38, 0.11, 6, 12, Math.PI), woodMat);
    rib.rotation.z = Math.PI;
    rib.position.set(0, 1.15, r * 0.95);
    wreckGroup.add(rib);
  }

  const brokenMast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 6.4, 8), woodMat);
  brokenMast.position.set(0.2, 3.0, -0.4);
  brokenMast.rotation.set(0.18, 0, -0.25);
  wreckGroup.add(brokenMast);

  const brokenYard = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.2, 6), woodMat);
  brokenYard.position.set(0.8, 4.4, -0.6);
  brokenYard.rotation.set(0.2, 0.3, 1.15);
  wreckGroup.add(brokenYard);

  const tatteredSail = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 1.9, 4, 3),
    new THREE.MeshStandardMaterial({
      map: createEngravedSailTexture(true),
      color: 0x526466,
      roughness: 0.9,
      side: THREE.DoubleSide,
    }),
  );
  tatteredSail.position.set(1.1, 3.5, -0.6);
  tatteredSail.rotation.set(0.2, 0.3, -0.35);
  wreckGroup.add(tatteredSail);

  enableShadows(wreckGroup, true, true);

  const lantern = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.56, 0),
    new THREE.MeshBasicMaterial({ color: 0x54f2a8 }),
  );
  lantern.position.set(1.35, 5.0, -1.1);
  body.add(lantern);

  const cage = buildLanternCage(
    new THREE.MeshStandardMaterial({ color: 0x2a3642, roughness: 0.45, metalness: 0.8 }),
    0.64,
    0.96,
  );
  cage.position.copy(lantern.position);
  body.add(cage);

  const beaconWorldTarget = new THREE.Object3D();
  beaconWorldTarget.position.copy(lantern.position);
  body.add(beaconWorldTarget);

  return {
    group,
    beaconWorldTarget,
    update(time: number) {
      body.position.y = Math.sin(time * 1.45) * 0.16;
      body.rotation.z = Math.sin(time * 1.1) * 0.04;
      lantern.rotation.y = time * 1.5;
      lantern.scale.setScalar(1 + Math.sin(time * 3.8) * 0.15);
    },
  };
}

export function buildStormConductorBuoy(): BuiltSecretProp {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 4.6),
    new THREE.MeshBasicMaterial({
      map: createSoftShadowTexture(),
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.06;
  group.add(shadow);

  const metalRough = createBrushedMetalRoughnessMap();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.45, 0.9, 10),
    new THREE.MeshStandardMaterial({
      color: 0x25304a,
      roughnessMap: metalRough,
      roughness: 0.48,
      metalness: 0.52,
    }),
  );
  base.position.y = 0.45;
  base.castShadow = true;
  body.add(base);

  const spire = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 3.3, 10),
    new THREE.MeshStandardMaterial({
      color: 0xd98648,
      roughnessMap: metalRough,
      roughness: 0.28,
      metalness: 0.84,
      emissive: 0x241205,
      emissiveIntensity: 0.35,
    }),
  );
  spire.position.y = 2.25;
  spire.castShadow = true;
  body.add(spire);

  const coilMat = new THREE.MeshBasicMaterial({ color: 0x7be0ff });
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.12, 8, 18), coilMat);
  coil.rotation.x = Math.PI / 2;
  coil.position.y = 2.1;
  body.add(coil);

  const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.46, 0), coilMat);
  tip.position.y = 4.05;
  body.add(tip);

  const haloMat = new THREE.MeshBasicMaterial({
    color: 0x7be0ff,
    transparent: true,
    opacity: 0.44,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const halo = new THREE.Mesh(new THREE.RingGeometry(1.7, 2.05, 28), haloMat);
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.14;
  group.add(halo);

  const beaconWorldTarget = new THREE.Object3D();
  beaconWorldTarget.position.set(0, 4.05, 0);
  body.add(beaconWorldTarget);

  let energized = false;
  return {
    group,
    beaconWorldTarget,
    setHighlight(active: boolean) {
      energized = active;
      haloMat.opacity = active ? 0.78 : 0.4;
      coilMat.color.setHex(active ? 0xc2f2ff : 0x7be0ff);
    },
    update(time: number) {
      body.position.y = Math.sin(time * 2.6 + 1.4) * 0.24;
      tip.rotation.y = time * (energized ? 3.8 : 1.7);
      coil.position.y = 2.05 + Math.sin(time * 4.5) * 0.22;
      halo.rotation.z = time * (energized ? 1.6 : 0.65);
    },
  };
}

export function buildSunkenReefChest(): BuiltSecretProp {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(5.0, 5.0),
    new THREE.MeshBasicMaterial({
      map: createSoftShadowTexture(),
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.05;
  group.add(shadow);

  const chestGroup = new THREE.Group();
  chestGroup.position.y = 0.65;
  chestGroup.rotation.set(0.12, 0.35, -0.14);
  body.add(chestGroup);

  const woodMat = new THREE.MeshStandardMaterial({
    map: createCrateDetailTexture('#663c1e', '#322014'),
    bumpMap: createOakDetailMaps().bumpMap,
    bumpScale: 0.04,
    roughness: 0.55,
    metalness: 0.25,
    emissive: 0x0b2c1d,
    emissiveIntensity: 0.4,
  });
  const chestBox = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.95, 1.45), woodMat);
  chestGroup.add(chestBox);

  // Sculpted arched barrel-vault chest lid
  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.72, 2.1, 12, 1, false, 0, Math.PI),
    woodMat,
  );
  lid.rotation.z = Math.PI / 2;
  lid.position.y = 0.48;
  chestGroup.add(lid);

  const bandMat = new THREE.MeshStandardMaterial({
    color: 0xe2a84c,
    roughnessMap: createBrushedMetalRoughnessMap(),
    roughness: 0.26,
    metalness: 0.84,
  });
  for (const bx of [-0.72, 0.72]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.05, 1.52), bandMat);
    strap.position.x = bx;
    chestGroup.add(strap);
  }
  const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.1), bandMat);
  lockPlate.position.set(0, 0.35, 0.74);
  chestGroup.add(lockPlate);
  enableShadows(chestGroup, true, true);

  const gemMat = new THREE.MeshBasicMaterial({ color: 0x3ef09c });
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.54, 0), gemMat);
  gem.position.y = 2.45;
  body.add(gem);

  const haloMat = new THREE.MeshBasicMaterial({
    color: 0x3ef09c,
    transparent: true,
    opacity: 0.46,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const halo = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.35, 28), haloMat);
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.14;
  group.add(halo);

  const beaconWorldTarget = new THREE.Object3D();
  beaconWorldTarget.position.set(0, 2.45, 0);
  body.add(beaconWorldTarget);

  let latched = false;
  return {
    group,
    beaconWorldTarget,
    setHighlight(active: boolean) {
      latched = active;
      gemMat.color.setHex(active ? 0xffe082 : 0x3ef09c);
      haloMat.color.setHex(active ? 0xffd27d : 0x3ef09c);
      haloMat.opacity = active ? 0.85 : 0.46;
    },
    update(time: number) {
      body.position.y = Math.sin(time * 2.2) * 0.26 + (latched ? 0.45 : 0);
      gem.rotation.y = time * (latched ? 4.2 : 1.7);
      gem.scale.setScalar((latched ? 1.35 : 1.0) + Math.sin(time * 4.8) * 0.12);
      halo.rotation.z = time * (latched ? 1.8 : 0.65);
    },
  };
}

export function buildShadowStraitBuoy(): BuiltSecretProp {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 4.2),
    new THREE.MeshBasicMaterial({
      map: createSoftShadowTexture(),
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.05;
  group.add(shadow);

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1d2336,
    roughnessMap: createBrushedMetalRoughnessMap(),
    roughness: 0.55,
    metalness: 0.55,
  });

  const floatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.15, 0.75, 10), ironMat);
  floatBase.position.y = 0.38;
  floatBase.castShadow = true;
  body.add(floatBase);

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.22, 2.75, 8),
    new THREE.MeshStandardMaterial({ color: 0x2f384e, roughness: 0.6, metalness: 0.45 }),
  );
  mast.position.y = 1.75;
  mast.castShadow = true;
  body.add(mast);

  const lanternMat = new THREE.MeshBasicMaterial({ color: 0xff684c });
  const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.52, 0), lanternMat);
  lantern.position.y = 3.45;
  body.add(lantern);

  const cage = buildLanternCage(ironMat, 0.58, 0.88);
  cage.position.copy(lantern.position);
  body.add(cage);

  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xff684c,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const halo = new THREE.Mesh(new THREE.RingGeometry(1.55, 1.9, 26), haloMat);
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.14;
  group.add(halo);

  const beaconWorldTarget = new THREE.Object3D();
  beaconWorldTarget.position.set(0, 3.45, 0);
  body.add(beaconWorldTarget);

  let veiled = false;
  return {
    group,
    beaconWorldTarget,
    setHighlight(active: boolean) {
      veiled = active;
      lanternMat.color.setHex(active ? 0x5ce8d8 : 0xff684c);
      haloMat.color.setHex(active ? 0x5ce8d8 : 0xff684c);
      haloMat.opacity = active ? 0.8 : 0.42;
    },
    update(time: number) {
      body.position.y = Math.sin(time * 2.5 + 0.5) * 0.2;
      body.rotation.z = Math.sin(time * 1.8) * 0.06;
      lantern.rotation.y = time * (veiled ? 3.0 : 1.2);
      halo.rotation.z = -time * (veiled ? 1.4 : 0.55);
    },
  };
}

export function buildStormRiftPillar(): BuiltSecretProp {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const vortexMat = new THREE.MeshBasicMaterial({
    color: 0x7be0ff,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const vortexCone = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 0.85, 8.5, 14, 1, true), vortexMat);
  vortexCone.position.y = 4.3;
  body.add(vortexCone);

  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffe082 });
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), coreMat);
  core.position.y = 3.2;
  body.add(core);

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffe082,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const outerRing = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.1, 32), ringMat);
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.2;
  group.add(outerRing);

  const beaconWorldTarget = new THREE.Object3D();
  beaconWorldTarget.position.set(0, 3.6, 0);
  body.add(beaconWorldTarget);

  let overdriveLit = false;
  return {
    group,
    beaconWorldTarget,
    setHighlight(active: boolean) {
      overdriveLit = active;
      vortexMat.opacity = active ? 0.62 : 0.34;
      vortexMat.color.setHex(active ? 0xffe082 : 0x7be0ff);
      ringMat.opacity = active ? 0.92 : 0.62;
    },
    update(time: number) {
      vortexCone.rotation.y = time * (overdriveLit ? 4.4 : 2.1);
      core.rotation.y = -time * 3.2;
      core.rotation.x = Math.sin(time * 2.5) * 0.4;
      core.position.y = 3.2 + Math.sin(time * 4.2) * 0.45;
      core.scale.setScalar((overdriveLit ? 1.38 : 1.0) + Math.sin(time * 7) * 0.14);
      outerRing.rotation.z = time * (overdriveLit ? 2.4 : 0.9);
    },
  };
}

export interface SeagullFlock {
  group: THREE.Group;
  update: (time: number, centerX: number, centerZ: number) => void;
  dispose: () => void;
}

export function buildSeagullFlock(count = 8): SeagullFlock {
  const group = new THREE.Group();

  const bodyGeo = new THREE.ConeGeometry(0.11, 0.74, 6);
  bodyGeo.rotateX(Math.PI / 2);

  // Swept gull wing geometry (inner wing + tapered wingtip angled slightly aft)
  const wingGeo = new THREE.BufferGeometry();
  const wingVerts = new Float32Array([
    0, 0.02, -0.14,
    0.72, 0.06, -0.05,
    0.72, 0.04, 0.14,
    0, 0.02, -0.14,
    0.72, 0.04, 0.14,
    0, 0, 0.18,
    0.72, 0.06, -0.05,
    1.36, -0.04, 0.18,
    0.72, 0.04, 0.14,
    0.72, 0.04, 0.14,
    1.36, -0.04, 0.18,
    1.28, -0.05, 0.28,
  ]);
  wingGeo.setAttribute('position', new THREE.BufferAttribute(wingVerts, 3));
  wingGeo.computeVertexNormals();

  const tipGeo = new THREE.BufferGeometry();
  const tipVerts = new Float32Array([
    0.96, 0.01, 0.04,
    1.36, -0.04, 0.18,
    1.28, -0.05, 0.28,
    0.96, 0.01, 0.04,
    1.28, -0.05, 0.28,
    0.92, -0.01, 0.19,
  ]);
  tipGeo.setAttribute('position', new THREE.BufferAttribute(tipVerts, 3));
  tipGeo.computeVertexNormals();

  const featherMat = new THREE.MeshBasicMaterial({
    color: 0xeaf0fb,
    side: THREE.DoubleSide,
  });
  const tipMat = new THREE.MeshBasicMaterial({
    color: 0x35435e,
    side: THREE.DoubleSide,
  });

  interface GullActor {
    root: THREE.Group;
    leftWing: THREE.Group;
    rightWing: THREE.Group;
    orbitRadius: number;
    orbitSpeed: number;
    baseAngle: number;
    altitude: number;
    flapSpeed: number;
    flapPhase: number;
    offsetX: number;
    offsetZ: number;
  }

  const gulls: GullActor[] = [];
  for (let i = 0; i < count; i += 1) {
    const root = new THREE.Group();
    const body = new THREE.Mesh(bodyGeo, featherMat);
    root.add(body);

    const rightWing = new THREE.Group();
    rightWing.add(new THREE.Mesh(wingGeo, featherMat));
    rightWing.add(new THREE.Mesh(tipGeo, tipMat));
    root.add(rightWing);

    const leftWing = new THREE.Group();
    const lInner = new THREE.Mesh(wingGeo, featherMat);
    lInner.scale.x = -1;
    const lTip = new THREE.Mesh(tipGeo, tipMat);
    lTip.scale.x = -1;
    leftWing.add(lInner, lTip);
    root.add(leftWing);

    const scale = 0.85 + (i % 3) * 0.2;
    root.scale.setScalar(scale);
    group.add(root);

    gulls.push({
      root,
      leftWing,
      rightWing,
      orbitRadius: 24 + (i % 4) * 12,
      orbitSpeed: (i % 2 === 0 ? 1 : -1) * (0.14 + (i % 3) * 0.045),
      baseAngle: (i / count) * Math.PI * 2,
      altitude: 14.5 + (i % 4) * 3.1,
      flapSpeed: 5.4 + (i % 3) * 0.9,
      flapPhase: i * 1.37,
      offsetX: ((i % 3) - 1) * 16,
      offsetZ: (Math.floor(i / 3) - 1) * 18,
    });
  }

  return {
    group,
    update(time: number, centerX: number, centerZ: number) {
      for (const g of gulls) {
        const theta = g.baseAngle + time * g.orbitSpeed;
        const r = g.orbitRadius + Math.sin(time * 0.4 + g.flapPhase) * 4.5;
        const gx = centerX + g.offsetX + Math.cos(theta) * r;
        const gz = centerZ + g.offsetZ + Math.sin(theta) * r;
        const gy = g.altitude + Math.sin(time * 0.85 + g.flapPhase) * 1.4;

        g.root.position.set(gx, gy, gz);
        // Face tangent of circular orbit
        const tangentYaw = Math.atan2(
          -Math.sin(theta) * g.orbitSpeed,
          Math.cos(theta) * g.orbitSpeed,
        );
        g.root.rotation.set(0, -tangentYaw, g.orbitSpeed > 0 ? -0.22 : 0.22);

        // Alternate active wing flaps with brief thermal glides
        const glideCycle = 0.5 + 0.5 * Math.sin(time * 0.9 + g.flapPhase);
        const flapAmp = 0.14 + glideCycle * 0.44;
        const flap = Math.sin(time * g.flapSpeed + g.flapPhase) * flapAmp + 0.08;
        g.rightWing.rotation.z = flap;
        g.leftWing.rotation.z = -flap;
      }
    },
    dispose() {
      bodyGeo.dispose();
      wingGeo.dispose();
      tipGeo.dispose();
      featherMat.dispose();
      tipMat.dispose();
    },
  };
}

export interface BuiltSeaFortress {
  root: THREE.Group;
  visualBody: THREE.Group;
  turretGroup: THREE.Group;
  lanternWorldTarget: THREE.Object3D;
  setHitFlash: (amount: number) => void;
  setTelegraphFlash: (amount: number) => void;
  update: (time: number, targetX: number, targetZ: number) => void;
}

export function buildSeaFortress(): BuiltSeaFortress {
  const root = new THREE.Group();
  const visualBody = new THREE.Group();
  root.add(visualBody);

  const shadowDisc = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 18),
    new THREE.MeshBasicMaterial({
      map: createSoftShadowTexture(),
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    }),
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.06;
  root.add(shadowDisc);

  const stoneDetails = createMasonryDetailMaps();
  const stoneMat = new THREE.MeshStandardMaterial({
    map: createMasonryTexture(),
    color: 0xb88e96,
    bumpMap: stoneDetails.bumpMap,
    bumpScale: 0.06,
    roughness: 0.84,
    metalness: 0.14,
  });

  const cliffMat = new THREE.MeshStandardMaterial({
    map: createEngravedCliffTexture(),
    color: 0x99737d,
    bumpMap: createCliffDetailMaps().bumpMap,
    bumpScale: 0.08,
    roughness: 0.9,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xe2a84c,
    roughnessMap: createBrushedMetalRoughnessMap(),
    roughness: 0.3,
    metalness: 0.84,
    emissive: 0x3b1e08,
    emissiveIntensity: 0.35,
  });

  const shoal = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 8.2, 1.35, 8), cliffMat);
  shoal.position.y = 0.4;
  shoal.castShadow = true;
  shoal.receiveShadow = true;
  visualBody.add(shoal);

  const bastion = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 5.8, 3.8, 8), stoneMat);
  bastion.position.y = 2.6;
  bastion.castShadow = true;
  bastion.receiveShadow = true;
  addInkEdges(bastion, 28, 0x0b0f1d, 0.45);
  visualBody.add(bastion);

  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    const merlon = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.72, 0.7), stoneMat);
    merlon.position.set(Math.cos(a) * 4.5, 4.78, Math.sin(a) * 4.5);
    merlon.rotation.y = -a + Math.PI / 2;
    merlon.castShadow = true;
    visualBody.add(merlon);
  }

  const turretGroup = new THREE.Group();
  turretGroup.position.y = 4.65;
  visualBody.add(turretGroup);

  const turretRing = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.8, 0.9, 12), brassMat);
  turretRing.castShadow = true;
  turretGroup.add(turretRing);

  for (const offset of [-0.75, 0.75]) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 3.8, 10), brassMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(offset, 0.25, -2.0);
    barrel.castShadow = true;
    turretGroup.add(barrel);
  }

  const furnaceMat = new THREE.MeshBasicMaterial({ color: 0xff6232 });
  const furnaceOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0), furnaceMat);
  furnaceOrb.position.set(0, 6.1, 0);
  visualBody.add(furnaceOrb);

  const lanternWorldTarget = new THREE.Object3D();
  lanternWorldTarget.position.copy(furnaceOrb.position);
  visualBody.add(lanternWorldTarget);

  let telegraphAmt = 0;
  return {
    root,
    visualBody,
    turretGroup,
    lanternWorldTarget,
    setHitFlash(amount: number) {
      stoneMat.emissive.setHex(amount > 0.02 ? 0xff9a52 : 0x000000);
      stoneMat.emissiveIntensity = amount > 0.02 ? amount * 0.95 : 0;
    },
    setTelegraphFlash(amount: number) {
      telegraphAmt = Math.max(0, Math.min(1, amount));
      furnaceMat.color.setHex(telegraphAmt > 0.15 ? 0xffd27d : 0xff6232);
    },
    update(time: number, targetX: number, targetZ: number) {
      const dx = targetX - root.position.x;
      const dz = targetZ - root.position.z;
      const desiredYaw = Math.atan2(dx, -dz);
      turretGroup.rotation.y += (desiredYaw - turretGroup.rotation.y) * 0.08;
      furnaceOrb.rotation.y = time * 1.4;
      furnaceOrb.scale.setScalar(1 + Math.sin(time * 5.2) * 0.14 + telegraphAmt * 0.38);
    },
  };
}

export interface BuiltKrakenBoss {
  root: THREE.Group;
  visualBody: THREE.Group;
  lanternWorldTarget: THREE.Object3D;
  setArmorBroken: (broken: boolean) => void;
  setHitFlash: (amount: number) => void;
  setTelegraphFlash: (amount: number) => void;
  update: (time: number) => void;
}

export function buildKrakenBoss(): BuiltKrakenBoss {
  const root = new THREE.Group();
  const visualBody = new THREE.Group();
  root.add(visualBody);

  const shadowDisc = new THREE.Mesh(
    new THREE.PlaneGeometry(19, 19),
    new THREE.MeshBasicMaterial({
      map: createSoftShadowTexture(),
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    }),
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.08;
  root.add(shadowDisc);

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x261d3a,
    roughness: 0.42,
    metalness: 0.24,
    emissive: new THREE.Color(0x160a2e),
    emissiveIntensity: 0.48,
  });

  const chitinMat = new THREE.MeshStandardMaterial({
    color: 0x4b3b68,
    roughness: 0.3,
    metalness: 0.65,
    emissive: new THREE.Color(0x284e78),
    emissiveIntensity: 0.45,
  });

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffb84d });

  const mantle = new THREE.Mesh(new THREE.ConeGeometry(2.35, 6.2, 9), skinMat);
  mantle.position.y = 3.2;
  mantle.rotation.x = -0.18;
  mantle.castShadow = true;
  visualBody.add(mantle);

  for (const sx of [-0.88, 0.88]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), eyeMat);
    eye.position.set(sx, 1.85, -1.72);
    visualBody.add(eye);
  }

  const shieldRingMat = new THREE.MeshBasicMaterial({
    color: 0x7be0ff,
    transparent: true,
    opacity: 0.56,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const shieldRing = new THREE.Mesh(new THREE.RingGeometry(4.4, 5.1, 32), shieldRingMat);
  shieldRing.rotation.x = -Math.PI / 2;
  shieldRing.position.y = 0.25;
  visualBody.add(shieldRing);

  const tentacles: THREE.Group[] = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2 + 0.35;
    const tGroup = new THREE.Group();
    tGroup.position.set(Math.cos(a) * 3.1, 0.35, Math.sin(a) * 3.1);
    tGroup.rotation.y = -a;

    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.68, 3.6, 8), skinMat);
    lower.position.y = 1.6;
    lower.rotation.z = -0.25;
    lower.castShadow = true;
    tGroup.add(lower);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.44, 3.2, 7), chitinMat);
    tip.position.set(0.6, 4.2, 0);
    tip.rotation.z = 0.42;
    tip.castShadow = true;
    tGroup.add(tip);

    visualBody.add(tGroup);
    tentacles.push(tGroup);
  }

  const lanternWorldTarget = new THREE.Object3D();
  lanternWorldTarget.position.set(0, 3.6, 0);
  visualBody.add(lanternWorldTarget);

  let armorBroken = false;
  let telegraphAmt = 0;

  return {
    root,
    visualBody,
    lanternWorldTarget,
    setArmorBroken(broken: boolean) {
      armorBroken = broken;
      chitinMat.emissive.setHex(broken ? 0x8a2c1e : 0x284e78);
      shieldRingMat.color.setHex(broken ? 0xff7b54 : 0x7be0ff);
      shieldRingMat.opacity = broken ? 0.28 : 0.56;
    },
    setHitFlash(amount: number) {
      skinMat.emissive.setHex(amount > 0.02 ? 0xff8a4c : 0x160a2e);
      skinMat.emissiveIntensity = amount > 0.02 ? amount * 1.15 : 0.48;
    },
    setTelegraphFlash(amount: number) {
      telegraphAmt = Math.max(0, Math.min(1, amount));
      eyeMat.color.setHex(telegraphAmt > 0.15 ? 0xff3b2e : 0xffb84d);
    },
    update(time: number) {
      mantle.position.y = 3.1 + Math.sin(time * 2.1) * 0.34;
      shieldRing.rotation.z = time * (armorBroken ? 1.8 : 0.7);
      for (let i = 0; i < tentacles.length; i += 1) {
        const tg = tentacles[i];
        const phase = time * (2.6 + telegraphAmt * 2.4) + i * 1.05;
        tg.rotation.z = Math.sin(phase) * (0.28 + telegraphAmt * 0.25);
        tg.rotation.x = Math.cos(phase * 0.8) * 0.18;
      }
    },
  };
}

export interface AtmosphericVfxSystem {
  group: THREE.Group;
  update: (
    time: number,
    playerX: number,
    playerZ: number,
    godRaysEnabled: boolean,
    motesCount: number,
    debrisVisible: boolean,
  ) => void;
  dispose: () => void;
}

export function buildAtmosphericVfx(): AtmosphericVfxSystem {
  const group = new THREE.Group();

  // 1. Volumetric Golden-Twilight God Rays (additive tapered translucent shafts)
  const rayGroup = new THREE.Group();
  const rayGeo = new THREE.PlaneGeometry(16, 86, 1, 1);
  const rayMat = new THREE.MeshBasicMaterial({
    map: createBeamGradientTexture(),
    color: 0xffd288,
    transparent: true,
    opacity: 0.11,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const rayConfigs = [
    { x: -38, y: 26, z: -72, rz: 0.34, ry: 0.22 },
    { x: 6, y: 30, z: -84, rz: 0.28, ry: -0.14 },
    { x: 46, y: 27, z: -68, rz: 0.38, ry: -0.28 },
  ];
  const rayMeshes: THREE.Mesh[] = [];
  for (const rc of rayConfigs) {
    const m = new THREE.Mesh(rayGeo, rayMat);
    m.position.set(rc.x, rc.y, rc.z);
    m.rotation.set(0.18, rc.ry, rc.rz);
    rayGroup.add(m);
    rayMeshes.push(m);
  }
  group.add(rayGroup);

  // 2. Instanced Drifting Twilight Dust Motes (240 cap, scaled dynamically by preset)
  const MAX_MOTES = 240;
  const moteGeo = new THREE.OctahedronGeometry(0.16, 0);
  const moteMat = new THREE.MeshBasicMaterial({
    color: 0xffe4a8,
    transparent: true,
    opacity: 0.62,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const motesMesh = new THREE.InstancedMesh(moteGeo, moteMat, MAX_MOTES);
  motesMesh.frustumCulled = false;
  const moteSeeds = new Float32Array(MAX_MOTES * 4);
  for (let i = 0; i < MAX_MOTES; i += 1) {
    moteSeeds[i * 4 + 0] = (Math.random() - 0.5) * 145;
    moteSeeds[i * 4 + 1] = 2.2 + Math.random() * 19;
    moteSeeds[i * 4 + 2] = (Math.random() - 0.5) * 145;
    moteSeeds[i * 4 + 3] = Math.random() * Math.PI * 2;
  }
  group.add(motesMesh);

  // 3. Instanced Distant Perimeter Sea Stacks / Basalt Pillars (single draw call)
  const STACK_COUNT = 22;
  const stackGeo = new THREE.DodecahedronGeometry(3.4, 0);
  const stackMat = new THREE.MeshStandardMaterial({
    color: 0x1b233f,
    roughness: 0.9,
    metalness: 0.08,
  });
  const stacksMesh = new THREE.InstancedMesh(stackGeo, stackMat, STACK_COUNT);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < STACK_COUNT; i += 1) {
    const angle = (i / STACK_COUNT) * Math.PI * 2 + (i % 3) * 0.07;
    const dist = 165 + (i % 4) * 18;
    const sx = Math.cos(angle) * dist;
    const sz = Math.sin(angle) * dist;
    const syScale = 1.1 + (i % 5) * 0.65;
    const sxScale = 0.9 + (i % 3) * 0.45;
    dummy.position.set(sx, syScale * 1.4, sz);
    dummy.rotation.set(0.08 * (i % 2), angle, 0.05 * ((i + 1) % 2));
    dummy.scale.set(sxScale, syScale, sxScale);
    dummy.updateMatrix();
    stacksMesh.setMatrixAt(i, dummy.matrix);
  }
  stacksMesh.instanceMatrix.needsUpdate = true;
  group.add(stacksMesh);

  return {
    group,
    update(
      time: number,
      playerX: number,
      playerZ: number,
      godRaysEnabled: boolean,
      motesCount: number,
      debrisVisible: boolean,
    ) {
      rayGroup.visible = godRaysEnabled;
      if (godRaysEnabled) {
        rayGroup.position.set(playerX * 0.5, 0, playerZ * 0.5);
        for (let i = 0; i < rayMeshes.length; i += 1) {
          rayMeshes[i].rotation.z = rayConfigs[i].rz + Math.sin(time * 0.25 + i) * 0.04;
        }
      }

      const activeMotes = Math.max(0, Math.min(MAX_MOTES, motesCount));
      motesMesh.visible = activeMotes > 0;
      motesMesh.count = activeMotes;
      if (activeMotes > 0) {
        for (let i = 0; i < activeMotes; i += 1) {
          const sx = moteSeeds[i * 4 + 0];
          const sy = moteSeeds[i * 4 + 1];
          const sz = moteSeeds[i * 4 + 2];
          const phase = moteSeeds[i * 4 + 3];
          dummy.position.set(
            playerX + sx + Math.sin(time * 0.35 + phase) * 3.2,
            sy + Math.cos(time * 0.5 + phase) * 1.4,
            playerZ + sz + Math.cos(time * 0.32 + phase) * 3.2,
          );
          const sc = 0.55 + Math.sin(time * 1.6 + phase) * 0.3;
          dummy.scale.setScalar(sc);
          dummy.rotation.set(time * 0.4 + phase, time * 0.6, 0);
          dummy.updateMatrix();
          motesMesh.setMatrixAt(i, dummy.matrix);
        }
        motesMesh.instanceMatrix.needsUpdate = true;
      }

      stacksMesh.visible = debrisVisible;
    },
    dispose() {
      rayGeo.dispose();
      rayMat.dispose();
      moteGeo.dispose();
      moteMat.dispose();
      stackGeo.dispose();
      stackMat.dispose();
    },
  };
}

export interface BuiltWreckageCluster {
  group: THREE.Group;
  beaconWorldTarget: THREE.Object3D;
  update: (time: number, inRange: boolean) => void;
}

export function buildWreckageCluster(): BuiltWreckageCluster {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(11.5, 11.5),
    new THREE.MeshBasicMaterial({
      map: createSoftShadowTexture(),
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.06;
  group.add(shadow);

  const oakDetail = createOakDetailMaps();
  const woodMat = new THREE.MeshStandardMaterial({
    map: createEngravedOakTexture('#463225'),
    bumpMap: oakDetail.bumpMap,
    bumpScale: 0.05,
    roughnessMap: oakDetail.roughnessMap,
    roughness: 0.76,
    metalness: 0.08,
  });

  // Shattered hull ribs & snapped spar tilted in the swell
  const plankRaft = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.42, 3.2), woodMat);
  plankRaft.position.set(-0.3, 0.25, 0.2);
  plankRaft.rotation.set(0.08, 0.42, -0.11);
  plankRaft.castShadow = true;
  body.add(plankRaft);

  for (let r = -1; r <= 1; r += 1) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.12, 6, 10, Math.PI * 0.85), woodMat);
    rib.position.set(-0.5, 0.45, r * 1.15);
    rib.rotation.set(0, 0.35, Math.PI * 0.92);
    body.add(rib);
  }

  const snappedMast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 5.4, 7), woodMat);
  snappedMast.position.set(0.8, 1.9, -0.4);
  snappedMast.rotation.set(0.28, 0.1, -0.44);
  snappedMast.castShadow = true;
  body.add(snappedMast);

  // Brass-strapped salvage treasure chest perched on wreckage
  const chestWoodMat = new THREE.MeshStandardMaterial({
    map: createCrateDetailTexture('#6c3e1d', '#2e1a10'),
    bumpMap: oakDetail.bumpMap,
    bumpScale: 0.04,
    roughness: 0.56,
    metalness: 0.24,
  });
  const chestBox = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.9, 1.2), chestWoodMat);
  chestBox.position.set(-0.2, 0.85, 0.35);
  chestBox.rotation.y = 0.32;
  chestBox.castShadow = true;
  body.add(chestBox);

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xf4c97a,
    roughnessMap: createBrushedMetalRoughnessMap(),
    roughness: 0.28,
    metalness: 0.85,
    emissive: 0x5c3908,
    emissiveIntensity: 0.4,
  });
  const gemMat = new THREE.MeshBasicMaterial({ color: 0xffe082 });
  const beaconGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), gemMat);
  beaconGem.position.set(0.95, 3.8, -0.5);
  body.add(beaconGem);

  const cage = buildLanternCage(brassMat, 0.58, 0.92);
  cage.position.copy(beaconGem.position);
  body.add(cage);

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xf4c97a,
    transparent: true,
    opacity: 0.44,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(8.6, 9.2, 42), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.16;
  group.add(ring);

  const beaconWorldTarget = new THREE.Object3D();
  beaconWorldTarget.position.copy(beaconGem.position);
  body.add(beaconWorldTarget);

  return {
    group,
    beaconWorldTarget,
    update(time: number, inRange: boolean) {
      body.position.y = Math.sin(time * 2.1) * 0.2;
      body.rotation.z = Math.sin(time * 1.4) * 0.06;
      beaconGem.rotation.y = time * (inRange ? 3.8 : 1.7);
      beaconGem.scale.setScalar((inRange ? 1.32 : 1.0) + Math.sin(time * 5.2) * 0.12);
      ringMat.color.setHex(inRange ? 0x54f2a8 : 0xf4c97a);
      ringMat.opacity = inRange ? 0.78 : 0.36 + Math.sin(time * 3.1) * 0.08;
      ring.rotation.z = time * 0.45;
    },
  };
}

export interface BuiltMerchantSkiff {
  root: THREE.Group;
  visualBody: THREE.Group;
  beaconWorldTarget: THREE.Object3D;
  update: (time: number, inRange: boolean) => void;
}

export function buildMerchantSkiff(): BuiltMerchantSkiff {
  const root = new THREE.Group();
  const visualBody = new THREE.Group();
  root.add(visualBody);

  const shadowDisc = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 11),
    new THREE.MeshBasicMaterial({
      map: createSoftShadowTexture(),
      transparent: true,
      opacity: 0.64,
      depthWrite: false,
    }),
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.07;
  root.add(shadowDisc);

  const oakDetail = createOakDetailMaps();
  const hullMat = new THREE.MeshStandardMaterial({
    map: createEngravedOakTexture('#7a5337'),
    bumpMap: oakDetail.bumpMap,
    bumpScale: 0.04,
    roughnessMap: oakDetail.roughnessMap,
    roughness: 0.68,
    metalness: 0.08,
  });
  const hull = new THREE.Mesh(createSculptedHullGeometry(), hullMat);
  hull.scale.set(0.95, 0.95, 0.92);
  hull.castShadow = true;
  hull.receiveShadow = true;
  visualBody.add(hull);

  const deckMat = new THREE.MeshStandardMaterial({
    map: createDeckPlankTexture(),
    roughness: 0.78,
  });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.18, 5.2), deckMat);
  deck.position.y = 1.05;
  visualBody.add(deck);

  // Stacked trade cargo crates & gilded tarps on deck
  const cargoMat = new THREE.MeshStandardMaterial({
    map: createCrateDetailTexture('#8e6438', '#3c2916'),
    roughness: 0.7,
  });
  const cargo1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.75, 1.1), cargoMat);
  cargo1.position.set(-0.2, 1.48, 0.9);
  visualBody.add(cargo1);
  const cargo2 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.62, 0.95), cargoMat);
  cargo2.position.set(0.3, 1.42, -0.8);
  visualBody.add(cargo2);

  // Mast & warm ivory-gold merchant sail
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 6.2, 8), hullMat);
  mast.position.set(0, 3.7, 0);
  mast.castShadow = true;
  visualBody.add(mast);

  const sailMat = new THREE.MeshStandardMaterial({
    map: createEngravedSailTexture(false),
    color: 0xfff0d4,
    emissive: 0x523914,
    emissiveIntensity: 0.28,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });
  const sail = new THREE.Mesh(createBillowingSailGeometry(4.2, 2.75), sailMat);
  sail.position.set(0, 3.8, 0.08);
  sail.castShadow = true;
  visualBody.add(sail);

  // Friendly emerald-gold trade lantern & circular bazaar hail ring
  const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffe488 });
  const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), lanternMat);
  lantern.position.set(0, 6.85, 0);
  visualBody.add(lantern);

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x54f2a8,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(10.8, 11.4, 48), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.16;
  root.add(ring);

  const beaconWorldTarget = new THREE.Object3D();
  beaconWorldTarget.position.set(0, 6.85, 0);
  visualBody.add(beaconWorldTarget);

  return {
    root,
    visualBody,
    beaconWorldTarget,
    update(time: number, inRange: boolean) {
      visualBody.position.y = Math.sin(time * 1.9) * 0.18;
      visualBody.rotation.z = Math.sin(time * 1.3) * 0.045;
      lantern.rotation.y = time * 2.1;
      lantern.scale.setScalar((inRange ? 1.35 : 1.0) + Math.sin(time * 5.0) * 0.12);
      ringMat.color.setHex(inRange ? 0xffe082 : 0x54f2a8);
      ringMat.opacity = inRange ? 0.78 : 0.34 + Math.sin(time * 2.8) * 0.07;
      ring.rotation.z = -time * 0.35;
    },
  };
}

export interface BuiltFloatingMineBuoy {
  group: THREE.Group;
  emberMat: THREE.MeshBasicMaterial;
  update: (time: number) => void;
}

export function buildFloatingMineBuoy(): BuiltFloatingMineBuoy {
  const group = new THREE.Group();
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x262a36,
    roughnessMap: createBrushedMetalRoughnessMap(),
    roughness: 0.45,
    metalness: 0.82,
  });
  const crimsonMat = new THREE.MeshStandardMaterial({
    color: 0xb92d26,
    roughness: 0.48,
    metalness: 0.25,
    emissive: 0x380805,
    emissiveIntensity: 0.35,
  });

  const sphere = new THREE.Mesh(new THREE.DodecahedronGeometry(0.92, 1), crimsonMat);
  sphere.position.y = 0.48;
  sphere.castShadow = true;
  group.add(sphere);

  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.1, 6, 16), ironMat);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 0.48;
  group.add(belt);

  // Contact horn spikes
  const spikeGeo = new THREE.ConeGeometry(0.14, 0.56, 6);
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    const sp = new THREE.Mesh(spikeGeo, ironMat);
    sp.position.set(Math.cos(a) * 1.02, 0.55, Math.sin(a) * 1.02);
    sp.rotation.z = -Math.cos(a) * (Math.PI / 2);
    sp.rotation.x = Math.sin(a) * (Math.PI / 2);
    group.add(sp);
  }

  const emberMat = new THREE.MeshBasicMaterial({ color: 0xff4928 });
  const ember = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), emberMat);
  ember.position.y = 1.48;
  group.add(ember);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.45, 1.72, 24),
    new THREE.MeshBasicMaterial({
      color: 0xff5a42,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.12;
  group.add(ring);

  return {
    group,
    emberMat,
    update(time: number) {
      group.rotation.y = time * 0.65;
      group.rotation.z = Math.sin(time * 2.6) * 0.12;
      emberMat.color.setHex(Math.sin(time * 8.5) > 0 ? 0xff4928 : 0xffaa44);
    },
  };
}

export function buildFallingBoulderMesh(): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({
    map: createEngravedCliffTexture(),
    bumpMap: createCliffDetailMaps().bumpMap,
    bumpScale: 0.15,
    roughness: 0.88,
    metalness: 0.08,
  });
  const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15, 0), mat);
  mesh.castShadow = true;
  return mesh;
}

export interface BuiltWaypointBeacon {
  group: THREE.Group;
  update: (time: number) => void;
}

export function buildWaypointBeacon(): BuiltWaypointBeacon {
  const group = new THREE.Group();
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xf4c97a,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.4, 3.05, 32), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.25;
  group.add(ring);

  const pillarMat = new THREE.MeshBasicMaterial({
    color: 0xffe08a,
    transparent: true,
    opacity: 0.24,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.95, 11, 12, 1, true), pillarMat);
  pillar.position.y = 5.6;
  group.add(pillar);

  const diamond = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.65, 0),
    new THREE.MeshBasicMaterial({ color: 0xffd27d }),
  );
  diamond.position.y = 3.8;
  group.add(diamond);

  return {
    group,
    update(time: number) {
      ring.rotation.z = time * 1.1;
      const pulse = 1 + Math.sin(time * 4.2) * 0.12;
      ring.scale.setScalar(pulse);
      diamond.rotation.y = time * 2.4;
      diamond.position.y = 3.6 + Math.sin(time * 3.1) * 0.45;
    },
  };
}


