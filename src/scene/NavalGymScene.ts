import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { NavalAudioEngine, type MusicCondition } from '../audio/navalAudio';
import {
  ACT_SPECS,
  WEATHER_CYCLE,
  WEATHER_SPECS,
  computePlayerStats,
  getCrewMoraleReloadMult,
  getTotalUpgradeLevel,
  pickWaveArchetypes,
  type ActId,
  type EnemyArchetype,
  type OfficerId,
  type PlayModeId,
  type PlayerComputedStats,
  type ShipUpgrades,
  type WeatherId,
} from '../game/campaign';
import {
  DEFAULT_SEA_PARAMS,
  DIFFICULTY_SPECS,
  MINE_COOLDOWN_SEC,
  computeBroadsideAlignment,
  computeBroadsideShot,
  computePlungingRamBonus,
  computeRakingShotMultiplier,
  computeRockfallSplash,
  computeWaveCrestScore,
  computeWindEfficiency,
  createInitialShipState,
  normalizeAngle,
  sampleRogueWaveOffset,
  sampleWaveHeight,
  stepSailLevel,
  stepShipState,
  triggerWaveSurge,
  resolveShipPairCollision,
  resolveStaticObstacleCollision,
  computeAmmoEffect,
  canBoardEnemy,
  computeWhirlpoolPull,
  computeExplosionFalloff,
  type AmmoType,
  type DifficultyLevel,
  type PointOfSail,
  type RogueWaveState,
  type SailLevel,
  type SeaParams,
  type ShipState,
} from '../game/sailingPhysics';
import {
  computeEndlessMutatorModifiers,
  computeRelicModifiers,
  pickEndlessMutators,
  pickRandomUnownedRelic,
  pickRouteChoices,
  resolveBoardingSpoils,
  type BoardingSpoilChoice,
  type CaptainLogId,
  type EndlessMutatorId,
  type RunRelicId,
  type SeaRouteId,
} from '../game/voyageSystems';
import {
  createDefaultRunMerchantBuffs,
  purchaseMerchantOffer,
  resolveWreckageChoice,
  type MerchantOfferId,
  type RunMerchantBuffs,
  type WreckageChoice,
} from '../game/encounters';
import {
  HARPOON_CHEST_TARGET_ID,
  SECRET_QUEST_SPECS,
  canHarpoonReefChest,
  checkShoalBrazierVisit,
  didChainShotStrikeStormBuoy,
  didStormWakeShatterRift,
  getBeamBellPosition,
  getFogHulkPosition,
  getLighthouseRelicPosition,
  getReefChestPosition,
  getShadowStraitBuoys,
  getStormBuoyPosition,
  getStormRiftPosition,
  isBeamIlluminatingPoint,
  isBeamSweepingBell,
  isNearLighthouseRelic,
  isSurgeOverMaelstrom,
  stepFogHulkHold,
  stepShadowStraitPass,
  type SecretQuestId,
} from '../game/secrets';
import { pickOfficerBark, type OfficerBarkEvent } from '../game/lore';
import {
  computeContractModifiers,
  type BlackContractId,
  type ShipCrestId,
} from '../game/contracts';
import {
  BESTIARY_IDS,
  type BestiaryId,
  type CaptainPerkId,
  type FigureheadId,
  type ShipClassId,
} from '../game/shipClasses';
import {
  DEFAULT_KEY_BINDINGS,
  GRAPHICS_PRESETS,
  matchActionCode,
  type GraphicsQuality,
  type KeyBindings,
} from '../game/settings';
import {
  HARPOON_DURATION_SEC,
  HARPOON_REEL_DAMAGE,
  SMOKE_RELOAD_SPEED_MULT,
  STORM_WAKE_MAX_RAGE,
  activateSmokeAbility,
  activateStormWakeAbility,
  computeHarpoonReelPull,
  computeHarpoonTetherForces,
  createInitialAbilityState,
  findHarpoonTarget,
  gainStormRage,
  stepAbilityState,
  type AbilityState,
} from '../game/abilities';
import {
  computeOffscreenEdgeMarker,
  dispatchCoinFly,
  stepComboStreak,
  type OffscreenTargetIndicator,
} from '../game/uiEffects';
import { getExtraT } from '../i18n/extraTranslations';
import { TRANSLATIONS, type LanguageCode } from '../i18n/translations';
import { createFoamSpriteTexture } from './engravingTextures';
import { createOceanMaterial, type OceanSurfaceController } from './oceanMaterial';
import {
  buildAtmosphericVfx,
  buildCorsairShip,
  buildEngravedHeadland,
  buildFallingBoulderMesh,
  buildFloatingMineBuoy,
  buildFloatingProp,
  buildKrakenBoss,
  buildMerchantSkiff,
  buildRelicBuoy,
  buildSeaFortress,
  buildSeagullFlock,
  buildShadowStraitBuoy,
  buildStormConductorBuoy,
  buildStormRiftPillar,
  buildSunkenBellBuoy,
  buildSunkenHulk,
  buildSunkenReefChest,
  buildTwilightParallaxEnvironment,
  buildWaypointBeacon,
  buildWhirlpoolVortex,
  buildWreckageCluster,
  type AtmosphericVfxSystem,
  type BuiltFloatingMineBuoy,
  type BuiltFloatingProp,
  type BuiltKrakenBoss,
  type BuiltMerchantSkiff,
  type BuiltRelicBuoy,
  type BuiltSeaFortress,
  type BuiltSecretProp,
  type BuiltShip,
  type BuiltWaypointBeacon,
  type BuiltWhirlpool,
  type BuiltWreckageCluster,
  type FloatingPropKind,
  type HeadlandBeacon,
  type ParallaxEnvironment,
  type SeagullFlock,
} from './shipBuilder';

export interface HudSnapshot {
  speedKnots: number;
  windSpeedKnots: number;
  sailLevel: SailLevel;
  headingRad: number;
  windAngleRad: number;
  pointOfSail: PointOfSail;
  crestScore: number;
  crestReady: boolean;
  ammo: AmmoType;
  portCooldown: number;
  stbdCooldown: number;
  portTargetInArc: boolean;
  stbdTargetInArc: boolean;
  surgeCooldown: number;
  hullHp: number;
  hullMaxHp: number;
  sunkCount: number;
  targetShips: number;
  score: number;
  wave: number;
  act: ActId;
  playMode: PlayModeId;
  weather: WeatherId;
  activeOfficers: OfficerId[];
  activeContracts: BlackContractId[];
  bossKey: 'bossAct1' | 'bossAct2' | 'bossAct3';
  runDoubloonsBonus: number;
  boardedCount: number;
  canBoard: boolean;
  bossHp: number | null;
  bossMaxHp: number | null;
  bossEnraged: boolean;
  callout: string;
  calloutSpeaker: OfficerId | null;
  harpoonCooldown: number;
  harpoonActive: boolean;
  smokeCooldown: number;
  smokeActive: boolean;
  stormRage: number;
  stormWakeActive: boolean;
  stormWakeTimer: number;
  comboStreak: number;
  comboTimer: number;
  reloadMaxTime: number;
  offscreenTarget: OffscreenTargetIndicator | null;
  morale: number;
  mineCooldown: number;
  shipClass: ShipClassId;
  equippedFigurehead: FigureheadId;
  milesSailed: number;
  shotsFired: number;
  shotsHit: number;
  monstersSunk: number;
  bestiaryKillsInRun: Partial<Record<BestiaryId, number>>;
  nearbyInteract: 'wreckage' | 'merchant' | null;
  activeEncounterModal: 'wreckage' | 'merchant' | 'route' | 'mutator' | 'boarding' | null;
  merchantBuffs: RunMerchantBuffs;
  fleetCharmBought: boolean;
  rogueWaveActive: boolean;
  waypointDistMeters: number | null;
  surgeonActive: boolean;
  equippedCrest: ShipCrestId;
  activeRelics: RunRelicId[];
  activeMutators: EndlessMutatorId[];
  routeChoices: SeaRouteId[];
  mutatorChoices: EndlessMutatorId[];
  convoyHp: number | null;
  convoyMaxHp: number | null;
  treasureDistMeters: number | null;
}

export type SceneMode = 'title' | 'playing' | 'paused' | 'victory' | 'defeat';

export type SeaEventKind = 'salvage' | 'ambush' | 'tidalBoon';

export interface ActCompletePayload {
  act: ActId;
  score: number;
  sunkCount: number;
  boardedCount: number;
  bonusGoldCollected: number;
  bossesDefeatedInRun: number;
  bestComboInRun: number;
  milesSailed: number;
  shotsFired: number;
  shotsHit: number;
  morale: number;
  bestiaryKillsInRun: Partial<Record<BestiaryId, number>>;
}

export interface EndlessCompletePayload {
  waveReached: number;
  score: number;
  sunkCount: number;
  boardedCount: number;
  bonusGoldCollected: number;
  bossesDefeatedInRun: number;
  bestComboInRun: number;
  milesSailed: number;
  shotsFired: number;
  shotsHit: number;
  morale: number;
  bestiaryKillsInRun: Partial<Record<BestiaryId, number>>;
}

export interface DefeatSummaryPayload {
  sunkCount: number;
  boardedCount: number;
  milesSailed: number;
  bestComboInRun: number;
  shotsFired: number;
  shotsHit: number;
  morale: number;
  bestiaryKillsInRun: Partial<Record<BestiaryId, number>>;
}

interface EnemyShip {
  id: number;
  archetype: EnemyArchetype;
  isBoss: boolean;
  bossEnraged: boolean;
  shieldBroken: boolean;
  scale: number;
  built: BuiltShip;
  fort?: BuiltSeaFortress;
  kraken?: BuiltKrakenBoss;
  x: number;
  z: number;
  heading: number;
  speed: number;
  currentSpeed: number;
  orbitRadius: number;
  orbitAngle: number;
  hp: number;
  maxHp: number;
  fireTimer: number;
  telegraphTimer: number;
  specialTimer: number;
  playerCollisionCooldown: number;
  sailDebuffTimer: number;
  crewDebuffTimer: number;
  armorRendTimer: number;
  whirlpoolDamageCd: number;
  alive: boolean;
  hitFlash: number;
  squashY: number;
  squashVel: number;
  pitch: number;
  roll: number;
  burnTimer: number;
  burnDps: number;
  burnTickAccum: number;
  fireSpawnTimer: number;
  wakeTimer: number;
}

interface WreckageSite {
  id: number;
  x: number;
  z: number;
  built: BuiltWreckageCluster;
  active: boolean;
}

interface MerchantSite {
  id: number;
  x: number;
  z: number;
  heading: number;
  speed: number;
  built: BuiltMerchantSkiff;
  active: boolean;
  life: number;
}

interface FloatingMineHazard {
  id: number;
  x: number;
  z: number;
  built: BuiltFloatingMineBuoy;
  alive: boolean;
  life: number;
}

interface FallingBoulder {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  splashed: boolean;
}

interface SeaMine {
  x: number;
  z: number;
  armTimer: number;
  life: number;
  mesh: THREE.Group;
  emberMat: THREE.MeshBasicMaterial;
}

interface MortarTargetZone {
  x: number;
  z: number;
  radius: number;
  timer: number;
  maxTimer: number;
  damage: number;
}

interface FloatingProp {
  id: number;
  kind: FloatingPropKind;
  x: number;
  z: number;
  built: BuiltFloatingProp;
  alive: boolean;
}

interface WhirlpoolZone {
  x: number;
  z: number;
  built: BuiltWhirlpool;
  coreDamageCd: number;
}

interface Projectile {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  gravity?: number;
  damage: number;
  crestBoosted: boolean;
  fromEnemy: boolean;
  ammo: AmmoType;
  life: number;
  trail: Array<{ x: number; y: number; z: number }>;
}

interface Particle3D {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  rotX?: number;
  rotY?: number;
  rotZ?: number;
  gravity?: number;
}

interface FoamPointParticle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  startSize: number;
  endSize: number;
  baseAlpha: number;
  r: number;
  g: number;
  b: number;
  gravity: number;
  onWater: boolean;
}

interface FloatingText {
  x: number;
  y: number;
  z: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

interface FlashRing {
  x: number;
  y: number;
  z: number;
  color: string;
  life: number;
  maxLife: number;
  maxRadius: number;
}

interface WakeNode {
  x: number;
  y: number;
  z: number;
  life: number;
  maxLife: number;
  size: number;
  storm?: boolean;
}

interface SmokePuff3D {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  baseScale: number;
}

export class NavalGymScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private envTexture: THREE.Texture | null = null;
  private isSoftwareGl = false;

  private vfxCanvas: HTMLCanvasElement;
  private vfxCtx: CanvasRenderingContext2D;

  private seaMesh!: THREE.Mesh;
  private currentSeaSegments = 120;
  private oceanCtrl!: OceanSurfaceController;
  private parallaxEnv!: ParallaxEnvironment;
  private atmosphericVfx: AtmosphericVfxSystem | null = null;
  private seagullFlock: SeagullFlock | null = null;
  private hemiLight!: THREE.HemisphereLight;
  private sunLight!: THREE.DirectionalLight;
  private sternLight: THREE.PointLight | null = null;
  private headlands: HeadlandBeacon[] = [];
  private headlandObstacles: Array<{ x: number; z: number; radius: number }> = [];
  private lighthouseRelic: {
    x: number;
    z: number;
    built: BuiltRelicBuoy;
    collected: boolean;
  } | null = null;
  private lighthouseCenter: { x: number; z: number } | null = null;
  private beamBellProp: {
    x: number;
    z: number;
    built: BuiltSecretProp;
    completed: boolean;
  } | null = null;
  private fogHulkProp: {
    x: number;
    z: number;
    built: BuiltSecretProp;
    completed: boolean;
  } | null = null;
  private stormBuoyProp: {
    x: number;
    z: number;
    built: BuiltSecretProp;
    completed: boolean;
  } | null = null;
  private reefChestProp: {
    x: number;
    z: number;
    built: BuiltSecretProp;
    completed: boolean;
  } | null = null;
  private shadowStraitBuoys: Array<{
    index: number;
    x: number;
    z: number;
    built: BuiltSecretProp;
  }> = [];
  private litShadowStraitIndices = new Set<number>();
  private stormRiftProp: {
    x: number;
    z: number;
    built: BuiltSecretProp;
    completed: boolean;
  } | null = null;
  private broadsideFiredThisTick = false;
  private fogHulkHoldSec = 0;
  private fogHulkPrompted = false;
  private shoalSpots: Array<{ index: number; x: number; z: number; headlandIdx: number }> = [];
  private litShoalIndices = new Set<number>();
  private triggeredSecrets = new Set<SecretQuestId>();
  private reefDamageCooldown = 0;
  private enemyPairCooldowns = new Map<string, number>();

  private playerBuilt!: BuiltShip;
  private ship: ShipState = createInitialShipState();
  private seaParams: SeaParams = { ...DEFAULT_SEA_PARAMS };
  private difficulty: DifficultyLevel = 'normal';
  private playMode: PlayModeId = 'campaign';
  private act: ActId = 1;
  private upgrades: ShipUpgrades = { hull: 0, cannons: 0, sails: 0, rigging: 0 };
  private activeOfficers: OfficerId[] = [];
  private activeContracts: BlackContractId[] = [];
  private equippedCrest: ShipCrestId = 'corsair';
  private shipClass: ShipClassId = 'sloop';
  private equippedFigurehead: FigureheadId = 'none';
  private unlockedPerks: CaptainPerkId[] = [];
  private bindings: KeyBindings = { ...DEFAULT_KEY_BINDINGS };
  private graphicsQuality: GraphicsQuality = 'high';
  private runBossesDefeated = 0;
  private runBestCombo = 0;
  private playerStats: PlayerComputedStats = computePlayerStats('normal', {
    hull: 0,
    cannons: 0,
    sails: 0,
    rigging: 0,
  });
  private weather: WeatherId = 'tailwind';
  private weatherTimer = 36;
  private baseActWaveHeight = ACT_SPECS[1].waveHeight;
  private baseActWindSpeed = ACT_SPECS[1].windSpeed;
  private language: LanguageCode = 'en';
  private bloomStrength = 0.26;

  private enemies: EnemyShip[] = [];
  private mortarZones: MortarTargetZone[] = [];
  private activeMines: SeaMine[] = [];
  private floatingMines: FloatingMineHazard[] = [];
  private wreckageSites: WreckageSite[] = [];
  private merchantSite: MerchantSite | null = null;
  private fallingBoulders: FallingBoulder[] = [];
  private floatingProps: FloatingProp[] = [];
  private propIdSeq = 1;
  private whirlpools: WhirlpoolZone[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle3D[] = [];
  private floatingTexts: FloatingText[] = [];
  private flashRings: FlashRing[] = [];
  private wakeNodes: WakeNode[] = [];
  private smokePuffs: SmokePuff3D[] = [];
  private particlePool: THREE.Mesh[] = [];
  private smokePuffPool: Array<{ mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial }> = [];
  private smokeSpawnTimer = 0;
  private bowSprayTimer = 0;
  private activeEncounterModal: 'wreckage' | 'merchant' | 'route' | 'mutator' | 'boarding' | null = null;
  private merchantBuffs: RunMerchantBuffs = createDefaultRunMerchantBuffs();
  private fleetCharmBought = false;
  private merchantSpawnTimer = 18;
  private rogueWave: RogueWaveState = {
    active: false,
    x: 0,
    z: 0,
    radius: 44,
    amplitude: 0,
    dirX: 1,
    dirZ: 0,
  };
  private rogueWaveTimer = 19;
  private courseWaypoint: { x: number; z: number } | null = null;
  private waypointBeacon: BuiltWaypointBeacon | null = null;
  private surgeonHealAccum = 0;
  private drsScale = 1.0;
  private drsTimer = 0;
  private drsFrameAccum = 0;
  private drsFrameCount = 0;
  private clubhaulCreakCd = 0;
  private activeRelics: RunRelicId[] = [];
  private activeMutators: EndlessMutatorId[] = [];
  private routeChoices: SeaRouteId[] = [];
  private mutatorChoices: EndlessMutatorId[] = [];
  private pendingNextWaveMode: 'campaignWave2' | 'endlessNext' | null = null;
  private pendingBoardingTargetId: number | null = null;
  private waveGoldBonusMult = 1;
  private oilSlicks: Array<{
    x: number;
    z: number;
    radius: number;
    life: number;
    maxLife: number;
    ignited: boolean;
    igniteTimer: number;
    tickAccum: number;
  }> = [];
  private lightningArcs: Array<{
    ax: number;
    ay: number;
    az: number;
    bx: number;
    by: number;
    bz: number;
    life: number;
  }> = [];
  private treasureSpot: { x: number; z: number; collected: boolean } | null = null;
  private escortConvoy: {
    x: number;
    z: number;
    heading: number;
    speed: number;
    hp: number;
    maxHp: number;
    built: BuiltShip;
    alive: boolean;
    hitFlash: number;
  } | null = null;

  // Shared GPU geometries & material caches (prevents runtime GC & shader recompiles)
  private readonly sharedBurstGeo = new THREE.DodecahedronGeometry(0.24, 0);
  private readonly sharedBurstMats = new Map<number, THREE.MeshBasicMaterial>();
  private readonly sharedSplinterGeo = new THREE.BoxGeometry(0.11, 0.06, 0.52);
  private readonly sharedSplinterMats = [0x6e3f24, 0x8e5632, 0x4b2916].map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0.05 }),
  );
  private readonly sharedSmokeGeo = new THREE.DodecahedronGeometry(1.15, 1);
  private readonly sharedBallGeo = new THREE.SphereGeometry(0.28, 8, 8);
  private readonly sharedBallCrestGeo = new THREE.SphereGeometry(0.36, 10, 8);
  private readonly sharedBallMats = new Map<number, THREE.MeshBasicMaterial>();
  private readonly sharedMineKegGeo = new THREE.CylinderGeometry(0.62, 0.56, 1.15, 10);
  private readonly sharedMineBandGeo = new THREE.TorusGeometry(0.62, 0.06, 6, 12);
  private readonly sharedMineEmberGeo = new THREE.OctahedronGeometry(0.26, 0);
  private readonly sharedMineKegMat = new THREE.MeshStandardMaterial({ color: 0x3b261d, roughness: 0.78 });
  private readonly sharedMineBandMat = new THREE.MeshStandardMaterial({ color: 0x262c38, metalness: 0.85, roughness: 0.38 });
  private readonly maxFoamParticles = 640;
  private foamPool: FoamPointParticle[] = [];
  private foamCursor = 0;
  private foamPoints!: THREE.Points;
  private foamGeometry!: THREE.BufferGeometry;
  private foamMaterial!: THREE.ShaderMaterial;
  private foamTexture!: THREE.Texture;
  private readonly glowSpriteCache = new Map<string, HTMLCanvasElement>();
  private cachedVigGrad: CanvasGradient | null = null;
  private cachedVigW = 0;
  private cachedVigH = 0;
  private cachedRadarBgGrad: CanvasGradient | null = null;
  private cachedRadarCx = 0;
  private cachedRadarCy = 0;
  private cachedRadarR = 0;
  private foamPosAttr!: THREE.BufferAttribute;
  private foamColAttr!: THREE.BufferAttribute;
  private foamSizeAttr!: THREE.BufferAttribute;
  private foamAlphaAttr!: THREE.BufferAttribute;
  private abilities: AbilityState = createInitialAbilityState();
  private grappleVfx: { ax: number; az: number; bx: number; bz: number; life: number } | null = null;
  private rainStreaks = Array.from({ length: 76 }, () => ({
    x: Math.random(),
    y: Math.random(),
    len: 14 + Math.random() * 18,
    speed: 1.15 + Math.random() * 0.7,
  }));
  private ambientMotes = Array.from({ length: 28 }, (_, i) => ({
    x: Math.random(),
    y: 0.15 + Math.random() * 0.75,
    r: 1.4 + (i % 3) * 0.8,
    phase: Math.random() * Math.PI * 2,
    speed: 0.012 + (i % 4) * 0.004,
  }));
  private contextLost = false;
  private lightningAlpha = 0;
  private nextLightningTimer = 6.5;

  private ammo: AmmoType = 'round';
  private portCooldown = 0;
  private stbdCooldown = 0;
  private mineCooldown = 0;
  private morale = 75;
  private mutinyWarned = false;
  private goldDrainAccum = 0;
  private seaEventTimer = 26;
  private seaEventSeq = 0;
  private milesSailed = 0;
  private shotsFired = 0;
  private shotsHit = 0;
  private monstersSunk = 0;
  private bestiaryKillsInRun: Partial<Record<BestiaryId, number>> = {};
  private hullHp = 100;
  private hullMaxHp = 100;
  private wave = 1;
  private sunkCount = 0;
  private targetShips = 3;
  private score = 0;
  private runDoubloonsBonus = 0;
  private boardedCount = 0;
  private comboStreak = 0;
  private comboTimer = 0;
  private callout = '';
  private calloutSpeaker: OfficerId | null = null;
  private calloutTimer = 0;
  private lastOfficerBarkSec = -99;
  private lowHullBarkSent = false;
  private screenShake = 0;
  private hitstopTimer = 0;
  private wakeSpawnTimer = 0;

  private mode: SceneMode = 'title';
  private audio = new NavalAudioEngine();
  private keys = new Set<string>();
  private touchSteer = 0;

  private camYawOffset = 0;
  private camPitch = 0.42;
  private camDistance = 30;
  private draggingCamera = false;
  private lastPointerX = 0;
  private lastPointerY = 0;

  private rafId: number | null = null;
  private timeoutId: number | null = null;
  private activeGlSync: WebGLSync | null = null;
  private disposed = false;
  private resizeObserver: ResizeObserver | null = null;
  private elapsed = 0;
  private lastFrameMs = 0;
  private hudEmitTimer = 0;

  private onHudUpdate: (snap: HudSnapshot) => void;
  private onModeChange: (mode: SceneMode) => void;
  private onActComplete?: (payload: ActCompletePayload) => void;
  private onEndlessEnd?: (payload: EndlessCompletePayload) => void;
  private onSecretComplete?: (secretId: SecretQuestId) => void;
  private onBossArrival?: (actId: ActId, bossKey: 'bossAct1' | 'bossAct2' | 'bossAct3') => void;
  private onBossPhase2?: (actId: ActId, bossKey: 'bossAct1' | 'bossAct2' | 'bossAct3') => void;
  private onDefeatSummary?: (payload: DefeatSummaryPayload) => void;
  private onSeaEvent?: (kind: SeaEventKind) => void;
  private onKrakenArrival?: () => void;
  private onLogUnlock?: (logId: CaptainLogId) => void;

  private readonly tmpVec = new THREE.Vector3();
  private readonly tmpDir = new THREE.Vector3();
  private readonly tmpUp = new THREE.Vector3(0, 1, 0);
  private readonly tmpMuzzle = new THREE.Vector3();

  constructor(
    container: HTMLElement,
    onHudUpdate: (snap: HudSnapshot) => void,
    onModeChange: (mode: SceneMode) => void,
    onActComplete?: (payload: ActCompletePayload) => void,
    onEndlessEnd?: (payload: EndlessCompletePayload) => void,
    onSecretComplete?: (secretId: SecretQuestId) => void,
    onBossArrival?: (actId: ActId, bossKey: 'bossAct1' | 'bossAct2' | 'bossAct3') => void,
    onBossPhase2?: (actId: ActId, bossKey: 'bossAct1' | 'bossAct2' | 'bossAct3') => void,
    onDefeatSummary?: (payload: DefeatSummaryPayload) => void,
    onSeaEvent?: (kind: SeaEventKind) => void,
    onKrakenArrival?: () => void,
    onLogUnlock?: (logId: CaptainLogId) => void,
  ) {
    this.container = container;
    this.onHudUpdate = onHudUpdate;
    this.onModeChange = onModeChange;
    this.onActComplete = onActComplete;
    this.onEndlessEnd = onEndlessEnd;
    this.onSecretComplete = onSecretComplete;
    this.onBossArrival = onBossArrival;
    this.onBossPhase2 = onBossPhase2;
    this.onDefeatSummary = onDefeatSummary;
    this.onSeaEvent = onSeaEvent;
    this.onKrakenArrival = onKrakenArrival;
    this.onLogUnlock = onLogUnlock;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d1f);
    this.scene.fog = new THREE.FogExp2(0x101834, 0.0044);

    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    this.camera = new THREE.PerspectiveCamera(52, w / h, 0.5, 720);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(w, h);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTexture;
    this.scene.environmentIntensity = 0.36;
    pmremGenerator.dispose();

    const gl = this.renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererInfo = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    this.isSoftwareGl = /swiftshader|llvmpipe|software/i.test(rendererInfo);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));

    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.inset = '0';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    // Overlaid 2D VFX Canvas (additive bloom halos, trails, combat text, vignette)
    this.vfxCanvas = document.createElement('canvas');
    this.vfxCanvas.style.position = 'absolute';
    this.vfxCanvas.style.inset = '0';
    this.vfxCanvas.style.width = '100%';
    this.vfxCanvas.style.height = '100%';
    this.vfxCanvas.style.pointerEvents = 'none';
    this.vfxCanvas.width = w;
    this.vfxCanvas.height = h;
    container.appendChild(this.vfxCanvas);
    const vctx = this.vfxCanvas.getContext('2d');
    if (!vctx) throw new Error('VFX 2D context unavailable');
    vctx.imageSmoothingEnabled = true;
    vctx.imageSmoothingQuality = 'high';
    this.vfxCtx = vctx;

    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    if (!this.isSoftwareGl) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(w, h),
        this.bloomStrength,
        0.32,
        0.98,
      );
      this.composer.addPass(this.bloomPass);
      this.composer.addPass(new OutputPass());
    }

    this.setupLighting();
    this.setupEnvironment();
    this.setupPlayerAndFleet();
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
    this.bindEvents();
    this.emitHud();

    this.lastFrameMs = performance.now();
    this.scheduleNextFrame();
  }

  private setupLighting(): void {
    this.hemiLight = new THREE.HemisphereLight(0x9bb5ff, 0x2b3e6e, 1.08);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffc680, 1.42);
    this.sunLight.position.set(-58, 46, -92);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 260;
    const frustum = 64;
    this.sunLight.shadow.camera.left = -frustum;
    this.sunLight.shadow.camera.right = frustum;
    this.sunLight.shadow.camera.top = frustum;
    this.sunLight.shadow.camera.bottom = -frustum;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.035;
    this.sunLight.shadow.radius = 2.5;
    this.scene.add(this.sunLight.target);
    this.scene.add(this.sunLight);

    // Subtle cool moonlight rim elevated so South headings keep sharp silhouettes without water glare
    const moonRim = new THREE.DirectionalLight(0xaec6ff, 0.36);
    moonRim.position.set(36, 72, 64);
    this.scene.add(moonRim);
  }

  private setupEnvironment(): void {
    this.parallaxEnv = buildTwilightParallaxEnvironment();
    this.scene.add(this.parallaxEnv.group);

    this.atmosphericVfx = buildAtmosphericVfx();
    this.scene.add(this.atmosphericVfx.group);

    // Procedural PBR ocean mesh (waves + multi-octave capillary normals + reef surf)
    const seaGeo = new THREE.PlaneGeometry(460, 460, this.currentSeaSegments, this.currentSeaSegments);
    seaGeo.rotateX(-Math.PI / 2);
    this.oceanCtrl = createOceanMaterial();
    this.seaMesh = new THREE.Mesh(seaGeo, this.oceanCtrl.material);
    this.seaMesh.receiveShadow = !this.isSoftwareGl;
    this.scene.add(this.seaMesh);

    this.setupFoamPointsSystem();
    this.seagullFlock = buildSeagullFlock(8);
    this.scene.add(this.seagullFlock.group);

    this.rebuildActArena(this.act);
  }

  private setupFoamPointsSystem(): void {
    this.foamTexture = createFoamSpriteTexture();
    const count = this.maxFoamParticles;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);

    this.foamPool = Array.from({ length: count }, () => ({
      active: false,
      x: 0,
      y: -999,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 1,
      startSize: 1,
      endSize: 2,
      baseAlpha: 0.7,
      r: 0.9,
      g: 0.96,
      b: 1,
      gravity: 0,
      onWater: true,
    }));

    this.foamGeometry = new THREE.BufferGeometry();
    this.foamPosAttr = new THREE.BufferAttribute(positions, 3);
    this.foamColAttr = new THREE.BufferAttribute(colors, 3);
    this.foamSizeAttr = new THREE.BufferAttribute(sizes, 1);
    this.foamAlphaAttr = new THREE.BufferAttribute(alphas, 1);
    this.foamPosAttr.setUsage(THREE.DynamicDrawUsage);
    this.foamColAttr.setUsage(THREE.DynamicDrawUsage);
    this.foamSizeAttr.setUsage(THREE.DynamicDrawUsage);
    this.foamAlphaAttr.setUsage(THREE.DynamicDrawUsage);

    this.foamGeometry.setAttribute('position', this.foamPosAttr);
    this.foamGeometry.setAttribute('color', this.foamColAttr);
    this.foamGeometry.setAttribute('aSize', this.foamSizeAttr);
    this.foamGeometry.setAttribute('aAlpha', this.foamAlphaAttr);

    this.foamMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uMap: { value: this.foamTexture },
        uPixelRatio: { value: this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2) },
      },
      vertexShader: /* glsl */ `
        attribute float aSize;
        attribute float aAlpha;
        attribute vec3 color;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          vAlpha = aAlpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float dist = max(1.0, -mvPosition.z);
          gl_PointSize = clamp(aSize * uPixelRatio * (270.0 / dist), 1.5, 92.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          if (vAlpha <= 0.005) discard;
          vec4 tex = texture2D(uMap, gl_PointCoord);
          float alpha = tex.a * vAlpha;
          if (alpha <= 0.01) discard;
          gl_FragColor = vec4(vColor * tex.rgb, alpha);
        }
      `,
    });

    this.foamPoints = new THREE.Points(this.foamGeometry, this.foamMaterial);
    this.foamPoints.frustumCulled = false;
    this.foamPoints.renderOrder = 3;
    this.scene.add(this.foamPoints);
  }

  private emitFoamParticle(opts: {
    x: number;
    y: number;
    z: number;
    vx?: number;
    vy?: number;
    vz?: number;
    life: number;
    startSize: number;
    endSize: number;
    alpha?: number;
    r?: number;
    g?: number;
    b?: number;
    gravity?: number;
    onWater?: boolean;
  }): void {
    const p = this.foamPool[this.foamCursor];
    this.foamCursor = (this.foamCursor + 1) % this.maxFoamParticles;
    p.active = true;
    p.x = opts.x;
    p.y = opts.y;
    p.z = opts.z;
    p.vx = opts.vx ?? 0;
    p.vy = opts.vy ?? 0;
    p.vz = opts.vz ?? 0;
    p.life = opts.life;
    p.maxLife = opts.life;
    p.startSize = opts.startSize;
    p.endSize = opts.endSize;
    p.baseAlpha = opts.alpha ?? 0.72;
    p.r = opts.r ?? 0.9;
    p.g = opts.g ?? 0.96;
    p.b = opts.b ?? 1.0;
    p.gravity = opts.gravity ?? 0;
    p.onWater = opts.onWater ?? false;
  }

  private rebuildActArena(actId: ActId): void {
    const actSpec = ACT_SPECS[actId];
    const pal = actSpec.palette;

    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.setHex(pal.bgColor);
    } else {
      this.scene.background = new THREE.Color(pal.bgColor);
    }
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setHex(pal.fogColor);
      this.scene.fog.density = pal.fogDensity;
    } else {
      this.scene.fog = new THREE.FogExp2(pal.fogColor, pal.fogDensity);
    }
    this.hemiLight.color.setHex(pal.hemiSky);
    this.hemiLight.groundColor.setHex(pal.hemiGround);
    this.sunLight.color.setHex(pal.sunLightColor);
    this.oceanCtrl.setActTheme(actId, pal);
    this.parallaxEnv.setBiomeTheme(pal);

    this.baseActWaveHeight = actSpec.waveHeight;
    this.baseActWindSpeed = actSpec.windSpeed;
    const wSpec = WEATHER_SPECS[this.weather];
    this.seaParams = {
      ...this.seaParams,
      waveHeight: Number((this.baseActWaveHeight * wSpec.waveMult).toFixed(2)),
      windSpeed: Number((this.baseActWindSpeed * wSpec.windMult).toFixed(2)),
      windAngle: actSpec.windAngle,
    };

    for (const h of this.headlands) this.scene.remove(h.group);
    this.headlands = [];
    this.headlandObstacles = [];
    this.shoalSpots = [];
    this.litShoalIndices.clear();
    let shoalIndex = 0;
    this.lighthouseCenter = null;
    for (let i = 0; i < actSpec.headlands.length; i += 1) {
      const hSpec = actSpec.headlands[i];
      const built = buildEngravedHeadland(hSpec.x, hSpec.z, hSpec.lighthouse);
      this.scene.add(built.group);
      this.headlands.push(built);
      this.headlandObstacles.push({ x: hSpec.x, z: hSpec.z, radius: 12.2 });
      if (hSpec.lighthouse) {
        this.lighthouseCenter = { x: hSpec.x, z: hSpec.z };
      } else {
        this.shoalSpots.push({
          index: shoalIndex,
          x: hSpec.x,
          z: hSpec.z,
          headlandIdx: i,
        });
        shoalIndex += 1;
      }
    }

    if (this.lighthouseRelic) {
      this.scene.remove(this.lighthouseRelic.built.group);
      this.lighthouseRelic = null;
    }
    const relicPos = getLighthouseRelicPosition(actSpec.headlands);
    if (relicPos) {
      const builtRelic = buildRelicBuoy();
      builtRelic.group.position.set(relicPos.x, 0, relicPos.z);
      this.scene.add(builtRelic.group);
      this.lighthouseRelic = {
        x: relicPos.x,
        z: relicPos.z,
        built: builtRelic,
        collected: false,
      };
    }

    if (this.beamBellProp) {
      this.scene.remove(this.beamBellProp.built.group);
      this.beamBellProp = null;
    }
    const bellPos = getBeamBellPosition(actSpec.headlands, actSpec.whirlpools);
    if (bellPos) {
      const builtBell = buildSunkenBellBuoy();
      builtBell.group.position.set(bellPos.x, 0, bellPos.z);
      this.scene.add(builtBell.group);
      this.beamBellProp = {
        x: bellPos.x,
        z: bellPos.z,
        built: builtBell,
        completed: false,
      };
    }

    if (this.fogHulkProp) {
      this.scene.remove(this.fogHulkProp.built.group);
      this.fogHulkProp = null;
    }
    const hulkPos = getFogHulkPosition(actSpec.headlands, actSpec.whirlpools);
    const builtHulk = buildSunkenHulk();
    builtHulk.group.position.set(hulkPos.x, 0, hulkPos.z);
    this.scene.add(builtHulk.group);
    this.fogHulkProp = {
      x: hulkPos.x,
      z: hulkPos.z,
      built: builtHulk,
      completed: false,
    };

    if (this.stormBuoyProp) {
      this.scene.remove(this.stormBuoyProp.built.group);
      this.stormBuoyProp = null;
    }
    const stormPos = getStormBuoyPosition(actSpec.headlands, actSpec.whirlpools);
    const builtStorm = buildStormConductorBuoy();
    builtStorm.group.position.set(stormPos.x, 0, stormPos.z);
    this.scene.add(builtStorm.group);
    this.stormBuoyProp = {
      x: stormPos.x,
      z: stormPos.z,
      built: builtStorm,
      completed: false,
    };

    if (this.reefChestProp) {
      this.scene.remove(this.reefChestProp.built.group);
      this.reefChestProp = null;
    }
    const chestPos = getReefChestPosition(actSpec.headlands, actSpec.whirlpools);
    if (chestPos) {
      const builtChest = buildSunkenReefChest();
      builtChest.group.position.set(chestPos.x, 0, chestPos.z);
      this.scene.add(builtChest.group);
      this.reefChestProp = {
        x: chestPos.x,
        z: chestPos.z,
        built: builtChest,
        completed: false,
      };
    }

    for (const sb of this.shadowStraitBuoys) this.scene.remove(sb.built.group);
    this.shadowStraitBuoys = [];
    this.litShadowStraitIndices.clear();
    const straitPosList = getShadowStraitBuoys(actSpec.headlands, actSpec.whirlpools);
    for (const sp of straitPosList) {
      const builtStrait = buildShadowStraitBuoy();
      builtStrait.group.position.set(sp.x, 0, sp.z);
      this.scene.add(builtStrait.group);
      this.shadowStraitBuoys.push({
        index: sp.index,
        x: sp.x,
        z: sp.z,
        built: builtStrait,
      });
    }

    if (this.stormRiftProp) {
      this.scene.remove(this.stormRiftProp.built.group);
      this.stormRiftProp = null;
    }
    const riftPos = getStormRiftPosition(actSpec.headlands, actSpec.whirlpools);
    const builtRift = buildStormRiftPillar();
    builtRift.group.position.set(riftPos.x, 0, riftPos.z);
    this.scene.add(builtRift.group);
    this.stormRiftProp = {
      x: riftPos.x,
      z: riftPos.z,
      built: builtRift,
      completed: false,
    };

    for (const wp of this.whirlpools) this.scene.remove(wp.built.group);
    this.whirlpools = [];
    for (const [wx, wz] of actSpec.whirlpools) {
      const built = buildWhirlpoolVortex(16);
      built.group.position.set(wx, 0, wz);
      this.scene.add(built.group);
      this.whirlpools.push({ x: wx, z: wz, built, coreDamageCd: 0 });
    }
    this.oceanCtrl.setHazards(this.headlandObstacles, this.whirlpools);
  }

  private setupPlayerAndFleet(): void {
    this.playerBuilt = buildCorsairShip({ isEnemy: false, scale: 1 });
    this.playerBuilt.setUpgradeTier(getTotalUpgradeLevel(this.upgrades));
    this.sternLight = new THREE.PointLight(0xffb454, 4.6, 20, 2);
    this.sternLight.position.set(0, 2.55, 3.85);
    this.playerBuilt.visualBody.add(this.sternLight);
    this.scene.add(this.playerBuilt.root);
    this.spawnEnemiesForDifficulty();
    this.spawnArenaBarrels();
  }

  private spawnArenaBarrels(): void {
    for (const prop of this.floatingProps) {
      this.scene.remove(prop.built.group);
    }
    this.floatingProps = [];
    const barrelPositions = ACT_SPECS[this.act].barrels;
    for (const [bx, bz] of barrelPositions) {
      this.spawnProp('barrel', bx, bz);
    }
  }

  private spawnProp(kind: FloatingPropKind, x: number, z: number): void {
    const built = buildFloatingProp(kind);
    built.group.position.set(x, 0, z);
    this.scene.add(built.group);
    this.floatingProps.push({
      id: this.propIdSeq++,
      kind,
      x,
      z,
      built,
      alive: true,
    });
  }

  private createStubBuiltForSpecial(
    root: THREE.Group,
    visualBody: THREE.Group,
    lanternWorldTarget: THREE.Object3D,
    setHitFlash: (a: number) => void,
    setTelegraphFlash: (a: number) => void,
    onUpdate: (time: number) => void,
  ): BuiltShip {
    const emptyMesh = new THREE.Mesh();
    return {
      root,
      visualBody,
      shadowDisc: emptyMesh,
      sailMesh: emptyMesh,
      extraSailMeshes: [],
      pennantMesh: emptyMesh,
      lanternGlowMesh: emptyMesh,
      lanternWorldTarget,
      crestAuraMesh: emptyMesh,
      cannonMuzzlesPort: [],
      cannonMuzzlesStbd: [],
      setSailAmount: () => undefined,
      setCrestGlow: () => undefined,
      setSailDamaged: () => undefined,
      setUpgradeTier: () => undefined,
      setAbilityVfx: () => undefined,
      setHitFlash,
      setTelegraphFlash,
      updateAnimation(time: number) {
        onUpdate(time);
      },
    };
  }

  private createEnemyShip(params: {
    id: number;
    archetype: EnemyArchetype;
    scale: number;
    x: number;
    z: number;
    hp: number;
    speed: number;
    orbitRadius: number;
    orbitAngle: number;
    fireTimer: number;
  }): EnemyShip {
    const isBoss = params.archetype === 'boss';
    let built: BuiltShip;
    let fort: BuiltSeaFortress | undefined;
    let kraken: BuiltKrakenBoss | undefined;

    if (params.archetype === 'seafort') {
      fort = buildSeaFortress();
      fort.root.position.set(params.x, 0, params.z);
      this.scene.add(fort.root);
      built = this.createStubBuiltForSpecial(
        fort.root,
        fort.visualBody,
        fort.lanternWorldTarget,
        (a) => fort?.setHitFlash(a),
        (a) => fort?.setTelegraphFlash(a),
        (time) => fort?.update(time, this.ship.x, this.ship.z),
      );
    } else if (params.archetype === 'kraken') {
      kraken = buildKrakenBoss();
      kraken.root.position.set(params.x, 0, params.z);
      this.scene.add(kraken.root);
      built = this.createStubBuiltForSpecial(
        kraken.root,
        kraken.visualBody,
        kraken.lanternWorldTarget,
        (a) => kraken?.setHitFlash(a),
        (a) => kraken?.setTelegraphFlash(a),
        (time) => kraken?.update(time),
      );
    } else {
      built = buildCorsairShip({
        isEnemy: true,
        isBoss,
        archetype: params.archetype,
        scale: params.scale,
      });
      built.root.position.set(params.x, 0, params.z);
      this.scene.add(built.root);
    }

    const shielded = params.archetype === 'wraith' || params.archetype === 'kraken';
    return {
      id: params.id,
      archetype: params.archetype,
      isBoss,
      bossEnraged: false,
      shieldBroken: !shielded,
      scale: params.scale,
      built,
      fort,
      kraken,
      x: params.x,
      z: params.z,
      heading: normalizeAngle(-params.orbitAngle),
      speed: params.speed,
      currentSpeed: params.speed,
      orbitRadius: params.orbitRadius,
      orbitAngle: params.orbitAngle,
      hp: params.hp,
      maxHp: params.hp,
      fireTimer: params.fireTimer,
      telegraphTimer: 0,
      specialTimer:
        params.archetype === 'healer'
          ? 4.2
          : params.archetype === 'fireship'
            ? 0.25
            : params.archetype === 'kraken'
              ? 6.2
              : 2.5,
      playerCollisionCooldown: 0,
      sailDebuffTimer: 0,
      crewDebuffTimer: 0,
      armorRendTimer: 0,
      whirlpoolDamageCd: 0,
      alive: true,
      hitFlash: 0,
      squashY: 1,
      squashVel: 0,
      pitch: 0,
      roll: 0,
      burnTimer: 0,
      burnDps: 5,
      burnTickAccum: 0,
      fireSpawnTimer: 0,
      wakeTimer: Math.random() * 0.12,
    };
  }

  private recomputePlayerStats(): void {
    const base = computePlayerStats(
      this.difficulty,
      this.upgrades,
      this.activeOfficers,
      this.activeContracts,
      {
        shipClass: this.shipClass,
        figurehead: this.equippedFigurehead,
        crestId: this.equippedCrest,
        perks: this.unlockedPerks,
        morale: this.morale,
      },
    );
    const relicMods = computeRelicModifiers(this.activeRelics);
    const mutMods = computeEndlessMutatorModifiers(this.activeMutators);
    this.playerStats = {
      ...base,
      damageMult: Number(
        (
          base.damageMult *
          this.merchantBuffs.damageMult *
          relicMods.damageBonusMult *
          mutMods.damageMult
        ).toFixed(2),
      ),
      reloadTime: Number(
        Math.max(
          0.6,
          base.reloadTime * this.merchantBuffs.reloadMult * mutMods.reloadMult,
        ).toFixed(2),
      ),
      speedMult: Number(
        (
          base.speedMult *
          this.merchantBuffs.speedMult *
          relicMods.speedBonusMult *
          mutMods.speedMult
        ).toFixed(2),
      ),
      burnDamageMult: Number((base.burnDamageMult * this.merchantBuffs.splashBurnMult).toFixed(2)),
      ramBonusMult: Number((base.ramBonusMult * relicMods.ramBonusMult).toFixed(2)),
      doubloonGainMult: Number(
        (
          base.doubloonGainMult *
          relicMods.doubloonBonusMult *
          mutMods.doubloonMult *
          this.waveGoldBonusMult
        ).toFixed(2),
      ),
      surgeCooldown: Number((base.surgeCooldown * relicMods.cooldownMult).toFixed(2)),
    };
  }

  private acquireParticleMesh(geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
    const recycled = this.particlePool.pop();
    if (recycled) {
      recycled.geometry = geo;
      recycled.material = mat;
      recycled.scale.setScalar(1);
      recycled.rotation.set(0, 0, 0);
      this.scene.add(recycled);
      return recycled;
    }
    const mesh = new THREE.Mesh(geo, mat);
    this.scene.add(mesh);
    return mesh;
  }

  private releaseParticleMesh(mesh: THREE.Mesh): void {
    this.scene.remove(mesh);
    if (this.particlePool.length < 180) {
      this.particlePool.push(mesh);
    }
  }

  private acquireSmokePuff(colorHex: number): { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial } {
    const recycled = this.smokePuffPool.pop();
    if (recycled) {
      recycled.mat.color.setHex(colorHex);
      recycled.mat.opacity = 0.62;
      recycled.mesh.scale.setScalar(1);
      this.scene.add(recycled.mesh);
      return recycled;
    }
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(this.sharedSmokeGeo, mat);
    this.scene.add(mesh);
    return { mesh, mat };
  }

  private releaseSmokePuff(mesh: THREE.Mesh): void {
    this.scene.remove(mesh);
    const mat = mesh.material as THREE.MeshBasicMaterial;
    if (this.smokePuffPool.length < 64) {
      this.smokePuffPool.push({ mesh, mat });
    } else {
      mat.dispose();
    }
  }

  private spawnOilSlick(x: number, z: number, radius: number, ignited = false): void {
    if (this.oilSlicks.length >= 14) {
      this.oilSlicks.shift();
    }
    this.oilSlicks.push({
      x,
      z,
      radius,
      life: ignited ? 7.5 : 16,
      maxLife: ignited ? 7.5 : 16,
      ignited,
      igniteTimer: ignited ? 6.0 : 0,
      tickAccum: 0,
    });
  }

  private igniteOilSlicks(x: number, z: number, triggerRadius: number): boolean {
    let ignitedAny = false;
    for (const slick of this.oilSlicks) {
      if (slick.ignited) continue;
      if (Math.hypot(slick.x - x, slick.z - z) <= slick.radius + triggerRadius) {
        slick.ignited = true;
        slick.igniteTimer = 5.8;
        slick.life = Math.max(slick.life, 6.0);
        ignitedAny = true;
        const sy = sampleWaveHeight(slick.x, slick.z, this.elapsed, this.seaParams.waveHeight);
        this.spawnBurst(slick.x, sy + 1.2, slick.z, 0xff6228, 12);
        this.spawnRing(slick.x, sy + 0.5, slick.z, '#FF7B2E', slick.radius, 0.5);
        this.spawnFloatingText(slick.x, sy + 4.4, slick.z, this.et().combatOilIgnite, '#FF9E44', 1.15);
      }
    }
    if (ignitedAny) {
      this.audio.playFireShot();
      this.setCallout(this.et().barkOilIgnite, 3.0, 'gunner');
    }
    return ignitedAny;
  }

  private spawnEscortConvoy(): void {
    if (this.escortConvoy) {
      this.scene.remove(this.escortConvoy.built.root);
      this.escortConvoy = null;
    }
    const cx = Math.max(-88, Math.min(88, this.ship.x - Math.sin(this.ship.heading) * 18 - 14));
    const cz = Math.max(-88, Math.min(88, this.ship.z + Math.cos(this.ship.heading) * 18 + 10));
    const built = buildCorsairShip({
      isEnemy: false,
      archetype: 'healer',
      scale: 0.94,
    });
    const cy = sampleWaveHeight(cx, cz, this.elapsed, this.seaParams.waveHeight);
    built.root.position.set(cx, cy, cz);
    this.scene.add(built.root);
    this.escortConvoy = {
      x: cx,
      z: cz,
      heading: this.ship.heading,
      speed: 4.9,
      hp: 165,
      maxHp: 165,
      built,
      alive: true,
      hitFlash: 0,
    };
    this.setCallout(this.et().calloutConvoySpawned, 3.8, 'bosun');
  }

  public chooseSeaRoute(routeId: SeaRouteId): void {
    this.activeEncounterModal = null;
    this.routeChoices = [];
    this.waveGoldBonusMult = 1;
    this.audio.playUiClick();

    if (routeId === 'calmChannel') {
      const wSpec = WEATHER_SPECS.calm;
      this.weather = 'calm';
      this.weatherTimer = 38;
      this.seaParams = {
        ...this.seaParams,
        waveHeight: Number((this.baseActWaveHeight * wSpec.waveMult).toFixed(2)),
        windSpeed: Number((this.baseActWindSpeed * wSpec.windMult).toFixed(2)),
      };
      this.hullHp = Math.min(this.hullMaxHp, this.hullHp + Math.round(this.hullMaxHp * 0.22));
      this.morale = Math.min(100, this.morale + 15);
      this.recomputePlayerStats();
      this.spawnMerchantSite();
    } else if (routeId === 'smugglerReefs') {
      const rx1 = Math.max(-96, Math.min(96, this.ship.x + 34));
      const rz1 = Math.max(-96, Math.min(96, this.ship.z - 28));
      const rx2 = Math.max(-96, Math.min(96, this.ship.x - 36));
      const rz2 = Math.max(-96, Math.min(96, this.ship.z + 24));
      this.spawnWreckageSite(rx1, rz1);
      this.spawnWreckageSite(rx2, rz2);
      this.spawnProp('bottle', Math.max(-92, Math.min(92, this.ship.x + 18)), Math.max(-92, Math.min(92, this.ship.z - 16)));
    } else if (routeId === 'stormTrench') {
      const wSpec = WEATHER_SPECS.squall;
      this.weather = 'squall';
      this.weatherTimer = 38;
      this.seaParams = {
        ...this.seaParams,
        waveHeight: Number((this.baseActWaveHeight * wSpec.waveMult).toFixed(2)),
        windSpeed: Number((this.baseActWindSpeed * wSpec.windMult).toFixed(2)),
      };
      this.waveGoldBonusMult = 1.35;
      const relic = pickRandomUnownedRelic(this.activeRelics, Math.random());
      if (relic) {
        this.activeRelics.push(relic);
      }
      this.rogueWaveTimer = 1.0;
      this.recomputePlayerStats();
    } else if (routeId === 'escortConvoy') {
      this.spawnEscortConvoy();
    }

    const nextMode = this.pendingNextWaveMode;
    this.pendingNextWaveMode = null;
    if (nextMode === 'campaignWave2') {
      this.spawnWave2Flagship();
    } else if (nextMode === 'endlessNext') {
      this.spawnEndlessNextWave();
    } else {
      this.emitHud();
    }
  }

  public chooseEndlessMutator(mutId: EndlessMutatorId): void {
    this.activeEncounterModal = null;
    this.mutatorChoices = [];
    if (!this.activeMutators.includes(mutId)) {
      this.activeMutators.push(mutId);
    }
    this.recomputePlayerStats();
    this.audio.playPickup();
    const nextMode = this.pendingNextWaveMode;
    this.pendingNextWaveMode = null;
    if (nextMode === 'endlessNext') {
      this.spawnEndlessNextWave();
    } else {
      this.emitHud();
    }
  }

  private spawnEnemiesForDifficulty(): void {
    for (const e of this.enemies) {
      this.scene.remove(e.built.root);
    }
    this.enemies = [];
    this.wave = 1;

    const spec = DIFFICULTY_SPECS[this.difficulty];
    const actSpec = ACT_SPECS[this.act];
    this.recomputePlayerStats();
    const wave1Count =
      this.playMode === 'endless'
        ? spec.enemyCount
        : spec.enemyCount + actSpec.wave1CountBonus;
    this.targetShips = wave1Count;
    this.hullMaxHp = this.playerStats.maxHp;
    this.hullHp = this.playerStats.maxHp;

    const archetypes = pickWaveArchetypes(this.act, 1, wave1Count, this.playMode);
    for (let i = 0; i < wave1Count; i += 1) {
      const archetype = archetypes[i] ?? 'brig';
      const scale = archetype === 'fireship' ? 0.88 : archetype === 'mortar' ? 1.06 : 0.96 + (i % 2) * 0.08;
      const angle = (i / wave1Count) * Math.PI * 2 + 0.45;
      const radius = archetype === 'mortar' ? 52 : 34 + (i % 3) * 14;
      const ex = Math.cos(angle) * radius;
      const ez = -24 + Math.sin(angle) * radius * 0.72;
      const hpMult = archetype === 'fireship' ? 0.72 : archetype === 'mortar' ? 1.15 : 1.0;
      const maxHp = Math.round(90 * spec.enemyHpMultiplier * actSpec.enemyHpMult * hpMult);
      const speed =
        archetype === 'fireship'
          ? 8.4 + (this.act - 1) * 0.35
          : archetype === 'mortar'
            ? 4.6
            : 6.0 + (i % 2) * 1.0 + (this.act - 1) * 0.4;

      this.enemies.push(
        this.createEnemyShip({
          id: i + 1,
          archetype,
          scale,
          x: ex,
          z: ez,
          hp: maxHp,
          speed,
          orbitRadius: radius,
          orbitAngle: angle,
          fireTimer: 2.8 + i * 1.1,
        }),
      );
    }
  }

  private spawnWave2Flagship(): void {
    for (const e of this.enemies) {
      this.scene.remove(e.built.root);
    }
    this.enemies = [];
    this.wave = 2;

    const spec = DIFFICULTY_SPECS[this.difficulty];
    const actSpec = ACT_SPECS[this.act];
    const hasFort = this.act === 2;
    const hasKraken = this.act === 3;
    this.targetShips += 1 + actSpec.escortCount + (hasFort ? 1 : 0) + (hasKraken ? 1 : 0);

    const bossMaxHp = Math.round(actSpec.bossHp * spec.enemyHpMultiplier);
    this.enemies.push(
      this.createEnemyShip({
        id: 100,
        archetype: 'boss',
        scale: 1.48,
        x: 0,
        z: -66,
        hp: bossMaxHp,
        speed: 5.5 + (this.act - 1) * 0.35,
        orbitRadius: 42,
        orbitAngle: -Math.PI * 0.5,
        fireTimer: 2.3,
      }),
    );

    if (hasFort) {
      this.enemies.push(
        this.createEnemyShip({
          id: 150,
          archetype: 'seafort',
          scale: 1.0,
          x: 26,
          z: -48,
          hp: Math.round(240 * spec.enemyHpMultiplier),
          speed: 0,
          orbitRadius: 999,
          orbitAngle: 0,
          fireTimer: 2.9,
        }),
      );
    }

    if (hasKraken) {
      this.enemies.push(
        this.createEnemyShip({
          id: 160,
          archetype: 'kraken',
          scale: 1.15,
          x: -36,
          z: -48,
          hp: Math.round(280 * spec.enemyHpMultiplier),
          speed: 4.9,
          orbitRadius: 38,
          orbitAngle: 1.1,
          fireTimer: 3.4,
        }),
      );
      this.audio.playKrakenRoar();
      this.onKrakenArrival?.();
    }

    const escortTypes = pickWaveArchetypes(this.act, 2, actSpec.escortCount, 'campaign');
    for (let i = 0; i < actSpec.escortCount; i += 1) {
      const archetype = escortTypes[i] ?? 'brig';
      const ex = i % 2 === 0 ? 38 : -40;
      const ez = -26 - i * 12;
      const hpMult =
        archetype === 'healer'
          ? 0.95
          : archetype === 'mortar'
            ? 1.1
            : archetype === 'wraith'
              ? 1.12
              : 1.0;
      const escortHp = Math.round(95 * spec.enemyHpMultiplier * actSpec.enemyHpMult * hpMult);
      this.enemies.push(
        this.createEnemyShip({
          id: 101 + i,
          archetype,
          scale: archetype === 'mortar' ? 1.08 : 1.02,
          x: ex,
          z: ez,
          hp: escortHp,
          speed: archetype === 'fireship' ? 8.6 : 6.6 + (this.act - 1) * 0.35,
          orbitRadius: archetype === 'mortar' ? 50 : 36 + i * 6,
          orbitAngle: 0.2 + i * 2.2,
          fireTimer: 3.1 + i * 0.9,
        }),
      );
    }

    this.audio.playBossHorn();
    this.screenShake = Math.max(this.screenShake, 0.72);
    this.lightningAlpha = Math.max(this.lightningAlpha, 0.58);
    this.setCallout(hasFort ? this.et().seafortSpotted : this.t().calloutWave2, 4.0);
    this.onBossArrival?.(this.act, ACT_SPECS[this.act].bossKey);
    this.updateMusicCondition();
    this.emitHud();
  }

  private spawnEndlessNextWave(): void {
    for (const e of this.enemies) {
      this.scene.remove(e.built.root);
    }
    this.enemies = [];
    this.wave += 1;

    const spec = DIFFICULTY_SPECS[this.difficulty];
    const scaleFactor = 1 + (this.wave - 1) * 0.14;
    const isBossWave = this.wave % 3 === 0;
    const isKrakenWave = this.wave >= 6 && this.wave % 6 === 0;
    const isFortWave = this.wave >= 4 && this.wave % 4 === 0;
    const escortCount = isBossWave
      ? Math.min(4, 1 + Math.floor(this.wave / 3))
      : Math.min(6, spec.enemyCount + Math.floor((this.wave - 1) / 2));

    this.targetShips += (isBossWave ? 1 : 0) + (isKrakenWave ? 1 : 0) + (isFortWave ? 1 : 0) + escortCount;
    this.score += 350 + this.wave * 75;
    this.runDoubloonsBonus += 25 + Math.floor(this.wave / 2) * 5;

    // Reward wave clear with a fresh supply crate nearby
    this.spawnProp(this.wave % 2 === 0 ? 'repair' : 'powder', (Math.random() - 0.5) * 26, (Math.random() - 0.5) * 26);

    if (isBossWave) {
      const bossHp = Math.round((240 + this.wave * 42) * spec.enemyHpMultiplier);
      this.enemies.push(
        this.createEnemyShip({
          id: this.wave * 100,
          archetype: 'boss',
          scale: 1.48,
          x: 0,
          z: -68,
          hp: bossHp,
          speed: 5.8 + Math.min(1.8, this.wave * 0.14),
          orbitRadius: 44,
          orbitAngle: -Math.PI * 0.5,
          fireTimer: 2.1,
        }),
      );
      this.audio.playBossHorn();
      this.screenShake = Math.max(this.screenShake, 0.75);
      this.lightningAlpha = Math.max(this.lightningAlpha, 0.6);
      this.setCallout(this.t().calloutWave2, 3.8);
      this.onBossArrival?.(this.act, ACT_SPECS[this.act].bossKey);
    } else {
      this.setCallout(`${this.t().waveLabel} ${this.wave}`, 2.8);
    }

    if (isFortWave) {
      this.enemies.push(
        this.createEnemyShip({
          id: this.wave * 100 + 88,
          archetype: 'seafort',
          scale: 1.0,
          x: 28,
          z: -48,
          hp: Math.round(230 * scaleFactor * spec.enemyHpMultiplier),
          speed: 0,
          orbitRadius: 999,
          orbitAngle: 0,
          fireTimer: 2.7,
        }),
      );
    }

    if (isKrakenWave) {
      this.enemies.push(
        this.createEnemyShip({
          id: this.wave * 100 + 99,
          archetype: 'kraken',
          scale: 1.18,
          x: -38,
          z: -44,
          hp: Math.round(260 * scaleFactor * spec.enemyHpMultiplier),
          speed: 5.0,
          orbitRadius: 40,
          orbitAngle: 0.7,
          fireTimer: 3.2,
        }),
      );
      this.audio.playKrakenRoar();
      this.onKrakenArrival?.();
    }

    const archetypes = pickWaveArchetypes(this.act, this.wave, escortCount, 'endless');
    for (let i = 0; i < escortCount; i += 1) {
      const archetype = archetypes[i] ?? 'brig';
      const angle = (i / Math.max(1, escortCount)) * Math.PI * 2 + this.wave * 0.4;
      const radius = archetype === 'mortar' ? 54 : 36 + (i % 3) * 12;
      const ex = Math.cos(angle) * radius;
      const ez = -20 + Math.sin(angle) * radius * 0.75;
      const hpMult = archetype === 'fireship' ? 0.74 : archetype === 'mortar' ? 1.12 : 1.0;
      const hp = Math.round(92 * spec.enemyHpMultiplier * scaleFactor * hpMult);
      this.enemies.push(
        this.createEnemyShip({
          id: this.wave * 100 + i + 1,
          archetype,
          scale: archetype === 'fireship' ? 0.88 : archetype === 'mortar' ? 1.08 : 0.98,
          x: ex,
          z: ez,
          hp,
          speed:
            archetype === 'fireship'
              ? 8.5 + Math.min(1.6, this.wave * 0.15)
              : archetype === 'mortar'
                ? 4.8
                : 6.2 + Math.min(1.5, this.wave * 0.12),
          orbitRadius: radius,
          orbitAngle: angle,
          fireTimer: 2.6 + i * 0.8,
        }),
      );
    }

    this.updateMusicCondition();
    this.emitHud();
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this.container);
    }
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    dom.addEventListener('wheel', this.handleWheel, { passive: true });
    dom.addEventListener('contextmenu', this.handleContextMenu);
    dom.addEventListener('webglcontextlost', this.handleContextLost);
    dom.addEventListener('webglcontextrestored', this.handleContextRestored);
  }

  private handleWindowBlur = (): void => {
    this.keys.clear();
    this.touchSteer = 0;
    this.draggingCamera = false;
  };

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.handleWindowBlur();
    }
  };

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    this.contextLost = true;
  };

  private handleContextRestored = (): void => {
    this.contextLost = false;
    this.handleResize();
  };

  private handleContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
  };

  private handleResize = (): void => {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.vfxCanvas.width = w;
    this.vfxCanvas.height = h;
    this.vfxCtx.imageSmoothingEnabled = true;
    this.vfxCtx.imageSmoothingQuality = 'high';
    if (this.composer) {
      this.composer.setSize(w, h);
    }
  };

  private triggerAction(action: string, e?: KeyboardEvent | PointerEvent): boolean {
    switch (action) {
      case 'sailUp':
        this.changeSail(1);
        return true;
      case 'sailDown':
        this.changeSail(-1);
        return true;
      case 'ammo1':
        this.setAmmo('round');
        return true;
      case 'ammo2':
        this.setAmmo('chain');
        return true;
      case 'ammo3':
        this.setAmmo('grape');
        return true;
      case 'ammo4':
        this.setAmmo('incendiary');
        return true;
      case 'ammo5':
        this.setAmmo('mortar');
        return true;
      case 'ammo6':
        this.setAmmo('harpoonBolt');
        return true;
      case 'ammo7':
        this.setAmmo('cursed');
        return true;
      case 'interact':
        this.triggerInteract();
        return true;
      case 'firePort':
        this.fireBroadside('port');
        return true;
      case 'fireStbd':
        this.fireBroadside('starboard');
        return true;
      case 'fireBoth':
        e?.preventDefault?.();
        this.fireBroadside('both');
        return true;
      case 'board':
        this.triggerBoarding();
        return true;
      case 'harpoon':
        this.triggerHarpoon();
        return true;
      case 'smoke':
        this.triggerSmoke();
        return true;
      case 'stormWake':
        this.triggerStormWake();
        return true;
      case 'dropMine':
        this.triggerMine();
        return true;
      case 'surge':
        this.triggerSurge();
        return true;
      default:
        return false;
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    this.audio.unlock();
    this.keys.add(e.code);

    if (document.body.dataset.modalOpen === '1') {
      return;
    }

    if (this.mode === 'title') {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        this.startPlay();
      }
      return;
    }

    const mapped = matchActionCode(this.bindings, e.code);
    if (mapped === 'pause' || e.code === 'Escape' || e.code === 'KeyP') {
      if (this.mode === 'playing') {
        this.setMode('paused');
      } else if (this.mode === 'paused') {
        this.setMode('playing');
      }
      return;
    }

    if (this.mode !== 'playing') return;

    if (mapped && this.triggerAction(mapped, e)) return;

    if (e.code === 'ArrowUp') {
      this.changeSail(1);
    } else if (e.code === 'ArrowDown') {
      this.changeSail(-1);
    } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.triggerSurge();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private handlePointerDown = (e: PointerEvent): void => {
    this.audio.unlock();
    if (document.body.dataset.modalOpen === '1') return;

    if (this.mode === 'playing' && (e.button === 0 || e.button === 2) && this.activeEncounterModal === null) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      const radar = this.getRadarGeometry(rect.width, rect.height);
      const dxR = localX - radar.cx;
      const dyR = localY - radar.cy;
      if (Math.hypot(dxR, dyR) <= radar.radius + 4) {
        if (e.button === 2) {
          e.preventDefault();
          if (this.courseWaypoint) {
            this.clearWaypoint();
            this.audio.playUiClick();
          }
          return;
        }
        const wx = Math.max(-132, Math.min(132, dxR / radar.scale));
        const wz = Math.max(-132, Math.min(132, dyR / radar.scale));
        if (
          this.courseWaypoint &&
          Math.hypot(wx - this.courseWaypoint.x, wz - this.courseWaypoint.z) < 18
        ) {
          this.clearWaypoint();
        } else {
          this.courseWaypoint = { x: wx, z: wz };
          if (!this.waypointBeacon) {
            this.waypointBeacon = buildWaypointBeacon();
            this.scene.add(this.waypointBeacon.group);
          }
          const wy = sampleWaveHeight(
            wx,
            wz,
            this.elapsed,
            this.seaParams.waveHeight,
            this.rogueWave,
          );
          this.waypointBeacon.group.position.set(wx, wy, wz);
          this.audio.playUiClick();
          this.setCallout(this.et().waypointSetCallout, 2.6);
          this.emitHud();
        }
        return;
      }
    }

    const code = e.button === 0 ? 'Mouse0' : e.button === 1 ? 'Mouse1' : e.button === 2 ? 'Mouse2' : '';
    const mapped = code ? matchActionCode(this.bindings, code) : null;

    if (e.button === 2) {
      e.preventDefault();
      if (this.mode === 'playing') {
        if (mapped) {
          this.triggerAction(mapped, e);
        } else {
          this.triggerSurge();
        }
      }
      return;
    }
    if (this.mode === 'playing' && mapped && e.button === 1) {
      e.preventDefault();
      this.triggerAction(mapped, e);
      return;
    }
    if (this.mode === 'playing' && mapped && e.button === 0) {
      this.triggerAction(mapped, e);
    }
    if (e.button === 0) {
      this.draggingCamera = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    }
  };

  private handlePointerMove = (e: PointerEvent): void => {
    if (!this.draggingCamera) return;
    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.camYawOffset -= dx * 0.006;
    this.camPitch = Math.max(0.18, Math.min(0.95, this.camPitch + dy * 0.004));
  };

  private handlePointerUp = (): void => {
    this.draggingCamera = false;
  };

  private handleWheel = (e: WheelEvent): void => {
    this.camDistance = Math.max(18, Math.min(54, this.camDistance + e.deltaY * 0.02));
  };

  private t() {
    return TRANSLATIONS[this.language] ?? TRANSLATIONS.en;
  }

  private et() {
    return getExtraT(this.language);
  }

  private setCallout(msg: string, duration = 2.6, speaker: OfficerId | null = null): void {
    this.callout = msg;
    this.calloutSpeaker = speaker;
    this.calloutTimer = duration;
    this.emitHud();
  }

  private tryOfficerBark(event: OfficerBarkEvent): boolean {
    const selection = pickOfficerBark(
      this.activeOfficers,
      event,
      this.elapsed,
      this.lastOfficerBarkSec,
    );
    if (!selection) return false;
    this.lastOfficerBarkSec = this.elapsed;
    this.setCallout(this.t()[selection.textKey], 3.4, selection.officer);
    return true;
  }

  public setLanguage(lang: LanguageCode): void {
    this.language = lang;
    this.emitHud();
  }

  public setDifficulty(diff: DifficultyLevel): void {
    this.difficulty = diff;
    this.resetVoyage();
  }

  public setBindings(bindings: KeyBindings): void {
    this.bindings = { ...bindings };
  }

  public setMasterVolume(vol: number): void {
    this.audio.setMasterVolume(vol);
  }

  public playUiHover(): void {
    this.audio.playUiHover();
  }

  public playSliderRustle(): void {
    this.audio.playSliderRustle();
  }

  public setGraphicsQuality(quality: GraphicsQuality): void {
    this.graphicsQuality = quality;
    const preset = GRAPHICS_PRESETS[quality] ?? GRAPHICS_PRESETS.high;
    const pr = this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, preset.pixelRatioCap);
    this.renderer.setPixelRatio(pr);
    if (this.foamMaterial?.uniforms?.uPixelRatio) {
      this.foamMaterial.uniforms.uPixelRatio.value = pr;
    }
    const shadowsActive = !this.isSoftwareGl && preset.shadows;
    this.renderer.shadowMap.enabled = shadowsActive;
    if (this.sunLight) {
      this.sunLight.castShadow = shadowsActive;
      if (this.sunLight.shadow.mapSize.x !== preset.shadowMapSize) {
        this.sunLight.shadow.mapSize.set(preset.shadowMapSize, preset.shadowMapSize);
        this.sunLight.shadow.map?.dispose();
        this.sunLight.shadow.map = null;
      }
    }
    if (this.seaMesh) {
      this.seaMesh.receiveShadow = shadowsActive;
      if (this.currentSeaSegments !== preset.seaSegments) {
        this.currentSeaSegments = preset.seaSegments;
        const oldGeo = this.seaMesh.geometry;
        const nextGeo = new THREE.PlaneGeometry(460, 460, preset.seaSegments, preset.seaSegments);
        nextGeo.rotateX(-Math.PI / 2);
        this.seaMesh.geometry = nextGeo;
        oldGeo.dispose();
      }
    }
    if (this.bloomPass) {
      this.bloomPass.enabled = preset.bloomEnabled;
    }
    this.handleResize();
  }

  public setShipLoadout(
    shipClass: ShipClassId,
    figurehead: FigureheadId,
    perks: CaptainPerkId[],
  ): void {
    this.shipClass = shipClass;
    this.equippedFigurehead = figurehead;
    this.unlockedPerks = [...perks];
    this.recomputePlayerStats();
    this.playerBuilt?.setShipLoadoutStyle?.(shipClass, figurehead);
    if (this.mode === 'title') {
      this.hullMaxHp = this.playerStats.maxHp;
      this.hullHp = this.playerStats.maxHp;
    }
    this.emitHud();
  }

  public setUpgrades(upgrades: ShipUpgrades): void {
    this.upgrades = { ...upgrades };
    this.recomputePlayerStats();
    this.playerBuilt?.setUpgradeTier(getTotalUpgradeLevel(this.upgrades));
    if (this.mode === 'title') {
      this.hullMaxHp = this.playerStats.maxHp;
      this.hullHp = this.playerStats.maxHp;
    }
    this.emitHud();
  }

  public setOfficers(officers: OfficerId[]): void {
    this.activeOfficers = [...officers];
    this.recomputePlayerStats();
    if (this.mode === 'title') {
      this.hullMaxHp = this.playerStats.maxHp;
      this.hullHp = this.playerStats.maxHp;
    }
    this.emitHud();
  }

  public setCrest(crestId: ShipCrestId): void {
    this.equippedCrest = crestId;
    this.recomputePlayerStats();
    this.playerBuilt?.setCrestStyle?.(crestId);
    if (this.mode === 'title') {
      this.hullMaxHp = this.playerStats.maxHp;
      this.hullHp = this.playerStats.maxHp;
    }
    this.emitHud();
  }

  public setContracts(contracts: BlackContractId[]): void {
    this.activeContracts = [...contracts];
    this.recomputePlayerStats();
    if (this.mode === 'title') {
      this.hullMaxHp = this.playerStats.maxHp;
      this.hullHp = this.playerStats.maxHp;
    }
    this.emitHud();
  }

  public setAct(actId: ActId): void {
    this.playMode = 'campaign';
    if (this.act === actId) return;
    this.act = actId;
    this.rebuildActArena(actId);
    this.resetVoyage();
  }

  public startAct(
    actId: ActId,
    upgrades?: ShipUpgrades,
    officers?: OfficerId[],
    fromUserGesture = true,
    contracts?: BlackContractId[],
  ): void {
    this.playMode = 'campaign';
    if (upgrades) this.upgrades = { ...upgrades };
    if (officers) this.activeOfficers = [...officers];
    if (contracts) this.activeContracts = [...contracts];
    const mods = computeContractModifiers(this.activeContracts);
    this.weather = mods.forceSquall ? 'squall' : 'tailwind';
    this.weatherTimer = 36;
    this.act = actId;
    this.rebuildActArena(actId);
    this.resetVoyage();
    this.startPlay(fromUserGesture);
  }

  public startEndless(
    upgrades?: ShipUpgrades,
    officers?: OfficerId[],
    fromUserGesture = true,
    contracts?: BlackContractId[],
  ): void {
    this.playMode = 'endless';
    if (upgrades) this.upgrades = { ...upgrades };
    if (officers) this.activeOfficers = [...officers];
    if (contracts) this.activeContracts = [...contracts];
    const mods = computeContractModifiers(this.activeContracts);
    this.weather = mods.forceSquall ? 'squall' : 'tailwind';
    this.weatherTimer = 34;
    this.act = 3;
    this.rebuildActArena(3);
    this.resetVoyage();
    this.startPlay(fromUserGesture);
  }

  public setMode(mode: SceneMode): void {
    this.mode = mode;
    this.onModeChange(mode);
    this.updateMusicCondition();
    if (mode === 'paused') {
      this.setCallout(this.t().calloutPaused, 2);
    }
    this.emitHud();
  }

  private triggerPlayerDefeat(): void {
    this.setCallout(this.t().calloutDefeat, 4.0);
    if (this.playMode === 'endless') {
      this.onEndlessEnd?.({
        waveReached: this.wave,
        score: this.score,
        sunkCount: this.sunkCount,
        boardedCount: this.boardedCount,
        bonusGoldCollected: this.runDoubloonsBonus,
        bossesDefeatedInRun: this.runBossesDefeated,
        bestComboInRun: this.runBestCombo,
        milesSailed: Number(this.milesSailed.toFixed(1)),
        shotsFired: this.shotsFired,
        shotsHit: this.shotsHit,
        morale: Math.round(this.morale),
        bestiaryKillsInRun: { ...this.bestiaryKillsInRun },
      });
    } else {
      this.onDefeatSummary?.({
        sunkCount: this.sunkCount,
        boardedCount: this.boardedCount,
        milesSailed: Number(this.milesSailed.toFixed(1)),
        bestComboInRun: this.runBestCombo,
        shotsFired: this.shotsFired,
        shotsHit: this.shotsHit,
        morale: Math.round(this.morale),
        bestiaryKillsInRun: { ...this.bestiaryKillsInRun },
      });
    }
    this.setMode('defeat');
  }

  public startPlay(fromUserGesture = true): void {
    if (fromUserGesture) {
      this.audio.unlock();
      this.audio.playUiClick();
    }
    if (this.mode === 'victory' || this.mode === 'defeat') {
      this.resetVoyage();
    }
    this.setMode('playing');
    this.onLogUnlock?.('logFirstSail');
    this.setCallout(this.t().calloutDefault, 3.4);
  }

  public returnToMenu(): void {
    this.audio.playUiClick();
    this.resetVoyage();
    this.setMode('title');
  }

  public resetVoyage(): void {
    this.ship = createInitialShipState();
    this.portCooldown = 0;
    this.stbdCooldown = 0;
    this.mineCooldown = 0;
    this.morale = 75;
    this.mutinyWarned = false;
    this.goldDrainAccum = 0;
    this.seaEventTimer = 24;
    this.merchantSpawnTimer = 18;
    this.rogueWaveTimer = 19;
    this.rogueWave = {
      active: false,
      x: 0,
      z: 0,
      radius: 44,
      amplitude: 0,
      dirX: 1,
      dirZ: 0,
    };
    this.activeEncounterModal = null;
    this.merchantBuffs = createDefaultRunMerchantBuffs();
    this.fleetCharmBought = false;
    this.surgeonHealAccum = 0;
    this.activeRelics = [];
    this.activeMutators = [];
    this.routeChoices = [];
    this.mutatorChoices = [];
    this.pendingNextWaveMode = null;
    this.pendingBoardingTargetId = null;
    this.waveGoldBonusMult = 1;
    this.treasureSpot = null;
    this.oilSlicks = [];
    this.lightningArcs = [];
    if (this.escortConvoy) {
      this.scene.remove(this.escortConvoy.built.root);
      this.escortConvoy = null;
    }
    this.milesSailed = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.monstersSunk = 0;
    this.bestiaryKillsInRun = {};
    this.abilities = createInitialAbilityState();
    this.smokeSpawnTimer = 0;
    this.reefDamageCooldown = 0;
    this.enemyPairCooldowns.clear();
    for (const wp of this.whirlpools) wp.coreDamageCd = 0;
    this.sunkCount = 0;
    this.score = 0;
    this.runDoubloonsBonus = 0;
    this.boardedCount = 0;
    this.runBossesDefeated = 0;
    this.runBestCombo = 0;
    this.comboStreak = 0;
    this.comboTimer = 0;
    this.triggeredSecrets.clear();
    this.litShoalIndices.clear();
    this.broadsideFiredThisTick = false;
    this.fogHulkHoldSec = 0;
    this.fogHulkPrompted = false;
    for (const h of this.headlands) h.setBrazierLit(false);
    if (this.lighthouseRelic) {
      this.lighthouseRelic.collected = false;
      this.lighthouseRelic.built.group.visible = true;
    }
    if (this.beamBellProp) {
      this.beamBellProp.completed = false;
      this.beamBellProp.built.group.visible = true;
      this.beamBellProp.built.setHighlight?.(false);
    }
    if (this.fogHulkProp) {
      this.fogHulkProp.completed = false;
      this.fogHulkProp.built.group.visible = true;
    }
    if (this.stormBuoyProp) {
      this.stormBuoyProp.completed = false;
      this.stormBuoyProp.built.group.visible = true;
      this.stormBuoyProp.built.setHighlight?.(false);
    }
    if (this.reefChestProp) {
      this.reefChestProp.completed = false;
      this.reefChestProp.built.group.visible = true;
      this.reefChestProp.built.setHighlight?.(false);
    }
    this.litShadowStraitIndices.clear();
    for (const sb of this.shadowStraitBuoys) {
      sb.built.group.visible = true;
      sb.built.setHighlight?.(false);
    }
    if (this.stormRiftProp) {
      this.stormRiftProp.completed = false;
      this.stormRiftProp.built.group.visible = true;
      this.stormRiftProp.built.setHighlight?.(false);
    }
    this.screenShake = 0;
    this.hitstopTimer = 0;
    this.lightningAlpha = 0;
    const contractMods = computeContractModifiers(this.activeContracts);
    this.weather = contractMods.forceSquall ? 'squall' : 'tailwind';
    this.weatherTimer = 36;
    const wSpec = WEATHER_SPECS[this.weather];
    this.seaParams = {
      ...this.seaParams,
      waveHeight: Number((this.baseActWaveHeight * wSpec.waveMult).toFixed(2)),
      windSpeed: Number((this.baseActWindSpeed * wSpec.windMult).toFixed(2)),
    };
    this.clearVfx();
    this.playerBuilt?.setUpgradeTier(getTotalUpgradeLevel(this.upgrades));
    this.playerBuilt?.setCrestStyle?.(this.equippedCrest);
    this.playerBuilt?.setShipLoadoutStyle?.(this.shipClass, this.equippedFigurehead);
    this.playerBuilt?.setHullDamageRatio?.(1);
    this.spawnEnemiesForDifficulty();
    this.spawnArenaBarrels();
    this.callout = this.t().calloutDefault;
    this.calloutSpeaker = null;
    this.lastOfficerBarkSec = -99;
    this.lowHullBarkSent = false;
    this.updateMusicCondition();
    this.emitHud();
  }

  private clearVfx(): void {
    for (const p of this.projectiles) this.scene.remove(p.mesh);
    for (const pt of this.particles) this.releaseParticleMesh(pt.mesh);
    for (const sp of this.smokePuffs) this.releaseSmokePuff(sp.mesh);
    for (const m of this.activeMines) {
      this.scene.remove(m.mesh);
      m.emberMat.dispose();
    }
    for (const fm of this.floatingMines) this.scene.remove(fm.built.group);
    for (const ws of this.wreckageSites) this.scene.remove(ws.built.group);
    if (this.merchantSite) {
      this.scene.remove(this.merchantSite.built.root);
      this.merchantSite = null;
    }
    if (this.escortConvoy) {
      this.scene.remove(this.escortConvoy.built.root);
      this.escortConvoy = null;
    }
    for (const b of this.fallingBoulders) {
      this.scene.remove(b.mesh);
      (b.mesh.material as THREE.Material).dispose();
      b.mesh.geometry.dispose();
    }
    if (this.waypointBeacon) {
      this.scene.remove(this.waypointBeacon.group);
      this.waypointBeacon = null;
    }
    this.courseWaypoint = null;
    this.treasureSpot = null;
    this.oilSlicks = [];
    this.lightningArcs = [];
    this.projectiles = [];
    this.mortarZones = [];
    this.activeMines = [];
    this.floatingMines = [];
    this.wreckageSites = [];
    this.fallingBoulders = [];
    this.particles = [];
    this.smokePuffs = [];
    this.floatingTexts = [];
    this.flashRings = [];
    this.wakeNodes = [];
    this.grappleVfx = null;
  }

  public setMuted(muted: boolean): void {
    this.audio.setMuted(muted);
  }

  public setSeaParam<K extends keyof SeaParams>(key: K, value: SeaParams[K]): void {
    this.seaParams[key] = value;
    this.updateMusicCondition();
    this.emitHud();
  }

  public setBloomStrength(strength: number): void {
    this.bloomStrength = strength;
    if (this.bloomPass) {
      this.bloomPass.strength = strength;
    }
  }

  public setTouchSteer(steer: number): void {
    this.touchSteer = Math.max(-1, Math.min(1, steer));
  }

  public changeSail(delta: -1 | 1): void {
    this.ship = { ...this.ship, sailLevel: stepSailLevel(this.ship.sailLevel, delta) };
    this.playerBuilt.setSailAmount(this.ship.sailLevel);
    this.audio.playUiClick();
    this.emitHud();
  }

  public setAmmo(ammo: AmmoType): void {
    this.ammo = ammo;
    this.audio.playUiClick();
    this.emitHud();
  }

  public triggerMine(): void {
    if (this.mode !== 'playing' || this.mineCooldown > 0.05) return;
    const sternX = this.ship.x - Math.sin(this.ship.heading) * 4.6;
    const sternZ = this.ship.z + Math.cos(this.ship.heading) * 4.6;
    const wy = sampleWaveHeight(
      sternX,
      sternZ,
      this.elapsed,
      this.seaParams.waveHeight,
      this.rogueWave,
    );

    const group = new THREE.Group();
    const keg = new THREE.Mesh(this.sharedMineKegGeo, this.sharedMineKegMat);
    group.add(keg);
    const band = new THREE.Mesh(this.sharedMineBandGeo, this.sharedMineBandMat);
    band.rotation.x = Math.PI / 2;
    group.add(band);
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xff6228 });
    const ember = new THREE.Mesh(this.sharedMineEmberGeo, emberMat);
    ember.position.y = 0.78;
    group.add(ember);

    group.position.set(sternX, wy + 0.15, sternZ);
    this.scene.add(group);
    this.activeMines.push({
      x: sternX,
      z: sternZ,
      armTimer: 0.55,
      life: 28,
      mesh: group,
      emberMat,
    });
    this.mineCooldown = MINE_COOLDOWN_SEC;
    this.audio.playMineDrop();
    this.spawnRing(sternX, wy + 0.25, sternZ, '#FF8A42', 4.2, 0.36);
    this.setCallout(this.et().calloutMineDropped, 2.4);
    this.emitHud();
  }

  private getRadarGeometry(w: number, h: number) {
    const isShort = h < 520;
    const isNarrow = w < 768;
    const radius = isShort ? 26 : isNarrow ? 32 : 46;
    const cx = isShort ? 36 : isNarrow ? 44 : 66;
    const cy = isShort
      ? Math.round(h * 0.46)
      : isNarrow
        ? Math.max(210, h - 370)
        : h - 72;
    const mapRange = 145;
    const scale = (radius - 5) / mapRange;
    return { cx, cy, radius, mapRange, scale };
  }

  private getNearbyInteractKind():
    | { kind: 'wreckage'; site: WreckageSite }
    | { kind: 'merchant'; site: MerchantSite }
    | null {
    for (const ws of this.wreckageSites) {
      if (ws.active && Math.hypot(ws.x - this.ship.x, ws.z - this.ship.z) <= 12.2) {
        return { kind: 'wreckage', site: ws };
      }
    }
    if (
      this.merchantSite &&
      this.merchantSite.active &&
      Math.hypot(this.merchantSite.x - this.ship.x, this.merchantSite.z - this.ship.z) <= 13.8
    ) {
      return { kind: 'merchant', site: this.merchantSite };
    }
    return null;
  }

  public triggerInteract(): void {
    if (this.mode !== 'playing' || this.activeEncounterModal !== null) return;
    const found = this.getNearbyInteractKind();
    if (!found) return;
    this.keys.clear();
    this.touchSteer = 0;
    this.draggingCamera = false;
    this.activeEncounterModal = found.kind;
    this.audio.playUiClick();
    this.emitHud();
  }

  public resolveActiveWreckageChoice(choice: WreckageChoice): void {
    const found =
      this.wreckageSites.find(
        (ws) => ws.active && Math.hypot(ws.x - this.ship.x, ws.z - this.ship.z) <= 22,
      ) ?? this.wreckageSites.find((ws) => ws.active);

    if (!found) {
      this.activeEncounterModal = null;
      this.emitHud();
      return;
    }

    found.active = false;
    this.scene.remove(found.built.group);

    const outcome = resolveWreckageChoice(choice, this.act, Math.random());
    const goldEarned = Math.round(outcome.doubloonsGain * this.playerStats.doubloonGainMult);
    this.runDoubloonsBonus += goldEarned;
    this.score += choice === 'risk' ? 240 : 120;
    const healAmt = Math.round(this.hullMaxHp * outcome.healRatio);
    this.hullHp = Math.min(this.hullMaxHp, this.hullHp + healAmt);
    this.morale = Math.max(15, Math.min(100, this.morale + outcome.moraleDelta));
    this.recomputePlayerStats();

    const wy = sampleWaveHeight(
      found.x,
      found.z,
      this.elapsed,
      this.seaParams.waveHeight,
      this.rogueWave,
    );
    this.spawnBurst(found.x, wy + 2.0, found.z, 0xffd257, 18);
    this.spawnRing(found.x, wy + 0.7, found.z, '#FFD257', 9.5, 0.52);
    this.emitWorldCoinFly(found.x, wy + 2.0, found.z, choice === 'risk' ? 8 : 5);
    this.spawnFloatingText(
      found.x,
      wy + 5.2,
      found.z,
      `+${goldEarned}g  +${healAmt} HP`,
      '#FFE082',
      1.26,
    );

    if (outcome.ambushSpawnCount > 0) {
      this.audio.playBossHorn();
      this.screenShake = Math.max(this.screenShake, 0.65);
      const aliveCount = this.enemies.filter((e) => e.alive).length;
      if (aliveCount < 7) {
        const spec = DIFFICULTY_SPECS[this.difficulty];
        const ang = Math.random() * Math.PI * 2;
        const ax = Math.max(-108, Math.min(108, found.x + Math.cos(ang) * 32));
        const az = Math.max(-108, Math.min(108, found.z + Math.sin(ang) * 32));
        this.targetShips += 1;
        this.enemies.push(
          this.createEnemyShip({
            id: 750 + this.propIdSeq++,
            archetype: 'brig',
            scale: 1.0,
            x: ax,
            z: az,
            hp: Math.round(92 * spec.enemyHpMultiplier * ACT_SPECS[this.act].enemyHpMult),
            speed: 7.1,
            orbitRadius: 34,
            orbitAngle: ang,
            fireTimer: 2.0,
          }),
        );
      }
      this.setCallout(this.et().wreckageTrapCallout, 3.6);
    } else {
      this.audio.playBoarding();
      this.setCallout(this.et().wreckageSafeCallout, 3.2);
    }

    for (let m = 0; m < outcome.armExtraMines; m += 1) {
      const a = Math.random() * Math.PI * 2;
      const dist = 10 + m * 5;
      this.spawnFloatingMineHazard(
        Math.max(-114, Math.min(114, found.x + Math.cos(a) * dist)),
        Math.max(-114, Math.min(114, found.z + Math.sin(a) * dist)),
      );
    }

    this.activeEncounterModal = null;
    this.emitHud();
  }

  public buyMerchantOffer(
    offerId: MerchantOfferId,
    walletGold: number,
  ): { purchased: boolean; walletSpent: number; runSpent: number } {
    const spendable = Math.max(0, walletGold) + Math.max(0, this.runDoubloonsBonus);
    const res = purchaseMerchantOffer({
      offerId,
      spendableDoubloons: spendable,
      buffs: this.merchantBuffs,
      hullHp: this.hullHp,
      hullMaxHp: this.hullMaxHp,
      morale: this.morale,
      fleetCharmBought: this.fleetCharmBought,
    });
    if (!res.purchased) {
      return { purchased: false, walletSpent: 0, runSpent: 0 };
    }
    const runSpent = Math.min(this.runDoubloonsBonus, res.cost);
    const walletSpent = res.cost - runSpent;
    this.runDoubloonsBonus -= runSpent;
    this.merchantBuffs = res.nextBuffs;
    this.hullHp = res.nextHullHp;
    this.morale = res.nextMorale;
    this.fleetCharmBought = res.fleetCharmBought;
    this.recomputePlayerStats();
    this.audio.playPickup();
    this.spawnBurst(this.ship.x, this.ship.heave + 2.2, this.ship.z, 0x54f2a8, 12);
    this.spawnRing(this.ship.x, this.ship.heave + 0.6, this.ship.z, '#54F2A8', 6.5, 0.45);
    this.emitHud();
    return { purchased: true, walletSpent, runSpent };
  }

  public closeEncounterModal(): void {
    if (this.activeEncounterModal === 'merchant') {
      this.setCallout(this.et().merchantDockedCallout, 2.6);
    }
    this.activeEncounterModal = null;
    this.emitHud();
  }

  public clearWaypoint(): void {
    this.courseWaypoint = null;
    if (this.waypointBeacon) {
      this.scene.remove(this.waypointBeacon.group);
      this.waypointBeacon = null;
    }
    this.setCallout(this.et().waypointClearedCallout, 2.0);
    this.emitHud();
  }

  private spawnWreckageSite(x: number, z: number): void {
    const built = buildWreckageCluster();
    const wy = sampleWaveHeight(x, z, this.elapsed, this.seaParams.waveHeight, this.rogueWave);
    built.group.position.set(x, wy, z);
    this.scene.add(built.group);
    this.wreckageSites.push({
      id: this.propIdSeq++,
      x,
      z,
      built,
      active: true,
    });
    // Flank drifting wreckage with 2 visible crimson sea-mine buoys
    this.spawnFloatingMineHazard(
      Math.max(-114, Math.min(114, x - 9.5)),
      Math.max(-114, Math.min(114, z + 5.5)),
    );
    this.spawnFloatingMineHazard(
      Math.max(-114, Math.min(114, x + 9.5)),
      Math.max(-114, Math.min(114, z - 5.5)),
    );
  }

  private spawnFloatingMineHazard(x: number, z: number): void {
    const built = buildFloatingMineBuoy();
    const wy = sampleWaveHeight(x, z, this.elapsed, this.seaParams.waveHeight, this.rogueWave);
    built.group.position.set(x, wy, z);
    this.scene.add(built.group);
    this.floatingMines.push({
      id: this.propIdSeq++,
      x,
      z,
      built,
      alive: true,
      life: 55,
    });
  }

  private spawnMerchantSite(): void {
    if (this.merchantSite) {
      this.scene.remove(this.merchantSite.built.root);
      this.merchantSite = null;
    }
    const angle = this.ship.heading + (Math.random() > 0.5 ? 0.6 : -0.6);
    const mx = Math.max(-100, Math.min(100, this.ship.x + Math.sin(angle) * 44));
    const mz = Math.max(-100, Math.min(100, this.ship.z - Math.cos(angle) * 44));
    const built = buildMerchantSkiff();
    const my = sampleWaveHeight(mx, mz, this.elapsed, this.seaParams.waveHeight, this.rogueWave);
    built.root.position.set(mx, my, mz);
    this.scene.add(built.root);
    this.merchantSite = {
      id: this.propIdSeq++,
      x: mx,
      z: mz,
      heading: normalizeAngle(angle + Math.PI * 0.5),
      speed: 2.7,
      built,
      active: true,
      life: 56,
    };
    this.audio.playPickup();
    this.setCallout(this.et().merchantEventTitle, 3.6);
  }

  private triggerCliffRockfall(ix: number, iz: number, obsX: number, obsZ: number): void {
    const outX = ix - obsX;
    const outZ = iz - obsZ;
    const len = Math.max(0.01, Math.hypot(outX, outZ));
    const nx = outX / len;
    const nz = outZ / len;

    this.audio.playCollision(true);
    this.screenShake = Math.max(this.screenShake, 0.72);
    this.setCallout(this.et().calloutRockfall, 3.0);
    this.spawnBurst(ix, 11, iz, 0x8ea2c8, 12);

    for (let i = 0; i < 4; i += 1) {
      const mesh = buildFallingBoulderMesh();
      const spreadX = (Math.random() - 0.5) * 6.5;
      const spreadZ = (Math.random() - 0.5) * 6.5;
      const bx = ix + spreadX;
      const by = 13 + Math.random() * 5;
      const bz = iz + spreadZ;
      mesh.position.set(bx, by, bz);
      this.scene.add(mesh);
      this.fallingBoulders.push({
        mesh,
        x: bx,
        y: by,
        z: bz,
        vx: nx * (6 + Math.random() * 5) + (Math.random() - 0.5) * 3.5,
        vy: 1.5 + Math.random() * 2.5,
        vz: nz * (6 + Math.random() * 5) + (Math.random() - 0.5) * 3.5,
        life: 3.5,
        splashed: false,
      });
    }
  }

  private getSharedBurstMat(color: number): THREE.MeshBasicMaterial {
    let mat = this.sharedBurstMats.get(color);
    if (!mat) {
      mat = new THREE.MeshBasicMaterial({ color });
      this.sharedBurstMats.set(color, mat);
    }
    return mat;
  }

  private getSharedBallMat(color: number): THREE.MeshBasicMaterial {
    let mat = this.sharedBallMats.get(color);
    if (!mat) {
      mat = new THREE.MeshBasicMaterial({ color });
      this.sharedBallMats.set(color, mat);
    }
    return mat;
  }

  public triggerSurge(): void {
    if (this.mode !== 'playing') return;
    const { ship, triggered } = triggerWaveSurge(this.ship, this.playerStats.surgeCooldown);
    if (!triggered) return;
    this.ship = ship;
    this.audio.playSurge();
    this.screenShake = Math.max(this.screenShake, 0.25);
    this.setCallout(this.t().calloutWaveSurge, 2.0);
    this.spawnFloatingText(
      this.ship.x,
      this.ship.heave + 4.4,
      this.ship.z,
      this.t().combatSurge,
      '#7BE0FF',
      1.15,
    );
    this.spawnRing(this.ship.x, this.ship.heave + 0.4, this.ship.z, '#7BE0FF', 5.2, 0.42);
    this.spawnBurst(this.ship.x, this.ship.heave + 0.8, this.ship.z, 0x8be4ff, 12);
    this.emitHud();
  }

  public triggerHarpoon(): void {
    if (this.mode !== 'playing') return;

    // Second press while latched performs winch reel-in snap (ship or sunken reef chest)!
    if (this.abilities.harpoonActiveTimer > 0 && this.abilities.harpoonTargetId !== null) {
      if (this.abilities.harpoonTargetId === HARPOON_CHEST_TARGET_ID) {
        if (this.reefChestProp && !this.reefChestProp.completed && !this.triggeredSecrets.has('reefChest')) {
          this.reefChestProp.completed = true;
          this.reefChestProp.built.group.visible = false;
          this.triggeredSecrets.add('reefChest');

          const spec = SECRET_QUEST_SPECS.reefChest;
          this.score += spec.rewardScore;
          this.runDoubloonsBonus += 45;
          this.abilities = {
            ...this.abilities,
            harpoonActiveTimer: 0,
            harpoonTargetId: null,
            stormRage: STORM_WAKE_MAX_RAGE,
          };

          const cy = sampleWaveHeight(
            this.reefChestProp.x,
            this.reefChestProp.z,
            this.elapsed,
            this.seaParams.waveHeight,
          );
          this.audio.playHarpoon(true);
          this.audio.playBoarding();
          this.screenShake = Math.max(this.screenShake, 0.72);
          this.spawnBurst(this.reefChestProp.x, cy + 2.0, this.reefChestProp.z, 0x3ef09c, 22);
          this.spawnBurst(this.ship.x, this.ship.heave + 2.0, this.ship.z, 0xffe082, 16);
          this.spawnRing(this.reefChestProp.x, cy + 0.7, this.reefChestProp.z, '#3EF09C', 11.5, 0.58);
          this.spawnFloatingText(
            this.ship.x,
            this.ship.heave + 5.4,
            this.ship.z,
            this.t().secret7Title,
            '#3EF09C',
            1.3,
          );
          this.setCallout(this.t().secret7Reward, 3.8);
          this.emitWorldCoinFly(this.reefChestProp.x, cy + 2.0, this.reefChestProp.z, 6);
          this.onSecretComplete?.('reefChest');
          this.emitHud();
          return;
        }
        this.abilities = { ...this.abilities, harpoonActiveTimer: 0, harpoonTargetId: null };
      }

      const target = this.enemies.find((e) => e.id === this.abilities.harpoonTargetId && e.alive);
      if (target) {
        const reel = computeHarpoonReelPull(this.ship.x, this.ship.z, target.x, target.z);
        this.ship = { ...this.ship, x: reel.playerX, z: reel.playerZ, squashY: 0.86, squashVel: 1.9 };
        const isMythic = target.archetype === 'kraken' || target.archetype === 'wraith';
        const reelDmg = Math.round(
          HARPOON_REEL_DAMAGE * (isMythic ? this.playerStats.harpoonMonsterMult : 1),
        );
        const wy = sampleWaveHeight(target.x, target.z, this.elapsed, this.seaParams.waveHeight);
        if (!target.shieldBroken) {
          this.breakEnemyArmor(target, wy);
        }
        target.x = reel.enemyX;
        target.z = reel.enemyZ;
        target.hp -= reelDmg;
        target.hitFlash = 1;
        target.sailDebuffTimer = Math.max(target.sailDebuffTimer, 2.2);
        target.squashY = 0.8;
        target.squashVel = 2.4;

        this.audio.playHarpoon(true);
        this.screenShake = Math.max(this.screenShake, 0.65);
        this.spawnBurst(reel.midX, wy + 1.8, reel.midZ, 0xffd27d, 16);
        this.spawnRing(target.x, wy + 0.7, target.z, '#FFB84D', 6.8, 0.45);
        this.spawnFloatingText(
          target.x,
          wy + 4.8,
          target.z,
          `${this.t().combatHarpoon} -${reelDmg}`,
          '#FFE082',
          1.2,
        );
        this.abilities = gainStormRage(
          { ...this.abilities, harpoonActiveTimer: 0, harpoonTargetId: null },
          Math.round(14 * this.playerStats.rageGainMult),
        );
        this.setCallout(this.t().calloutHarpoonReel, 2.6);
        if (target.hp <= 0) {
          this.handleEnemyDefeated(target, wy, false);
        }
        this.emitHud();
        return;
      }
      this.abilities = { ...this.abilities, harpoonActiveTimer: 0, harpoonTargetId: null };
    }

    if (this.abilities.harpoonCooldown > 0.05) return;

    const chestCheck = canHarpoonReefChest(
      this.ship.x,
      this.ship.z,
      this.ship.heading,
      this.reefChestProp,
      Boolean(this.reefChestProp?.completed || this.triggeredSecrets.has('reefChest')),
    );
    const candidate = findHarpoonTarget(this.ship.x, this.ship.z, this.ship.heading, this.enemies);
    const candidateDist = candidate
      ? Math.hypot(candidate.x - this.ship.x, candidate.z - this.ship.z)
      : Infinity;

    if (chestCheck.canLatch && this.reefChestProp && (!candidate || chestCheck.dist <= candidateDist + 8)) {
      this.abilities = {
        ...this.abilities,
        harpoonTargetId: HARPOON_CHEST_TARGET_ID,
        harpoonActiveTimer: HARPOON_DURATION_SEC,
        harpoonCooldown: 7.5,
      };
      this.reefChestProp.built.setHighlight?.(true);
      const cy = sampleWaveHeight(
        this.reefChestProp.x,
        this.reefChestProp.z,
        this.elapsed,
        this.seaParams.waveHeight,
      );
      this.audio.playHarpoon(false);
      this.screenShake = Math.max(this.screenShake, 0.34);
      this.spawnBurst(this.reefChestProp.x, cy + 1.8, this.reefChestProp.z, 0x3ef09c, 16);
      this.spawnRing(this.reefChestProp.x, cy + 0.7, this.reefChestProp.z, '#FFE082', 6.2, 0.46);
      this.spawnFloatingText(this.reefChestProp.x, cy + 4.8, this.reefChestProp.z, this.t().combatHarpoon, '#3EF09C', 1.2);
      this.setCallout(this.t().calloutReefChestLatch, 3.2);
      this.emitHud();
      return;
    }

    if (!candidate) {
      this.setCallout(this.t().calloutHarpoonNoTarget, 1.8);
      return;
    }

    const target = this.enemies.find((e) => e.id === candidate.id && e.alive);
    if (!target) return;

    this.abilities = {
      ...this.abilities,
      harpoonTargetId: target.id,
      harpoonActiveTimer: HARPOON_DURATION_SEC,
      harpoonCooldown: 7.5,
    };
    target.hitFlash = 0.9;
    target.sailDebuffTimer = Math.max(target.sailDebuffTimer, HARPOON_DURATION_SEC);

    const wy = sampleWaveHeight(target.x, target.z, this.elapsed, this.seaParams.waveHeight);
    if (!target.shieldBroken) {
      this.breakEnemyArmor(target, wy);
    }
    this.audio.playHarpoon(false);
    this.screenShake = Math.max(this.screenShake, 0.36);
    this.spawnBurst(target.x, wy + 1.8, target.z, 0xffb84d, 14);
    this.spawnRing(target.x, wy + 0.7, target.z, '#FFB84D', 5.8, 0.42);
    this.spawnFloatingText(target.x, wy + 5.0, target.z, this.t().combatHarpoon, '#FFD27D', 1.18);
    this.setCallout(this.t().calloutHarpoonLatch, 3.0);
    this.emitHud();
  }

  private breakEnemyArmor(enemy: EnemyShip, waterY: number): void {
    if (enemy.shieldBroken) return;
    enemy.shieldBroken = true;
    enemy.built.setSpecialShieldBroken?.(true);
    enemy.kraken?.setArmorBroken(true);
    this.spawnRing(enemy.x, waterY + 0.9, enemy.z, '#FFE082', 10.5, 0.55);
    this.spawnBurst(enemy.x, waterY + 2.5, enemy.z, 0xffe082, 16);
    if (enemy.archetype === 'kraken') {
      this.setCallout(this.et().krakenArmorBroken, 3.2);
    } else if (enemy.archetype === 'wraith') {
      this.setCallout(this.et().wraithVeilBroken, 3.2);
    }
  }

  public triggerSmoke(): void {
    if (this.mode !== 'playing') return;
    const { state, triggered } = activateSmokeAbility(this.abilities);
    if (!triggered) return;
    const relicMods = computeRelicModifiers(this.activeRelics);
    this.abilities = {
      ...state,
      smokeCooldown: Number((state.smokeCooldown * relicMods.cooldownMult).toFixed(2)),
    };
    this.smokeSpawnTimer = 0;

    this.audio.playSmoke();
    this.screenShake = Math.max(this.screenShake, 0.22);
    for (let i = 0; i < 8; i += 1) {
      this.spawnSmokePuff(true);
    }
    this.spawnRing(this.ship.x, this.ship.heave + 0.5, this.ship.z, '#5CE8D8', 8.5, 0.55);
    this.spawnFloatingText(
      this.ship.x,
      this.ship.heave + 4.8,
      this.ship.z,
      this.t().combatSmoke,
      '#6CE8D6',
      1.2,
    );
    this.setCallout(this.t().calloutSmoke, 3.2);
    this.emitHud();
  }

  public triggerStormWake(): void {
    if (this.mode !== 'playing') return;
    const { state, triggered } = activateStormWakeAbility(this.abilities);
    if (!triggered) return;
    this.abilities = state;

    this.audio.playStormWake();
    this.lightningAlpha = Math.max(this.lightningAlpha, 0.72);
    this.screenShake = Math.max(this.screenShake, 0.78);
    this.ship = {
      ...this.ship,
      speed: Math.min(26, this.ship.speed + 5.5),
      squashY: 1.2,
      squashVel: -1.2,
    };
    this.spawnBurst(this.ship.x, this.ship.heave + 1.5, this.ship.z, 0x7be0ff, 22);
    this.spawnRing(this.ship.x, this.ship.heave + 0.6, this.ship.z, '#7BE0FF', 13, 0.62);
    this.spawnRing(this.ship.x, this.ship.heave + 0.8, this.ship.z, '#FFE082', 9.5, 0.52);
    for (const enemy of this.enemies) {
      if (!enemy.alive || enemy.shieldBroken) continue;
      if (Math.hypot(enemy.x - this.ship.x, enemy.z - this.ship.z) <= 32) {
        const ey = sampleWaveHeight(enemy.x, enemy.z, this.elapsed, this.seaParams.waveHeight);
        this.breakEnemyArmor(enemy, ey);
      }
    }
    this.spawnFloatingText(
      this.ship.x,
      this.ship.heave + 5.4,
      this.ship.z,
      this.t().combatStormWake,
      '#FFE082',
      1.32,
    );
    this.setCallout(this.t().calloutStormWake, 3.6);
    this.emitHud();
  }

  private spawnSmokePuff(initialBurst = false): void {
    const sternX = this.ship.x - Math.sin(this.ship.heading) * (initialBurst ? 2.8 : 4.2);
    const sternZ = this.ship.z + Math.cos(this.ship.heading) * (initialBurst ? 2.8 : 4.2);
    const wy = sampleWaveHeight(sternX, sternZ, this.elapsed, this.seaParams.waveHeight);
    const spread = initialBurst ? 4.4 : 2.6;
    const px = sternX + (Math.random() - 0.5) * spread;
    const pz = sternZ + (Math.random() - 0.5) * spread;
    const isTeal = Math.random() < 0.35;
    const baseScale = initialBurst ? 1.55 + Math.random() * 0.7 : 1.25 + Math.random() * 0.6;
    const { mesh } = this.acquireSmokePuff(isTeal ? 0x2a6d78 : 0x1e2b4d);
    mesh.position.set(px, wy + 1.1 + Math.random() * 0.7, pz);
    mesh.scale.setScalar(baseScale);
    this.smokePuffs.push({
      mesh,
      vx: Math.sin(this.seaParams.windAngle) * 1.4 + (Math.random() - 0.5) * 1.6,
      vy: 0.55 + Math.random() * 0.45,
      vz: -Math.cos(this.seaParams.windAngle) * 1.4 + (Math.random() - 0.5) * 1.6,
      life: initialBurst ? 2.4 : 2.1,
      maxLife: initialBurst ? 2.4 : 2.1,
      baseScale,
    });
  }

  private findBoardableEnemy(): EnemyShip | null {
    let best: EnemyShip | null = null;
    let bestDist = Infinity;
    for (const e of this.enemies) {
      if (!e.alive || e.archetype === 'seafort' || e.archetype === 'kraken') continue;
      const maxDist = e.isBoss ? 17.0 : 14.5;
      if (canBoardEnemy(this.ship.x, this.ship.z, e.x, e.z, e.hp, e.maxHp, e.sailDebuffTimer, maxDist)) {
        const d = Math.hypot(e.x - this.ship.x, e.z - this.ship.z);
        if (d < bestDist) {
          bestDist = d;
          best = e;
        }
      }
    }
    return best;
  }

  public triggerBoarding(): void {
    if (this.mode !== 'playing' || this.activeEncounterModal !== null) return;
    const target = this.findBoardableEnemy();
    if (!target) return;

    this.audio.playBoarding();
    this.screenShake = Math.max(this.screenShake, 0.7);
    this.hitstopTimer = Math.max(this.hitstopTimer, 0.048);
    this.grappleVfx = {
      ax: this.ship.x,
      az: this.ship.z,
      bx: target.x,
      bz: target.z,
      life: 0.65,
    };
    this.keys.clear();
    this.touchSteer = 0;
    this.draggingCamera = false;
    this.pendingBoardingTargetId = target.id;
    this.activeEncounterModal = 'boarding';
    this.emitHud();
  }

  public resolveBoardingChoice(choice: BoardingSpoilChoice): void {
    this.activeEncounterModal = null;
    const targetId = this.pendingBoardingTargetId;
    this.pendingBoardingTargetId = null;

    const baseGold = Math.round(25 * this.playerStats.doubloonGainMult);
    const res = resolveBoardingSpoils(choice, this.hullHp, this.hullMaxHp, this.abilities.stormRage, baseGold);
    this.hullHp = res.nextHullHp;
    this.runDoubloonsBonus += res.doubloonsGain;
    this.abilities = { ...this.abilities, stormRage: res.nextStormRage };
    if (res.resetCooldowns) {
      this.portCooldown = 0;
      this.stbdCooldown = 0;
      this.abilities = { ...this.abilities, harpoonCooldown: 0, smokeCooldown: 0 };
      this.ship = { ...this.ship, surgeCooldown: 0 };
    } else {
      this.portCooldown *= 0.5;
      this.stbdCooldown *= 0.5;
    }

    this.score += 150;
    this.boardedCount += 1;
    this.morale = Math.min(100, this.morale + 12);
    this.recomputePlayerStats();

    const target = targetId !== null ? this.enemies.find((e) => e.id === targetId && e.alive) : undefined;
    if (target) {
      const waterY = sampleWaveHeight(target.x, target.z, this.elapsed, this.seaParams.waveHeight);
      this.spawnFloatingText(
        this.ship.x,
        this.ship.heave + 5.2,
        this.ship.z,
        `${this.t().combatBoarded} (+${res.doubloonsGain}g)`,
        '#FFE082',
        1.28,
      );
      this.spawnBurst(target.x, waterY + 2.2, target.z, 0xffc857, 16);
      this.spawnRing(target.x, waterY + 0.7, target.z, '#FFD257', 7.5, 0.5);
      this.setCallout(this.t().calloutBoardSuccess, 3.2);
      this.handleEnemyDefeated(target, waterY, true);
    }
    this.emitHud();
  }

  public fireBroadside(side: 'port' | 'starboard' | 'both'): void {
    if (this.mode !== 'playing') return;
    this.audio.unlock();

    const wantPort = side === 'port' || side === 'both';
    const wantStbd = side === 'starboard' || side === 'both';

    const canPort = wantPort && this.portCooldown <= 0;
    const canStbd = wantStbd && this.stbdCooldown <= 0;

    if (!canPort && !canStbd) {
      this.setCallout(this.t().calloutReloading, 1.3);
      return;
    }

    const stormWakeActive = this.abilities.stormWakeTimer > 0;
    const crestScore = stormWakeActive
      ? 1.0
      : computeWaveCrestScore(
          this.ship.x,
          this.ship.z,
          this.elapsed,
          this.seaParams.waveHeight,
        );
    const effectiveCrestThreshold = Math.max(
      0.32,
      this.seaParams.crestThreshold + this.playerStats.crestThresholdOffset,
    );
    const relicMods = computeRelicModifiers(this.activeRelics);
    const mutMods = computeEndlessMutatorModifiers(this.activeMutators);
    const { pointOfSail } = computeWindEfficiency(
      this.ship.heading,
      this.seaParams.windAngle,
      this.playerStats.headwindBoost + relicMods.headwindSpeedBonus,
    );
    const headwindDmgMult =
      (pointOfSail === 'irons' || pointOfSail === 'close') && relicMods.headwindDmgBonus > 0
        ? 1 + relicMods.headwindDmgBonus
        : 1;
    const spec = computeBroadsideShot(
      this.ammo,
      crestScore,
      effectiveCrestThreshold,
      this.playerStats.damageMult * headwindDmgMult,
      this.playerStats.extraProjectiles,
    );

    if (canPort) {
      this.spawnBroadsideVolley('port', spec);
      this.portCooldown = this.playerStats.reloadTime;
    }
    if (canStbd) {
      this.spawnBroadsideVolley('starboard', spec);
      this.stbdCooldown = this.playerStats.reloadTime;
    }

    if (spec.crestBoosted && !stormWakeActive) {
      const rageMult =
        computeContractModifiers(this.activeContracts).rageGainMult *
        relicMods.rageGainMult *
        mutMods.rageGainMult;
      this.abilities = gainStormRage(this.abilities, Math.round(16 * rageMult));
    }

    // Recoil roll, hull squash & camera shake
    const recoilRoll = canPort && !canStbd ? -0.15 : !canPort && canStbd ? 0.15 : 0;
    this.ship = {
      ...this.ship,
      roll: Math.max(-0.42, Math.min(0.42, this.ship.roll + recoilRoll)),
      squashY: Math.max(0.82, this.ship.squashY - 0.11),
      squashVel: 1.75,
    };
    this.screenShake = Math.max(this.screenShake, spec.crestBoosted ? 0.65 : 0.38);
    this.audio.playCannon(spec.crestBoosted);

    if (spec.crestBoosted) {
      this.setCallout(this.t().calloutCrestBonus, 2.5);
      this.spawnFloatingText(
        this.ship.x,
        this.ship.heave + 5.2,
        this.ship.z,
        this.t().combatCrest,
        '#FFB84D',
        1.25,
      );
    } else {
      this.setCallout(
        canPort && !canStbd ? this.t().calloutPortFired : this.t().calloutStbdFired,
        1.8,
      );
    }

    this.broadsideFiredThisTick = true;
    this.emitHud();
  }

  private spawnBroadsideVolley(
    side: 'port' | 'starboard',
    spec: ReturnType<typeof computeBroadsideShot>,
  ): void {
    const muzzles =
      side === 'port' ? this.playerBuilt.cannonMuzzlesPort : this.playerBuilt.cannonMuzzlesStbd;
    const baseDirX = side === 'port' ? -1 : 1;
    const hexRing = spec.crestBoosted ? '#FFB84D' : '#FF8442';

    for (let i = 0; i < spec.projectiles; i += 1) {
      this.shotsFired += 1;
      const muzzleLocal = this.tmpMuzzle.copy(muzzles[i % muzzles.length]);
      muzzleLocal.applyAxisAngle(this.tmpUp, -this.ship.heading);
      const wx = this.ship.x + muzzleLocal.x;
      const wy = this.ship.heave + muzzleLocal.y;
      const wz = this.ship.z + muzzleLocal.z;

      const spread = (Math.random() - 0.5) * spec.spreadRad;
      const dir = this.tmpDir
        .set(baseDirX, 0.14, 0)
        .applyAxisAngle(this.tmpUp, -this.ship.heading + spread)
        .normalize();

      const ballColor =
        spec.ammo === 'incendiary'
          ? 0xff5e28
          : spec.ammo === 'mortar'
            ? 0xff9a3c
            : spec.ammo === 'harpoonBolt'
              ? 0x5ce8d8
              : spec.ammo === 'cursed'
                ? 0xc77dff
                : spec.crestBoosted
                  ? 0xffb84d
                  : spec.ammo === 'chain'
                    ? 0x7bd4ff
                    : 0xff7638;
      const mesh = new THREE.Mesh(
        spec.crestBoosted || spec.ammo === 'mortar' ? this.sharedBallCrestGeo : this.sharedBallGeo,
        this.getSharedBallMat(ballColor),
      );
      mesh.position.set(wx, wy, wz);
      this.scene.add(mesh);

      const isMortar = spec.ammo === 'mortar';
      const isBolt = spec.ammo === 'harpoonBolt';
      this.projectiles.push({
        mesh,
        x: wx,
        y: wy,
        z: wz,
        vx: dir.x * spec.speed,
        vy: isMortar ? 14.5 + dir.y * spec.speed : isBolt ? 1.4 : dir.y * spec.speed + 2.2,
        vz: dir.z * spec.speed,
        gravity: isMortar ? 10.5 : isBolt ? 3.2 : 8.4,
        damage: spec.damagePerHit,
        crestBoosted: spec.crestBoosted,
        fromEnemy: false,
        ammo: spec.ammo,
        life: isMortar ? 3.4 : isBolt ? 2.6 : 3.1,
        trail: [{ x: wx, y: wy, z: wz }],
      });

      this.spawnBurst(wx, wy, wz, 0xffd084, 3);
      // Billowing grey cannon smoke cloud drifting from the gunport
      this.spawnCannonSmokePuff(wx, wy, wz, dir.x, dir.z, spec.crestBoosted);
      if (i === 0) {
        this.spawnRing(wx, wy, wz, hexRing, spec.crestBoosted ? 3.2 : 2.1, 0.25);
      }
    }
    if (spec.ammo === 'incendiary' || spec.ammo === 'mortar') {
      this.audio.playFireShot();
    }
  }

  private spawnEnemyShot(enemy: EnemyShip): void {
    if (enemy.archetype === 'fireship') return;
    if (enemy.archetype === 'mortar') {
      this.spawnMortarStrike(enemy);
      return;
    }

    const spec = DIFFICULTY_SPECS[this.difficulty];
    const toPlayerX = this.ship.x - enemy.x;
    const toPlayerZ = this.ship.z - enemy.z;
    const dist = Math.hypot(toPlayerX, toPlayerZ);
    if (dist > (enemy.isBoss || enemy.archetype === 'seafort' ? 122 : 95)) return;

    const dirX = toPlayerX / Math.max(0.01, dist);
    const dirZ = toPlayerZ / Math.max(0.01, dist);
    const startY =
      sampleWaveHeight(enemy.x, enemy.z, this.elapsed, this.seaParams.waveHeight) +
      (enemy.archetype === 'seafort' ? 4.4 : enemy.isBoss ? 2.1 : 1.4);

    const smokeScatter = this.abilities.smokeTimer > 0 ? 0.58 : 0;
    const volleyCount = enemy.isBoss || enemy.archetype === 'seafort' ? 2 : 1;
    for (let v = 0; v < volleyCount; v += 1) {
      const spreadAngle =
        (volleyCount === 2 ? (v === 0 ? -0.09 : 0.09) : 0) +
        (smokeScatter > 0 ? (Math.random() - 0.5) * smokeScatter : 0);
      const vxDir = dirX * Math.cos(spreadAngle) - dirZ * Math.sin(spreadAngle);
      const vzDir = dirX * Math.sin(spreadAngle) + dirZ * Math.cos(spreadAngle);

      const ballColor = enemy.archetype === 'kraken' ? 0x62f2ff : enemy.isBoss ? 0xff7636 : 0xff4936;
      const mesh = new THREE.Mesh(
        enemy.isBoss || enemy.archetype === 'seafort' ? this.sharedBallCrestGeo : this.sharedBallGeo,
        this.getSharedBallMat(ballColor),
      );
      mesh.position.set(enemy.x, startY, enemy.z);
      this.scene.add(mesh);

      const enemyDmgMult = computeContractModifiers(this.activeContracts).enemyDmgMult;
      const speed = enemy.isBoss || enemy.archetype === 'seafort' ? 34 : 31;
      this.projectiles.push({
        mesh,
        x: enemy.x,
        y: startY,
        z: enemy.z,
        vx: vxDir * speed + (Math.random() - 0.5) * 2.8,
        vy: 2.6,
        vz: vzDir * speed + (Math.random() - 0.5) * 2.8,
        damage: Math.round((enemy.isBoss || enemy.archetype === 'seafort' ? 16 : 12) * spec.enemyDamageMultiplier * enemyDmgMult),
        crestBoosted: false,
        fromEnemy: true,
        ammo: 'round',
        life: 3.4,
        trail: [{ x: enemy.x, y: startY, z: enemy.z }],
      });
    }
    this.spawnRing(enemy.x, startY, enemy.z, '#FF4936', enemy.isBoss ? 3.4 : 2.4, 0.25);
  }

  private spawnMortarStrike(enemy: EnemyShip): void {
    const spec = DIFFICULTY_SPECS[this.difficulty];
    const enemyDmgMult = computeContractModifiers(this.activeContracts).enemyDmgMult;
    const dist = Math.hypot(this.ship.x - enemy.x, this.ship.z - enemy.z);
    if (dist > 118) return;

    const leadSec = 1.45;
    const smokeOffX = this.abilities.smokeTimer > 0 ? (Math.random() - 0.5) * 34 : 0;
    const smokeOffZ = this.abilities.smokeTimer > 0 ? (Math.random() - 0.5) * 34 : 0;
    const tx = Math.max(
      -124,
      Math.min(124, this.ship.x + Math.sin(this.ship.heading) * this.ship.speed * leadSec + smokeOffX),
    );
    const tz = Math.max(
      -124,
      Math.min(124, this.ship.z - Math.cos(this.ship.heading) * this.ship.speed * leadSec + smokeOffZ),
    );
    const startY = sampleWaveHeight(enemy.x, enemy.z, this.elapsed, this.seaParams.waveHeight) + 2.4;

    this.mortarZones.push({
      x: tx,
      z: tz,
      radius: 5.8,
      timer: 2.0,
      maxTimer: 2.0,
      damage: Math.round(20 * spec.enemyDamageMultiplier * enemyDmgMult),
    });

    const mesh = new THREE.Mesh(this.sharedBallCrestGeo, this.getSharedBallMat(0xc76bff));
    mesh.position.set(enemy.x, startY, enemy.z);
    this.scene.add(mesh);

    const flight = 2.0;
    const endY = sampleWaveHeight(tx, tz, this.elapsed, this.seaParams.waveHeight);
    const vx = (tx - enemy.x) / flight;
    const vz = (tz - enemy.z) / flight;
    const vy = (endY - startY + 0.5 * 8.4 * flight * flight) / flight;

    this.projectiles.push({
      mesh,
      x: enemy.x,
      y: startY,
      z: enemy.z,
      vx,
      vy,
      vz,
      damage: 0,
      crestBoosted: false,
      fromEnemy: true,
      ammo: 'round',
      life: flight + 0.05,
      trail: [{ x: enemy.x, y: startY, z: enemy.z }],
    });

    this.spawnRing(enemy.x, startY, enemy.z, '#C76BFF', 3.4, 0.35);
    this.spawnFloatingText(enemy.x, startY + 4.4, enemy.z, this.t().combatMortar, '#D98CFF', 1.05);
  }

  private detonatePlayerMortar(
    x: number,
    waterY: number,
    z: number,
    baseDamage: number,
    radius: number,
    directEnemyId: number,
  ): void {
    const relicMods = computeRelicModifiers(this.activeRelics);
    const effRadius = radius * relicMods.aoeRadiusMult;
    this.audio.playExplosion();
    this.screenShake = Math.max(this.screenShake, 0.68);
    this.spawnBurst(x, waterY + 1.5, z, 0xff8c38, 16);
    this.spawnRing(x, waterY + 0.55, z, '#FFB84D', effRadius * 1.15, 0.46);
    this.igniteOilSlicks(x, z, effRadius * 0.9);
    for (const enemy of this.enemies) {
      if (!enemy.alive || enemy.id === directEnemyId) continue;
      const d = Math.hypot(enemy.x - x, enemy.z - z);
      const splashDmg = computeExplosionFalloff(d, effRadius, Math.round(baseDamage * 0.85));
      if (splashDmg > 0) {
        this.shotsHit += 1;
        const ey = sampleWaveHeight(
          enemy.x,
          enemy.z,
          this.elapsed,
          this.seaParams.waveHeight,
          this.rogueWave,
        );
        const armored =
          (enemy.archetype === 'wraith' || enemy.archetype === 'kraken') && !enemy.shieldBroken;
        const actual = armored ? Math.max(2, Math.round(splashDmg * 0.35)) : splashDmg;
        enemy.hp -= actual;
        enemy.hitFlash = 0.9;
        enemy.burnTimer = Math.max(enemy.burnTimer, 2.2 + this.playerStats.burnDurationBonus * 0.4);
        enemy.burnDps = Math.max(enemy.burnDps, 5.0 * this.playerStats.burnDamageMult);
        this.spawnFloatingText(enemy.x, ey + 4.6, enemy.z, `-${actual}`, '#FFB84D', 1.06);
        if (enemy.hp <= 0) {
          this.handleEnemyDefeated(enemy, ey, false);
        }
      }
    }
  }

  private detonateFireship(enemy: EnemyShip): void {
    const wy = sampleWaveHeight(enemy.x, enemy.z, this.elapsed, this.seaParams.waveHeight);
    this.audio.playExplosion();
    this.screenShake = Math.max(this.screenShake, 1.0);
    this.spawnBurst(enemy.x, wy + 2, enemy.z, 0xff7b2e, 20);
    this.spawnRing(enemy.x, wy + 0.7, enemy.z, '#FF8B2E', 11.5, 0.52);
    this.spawnFloatingText(enemy.x, wy + 5.2, enemy.z, this.t().combatBoom, '#FF9E44', 1.28);

    for (const other of this.enemies) {
      if (!other.alive || other.id === enemy.id) continue;
      const d = Math.hypot(other.x - enemy.x, other.z - enemy.z);
      const dmg = computeExplosionFalloff(d, 16, 44);
      if (dmg > 0) {
        other.hp -= dmg;
        other.hitFlash = 1;
        this.spawnFloatingText(other.x, wy + 4.6, other.z, `-${dmg}`, '#FFB84D', 1.12);
        if (other.hp <= 0) {
          this.handleEnemyDefeated(other, wy, false);
        }
      }
    }

    if (this.mode === 'playing') {
      const dp = Math.hypot(this.ship.x - enemy.x, this.ship.z - enemy.z);
      const pdmg = computeExplosionFalloff(dp, 15, 28);
      if (pdmg > 0) {
        this.hullHp = Math.max(0, this.hullHp - pdmg);
        this.ship = { ...this.ship, squashY: 0.78, squashVel: 2.5 };
        this.spawnFloatingText(this.ship.x, this.ship.heave + 4.8, this.ship.z, `-${pdmg}`, '#FF5A4E', 1.2);
        this.setCallout(this.t().calloutFireship, 2.5);
        if (this.hullHp <= 0) {
          this.triggerPlayerDefeat();
        }
      }
    }
  }

  private spawnBurst(x: number, y: number, z: number, color: number, count: number): void {
    const mat = this.getSharedBurstMat(color);
    for (let i = 0; i < count; i += 1) {
      const mesh = this.acquireParticleMesh(this.sharedBurstGeo, mat);
      mesh.position.set(x, y, z);
      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 9,
        vy: Math.random() * 6 + 1.5,
        vz: (Math.random() - 0.5) * 9,
        life: 0.48 + Math.random() * 0.28,
        maxLife: 0.72,
      });
    }
  }

  private spawnSplinters(x: number, y: number, z: number, count: number): void {
    for (let i = 0; i < count; i += 1) {
      const mat = this.sharedSplinterMats[i % this.sharedSplinterMats.length];
      const mesh = this.acquireParticleMesh(this.sharedSplinterGeo, mat);
      mesh.position.set(x, y, z);
      mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 13,
        vy: 3.5 + Math.random() * 6.5,
        vz: (Math.random() - 0.5) * 13,
        life: 0.65 + Math.random() * 0.35,
        maxLife: 1.0,
        rotX: (Math.random() - 0.5) * 18,
        rotY: (Math.random() - 0.5) * 18,
        rotZ: (Math.random() - 0.5) * 18,
        gravity: 16,
      });
    }
  }

  private spawnCannonSmokePuff(
    x: number,
    y: number,
    z: number,
    dirX: number,
    dirZ: number,
    crestBoosted: boolean,
  ): void {
    const windVx = -Math.sin(this.seaParams.windAngle) * 2.4;
    const windVz = Math.cos(this.seaParams.windAngle) * 2.4;
    const puffCount = crestBoosted ? 5 : 4;
    for (let c = 0; c < puffCount; c += 1) {
      const shade = 0.56 + (c % 3) * 0.14;
      this.emitFoamParticle({
        x: x + dirX * (0.4 + c * 0.45) + (Math.random() - 0.5) * 0.9,
        y: y + (Math.random() - 0.5) * 0.45,
        z: z + dirZ * (0.4 + c * 0.45) + (Math.random() - 0.5) * 0.9,
        vx: dirX * (4.4 + Math.random() * 2.6) + windVx + (Math.random() - 0.5) * 1.5,
        vy: 0.75 + Math.random() * 1.15,
        vz: dirZ * (4.4 + Math.random() * 2.6) + windVz + (Math.random() - 0.5) * 1.5,
        life: 1.55 + Math.random() * 0.6,
        startSize: (crestBoosted ? 3.2 : 2.5) + Math.random() * 0.9,
        endSize: (crestBoosted ? 7.8 : 6.2) + Math.random() * 1.6,
        alpha: 0.68,
        r: shade + 0.02,
        g: shade + 0.03,
        b: shade + 0.08,
        gravity: -0.35,
      });
    }
  }

  private spawnFloatingText(
    x: number,
    y: number,
    z: number,
    text: string,
    color: string,
    scale = 1,
  ): void {
    this.floatingTexts.push({
      x,
      y,
      z,
      text,
      color,
      life: 1.15,
      maxLife: 1.15,
      scale,
    });
  }

  private spawnRing(
    x: number,
    y: number,
    z: number,
    color: string,
    maxRadius: number,
    maxLife: number,
  ): void {
    this.flashRings.push({ x, y, z, color, life: maxLife, maxLife, maxRadius });
  }

  private updateMusicCondition(): void {
    if (this.mode === 'title') {
      this.audio.setMusicCondition('title');
      return;
    }
    if (this.seaParams.waveHeight >= 1.55 || this.wave === 2) {
      this.audio.setMusicCondition('storm');
      return;
    }
    const nearEnemy = this.enemies.some(
      (e) => e.alive && Math.hypot(e.x - this.ship.x, e.z - this.ship.z) < 62,
    );
    this.audio.setMusicCondition(nearEnemy ? 'combat' : 'cruising');
  }

  private scheduleNextFrame(): void {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(this.frame);
  }

  private afterDraw(cb: () => void): void {
    if (this.disposed) return;
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (typeof gl.fenceSync !== 'function') {
      this.timeoutId = window.setTimeout(() => {
        this.timeoutId = null;
        if (!this.disposed) cb();
      }, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    this.activeGlSync = sync;
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        this.activeGlSync = null;
        return;
      }
      const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (state === gl.UNSIGNALED) {
        this.timeoutId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.activeGlSync = null;
        this.timeoutId = window.setTimeout(() => {
          this.timeoutId = null;
          if (!this.disposed) cb();
        }, 80);
      }
    };
    this.timeoutId = window.setTimeout(poll, 5);
  }

  private frame = (nowMs: number): void => {
    if (this.disposed) return;
    const dt = Math.min(0.05, Math.max(0.001, (nowMs - this.lastFrameMs) / 1000));
    this.lastFrameMs = nowMs;

    if (this.mode !== 'paused' && this.activeEncounterModal === null) {
      if (this.hitstopTimer > 0) {
        this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
        this.screenShake = Math.max(0, this.screenShake - dt * 1.4);
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 3.5);
          enemy.built.setHitFlash?.(enemy.hitFlash);
        }
        const shakeX = (Math.random() - 0.5) * this.screenShake * 1.1;
        const shakeY = (Math.random() - 0.5) * this.screenShake * 0.9;
        const camYaw = this.ship.heading + this.camYawOffset;
        const horizDist = Math.cos(this.camPitch) * this.camDistance;
        const camY = Math.sin(this.camPitch) * this.camDistance + 3.2;
        this.camera.position.set(
          this.ship.x - Math.sin(camYaw) * horizDist + shakeX,
          camY + this.ship.heave * 0.25 + shakeY,
          this.ship.z + Math.cos(camYaw) * horizDist,
        );
      } else {
        this.elapsed += dt;
        this.stepSimulation(dt);
      }
    }
    this.renderAll();

    if (this.isSoftwareGl) {
      this.afterDraw(() => this.scheduleNextFrame());
    } else {
      this.scheduleNextFrame();
    }
  };

  private stepSimulation(dt: number): void {
    // -1. Dynamic Resolution Scaling (non-software WebGL)
    if (!this.isSoftwareGl) {
      this.drsFrameAccum += dt;
      this.drsFrameCount += 1;
      this.drsTimer += dt;
      if (this.drsTimer >= 1.2 && this.drsFrameCount > 0) {
        const avgFps = this.drsFrameCount / Math.max(0.05, this.drsFrameAccum);
        let nextDrs = this.drsScale;
        if (avgFps < 46) nextDrs = Math.max(0.68, this.drsScale - 0.08);
        else if (avgFps > 57) nextDrs = Math.min(1.0, this.drsScale + 0.05);
        if (Math.abs(nextDrs - this.drsScale) >= 0.01) {
          this.drsScale = nextDrs;
          const preset = GRAPHICS_PRESETS[this.graphicsQuality] ?? GRAPHICS_PRESETS.high;
          const pr = Math.min(window.devicePixelRatio || 1, preset.pixelRatioCap) * this.drsScale;
          this.renderer.setPixelRatio(pr);
          if (this.foamMaterial?.uniforms?.uPixelRatio) {
            this.foamMaterial.uniforms.uPixelRatio.value = pr;
          }
        }
        this.drsTimer = 0;
        this.drsFrameAccum = 0;
        this.drsFrameCount = 0;
      }
    }

    // 0. Traveling Rogue Swell lifecycle
    if (this.mode === 'playing') {
      if (this.rogueWave.active) {
        this.rogueWave.x += this.rogueWave.dirX * 14 * dt;
        this.rogueWave.z += this.rogueWave.dirZ * 14 * dt;
        if (Math.hypot(this.rogueWave.x, this.rogueWave.z) > 158) {
          this.rogueWave.active = false;
          this.rogueWave.amplitude = 0;
          this.rogueWaveTimer = 24 + Math.random() * 10;
        }
      } else {
        this.rogueWaveTimer -= dt;
        if (this.rogueWaveTimer <= 0) {
          const angle = this.seaParams.windAngle + (Math.random() - 0.5) * 0.7;
          const dirX = -Math.sin(angle);
          const dirZ = Math.cos(angle);
          this.rogueWave = {
            active: true,
            x: -dirX * 126,
            z: -dirZ * 126,
            radius: 44,
            amplitude: this.weather === 'squall' ? 3.4 : 2.6,
            dirX,
            dirZ,
          };
          this.audio.playSurge();
          this.setCallout(this.et().calloutRogueWave, 3.6);
        }
      }
    }

    // 1. Update GPU-synced ocean mesh waves, shadow frustum & storm intensity
    this.seaMesh.position.set(this.ship.x, 0, this.ship.z);
    if (this.sunLight.castShadow) {
      this.sunLight.target.position.set(this.ship.x, 0, this.ship.z);
      this.sunLight.position.set(this.ship.x - 58, 46, this.ship.z - 92);
      this.sunLight.target.updateMatrixWorld();
    }
    if (this.sternLight) {
      const stormActive = this.abilities.stormWakeTimer > 0;
      const smokeActive = this.abilities.smokeTimer > 0;
      this.sternLight.color.setHex(
        stormActive ? 0x7be0ff : smokeActive ? 0x5ce8d8 : 0xffb454,
      );
      this.sternLight.intensity =
        (stormActive ? 5.8 : 4.4) + Math.sin(this.elapsed * 6.4) * 0.45;
    }
    const stormIntensityNow = this.getStormIntensity();
    this.oceanCtrl.update(
      this.elapsed,
      this.seaParams.waveHeight,
      this.seaParams.windAngle,
      stormIntensityNow,
      this.rogueWave,
      this.abilities.stormWakeTimer > 0 ? 1.0 : 0.28 + stormIntensityNow * 0.45,
      this.lightningAlpha,
    );
    this.audio.updateSeaAmbience(this.ship.speed / 12, stormIntensityNow);
    this.playerBuilt.setHullDamageRatio?.(this.hullHp / Math.max(1, this.hullMaxHp));

    // 2. Headlands + Parallax
    for (const h of this.headlands) {
      h.update(this.elapsed);
    }

    // 2a. Atmospheric God Rays + Instanced Twilight Motes
    const preset = GRAPHICS_PRESETS[this.graphicsQuality] ?? GRAPHICS_PRESETS.high;
    this.atmosphericVfx?.update(
      this.elapsed,
      this.ship.x,
      this.ship.z,
      preset.godRays,
      preset.motesCount,
      preset.debrisVisible,
    );

    // 3. Player ship physics
    let steer = this.touchSteer;
    if (this.mode === 'playing') {
      if (this.keys.has(this.bindings.steerPort) || this.keys.has('ArrowLeft')) steer -= 1;
      if (this.keys.has(this.bindings.steerStbd) || this.keys.has('ArrowRight')) steer += 1;
    } else {
      // Gentle scenic auto-helm on title screen
      steer = Math.sin(this.elapsed * 0.22) * 0.14;
    }

    const stormWakeActive = this.abilities.stormWakeTimer > 0;
    const smokeActive = this.abilities.smokeTimer > 0;
    const relicMods = computeRelicModifiers(this.activeRelics);
    const mutMods = computeEndlessMutatorModifiers(this.activeMutators);

    this.ship = stepShipState(
      this.ship,
      { steer, dt },
      this.seaParams,
      this.elapsed,
      {
        speedMult: this.playerStats.speedMult * (stormWakeActive ? 1.45 : 1),
        turnMult: this.playerStats.turnMult * (stormWakeActive ? 1.18 : 1),
        headwindBoost: stormWakeActive
          ? 0.72
          : this.playerStats.headwindBoost + relicMods.headwindSpeedBonus,
        rogueWave: this.rogueWave,
      },
    );
    this.clubhaulCreakCd = Math.max(0, this.clubhaulCreakCd - dt);
    if (
      this.mode === 'playing' &&
      this.ship.sailLevel === 0 &&
      this.ship.speed > 2.2 &&
      Math.abs(steer) > 0.2
    ) {
      const cDirX = Math.sin(this.ship.heading);
      const cDirZ = -Math.cos(this.ship.heading);
      const cRightX = -cDirZ;
      const cRightZ = cDirX;
      const anchorX = this.ship.x - cDirX * 3.8;
      const anchorZ = this.ship.z - cDirZ * 3.8;
      const anchorY = sampleWaveHeight(anchorX, anchorZ, this.elapsed, this.seaParams.waveHeight) + 0.3;
      if (Math.random() < 0.6) {
        this.emitFoamParticle({
          x: anchorX + (Math.random() - 0.5) * 0.8,
          y: anchorY,
          z: anchorZ + (Math.random() - 0.5) * 0.8,
          vx: -cRightX * Math.sign(steer) * 3.4,
          vy: 1.8 + Math.random() * 1.4,
          vz: -cRightZ * Math.sign(steer) * 3.4,
          life: 0.45,
          startSize: 1.5,
          endSize: 3.2,
          alpha: 0.82,
          r: 0.9,
          g: 0.96,
          b: 1.0,
          gravity: 9.5,
          onWater: false,
        });
      }
      if (this.clubhaulCreakCd <= 0) {
        this.audio.playWoodCreak(0.62);
        this.clubhaulCreakCd = 1.1;
      }
    }
    if (this.mode === 'playing') {
      this.milesSailed += this.ship.speed * dt * 0.018;
      if (this.hullHp > 0 && this.hullHp < this.hullMaxHp && this.playerStats.hullRegenPerSec > 0) {
        this.surgeonHealAccum += this.playerStats.hullRegenPerSec * dt;
        if (this.surgeonHealAccum >= 1) {
          const healPts = Math.floor(this.surgeonHealAccum);
          this.surgeonHealAccum -= healPts;
          this.hullHp = Math.min(this.hullMaxHp, this.hullHp + healPts);
          if (
            this.activeOfficers.includes('surgeon') &&
            this.hullHp <= this.hullMaxHp * 0.55 &&
            this.elapsed - this.lastOfficerBarkSec >= 11
          ) {
            this.lastOfficerBarkSec = this.elapsed;
            this.setCallout(this.et().barkSurgeonHeal, 3.0, 'surgeon');
          }
        }
      }
    }

    // Keep player inside bounded sea arena
    const distFromCenter = Math.hypot(this.ship.x, this.ship.z);
    if (distFromCenter > 135) {
      const backHeading = normalizeAngle(Math.atan2(-this.ship.x, this.ship.z));
      this.ship = { ...this.ship, heading: backHeading };
    }

    const crestScore = computeWaveCrestScore(
      this.ship.x,
      this.ship.z,
      this.elapsed,
      this.seaParams.waveHeight,
      this.rogueWave,
    );
    const effectiveCrestThreshold = Math.max(
      0.32,
      this.seaParams.crestThreshold + this.playerStats.crestThresholdOffset,
    );
    this.playerBuilt.setSailAmount(this.ship.sailLevel);
    this.playerBuilt.setCrestGlow(stormWakeActive || crestScore >= effectiveCrestThreshold);
    this.playerBuilt.setAbilityVfx({ smokeActive, stormWakeActive });
    this.playerBuilt.root.position.set(this.ship.x, this.ship.heave, this.ship.z);
    this.playerBuilt.root.rotation.set(0, -this.ship.heading, 0);
    this.playerBuilt.visualBody.rotation.set(this.ship.pitch, 0, this.ship.roll);
    // Keep contact shadow grounded on water surface even during Wave Surge leaps
    this.playerBuilt.shadowDisc.position.y = -this.ship.surgeY + 0.08;
    const shadowScale = Math.max(0.5, 1 - this.ship.surgeY * 0.11);
    this.playerBuilt.shadowDisc.scale.setScalar(shadowScale);
    (this.playerBuilt.shadowDisc.material as THREE.MeshBasicMaterial).opacity =
      0.75 * shadowScale;
    this.playerBuilt.updateAnimation(this.elapsed, this.ship.squashY, this.ship.speed);

    // Volumetric 3D stern V-wake foam ribbon + white bow spray (THREE.Points)
    const dirX = Math.sin(this.ship.heading);
    const dirZ = -Math.cos(this.ship.heading);
    const rightX = -dirZ;
    const rightZ = dirX;

    this.wakeSpawnTimer -= dt;
    if (this.wakeSpawnTimer <= 0 && (this.ship.speed > 1.2 || stormWakeActive)) {
      this.wakeSpawnTimer = stormWakeActive ? 0.02 : 0.028;
      const sternX = this.ship.x - dirX * 4.05;
      const sternZ = this.ship.z - dirZ * 4.05;
      const speedNorm = Math.min(1.5, this.ship.speed / 9.5);

      for (const sideSign of [-1, 1]) {
        const px = sternX + rightX * sideSign * 0.98 + (Math.random() - 0.5) * 0.28;
        const pz = sternZ + rightZ * sideSign * 0.98 + (Math.random() - 0.5) * 0.28;
        const py = sampleWaveHeight(px, pz, this.elapsed, this.seaParams.waveHeight) + 0.18;
        this.emitFoamParticle({
          x: px,
          y: py,
          z: pz,
          vx: rightX * sideSign * (1.35 + speedNorm * 0.95) - dirX * 0.5,
          vy: 0.06,
          vz: rightZ * sideSign * (1.35 + speedNorm * 0.95) - dirZ * 0.5,
          life: stormWakeActive ? 1.85 : 1.55,
          startSize: stormWakeActive ? 2.8 : 2.25 + speedNorm * 0.75,
          endSize: stormWakeActive ? 6.4 : 5.2 + speedNorm * 1.5,
          alpha: stormWakeActive ? 0.88 : 0.72,
          r: stormWakeActive ? 0.55 : 0.94,
          g: stormWakeActive ? 0.94 : 0.98,
          b: 1.0,
          onWater: true,
        });
      }

      this.wakeNodes.push({
        x: sternX,
        y: sampleWaveHeight(sternX, sternZ, this.elapsed, this.seaParams.waveHeight) + 0.12,
        z: sternZ,
        life: stormWakeActive ? 1.65 : 1.25,
        maxLife: stormWakeActive ? 1.65 : 1.25,
        size: (stormWakeActive ? 9 : 5.5) + this.ship.speed * 0.4,
        storm: stormWakeActive,
      });
    }

    // White bow splash spray droplets arcing off the prow when slicing through waves
    this.bowSprayTimer -= dt;
    if (this.bowSprayTimer <= 0 && this.ship.speed > 2.8 && this.ship.surgeY < 0.75) {
      this.bowSprayTimer = 0.032;
      const bowX = this.ship.x + dirX * 5.2;
      const bowZ = this.ship.z + dirZ * 5.2;
      const bowY = sampleWaveHeight(bowX, bowZ, this.elapsed, this.seaParams.waveHeight) + 0.75;
      const sprayMult = Math.min(1.5, this.ship.speed / 8.5);
      for (const sideSign of [-1, 1]) {
        this.emitFoamParticle({
          x: bowX + rightX * sideSign * 0.58,
          y: bowY,
          z: bowZ + rightZ * sideSign * 0.58,
          vx: rightX * sideSign * (2.6 + Math.random() * 1.9) * sprayMult + dirX * this.ship.speed * 0.25,
          vy: (2.6 + Math.random() * 2.2) * sprayMult,
          vz: rightZ * sideSign * (2.6 + Math.random() * 1.9) * sprayMult + dirZ * this.ship.speed * 0.25,
          life: 0.48 + Math.random() * 0.22,
          startSize: 1.3 + sprayMult * 0.5,
          endSize: 2.5 + sprayMult * 0.7,
          alpha: 0.9,
          r: 0.96,
          g: 0.99,
          b: 1.0,
          gravity: 11.5,
          onWater: false,
        });
      }
    }

    // 4. Cooldowns, abilities, dynamic weather shifts, whirlpools, storm lightning & callouts
    if (this.mode === 'playing') {
      const contractMods = computeContractModifiers(this.activeContracts);
      if (contractMods.forceSquall || mutMods.forceSquall) {
        if (this.weather !== 'squall') {
          this.weather = 'squall';
          const wSpec = WEATHER_SPECS.squall;
          this.seaParams = {
            ...this.seaParams,
            waveHeight: Number((this.baseActWaveHeight * wSpec.waveMult * mutMods.waveHeightMult).toFixed(2)),
            windSpeed: Number((this.baseActWindSpeed * wSpec.windMult).toFixed(2)),
          };
        }
      } else {
        this.weatherTimer -= dt;
        if (this.weatherTimer <= 0) {
          const nextIdx = (WEATHER_CYCLE.indexOf(this.weather) + 1) % WEATHER_CYCLE.length;
          this.weather = WEATHER_CYCLE[nextIdx];
          this.weatherTimer = 36;
          const wSpec = WEATHER_SPECS[this.weather];
          this.seaParams = {
            ...this.seaParams,
            waveHeight: Number((this.baseActWaveHeight * wSpec.waveMult * mutMods.waveHeightMult).toFixed(2)),
            windSpeed: Number((this.baseActWindSpeed * wSpec.windMult).toFixed(2)),
          };
          if (this.weather !== 'squall' || !this.tryOfficerBark('squall')) {
            this.setCallout(`${this.t().calloutWeatherShift}: ${this.t()[wSpec.labelKey]}`, 3.2);
          }
        }
      }
      this.abilities = stepAbilityState(this.abilities, dt, this.weather === 'squall');

      if (this.abilities.smokeTimer > 0) {
        this.smokeSpawnTimer -= dt;
        if (this.smokeSpawnTimer <= 0) {
          this.smokeSpawnTimer = 0.11;
          this.spawnSmokePuff(false);
        }
      }
    }

    this.mineCooldown = Math.max(0, this.mineCooldown - dt);

    // 4a. Stern Sea Mines bobbing & proximity detonation
    for (let i = this.activeMines.length - 1; i >= 0; i -= 1) {
      const m = this.activeMines[i];
      m.armTimer = Math.max(0, m.armTimer - dt);
      m.life -= dt;
      const my = sampleWaveHeight(m.x, m.z, this.elapsed, this.seaParams.waveHeight);
      m.mesh.position.set(m.x, my + 0.15, m.z);
      m.mesh.rotation.y += dt * 0.8;
      m.emberMat.color.setHex(m.armTimer > 0 ? 0xffa642 : (Math.sin(this.elapsed * 9) > 0 ? 0xff4928 : 0xff9238));

      let detonated = false;
      if (m.armTimer <= 0) {
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const triggerDist = enemy.isBoss || enemy.archetype === 'kraken' ? 8.8 : 7.5;
          if (Math.hypot(enemy.x - m.x, enemy.z - m.z) < triggerDist) {
            detonated = true;
            break;
          }
        }
      }

      if (detonated) {
        this.audio.playExplosion();
        this.screenShake = Math.max(this.screenShake, 0.92);
        this.hitstopTimer = Math.max(this.hitstopTimer, 0.045);
        this.spawnBurst(m.x, my + 1.8, m.z, 0xff6228, 22);
        this.spawnRing(m.x, my + 0.7, m.z, '#FF7D42', 14, 0.56);
        this.spawnFloatingText(m.x, my + 5.2, m.z, this.t().combatBoom, '#FF9E44', 1.25);
        this.setCallout(this.et().calloutMineBoom, 2.8);
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const d = Math.hypot(enemy.x - m.x, enemy.z - m.z);
          const dmg = computeExplosionFalloff(d, 16, Math.round(58 * this.playerStats.damageMult));
          if (dmg > 0) {
            this.shotsHit += 1;
            const ey = sampleWaveHeight(enemy.x, enemy.z, this.elapsed, this.seaParams.waveHeight);
            if (!enemy.shieldBroken) {
              this.breakEnemyArmor(enemy, ey);
            }
            enemy.hp -= dmg;
            enemy.hitFlash = 1;
            enemy.burnTimer = Math.max(enemy.burnTimer, 5.5 + this.playerStats.burnDurationBonus);
            enemy.burnDps = Math.max(enemy.burnDps, 6.5 * this.playerStats.burnDamageMult);
            enemy.sailDebuffTimer = Math.max(enemy.sailDebuffTimer, 3.2);
            this.spawnFloatingText(enemy.x, ey + 4.8, enemy.z, `-${dmg}`, '#FFB84D', 1.18);
            if (enemy.hp <= 0) {
              this.handleEnemyDefeated(enemy, ey, false);
            }
          }
        }
      }

      if (detonated || m.life <= 0) {
        this.scene.remove(m.mesh);
        m.emberMat.dispose();
        this.activeMines.splice(i, 1);
      }
    }

    // 4a-2. Floating Mine Hazards, Drifting Wreckage Sites, Merchant Trade Brig & Course Waypoint
    for (let i = this.floatingMines.length - 1; i >= 0; i -= 1) {
      const fm = this.floatingMines[i];
      fm.life -= dt;
      const my = sampleWaveHeight(fm.x, fm.z, this.elapsed, this.seaParams.waveHeight, this.rogueWave);
      fm.built.group.position.set(fm.x, my, fm.z);
      fm.built.update(this.elapsed + fm.id);

      if (
        this.mode === 'playing' &&
        fm.alive &&
        Math.hypot(fm.x - this.ship.x, fm.z - this.ship.z) < 3.4 &&
        this.ship.surgeY < 1.15
      ) {
        fm.alive = false;
        const mineDmg = Math.round(24 * DIFFICULTY_SPECS[this.difficulty].enemyDamageMultiplier);
        this.hullHp = Math.max(0, this.hullHp - mineDmg);
        this.ship = { ...this.ship, squashY: 0.78, squashVel: 2.5 };
        this.audio.playExplosion();
        this.screenShake = Math.max(this.screenShake, 0.88);
        this.spawnBurst(fm.x, my + 1.4, fm.z, 0xff6228, 18);
        this.spawnRing(fm.x, my + 0.5, fm.z, '#FF7D42', 11, 0.5);
        this.spawnFloatingText(this.ship.x, this.ship.heave + 5.0, this.ship.z, `-${mineDmg}`, '#FF5A4E', 1.2);
        this.setCallout(this.et().calloutMineBoom, 2.6);
        if (this.hullHp <= 0) {
          this.triggerPlayerDefeat();
        }
      }

      if (!fm.alive || fm.life <= 0) {
        this.scene.remove(fm.built.group);
        fm.built.emberMat.dispose();
        this.floatingMines.splice(i, 1);
      }
    }

    for (const ws of this.wreckageSites) {
      if (!ws.active) continue;
      const wy = sampleWaveHeight(ws.x, ws.z, this.elapsed, this.seaParams.waveHeight, this.rogueWave);
      const inRange = Math.hypot(ws.x - this.ship.x, ws.z - this.ship.z) <= 12.2;
      ws.built.group.position.set(ws.x, wy, ws.z);
      ws.built.update(this.elapsed + ws.id, inRange);
    }

    if (this.courseWaypoint && this.waypointBeacon) {
      const wy = sampleWaveHeight(
        this.courseWaypoint.x,
        this.courseWaypoint.z,
        this.elapsed,
        this.seaParams.waveHeight,
        this.rogueWave,
      );
      this.waypointBeacon.group.position.set(this.courseWaypoint.x, wy, this.courseWaypoint.z);
      this.waypointBeacon.update(this.elapsed);
      if (Math.hypot(this.courseWaypoint.x - this.ship.x, this.courseWaypoint.z - this.ship.z) < 8) {
        this.clearWaypoint();
      }
    }

    if (this.mode === 'playing') {
      if (this.merchantSite && this.merchantSite.active) {
        this.merchantSite.life -= dt;
        this.merchantSite.x += Math.sin(this.merchantSite.heading) * this.merchantSite.speed * dt;
        this.merchantSite.z -= Math.cos(this.merchantSite.heading) * this.merchantSite.speed * dt;
        if (Math.hypot(this.merchantSite.x, this.merchantSite.z) > 108) {
          this.merchantSite.heading = normalizeAngle(Math.atan2(-this.merchantSite.x, this.merchantSite.z));
        }
        const my = sampleWaveHeight(
          this.merchantSite.x,
          this.merchantSite.z,
          this.elapsed,
          this.seaParams.waveHeight,
          this.rogueWave,
        );
        const inRange = Math.hypot(this.merchantSite.x - this.ship.x, this.merchantSite.z - this.ship.z) <= 13.8;
        this.merchantSite.built.root.position.set(this.merchantSite.x, my, this.merchantSite.z);
        this.merchantSite.built.root.rotation.y = -this.merchantSite.heading;
        this.merchantSite.built.update(this.elapsed, inRange);
        if (this.merchantSite.life <= 0) {
          this.scene.remove(this.merchantSite.built.root);
          this.merchantSite = null;
          this.merchantSpawnTimer = 38;
        }
      } else {
        this.merchantSpawnTimer -= dt;
        if (this.merchantSpawnTimer <= 0) {
          this.spawnMerchantSite();
        }
      }
    }

    // 4a-3. Falling Storm Cliff Boulders
    for (let i = this.fallingBoulders.length - 1; i >= 0; i -= 1) {
      const b = this.fallingBoulders[i];
      b.life -= dt;
      b.vy -= 18 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
      b.mesh.position.set(b.x, b.y, b.z);
      b.mesh.rotation.x += 2.6 * dt;
      b.mesh.rotation.z += 1.9 * dt;
      const wy = sampleWaveHeight(b.x, b.z, this.elapsed, this.seaParams.waveHeight, this.rogueWave);
      if (!b.splashed && b.y <= wy) {
        b.splashed = true;
        this.audio.playExplosion();
        this.spawnBurst(b.x, wy + 1.0, b.z, 0x9ec6ff, 14);
        this.spawnRing(b.x, wy + 0.4, b.z, '#8ED6FF', 12, 0.5);
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const d = Math.hypot(enemy.x - b.x, enemy.z - b.z);
          const dmg = computeRockfallSplash(d, 18, Math.round(44 * this.playerStats.damageMult));
          if (dmg > 0) {
            this.shotsHit += 1;
            const ey = sampleWaveHeight(enemy.x, enemy.z, this.elapsed, this.seaParams.waveHeight, this.rogueWave);
            enemy.hp -= dmg;
            enemy.hitFlash = 1;
            this.spawnFloatingText(enemy.x, ey + 5.0, enemy.z, `-${dmg}`, '#9CE6FF', 1.2);
            if (enemy.hp <= 0) {
              this.handleEnemyDefeated(enemy, ey, false);
            }
          }
        }
      }
      if (b.splashed || b.life <= 0) {
        this.scene.remove(b.mesh);
        (b.mesh.material as THREE.Material).dispose();
        b.mesh.geometry.dispose();
        this.fallingBoulders.splice(i, 1);
      }
    }

    // 4b. Cursed Hold contract drain & Random Mid-Voyage Sea Events
    if (this.mode === 'playing') {
      const contractMods = computeContractModifiers(this.activeContracts);
      if (contractMods.goldDrainPerSec > 0) {
        this.goldDrainAccum += contractMods.goldDrainPerSec * dt;
        if (this.goldDrainAccum >= 1) {
          const drain = Math.floor(this.goldDrainAccum);
          this.goldDrainAccum -= drain;
          this.runDoubloonsBonus = Math.max(0, this.runDoubloonsBonus - drain);
        }
        const prevMorale = Math.floor(this.morale);
        this.morale = Math.max(20, this.morale - 0.35 * dt);
        if (Math.floor(this.morale) !== prevMorale) {
          this.recomputePlayerStats();
        }
        if (this.morale < 40 && !this.mutinyWarned) {
          this.mutinyWarned = true;
          this.setCallout(this.et().calloutMutinyRisk, 3.5);
        }
      }

      this.seaEventTimer -= dt;
      if (this.seaEventTimer <= 0) {
        this.seaEventTimer = 34;
        const kindIdx = this.seaEventSeq % 3;
        this.seaEventSeq += 1;
        const eventKind: SeaEventKind = kindIdx === 0 ? 'salvage' : kindIdx === 1 ? 'ambush' : 'tidalBoon';
        const fx = Math.max(-105, Math.min(105, this.ship.x + Math.sin(this.ship.heading) * 28));
        const fz = Math.max(-105, Math.min(105, this.ship.z - Math.cos(this.ship.heading) * 28));
        if (eventKind === 'salvage') {
          this.spawnWreckageSite(fx, fz);
        } else if (eventKind === 'ambush') {
          const aliveCount = this.enemies.filter((e) => e.alive).length;
          if (aliveCount < 6) {
            const spec = DIFFICULTY_SPECS[this.difficulty];
            const ax = Math.max(-105, Math.min(105, this.ship.x + (Math.random() > 0.5 ? 42 : -42)));
            const az = Math.max(-105, Math.min(105, this.ship.z - 28));
            this.targetShips += 1;
            this.enemies.push(
              this.createEnemyShip({
                id: 700 + this.seaEventSeq,
                archetype: 'brig',
                scale: 1.0,
                x: ax,
                z: az,
                hp: Math.round(92 * spec.enemyHpMultiplier * ACT_SPECS[this.act].enemyHpMult),
                speed: 6.8,
                orbitRadius: 36,
                orbitAngle: Math.random() * Math.PI * 2,
                fireTimer: 2.2,
              }),
            );
          }
        } else {
          this.morale = Math.min(100, this.morale + 15);
          this.ship = { ...this.ship, surgeCooldown: 0 };
          this.abilities = gainStormRage(this.abilities, 30);
          this.recomputePlayerStats();
        }
        this.onSeaEvent?.(eventKind);
      }
    }

    const reloadTick = this.abilities.smokeTimer > 0 ? dt * SMOKE_RELOAD_SPEED_MULT : dt;
    this.portCooldown = Math.max(0, this.portCooldown - reloadTick);
    this.stbdCooldown = Math.max(0, this.stbdCooldown - reloadTick);
    if (this.mode === 'playing' && this.comboStreak > 0) {
      const nextStreak = stepComboStreak(this.comboStreak, this.comboTimer, dt, false);
      this.comboStreak = nextStreak.streak;
      this.comboTimer = nextStreak.timer;
    }
    this.reefDamageCooldown = Math.max(0, this.reefDamageCooldown - dt);
    for (const [pairKey, cd] of this.enemyPairCooldowns.entries()) {
      if (cd - dt <= 0) this.enemyPairCooldowns.delete(pairKey);
      else this.enemyPairCooldowns.set(pairKey, cd - dt);
    }

    // Harpoon tether physics & orbital constraint (enemy hull or sunken reef chest)
    if (this.abilities.harpoonActiveTimer > 0 && this.abilities.harpoonTargetId !== null) {
      if (this.abilities.harpoonTargetId === HARPOON_CHEST_TARGET_ID) {
        if (!this.reefChestProp || this.reefChestProp.completed) {
          this.abilities = { ...this.abilities, harpoonActiveTimer: 0, harpoonTargetId: null };
        } else {
          const forces = computeHarpoonTetherForces(
            this.ship.x,
            this.ship.z,
            this.reefChestProp.x,
            this.reefChestProp.z,
            dt,
          );
          if (forces.snapped) {
            this.reefChestProp.built.setHighlight?.(false);
            this.abilities = { ...this.abilities, harpoonActiveTimer: 0, harpoonTargetId: null };
          } else {
            this.ship = {
              ...this.ship,
              x: this.ship.x + forces.playerPullX * 0.55,
              z: this.ship.z + forces.playerPullZ * 0.55,
            };
          }
        }
      } else {
        const target = this.enemies.find((e) => e.id === this.abilities.harpoonTargetId && e.alive);
        if (!target) {
          this.abilities = { ...this.abilities, harpoonActiveTimer: 0, harpoonTargetId: null };
        } else {
          const forces = computeHarpoonTetherForces(this.ship.x, this.ship.z, target.x, target.z, dt);
          if (forces.snapped) {
            this.abilities = { ...this.abilities, harpoonActiveTimer: 0, harpoonTargetId: null };
          } else {
            this.ship = {
              ...this.ship,
              x: this.ship.x + forces.playerPullX,
              z: this.ship.z + forces.playerPullZ,
            };
            target.x += forces.enemyPullX;
            target.z += forces.enemyPullZ;
            target.sailDebuffTimer = Math.max(target.sailDebuffTimer, 0.25);
          }
        }
      }
    }

    for (const wp of this.whirlpools) {
      wp.built.update(this.elapsed);
      wp.coreDamageCd = Math.max(0, wp.coreDamageCd - dt);
      if (this.ship.surgeY < 0.7) {
        const pull = computeWhirlpoolPull(this.ship.x, this.ship.z, wp.x, wp.z, 16, 4.6);
        if (pull) {
          this.ship = {
            ...this.ship,
            x: this.ship.x + pull.fx * dt,
            z: this.ship.z + pull.fz * dt,
          };
          if (pull.inCore && wp.coreDamageCd <= 0 && this.mode === 'playing') {
            wp.coreDamageCd = 1.1;
            this.hullHp = Math.max(0, this.hullHp - 6);
            this.ship = { ...this.ship, squashY: 0.86, squashVel: 1.8 };
            this.audio.playCollision(false);
            this.screenShake = Math.max(this.screenShake, 0.35);
            this.spawnFloatingText(this.ship.x, this.ship.heave + 4.4, this.ship.z, '-6', '#7BE0FF', 1.1);
            this.setCallout(this.t().calloutWhirlpool, 2.2);
            if (this.hullHp <= 0) {
              this.triggerPlayerDefeat();
            }
          }
        }
      }
      for (const enemy of this.enemies) {
        if (!enemy.alive || enemy.archetype === 'seafort') continue;
        const ep = computeWhirlpoolPull(enemy.x, enemy.z, wp.x, wp.z, 16, 4.6);
        if (ep) {
          enemy.x += ep.fx * dt;
          enemy.z += ep.fz * dt;
          if (ep.inCore && enemy.whirlpoolDamageCd <= 0 && this.mode === 'playing') {
            enemy.whirlpoolDamageCd = 1.25;
            enemy.hp -= 8;
            enemy.hitFlash = 0.85;
            const ey = sampleWaveHeight(
              enemy.x,
              enemy.z,
              this.elapsed,
              this.seaParams.waveHeight,
              this.rogueWave,
            );
            this.spawnFloatingText(enemy.x, ey + 4.4, enemy.z, '-8', '#7BE0FF', 1.0);
            if (enemy.hp <= 0) {
              this.handleEnemyDefeated(enemy, ey, false);
            }
          }
        }
      }
    }

    this.stepSecretQuests(dt);

    const stormIntensity = this.getStormIntensity();
    this.lightningAlpha = Math.max(0, this.lightningAlpha - dt * 1.9);
    if (stormIntensity > 0.35) {
      this.nextLightningTimer -= dt;
      if (this.nextLightningTimer <= 0) {
        this.lightningAlpha = 0.65;
        this.nextLightningTimer = 5.5 + Math.random() * 6.5;
        if (this.mode === 'playing') {
          this.audio.playThunder();
        }
      }
    }

    if (this.calloutTimer > 0) {
      this.calloutTimer -= dt;
      if (this.calloutTimer <= 0 && this.mode === 'playing') {
        this.callout = this.t().calloutDefault;
        this.calloutSpeaker = null;
      }
    }
    if (this.mode === 'playing') {
      if (this.hullHp > 0 && this.hullHp <= this.hullMaxHp * 0.35) {
        if (!this.lowHullBarkSent && this.tryOfficerBark('lowHull')) {
          this.lowHullBarkSent = true;
        }
      } else if (this.hullHp > this.hullMaxHp * 0.45) {
        this.lowHullBarkSent = false;
      }
    }
    this.screenShake = Math.max(0, this.screenShake - dt * 2.1);

    // 5. Enemies physical patrol, archetype AI, ammo debuffs & broadsides
    const contractEnemyReloadMult = computeContractModifiers(this.activeContracts).enemyReloadMult;
    const reloadMult = DIFFICULTY_SPECS[this.difficulty].enemyReloadMultiplier * contractEnemyReloadMult;
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (
        (enemy.isBoss || enemy.archetype === 'kraken' || (enemy.archetype === 'wraith' && enemy.id < 9000)) &&
        !enemy.bossEnraged &&
        enemy.hp > 0 &&
        enemy.hp <= enemy.maxHp * 0.5
      ) {
        enemy.bossEnraged = true;
        enemy.speed *= 1.18;
        enemy.built.setBossEnraged?.(true);
        const by = sampleWaveHeight(enemy.x, enemy.z, this.elapsed, this.seaParams.waveHeight);
        const ringColor =
          enemy.archetype === 'kraken' ? '#62F2FF' : enemy.archetype === 'wraith' ? '#8CE2FF' : '#FF3B2E';
        this.spawnRing(enemy.x, by + 1.0, enemy.z, ringColor, 14.5, 0.72);
        this.spawnBurst(enemy.x, by + 3.0, enemy.z, enemy.archetype === 'kraken' ? 0x2a6d78 : 0xff4936, 18);
        this.screenShake = Math.max(this.screenShake, 0.85);
        if (enemy.archetype === 'kraken') {
          this.audio.playKrakenRoar();
          for (let k = 0; k < 7; k += 1) {
            const { mesh } = this.acquireSmokePuff(0x131b2e);
            mesh.position.set(
              enemy.x + (Math.random() - 0.5) * 6,
              by + 1.5 + Math.random() * 1.4,
              enemy.z + (Math.random() - 0.5) * 6,
            );
            mesh.scale.setScalar(1.8);
            this.smokePuffs.push({
              mesh,
              vx: (Math.random() - 0.5) * 3.6,
              vy: 0.7 + Math.random() * 0.6,
              vz: (Math.random() - 0.5) * 3.6,
              life: 2.6,
              maxLife: 2.6,
              baseScale: 1.8,
            });
          }
          this.ship = { ...this.ship, speed: this.ship.speed * 0.72 };
        } else if (enemy.archetype === 'wraith' && this.mode === 'playing') {
          this.audio.playBossHorn();
          const decoyX = Math.max(-105, Math.min(105, enemy.x + (Math.random() > 0.5 ? 16 : -16)));
          const decoyZ = Math.max(-105, Math.min(105, enemy.z + 12));
          const decoy = this.createEnemyShip({
            id: 9000 + enemy.id,
            archetype: 'wraith',
            scale: 0.92,
            x: decoyX,
            z: decoyZ,
            hp: Math.max(30, Math.round(enemy.maxHp * 0.42)),
            speed: enemy.speed * 1.05,
            orbitRadius: Math.max(24, enemy.orbitRadius - 6),
            orbitAngle: enemy.orbitAngle + 0.8,
            fireTimer: 2.2,
          });
          decoy.shieldBroken = true;
          decoy.built.setSpecialShieldBroken?.(true);
          this.enemies.push(decoy);
          this.targetShips += 1;
        } else if (enemy.isBoss) {
          this.audio.playBossHorn();
          this.lightningAlpha = Math.max(this.lightningAlpha, 0.72);
          if (this.mode === 'playing') {
            this.spawnEnemyShot(enemy);
            this.onBossPhase2?.(this.act, ACT_SPECS[this.act].bossKey);
          }
        }
        this.emitHud();
      }
      enemy.playerCollisionCooldown = Math.max(0, enemy.playerCollisionCooldown - dt);
      enemy.sailDebuffTimer = Math.max(0, enemy.sailDebuffTimer - dt);
      enemy.crewDebuffTimer = Math.max(0, enemy.crewDebuffTimer - dt);
      enemy.armorRendTimer = Math.max(0, enemy.armorRendTimer - dt);
      enemy.whirlpoolDamageCd = Math.max(0, enemy.whirlpoolDamageCd - dt);
      enemy.built.setSailDamaged(enemy.sailDebuffTimer > 0);

      const sailSlowFactor = enemy.sailDebuffTimer > 0 ? 0.45 : 1;
      const targetSpeed = enemy.archetype === 'seafort' ? 0 : enemy.speed * sailSlowFactor;
      let desiredHeading = enemy.heading;

      if (enemy.archetype === 'seafort') {
        enemy.currentSpeed = 0;
        enemy.pitch = 0;
        enemy.roll = 0;
      } else {
        if (enemy.archetype === 'fireship' && this.mode === 'playing') {
          desiredHeading = normalizeAngle(Math.atan2(this.ship.x - enemy.x, -(this.ship.z - enemy.z)));
          enemy.specialTimer -= dt;
          if (enemy.specialTimer <= 0) {
            enemy.specialTimer = 0.24;
            const ey = sampleWaveHeight(enemy.x, enemy.z, this.elapsed, this.seaParams.waveHeight);
            this.spawnBurst(enemy.x, ey + 1.5, enemy.z, 0xff7b2e, 2);
          }
        } else {
          enemy.orbitAngle += (targetSpeed / enemy.orbitRadius) * dt;
          const targetX = Math.cos(enemy.orbitAngle) * enemy.orbitRadius;
          const targetZ = -24 + Math.sin(enemy.orbitAngle) * enemy.orbitRadius * 0.72;
          desiredHeading = normalizeAngle(Math.atan2(targetX - enemy.x, -(targetZ - enemy.z)));
        }

        const turnDiff = normalizeAngle(desiredHeading - enemy.heading);
        const turnRate = enemy.archetype === 'fireship' ? 2.2 : 1.6;
        const appliedTurn = Math.max(-turnRate * dt, Math.min(turnRate * dt, turnDiff));
        enemy.heading = normalizeAngle(enemy.heading + appliedTurn);
        enemy.currentSpeed += (targetSpeed - enemy.currentSpeed) * Math.min(1, dt * 2.2);
        const eDirX = Math.sin(enemy.heading);
        const eDirZ = -Math.cos(enemy.heading);
        enemy.x += eDirX * enemy.currentSpeed * dt;
        enemy.z += eDirZ * enemy.currentSpeed * dt;

        // Enemy buoyancy pitch, wave roll & turn banking
        const ehCenter = sampleWaveHeight(enemy.x, enemy.z, this.elapsed, this.seaParams.waveHeight);
        const ehBow = sampleWaveHeight(
          enemy.x + eDirX * 2.5,
          enemy.z + eDirZ * 2.5,
          this.elapsed,
          this.seaParams.waveHeight,
        );
        const ehStbd = sampleWaveHeight(
          enemy.x - eDirZ * 1.4,
          enemy.z + eDirX * 1.4,
          this.elapsed,
          this.seaParams.waveHeight,
        );
        const pitchTarget = Math.max(
          -0.25,
          Math.min(0.25, (ehBow - ehCenter) * 0.15 + Math.sin(this.elapsed * 2.0 + enemy.id) * 0.03),
        );
        const enemyTurnBank = -Math.max(-1, Math.min(1, turnDiff * 1.6)) * 0.14;
        const rollTarget =
          (ehStbd - ehCenter) * 0.14 +
          enemyTurnBank +
          Math.cos(this.elapsed * 1.55 + enemy.id) * 0.045;
        enemy.pitch += (pitchTarget - enemy.pitch) * Math.min(1, dt * 5.5);
        enemy.roll += (rollTarget - enemy.roll) * Math.min(1, dt * 5.0);

        // Enemy stern wake foam
        enemy.wakeTimer -= dt;
        if (enemy.wakeTimer <= 0 && enemy.currentSpeed > 1.8 && enemy.archetype !== 'kraken') {
          enemy.wakeTimer = 0.095;
          const eRightX = -eDirZ;
          const eRightZ = eDirX;
          const estX = enemy.x - eDirX * 3.8 * enemy.scale;
          const estZ = enemy.z - eDirZ * 3.8 * enemy.scale;
          this.emitFoamParticle({
            x: estX + (Math.random() - 0.5) * 0.8,
            y: ehCenter + 0.14,
            z: estZ + (Math.random() - 0.5) * 0.8,
            vx: (Math.random() - 0.5) * eRightX * 1.1,
            vz: (Math.random() - 0.5) * eRightZ * 1.1,
            life: 1.25,
            startSize: 1.45 * enemy.scale,
            endSize: 3.6 * enemy.scale,
            alpha: 0.48,
            r: 0.85,
            g: 0.94,
            b: 1.0,
            onWater: true,
          });
        }
      }

      const ehCenter = sampleWaveHeight(enemy.x, enemy.z, this.elapsed, this.seaParams.waveHeight);

      // Kraken tentacle shockwave slam
      if (enemy.archetype === 'kraken' && this.mode === 'playing') {
        enemy.specialTimer -= dt;
        if (enemy.specialTimer <= 0.7 && enemy.specialTimer > 0) {
          enemy.telegraphTimer = Math.max(enemy.telegraphTimer, 1 - enemy.specialTimer / 0.7);
        }
        if (enemy.specialTimer <= 0) {
          enemy.specialTimer = 7.2;
          this.spawnRing(enemy.x, ehCenter + 0.8, enemy.z, '#62F2FF', 21, 0.68);
          this.spawnBurst(enemy.x, ehCenter + 2.4, enemy.z, 0x62f2ff, 20);
          this.audio.playKrakenRoar();
          const dPlayer = Math.hypot(this.ship.x - enemy.x, this.ship.z - enemy.z);
          if (dPlayer < 22 && this.ship.surgeY < 0.75) {
            const spec = DIFFICULTY_SPECS[this.difficulty];
            const cMods = computeContractModifiers(this.activeContracts);
            const slamDmg = Math.round(18 * spec.enemyDamageMultiplier * cMods.enemyDmgMult);
            this.hullHp = Math.max(0, this.hullHp - slamDmg);
            const nx = (this.ship.x - enemy.x) / Math.max(1, dPlayer);
            const nz = (this.ship.z - enemy.z) / Math.max(1, dPlayer);
            this.ship = {
              ...this.ship,
              x: this.ship.x + nx * 6.5,
              z: this.ship.z + nz * 6.5,
              squashY: 0.78,
              squashVel: 2.5,
            };
            this.screenShake = Math.max(this.screenShake, 0.95);
            this.morale = Math.max(15, this.morale - 4);
            this.recomputePlayerStats();
            this.spawnFloatingText(this.ship.x, this.ship.heave + 5.0, this.ship.z, `-${slamDmg}`, '#62F2FF', 1.25);
            if (this.hullHp <= 0) {
              this.triggerPlayerDefeat();
            }
          }
        }
      }

      // Damaged / hit deck fire, rising smoke & Incendiary Burn DoT
      if (enemy.burnTimer > 0) {
        enemy.burnTimer = Math.max(0, enemy.burnTimer - dt);
        if (enemy.burnDps > 0 && this.mode === 'playing') {
          enemy.burnTickAccum += enemy.burnDps * dt;
          if (enemy.burnTickAccum >= 4) {
            const burnDmg = Math.floor(enemy.burnTickAccum);
            enemy.burnTickAccum -= burnDmg;
            enemy.hp -= burnDmg;
            this.spawnFloatingText(enemy.x, ehCenter + 4.4, enemy.z, `-${burnDmg}`, '#FF8A3D', 0.95);
            if (enemy.hp <= 0) {
              this.handleEnemyDefeated(enemy, ehCenter, false);
              continue;
            }
          }
        }
      }
      const isBurning = enemy.burnTimer > 0 || enemy.hp <= enemy.maxHp * 0.65;
      if (isBurning) {
        enemy.fireSpawnTimer -= dt;
        if (enemy.fireSpawnTimer <= 0) {
          enemy.fireSpawnTimer = enemy.hp <= enemy.maxHp * 0.4 ? 0.16 : 0.28;
          const fx = enemy.x + (Math.random() - 0.5) * 1.6 * enemy.scale;
          const fz = enemy.z + (Math.random() - 0.5) * 2.2 * enemy.scale;
          const fy = ehCenter + 1.55 * enemy.scale;
          // Flame spark & dark smoke plume
          this.emitFoamParticle({
            x: fx,
            y: fy,
            z: fz,
            vx: -Math.sin(this.seaParams.windAngle) * 1.6 + (Math.random() - 0.5) * 0.8,
            vy: 2.2 + Math.random() * 1.4,
            vz: Math.cos(this.seaParams.windAngle) * 1.6 + (Math.random() - 0.5) * 0.8,
            life: 0.55 + Math.random() * 0.25,
            startSize: 1.25 * enemy.scale,
            endSize: 2.1 * enemy.scale,
            alpha: 0.88,
            r: 1.0,
            g: 0.48 + Math.random() * 0.28,
            b: 0.14,
            gravity: -1.5,
          });
          this.emitFoamParticle({
            x: fx,
            y: fy + 0.7,
            z: fz,
            vx: -Math.sin(this.seaParams.windAngle) * 2.4 + (Math.random() - 0.5) * 1.0,
            vy: 2.4 + Math.random() * 1.2,
            vz: Math.cos(this.seaParams.windAngle) * 2.4 + (Math.random() - 0.5) * 1.0,
            life: 1.15 + Math.random() * 0.45,
            startSize: 1.5 * enemy.scale,
            endSize: 4.2 * enemy.scale,
            alpha: 0.55,
            r: 0.28,
            g: 0.3,
            b: 0.36,
            gravity: -0.6,
          });
        }
      }

      if (this.mode === 'playing') {
        const crewSlowFactor = enemy.crewDebuffTimer > 0 ? 1.85 : 1;
        if (enemy.archetype === 'healer') {
          enemy.specialTimer -= dt;
          if (enemy.specialTimer <= 0 && enemy.crewDebuffTimer <= 0) {
            enemy.specialTimer = 5.6;
            let healedAny = false;
            for (const ally of this.enemies) {
              if (!ally.alive || ally.id === enemy.id || ally.hp >= ally.maxHp) continue;
              if (Math.hypot(ally.x - enemy.x, ally.z - enemy.z) < 52) {
                const amt = 18;
                ally.hp = Math.min(ally.maxHp, ally.hp + amt);
                const ay = sampleWaveHeight(ally.x, ally.z, this.elapsed, this.seaParams.waveHeight);
                this.spawnRing(ally.x, ay + 0.7, ally.z, '#3EF09C', 5.4, 0.45);
                this.spawnFloatingText(ally.x, ay + 5.0, ally.z, `${this.t().combatHealPulse} +${amt}`, '#3EF09C', 1.1);
                healedAny = true;
              }
            }
            if (healedAny) {
              const hy = sampleWaveHeight(enemy.x, enemy.z, this.elapsed, this.seaParams.waveHeight);
              this.spawnRing(enemy.x, hy + 0.8, enemy.z, '#3EF09C', 8.5, 0.5);
              this.setCallout(this.t().calloutHealerPulse, 2.4);
            }
          }
        }

        if (enemy.archetype !== 'fireship') {
          enemy.fireTimer -= dt;
          const rangeLimit = enemy.isBoss ? 115 : 95;
          const distToPlayer = Math.hypot(this.ship.x - enemy.x, this.ship.z - enemy.z);
          if (enemy.fireTimer > 0 && enemy.fireTimer <= 0.55 && distToPlayer <= rangeLimit) {
            enemy.telegraphTimer = Math.min(1, (0.55 - enemy.fireTimer) / 0.55);
          } else {
            enemy.telegraphTimer = 0;
          }
          if (enemy.fireTimer <= 0) {
            enemy.telegraphTimer = 0;
            this.spawnEnemyShot(enemy);
            const rageReload = enemy.bossEnraged ? 0.76 : 1;
            const baseInterval = enemy.archetype === 'mortar' ? 4.8 : 3.4 + Math.random() * 1.8;
            enemy.fireTimer = baseInterval * reloadMult * crewSlowFactor * rageReload;
          }
        }
      } else {
        enemy.telegraphTimer = 0;
      }
    }

    // 5a. Mortar impact zones countdown
    for (let i = this.mortarZones.length - 1; i >= 0; i -= 1) {
      const z = this.mortarZones[i];
      z.timer -= dt;
      if (z.timer <= 0) {
        const wy = sampleWaveHeight(z.x, z.z, this.elapsed, this.seaParams.waveHeight);
        this.audio.playExplosion();
        this.spawnBurst(z.x, wy + 1.2, z.z, 0xc76bff, 14);
        this.spawnRing(z.x, wy + 0.6, z.z, '#D98CFF', z.radius * 1.4, 0.48);
        if (this.mode === 'playing' && this.ship.surgeY < 1.35) {
          const dist = Math.hypot(this.ship.x - z.x, this.ship.z - z.z);
          if (dist < z.radius) {
            this.hullHp = Math.max(0, this.hullHp - z.damage);
            this.ship = { ...this.ship, squashY: 0.78, squashVel: 2.5 };
            this.screenShake = Math.max(this.screenShake, 0.85);
            this.spawnFloatingText(this.ship.x, this.ship.heave + 5.0, this.ship.z, `-${z.damage}`, '#FF5A4E', 1.2);
            if (this.hullHp <= 0) {
              this.triggerPlayerDefeat();
            }
          }
        }
        this.mortarZones.splice(i, 1);
      }
    }

    // 5b. Ship-to-ship & reef collision resolution (hard separation + ramming damage)
    this.resolveCollisions();

    // 5c. Floating loot crates & fire-oil barrels (+ Bosun magnet perk)
    for (let i = this.floatingProps.length - 1; i >= 0; i -= 1) {
      const prop = this.floatingProps[i];
      if (!prop.alive) {
        this.floatingProps.splice(i, 1);
        continue;
      }

      if (
        prop.kind !== 'barrel' &&
        this.mode === 'playing' &&
        this.playerStats.lootMagnetRadius > 0
      ) {
        const dMag = Math.hypot(this.ship.x - prop.x, this.ship.z - prop.z);
        if (dMag > 1.2 && dMag < this.playerStats.lootMagnetRadius) {
          const pull = 10.5 * dt;
          prop.x += ((this.ship.x - prop.x) / dMag) * pull;
          prop.z += ((this.ship.z - prop.z) / dMag) * pull;
        }
      }

      const py = sampleWaveHeight(prop.x, prop.z, this.elapsed, this.seaParams.waveHeight);
      prop.built.group.position.set(prop.x, py, prop.z);
      prop.built.update(this.elapsed + prop.id);

      const distP = Math.hypot(this.ship.x - prop.x, this.ship.z - prop.z);
      if (prop.kind === 'barrel') {
        if (distP < 3.9 && this.ship.surgeY < 1.2) {
          this.detonateBarrel(prop);
        }
      } else if (distP < 4.4 && this.mode === 'playing') {
        prop.alive = false;
        this.scene.remove(prop.built.group);
        this.audio.playPickup();
        if (prop.kind === 'repair') {
          const healAmt = Math.round(24 * this.playerStats.healCrateMult);
          this.hullHp = Math.min(this.hullMaxHp, this.hullHp + healAmt);
          this.spawnFloatingText(prop.x, py + 4.2, prop.z, `${this.t().combatHeal} +${healAmt}`, '#54F2A8', 1.18);
          this.spawnRing(prop.x, py + 0.5, prop.z, '#54F2A8', 4.6, 0.4);
          this.spawnBurst(prop.x, py + 1.2, prop.z, 0x54f2a8, 10);
        } else if (prop.kind === 'powder') {
          this.portCooldown = 0;
          this.stbdCooldown = 0;
          this.ship = { ...this.ship, surgeCooldown: 0 };
          this.abilities = gainStormRage(
            {
              ...this.abilities,
              harpoonCooldown: this.abilities.harpoonCooldown * 0.4,
              smokeCooldown: this.abilities.smokeCooldown * 0.4,
            },
            40,
          );
          this.spawnFloatingText(prop.x, py + 4.2, prop.z, this.t().combatPowder, '#7BE0FF', 1.18);
          this.spawnRing(prop.x, py + 0.5, prop.z, '#7BE0FF', 4.6, 0.4);
          this.spawnBurst(prop.x, py + 1.2, prop.z, 0x7be0ff, 10);
        } else if (prop.kind === 'bottle') {
          let tx = Math.max(-96, Math.min(96, this.ship.x + (Math.random() > 0.5 ? 46 : -46)));
          let tz = Math.max(-96, Math.min(96, this.ship.z + (Math.random() > 0.5 ? -38 : 38)));
          for (const obs of this.headlandObstacles) {
            if (Math.hypot(tx - obs.x, tz - obs.z) < obs.radius + 9) {
              tx = tx > 0 ? -42 : 42;
              tz = -18;
            }
          }
          this.treasureSpot = { x: tx, z: tz, collected: false };
          this.setCallout(this.et().calloutBottlePicked, 4.0, 'navigator');
          this.spawnFloatingText(prop.x, py + 4.4, prop.z, 'X', '#FFE082', 1.3);
          this.spawnRing(prop.x, py + 0.5, prop.z, '#FFE082', 5.2, 0.45);
          this.spawnBurst(prop.x, py + 1.2, prop.z, 0xffe082, 12);
        } else {
          this.score += 180;
          this.runDoubloonsBonus += 45;
          this.emitWorldCoinFly(prop.x, py + 1.5, prop.z, 6);
          this.spawnFloatingText(prop.x, py + 4.2, prop.z, this.t().combatGold, '#FFD257', 1.18);
          this.spawnRing(prop.x, py + 0.5, prop.z, '#FFD257', 4.6, 0.4);
          this.spawnBurst(prop.x, py + 1.2, prop.z, 0xffd257, 10);
        }
      }
    }

    // 5d. Treasure Spot excavation, Oil Slick burning, Chain Lightning arcs, Escort Convoy
    if (this.treasureSpot && !this.treasureSpot.collected && this.mode === 'playing') {
      const td = Math.hypot(this.treasureSpot.x - this.ship.x, this.treasureSpot.z - this.ship.z);
      if (td < 8.5) {
        this.treasureSpot.collected = true;
        const ty = sampleWaveHeight(
          this.treasureSpot.x,
          this.treasureSpot.z,
          this.elapsed,
          this.seaParams.waveHeight,
        );
        const newRelic = pickRandomUnownedRelic(this.activeRelics, Math.random());
        if (newRelic) {
          this.activeRelics.push(newRelic);
          this.recomputePlayerStats();
        }
        const bonus = Math.round(55 * this.playerStats.doubloonGainMult);
        this.runDoubloonsBonus += bonus;
        this.score += 320;
        this.audio.playBoarding();
        this.emitWorldCoinFly(this.treasureSpot.x, ty + 1.6, this.treasureSpot.z, 8);
        this.spawnRing(this.treasureSpot.x, ty + 0.6, this.treasureSpot.z, '#FFE082', 9.0, 0.55);
        this.spawnBurst(this.treasureSpot.x, ty + 2.0, this.treasureSpot.z, 0xffd257, 20);
        this.spawnFloatingText(
          this.treasureSpot.x,
          ty + 4.8,
          this.treasureSpot.z,
          `+${bonus}g`,
          '#FFE082',
          1.28,
        );
        this.onLogUnlock?.('logBottleTreasure');
        if (this.elapsed - this.lastOfficerBarkSec >= 11) {
          this.lastOfficerBarkSec = this.elapsed;
          this.setCallout(this.et().barkTreasureFound, 3.4, 'navigator');
        } else {
          this.setCallout(this.et().calloutTreasureDug, 3.4);
        }
        this.emitHud();
      }
    }

    for (let i = this.oilSlicks.length - 1; i >= 0; i -= 1) {
      const slick = this.oilSlicks[i];
      slick.life -= dt;
      if (slick.ignited) {
        slick.igniteTimer -= dt;
        if (Math.random() < 0.45) {
          const ang = Math.random() * Math.PI * 2;
          const rad = Math.random() * slick.radius * 0.75;
          const fx = slick.x + Math.cos(ang) * rad;
          const fz = slick.z + Math.sin(ang) * rad;
          const fy = sampleWaveHeight(fx, fz, this.elapsed, this.seaParams.waveHeight) + 0.35;
          this.emitFoamParticle({
            x: fx,
            y: fy,
            z: fz,
            vx: (Math.random() - 0.5) * 1.4,
            vy: 2.2 + Math.random() * 1.8,
            vz: (Math.random() - 0.5) * 1.4,
            life: 0.48,
            startSize: 1.8,
            endSize: 0.6,
            alpha: 0.85,
            r: 1.0,
            g: 0.45 + Math.random() * 0.25,
            b: 0.12,
            gravity: -1.2,
            onWater: false,
          });
        }
        if (this.mode === 'playing') {
          slick.tickAccum += dt;
          const doTick = slick.tickAccum >= 0.45;
          if (doTick) slick.tickAccum -= 0.45;
          for (const enemy of this.enemies) {
            if (!enemy.alive) continue;
            if (Math.hypot(enemy.x - slick.x, enemy.z - slick.z) <= slick.radius + 3.5) {
              const dps = 9 * this.playerStats.burnDamageMult * dt;
              enemy.hp -= dps;
              if (doTick) {
                const ey = sampleWaveHeight(enemy.x, enemy.z, this.elapsed, this.seaParams.waveHeight);
                this.spawnFloatingText(
                  enemy.x,
                  ey + 4.4,
                  enemy.z,
                  `-${Math.max(1, Math.round(9 * this.playerStats.burnDamageMult * 0.45))}`,
                  '#FF8A3D',
                  0.95,
                );
              }
              if (enemy.hp <= 0) {
                const ey = sampleWaveHeight(enemy.x, enemy.z, this.elapsed, this.seaParams.waveHeight);
                this.handleEnemyDefeated(enemy, ey, false);
              }
            }
          }
        }
        if (slick.igniteTimer <= 0) {
          this.oilSlicks.splice(i, 1);
          continue;
        }
      }
      if (slick.life <= 0) {
        this.oilSlicks.splice(i, 1);
      }
    }

    for (let i = this.lightningArcs.length - 1; i >= 0; i -= 1) {
      this.lightningArcs[i].life -= dt;
      if (this.lightningArcs[i].life <= 0) {
        this.lightningArcs.splice(i, 1);
      }
    }

    if (this.escortConvoy && this.escortConvoy.alive) {
      const targetX = Math.max(-94, Math.min(94, this.ship.x - Math.sin(this.ship.heading) * 18));
      const targetZ = Math.max(-94, Math.min(94, this.ship.z + Math.cos(this.ship.heading) * 18));
      const dx = targetX - this.escortConvoy.x;
      const dz = targetZ - this.escortConvoy.z;
      const distC = Math.hypot(dx, dz);
      if (distC > 6.5) {
        const desiredHeading = normalizeAngle(Math.atan2(dx, -dz));
        const diff = normalizeAngle(desiredHeading - this.escortConvoy.heading);
        this.escortConvoy.heading = normalizeAngle(
          this.escortConvoy.heading + Math.max(-1.4 * dt, Math.min(1.4 * dt, diff)),
        );
        this.escortConvoy.x += Math.sin(this.escortConvoy.heading) * this.escortConvoy.speed * dt;
        this.escortConvoy.z -= Math.cos(this.escortConvoy.heading) * this.escortConvoy.speed * dt;
      }
      if (this.activeOfficers.includes('surgeon') && this.escortConvoy.hp < this.escortConvoy.maxHp) {
        this.escortConvoy.hp = Math.min(this.escortConvoy.maxHp, this.escortConvoy.hp + 1.2 * dt);
      }
      this.escortConvoy.hitFlash = Math.max(0, this.escortConvoy.hitFlash - dt * 4);
      this.escortConvoy.built.setHitFlash?.(this.escortConvoy.hitFlash);
      const cy = sampleWaveHeight(
        this.escortConvoy.x,
        this.escortConvoy.z,
        this.elapsed,
        this.seaParams.waveHeight,
      );
      this.escortConvoy.built.root.position.set(this.escortConvoy.x, cy, this.escortConvoy.z);
      this.escortConvoy.built.root.rotation.set(0, -this.escortConvoy.heading, 0);
      this.escortConvoy.built.visualBody.rotation.set(
        Math.sin(this.elapsed * 2 + 1) * 0.04,
        0,
        Math.cos(this.elapsed * 1.6) * 0.04,
      );
      this.escortConvoy.built.updateAnimation(
        this.elapsed + 3.1,
        1,
        distC > 6.5 ? this.escortConvoy.speed : 1.2,
      );
    }

    // Update player & enemy transforms after collision & whirlpool resolution
    this.playerBuilt.root.position.set(this.ship.x, this.ship.heave, this.ship.z);
    this.playerBuilt.root.rotation.set(0, -this.ship.heading, 0);

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const ey = sampleWaveHeight(enemy.x, enemy.z, this.elapsed, this.seaParams.waveHeight);
      const sqForce = (1 - enemy.squashY) * 42 - enemy.squashVel * 8;
      enemy.squashVel += sqForce * dt;
      enemy.squashY = Math.max(0.75, Math.min(1.25, enemy.squashY + enemy.squashVel * dt));
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 4.2);
      enemy.built.setHitFlash?.(enemy.hitFlash);
      enemy.built.setTelegraphFlash?.(enemy.telegraphTimer);
      enemy.built.setHullDamageRatio?.(enemy.hp / Math.max(1, enemy.maxHp));

      enemy.built.root.position.set(enemy.x, ey, enemy.z);
      enemy.built.root.rotation.set(0, -enemy.heading, 0);
      enemy.built.visualBody.rotation.set(enemy.pitch, 0, enemy.roll);
      enemy.built.updateAnimation(this.elapsed + enemy.id, enemy.squashY, enemy.currentSpeed);
    }

    // 6. Projectiles + white water trails + collisions (enemies, barrels, rockfalls, mines, player)
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.vy -= (p.gravity ?? 8.4) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.mesh.position.set(p.x, p.y, p.z);
      p.trail.push({ x: p.x, y: p.y, z: p.z });
      if (p.trail.length > 9) p.trail.shift();

      let remove = false;
      const waterY = sampleWaveHeight(p.x, p.z, this.elapsed, this.seaParams.waveHeight, this.rogueWave);
      // Glowing amber embers behind wave-crest-boosted or incendiary cannonballs
      if (!p.fromEnemy && (p.crestBoosted || p.ammo === 'incendiary') && Math.random() < 0.75) {
        this.emitFoamParticle({
          x: p.x + (Math.random() - 0.5) * 0.18,
          y: p.y + (Math.random() - 0.5) * 0.18,
          z: p.z + (Math.random() - 0.5) * 0.18,
          vx: (Math.random() - 0.5) * 1.4,
          vy: 0.4 + Math.random() * 0.8,
          vz: (Math.random() - 0.5) * 1.4,
          life: 0.3,
          startSize: 1.05,
          endSize: 0.35,
          alpha: 0.9,
          r: 1.0,
          g: p.ammo === 'incendiary' ? 0.45 : 0.78,
          b: p.ammo === 'incendiary' ? 0.15 : 0.32,
          onWater: false,
        });
      }
      // White wake / spray ribbon behind cannonballs flying near or skimming the waves
      if (p.y < waterY + 3.4) {
        this.emitFoamParticle({
          x: p.x + (Math.random() - 0.5) * 0.25,
          y: p.y < waterY + 1.2 ? waterY + 0.16 : p.y,
          z: p.z + (Math.random() - 0.5) * 0.25,
          vx: (Math.random() - 0.5) * 0.8,
          vy: p.y < waterY + 1.2 ? 1.1 : 0.2,
          vz: (Math.random() - 0.5) * 0.8,
          life: 0.42,
          startSize: 0.95,
          endSize: 2.35,
          alpha: 0.72,
          r: 0.92,
          g: 0.97,
          b: 1.0,
          onWater: p.y < waterY + 1.2,
        });
      }

      // Explosive barrel check
      for (const prop of this.floatingProps) {
        if (!prop.alive || prop.kind !== 'barrel') continue;
        if (Math.hypot(p.x - prop.x, p.z - prop.z) < 2.6 && p.y < 3.6) {
          this.detonateBarrel(prop);
          remove = true;
          break;
        }
      }

      // Secret Quest 6: Thunder on the Chains (Chain Shot hits copper storm buoy during Squall or Wave Crest)
      if (
        !remove &&
        this.stormBuoyProp &&
        !this.stormBuoyProp.completed &&
        !this.triggeredSecrets.has('thunderChain') &&
        didChainShotStrikeStormBuoy(
          p.x,
          p.z,
          p.ammo,
          p.fromEnemy,
          p.crestBoosted,
          this.weather,
          this.stormBuoyProp,
        )
      ) {
        this.stormBuoyProp.completed = true;
        this.stormBuoyProp.built.group.visible = false;
        this.triggeredSecrets.add('thunderChain');
        const spec = SECRET_QUEST_SPECS.thunderChain;
        this.score += spec.rewardScore;
        this.runDoubloonsBonus += 45;
        this.ship = { ...this.ship, surgeCooldown: 0 };

        this.lightningAlpha = 0.88;
        this.audio.playExplosion();
        this.audio.playBoarding();
        this.screenShake = Math.max(this.screenShake, 0.95);
        this.spawnBurst(this.stormBuoyProp.x, waterY + 2.4, this.stormBuoyProp.z, 0x9ce6ff, 26);
        this.spawnRing(this.stormBuoyProp.x, waterY + 0.9, this.stormBuoyProp.z, '#7BE0FF', 22, 0.7);
        this.spawnFloatingText(
          this.stormBuoyProp.x,
          waterY + 6.0,
          this.stormBuoyProp.z,
          this.t().secret6Title,
          '#9CE6FF',
          1.35,
        );

        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const dist = Math.hypot(enemy.x - this.stormBuoyProp.x, enemy.z - this.stormBuoyProp.z);
          if (dist < 54) {
            const dmg = 55;
            enemy.hp -= dmg;
            enemy.hitFlash = 1;
            enemy.squashY = 0.78;
            enemy.squashVel = 2.6;
            const ey = sampleWaveHeight(enemy.x, enemy.z, this.elapsed, this.seaParams.waveHeight);
            this.spawnFloatingText(enemy.x, ey + 5.2, enemy.z, `-${dmg}`, '#9CE6FF', 1.2);
            this.spawnRing(enemy.x, ey + 0.8, enemy.z, '#7BE0FF', 5.5, 0.42);
            if (enemy.hp <= 0) {
              this.handleEnemyDefeated(enemy, ey, false);
            }
          }
        }

        this.setCallout(this.t().secret6Reward, 3.8);
        this.emitWorldCoinFly(this.stormBuoyProp.x, waterY + 2.4, this.stormBuoyProp.z, 6);
        this.onSecretComplete?.('thunderChain');
        this.emitHud();
        remove = true;
      }

      // Storm Cliff Rockfalls (shots hitting headland cliffs during Squall or Storm Wake)
      if (!remove && !p.fromEnemy && (this.weather === 'squall' || this.abilities.stormWakeTimer > 0)) {
        for (const obs of this.headlandObstacles) {
          if (Math.hypot(p.x - obs.x, p.z - obs.z) < obs.radius + 0.9 && p.y < 14) {
            this.triggerCliffRockfall(p.x, p.z, obs.x, obs.z);
            remove = true;
            break;
          }
        }
      }

      // Floating Sea Mines cleared by cannon fire
      if (!remove && !p.fromEnemy) {
        for (const fm of this.floatingMines) {
          if (!fm.alive) continue;
          if (Math.hypot(p.x - fm.x, p.z - fm.z) < 2.8 && p.y < waterY + 3.2) {
            fm.alive = false;
            this.audio.playExplosion();
            this.spawnBurst(fm.x, waterY + 1.4, fm.z, 0xff6228, 16);
            this.spawnRing(fm.x, waterY + 0.5, fm.z, '#FF7D42', 11, 0.45);
            this.score += 65;
            remove = true;
            break;
          }
        }
      }

      if (!remove && !p.fromEnemy) {
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const hitRadius = enemy.isBoss || enemy.archetype === 'seafort' || enemy.archetype === 'kraken' ? 5.8 : 4.1;
          const dist = Math.hypot(p.x - enemy.x, p.z - enemy.z);
          if (dist < hitRadius && p.y < (enemy.isBoss || enemy.archetype === 'seafort' ? 8.6 : 6.5)) {
            this.shotsHit += 1;
            const eff = computeAmmoEffect(p.ammo);
            if ((p.ammo === 'incendiary' || eff.piercesShield) && !enemy.shieldBroken) {
              this.breakEnemyArmor(enemy, waterY);
            }
            const armored =
              (enemy.archetype === 'wraith' || enemy.archetype === 'kraken') && !enemy.shieldBroken;
            const pierceRatio = Math.min(1, 0.25 + this.playerStats.armorPierceBonus);
            const rendMult = enemy.armorRendTimer > 0 ? 1.22 : 1.0;
            const baseActual =
              armored && !eff.piercesShield ? Math.max(2, Math.round(p.damage * pierceRatio)) : p.damage;
            const rakeMult = computeRakingShotMultiplier(p.vx, p.vz, enemy.heading);
            const actualDmg = Math.round(baseActual * rendMult * rakeMult);

            enemy.hp -= actualDmg;
            enemy.hitFlash = 1;
            if (eff.burnDuration > 0) {
              enemy.burnTimer = Math.max(
                enemy.burnTimer,
                eff.burnDuration + this.playerStats.burnDurationBonus,
              );
              enemy.burnDps = Math.max(enemy.burnDps, 6.5 * this.playerStats.burnDamageMult);
            } else {
              enemy.burnTimer = Math.max(enemy.burnTimer, 5.5);
            }
            if (eff.armorRendDuration > 0 && enemy.hp > 0) {
              enemy.armorRendTimer = Math.max(enemy.armorRendTimer, eff.armorRendDuration);
            }
            if (
              eff.pullForce > 0 &&
              enemy.hp > 0 &&
              !enemy.isBoss &&
              enemy.archetype !== 'seafort' &&
              enemy.archetype !== 'kraken'
            ) {
              const pdx = this.ship.x - enemy.x;
              const pdz = this.ship.z - enemy.z;
              const pd = Math.max(1, Math.hypot(pdx, pdz));
              const pull = Math.min(Math.max(0, pd - 5), eff.pullForce * 0.45);
              if (pull > 0) {
                enemy.x += (pdx / pd) * pull;
                enemy.z += (pdz / pd) * pull;
              }
            }
            enemy.squashY = 0.8;
            enemy.squashVel = 2.4;
            this.score += p.crestBoosted ? 35 : 20;
            this.audio.playHit();
            if (rakeMult > 1.1) {
              this.audio.playRakingCrit();
              this.spawnFloatingText(
                enemy.x,
                waterY + 6.8,
                enemy.z,
                `${this.et().combatRake} ×${rakeMult.toFixed(1)}`,
                '#FFE082',
                1.22,
              );
              if (this.elapsed - this.lastOfficerBarkSec >= 11) {
                this.lastOfficerBarkSec = this.elapsed;
                this.setCallout(this.et().barkRakingCrit, 3.0, 'gunner');
              }
            }
            if (p.ammo === 'incendiary' || p.ammo === 'mortar') {
              this.igniteOilSlicks(p.x, p.z, 5.5);
            }
            this.screenShake = Math.max(this.screenShake, p.crestBoosted ? 0.58 : 0.34);
            if (p.crestBoosted) {
              this.hitstopTimer = Math.max(this.hitstopTimer, 0.032);
            }
            this.spawnBurst(
              p.x,
              p.y,
              p.z,
              p.ammo === 'cursed' ? 0xc77dff : p.ammo === 'incendiary' ? 0xff5e28 : 0xff9e44,
              8,
            );
            this.spawnSplinters(p.x, p.y + 0.4, p.z, p.crestBoosted ? 12 : 8);
            this.spawnRing(
              p.x,
              p.y,
              p.z,
              p.ammo === 'cursed' ? '#C77DFF' : p.crestBoosted ? '#FFB84D' : '#FF6B3D',
              4.2,
              0.35,
            );
            this.spawnFloatingText(
              enemy.x,
              waterY + 4.8,
              enemy.z,
              armored && !eff.piercesShield
                ? `-${actualDmg} (ARMR)`
                : `-${actualDmg}${p.crestBoosted ? '!' : ''}`,
              p.ammo === 'cursed'
                ? '#D6A3FF'
                : armored && !eff.piercesShield
                  ? '#7BE0FF'
                  : p.crestBoosted
                    ? '#FFB84D'
                    : '#FFE0A3',
              p.crestBoosted ? 1.25 : 1.0,
            );

            // Ammo tactical specialization effects
            if (eff.sailSlowDuration > 0 && enemy.hp > 0) {
              const wasTorn = enemy.sailDebuffTimer > 0;
              enemy.sailDebuffTimer = Math.max(enemy.sailDebuffTimer, eff.sailSlowDuration);
              enemy.built.setSailDamaged(true);
              if (!wasTorn) {
                this.spawnFloatingText(
                  enemy.x,
                  waterY + 6.4,
                  enemy.z,
                  this.t().combatTornSails,
                  '#7BE0FF',
                  1.05,
                );
              }
            }
            if (eff.crewSlowDuration > 0 && enemy.hp > 0) {
              const wasStunned = enemy.crewDebuffTimer > 0;
              enemy.crewDebuffTimer = Math.max(enemy.crewDebuffTimer, eff.crewSlowDuration);
              if (!wasStunned) {
                this.spawnFloatingText(
                  enemy.x,
                  waterY + 6.4,
                  enemy.z,
                  this.t().combatCrewHit,
                  '#FFB84D',
                  1.05,
                );
              }
            }

            if (p.ammo === 'mortar' && eff.splashRadius > 0) {
              this.detonatePlayerMortar(p.x, waterY, p.z, p.damage, eff.splashRadius, enemy.id);
            }

            if (
              (p.ammo === 'chain' || p.ammo === 'harpoonBolt') &&
              (this.weather === 'squall' || stormWakeActive || relicMods.squallChainLightningDmg > 0)
            ) {
              let chainTarget: EnemyShip | null = null;
              let chainBest = 26;
              for (const other of this.enemies) {
                if (!other.alive || other.id === enemy.id) continue;
                const d = Math.hypot(other.x - enemy.x, other.z - enemy.z);
                if (d < chainBest) {
                  chainBest = d;
                  chainTarget = other;
                }
              }
              if (chainTarget) {
                const arcDmg = Math.round(
                  (relicMods.squallChainLightningDmg || 22) * this.playerStats.damageMult,
                );
                chainTarget.hp -= arcDmg;
                chainTarget.hitFlash = 1;
                const cy = sampleWaveHeight(
                  chainTarget.x,
                  chainTarget.z,
                  this.elapsed,
                  this.seaParams.waveHeight,
                );
                this.lightningArcs.push({
                  ax: enemy.x,
                  ay: waterY + 2.6,
                  az: enemy.z,
                  bx: chainTarget.x,
                  by: cy + 2.6,
                  bz: chainTarget.z,
                  life: 0.28,
                });
                this.audio.playLightningZap();
                this.spawnFloatingText(
                  chainTarget.x,
                  cy + 5.2,
                  chainTarget.z,
                  `${this.et().combatArcZap} -${arcDmg}`,
                  '#7BE0FF',
                  1.12,
                );
                if (chainTarget.hp <= 0) {
                  this.handleEnemyDefeated(chainTarget, cy, false);
                }
              }
            }

            if (enemy.hp <= 0) {
              this.handleEnemyDefeated(enemy, waterY, false);
            }
            remove = true;
            break;
          }
        }
      } else if (!remove && this.mode === 'playing') {
        if (
          this.escortConvoy &&
          this.escortConvoy.alive &&
          Math.hypot(p.x - this.escortConvoy.x, p.z - this.escortConvoy.z) < 3.6 &&
          p.y < 5.5
        ) {
          this.escortConvoy.hp = Math.max(0, this.escortConvoy.hp - p.damage);
          this.escortConvoy.hitFlash = 1;
          this.audio.playHit();
          this.spawnBurst(p.x, p.y, p.z, 0xff9e44, 8);
          this.spawnFloatingText(
            this.escortConvoy.x,
            p.y + 3.4,
            this.escortConvoy.z,
            `-${p.damage}`,
            '#FF9C7A',
            1.05,
          );
          if (this.escortConvoy.hp <= 0) {
            this.escortConvoy.alive = false;
            this.scene.remove(this.escortConvoy.built.root);
            this.escortConvoy = null;
            this.setCallout(this.et().calloutConvoyLost, 3.6);
          }
          remove = true;
        }
        const distPlayer = Math.hypot(p.x - this.ship.x, p.z - this.ship.z);
        // Wave Surge leaps cleanly over low enemy shots!
        if (!remove && distPlayer < 3.6 && this.ship.surgeY < 1.35 && p.y < 5.5) {
          const playerHitDmg = Math.round(p.damage * (1 + mutMods.armorPenalty));
          this.hullHp = Math.max(0, this.hullHp - playerHitDmg);
          if (playerHitDmg >= 12) {
            this.morale = Math.max(15, this.morale - 3);
            this.recomputePlayerStats();
          }
          this.ship = { ...this.ship, squashY: 0.82, squashVel: 2.2 };
          this.audio.playHit();
          this.screenShake = Math.max(this.screenShake, 0.65);
          this.spawnBurst(p.x, p.y, p.z, 0xff4936, 10);
          this.spawnRing(p.x, p.y, p.z, '#FF4936', 4.4, 0.35);
          this.spawnFloatingText(
            this.ship.x,
            this.ship.heave + 4.8,
            this.ship.z,
            `-${playerHitDmg}`,
            '#FF5A4E',
            1.15,
          );
          if (this.hullHp <= 0) {
            this.triggerPlayerDefeat();
          }
          remove = true;
        }
      }

      if (!remove && p.y <= waterY) {
        if (!p.fromEnemy && p.ammo === 'mortar') {
          this.detonatePlayerMortar(p.x, waterY, p.z, p.damage, 9.5, -1);
        } else {
          this.audio.playSplash();
          this.spawnBurst(p.x, waterY + 0.3, p.z, 0x8dc2eb, 5);
          this.spawnRing(p.x, waterY + 0.15, p.z, '#8DC2EB', 2.8, 0.32);
        }
        for (let s = 0; s < 5; s += 1) {
          this.emitFoamParticle({
            x: p.x + (Math.random() - 0.5) * 0.6,
            y: waterY + 0.25,
            z: p.z + (Math.random() - 0.5) * 0.6,
            vx: (Math.random() - 0.5) * 4.5,
            vy: 3.2 + Math.random() * 2.8,
            vz: (Math.random() - 0.5) * 4.5,
            life: 0.55 + Math.random() * 0.25,
            startSize: 1.25,
            endSize: 2.8,
            alpha: 0.85,
            r: 0.92,
            g: 0.97,
            b: 1.0,
            gravity: 11.5,
          });
        }
        remove = true;
      }

      if (remove || p.life <= 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // 7. 3D Particles, GPU Foam Points & 2D VFX lifetimes
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const pt = this.particles[i];
      pt.life -= dt;
      pt.vy -= (pt.gravity ?? 14) * dt;
      pt.mesh.position.x += pt.vx * dt;
      pt.mesh.position.y += pt.vy * dt;
      pt.mesh.position.z += pt.vz * dt;
      if (pt.rotX !== undefined) {
        pt.mesh.rotation.x += pt.rotX * dt;
        pt.mesh.rotation.y += (pt.rotY ?? 0) * dt;
        pt.mesh.rotation.z += (pt.rotZ ?? 0) * dt;
      }
      pt.mesh.scale.setScalar(Math.max(0.05, pt.life / pt.maxLife));
      if (pt.life <= 0) {
        this.releaseParticleMesh(pt.mesh);
        this.particles.splice(i, 1);
      }
    }

    this.stepFoamParticles(dt);

    for (let i = this.floatingTexts.length - 1; i >= 0; i -= 1) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y += 2.6 * dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    for (let i = this.flashRings.length - 1; i >= 0; i -= 1) {
      const r = this.flashRings[i];
      r.life -= dt;
      if (r.life <= 0) this.flashRings.splice(i, 1);
    }

    for (let i = this.wakeNodes.length - 1; i >= 0; i -= 1) {
      const w = this.wakeNodes[i];
      w.life -= dt;
      if (w.life <= 0) this.wakeNodes.splice(i, 1);
    }

    for (let i = this.smokePuffs.length - 1; i >= 0; i -= 1) {
      const sp = this.smokePuffs[i];
      sp.life -= dt;
      sp.mesh.position.x += sp.vx * dt;
      sp.mesh.position.y += sp.vy * dt;
      sp.mesh.position.z += sp.vz * dt;
      const ratio = Math.max(0, sp.life / sp.maxLife);
      const grow = sp.baseScale * (1 + (1 - ratio) * 1.45);
      sp.mesh.scale.setScalar(grow);
      (sp.mesh.material as THREE.MeshBasicMaterial).opacity = ratio * 0.52;
      if (sp.life <= 0) {
        this.releaseSmokePuff(sp.mesh);
        this.smokePuffs.splice(i, 1);
      }
    }

    if (this.grappleVfx) {
      this.grappleVfx.life -= dt;
      if (this.grappleVfx.life <= 0) this.grappleVfx = null;
    }

    // 8. Smooth Camera & Parallax tracking (subtle speed + Storm Wake FOV expansion)
    const stormFov = this.abilities.stormWakeTimer > 0 ? 4.8 : 0;
    const targetFov =
      52 + Math.min(4.5, Math.max(0, this.ship.speed - 4) * 0.35 + this.ship.surgeY * 0.7) + stormFov;
    if (Math.abs(this.camera.fov - targetFov) > 0.04) {
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 4);
      this.camera.updateProjectionMatrix();
    }

    const camYaw = this.ship.heading + this.camYawOffset;
    const horizDist = Math.cos(this.camPitch) * this.camDistance;
    const camY = Math.sin(this.camPitch) * this.camDistance + 3.2;
    const shakeX = (Math.random() - 0.5) * this.screenShake * 1.1;
    const shakeY = (Math.random() - 0.5) * this.screenShake * 0.9;

    this.camera.position.set(
      this.ship.x - Math.sin(camYaw) * horizDist + shakeX,
      camY + this.ship.heave * 0.25 + shakeY,
      this.ship.z + Math.cos(camYaw) * horizDist,
    );
    this.camera.lookAt(
      this.ship.x + Math.sin(this.ship.heading) * 6,
      this.ship.heave + 2.6,
      this.ship.z - Math.cos(this.ship.heading) * 6,
    );

    this.parallaxEnv.update(this.elapsed, this.camera.position.x, this.camera.position.z);
    const activeWreck = this.wreckageSites.find((w) => w.active);
    const gullTarget =
      this.treasureSpot && !this.treasureSpot.collected
        ? this.treasureSpot
        : activeWreck ?? this.lighthouseCenter ?? this.ship;
    this.seagullFlock?.update(this.elapsed, gullTarget.x, gullTarget.z);

    this.hudEmitTimer += dt;
    if (this.hudEmitTimer >= 0.08) {
      this.hudEmitTimer = 0;
      this.updateMusicCondition();
      this.emitHud();
    }
  }

  private stepFoamParticles(dt: number): void {
    const pos = this.foamPosAttr.array as Float32Array;
    const col = this.foamColAttr.array as Float32Array;
    const size = this.foamSizeAttr.array as Float32Array;
    const alpha = this.foamAlphaAttr.array as Float32Array;

    for (let i = 0; i < this.maxFoamParticles; i += 1) {
      const p = this.foamPool[i];
      const i3 = i * 3;
      if (!p.active) {
        alpha[i] = 0;
        pos[i3 + 1] = -999;
        continue;
      }
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        alpha[i] = 0;
        pos[i3 + 1] = -999;
        continue;
      }

      p.vy -= p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.onWater) {
        p.vx *= 1 - Math.min(1, dt * 1.4);
        p.vz *= 1 - Math.min(1, dt * 1.4);
        p.y = sampleWaveHeight(p.x, p.z, this.elapsed, this.seaParams.waveHeight) + 0.14;
      }

      const t = 1 - p.life / p.maxLife;
      pos[i3] = p.x;
      pos[i3 + 1] = p.y;
      pos[i3 + 2] = p.z;
      col[i3] = p.r;
      col[i3 + 1] = p.g;
      col[i3 + 2] = p.b;
      size[i] = p.startSize + (p.endSize - p.startSize) * t;
      alpha[i] = p.baseAlpha * (1 - t) * (1 - t * 0.35);
    }

    this.foamPosAttr.needsUpdate = true;
    this.foamColAttr.needsUpdate = true;
    this.foamSizeAttr.needsUpdate = true;
    this.foamAlphaAttr.needsUpdate = true;
  }

  private stepSecretQuests(dt: number): void {
    if (this.lighthouseRelic && !this.lighthouseRelic.collected) {
      const ry = sampleWaveHeight(
        this.lighthouseRelic.x,
        this.lighthouseRelic.z,
        this.elapsed,
        this.seaParams.waveHeight,
      );
      this.lighthouseRelic.built.group.position.set(
        this.lighthouseRelic.x,
        ry,
        this.lighthouseRelic.z,
      );
      this.lighthouseRelic.built.update(this.elapsed);
    }

    const beamRotY = this.headlands[0]?.beaconGroup.rotation.y ?? 0;
    const beamOnBell =
      this.beamBellProp && !this.beamBellProp.completed
        ? isBeamIlluminatingPoint(this.lighthouseCenter, this.beamBellProp, beamRotY)
        : false;

    if (this.beamBellProp && !this.beamBellProp.completed) {
      const by = sampleWaveHeight(
        this.beamBellProp.x,
        this.beamBellProp.z,
        this.elapsed,
        this.seaParams.waveHeight,
      );
      this.beamBellProp.built.group.position.set(this.beamBellProp.x, by, this.beamBellProp.z);
      this.beamBellProp.built.setHighlight?.(beamOnBell);
      this.beamBellProp.built.update(this.elapsed);
    }

    if (this.fogHulkProp && !this.fogHulkProp.completed) {
      const hy = sampleWaveHeight(
        this.fogHulkProp.x,
        this.fogHulkProp.z,
        this.elapsed,
        this.seaParams.waveHeight,
      );
      this.fogHulkProp.built.group.position.set(this.fogHulkProp.x, hy, this.fogHulkProp.z);
      this.fogHulkProp.built.update(this.elapsed);
    }

    if (this.stormBuoyProp && !this.stormBuoyProp.completed) {
      const sy = sampleWaveHeight(
        this.stormBuoyProp.x,
        this.stormBuoyProp.z,
        this.elapsed,
        this.seaParams.waveHeight,
      );
      const crestScoreNow = computeWaveCrestScore(
        this.ship.x,
        this.ship.z,
        this.elapsed,
        this.seaParams.waveHeight,
      );
      const energized =
        this.weather === 'squall' ||
        crestScoreNow >= Math.max(0.32, this.seaParams.crestThreshold + this.playerStats.crestThresholdOffset);
      this.stormBuoyProp.built.group.position.set(this.stormBuoyProp.x, sy, this.stormBuoyProp.z);
      this.stormBuoyProp.built.setHighlight?.(energized);
      this.stormBuoyProp.built.update(this.elapsed);
    }

    if (this.reefChestProp && !this.reefChestProp.completed) {
      const cy = sampleWaveHeight(
        this.reefChestProp.x,
        this.reefChestProp.z,
        this.elapsed,
        this.seaParams.waveHeight,
      );
      this.reefChestProp.built.group.position.set(this.reefChestProp.x, cy - 0.15, this.reefChestProp.z);
      this.reefChestProp.built.setHighlight?.(
        this.abilities.harpoonActiveTimer > 0 && this.abilities.harpoonTargetId === HARPOON_CHEST_TARGET_ID,
      );
      this.reefChestProp.built.update(this.elapsed);
    }

    for (const sb of this.shadowStraitBuoys) {
      if (!sb.built.group.visible) continue;
      const by = sampleWaveHeight(sb.x, sb.z, this.elapsed, this.seaParams.waveHeight);
      sb.built.group.position.set(sb.x, by, sb.z);
      sb.built.setHighlight?.(this.litShadowStraitIndices.has(sb.index));
      sb.built.update(this.elapsed);
    }

    if (this.stormRiftProp && !this.stormRiftProp.completed) {
      const ry = sampleWaveHeight(
        this.stormRiftProp.x,
        this.stormRiftProp.z,
        this.elapsed,
        this.seaParams.waveHeight,
      );
      this.stormRiftProp.built.group.position.set(this.stormRiftProp.x, ry, this.stormRiftProp.z);
      this.stormRiftProp.built.setHighlight?.(this.abilities.stormWakeTimer > 0 || this.weather === 'squall');
      this.stormRiftProp.built.update(this.elapsed);
    }

    if (this.mode !== 'playing') {
      this.broadsideFiredThisTick = false;
      return;
    }

    // 1. Secret Quest 1: The Lighthouse Watch (Hidden Relic Buoy behind lighthouse cliff)
    if (
      this.lighthouseRelic &&
      !this.lighthouseRelic.collected &&
      !this.triggeredSecrets.has('lighthouse') &&
      isNearLighthouseRelic(this.ship.x, this.ship.z, this.lighthouseRelic)
    ) {
      this.lighthouseRelic.collected = true;
      this.lighthouseRelic.built.group.visible = false;
      this.triggeredSecrets.add('lighthouse');

      const spec = SECRET_QUEST_SPECS.lighthouse;
      const healAmt = Math.round(this.hullMaxHp * 0.35);
      this.hullHp = Math.min(this.hullMaxHp, this.hullHp + healAmt);
      this.portCooldown = 0;
      this.stbdCooldown = 0;
      this.score += spec.rewardScore;
      this.runDoubloonsBonus += 20;

      const ry = sampleWaveHeight(
        this.lighthouseRelic.x,
        this.lighthouseRelic.z,
        this.elapsed,
        this.seaParams.waveHeight,
      );
      this.audio.playBoarding();
      this.screenShake = Math.max(this.screenShake, 0.55);
      this.spawnBurst(this.lighthouseRelic.x, ry + 1.8, this.lighthouseRelic.z, 0xffe082, 18);
      this.spawnRing(this.lighthouseRelic.x, ry + 0.6, this.lighthouseRelic.z, '#FFD27D', 9.0, 0.55);
      this.spawnFloatingText(
        this.ship.x,
        this.ship.heave + 5.2,
        this.ship.z,
        `${this.t().secret1Title} (+${healAmt})`,
        '#FFE082',
        1.25,
      );
      this.setCallout(this.t().secret1Reward, 3.6);
      this.emitWorldCoinFly(this.lighthouseRelic.x, ry + 1.8, this.lighthouseRelic.z, 5);
      this.onSecretComplete?.('lighthouse');
      this.emitHud();
    }

    // 2. Secret Quest 2: Eye of the Maelstrom (Wave Surge leap directly over any whirlpool center)
    if (!this.triggeredSecrets.has('maelstrom')) {
      const surgeCenter = isSurgeOverMaelstrom(
        this.ship.x,
        this.ship.z,
        this.ship.surgeY,
        this.whirlpools,
      );
      if (surgeCenter) {
        this.triggeredSecrets.add('maelstrom');
        const spec = SECRET_QUEST_SPECS.maelstrom;
        this.score += spec.rewardScore;
        this.runDoubloonsBonus += 25;
        this.portCooldown = 0;
        this.stbdCooldown = 0;

        const wy = sampleWaveHeight(surgeCenter.x, surgeCenter.z, this.elapsed, this.seaParams.waveHeight);
        this.audio.playBoarding();
        this.screenShake = Math.max(this.screenShake, 0.85);
        this.spawnBurst(surgeCenter.x, wy + 2.2, surgeCenter.z, 0x7be0ff, 22);
        this.spawnRing(surgeCenter.x, wy + 0.8, surgeCenter.z, '#7BE0FF', 16, 0.65);
        this.spawnFloatingText(
          this.ship.x,
          this.ship.heave + 5.5,
          this.ship.z,
          this.t().secret2Title,
          '#8CE2FF',
          1.3,
        );

        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const d = Math.hypot(enemy.x - surgeCenter.x, enemy.z - surgeCenter.z);
          if (d < 34) {
            const dmg = 45;
            enemy.hp -= dmg;
            enemy.hitFlash = 1;
            enemy.squashY = 0.78;
            enemy.squashVel = 2.5;
            const ey = sampleWaveHeight(enemy.x, enemy.z, this.elapsed, this.seaParams.waveHeight);
            this.spawnFloatingText(enemy.x, ey + 4.8, enemy.z, `-${dmg}`, '#7BE0FF', 1.18);
            if (enemy.hp <= 0) {
              this.handleEnemyDefeated(enemy, ey, false);
            }
          }
        }

        this.setCallout(this.t().secret2Reward, 3.6);
        this.emitWorldCoinFly(surgeCenter.x, wy + 2.2, surgeCenter.z, 5);
        this.onSecretComplete?.('maelstrom');
        this.emitHud();
      }
    }

    // 3. Secret Quest 3: Lanterns of the Silent Shoals (Sail near all non-lighthouse headland braziers)
    if (!this.triggeredSecrets.has('shoals') && this.shoalSpots.length > 0) {
      const visit = checkShoalBrazierVisit(
        this.ship.x,
        this.ship.z,
        this.shoalSpots,
        this.litShoalIndices,
      );
      if (visit.newlyLitIndices.length > 0) {
        for (const idx of visit.newlyLitIndices) {
          this.litShoalIndices.add(idx);
          const spot = this.shoalSpots.find((s) => s.index === idx);
          if (spot) {
            this.headlands[spot.headlandIdx]?.setBrazierLit(true);
            const sy = sampleWaveHeight(spot.x, spot.z, this.elapsed, this.seaParams.waveHeight);
            this.audio.playPickup();
            this.spawnBurst(spot.x, sy + 9.2, spot.z, 0xffcb68, 14);
            this.spawnRing(spot.x, sy + 9.2, spot.z, '#FFD27D', 7.5, 0.5);
            this.spawnFloatingText(
              spot.x,
              sy + 11.4,
              spot.z,
              `${this.litShoalIndices.size}/${this.shoalSpots.length}`,
              '#FFE082',
              1.25,
            );
          }
        }

        if (visit.allLit) {
          this.triggeredSecrets.add('shoals');
          const spec = SECRET_QUEST_SPECS.shoals;
          this.score += spec.rewardScore;
          this.runDoubloonsBonus += 30;
          this.ship = { ...this.ship, surgeCooldown: 0 };

          // Spawn two smugglers' golden crates near the vessel
          const fwdX = Math.sin(this.ship.heading);
          const fwdZ = -Math.cos(this.ship.heading);
          this.spawnProp('gold', this.ship.x + fwdX * 11 - fwdZ * 4, this.ship.z + fwdZ * 11 + fwdX * 4);
          this.spawnProp('gold', this.ship.x + fwdX * 11 + fwdZ * 4, this.ship.z + fwdZ * 11 - fwdX * 4);

          this.audio.playBoarding();
          this.screenShake = Math.max(this.screenShake, 0.65);
          this.setCallout(this.t().secret3Reward, 3.8);
          this.emitWorldCoinFly(this.ship.x, this.ship.heave + 2.4, this.ship.z, 6);
          this.onSecretComplete?.('shoals');
        } else {
          this.setCallout(
            `${this.t().calloutSecretProgress} (${this.litShoalIndices.size}/${this.shoalSpots.length})`,
            2.6,
          );
        }
        this.emitHud();
      }
    }

    // 4. Secret Quest 4: The Lighthouse Sweep (Fire broadside near the sunken bell inside lighthouse beam)
    if (
      this.beamBellProp &&
      !this.beamBellProp.completed &&
      !this.triggeredSecrets.has('beamBell') &&
      isBeamSweepingBell(
        this.lighthouseCenter,
        this.beamBellProp,
        beamRotY,
        this.ship.x,
        this.ship.z,
        this.broadsideFiredThisTick,
      )
    ) {
      this.beamBellProp.completed = true;
      this.beamBellProp.built.group.visible = false;
      this.triggeredSecrets.add('beamBell');
      const spec = SECRET_QUEST_SPECS.beamBell;
      this.score += spec.rewardScore;
      this.runDoubloonsBonus += 35;

      const by = sampleWaveHeight(
        this.beamBellProp.x,
        this.beamBellProp.z,
        this.elapsed,
        this.seaParams.waveHeight,
      );
      this.audio.playBoarding();
      this.screenShake = Math.max(this.screenShake, 0.72);
      this.spawnBurst(this.beamBellProp.x, by + 2.2, this.beamBellProp.z, 0xffe082, 22);
      this.spawnRing(this.beamBellProp.x, by + 0.8, this.beamBellProp.z, '#FFE082', 18, 0.65);
      this.spawnFloatingText(
        this.ship.x,
        this.ship.heave + 5.5,
        this.ship.z,
        this.t().secret4Title,
        '#FFE082',
        1.3,
      );

      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        if (Math.hypot(enemy.x - this.beamBellProp.x, enemy.z - this.beamBellProp.z) < 48) {
          const dmg = 28;
          enemy.hp -= dmg;
          enemy.hitFlash = 1;
          enemy.sailDebuffTimer = Math.max(enemy.sailDebuffTimer, 5.0);
          enemy.crewDebuffTimer = Math.max(enemy.crewDebuffTimer, 5.0);
          enemy.built.setSailDamaged(true);
          const ey = sampleWaveHeight(enemy.x, enemy.z, this.elapsed, this.seaParams.waveHeight);
          this.spawnFloatingText(enemy.x, ey + 4.8, enemy.z, `-${dmg}`, '#6CE8D6', 1.15);
          if (enemy.hp <= 0) {
            this.handleEnemyDefeated(enemy, ey, false);
          }
        }
      }

      this.setCallout(this.t().secret4Reward, 3.8);
      this.emitWorldCoinFly(this.beamBellProp.x, by + 2.2, this.beamBellProp.z, 6);
      this.onSecretComplete?.('beamBell');
      this.emitHud();
    }

    // 5. Secret Quest 5: Sunken Hulk at Fog Edge (Drop sails to 0% beside the sunken wreck)
    if (
      this.fogHulkProp &&
      !this.fogHulkProp.completed &&
      !this.triggeredSecrets.has('fogHulk')
    ) {
      const holdRes = stepFogHulkHold(
        this.fogHulkHoldSec,
        dt,
        this.ship.x,
        this.ship.z,
        this.ship.sailLevel,
        this.fogHulkProp,
      );
      this.fogHulkHoldSec = holdRes.holdSec;

      if (holdRes.inZoneMoving && !this.fogHulkPrompted) {
        this.fogHulkPrompted = true;
        this.setCallout(`${this.t().secret5Title} · ${this.t().calloutFogHulkAnchor}`, 2.8);
      } else if (!holdRes.inZoneMoving && !holdRes.inZoneAnchored) {
        this.fogHulkPrompted = false;
      }

      if (holdRes.triggered) {
        this.fogHulkProp.completed = true;
        this.fogHulkProp.built.group.visible = false;
        this.triggeredSecrets.add('fogHulk');

        const spec = SECRET_QUEST_SPECS.fogHulk;
        this.score += spec.rewardScore;
        this.runDoubloonsBonus += 40;
        this.hullHp = this.hullMaxHp;

        const fwdX = Math.sin(this.ship.heading);
        const fwdZ = -Math.cos(this.ship.heading);
        this.spawnProp('gold', this.ship.x + fwdX * 10, this.ship.z + fwdZ * 10);

        const hy = sampleWaveHeight(
          this.fogHulkProp.x,
          this.fogHulkProp.z,
          this.elapsed,
          this.seaParams.waveHeight,
        );
        this.audio.playBoarding();
        this.screenShake = Math.max(this.screenShake, 0.55);
        this.spawnBurst(this.fogHulkProp.x, hy + 2.5, this.fogHulkProp.z, 0x54f2a8, 22);
        this.spawnRing(this.fogHulkProp.x, hy + 0.8, this.fogHulkProp.z, '#54F2A8', 12, 0.6);
        this.spawnFloatingText(
          this.ship.x,
          this.ship.heave + 5.4,
          this.ship.z,
          `${this.t().secret5Title} (100%)`,
          '#54F2A8',
          1.28,
        );
        this.setCallout(this.t().secret5Reward, 3.8);
        this.emitWorldCoinFly(this.fogHulkProp.x, hy + 2.5, this.fogHulkProp.z, 6);
        this.onSecretComplete?.('fogHulk');
        this.emitHud();
      }
    }

    // 8. Secret Quest 8: Passage of Shadows (Thread all 3 channel buoys under one Phantom Smoke veil)
    if (!this.triggeredSecrets.has('shadowStrait') && this.shadowStraitBuoys.length > 0) {
      const passRes = stepShadowStraitPass(
        this.shadowStraitBuoys,
        this.litShadowStraitIndices,
        this.ship.x,
        this.ship.z,
        this.abilities.smokeTimer > 0,
      );
      if (passRes.reset) {
        this.litShadowStraitIndices.clear();
        for (const sb of this.shadowStraitBuoys) sb.built.setHighlight?.(false);
        this.setCallout(this.t().calloutShadowReset, 2.5);
        this.emitHud();
      } else if (passRes.newlyLitIndices.length > 0) {
        for (const idx of passRes.newlyLitIndices) {
          this.litShadowStraitIndices.add(idx);
          const sb = this.shadowStraitBuoys.find((b) => b.index === idx);
          if (sb) {
            sb.built.setHighlight?.(true);
            const by = sampleWaveHeight(sb.x, sb.z, this.elapsed, this.seaParams.waveHeight);
            this.audio.playPickup();
            this.spawnBurst(sb.x, by + 2.4, sb.z, 0x5ce8d8, 14);
            this.spawnRing(sb.x, by + 0.6, sb.z, '#5CE8D8', 8.0, 0.5);
            this.spawnFloatingText(
              sb.x,
              by + 4.8,
              sb.z,
              `${this.litShadowStraitIndices.size}/${this.shadowStraitBuoys.length}`,
              '#5CE8D8',
              1.25,
            );
          }
        }
        if (passRes.allLit) {
          this.triggeredSecrets.add('shadowStrait');
          for (const sb of this.shadowStraitBuoys) sb.built.group.visible = false;
          const spec = SECRET_QUEST_SPECS.shadowStrait;
          this.score += spec.rewardScore;
          this.runDoubloonsBonus += 40;
          this.abilities = gainStormRage(
            { ...this.abilities, harpoonCooldown: 0, smokeCooldown: 0 },
            35,
          );
          this.audio.playBoarding();
          this.screenShake = Math.max(this.screenShake, 0.6);
          this.spawnFloatingText(
            this.ship.x,
            this.ship.heave + 5.4,
            this.ship.z,
            this.t().secret8Title,
            '#5CE8D8',
            1.3,
          );
          this.setCallout(this.t().secret8Reward, 3.8);
          this.emitWorldCoinFly(this.ship.x, this.ship.heave + 2.4, this.ship.z, 6);
          this.onSecretComplete?.('shadowStrait');
        } else {
          this.setCallout(
            `${this.t().calloutShadowProgress} (${this.litShadowStraitIndices.size}/${this.shadowStraitBuoys.length})`,
            2.4,
          );
        }
        this.emitHud();
      }
    }

    // 9. Secret Quest 9: Eye of the Tempest (Cut through Storm Rift with Storm Wake Overdrive active)
    if (
      this.stormRiftProp &&
      !this.stormRiftProp.completed &&
      !this.triggeredSecrets.has('stormEye') &&
      didStormWakeShatterRift(
        this.ship.x,
        this.ship.z,
        this.abilities.stormWakeTimer > 0,
        this.broadsideFiredThisTick,
        this.stormRiftProp,
      )
    ) {
      this.stormRiftProp.completed = true;
      this.stormRiftProp.built.group.visible = false;
      this.triggeredSecrets.add('stormEye');

      const spec = SECRET_QUEST_SPECS.stormEye;
      this.score += spec.rewardScore;
      this.runDoubloonsBonus += 50;
      this.hullHp = Math.min(this.hullMaxHp, this.hullHp + 35);

      const ry = sampleWaveHeight(
        this.stormRiftProp.x,
        this.stormRiftProp.z,
        this.elapsed,
        this.seaParams.waveHeight,
      );
      this.lightningAlpha = 1.0;
      this.audio.playThunder();
      this.audio.playBoarding();
      this.screenShake = Math.max(this.screenShake, 0.95);
      this.spawnBurst(this.stormRiftProp.x, ry + 3.0, this.stormRiftProp.z, 0xffe082, 26);
      this.spawnRing(this.stormRiftProp.x, ry + 0.8, this.stormRiftProp.z, '#7BE0FF', 22, 0.72);
      this.spawnRing(this.stormRiftProp.x, ry + 1.0, this.stormRiftProp.z, '#FFE082', 16, 0.62);
      this.spawnFloatingText(
        this.ship.x,
        this.ship.heave + 5.6,
        this.ship.z,
        `${this.t().secret9Title} (+35 HP)`,
        '#FFE082',
        1.35,
      );

      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        if (Math.hypot(enemy.x - this.stormRiftProp.x, enemy.z - this.stormRiftProp.z) < 52) {
          const dmg = 38;
          enemy.hp -= dmg;
          enemy.hitFlash = 1;
          enemy.sailDebuffTimer = Math.max(enemy.sailDebuffTimer, 4.5);
          enemy.squashY = 0.76;
          enemy.squashVel = 2.6;
          const ey = sampleWaveHeight(enemy.x, enemy.z, this.elapsed, this.seaParams.waveHeight);
          this.spawnFloatingText(enemy.x, ey + 5.0, enemy.z, `-${dmg}`, '#FFE082', 1.2);
          if (enemy.hp <= 0) {
            this.handleEnemyDefeated(enemy, ey, false);
          }
        }
      }

      this.setCallout(this.t().secret9Reward, 4.0);
      this.emitWorldCoinFly(this.stormRiftProp.x, ry + 3.0, this.stormRiftProp.z, 7);
      this.onSecretComplete?.('stormEye');
      this.emitHud();
    }

    this.broadsideFiredThisTick = false;
  }

  private getStormIntensity(): number {
    const base =
      this.wave >= 2
        ? Math.min(1, Math.max(0.75, (this.seaParams.waveHeight - 0.75) / 1.4))
        : Math.min(1, Math.max(0, (this.seaParams.waveHeight - 1.35) / 0.85));
    return Math.min(1, base + WEATHER_SPECS[this.weather].stormBoost);
  }

  private detonateBarrel(prop: FloatingProp): void {
    if (!prop.alive) return;
    prop.alive = false;
    this.scene.remove(prop.built.group);

    const relicMods = computeRelicModifiers(this.activeRelics);
    this.spawnOilSlick(prop.x, prop.z, 9.2 * relicMods.aoeRadiusMult, true);
    const waterY = sampleWaveHeight(prop.x, prop.z, this.elapsed, this.seaParams.waveHeight);
    this.audio.playExplosion();
    this.screenShake = Math.max(this.screenShake, 1.05);
    this.hitstopTimer = Math.max(this.hitstopTimer, 0.052);
    this.spawnBurst(prop.x, waterY + 2, prop.z, 0xff5a2c, 22);
    this.spawnRing(prop.x, waterY + 0.8, prop.z, '#FF6B3D', 13, 0.55);
    this.spawnFloatingText(prop.x, waterY + 5.4, prop.z, this.t().combatBoom, '#FF8A42', 1.3);
    this.setCallout(this.t().calloutBarrelBoom, 2.8);

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - prop.x, enemy.z - prop.z);
      const dmg = computeExplosionFalloff(d, 18 * relicMods.aoeRadiusMult, 52);
      if (dmg > 0) {
        enemy.hp -= dmg;
        enemy.hitFlash = 1;
        enemy.squashY = 0.78;
        enemy.squashVel = 2.6;
        this.score += 35;
        this.spawnFloatingText(enemy.x, waterY + 4.8, enemy.z, `-${dmg}`, '#FFB84D', 1.2);
        if (enemy.hp <= 0) {
          this.handleEnemyDefeated(enemy, waterY, false);
        }
      }
    }

    if (this.mode === 'playing' && !relicMods.barrelImmunity) {
      const dp = Math.hypot(this.ship.x - prop.x, this.ship.z - prop.z);
      const pdmg = computeExplosionFalloff(dp, 15, 26);
      if (pdmg > 0) {
        this.hullHp = Math.max(0, this.hullHp - pdmg);
        this.ship = { ...this.ship, squashY: 0.8, squashVel: 2.3 };
        this.spawnFloatingText(this.ship.x, this.ship.heave + 4.8, this.ship.z, `-${pdmg}`, '#FF5A4E', 1.15);
        if (this.hullHp <= 0) {
          this.triggerPlayerDefeat();
        }
      }
    }
  }

  private handleEnemyDefeated(enemy: EnemyShip, waterY: number, viaBoarding: boolean): void {
    if (!enemy.alive) return;
    enemy.alive = false;
    this.scene.remove(enemy.built.root);
    this.sunkCount += 1;
    if (BESTIARY_IDS.includes(enemy.archetype as BestiaryId)) {
      const bKey = enemy.archetype as BestiaryId;
      this.bestiaryKillsInRun[bKey] = (this.bestiaryKillsInRun[bKey] ?? 0) + 1;
    }
    if (enemy.archetype === 'kraken' || enemy.archetype === 'wraith') {
      this.monstersSunk += 1;
    }
    if (enemy.archetype === 'kraken') {
      this.onLogUnlock?.('logKrakenSlain');
    }
    this.spawnOilSlick(enemy.x, enemy.z, enemy.isBoss ? 11 : 7.5, false);
    const relicMods = computeRelicModifiers(this.activeRelics);
    if (relicMods.healPerKill > 0 && this.hullHp > 0) {
      this.hullHp = Math.min(this.hullMaxHp, this.hullHp + relicMods.healPerKill);
    }
    this.morale = Math.min(100, this.morale + 8);
    this.recomputePlayerStats();
    if (enemy.isBoss) {
      this.runBossesDefeated += 1;
      if (this.act === 1) this.onLogUnlock?.('logCrimsonFang');
      else if (this.act === 2) this.onLogUnlock?.('logAshenPyre');
      else if (this.act === 3) this.onLogUnlock?.('logBlackSovereign');
    }
    this.score += enemy.isBoss || enemy.archetype === 'kraken' ? 500 : enemy.archetype === 'seafort' ? 400 : 250;
    const nextStreak = stepComboStreak(this.comboStreak, this.comboTimer, 0, true);
    this.comboStreak = nextStreak.streak;
    this.comboTimer = nextStreak.timer;
    this.runBestCombo = Math.max(this.runBestCombo, this.comboStreak);
    if (this.comboStreak >= 2) {
      this.score += (this.comboStreak - 1) * 50;
    }
    const rageGainMult =
      computeContractModifiers(this.activeContracts).rageGainMult *
      relicMods.rageGainMult *
      computeEndlessMutatorModifiers(this.activeMutators).rageGainMult;
    this.abilities = gainStormRage(
      this.abilities,
      Math.round((viaBoarding ? 35 : 28) * rageGainMult),
    );
    if (this.abilities.harpoonTargetId === enemy.id) {
      this.abilities = { ...this.abilities, harpoonTargetId: null, harpoonActiveTimer: 0 };
    }
    this.screenShake = Math.max(this.screenShake, enemy.isBoss ? 1.25 : 0.95);
    this.hitstopTimer = Math.max(this.hitstopTimer, enemy.isBoss ? 0.068 : 0.048);
    this.emitWorldCoinFly(enemy.x, waterY + 2.4, enemy.z, viaBoarding ? 7 : enemy.isBoss ? 8 : 5);
    this.spawnBurst(enemy.x, waterY + 2, enemy.z, 0xff5a2c, enemy.isBoss ? 28 : 20);
    this.spawnRing(enemy.x, waterY + 0.6, enemy.z, '#FFB84D', enemy.isBoss ? 13 : 9.5, 0.65);

    if (enemy.archetype === 'fireship' && !viaBoarding) {
      this.detonateFireship(enemy);
    }

    const barkedCombo = this.comboStreak >= 2 ? this.tryOfficerBark('combo') : false;
    if (!viaBoarding) {
      this.spawnFloatingText(
        enemy.x,
        waterY + 6.5,
        enemy.z,
        this.t().combatSunk,
        '#FFD27D',
        enemy.isBoss ? 1.55 : 1.38,
      );
      if (!barkedCombo) {
        this.setCallout(this.t().calloutSunk, 3.0);
      }
    }

    // Drop glowing supply / powder / gold crate + occasional Message-in-a-Bottle
    const lootTable: Array<'repair' | 'powder' | 'gold'> = ['repair', 'powder', 'gold'];
    const lootKind = lootTable[this.sunkCount % lootTable.length];
    this.spawnProp(lootKind, enemy.x, enemy.z);
    if (!this.treasureSpot && this.sunkCount % 5 === 2) {
      this.spawnProp('bottle', enemy.x + 4, enemy.z - 3);
    }

    if (this.mode !== 'playing') return;
    const anyAlive = this.enemies.some((e) => e.alive);
    if (!anyAlive) {
      if (this.escortConvoy && this.escortConvoy.alive) {
        const reward = Math.round(90 * this.playerStats.doubloonGainMult);
        this.runDoubloonsBonus += reward;
        this.score += 450;
        const bonusRelic = pickRandomUnownedRelic(this.activeRelics, Math.random());
        if (bonusRelic) {
          this.activeRelics.push(bonusRelic);
          this.recomputePlayerStats();
        }
        this.onLogUnlock?.('logConvoyEscorted');
        this.emitWorldCoinFly(this.escortConvoy.x, 3, this.escortConvoy.z, 8);
        this.scene.remove(this.escortConvoy.built.root);
        this.escortConvoy = null;
        this.setCallout(this.et().barkConvoySafe, 3.8, 'bosun');
      }

      if (this.playMode === 'endless') {
        if ((this.wave + 1) % 3 === 0) {
          this.mutatorChoices = pickEndlessMutators(this.activeMutators, Math.random());
          this.pendingNextWaveMode = 'endlessNext';
          this.activeEncounterModal = 'mutator';
          this.keys.clear();
          this.touchSteer = 0;
          this.emitHud();
        } else if ((this.wave + 1) % 2 === 1) {
          this.routeChoices = pickRouteChoices(Math.random());
          this.pendingNextWaveMode = 'endlessNext';
          this.activeEncounterModal = 'route';
          this.keys.clear();
          this.touchSteer = 0;
          this.emitHud();
        } else {
          this.spawnEndlessNextWave();
        }
      } else if (this.wave === 1) {
        this.routeChoices = pickRouteChoices(Math.random());
        this.pendingNextWaveMode = 'campaignWave2';
        this.activeEncounterModal = 'route';
        this.keys.clear();
        this.touchSteer = 0;
        this.emitHud();
      } else {
        this.score += 800;
        this.setCallout(this.t().calloutVictory, 4.0);
        this.onActComplete?.({
          act: this.act,
          score: this.score,
          sunkCount: this.sunkCount,
          boardedCount: this.boardedCount,
          bonusGoldCollected: this.runDoubloonsBonus,
          bossesDefeatedInRun: this.runBossesDefeated,
          bestComboInRun: this.runBestCombo,
          milesSailed: Number(this.milesSailed.toFixed(1)),
          shotsFired: this.shotsFired,
          shotsHit: this.shotsHit,
          morale: Math.round(this.morale),
          bestiaryKillsInRun: { ...this.bestiaryKillsInRun },
        });
        this.setMode('victory');
      }
    }
  }

  private resolveCollisions(): void {
    // 1. Player vs. Enemy ships (hard separation + ramming/scraping damage)
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const col = resolveShipPairCollision(
        {
          x: this.ship.x,
          z: this.ship.z,
          heading: this.ship.heading,
          speed: this.ship.speed,
          surgeY: this.ship.surgeY,
        },
        {
          x: enemy.x,
          z: enemy.z,
          heading: enemy.heading,
          speed: enemy.currentSpeed,
        },
        enemy.isBoss ? 2.75 : 2.15,
        enemy.isBoss ? 3.0 : 2.35,
      );
      if (!col) continue;

      this.ship = {
        ...this.ship,
        x: col.ax,
        z: col.az,
        speed: Math.min(this.ship.speed, Math.max(1.6, this.ship.speed * 0.44)),
        squashY: 0.8,
        squashVel: 2.5,
      };
      enemy.x = col.bx;
      enemy.z = col.bz;
      enemy.currentSpeed = Math.max(1.4, enemy.currentSpeed * 0.42);
      enemy.squashY = 0.8;
      enemy.squashVel = 2.5;

      if (enemy.playerCollisionCooldown <= 0) {
        enemy.playerCollisionCooldown = 0.65;
        const waterY = sampleWaveHeight(
          col.contactX,
          col.contactZ,
          this.elapsed,
          this.seaParams.waveHeight,
        );
        const heavy = col.aRamming || col.bRamming || col.closingSpeed > 6.5;
        this.audio.playCollision(heavy);
        this.screenShake = Math.max(this.screenShake, heavy ? 0.78 : 0.48);
        if (heavy) {
          this.hitstopTimer = Math.max(this.hitstopTimer, 0.036);
        }
        this.spawnBurst(col.contactX, waterY + 1.5, col.contactZ, 0xffb259, heavy ? 14 : 9);
        this.spawnSplinters(col.contactX, waterY + 1.4, col.contactZ, heavy ? 12 : 7);
        this.spawnRing(
          col.contactX,
          waterY + 0.6,
          col.contactZ,
          col.aRamming ? '#FFB84D' : '#FF6B3D',
          heavy ? 6.4 : 4.2,
          0.42,
        );

        if (this.mode === 'playing') {
          if (enemy.archetype === 'fireship') {
            this.handleEnemyDefeated(enemy, waterY, false);
            continue;
          }

          const stormRamMult = this.abilities.stormWakeTimer > 0 ? 2.2 : 1;
          const rogueLift = sampleRogueWaveOffset(this.ship.x, this.ship.z, this.rogueWave);
          const plungingMult = computePlungingRamBonus(this.ship.surgeY, rogueLift);
          const ramDmgToEnemy = Math.round(
            col.damageToB * this.playerStats.ramBonusMult * stormRamMult * plungingMult,
          );
          const colReduction = computeRelicModifiers(this.activeRelics).collisionReduction;
          const ramSelfDmg = Math.round(
            (this.abilities.stormWakeTimer > 0 ? col.damageToA * 0.25 : col.damageToA) *
              (1 - colReduction),
          );
          enemy.hp -= ramDmgToEnemy;
          enemy.hitFlash = 1;
          this.score += col.aRamming ? 30 : 15;
          this.hullHp = Math.max(0, this.hullHp - ramSelfDmg);

          this.spawnFloatingText(
            enemy.x,
            waterY + 4.8,
            enemy.z,
            col.aRamming || stormRamMult > 1 || plungingMult > 1
              ? `${this.t().combatRam} -${ramDmgToEnemy}`
              : `-${ramDmgToEnemy}`,
            col.aRamming || stormRamMult > 1 || plungingMult > 1 ? '#FFB84D' : '#FFE0A3',
            col.aRamming || stormRamMult > 1 || plungingMult > 1 ? 1.25 : 1.05,
          );
          this.spawnFloatingText(
            this.ship.x,
            this.ship.heave + 4.4,
            this.ship.z,
            `-${ramSelfDmg}`,
            '#FF5A4E',
            1.1,
          );
          if (plungingMult >= 1.25 && col.aRamming) {
            this.setCallout(this.et().calloutPlungingRam, 2.8);
          } else {
            this.setCallout(this.t().calloutRam, 2.2);
          }

          if (enemy.hp <= 0) {
            this.handleEnemyDefeated(enemy, waterY, false);
          }
          if (this.hullHp <= 0 && this.mode === 'playing') {
            this.triggerPlayerDefeat();
          }
        }
      }
    }

    // 2. Enemy vs. Enemy ships (never ghost through each other)
    for (let i = 0; i < this.enemies.length; i += 1) {
      const a = this.enemies[i];
      if (!a.alive) continue;
      for (let j = i + 1; j < this.enemies.length; j += 1) {
        const b = this.enemies[j];
        if (!b.alive) continue;
        const col = resolveShipPairCollision(
          { x: a.x, z: a.z, heading: a.heading, speed: a.currentSpeed },
          { x: b.x, z: b.z, heading: b.heading, speed: b.currentSpeed },
        );
        if (!col) continue;
        a.x = col.ax;
        a.z = col.az;
        a.currentSpeed = Math.max(1.4, a.currentSpeed * 0.5);
        b.x = col.bx;
        b.z = col.bz;
        b.currentSpeed = Math.max(1.4, b.currentSpeed * 0.5);

        const pairKey = `${a.id}-${b.id}`;
        if (!this.enemyPairCooldowns.has(pairKey)) {
          this.enemyPairCooldowns.set(pairKey, 0.8);
          const waterY = sampleWaveHeight(
            col.contactX,
            col.contactZ,
            this.elapsed,
            this.seaParams.waveHeight,
          );
          this.spawnBurst(col.contactX, waterY + 1.2, col.contactZ, 0xff9e44, 6);
        }
      }
    }

    // 3. Player & Enemies vs. Coastal Headland Reefs
    for (const obs of this.headlandObstacles) {
      const playerHit = resolveStaticObstacleCollision(
        {
          x: this.ship.x,
          z: this.ship.z,
          heading: this.ship.heading,
          speed: this.ship.speed,
        },
        obs.x,
        obs.z,
        obs.radius,
      );
      if (playerHit) {
        const tangentHeading = normalizeAngle(Math.atan2(-playerHit.nz, -playerHit.nx));
        this.ship = {
          ...this.ship,
          x: playerHit.x,
          z: playerHit.z,
          heading: normalizeAngle(this.ship.heading + normalizeAngle(tangentHeading - this.ship.heading) * 0.25),
          speed: Math.min(this.ship.speed, Math.max(1.2, this.ship.speed * 0.36)),
          squashY: 0.82,
          squashVel: 2.3,
        };
        if (this.reefDamageCooldown <= 0) {
          this.reefDamageCooldown = 0.75;
          const waterY = sampleWaveHeight(
            playerHit.contactX,
            playerHit.contactZ,
            this.elapsed,
            this.seaParams.waveHeight,
          );
          this.audio.playCollision(false);
          this.screenShake = Math.max(this.screenShake, 0.55);
          this.spawnBurst(playerHit.contactX, waterY + 1.2, playerHit.contactZ, 0x9ab0d6, 9);
          this.spawnRing(playerHit.contactX, waterY + 0.5, playerHit.contactZ, '#FF7D4D', 4.5, 0.38);

          if (this.mode === 'playing') {
            const colReduction = computeRelicModifiers(this.activeRelics).collisionReduction;
            const reefDmg = Math.round(playerHit.damage * (1 - colReduction));
            this.hullHp = Math.max(0, this.hullHp - reefDmg);
            this.spawnFloatingText(
              this.ship.x,
              this.ship.heave + 4.6,
              this.ship.z,
              `${this.t().combatReef} -${reefDmg}`,
              '#FF6D4D',
              1.1,
            );
            this.setCallout(this.t().calloutReef, 2.2);
            if (this.hullHp <= 0) {
              this.triggerPlayerDefeat();
            }
          }
        }
      }

      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const eHit = resolveStaticObstacleCollision(
          { x: enemy.x, z: enemy.z, heading: enemy.heading, speed: enemy.currentSpeed },
          obs.x,
          obs.z,
          obs.radius,
        );
        if (eHit) {
          enemy.x = eHit.x;
          enemy.z = eHit.z;
          enemy.currentSpeed = Math.max(1.5, enemy.currentSpeed * 0.45);
        }
      }
    }
  }

  private projectToScreen(wx: number, wy: number, wz: number): { x: number; y: number; visible: boolean } {
    this.tmpVec.set(wx, wy, wz).project(this.camera);
    const w = this.vfxCanvas.width;
    const h = this.vfxCanvas.height;
    return {
      x: (this.tmpVec.x * 0.5 + 0.5) * w,
      y: (-this.tmpVec.y * 0.5 + 0.5) * h,
      visible: this.tmpVec.z >= -1 && this.tmpVec.z <= 1,
    };
  }

  private emitWorldCoinFly(wx: number, wy: number, wz: number, count = 5): void {
    const sp = this.projectToScreen(wx, wy, wz);
    if (!sp.visible) return;
    const rect = this.vfxCanvas.getBoundingClientRect();
    dispatchCoinFly(rect.left + sp.x, rect.top + sp.y, count);
  }

  private drawGlowHalo(x: number, y: number, radius: number, innerColor: string, outerColor: string): void {
    const key = `${innerColor}|${outerColor}`;
    let sprite = this.glowSpriteCache.get(key);
    if (!sprite) {
      if (this.glowSpriteCache.size >= 48) {
        this.glowSpriteCache.clear();
      }
      sprite = document.createElement('canvas');
      sprite.width = 64;
      sprite.height = 64;
      const sctx = sprite.getContext('2d');
      if (sctx) {
        const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, innerColor);
        grad.addColorStop(0.45, outerColor);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        sctx.fillStyle = grad;
        sctx.fillRect(0, 0, 64, 64);
      }
      this.glowSpriteCache.set(key, sprite);
    }
    this.vfxCtx.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2);
  }

  private renderAll(): void {
    if (!this.contextLost) {
      if (this.composer && !this.isSoftwareGl) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    }

    const ctx = this.vfxCtx;
    const w = this.vfxCanvas.width;
    const h = this.vfxCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // 1. Soft atmospheric Vignette + subtle twilight mesh rim (cached per viewport dimensions)
    if (!this.cachedVigGrad || this.cachedVigW !== w || this.cachedVigH !== h) {
      const vig = ctx.createRadialGradient(
        w * 0.5,
        h * 0.46,
        Math.min(w, h) * 0.36,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.76,
      );
      vig.addColorStop(0, 'rgba(5, 8, 20, 0)');
      vig.addColorStop(0.7, 'rgba(6, 10, 26, 0.06)');
      vig.addColorStop(1, 'rgba(4, 7, 18, 0.24)');
      this.cachedVigGrad = vig;
      this.cachedVigW = w;
      this.cachedVigH = h;
    }
    ctx.fillStyle = this.cachedVigGrad;
    ctx.fillRect(0, 0, w, h);

    // 1b. Subtle drifting golden twilight motes
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.ambientMotes.length; i += 1) {
      const m = this.ambientMotes[i];
      const mx = ((m.x + this.elapsed * m.speed) % 1) * w;
      const my = (m.y + Math.sin(this.elapsed * 0.7 + m.phase) * 0.025) * h;
      const alpha = 0.14 + 0.14 * Math.sin(this.elapsed * 1.9 + m.phase);
      ctx.fillStyle = `rgba(255, 206, 128, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(mx, my, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. Continuous dual V-Wake Ribbon behind ship (turquoise-gold glow during Storm Wake)
    if (this.wakeNodes.length >= 2) {
      const portPts: Array<{ x: number; y: number; alpha: number; storm: boolean }> = [];
      const stbdPts: Array<{ x: number; y: number; alpha: number; storm: boolean }> = [];
      for (let i = 0; i < this.wakeNodes.length; i += 1) {
        const node = this.wakeNodes[i];
        const prev = this.wakeNodes[Math.max(0, i - 1)];
        const next = this.wakeNodes[Math.min(this.wakeNodes.length - 1, i + 1)];
        const tx = next.x - prev.x;
        const tz = next.z - prev.z;
        const len = Math.max(0.01, Math.hypot(tx, tz));
        const nx = -tz / len;
        const nz = tx / len;
        const ratio = Math.max(0, Math.min(1, node.life / node.maxLife));
        const halfSpread = 1.05 + (1 - ratio) * (node.storm ? 4.4 : 3.2);
        const pL = this.projectToScreen(node.x - nx * halfSpread, node.y, node.z - nz * halfSpread);
        const pR = this.projectToScreen(node.x + nx * halfSpread, node.y, node.z + nz * halfSpread);
        if (pL.visible) {
          portPts.push({ x: pL.x, y: pL.y, alpha: ratio, storm: Boolean(node.storm) });
        }
        if (pR.visible) {
          stbdPts.push({ x: pR.x, y: pR.y, alpha: ratio, storm: Boolean(node.storm) });
        }
      }
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const pts of [portPts, stbdPts]) {
        for (let i = 1; i < pts.length; i += 1) {
          const a = pts[i - 1];
          const b = pts[i];
          const alpha = b.alpha * (b.storm ? 0.62 : 0.36);
          ctx.strokeStyle = b.storm
            ? `rgba(123, 224, 255, ${alpha.toFixed(3)})`
            : `rgba(176, 222, 250, ${alpha.toFixed(3)})`;
          ctx.lineWidth = (b.storm ? 4.2 : 2.8) + (1 - b.alpha) * 2.4;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 2a-0. Oil Slicks on water surface (dark iridescent sheen or flickering fire ring)
    for (const slick of this.oilSlicks) {
      const sy = sampleWaveHeight(slick.x, slick.z, this.elapsed, this.seaParams.waveHeight);
      const center = this.projectToScreen(slick.x, sy + 0.16, slick.z);
      const edge = this.projectToScreen(slick.x + slick.radius, sy + 0.16, slick.z);
      if (!center.visible) continue;
      const rx = Math.max(12, Math.min(115, Math.hypot(edge.x - center.x, edge.y - center.y)));
      const ry = rx * 0.56;
      ctx.save();
      if (slick.ignited) {
        const flicker = 0.42 + 0.18 * Math.sin(this.elapsed * 16 + slick.x);
        ctx.fillStyle = `rgba(255, 112, 36, ${(flicker * 0.42).toFixed(3)})`;
        ctx.strokeStyle = `rgba(255, 198, 86, ${(flicker + 0.25).toFixed(3)})`;
        ctx.lineWidth = 2.2;
      } else {
        const fade = Math.min(1, slick.life / Math.max(1, slick.maxLife));
        ctx.fillStyle = `rgba(24, 20, 38, ${(0.42 * fade).toFixed(3)})`;
        ctx.strokeStyle = `rgba(116, 98, 178, ${(0.38 * fade).toFixed(3)})`;
        ctx.lineWidth = 1.4;
      }
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 2a-1. Treasure X spot on water surface
    if (this.treasureSpot && !this.treasureSpot.collected) {
      const ty = sampleWaveHeight(this.treasureSpot.x, this.treasureSpot.z, this.elapsed, this.seaParams.waveHeight);
      const ts = this.projectToScreen(this.treasureSpot.x, ty + 0.3, this.treasureSpot.z);
      if (ts.visible) {
        const pulse = 1 + Math.sin(this.elapsed * 5.2) * 0.14;
        const r = 11 * pulse;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 224, 130, 0.94)';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ts.x - r, ts.y - r * 0.7);
        ctx.lineTo(ts.x + r, ts.y + r * 0.7);
        ctx.moveTo(ts.x + r, ts.y - r * 0.7);
        ctx.lineTo(ts.x - r, ts.y + r * 0.7);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 2a. Tactical Broadside Firing Arcs projected on the water surface during combat
    if (this.mode === 'playing') {
      this.renderBroadsideAimArcs(ctx);
    }

    // 3. Additive Bloom / Glow Halos & Ribbon Trails ('lighter')
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glowScale = Math.max(0.65, Math.min(1.35, this.bloomStrength / 0.26));

    // Player stern lantern glow (zero-alloc via tmpVec)
    this.playerBuilt.lanternWorldTarget.getWorldPosition(this.tmpVec);
    const plScreen = this.projectToScreen(this.tmpVec.x, this.tmpVec.y, this.tmpVec.z);
    if (plScreen.visible) {
      this.drawGlowHalo(
        plScreen.x,
        plScreen.y,
        26 * glowScale,
        'rgba(255, 220, 136, 0.42)',
        'rgba(255, 160, 56, 0.14)',
      );
    }

    // Lighthouse beacon glow & Secret Relic / Lit Shoal Brazier halos
    for (let i = 0; i < this.headlands.length; i += 1) {
      const h = this.headlands[i];
      if (i === 0) {
        h.beaconWorldTarget.getWorldPosition(this.tmpVec);
        const bScreen = this.projectToScreen(this.tmpVec.x, this.tmpVec.y, this.tmpVec.z);
        if (bScreen.visible) {
          this.drawGlowHalo(
            bScreen.x,
            bScreen.y,
            58 * glowScale,
            'rgba(255, 232, 165, 0.68)',
            'rgba(255, 178, 72, 0.22)',
          );
        }
      }
      if (h.brazierWorldTarget) {
        const spot = this.shoalSpots.find((s) => s.headlandIdx === i);
        const lit = spot ? this.litShoalIndices.has(spot.index) : false;
        h.brazierWorldTarget.getWorldPosition(this.tmpVec);
        const bs = this.projectToScreen(this.tmpVec.x, this.tmpVec.y, this.tmpVec.z);
        if (bs.visible) {
          this.drawGlowHalo(
            bs.x,
            bs.y,
            (lit ? 42 : 18) * glowScale,
            lit ? 'rgba(255, 224, 130, 0.78)' : 'rgba(138, 108, 210, 0.34)',
            lit ? 'rgba(255, 146, 48, 0.24)' : 'rgba(84, 58, 150, 0.1)',
          );
        }
      }
    }

    if (this.lighthouseRelic && !this.lighthouseRelic.collected) {
      this.lighthouseRelic.built.beaconWorldTarget.getWorldPosition(this.tmpVec);
      const rs = this.projectToScreen(this.tmpVec.x, this.tmpVec.y, this.tmpVec.z);
      if (rs.visible) {
        this.drawGlowHalo(
          rs.x,
          rs.y,
          36 * glowScale,
          'rgba(255, 232, 150, 0.8)',
          'rgba(255, 174, 62, 0.28)',
        );
      }
    }

    if (this.beamBellProp && !this.beamBellProp.completed) {
      this.beamBellProp.built.beaconWorldTarget.getWorldPosition(this.tmpVec);
      const bbs = this.projectToScreen(this.tmpVec.x, this.tmpVec.y, this.tmpVec.z);
      if (bbs.visible) {
        this.drawGlowHalo(
          bbs.x,
          bbs.y,
          34 * glowScale,
          'rgba(108, 232, 214, 0.78)',
          'rgba(60, 178, 170, 0.25)',
        );
      }
    }

    if (this.fogHulkProp && !this.fogHulkProp.completed) {
      this.fogHulkProp.built.beaconWorldTarget.getWorldPosition(this.tmpVec);
      const fhs = this.projectToScreen(this.tmpVec.x, this.tmpVec.y, this.tmpVec.z);
      if (fhs.visible) {
        this.drawGlowHalo(
          fhs.x,
          fhs.y,
          38 * glowScale,
          'rgba(84, 242, 168, 0.72)',
          'rgba(32, 165, 108, 0.24)',
        );
      }
    }

    if (this.stormBuoyProp && !this.stormBuoyProp.completed) {
      this.stormBuoyProp.built.beaconWorldTarget.getWorldPosition(this.tmpVec);
      const sbs = this.projectToScreen(this.tmpVec.x, this.tmpVec.y, this.tmpVec.z);
      if (sbs.visible) {
        this.drawGlowHalo(
          sbs.x,
          sbs.y,
          38 * glowScale,
          'rgba(140, 226, 255, 0.82)',
          'rgba(78, 168, 255, 0.26)',
        );
      }
    }

    // Enemy stern lanterns (archetype tinted) + floating prop beacons
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      enemy.built.lanternWorldTarget.getWorldPosition(this.tmpVec);
      const es = this.projectToScreen(this.tmpVec.x, this.tmpVec.y, this.tmpVec.z);
      if (es.visible) {
        const inner =
          enemy.archetype === 'healer'
            ? 'rgba(62, 240, 156, 0.58)'
            : enemy.archetype === 'mortar'
              ? 'rgba(199, 107, 255, 0.58)'
              : enemy.archetype === 'fireship'
                ? 'rgba(255, 148, 48, 0.65)'
                : 'rgba(255, 110, 72, 0.52)';
        const outer =
          enemy.archetype === 'healer'
            ? 'rgba(32, 168, 102, 0.18)'
            : enemy.archetype === 'mortar'
              ? 'rgba(130, 56, 200, 0.18)'
              : 'rgba(218, 48, 38, 0.16)';
        this.drawGlowHalo(es.x, es.y, (enemy.isBoss ? 44 : 28) * glowScale, inner, outer);
      }
    }

    for (const prop of this.floatingProps) {
      if (!prop.alive) continue;
      prop.built.beaconWorldTarget.getWorldPosition(this.tmpVec);
      const ps = this.projectToScreen(this.tmpVec.x, this.tmpVec.y, this.tmpVec.z);
      if (ps.visible) {
        this.drawGlowHalo(
          ps.x,
          ps.y,
          26 * glowScale,
          prop.built.glowInner,
          prop.built.glowOuter,
        );
      }
    }

    for (const ws of this.wreckageSites) {
      if (!ws.active) continue;
      ws.built.beaconWorldTarget.getWorldPosition(this.tmpVec);
      const wps = this.projectToScreen(this.tmpVec.x, this.tmpVec.y, this.tmpVec.z);
      if (wps.visible) {
        this.drawGlowHalo(
          wps.x,
          wps.y,
          36 * glowScale,
          'rgba(255, 224, 130, 0.78)',
          'rgba(244, 178, 56, 0.25)',
        );
      }
    }

    if (this.merchantSite && this.merchantSite.active) {
      this.merchantSite.built.beaconWorldTarget.getWorldPosition(this.tmpVec);
      const ms = this.projectToScreen(this.tmpVec.x, this.tmpVec.y, this.tmpVec.z);
      if (ms.visible) {
        this.drawGlowHalo(
          ms.x,
          ms.y,
          40 * glowScale,
          'rgba(84, 242, 168, 0.78)',
          'rgba(255, 214, 112, 0.26)',
        );
      }
    }

    // Grapple rope burst VFX during boarding
    if (this.grappleVfx) {
      const aScreen = this.projectToScreen(this.grappleVfx.ax, 2.4, this.grappleVfx.az);
      const bScreen = this.projectToScreen(this.grappleVfx.bx, 2.4, this.grappleVfx.bz);
      if (aScreen.visible && bScreen.visible) {
        ctx.strokeStyle = 'rgba(255, 224, 130, 0.92)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(aScreen.x, aScreen.y);
        ctx.lineTo(bScreen.x, bScreen.y);
        ctx.stroke();
      }
    }

    // Active Harpoon Chain Tether (catenary glowing links + target vulnerability reticle)
    if (this.abilities.harpoonActiveTimer > 0 && this.abilities.harpoonTargetId !== null) {
      const chestTarget =
        this.abilities.harpoonTargetId === HARPOON_CHEST_TARGET_ID &&
        this.reefChestProp &&
        !this.reefChestProp.completed
          ? this.reefChestProp
          : null;
      const enemyTarget =
        !chestTarget
          ? this.enemies.find((e) => e.id === this.abilities.harpoonTargetId && e.alive) ?? null
          : null;
      const anchorTarget = chestTarget ?? enemyTarget;

      if (anchorTarget) {
        const bowX = this.ship.x + Math.sin(this.ship.heading) * 4.4;
        const bowZ = this.ship.z - Math.cos(this.ship.heading) * 4.4;
        const ey = sampleWaveHeight(anchorTarget.x, anchorTarget.z, this.elapsed, this.seaParams.waveHeight);
        const aScreen = this.projectToScreen(bowX, this.ship.heave + 1.35, bowZ);
        const bScreen = this.projectToScreen(anchorTarget.x, ey + 1.45, anchorTarget.z);
        if (aScreen.visible && bScreen.visible) {
          const midX = (aScreen.x + bScreen.x) * 0.5;
          const dist2d = Math.hypot(bScreen.x - aScreen.x, bScreen.y - aScreen.y);
          const sag = Math.min(34, dist2d * 0.14);
          const midY = (aScreen.y + bScreen.y) * 0.5 + sag;

          // Molten golden-copper chain core
          ctx.strokeStyle = chestTarget ? 'rgba(62, 240, 156, 0.9)' : 'rgba(255, 196, 86, 0.88)';
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(aScreen.x, aScreen.y);
          ctx.quadraticCurveTo(midX, midY, bScreen.x, bScreen.y);
          ctx.stroke();

          // Shimmering individual chain links
          const links = 14;
          for (let li = 1; li < links; li += 1) {
            const u = li / links;
            const inv = 1 - u;
            const lx = inv * inv * aScreen.x + 2 * inv * u * midX + u * u * bScreen.x;
            const ly = inv * inv * aScreen.y + 2 * inv * u * midY + u * u * bScreen.y;
            const shimmer = 0.55 + 0.45 * Math.sin(this.elapsed * 16 - li * 0.7);
            ctx.fillStyle = `rgba(255, 240, 185, ${shimmer.toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(lx, ly, li % 2 === 0 ? 2.6 : 1.9, 0, Math.PI * 2);
            ctx.fill();
          }

          // Copper / emerald lock ring around target
          this.drawGlowHalo(
            bScreen.x,
            bScreen.y,
            34 * glowScale,
            chestTarget ? 'rgba(62, 240, 156, 0.65)' : 'rgba(255, 200, 95, 0.65)',
            chestTarget ? 'rgba(20, 140, 90, 0.22)' : 'rgba(235, 110, 42, 0.2)',
          );
          ctx.save();
          ctx.translate(bScreen.x, bScreen.y);
          ctx.rotate(this.elapsed * 1.8);
          ctx.strokeStyle = chestTarget ? 'rgba(130, 255, 200, 0.92)' : 'rgba(255, 214, 112, 0.9)';
          ctx.lineWidth = 2;
          const rLock = 22;
          ctx.beginPath();
          ctx.arc(0, 0, rLock, 0, Math.PI * 0.35);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, rLock, Math.PI * 0.5, Math.PI * 0.85);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, rLock, Math.PI, Math.PI * 1.35);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, rLock, Math.PI * 1.5, Math.PI * 1.85);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Projectile glowing trails & bloom orbs
    for (const proj of this.projectiles) {
      const head = this.projectToScreen(proj.x, proj.y, proj.z);
      if (proj.trail.length >= 2) {
        ctx.strokeStyle = proj.fromEnemy
          ? 'rgba(255, 78, 56, 0.72)'
          : proj.ammo === 'cursed'
            ? 'rgba(199, 125, 255, 0.85)'
            : proj.ammo === 'harpoonBolt'
              ? 'rgba(92, 232, 216, 0.85)'
              : proj.ammo === 'mortar'
                ? 'rgba(255, 168, 72, 0.88)'
                : proj.crestBoosted
                  ? 'rgba(255, 206, 98, 0.85)'
                  : proj.ammo === 'chain'
                    ? 'rgba(123, 224, 255, 0.78)'
                    : 'rgba(255, 152, 64, 0.72)';
        ctx.lineWidth = proj.crestBoosted ? 4.2 : 2.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        let started = false;
        for (const pt of proj.trail) {
          const sp = this.projectToScreen(pt.x, pt.y, pt.z);
          if (!sp.visible) continue;
          if (!started) {
            ctx.moveTo(sp.x, sp.y);
            started = true;
          } else {
            ctx.lineTo(sp.x, sp.y);
          }
        }
        ctx.stroke();
      }
      if (head.visible) {
        this.drawGlowHalo(
          head.x,
          head.y,
          (proj.crestBoosted ? 36 : 26) * glowScale,
          proj.fromEnemy ? 'rgba(255, 120, 90, 0.75)' : 'rgba(255, 232, 160, 0.85)',
          proj.fromEnemy ? 'rgba(220, 42, 32, 0.25)' : 'rgba(255, 148, 48, 0.28)',
        );
      }
    }

    // Chain Lightning jagged arcs
    for (const arc of this.lightningArcs) {
      const aScreen = this.projectToScreen(arc.ax, arc.ay, arc.az);
      const bScreen = this.projectToScreen(arc.bx, arc.by, arc.bz);
      if (!aScreen.visible || !bScreen.visible) continue;
      const alpha = Math.max(0, Math.min(1, arc.life / 0.28));
      ctx.strokeStyle = `rgba(140, 232, 255, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(aScreen.x, aScreen.y);
      const segs = 4;
      for (let s = 1; s < segs; s += 1) {
        const u = s / segs;
        const jx = (Math.random() - 0.5) * 18;
        const jy = (Math.random() - 0.5) * 18;
        ctx.lineTo(aScreen.x + (bScreen.x - aScreen.x) * u + jx, aScreen.y + (bScreen.y - aScreen.y) * u + jy);
      }
      ctx.lineTo(bScreen.x, bScreen.y);
      ctx.stroke();
    }

    // Expanding water-surface hit/muzzle shockwave ellipses
    for (const r of this.flashRings) {
      const sp = this.projectToScreen(r.x, r.y, r.z);
      if (!sp.visible) continue;
      const prog = 1 - r.life / r.maxLife;
      const rad = (7 + prog * r.maxRadius * 11) * glowScale;
      ctx.globalAlpha = Math.max(0, 1 - prog);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3.2 * (1 - prog * 0.6);
      ctx.beginPath();
      ctx.ellipse(sp.x, sp.y, rad, rad * 0.56, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 3a. Mortar Strike Target Water Zones (projected ellipses with countdown fill)
    for (const mz of this.mortarZones) {
      const wy = sampleWaveHeight(mz.x, mz.z, this.elapsed, this.seaParams.waveHeight);
      const center = this.projectToScreen(mz.x, wy + 0.25, mz.z);
      const edge = this.projectToScreen(mz.x + mz.radius, wy + 0.25, mz.z);
      if (!center.visible) continue;
      const rx = Math.max(14, Math.min(130, Math.hypot(edge.x - center.x, edge.y - center.y)));
      const ry = rx * 0.56;
      const prog = 1 - Math.max(0, mz.timer / mz.maxTimer);

      ctx.save();
      ctx.strokeStyle = 'rgba(224, 120, 255, 0.92)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(199, 107, 255, 0.24)';
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, rx * prog, ry * prog, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3b. Dynamic Storm Rain Streaks & Lightning Flash
    const stormLevel = this.getStormIntensity();
    if (stormLevel > 0.12) {
      const count = Math.round(stormLevel * this.rainStreaks.length);
      ctx.save();
      ctx.strokeStyle = `rgba(170, 208, 255, ${(0.12 + stormLevel * 0.18).toFixed(3)})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (let i = 0; i < count; i += 1) {
        const s = this.rainStreaks[i];
        const rx = ((s.x + this.elapsed * 0.12 * s.speed) % 1) * w;
        const ry = ((s.y + this.elapsed * 1.45 * s.speed) % 1) * h;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 5, ry + s.len);
      }
      ctx.stroke();
      ctx.restore();
    }
    if (this.lightningAlpha > 0.01) {
      ctx.fillStyle = `rgba(210, 228, 255, ${(this.lightningAlpha * 0.36).toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
    }

    // 4. Floating enemy HP bars, attack telegraphs, boarding brackets & combat text
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const ey = sampleWaveHeight(enemy.x, enemy.z, this.elapsed, this.seaParams.waveHeight);
      const boardable =
        this.mode === 'playing' &&
        enemy.archetype !== 'seafort' &&
        enemy.archetype !== 'kraken' &&
        canBoardEnemy(
          this.ship.x,
          this.ship.z,
          enemy.x,
          enemy.z,
          enemy.hp,
          enemy.maxHp,
          enemy.sailDebuffTimer,
          enemy.isBoss ? 17.0 : 14.5,
        );

      if (enemy.telegraphTimer > 0.05) {
        const dangerPos = this.projectToScreen(enemy.x, ey + 2.2 * enemy.scale, enemy.z);
        if (dangerPos.visible) {
          const pulse = 1 + Math.sin(this.elapsed * 28) * 0.14;
          const r = (20 + enemy.telegraphTimer * 10) * enemy.scale * pulse;
          ctx.save();
          ctx.strokeStyle = `rgba(255, 72, 54, ${(0.45 + enemy.telegraphTimer * 0.5).toFixed(3)})`;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.ellipse(dangerPos.x, dangerPos.y, r, r * 0.58, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      if (boardable) {
        const bp = this.projectToScreen(enemy.x, ey + 2.6 * enemy.scale, enemy.z);
        if (bp.visible) {
          const rot = this.elapsed * 1.9;
          const size = 20 * enemy.scale;
          ctx.save();
          ctx.translate(bp.x, bp.y);
          ctx.rotate(rot);
          ctx.strokeStyle = 'rgba(255, 214, 112, 0.94)';
          ctx.lineWidth = 2.4;
          ctx.strokeRect(-size * 0.5, -size * 0.5, size, size);
          ctx.restore();
        }
      }

      const showShield = (enemy.archetype === 'wraith' || enemy.archetype === 'kraken') && !enemy.shieldBroken;
      if (enemy.hp >= enemy.maxHp && !showShield) continue;
      const sp = this.projectToScreen(enemy.x, ey + (enemy.isBoss ? 12.2 : 8.8), enemy.z);
      if (!sp.visible) continue;
      const barW = enemy.isBoss || enemy.archetype === 'kraken' ? 86 : 54;
      const ratio = Math.max(0, enemy.hp / enemy.maxHp);
      ctx.fillStyle = 'rgba(7, 11, 24, 0.78)';
      ctx.fillRect(sp.x - barW / 2 - 1, sp.y - 1, barW + 2, 7);
      ctx.fillStyle = showShield ? '#62F2FF' : enemy.isBoss ? '#F4C97A' : '#D94336';
      ctx.fillRect(sp.x - barW / 2, sp.y, barW * ratio, 5);
    }

    // Escort Convoy emerald HP bar
    if (this.escortConvoy && this.escortConvoy.alive) {
      const cy = sampleWaveHeight(
        this.escortConvoy.x,
        this.escortConvoy.z,
        this.elapsed,
        this.seaParams.waveHeight,
      );
      const cp = this.projectToScreen(this.escortConvoy.x, cy + 8.6, this.escortConvoy.z);
      if (cp.visible) {
        const barW = 62;
        const ratio = Math.max(0, this.escortConvoy.hp / this.escortConvoy.maxHp);
        ctx.fillStyle = 'rgba(7, 11, 24, 0.8)';
        ctx.fillRect(cp.x - barW / 2 - 1, cp.y - 1, barW + 2, 7);
        ctx.fillStyle = '#54F2A8';
        ctx.fillRect(cp.x - barW / 2, cp.y, barW * ratio, 5);
      }
    }

    // Offscreen directional threat chevrons for offscreen alive enemies
    if (this.mode === 'playing') {
      const cxV = w * 0.5;
      const cyV = h * 0.5;
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const sp = this.projectToScreen(enemy.x, 3.0, enemy.z);
        if (sp.visible && sp.x >= 24 && sp.x <= w - 24 && sp.y >= 96 && sp.y <= h - 108) {
          continue;
        }
        const dx = sp.visible ? sp.x - cxV : -(sp.x - cxV);
        const dy = sp.visible ? sp.y - cyV : -(sp.y - cyV);
        const ang = Math.atan2(dy, dx);
        const rx = Math.max(34, Math.min(w - 34, cxV + Math.cos(ang) * (w * 0.44)));
        const ry = Math.max(106, Math.min(h - 114, cyV + Math.sin(ang) * (h * 0.39)));
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(ang);
        ctx.fillStyle = enemy.isBoss ? 'rgba(255, 184, 77, 0.88)' : 'rgba(255, 86, 68, 0.78)';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-5, -5);
        ctx.lineTo(-2, 0);
        ctx.lineTo(-5, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.textAlign = 'center';
    for (const ft of this.floatingTexts) {
      const sp = this.projectToScreen(ft.x, ft.y, ft.z);
      if (!sp.visible) continue;
      const alpha = Math.min(1, (ft.life / ft.maxLife) * 1.4);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `800 ${Math.round(19 * ft.scale)}px 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(5, 8, 20, 0.92)';
      ctx.strokeText(ft.text, sp.x, sp.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, sp.x, sp.y);
      ctx.restore();
    }

    // 5. Nautical Tactical Radar (during active voyage)
    if (this.mode === 'playing') {
      this.renderTacticalRadar(ctx, w, h);
    }
  }

  private renderBroadsideAimArcs(ctx: CanvasRenderingContext2D): void {
    const crestScore = computeWaveCrestScore(
      this.ship.x,
      this.ship.z,
      this.elapsed,
      this.seaParams.waveHeight,
    );
    const effectiveCrestThreshold = Math.max(
      0.32,
      this.seaParams.crestThreshold + this.playerStats.crestThresholdOffset,
    );
    const crestActive = this.abilities.stormWakeTimer > 0 || crestScore >= effectiveCrestThreshold;

    let portLocked = false;
    let stbdLocked = false;
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const align = computeBroadsideAlignment(
        this.ship.x,
        this.ship.z,
        this.ship.heading,
        enemy.x,
        enemy.z,
        48,
        0.44,
      );
      if (align.inPortArc) portLocked = true;
      if (align.inStbdArc) stbdLocked = true;
    }

    const rInner = 4.0;
    const rOuter = 22;
    const halfAngle = 0.42;
    const steps = 12;

    for (const side of [-1, 1] as const) {
      const locked = side === -1 ? portLocked : stbdLocked;
      const cd = side === -1 ? this.portCooldown : this.stbdCooldown;
      const ready = cd <= 0.05;
      const baseAngle = this.ship.heading + (side === 1 ? Math.PI * 0.5 : -Math.PI * 0.5);
      // Forward = (sin(h), -cos(h)), Right = (cos(h), sin(h)) -> angle along water plane:
      // worldDirX = cos(phi) * rightX + sin(phi) * fwdX = side * cos(phi) * cos(h) + sin(phi) * sin(h)
      // Wait: simpler! Rotate ship's side vector (side*cos(h), side*sin(h)) by offset theta!
      const sideX = side * Math.cos(this.ship.heading);
      const sideZ = side * Math.sin(this.ship.heading);
      void baseAngle;

      const ptsOuter: Array<{ x: number; y: number }> = [];
      const ptsInner: Array<{ x: number; y: number }> = [];
      let allVisible = true;

      for (let i = 0; i <= steps; i += 1) {
        const theta = -halfAngle + (i / steps) * (halfAngle * 2);
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        const dx = sideX * c - sideZ * s;
        const dz = sideX * s + sideZ * c;

        const ox = this.ship.x + dx * rOuter;
        const oz = this.ship.z + dz * rOuter;
        const oy = sampleWaveHeight(ox, oz, this.elapsed, this.seaParams.waveHeight) + 0.16;
        const po = this.projectToScreen(ox, oy, oz);

        const ix = this.ship.x + dx * rInner;
        const iz = this.ship.z + dz * rInner;
        const iy = sampleWaveHeight(ix, iz, this.elapsed, this.seaParams.waveHeight) + 0.16;
        const pi = this.projectToScreen(ix, iy, iz);

        if (!po.visible || !pi.visible) {
          allVisible = false;
          break;
        }
        ptsOuter.push({ x: po.x, y: po.y });
        ptsInner.push({ x: pi.x, y: pi.y });
      }

      if (!allVisible || ptsOuter.length < 2) continue;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(ptsInner[0].x, ptsInner[0].y);
      for (let i = 0; i < ptsOuter.length; i += 1) {
        ctx.lineTo(ptsOuter[i].x, ptsOuter[i].y);
      }
      for (let i = ptsInner.length - 1; i >= 0; i -= 1) {
        ctx.lineTo(ptsInner[i].x, ptsInner[i].y);
      }
      ctx.closePath();

      const fillAlpha = locked
        ? ready
          ? crestActive
            ? 0.2
            : 0.14
          : 0.06
        : ready
          ? crestActive
            ? 0.08
            : 0.045
          : 0.02;
      ctx.fillStyle = locked
        ? `rgba(255, 194, 82, ${fillAlpha})`
        : crestActive
          ? `rgba(244, 201, 122, ${fillAlpha})`
          : `rgba(123, 210, 255, ${fillAlpha})`;
      ctx.fill();

      ctx.setLineDash(locked ? [] : [6, 5]);
      ctx.lineWidth = locked ? 2.1 : 1.25;
      ctx.strokeStyle = locked
        ? ready
          ? 'rgba(255, 214, 112, 0.78)'
          : 'rgba(255, 176, 82, 0.36)'
        : ready
          ? crestActive
            ? 'rgba(255, 212, 128, 0.36)'
            : 'rgba(130, 212, 255, 0.24)'
          : 'rgba(130, 168, 210, 0.12)';
      ctx.beginPath();
      ctx.moveTo(ptsInner[0].x, ptsInner[0].y);
      ctx.lineTo(ptsOuter[0].x, ptsOuter[0].y);
      for (let i = 1; i < ptsOuter.length; i += 1) {
        ctx.lineTo(ptsOuter[i].x, ptsOuter[i].y);
      }
      ctx.lineTo(ptsInner[ptsInner.length - 1].x, ptsInner[ptsInner.length - 1].y);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderTacticalRadar(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const { cx, cy, radius, scale } = this.getRadarGeometry(w, h);

    ctx.save();
    // Obsidian chart disc + concentric range rings (cached per radar geometry)
    if (
      !this.cachedRadarBgGrad ||
      this.cachedRadarCx !== cx ||
      this.cachedRadarCy !== cy ||
      this.cachedRadarR !== radius
    ) {
      const bgGrad = ctx.createRadialGradient(cx, cy - radius * 0.25, 2, cx, cy, radius);
      bgGrad.addColorStop(0, 'rgba(18, 28, 62, 0.86)');
      bgGrad.addColorStop(1, 'rgba(5, 8, 20, 0.92)');
      this.cachedRadarBgGrad = bgGrad;
      this.cachedRadarCx = cx;
      this.cachedRadarCy = cy;
      this.cachedRadarR = radius;
    }
    ctx.fillStyle = this.cachedRadarBgGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(244, 201, 122, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(244, 201, 122, 0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - radius + 4, cy);
    ctx.lineTo(cx + radius - 4, cy);
    ctx.moveTo(cx, cy - radius + 4);
    ctx.lineTo(cx, cy + radius - 4);
    ctx.stroke();

    // Clip objects cleanly inside chart circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
    ctx.clip();

    // Headland reefs
    ctx.fillStyle = 'rgba(148, 166, 198, 0.65)';
    for (const obs of this.headlandObstacles) {
      const rx = cx + obs.x * scale;
      const ry = cy + obs.z * scale;
      ctx.beginPath();
      ctx.arc(rx, ry, Math.max(2.5, obs.radius * scale), 0, Math.PI * 2);
      ctx.fill();
    }

    // Whirlpools (cyan spiral vector icon)
    ctx.strokeStyle = 'rgba(110, 210, 255, 0.85)';
    ctx.lineWidth = 1.3;
    for (const wp of this.whirlpools) {
      const wx = cx + wp.x * scale;
      const wy = cy + wp.z * scale;
      ctx.beginPath();
      ctx.arc(wx, wy, 4.6, this.elapsed * 2, this.elapsed * 2 + Math.PI * 1.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(wx, wy, 2.3, this.elapsed * 2 + 1.2, this.elapsed * 2 + 1.2 + Math.PI * 1.3);
      ctx.stroke();
    }

    // Subtle proximity shimmer for undiscovered Secret Quests (< 64m)
    const glintPulse = 0.55 + 0.45 * Math.sin(this.elapsed * 5.2);
    const drawSecretGlint = (sx: number, sz: number, color: string) => {
      if (Math.hypot(sx - this.ship.x, sz - this.ship.z) > 64) return;
      const gx = cx + sx * scale;
      const gy = cy + sz * scale;
      ctx.save();
      ctx.fillStyle = color;
      ctx.globalAlpha = glintPulse;
      ctx.beginPath();
      ctx.moveTo(gx, gy - 4);
      ctx.lineTo(gx + 3, gy);
      ctx.lineTo(gx, gy + 4);
      ctx.lineTo(gx - 3, gy);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    if (this.lighthouseRelic && !this.lighthouseRelic.collected) {
      drawSecretGlint(this.lighthouseRelic.x, this.lighthouseRelic.z, '#FFE082');
    }
    if (!this.triggeredSecrets.has('shoals')) {
      for (const spot of this.shoalSpots) {
        if (!this.litShoalIndices.has(spot.index)) {
          drawSecretGlint(spot.x, spot.z, '#FFD27D');
        }
      }
    }
    if (!this.triggeredSecrets.has('maelstrom')) {
      for (const wp of this.whirlpools) {
        drawSecretGlint(wp.x, wp.z, '#7BE0FF');
      }
    }
    if (this.beamBellProp && !this.beamBellProp.completed) {
      drawSecretGlint(this.beamBellProp.x, this.beamBellProp.z, '#6CE8D6');
    }
    if (this.fogHulkProp && !this.fogHulkProp.completed) {
      drawSecretGlint(this.fogHulkProp.x, this.fogHulkProp.z, '#54F2A8');
    }
    if (this.stormBuoyProp && !this.stormBuoyProp.completed) {
      drawSecretGlint(this.stormBuoyProp.x, this.stormBuoyProp.z, '#9CE6FF');
    }
    if (this.reefChestProp && !this.reefChestProp.completed) {
      drawSecretGlint(this.reefChestProp.x, this.reefChestProp.z, '#3EF09C');
    }
    if (!this.triggeredSecrets.has('shadowStrait')) {
      for (const sb of this.shadowStraitBuoys) {
        if (!this.litShadowStraitIndices.has(sb.index)) {
          drawSecretGlint(sb.x, sb.z, '#5CE8D8');
        }
      }
    }
    if (this.stormRiftProp && !this.stormRiftProp.completed) {
      drawSecretGlint(this.stormRiftProp.x, this.stormRiftProp.z, '#FFE082');
    }

    // Barrels & loot crates (gold crates drawn as mini chests)
    for (const prop of this.floatingProps) {
      if (!prop.alive) continue;
      const px = cx + prop.x * scale;
      const py = cy + prop.z * scale;
      if (prop.kind === 'gold') {
        ctx.fillStyle = '#FFD257';
        ctx.fillRect(px - 2.4, py - 1.8, 4.8, 3.6);
        ctx.fillStyle = '#8C5216';
        ctx.fillRect(px - 2.4, py - 0.3, 4.8, 0.8);
      } else {
        ctx.fillStyle =
          prop.kind === 'barrel' ? '#FF7D4D' : prop.kind === 'repair' ? '#54F2A8' : '#7BE0FF';
        ctx.fillRect(px - 1.6, py - 1.6, 3.2, 3.2);
      }
    }

    // Drifting Wreckage clusters (Gold Chest vector icon)
    for (const ws of this.wreckageSites) {
      if (!ws.active) continue;
      const wx = cx + ws.x * scale;
      const wy = cy + ws.z * scale;
      ctx.fillStyle = '#FFD257';
      ctx.fillRect(wx - 3.2, wy - 2.4, 6.4, 4.8);
      ctx.strokeStyle = '#6B3B0C';
      ctx.lineWidth = 1;
      ctx.strokeRect(wx - 3.2, wy - 2.4, 6.4, 4.8);
      ctx.fillStyle = '#FFF7D6';
      ctx.fillRect(wx - 0.8, wy - 0.6, 1.6, 1.4);
    }

    // Floating Armed Sea-Mine Buoys (crimson spiked dots)
    for (const fm of this.floatingMines) {
      if (!fm.alive) continue;
      const fx = cx + fm.x * scale;
      const fy = cy + fm.z * scale;
      ctx.strokeStyle = '#FF7B54';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fx - 2.8, fy);
      ctx.lineTo(fx + 2.8, fy);
      ctx.moveTo(fx, fy - 2.8);
      ctx.lineTo(fx, fy + 2.8);
      ctx.stroke();
      ctx.fillStyle = '#FF4238';
      ctx.beginPath();
      ctx.arc(fx, fy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Neutral Floating Merchant Brig (emerald-gold diamond badge)
    if (this.merchantSite && this.merchantSite.active) {
      const mx = cx + this.merchantSite.x * scale;
      const my = cy + this.merchantSite.z * scale;
      ctx.fillStyle = '#54F2A8';
      ctx.strokeStyle = '#FFE082';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(mx, my - 4.2);
      ctx.lineTo(mx + 3.8, my);
      ctx.lineTo(mx, my + 4.2);
      ctx.lineTo(mx - 3.8, my);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Treasure X spot on radar
    if (this.treasureSpot && !this.treasureSpot.collected) {
      const tx = cx + this.treasureSpot.x * scale;
      const ty = cy + this.treasureSpot.z * scale;
      ctx.strokeStyle = '#FFE082';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(tx - 3.2, ty - 3.2);
      ctx.lineTo(tx + 3.2, ty + 3.2);
      ctx.moveTo(tx + 3.2, ty - 3.2);
      ctx.lineTo(tx - 3.2, ty + 3.2);
      ctx.stroke();
    }

    // Escort Convoy Brig (emerald-white diamond badge)
    if (this.escortConvoy && this.escortConvoy.alive) {
      const ex = cx + this.escortConvoy.x * scale;
      const ey = cy + this.escortConvoy.z * scale;
      ctx.fillStyle = '#54F2A8';
      ctx.strokeStyle = '#FFF7E6';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(ex, ey - 3.8);
      ctx.lineTo(ex + 3.2, ey);
      ctx.lineTo(ex, ey + 3.8);
      ctx.lineTo(ex - 3.2, ey);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Mortar warning rings on radar
    ctx.strokeStyle = 'rgba(217, 140, 255, 0.85)';
    ctx.lineWidth = 1.2;
    for (const mz of this.mortarZones) {
      const mx = cx + mz.x * scale;
      const my = cy + mz.z * scale;
      ctx.beginPath();
      ctx.arc(mx, my, Math.max(2.6, mz.radius * scale), 0, Math.PI * 2);
      ctx.stroke();
    }

    // Enemy vessels color-coded by archetype + Skull vector icons for Boss / Kraken
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const ex = cx + enemy.x * scale;
      const ey = cy + enemy.z * scale;
      if (enemy.isBoss || enemy.archetype === 'kraken') {
        const col = enemy.archetype === 'kraken' ? '#62F2FF' : '#FFD257';
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(ex, ey - 0.8, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(ex - 2.0, ey + 1.4, 4.0, 2.2);
        ctx.fillStyle = '#090D1F';
        ctx.fillRect(ex - 1.7, ey - 1.6, 1.2, 1.3);
        ctx.fillRect(ex + 0.5, ey - 1.6, 1.2, 1.3);
      } else {
        ctx.fillStyle =
          enemy.archetype === 'seafort'
            ? '#F4A261'
            : enemy.archetype === 'wraith'
              ? '#7BE0FF'
              : enemy.archetype === 'fireship'
                ? '#FF8B2E'
                : enemy.archetype === 'mortar'
                  ? '#C76BFF'
                  : enemy.archetype === 'healer'
                    ? '#3EF09C'
                    : '#FF4D42';
        ctx.beginPath();
        ctx.arc(ex, ey, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const plX = cx + Math.max(-radius + 6, Math.min(radius - 6, this.ship.x * scale));
    const plY = cy + Math.max(-radius + 6, Math.min(radius - 6, this.ship.z * scale));

    // Plotted Course Waypoint (dashed golden route + pulsing crosshair)
    if (this.courseWaypoint) {
      const wpx = cx + Math.max(-radius + 5, Math.min(radius - 5, this.courseWaypoint.x * scale));
      const wpy = cy + Math.max(-radius + 5, Math.min(radius - 5, this.courseWaypoint.z * scale));
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(255, 210, 112, 0.82)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(plX, plY);
      ctx.lineTo(wpx, wpy);
      ctx.stroke();
      ctx.setLineDash([]);
      const pulse = 3.2 + Math.sin(this.elapsed * 6) * 0.9;
      ctx.strokeStyle = '#FFE082';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(wpx, wpy, pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#FFD257';
      ctx.beginPath();
      ctx.arc(wpx, wpy, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Player vessel chevron at real world coords
    ctx.translate(plX, plY);
    ctx.rotate(this.ship.heading);
    ctx.fillStyle = '#FFF7E6';
    ctx.beginPath();
    ctx.moveTo(0, -4.5);
    ctx.lineTo(3.4, 3.5);
    ctx.lineTo(0, 1.8);
    ctx.lineTo(-3.4, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private emitHud(): void {
    const { pointOfSail } = computeWindEfficiency(
      this.ship.heading,
      this.seaParams.windAngle,
      this.playerStats.headwindBoost,
    );
    const crestScore = computeWaveCrestScore(
      this.ship.x,
      this.ship.z,
      this.elapsed,
      this.seaParams.waveHeight,
    );
    const effectiveCrestThreshold = Math.max(
      0.32,
      this.seaParams.crestThreshold + this.playerStats.crestThresholdOffset,
    );
    const boss = this.enemies.find((e) => e.isBoss && e.alive);
    const boardTarget = this.mode === 'playing' ? this.findBoardableEnemy() : null;

    let offscreenTarget: OffscreenTargetIndicator | null = null;
    if (this.mode === 'playing') {
      let focusEnemy = boss ?? null;
      let focusDist = focusEnemy
        ? Math.hypot(focusEnemy.x - this.ship.x, focusEnemy.z - this.ship.z)
        : Infinity;
      if (!focusEnemy) {
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const d = Math.hypot(enemy.x - this.ship.x, enemy.z - this.ship.z);
          if (d < focusDist) {
            focusDist = d;
            focusEnemy = enemy;
          }
        }
      }
      if (focusEnemy) {
        this.tmpVec.set(focusEnemy.x, 3.2, focusEnemy.z).project(this.camera);
        const w = Math.max(1, this.vfxCanvas.width);
        const h = Math.max(1, this.vfxCanvas.height);
        const inFront = this.tmpVec.z >= -1 && this.tmpVec.z <= 1;
        const sx = (this.tmpVec.x * 0.5 + 0.5) * w;
        const sy = (-this.tmpVec.y * 0.5 + 0.5) * h;
        const topSafe = h < 520 ? Math.round(h * 0.16) : 112;
        const bottomSafe = h < 520 ? Math.round(h * 0.28) : 118;
        const sideMargin = w < 768 ? 28 : 38;
        const edge = computeOffscreenEdgeMarker(sx, sy, inFront, w, h, topSafe, bottomSafe, sideMargin);
        if (edge.visible) {
          offscreenTarget = {
            xPct: edge.xPct,
            yPct: edge.yPct,
            angleDeg: edge.angleDeg,
            distMeters: Math.round(focusDist),
            isBoss: focusEnemy.isBoss,
          };
        }
      }
    }

    let portTargetInArc = false;
    let stbdTargetInArc = false;
    if (this.mode === 'playing') {
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const align = computeBroadsideAlignment(
          this.ship.x,
          this.ship.z,
          this.ship.heading,
          enemy.x,
          enemy.z,
          48,
          0.44,
        );
        if (align.inPortArc) portTargetInArc = true;
        if (align.inStbdArc) stbdTargetInArc = true;
      }
    }

    this.onHudUpdate({
      speedKnots: Number((this.ship.speed * 1.65).toFixed(1)),
      windSpeedKnots: Math.round(this.seaParams.windSpeed * 1.45),
      sailLevel: this.ship.sailLevel,
      headingRad: this.ship.heading,
      windAngleRad: this.seaParams.windAngle,
      pointOfSail,
      crestScore,
      crestReady: crestScore >= effectiveCrestThreshold,
      ammo: this.ammo,
      portCooldown: this.portCooldown,
      stbdCooldown: this.stbdCooldown,
      portTargetInArc,
      stbdTargetInArc,
      surgeCooldown: this.ship.surgeCooldown,
      hullHp: this.hullHp,
      hullMaxHp: this.hullMaxHp,
      sunkCount: this.sunkCount,
      targetShips: this.targetShips,
      score: this.score,
      wave: this.wave,
      act: this.act,
      playMode: this.playMode,
      weather: this.weather,
      activeOfficers: [...this.activeOfficers],
      activeContracts: [...this.activeContracts],
      bossKey: ACT_SPECS[this.act].bossKey,
      runDoubloonsBonus: this.runDoubloonsBonus,
      boardedCount: this.boardedCount,
      canBoard: Boolean(boardTarget),
      bossHp: boss ? Math.max(0, boss.hp) : null,
      bossMaxHp: boss ? boss.maxHp : null,
      bossEnraged: Boolean(boss?.bossEnraged),
      callout: this.callout || this.t().calloutDefault,
      calloutSpeaker: this.calloutSpeaker,
      harpoonCooldown: this.abilities.harpoonCooldown,
      harpoonActive: this.abilities.harpoonActiveTimer > 0 && this.abilities.harpoonTargetId !== null,
      smokeCooldown: this.abilities.smokeCooldown,
      smokeActive: this.abilities.smokeTimer > 0,
      stormRage: Math.round(this.abilities.stormRage),
      stormWakeActive: this.abilities.stormWakeTimer > 0,
      stormWakeTimer: this.abilities.stormWakeTimer,
      comboStreak: this.comboStreak,
      comboTimer: this.comboTimer,
      reloadMaxTime: this.playerStats.reloadTime,
      offscreenTarget,
      morale: Math.round(this.morale),
      mineCooldown: this.mineCooldown,
      shipClass: this.shipClass,
      equippedFigurehead: this.equippedFigurehead,
      milesSailed: Number(this.milesSailed.toFixed(1)),
      shotsFired: this.shotsFired,
      shotsHit: this.shotsHit,
      monstersSunk: this.monstersSunk,
      bestiaryKillsInRun: { ...this.bestiaryKillsInRun },
      nearbyInteract: this.mode === 'playing' ? (this.getNearbyInteractKind()?.kind ?? null) : null,
      activeEncounterModal: this.activeEncounterModal,
      merchantBuffs: { ...this.merchantBuffs },
      fleetCharmBought: this.fleetCharmBought,
      rogueWaveActive: this.rogueWave.active,
      waypointDistMeters: this.courseWaypoint
        ? Math.round(Math.hypot(this.courseWaypoint.x - this.ship.x, this.courseWaypoint.z - this.ship.z))
        : null,
      surgeonActive: this.activeOfficers.includes('surgeon'),
      equippedCrest: this.equippedCrest,
      activeRelics: [...this.activeRelics],
      activeMutators: [...this.activeMutators],
      routeChoices: [...this.routeChoices],
      mutatorChoices: [...this.mutatorChoices],
      convoyHp: this.escortConvoy?.alive ? Math.max(0, Math.round(this.escortConvoy.hp)) : null,
      convoyMaxHp: this.escortConvoy?.alive ? this.escortConvoy.maxHp : null,
      treasureDistMeters:
        this.treasureSpot && !this.treasureSpot.collected
          ? Math.round(Math.hypot(this.treasureSpot.x - this.ship.x, this.treasureSpot.z - this.ship.z))
          : null,
    });
  }

  public dispose(): void {
    this.disposed = true;
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.activeGlSync) {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.deleteSync === 'function') gl.deleteSync(this.activeGlSync);
      this.activeGlSync = null;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.removeEventListener('wheel', this.handleWheel);
    this.renderer.domElement.removeEventListener('contextmenu', this.handleContextMenu);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);
    this.clearVfx();
    this.renderer.domElement.remove();
    this.vfxCanvas.remove();
    this.seagullFlock?.dispose();
    this.atmosphericVfx?.dispose();
    this.seaMesh?.geometry?.dispose();
    this.foamGeometry?.dispose();
    this.foamMaterial?.dispose();
    this.foamTexture?.dispose();
    this.sharedBurstGeo.dispose();
    this.sharedSplinterGeo.dispose();
    this.sharedSmokeGeo.dispose();
    this.sharedBallGeo.dispose();
    this.sharedBallCrestGeo.dispose();
    this.sharedMineKegGeo.dispose();
    this.sharedMineBandGeo.dispose();
    this.sharedMineEmberGeo.dispose();
    this.sharedMineKegMat.dispose();
    this.sharedMineBandMat.dispose();
    for (const m of this.sharedSplinterMats) m.dispose();
    for (const m of this.sharedBurstMats.values()) m.dispose();
    for (const m of this.sharedBallMats.values()) m.dispose();
    for (const sp of this.smokePuffPool) sp.mat.dispose();
    this.smokePuffPool = [];
    this.particlePool = [];
    this.envTexture?.dispose();
    this.envTexture = null;
    this.audio.dispose();
    this.renderer.dispose();
  }
}
