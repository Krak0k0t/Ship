import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CeremonialBanner } from './components/CeremonialBanner';
import { ChapterSelectModal } from './components/ChapterSelectModal';
import { ChronicleModal } from './components/ChronicleModal';
import { ControlsModal } from './components/ControlsModal';
import { CursorSparkOverlay } from './components/CursorSparkOverlay';
import { EncounterModal } from './components/EncounterModal';
import { GameHud } from './components/GameHud';
import { HarborModal } from './components/HarborModal';
import { SecretsModal } from './components/SecretsModal';
import { StatusModal } from './components/StatusModal';
import { TitleOverlay } from './components/TitleOverlay';
import { TuningDock } from './components/TuningDock';
import { ViewportAtmosphereOverlay } from './components/ViewportAtmosphereOverlay';
import { getBossUltimatumKey } from './game/lore';
import {
  getBossPhase2Key,
  type BlackContractId,
  type ShipCrestId,
} from './game/contracts';
import { dispatchCoinFly, dispatchSparkBurst } from './game/uiEffects';
import {
  ACT_SPECS,
  WEATHER_SPECS,
  applyActCompletion,
  applyDefeatProgress,
  applyEndlessResult,
  hireOrToggleOfficer,
  loadCaptainProfile,
  purchaseUpgrade,
  recordCaptainLog,
  recordSecretCompletion,
  resetCaptainProfile,
  saveCaptainProfile,
  unlockCaptainPerk,
  unlockOrEquipCrest,
  unlockOrEquipFigurehead,
  unlockOrEquipShipClass,
  type ActId,
  type CaptainProfile,
  type OfficerId,
  type PlayModeId,
  type UpgradeStat,
  type WeatherId,
} from './game/campaign';
import type { CaptainLogId } from './game/voyageSystems';
import { SECRET_QUEST_SPECS, type SecretQuestId } from './game/secrets';
import {
  DEFAULT_SEA_PARAMS,
  createInitialShipState,
  type AmmoType,
  type DifficultyLevel,
  type SeaParams,
} from './game/sailingPhysics';
import {
  loadGameSettings,
  saveGameSettings,
  type GameSettings,
} from './game/settings';
import type { CaptainPerkId, FigureheadId, ShipClassId } from './game/shipClasses';
import {
  createDefaultRunMerchantBuffs,
  type MerchantOfferId,
} from './game/encounters';
import { getExtraT } from './i18n/extraTranslations';
import { TRANSLATIONS, type LanguageCode } from './i18n/translations';
import {
  NavalGymScene,
  type ActCompletePayload,
  type DefeatSummaryPayload,
  type EndlessCompletePayload,
  type HudSnapshot,
  type SceneMode,
  type SeaEventKind,
} from './scene/NavalGymScene';

const INITIAL_HUD: HudSnapshot = {
  speedKnots: 5.8,
  windSpeedKnots: Math.round(DEFAULT_SEA_PARAMS.windSpeed * 1.45),
  sailLevel: createInitialShipState().sailLevel,
  headingRad: 0,
  windAngleRad: DEFAULT_SEA_PARAMS.windAngle,
  pointOfSail: 'beam',
  crestScore: 0.5,
  crestReady: false,
  ammo: 'round',
  portCooldown: 0,
  stbdCooldown: 0,
  portTargetInArc: false,
  stbdTargetInArc: false,
  surgeCooldown: 0,
  hullHp: 100,
  hullMaxHp: 100,
  sunkCount: 0,
  targetShips: 3,
  score: 0,
  wave: 1,
  act: 1,
  playMode: 'campaign',
  weather: 'tailwind',
  activeOfficers: [],
  activeContracts: [],
  bossKey: 'bossAct1',
  runDoubloonsBonus: 0,
  boardedCount: 0,
  canBoard: false,
  bossHp: null,
  bossMaxHp: null,
  bossEnraged: false,
  callout: TRANSLATIONS.en.calloutDefault,
  calloutSpeaker: null,
  harpoonCooldown: 0,
  harpoonActive: false,
  smokeCooldown: 0,
  smokeActive: false,
  stormRage: 35,
  stormWakeActive: false,
  stormWakeTimer: 0,
  comboStreak: 0,
  comboTimer: 0,
  reloadMaxTime: 1.65,
  offscreenTarget: null,
  morale: 75,
  mineCooldown: 0,
  shipClass: 'sloop',
  equippedFigurehead: 'none',
  milesSailed: 0,
  shotsFired: 0,
  shotsHit: 0,
  monstersSunk: 0,
  bestiaryKillsInRun: {},
  nearbyInteract: null,
  activeEncounterModal: null,
  merchantBuffs: createDefaultRunMerchantBuffs(),
  fleetCharmBought: false,
  rogueWaveActive: false,
  waypointDistMeters: null,
  surgeonActive: false,
  equippedCrest: 'corsair',
  activeRelics: [],
  activeMutators: [],
  routeChoices: [],
  mutatorChoices: [],
  convoyHp: null,
  convoyMaxHp: null,
  treasureDistMeters: null,
};

export function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<NavalGymScene | null>(null);

  const [mode, setMode] = useState<SceneMode>('title');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('normal');
  const [profile, setProfile] = useState<CaptainProfile>(() => loadCaptainProfile());
  const [settings, setSettings] = useState<GameSettings>(() => loadGameSettings());
  const [selectedAct, setSelectedAct] = useState<ActId>(() => loadCaptainProfile().unlockedAct);
  const [selectedMode, setSelectedMode] = useState<PlayModeId>('campaign');
  const [activeContracts, setActiveContracts] = useState<BlackContractId[]>([]);
  const activeContractsRef = useRef<BlackContractId[]>(activeContracts);
  useEffect(() => {
    activeContractsRef.current = activeContracts;
  }, [activeContracts]);

  const [harborOpen, setHarborOpen] = useState(false);
  const [secretsOpen, setSecretsOpen] = useState(false);
  const [chronicleOpen, setChronicleOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const [lastVictoryReward, setLastVictoryReward] = useState(0);
  const [lastVictoryScore, setLastVictoryScore] = useState<number | null>(null);
  const [runBestCombo, setRunBestCombo] = useState(0);

  const [muted, setMuted] = useState(false);
  const [tuningOpen, setTuningOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [seaParams, setSeaParams] = useState<SeaParams>({ ...DEFAULT_SEA_PARAMS });
  const [bloomStrength, setBloomStrength] = useState(0.26);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [banner, setBanner] = useState<{
    id: number;
    kicker: string;
    title: string;
    accent: 'gold' | 'azure' | 'crimson';
  } | null>(null);
  const prevTrackRef = useRef<{ mode: SceneMode; wave: number; weather: WeatherId }>({
    mode: 'title',
    wave: 1,
    weather: 'tailwind',
  });

  useEffect(() => {
    document.body.dataset.state = mode;
  }, [mode]);

  useEffect(() => {
    document.body.dataset.modalOpen =
      harborOpen ||
      secretsOpen ||
      chronicleOpen ||
      controlsOpen ||
      chaptersOpen ||
      hud.activeEncounterModal !== null
        ? '1'
        : '0';
  }, [harborOpen, secretsOpen, chronicleOpen, controlsOpen, chaptersOpen, hud.activeEncounterModal]);

  useEffect(() => {
    if (hud.comboStreak > runBestCombo) {
      setRunBestCombo(hud.comboStreak);
    }
  }, [hud.comboStreak, runBestCombo]);

  useEffect(() => {
    const prev = prevTrackRef.current;
    const t = TRANSLATIONS[language];
    let nextBanner: { kicker: string; title: string; accent: 'gold' | 'azure' | 'crimson' } | null =
      null;

    if (mode === 'playing' && prev.mode === 'title') {
      nextBanner =
        hud.playMode === 'endless'
          ? { kicker: t.endlessBadge, title: t.endlessName, accent: 'azure' }
          : {
              kicker: `${t.actLabel} ${hud.act}`,
              title: t[ACT_SPECS[hud.act].nameKey],
              accent: 'gold',
            };
    } else if (mode === 'playing' && prev.mode === 'playing') {
      if (hud.wave > prev.wave) {
        const isBoss = hud.bossHp !== null;
        if (!isBoss) {
          nextBanner = {
            kicker: `${t.waveLabel} ${hud.wave}`,
            title: `${t.waveLabel} ${hud.wave}`,
            accent: 'gold',
          };
        }
      } else if (hud.weather !== prev.weather) {
        nextBanner = {
          kicker: t.calloutWeatherShift,
          title: t[WEATHER_SPECS[hud.weather].labelKey],
          accent: hud.weather === 'squall' ? 'crimson' : hud.weather === 'tailwind' ? 'azure' : 'gold',
        };
      }
    }

    prevTrackRef.current = { mode, wave: hud.wave, weather: hud.weather };

    if (nextBanner) {
      setBanner({ id: Date.now(), ...nextBanner });
    }
  }, [mode, hud.wave, hud.weather, hud.playMode, hud.act, hud.bossHp, hud.bossKey, language]);

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(null), 2650);
    return () => window.clearTimeout(timer);
  }, [banner]);

  const prevRunDoubloonsRef = useRef(0);
  useEffect(() => {
    if (mode !== 'playing') {
      prevRunDoubloonsRef.current = hud.runDoubloonsBonus;
      return;
    }
    const delta = hud.runDoubloonsBonus - prevRunDoubloonsRef.current;
    prevRunDoubloonsRef.current = hud.runDoubloonsBonus;
    if (delta > 0) {
      dispatchCoinFly(
        window.innerWidth * 0.5,
        window.innerHeight * 0.44,
        delta >= 40 ? 6 : 4,
      );
    }
  }, [mode, hud.runDoubloonsBonus]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.().catch(() => undefined);
    } else {
      void document.exitFullscreen?.().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.body.dataset.modalOpen === '1') {
        if (e.code === 'Escape') {
          if (hud.activeEncounterModal === 'wreckage' || hud.activeEncounterModal === 'merchant') {
            sceneRef.current?.closeEncounterModal();
          } else if (hud.activeEncounterModal !== null) {
            return;
          } else if (controlsOpen) setControlsOpen(false);
          else if (chaptersOpen) setChaptersOpen(false);
          else if (harborOpen) setHarborOpen(false);
          else if (secretsOpen) setSecretsOpen(false);
          else if (chronicleOpen) setChronicleOpen(false);
        }
        return;
      }
      if (e.code === 'F11') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.code === 'KeyT' && document.body.dataset.state === 'playing') {
        setTuningOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    handleToggleFullscreen,
    controlsOpen,
    chaptersOpen,
    harborOpen,
    secretsOpen,
    chronicleOpen,
    hud.activeEncounterModal,
  ]);

  const handleActComplete = useCallback((payload: ActCompletePayload) => {
    setRunBestCombo(payload.bestComboInRun);
    setProfile((prev) => {
      const { profile: updated, doubloonsEarned, finalScore } = applyActCompletion(
        prev,
        payload.act,
        payload.score,
        payload.sunkCount,
        payload.boardedCount,
        payload.bonusGoldCollected,
        {
          activeContracts: activeContractsRef.current,
          bossesDefeatedInRun: payload.bossesDefeatedInRun,
          bestComboInRun: payload.bestComboInRun,
          milesSailed: payload.milesSailed,
          bestiaryKillsInRun: payload.bestiaryKillsInRun,
        },
      );
      saveCaptainProfile(updated);
      setLastVictoryReward(doubloonsEarned);
      setLastVictoryScore(finalScore);
      return updated;
    });
  }, []);

  const handleEndlessComplete = useCallback((payload: EndlessCompletePayload) => {
    setRunBestCombo(payload.bestComboInRun);
    setProfile((prev) => {
      const { profile: updated, doubloonsEarned, finalScore } = applyEndlessResult(
        prev,
        payload.waveReached,
        payload.score,
        payload.sunkCount,
        payload.boardedCount,
        payload.bonusGoldCollected,
        {
          activeContracts: activeContractsRef.current,
          bossesDefeatedInRun: payload.bossesDefeatedInRun,
          bestComboInRun: payload.bestComboInRun,
          milesSailed: payload.milesSailed,
          bestiaryKillsInRun: payload.bestiaryKillsInRun,
        },
      );
      saveCaptainProfile(updated);
      setLastVictoryReward(doubloonsEarned);
      setLastVictoryScore(finalScore);
      return updated;
    });
  }, []);

  const handleDefeatSummary = useCallback((payload: DefeatSummaryPayload) => {
    setRunBestCombo(payload.bestComboInRun);
    setProfile((prev) => {
      const updated = applyDefeatProgress(
        prev,
        payload.sunkCount,
        payload.boardedCount,
        payload.milesSailed,
        payload.bestComboInRun,
        payload.bestiaryKillsInRun,
      );
      saveCaptainProfile(updated);
      return updated;
    });
  }, []);

  const languageRef = useRef(language);
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const handleSecretComplete = useCallback((secretId: SecretQuestId) => {
    setProfile((prev) => {
      const { profile: updated, newlyCompleted } = recordSecretCompletion(prev, secretId);
      if (newlyCompleted) {
        saveCaptainProfile(updated);
      }
      return updated;
    });
    const t = TRANSLATIONS[languageRef.current];
    setBanner({
      id: Date.now(),
      kicker: t.secretDiscoveredKicker,
      title: t[SECRET_QUEST_SPECS[secretId].titleKey],
      accent: 'gold',
    });
    dispatchSparkBurst(window.innerWidth * 0.5, 118, '#FFD27D');
  }, []);

  const handleBossArrival = useCallback(
    (actId: ActId, bossKey: 'bossAct1' | 'bossAct2' | 'bossAct3') => {
      const t = TRANSLATIONS[languageRef.current];
      setBanner({
        id: Date.now(),
        kicker: t[bossKey],
        title: t[getBossUltimatumKey(actId)],
        accent: 'crimson',
      });
    },
    [],
  );

  const handleBossPhase2 = useCallback((actId: ActId) => {
    const t = TRANSLATIONS[languageRef.current];
    setBanner({
      id: Date.now(),
      kicker: t.bossPhase2Kicker,
      title: t[getBossPhase2Key(actId)],
      accent: 'crimson',
    });
  }, []);

  const handleSeaEvent = useCallback((kind: SeaEventKind) => {
    const et = getExtraT(languageRef.current);
    const title =
      kind === 'salvage'
        ? et.eventSalvageTitle
        : kind === 'ambush'
          ? et.eventAmbushTitle
          : et.eventTidalTitle;
    const accent = kind === 'ambush' ? 'crimson' : kind === 'salvage' ? 'gold' : 'azure';
    setBanner({
      id: Date.now(),
      kicker: et.eventKicker,
      title,
      accent,
    });
  }, []);

  const handleKrakenArrival = useCallback(() => {
    const et = getExtraT(languageRef.current);
    setBanner({
      id: Date.now(),
      kicker: et.krakenArrivalKicker,
      title: et.krakenArrivalTitle,
      accent: 'crimson',
    });
  }, []);

  const handleLogUnlock = useCallback((logId: CaptainLogId) => {
    setProfile((prev) => {
      const { profile: updated, newlyUnlocked } = recordCaptainLog(prev, logId);
      if (!newlyUnlocked) return prev;
      saveCaptainProfile(updated);
      const et = getExtraT(languageRef.current);
      const titleKey = `${logId}Title` as keyof ReturnType<typeof getExtraT>;
      setBanner({
        id: Date.now(),
        kicker: et.chronicleTabLog,
        title: et[titleKey],
        accent: 'gold',
      });
      return updated;
    });
  }, []);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const initialProfile = loadCaptainProfile();
    const initialSettings = loadGameSettings();
    const scene = new NavalGymScene(
      el,
      (snap) => setHud(snap),
      (nextMode) => setMode(nextMode),
      handleActComplete,
      handleEndlessComplete,
      handleSecretComplete,
      handleBossArrival,
      handleBossPhase2,
      handleDefeatSummary,
      handleSeaEvent,
      handleKrakenArrival,
      handleLogUnlock,
    );
    scene.setUpgrades(initialProfile.upgrades);
    scene.setOfficers(initialProfile.activeOfficers);
    scene.setCrest(initialProfile.equippedCrest);
    scene.setShipLoadout(
      initialProfile.shipClass,
      initialProfile.equippedFigurehead,
      initialProfile.unlockedPerks,
    );
    scene.setBindings(initialSettings.bindings);
    scene.setMasterVolume(initialSettings.masterVolume);
    scene.setGraphicsQuality(initialSettings.graphicsQuality);
    if (initialProfile.unlockedAct > 1) {
      scene.setAct(initialProfile.unlockedAct);
    }
    sceneRef.current = scene;

    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      scene.startPlay(false);
    }

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [
    handleActComplete,
    handleEndlessComplete,
    handleSecretComplete,
    handleBossArrival,
    handleBossPhase2,
    handleDefeatSummary,
    handleSeaEvent,
    handleKrakenArrival,
    handleLogUnlock,
  ]);

  const handleChangeLanguage = (lang: LanguageCode) => {
    setLanguage(lang);
    sceneRef.current?.setLanguage(lang);
  };

  const handleChangeDifficulty = (diff: DifficultyLevel) => {
    setDifficulty(diff);
    sceneRef.current?.setDifficulty(diff);
  };

  const handleChangeSettings = (next: GameSettings) => {
    setSettings(next);
    saveGameSettings(next);
    sceneRef.current?.setBindings(next.bindings);
    sceneRef.current?.setMasterVolume(next.masterVolume);
    sceneRef.current?.setGraphicsQuality(next.graphicsQuality);
  };

  const handleSelectAct = (actId: ActId) => {
    if (actId > profile.unlockedAct) return;
    setSelectedMode('campaign');
    setSelectedAct(actId);
    sceneRef.current?.setAct(actId);
  };

  const handleSelectEndless = () => {
    setSelectedMode('endless');
  };

  const handleToggleContract = (id: BlackContractId) => {
    setActiveContracts((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      sceneRef.current?.setContracts(next);
      return next;
    });
  };

  const launchSelectedVoyage = () => {
    setHarborOpen(false);
    setSecretsOpen(false);
    setChronicleOpen(false);
    setControlsOpen(false);
    setChaptersOpen(false);
    setLastVictoryScore(null);
    setRunBestCombo(0);
    if (selectedMode === 'endless') {
      sceneRef.current?.startEndless(
        profile.upgrades,
        profile.activeOfficers,
        true,
        activeContracts,
      );
    } else {
      sceneRef.current?.startAct(
        selectedAct,
        profile.upgrades,
        profile.activeOfficers,
        true,
        activeContracts,
      );
    }
  };

  const handleLaunchFromChapterModal = (targetMode: PlayModeId, actId?: ActId) => {
    setChaptersOpen(false);
    setHarborOpen(false);
    setControlsOpen(false);
    setLastVictoryScore(null);
    setRunBestCombo(0);
    if (targetMode === 'endless') {
      setSelectedMode('endless');
      sceneRef.current?.startEndless(
        profile.upgrades,
        profile.activeOfficers,
        true,
        activeContracts,
      );
    } else {
      const targetAct = actId ?? selectedAct;
      setSelectedMode('campaign');
      setSelectedAct(targetAct);
      sceneRef.current?.startAct(
        targetAct,
        profile.upgrades,
        profile.activeOfficers,
        true,
        activeContracts,
      );
    }
  };

  const handleNextAct = () => {
    const next: ActId = hud.act === 1 ? 2 : 3;
    setSelectedMode('campaign');
    setSelectedAct(next);
    setHarborOpen(false);
    setLastVictoryScore(null);
    setRunBestCombo(0);
    sceneRef.current?.startAct(next, profile.upgrades, profile.activeOfficers, true, activeContracts);
  };

  const handleBuyUpgrade = (stat: UpgradeStat) => {
    setProfile((prev) => {
      const { profile: updated, purchased } = purchaseUpgrade(prev, stat);
      if (!purchased) return prev;
      saveCaptainProfile(updated);
      sceneRef.current?.setUpgrades(updated.upgrades);
      return updated;
    });
  };

  const handleSelectShipClass = (shipClassId: ShipClassId) => {
    setProfile((prev) => {
      const { profile: updated, changed } = unlockOrEquipShipClass(prev, shipClassId);
      if (!changed) return prev;
      saveCaptainProfile(updated);
      sceneRef.current?.setShipLoadout(
        updated.shipClass,
        updated.equippedFigurehead,
        updated.unlockedPerks,
      );
      return updated;
    });
  };

  const handleHireOrToggleOfficer = (officerId: OfficerId) => {
    setProfile((prev) => {
      const { profile: updated, changed } = hireOrToggleOfficer(prev, officerId);
      if (!changed) return prev;
      saveCaptainProfile(updated);
      sceneRef.current?.setOfficers(updated.activeOfficers);
      return updated;
    });
  };

  const handleUnlockPerk = (perkId: CaptainPerkId) => {
    setProfile((prev) => {
      const { profile: updated, changed } = unlockCaptainPerk(prev, perkId);
      if (!changed) return prev;
      saveCaptainProfile(updated);
      sceneRef.current?.setShipLoadout(
        updated.shipClass,
        updated.equippedFigurehead,
        updated.unlockedPerks,
      );
      return updated;
    });
  };

  const handleSelectCrest = (crestId: ShipCrestId) => {
    setProfile((prev) => {
      const { profile: updated, changed } = unlockOrEquipCrest(prev, crestId);
      if (!changed) return prev;
      saveCaptainProfile(updated);
      sceneRef.current?.setCrest(updated.equippedCrest);
      return updated;
    });
  };

  const handleSelectFigurehead = (figureheadId: FigureheadId) => {
    setProfile((prev) => {
      const { profile: updated, changed } = unlockOrEquipFigurehead(prev, figureheadId);
      if (!changed) return prev;
      saveCaptainProfile(updated);
      sceneRef.current?.setShipLoadout(
        updated.shipClass,
        updated.equippedFigurehead,
        updated.unlockedPerks,
      );
      return updated;
    });
  };

  const handleResetCampaign = () => {
    const fresh = resetCaptainProfile();
    setProfile(fresh);
    setSelectedMode('campaign');
    setSelectedAct(1);
    setActiveContracts([]);
    setLastVictoryReward(0);
    setLastVictoryScore(null);
    setRunBestCombo(0);
    sceneRef.current?.setUpgrades(fresh.upgrades);
    sceneRef.current?.setOfficers(fresh.activeOfficers);
    sceneRef.current?.setCrest(fresh.equippedCrest);
    sceneRef.current?.setShipLoadout(fresh.shipClass, fresh.equippedFigurehead, fresh.unlockedPerks);
    sceneRef.current?.setContracts([]);
    sceneRef.current?.setAct(1);
  };

  const handleReturnMenu = () => {
    setTuningOpen(false);
    setHarborOpen(false);
    setControlsOpen(false);
    setChaptersOpen(false);
    sceneRef.current?.returnToMenu();
  };

  const handleReset = () => {
    setRunBestCombo(0);
    sceneRef.current?.resetVoyage();
  };

  const handleBuyMerchantOffer = (offerId: MerchantOfferId) => {
    const res = sceneRef.current?.buyMerchantOffer(offerId, profile.doubloons);
    if (res?.purchased && res.walletSpent > 0) {
      setProfile((prev) => {
        const updated: CaptainProfile = {
          ...prev,
          doubloons: Math.max(0, prev.doubloons - res.walletSpent),
        };
        saveCaptainProfile(updated);
        return updated;
      });
    }
  };

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    sceneRef.current?.setMuted(next);
  };

  const handleChangeParam = <K extends keyof SeaParams>(key: K, val: SeaParams[K]) => {
    setSeaParams((prev) => ({ ...prev, [key]: val }));
    sceneRef.current?.setSeaParam(key, val);
  };

  const handleChangeBloom = (val: number) => {
    setBloomStrength(val);
    sceneRef.current?.setBloomStrength(val);
  };

  return (
    <main className="relative h-full w-full overflow-hidden bg-[#070B18]">
      <div ref={mountRef} data-testid="naval-canvas-mount" className="absolute inset-0 h-full w-full" />

      <ViewportAtmosphereOverlay
        mode={mode}
        weather={hud.weather}
        speedKnots={hud.speedKnots}
        crestReady={hud.crestReady}
        smokeActive={hud.smokeActive}
        stormWakeActive={hud.stormWakeActive}
      />

      {mode === 'title' && (
        <TitleOverlay
          language={language}
          difficulty={difficulty}
          selectedAct={selectedAct}
          selectedMode={selectedMode}
          profile={profile}
          activeContracts={activeContracts}
          isFullscreen={isFullscreen}
          onChangeLanguage={handleChangeLanguage}
          onChangeDifficulty={handleChangeDifficulty}
          onSelectAct={handleSelectAct}
          onSelectEndless={handleSelectEndless}
          onToggleContract={handleToggleContract}
          onOpenHarbor={() => setHarborOpen(true)}
          onOpenSecrets={() => setSecretsOpen(true)}
          onOpenChronicle={() => setChronicleOpen(true)}
          onOpenChapters={() => setChaptersOpen(true)}
          onOpenControls={() => setControlsOpen(true)}
          onResetCampaign={handleResetCampaign}
          onToggleFullscreen={handleToggleFullscreen}
          onStart={launchSelectedVoyage}
        />
      )}

      {mode !== 'title' && (
        <GameHud
          hud={hud}
          language={language}
          doubloons={profile.doubloons}
          bindings={settings.bindings}
          muted={muted}
          tuningOpen={tuningOpen}
          isFullscreen={isFullscreen}
          onChangeLanguage={handleChangeLanguage}
          onStepSail={(d) => sceneRef.current?.changeSail(d)}
          onSelectAmmo={(a: AmmoType) => sceneRef.current?.setAmmo(a)}
          onFire={(side) => sceneRef.current?.fireBroadside(side)}
          onTriggerSurge={() => sceneRef.current?.triggerSurge()}
          onTriggerHarpoon={() => sceneRef.current?.triggerHarpoon()}
          onTriggerSmoke={() => sceneRef.current?.triggerSmoke()}
          onTriggerStormWake={() => sceneRef.current?.triggerStormWake()}
          onDropMine={() => sceneRef.current?.triggerMine()}
          onBoard={() => sceneRef.current?.triggerBoarding()}
          onInteract={() => sceneRef.current?.triggerInteract()}
          onClearWaypoint={() => sceneRef.current?.clearWaypoint()}
          onTouchSteer={(steer) => sceneRef.current?.setTouchSteer(steer)}
          onToggleTuning={() => setTuningOpen((v) => !v)}
          onOpenControls={() => {
            if (mode === 'playing') sceneRef.current?.setMode('paused');
            setControlsOpen(true);
          }}
          onOpenChapters={() => {
            if (mode === 'playing') sceneRef.current?.setMode('paused');
            setChaptersOpen(true);
          }}
          onToggleMute={handleToggleMute}
          onToggleFullscreen={handleToggleFullscreen}
          onReset={handleReset}
          onReturnMenu={handleReturnMenu}
          onPause={() => sceneRef.current?.setMode('paused')}
        />
      )}

      {mode === 'playing' && tuningOpen && (
        <TuningDock
          language={language}
          params={seaParams}
          bloomStrength={bloomStrength}
          onChangeParam={handleChangeParam}
          onChangeBloom={handleChangeBloom}
          onSliderRustle={() => sceneRef.current?.playSliderRustle()}
          onClose={() => setTuningOpen(false)}
        />
      )}

      {(mode === 'paused' || mode === 'victory' || mode === 'defeat') &&
        !harborOpen &&
        !controlsOpen &&
        !chaptersOpen && (
          <StatusModal
            mode={mode}
            language={language}
            act={hud.act}
            playMode={hud.playMode}
            wave={hud.wave}
            score={lastVictoryScore ?? hud.score}
            doubloonsEarned={lastVictoryReward}
            milesSailed={hud.milesSailed}
            sunkCount={hud.sunkCount}
            shotsFired={hud.shotsFired}
            shotsHit={hud.shotsHit}
            bestComboInRun={Math.max(runBestCombo, hud.comboStreak)}
            morale={hud.morale}
            onResumeOrReplay={() => {
              setLastVictoryScore(null);
              setRunBestCombo(0);
              if (mode === 'paused') {
                sceneRef.current?.setMode('playing');
              } else if (hud.playMode === 'endless') {
                sceneRef.current?.startEndless(
                  profile.upgrades,
                  profile.activeOfficers,
                  true,
                  activeContracts,
                );
              } else {
                sceneRef.current?.startAct(
                  hud.act,
                  profile.upgrades,
                  profile.activeOfficers,
                  true,
                  activeContracts,
                );
              }
            }}
            onNextAct={handleNextAct}
            onOpenHarbor={() => {
              if (mode === 'victory' && hud.playMode === 'campaign' && hud.act < 3) {
                const next: ActId = hud.act === 1 ? 2 : 3;
                setSelectedMode('campaign');
                setSelectedAct(next);
                sceneRef.current?.setAct(next);
              }
              setHarborOpen(true);
            }}
            onOpenChapters={() => setChaptersOpen(true)}
            onOpenControls={() => setControlsOpen(true)}
            onReturnMenu={handleReturnMenu}
          />
        )}

      {harborOpen && (
        <HarborModal
          language={language}
          profile={profile}
          difficulty={difficulty}
          activeContracts={activeContracts}
          selectedAct={selectedAct}
          selectedMode={selectedMode}
          onBuyUpgrade={handleBuyUpgrade}
          onSelectShipClass={handleSelectShipClass}
          onHireOrToggleOfficer={handleHireOrToggleOfficer}
          onUnlockPerk={handleUnlockPerk}
          onSelectCrest={handleSelectCrest}
          onSelectFigurehead={handleSelectFigurehead}
          onSailSelectedAct={launchSelectedVoyage}
          onClose={() => setHarborOpen(false)}
        />
      )}

      {secretsOpen && (
        <SecretsModal
          language={language}
          profile={profile}
          onClose={() => setSecretsOpen(false)}
        />
      )}

      {chronicleOpen && (
        <ChronicleModal
          language={language}
          profile={profile}
          onClose={() => setChronicleOpen(false)}
        />
      )}

      {controlsOpen && (
        <ControlsModal
          language={language}
          settings={settings}
          onChangeSettings={handleChangeSettings}
          onSliderRustle={() => sceneRef.current?.playSliderRustle()}
          onClose={() => setControlsOpen(false)}
        />
      )}

      {chaptersOpen && (
        <ChapterSelectModal
          language={language}
          profile={profile}
          inMidVoyage={mode === 'playing' || mode === 'paused'}
          onLaunchChapter={handleLaunchFromChapterModal}
          onClose={() => setChaptersOpen(false)}
        />
      )}

      {mode === 'playing' && hud.activeEncounterModal !== null && (
        <EncounterModal
          kind={hud.activeEncounterModal}
          language={language}
          spendableDoubloons={profile.doubloons + hud.runDoubloonsBonus}
          merchantBuffs={hud.merchantBuffs}
          fleetCharmBought={hud.fleetCharmBought}
          routeChoices={hud.routeChoices}
          mutatorChoices={hud.mutatorChoices}
          onResolveWreckage={(choice) => sceneRef.current?.resolveActiveWreckageChoice(choice)}
          onBuyOffer={handleBuyMerchantOffer}
          onChooseRoute={(id) => sceneRef.current?.chooseSeaRoute(id)}
          onChooseMutator={(id) => sceneRef.current?.chooseEndlessMutator(id)}
          onResolveBoarding={(choice) => sceneRef.current?.resolveBoardingChoice(choice)}
          onClose={() => sceneRef.current?.closeEncounterModal()}
        />
      )}

      {mode === 'playing' && banner && (
        <CeremonialBanner
          id={banner.id}
          kicker={banner.kicker}
          title={banner.title}
          accent={banner.accent}
        />
      )}

      <CursorSparkOverlay
        trailEnabled={
          mode === 'title' ||
          harborOpen ||
          secretsOpen ||
          chronicleOpen ||
          controlsOpen ||
          chaptersOpen ||
          hud.activeEncounterModal !== null ||
          mode === 'paused' ||
          mode === 'victory' ||
          mode === 'defeat'
        }
      />
    </main>
  );
}

export default App;
