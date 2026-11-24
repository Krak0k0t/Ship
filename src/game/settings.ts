import type { MinimalStorage } from './campaign';

export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface GraphicsPresetSpec {
  id: GraphicsQuality;
  pixelRatioCap: number;
  shadows: boolean;
  shadowMapSize: number;
  bloomEnabled: boolean;
  godRays: boolean;
  motesCount: number;
  seaSegments: number;
  debrisVisible: boolean;
}

export const GRAPHICS_QUALITY_IDS: GraphicsQuality[] = ['low', 'medium', 'high', 'ultra'];

export const GRAPHICS_PRESETS: Record<GraphicsQuality, GraphicsPresetSpec> = {
  low: {
    id: 'low',
    pixelRatioCap: 0.85,
    shadows: false,
    shadowMapSize: 512,
    bloomEnabled: false,
    godRays: false,
    motesCount: 0,
    seaSegments: 64,
    debrisVisible: false,
  },
  medium: {
    id: 'medium',
    pixelRatioCap: 1.15,
    shadows: true,
    shadowMapSize: 1024,
    bloomEnabled: true,
    godRays: false,
    motesCount: 64,
    seaSegments: 88,
    debrisVisible: true,
  },
  high: {
    id: 'high',
    pixelRatioCap: 1.5,
    shadows: true,
    shadowMapSize: 2048,
    bloomEnabled: true,
    godRays: true,
    motesCount: 140,
    seaSegments: 120,
    debrisVisible: true,
  },
  ultra: {
    id: 'ultra',
    pixelRatioCap: 2.0,
    shadows: true,
    shadowMapSize: 2048,
    bloomEnabled: true,
    godRays: true,
    motesCount: 240,
    seaSegments: 144,
    debrisVisible: true,
  },
};

export type KeybindAction =
  | 'steerPort'
  | 'steerStbd'
  | 'sailUp'
  | 'sailDown'
  | 'firePort'
  | 'fireStbd'
  | 'fireBoth'
  | 'surge'
  | 'harpoon'
  | 'smoke'
  | 'stormWake'
  | 'dropMine'
  | 'board'
  | 'interact'
  | 'ammo1'
  | 'ammo2'
  | 'ammo3'
  | 'ammo4'
  | 'ammo5'
  | 'ammo6'
  | 'ammo7'
  | 'pause';

export const KEYBIND_ACTIONS: KeybindAction[] = [
  'steerPort',
  'steerStbd',
  'sailUp',
  'sailDown',
  'firePort',
  'fireStbd',
  'fireBoth',
  'surge',
  'harpoon',
  'smoke',
  'stormWake',
  'dropMine',
  'board',
  'interact',
  'ammo1',
  'ammo2',
  'ammo3',
  'ammo4',
  'ammo5',
  'ammo6',
  'ammo7',
  'pause',
];

export type KeyBindings = Record<KeybindAction, string>;

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  steerPort: 'KeyA',
  steerStbd: 'KeyD',
  sailUp: 'KeyW',
  sailDown: 'KeyS',
  firePort: 'KeyQ',
  fireStbd: 'KeyE',
  fireBoth: 'Space',
  surge: 'Mouse2',
  harpoon: 'KeyR',
  smoke: 'KeyC',
  stormWake: 'KeyX',
  dropMine: 'KeyF',
  board: 'KeyB',
  interact: 'KeyG',
  ammo1: 'Digit1',
  ammo2: 'Digit2',
  ammo3: 'Digit3',
  ammo4: 'Digit4',
  ammo5: 'Digit5',
  ammo6: 'Digit6',
  ammo7: 'Digit7',
  pause: 'Escape',
};

export interface GameSettings {
  graphicsQuality: GraphicsQuality;
  masterVolume: number;
  bindings: KeyBindings;
}

export function createDefaultSettings(): GameSettings {
  return {
    graphicsQuality: 'high',
    masterVolume: 0.72,
    bindings: { ...DEFAULT_KEY_BINDINGS },
  };
}

export function formatBindingLabel(code: string): string {
  if (code === 'Mouse0') return 'LMB';
  if (code === 'Mouse1') return 'MMB';
  if (code === 'Mouse2') return 'RMB';
  if (code === 'Space') return 'Space';
  if (code === 'Escape') return 'Esc';
  if (code === 'ShiftLeft' || code === 'ShiftRight') return 'Shift';
  if (code === 'ArrowUp') return '↑';
  if (code === 'ArrowDown') return '↓';
  if (code === 'ArrowLeft') return '←';
  if (code === 'ArrowRight') return '→';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return code;
}

export function rebindAction(
  bindings: KeyBindings,
  action: KeybindAction,
  newCode: string,
): KeyBindings {
  const prevCode = bindings[action];
  if (prevCode === newCode) return bindings;
  const next: KeyBindings = { ...bindings, [action]: newCode };
  // Swap cleanly if another action already uses this key so nothing becomes unbound
  for (const k of KEYBIND_ACTIONS) {
    if (k !== action && bindings[k] === newCode) {
      next[k] = prevCode;
    }
  }
  return next;
}

export function matchActionCode(
  bindings: KeyBindings,
  code: string,
): KeybindAction | null {
  for (const action of KEYBIND_ACTIONS) {
    if (bindings[action] === code) return action;
  }
  return null;
}

const SETTINGS_STORAGE_KEY = 'black_pennant_settings_v1';

function getStorage(storage?: MinimalStorage): MinimalStorage | null {
  if (storage) return storage;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

function isValidGraphics(v: unknown): v is GraphicsQuality {
  return v === 'low' || v === 'medium' || v === 'high' || v === 'ultra';
}

export function loadGameSettings(storage?: MinimalStorage): GameSettings {
  const store = getStorage(storage);
  if (!store) return createDefaultSettings();
  try {
    const raw = store.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return createDefaultSettings();
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    const def = createDefaultSettings();
    const bindings: KeyBindings = { ...def.bindings };
    if (parsed.bindings && typeof parsed.bindings === 'object') {
      for (const action of KEYBIND_ACTIONS) {
        const val = (parsed.bindings as Record<string, unknown>)[action];
        if (typeof val === 'string' && val.length > 0 && val.length <= 24) {
          bindings[action] = val;
        }
      }
    }
    return {
      graphicsQuality: isValidGraphics(parsed.graphicsQuality)
        ? parsed.graphicsQuality
        : def.graphicsQuality,
      masterVolume:
        typeof parsed.masterVolume === 'number' && Number.isFinite(parsed.masterVolume)
          ? Math.max(0, Math.min(1, parsed.masterVolume))
          : def.masterVolume,
      bindings,
    };
  } catch {
    return createDefaultSettings();
  }
}

export function saveGameSettings(settings: GameSettings, storage?: MinimalStorage): void {
  const store = getStorage(storage);
  if (!store) return;
  try {
    store.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota / privacy errors
  }
}
