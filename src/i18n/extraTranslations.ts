import type { LanguageCode } from './translations';

export type ExtraTranslationKeys = {
  // New Black Contracts
  contractCursedName: string;
  contractCursedDesc: string;
  contractCalmName: string;
  contractCalmDesc: string;

  // Ammo 4 & Stern Mine & Morale
  ammoFire: string;
  mineBtn: string;
  moraleLabel: string;
  moraleHigh: string;
  moraleLow: string;
  calloutMineDropped: string;
  calloutMineBoom: string;
  calloutMutinyRisk: string;

  // Random Sea Events
  eventKicker: string;
  eventSalvageTitle: string;
  eventAmbushTitle: string;
  eventTidalTitle: string;

  // Enemies & Mythic Monsters (Kraken, Spectral Wraith, Sea Fort)
  bestiaryTab: string;
  bestiaryKillsLabel: string;
  bestiaryWeaknessLabel: string;
  bestiaryBrigName: string;
  bestiaryBrigLore: string;
  bestiaryBrigWeak: string;
  bestiaryFireshipName: string;
  bestiaryFireshipLore: string;
  bestiaryFireshipWeak: string;
  bestiaryMortarName: string;
  bestiaryMortarLore: string;
  bestiaryMortarWeak: string;
  bestiaryHealerName: string;
  bestiaryHealerLore: string;
  bestiaryHealerWeak: string;
  bestiaryWraithName: string;
  bestiaryWraithLore: string;
  bestiaryWraithWeak: string;
  bestiarySeafortName: string;
  bestiarySeafortLore: string;
  bestiarySeafortWeak: string;
  bestiaryKrakenName: string;
  bestiaryKrakenLore: string;
  bestiaryKrakenWeak: string;
  bestiaryBossName: string;
  bestiaryBossLore: string;
  bestiaryBossWeak: string;

  // Kraken & Sea Fort In-Game Alerts
  krakenArrivalKicker: string;
  krakenArrivalTitle: string;
  krakenArmorBroken: string;
  wraithVeilBroken: string;
  seafortSpotted: string;

  // Ship Classes, Figureheads, Captain Perks, Shipyard Breakdown
  tabClasses: string;
  tabPerks: string;
  classSloopName: string;
  classSloopDesc: string;
  classFrigateName: string;
  classFrigateDesc: string;
  classManowarName: string;
  classManowarDesc: string;
  figureheadsTitle: string;
  figNoneName: string;
  figNoneDesc: string;
  figRamName: string;
  figRamDesc: string;
  figSerpentName: string;
  figSerpentDesc: string;
  figPhoenixName: string;
  figPhoenixDesc: string;
  perkIronName: string;
  perkIronDesc: string;
  perkFireName: string;
  perkFireDesc: string;
  perkKrakenName: string;
  perkKrakenDesc: string;
  perkTempestName: string;
  perkTempestDesc: string;
  perkGreedName: string;
  perkGreedDesc: string;
  perkUnlocked: string;
  shipyardSummaryTitle: string;
  statHp: string;
  statDmg: string;
  statReload: string;
  statSpeed: string;
  statSalvo: string;
  statNextDelta: string;

  // Controls, Graphics & Audio Modal
  controlsBtn: string;
  controlsTitle: string;
  controlsSub: string;
  graphicsLabel: string;
  gfxLow: string;
  gfxMedium: string;
  gfxHigh: string;
  gfxUltra: string;
  masterVolLabel: string;
  keybindsTitle: string;
  rebindPrompt: string;
  resetDefaultsBtn: string;
  actSteerPort: string;
  actSteerStbd: string;
  actSailUp: string;
  actSailDown: string;
  actFirePort: string;
  actFireStbd: string;
  actFireBoth: string;
  actSurge: string;
  actHarpoon: string;
  actSmoke: string;
  actStormWake: string;
  actDropMine: string;
  actBoard: string;
  actAmmo1: string;
  actAmmo2: string;
  actAmmo3: string;
  actAmmo4: string;
  actPause: string;

  // Chapter Select Modal
  chaptersBtn: string;
  chaptersTitle: string;
  chaptersSub: string;
  statusCleared: string;
  statusAvailable: string;
  statusLocked: string;
  lockedTeaser: string;
  rewardLabel: string;
  playChapterBtn: string;
  switchConfirmTitle: string;
  switchConfirmBody: string;
  confirmSwitchBtn: string;
  cancelBtn: string;

  // Post-Voyage Stats
  statsHeader: string;
  statMiles: string;
  statSunk: string;
  statAccuracy: string;
  statCombo: string;
  statMorale: string;

  // HUD Skill Tooltips & New Ammo 5-7
  ammoMortar: string;
  ammoHarpoonBolt: string;
  ammoCursed: string;
  tipRound: string;
  tipChain: string;
  tipGrape: string;
  tipFire: string;
  tipMortar: string;
  tipHarpoonBolt: string;
  tipCursed: string;
  tipHarpoon: string;
  tipSmoke: string;
  tipStorm: string;
  tipMine: string;
  tipSurge: string;
  tipMorale: string;

  // Controls for Interact & Ammo 5-7
  actInteract: string;
  actAmmo5: string;
  actAmmo6: string;
  actAmmo7: string;

  // Surgeon Officer & Pennant Passives
  officerSurgeonName: string;
  officerSurgeonDesc: string;
  crestCorsairPassive: string;
  crestCrimsonPassive: string;
  crestAshenPassive: string;
  crestAbyssalPassive: string;

  // Interactive Sea Encounters (Wreckage & Floating Merchant)
  wreckagePrompt: string;
  wreckageModalKicker: string;
  wreckageModalTitle: string;
  wreckageModalBody: string;
  wreckageRiskBtn: string;
  wreckageRiskDesc: string;
  wreckageSafeBtn: string;
  wreckageSafeDesc: string;
  wreckageTrapCallout: string;
  wreckageSafeCallout: string;

  merchantEventTitle: string;
  merchantPrompt: string;
  merchantKicker: string;
  merchantTitle: string;
  merchantSub: string;
  merchantWalletLabel: string;
  merchantBuffsActive: string;
  merchantBoughtBtn: string;
  merchantDockedCallout: string;
  offerHullName: string;
  offerHullDesc: string;
  offerPowderName: string;
  offerPowderDesc: string;
  offerPitchName: string;
  offerPitchDesc: string;
  offerFeastName: string;
  offerFeastDesc: string;
  offerCharmName: string;
  offerCharmDesc: string;

  // Elemental & Tactical Navigation
  calloutRogueWave: string;
  calloutRockfall: string;
  calloutPlungingRam: string;
  waypointSetCallout: string;
  waypointClearedCallout: string;
  waypointDistLabel: string;
  radarHint: string;
};

const EN: ExtraTranslationKeys = {
  contractCursedName: 'Cursed Hold',
  contractCursedDesc: '+45% cannon dmg & +8% reload; gold slowly drains at sea, foes +15% dmg',
  contractCalmName: 'Dead Calm',
  contractCalmDesc: '2x cannon damage & +25% ramming; top ship speed reduced by 45%',

  ammoFire: '[4] Fire',
  mineBtn: 'Mine [F]',
  moraleLabel: 'Morale',
  moraleHigh: 'Fierce',
  moraleLow: 'Restless',
  calloutMineDropped: 'Powder mine astern! Lure pursuers into the blast!',
  calloutMineBoom: 'Sea mine detonated! Hull timbers shattered!',
  calloutMutinyRisk: 'Low morale slows reloading—sink foes or raise morale!',

  eventKicker: 'Sea Encounter',
  eventSalvageTitle: 'Drifting Wreckage Sighted — Doubloons & Timbers!',
  eventAmbushTitle: 'Corsair Flanker Emerging From Mist!',
  eventTidalTitle: 'Favorable Twilight Swell — Crew Morale Rises!',

  bestiaryTab: 'Bestiary',
  bestiaryKillsLabel: 'Sunk',
  bestiaryWeaknessLabel: 'Weakness',
  bestiaryBrigName: 'Corsair Brig',
  bestiaryBrigLore: 'Swift twin-masted raiders hunting merchant convoys along twilight reefs.',
  bestiaryBrigWeak: 'Broadside at wave crest or ram mid-hull',
  bestiaryFireshipName: 'Ash Fireship',
  bestiaryFireshipLore: 'Unmanned pitch-soaked hulks packed with black powder barrels.',
  bestiaryFireshipWeak: 'Detonate from afar or leap over blast with Wave Surge',
  bestiaryMortarName: 'Siege Mortar Brig',
  bestiaryMortarLore: 'Heavily ballasted artillery ketches lobbing high-arcing shells.',
  bestiaryMortarWeak: 'Chain shot to shred sails, then board at close range',
  bestiaryHealerName: 'Aegis Repair Ketch',
  bestiaryHealerLore: 'Lantern-lit support vessels stitching allied hulls mid-battle.',
  bestiaryHealerWeak: 'Focus early with Fire or Harpoon pull',
  bestiaryWraithName: 'Spectral Wraith',
  bestiaryWraithLore: 'Phantasmic galleons cloaked in astral fog that deflects cold iron.',
  bestiaryWraithWeak: 'Harpoon [R], Storm Wake [X], or Fire [4] shatters spectral veil',
  bestiarySeafortName: 'Obsidian Sea Fort',
  bestiarySeafortLore: 'Bastion Citadel anchored atop volcanic shoals guarding Ember Strait.',
  bestiarySeafortWeak: 'Circle outside twin arcs with Fire & Wave-Crest salvoes',
  bestiaryKrakenName: 'Abyssal Kraken',
  bestiaryKrakenLore: 'Ancient armored leviathan whose chitin shrugs off normal iron shot.',
  bestiaryKrakenWeak: 'Pierce carapace with Harpoon [R], Fire [4], or Storm Wake [X]',
  bestiaryBossName: 'Dread Flagship',
  bestiaryBossLore: 'Admiral warships leading each Act blockade with enraged phase-two volleys.',
  bestiaryBossWeak: 'Bait enraged broadsides, leap with Surge, strike on crest',

  krakenArrivalKicker: 'Leviathan Awakens',
  krakenArrivalTitle: 'Abyssal Kraken — Strike With Harpoon [R], Fire [4] or Storm [X]!',
  krakenArmorBroken: 'Carapace shattered! All cannons deal full damage!',
  wraithVeilBroken: 'Spectral veil pierced! Full broadside damage unlocked!',
  seafortSpotted: 'Obsidian Sea Fort ahead — watch its twin mortar batteries!',

  tabClasses: 'Vessels',
  tabPerks: 'Perks',
  classSloopName: 'Corsair Sloop',
  classSloopDesc: 'Nimble turning & rapid Wave Surge; up to Tier 3 upgrades.',
  classFrigateName: 'War Frigate',
  classFrigateDesc: 'Twin masts, +35 Hull HP, +12% dmg, +1 shot; Tier 4 upgrades.',
  classManowarName: 'Sovereign Man-o’-War',
  classManowarDesc: 'Triple-mast juggernaut: +75 HP, +24% dmg, +2 shots; Tier 5 upgrades.',
  figureheadsTitle: 'Bow Figureheads',
  figNoneName: 'Oaken Prow',
  figNoneDesc: 'Standard carved bow with balanced handling.',
  figRamName: 'Iron Beak Ram',
  figRamDesc: '+35% ramming damage & +15 Hull HP.',
  figSerpentName: 'Gilded Sea Serpent',
  figSerpentDesc: '+18% Doubloons & +10% ramming power.',
  figPhoenixName: 'Ember Phoenix',
  figPhoenixDesc: '+45% Fire burn damage, +20 HP & +10% Gold.',
  perkIronName: 'Iron Discipline',
  perkIronDesc: '10% faster cannon reload across all vessels.',
  perkFireName: 'Greek Firemaster',
  perkFireDesc: 'Fire shot burns +2.5s longer and pierces monster hides.',
  perkKrakenName: 'Krakenbane Harpoon',
  perkKrakenDesc: '+45% damage vs Krakens, Wraiths & Sea Forts.',
  perkTempestName: 'Tempest Rider',
  perkTempestDesc: '+35% Storm Wake charge gain.',
  perkGreedName: 'Corsair’s Greed',
  perkGreedDesc: '+25% extra Doubloons from kills & completions.',
  perkUnlocked: 'Active',
  shipyardSummaryTitle: 'Current Vessel Telemetry',
  statHp: 'Hull',
  statDmg: 'Power',
  statReload: 'Reload',
  statSpeed: 'Speed',
  statSalvo: 'Salvo',
  statNextDelta: 'Next tier',

  controlsBtn: 'Settings',
  controlsTitle: 'Helm, Graphics & Sound',
  controlsSub: 'Customize key bindings, graphics preset, and master volume.',
  graphicsLabel: 'Graphics Quality',
  gfxLow: 'Low',
  gfxMedium: 'Medium',
  gfxHigh: 'High',
  gfxUltra: 'Ultra',
  masterVolLabel: 'Master Volume',
  keybindsTitle: 'Key & Mouse Bindings',
  rebindPrompt: 'Press key / click...',
  resetDefaultsBtn: 'Reset Defaults',
  actSteerPort: 'Turn Port',
  actSteerStbd: 'Turn Starboard',
  actSailUp: 'Raise Sails',
  actSailDown: 'Lower Sails',
  actFirePort: 'Fire Port',
  actFireStbd: 'Fire Starboard',
  actFireBoth: 'Dual Broadside',
  actSurge: 'Wave Surge',
  actHarpoon: 'Harpoon',
  actSmoke: 'Phantom Smoke',
  actStormWake: 'Storm Wake',
  actDropMine: 'Drop Sea Mine',
  actBoard: 'Board Enemy',
  actAmmo1: 'Ammo: Round',
  actAmmo2: 'Ammo: Chain',
  actAmmo3: 'Ammo: Grape',
  actAmmo4: 'Ammo: Fire',
  actPause: 'Pause / Menu',

  chaptersBtn: 'Sea Chart',
  chaptersTitle: 'Campaign Sea Chart',
  chaptersSub: 'Replay cleared seas for doubloons or chart newly unlocked waters.',
  statusCleared: 'Cleared',
  statusAvailable: 'Available',
  statusLocked: 'Locked',
  lockedTeaser: 'Uncharted waters—defeat the current Act flagship to open this passage.',
  rewardLabel: 'Bounty',
  playChapterBtn: 'Sail Chapter',
  switchConfirmTitle: 'Abandon Current Voyage?',
  switchConfirmBody: 'Switching chapters now forfeits active wave progress and launches the chosen sea.',
  confirmSwitchBtn: 'Switch Sea',
  cancelBtn: 'Stay',

  statsHeader: 'Voyage Log',
  statMiles: 'Nautical Miles',
  statSunk: 'Threats Sunk',
  statAccuracy: 'Shot Accuracy',
  statCombo: 'Peak Combo',
  statMorale: 'Final Morale',

  ammoMortar: '[5] Mortar',
  ammoHarpoonBolt: '[6] Bolt',
  ammoCursed: '[7] Cursed',
  tipRound: 'Heavy iron shot — highest direct hull damage.',
  tipChain: 'Shreds sails (-55% enemy speed) to set up boarding.',
  tipGrape: 'Wide scatter tearing enemy gun crews & reload.',
  tipFire: 'Ignites timber (Burn DoT) and pierces Wraiths & Kraken armor.',
  tipMortar: 'High-arcing explosive shell with AoE splash blast.',
  tipHarpoonBolt: 'Barbed bolt that reels smaller ships closer & shreds sails.',
  tipCursed: 'Hexed iron piercing spectral/kraken armor & slowing enemy reload.',
  tipHarpoon: 'Reels targets into broadsides & shatters Kraken/Wraith armor.',
  tipSmoke: 'Cloaks your vessel in spectral mist, breaking enemy aim.',
  tipStorm: '100% Rage unleashes lightning shockwaves around your hull.',
  tipMine: 'Drops an explosive keg astern that blasts chasing vessels.',
  tipSurge: 'Leaps over incoming cannonballs and mines.',
  tipMorale: 'High crew morale speeds up cannon reload.',

  actInteract: 'Salvage / Trade',
  actAmmo5: 'Ammo: Mortar',
  actAmmo6: 'Ammo: Bolt',
  actAmmo7: 'Ammo: Cursed',

  officerSurgeonName: 'Ship’s Surgeon',
  officerSurgeonDesc: 'Passively stitches planks at sea (+1.6 Hull HP/s) & guards crew health.',
  crestCorsairPassive: 'Passive: +10% Doubloon bounty from battles & contracts.',
  crestCrimsonPassive: 'Passive: +12% Cannon Damage & +8% Storm Rage gain.',
  crestAshenPassive: 'Passive: +10% Ship Speed & +20% Storm Rage gain.',
  crestAbyssalPassive: 'Passive: +20% Armor Pierce vs Kraken/Wraiths, +20% Burn & +8% Gold.',

  wreckagePrompt: 'Salvage Wreckage [G]',
  wreckageModalKicker: 'Drifting Debris',
  wreckageModalTitle: 'Shattered Galleon Wreckage',
  wreckageModalBody: 'Floating chests gleam beside armed powder buoys. Dive deep for the captain’s coffer or skim the drifting crates safely?',
  wreckageRiskBtn: 'Dive Deep for Hold',
  wreckageRiskDesc: 'High Doubloon bounty & +25% Hull repair — risks armed sea mines or a Corsair ambush!',
  wreckageSafeBtn: 'Skim Surface & Depart',
  wreckageSafeDesc: 'Safe modest Doubloons, +12% Hull patch & +8 Crew Morale with zero ambush.',
  wreckageTrapCallout: 'Ambush! Armed mines & raiders erupted from the wreckage!',
  wreckageSafeCallout: 'Surface crates salvaged cleanly — crew spirits rise!',

  merchantEventTitle: 'Neutral Trade Brig Sighted — Open Sea Bazaar!',
  merchantPrompt: 'Hail Merchant [G]',
  merchantKicker: 'Twilight Sea Bazaar',
  merchantTitle: 'Wandering Trade Brig',
  merchantSub: 'Spend Doubloons mid-voyage on hull repairs and temporary fleet buffs for this run.',
  merchantWalletLabel: 'Spendable Doubloons',
  merchantBuffsActive: 'Active Run Buffs',
  merchantBoughtBtn: 'Acquired',
  merchantDockedCallout: 'Merchant departed after a brisk midnight bargain!',
  offerHullName: 'Pitch & Oak Patch',
  offerHullDesc: 'Immediately repairs +45% of your maximum Hull HP.',
  offerPowderName: 'Tempered Black Powder',
  offerPowderDesc: '+18% cannon damage for the remainder of this voyage.',
  offerPitchName: 'Alchemical Greek Pitch',
  offerPitchDesc: '+25% burn & mortar splash power for this voyage.',
  offerFeastName: 'Captain’s Rum Feast',
  offerFeastDesc: 'Restores +25 Crew Morale immediately.',
  offerCharmName: 'Sovereign Wind Charm',
  offerCharmDesc: '+12% Ship Speed and -20% Reload Time for this voyage.',

  calloutRogueWave: 'Rogue Swell rising! Ride the wall of water for plunging rams & mine leaps!',
  calloutRockfall: 'Storm Rockfall! Cliff boulders crushed nearby vessels!',
  calloutPlungingRam: 'Plunging Wave Ram! Massive top-down hull impact!',
  waypointSetCallout: 'Course plotted on chart — follow golden beacon!',
  waypointClearedCallout: 'Chart waypoint cleared.',
  waypointDistLabel: 'WP',
  radarHint: 'Click chart to plot course',
};

const RU: ExtraTranslationKeys = {
  contractCursedName: 'Проклятый трюм',
  contractCursedDesc: '+45% к урону пушек и +8% к перезарядке; золото тает в море, враги +15% к урону',
  contractCalmName: 'Штиль',
  contractCalmDesc: '2x урон пушек и +25% таран; максимальная скорость снижена на 45%',

  ammoFire: '[4] Огонь',
  mineBtn: 'Мина [F]',
  moraleLabel: 'Мораль',
  moraleHigh: 'Боевой дух',
  moraleLow: 'Ропот',
  calloutMineDropped: 'Морская мина за кормой! Заманите преследователей на взрыв!',
  calloutMineBoom: 'Мина сработала! Борта врага разнесены в щепки!',
  calloutMutinyRisk: 'Низкая мораль замедляет перезарядку — топите врагов или берите бонусы!',

  eventKicker: 'Случайное событие',
  eventSalvageTitle: 'Дрейфующие обломки — дублоны и доски!',
  eventAmbushTitle: 'Пиратская засада из сумеречного тумана!',
  eventTidalTitle: 'Попутная зыбь — мораль команды растет!',

  bestiaryTab: 'Бестиарий',
  bestiaryKillsLabel: 'Потоплено',
  bestiaryWeaknessLabel: 'Уязвимость',
  bestiaryBrigName: 'Корсарский бриг',
  bestiaryBrigLore: 'Быстрый двухмачтовый рейдер, охотящийся вдоль рифов.',
  bestiaryBrigWeak: 'Залп с гребня волны или таран в центр борта',
  bestiaryFireshipName: 'Огненный брандер',
  bestiaryFireshipLore: 'Беспилотный корпус, набитый порохом и смолой.',
  bestiaryFireshipWeak: 'Взорвать издалека или перепрыгнуть взрыв рывком',
  bestiaryMortarName: 'Осадная мортира',
  bestiaryMortarLore: 'Тяжелый кеч, обрушивающий навесные разрывные снаряды.',
  bestiaryMortarWeak: 'Книппели по парусам, затем сближение и абордаж',
  bestiaryHealerName: 'Корабль-лекарь Эгида',
  bestiaryHealerLore: 'Судно поддержки, латающее обшивку союзных рейдеров.',
  bestiaryHealerWeak: 'Уничтожать в первую очередь огнем или гарпуном',
  bestiaryWraithName: 'Призрачный корабль',
  bestiaryWraithLore: 'Фантом в астральной дымке — обычные ядра почти не берут его.',
  bestiaryWraithWeak: 'Гарпун [R], Шторм [X] или Огонь [4] снимают призрачную броню',
  bestiarySeafortName: 'Обсидиановый морской форт',
  bestiarySeafortLore: 'Каменная бастилия на вулканической мели с двойными батареями.',
  bestiarySeafortWeak: 'Обходить вне сектора залпа, бить огнем с гребня волны',
  bestiaryKrakenName: 'Кракен Бездны',
  bestiaryKrakenLore: 'Древний бронированный левиафан — холодное железо отскакивает от хитина.',
  bestiaryKrakenWeak: 'Пробить панцирь Гарпуном [R], Огнем [4] или Штормом [X]',
  bestiaryBossName: 'Флагман армады',
  bestiaryBossLore: 'Линейный гигант, возглавляющий блокаду каждого Акта.',
  bestiaryBossWeak: 'Уклоняться прыжком во 2-й фазе и бить в борт с гребня',

  krakenArrivalKicker: 'Пробуждение левиафана',
  krakenArrivalTitle: 'Кракен Бездны — бейте Гарпуном [R], Огнем [4] или Штормом [X]!',
  krakenArmorBroken: 'Панцирь пробит! Все пушки наносят полный урон!',
  wraithVeilBroken: 'Пелена снята! Призрак уязвим для всех ядер!',
  seafortSpotted: 'Впереди Обсидиановый форт — берегитесь двойных батарей!',

  tabClasses: 'Классы судов',
  tabPerks: 'Перки',
  classSloopName: 'Корсарский шлюп',
  classSloopDesc: 'Острый разворот и быстрый прыжок; апгрейды до Ур. 3.',
  classFrigateName: 'Боевой фрегат',
  classFrigateDesc: 'Две мачты, +35 ХП, +12% урона, +1 ядро в залпе; до Ур. 4.',
  classManowarName: 'Линейный корабль',
  classManowarDesc: 'Трёхмачтовый флагман: +75 ХП, +24% урона, +2 ядра; до Ур. 5.',
  figureheadsTitle: 'Носовые фигуры',
  figNoneName: 'Дубовый форштевень',
  figNoneDesc: 'Классический резной нос без модификаторов.',
  figRamName: 'Железный таран',
  figRamDesc: '+35% урона от тарана и +15 ХП корпуса.',
  figSerpentName: 'Золотой морской змей',
  figSerpentDesc: '+18% дублонов и +10% к силе тарана.',
  figPhoenixName: 'Огненный феникс',
  figPhoenixDesc: '+45% урона от горения, +20 ХП и +10% золота.',
  perkIronName: 'Железная дисциплина',
  perkIronDesc: 'Ускоряет перезарядку пушек на 10% на любом судне.',
  perkFireName: 'Мастер греческого огня',
  perkFireDesc: 'Поджог горит на 2.5с дольше и жжет броню монстров.',
  perkKrakenName: 'Охотник на Кракена',
  perkKrakenDesc: '+45% урона по Кракену, Призракам и Форту.',
  perkTempestName: 'Всадник бури',
  perkTempestDesc: '+35% к скорости накопления Штормовой ярости.',
  perkGreedName: 'Корсарская жажда',
  perkGreedDesc: '+25% дополнительных дублонов за победы и трофеи.',
  perkUnlocked: 'Активен',
  shipyardSummaryTitle: 'Характеристики судна',
  statHp: 'Корпус',
  statDmg: 'Урон',
  statReload: 'Перезарядка',
  statSpeed: 'Скорость',
  statSalvo: 'Залп',
  statNextDelta: 'След. ур.',

  controlsBtn: 'Управление',
  controlsTitle: 'Штурвал, графика и звук',
  controlsSub: 'Переназначение клавиш, пресеты графики и общая громкость.',
  graphicsLabel: 'Качество графики',
  gfxLow: 'Низкое',
  gfxMedium: 'Среднее',
  gfxHigh: 'Высокое',
  gfxUltra: 'Ультра',
  masterVolLabel: 'Общая громкость',
  keybindsTitle: 'Клавиши и кнопки мыши',
  rebindPrompt: 'Нажмите клавишу / мышь...',
  resetDefaultsBtn: 'Сбросить по умолчанию',
  actSteerPort: 'Поворот влево',
  actSteerStbd: 'Поворот вправо',
  actSailUp: 'Поднять паруса',
  actSailDown: 'Убрать паруса',
  actFirePort: 'Залп с левого борта',
  actFireStbd: 'Залп с правого борта',
  actFireBoth: 'Двойной залп',
  actSurge: 'Рывок по волне',
  actHarpoon: 'Гарпун',
  actSmoke: 'Призрачный дым',
  actStormWake: 'Штормовой след',
  actDropMine: 'Сбросить мину',
  actBoard: 'Абордаж',
  actAmmo1: 'Снаряд: Ядра',
  actAmmo2: 'Снаряд: Книппели',
  actAmmo3: 'Снаряд: Картечь',
  actAmmo4: 'Снаряд: Зажигательные',
  actPause: 'Пауза / Меню',

  chaptersBtn: 'Главы',
  chaptersTitle: 'Морская карта кампании',
  chaptersSub: 'Перепроходите открытые акты ради дублонов или откройте новые воды.',
  statusCleared: 'Пройден',
  statusAvailable: 'Доступен',
  statusLocked: 'Закрыт',
  lockedTeaser: 'Неизведанные воды — победите флагмана текущего Акта, чтобы открыть пролив.',
  rewardLabel: 'Награда',
  playChapterBtn: 'Отплыть в акт',
  switchConfirmTitle: 'Прервать текущее плавание?',
  switchConfirmBody: 'Переход к другой главе сбросит текущую волну и запустит выбранный акт.',
  confirmSwitchBtn: 'Сменить море',
  cancelBtn: 'Остаться',

  statsHeader: 'Итоги заплыва',
  statMiles: 'Морских миль',
  statSunk: 'Потоплено врагов',
  statAccuracy: 'Точность',
  statCombo: 'Макс. серия',
  statMorale: 'Мораль команды',

  ammoMortar: '[5] Мортира',
  ammoHarpoonBolt: '[6] Болт',
  ammoCursed: '[7] Проклят.',
  tipRound: 'Тяжелые ядра — максимальный прямой урон корпусу.',
  tipChain: 'Рвет паруса (-55% скорости врага) для абордажа.',
  tipGrape: 'Широкий веер дроби, замедляющий перезарядку врага.',
  tipFire: 'Поджигает дерево (урон во времени) и пробивает броню Призраков и Кракена.',
  tipMortar: 'Навесная разрывная бомба с мощным взрывом по площади.',
  tipHarpoonBolt: 'Гарпунный болт: притягивает малые суда ближе и рвет паруса.',
  tipCursed: 'Проклятые ядра: пробивают щиты Призраков/Кракена и замедляют залп врага.',
  tipHarpoon: 'Притягивает цель к борту и срывает броню с Кракена и Призраков.',
  tipSmoke: 'Скрывает корабль в призрачном тумане, сбивая прицел врагов.',
  tipStorm: 'При 100% ярости выпускает молниевый вихрь вокруг корпуса.',
  tipMine: 'Сбрасывает за корму бочку с порохом, подрывающую преследователей.',
  tipSurge: 'Прыжок на гребне для уклонения от вражеских залпов и мин.',
  tipMorale: 'Высокая мораль экипажа ускоряет перезарядку пушек.',

  actInteract: 'Добыча / Торговля',
  actAmmo5: 'Снаряд: Мортира',
  actAmmo6: 'Снаряд: Гарпун-болт',
  actAmmo7: 'Снаряд: Проклятые',

  officerSurgeonName: 'Судовой врач',
  officerSurgeonDesc: 'Пассивно чинит обшивку в море (+1.6 ХП/с) и бережет экипаж.',
  crestCorsairPassive: 'Пассив: +10% дублонов за бои и контракты.',
  crestCrimsonPassive: 'Пассив: +12% урона пушек и +8% накопления Шторма.',
  crestAshenPassive: 'Пассив: +10% скорости судна и +20% накопления Шторма.',
  crestAbyssalPassive: 'Пассив: +20% пробития брони монстров, +20% горения и +8% золота.',

  wreckagePrompt: 'Обыскать обломки [G]',
  wreckageModalKicker: 'Дрейфующие обломки',
  wreckageModalTitle: 'Разбитый галеон среди буев',
  wreckageModalBody: 'Среди обломков видны сундуки и красные минные буи. Нырнуть глубже за главным кладом или аккуратно собрать верхние ящики?',
  wreckageRiskBtn: 'Рискнуть и забрать трюм',
  wreckageRiskDesc: 'Много дублонов и +25% починки, но высокий риск пиратской засады и мин!',
  wreckageSafeBtn: 'Собрать верх и уйти',
  wreckageSafeDesc: 'Безопасные дублоны, +12% починки корпуса и +8 морали экипажа.',
  wreckageTrapCallout: 'Засада! Из тумана вышли корсары и всплыли мины!',
  wreckageSafeCallout: 'Обломки аккуратно подняты на борт — мораль растет!',

  merchantEventTitle: 'Нейтральный купеческий бриг — плавучий базар!',
  merchantPrompt: 'Торговать с купцом [G]',
  merchantKicker: 'Сумеречный базар',
  merchantTitle: 'Странствующий торговец',
  merchantSub: 'Потратьте дублоны прямо в заплыве на починку и временные усиления.',
  merchantWalletLabel: 'Доступно дублонов',
  merchantBuffsActive: 'Активные баффы заплыва',
  merchantBoughtBtn: 'Куплено',
  merchantDockedCallout: 'Торговец отчалил после выгодной сделки!',
  offerHullName: 'Смола и дубовые латки',
  offerHullDesc: 'Мгновенно восстанавливает +45% максимального ХП корпуса.',
  offerPowderName: 'Каленый черный порох',
  offerPowderDesc: '+18% к урону пушек до конца текущего заплыва.',
  offerPitchName: 'Алхимическая смола',
  offerPitchDesc: '+25% к урону огня и мортирного взрыва в этом заплыве.',
  offerFeastName: 'Капитанский пир с ромом',
  offerFeastDesc: 'Мгновенно поднимает мораль команды на +25.',
  offerCharmName: 'Оберег попутного ветра',
  offerCharmDesc: '+12% к скорости и -20% времени перезарядки на этот заплыв.',

  calloutRogueWave: 'Волна-убийца! Используйте гребень для прыжка над минами и тарана сверху!',
  calloutRockfall: 'Штормовой камнепад! Валуны со скал обрушились на врагов!',
  calloutPlungingRam: 'Сокрушительный таран сверху с гребня волны!',
  waypointSetCallout: 'Курс проложен по карте — следуйте за золотым маяком!',
  waypointClearedCallout: 'Путевая точка сброшена.',
  waypointDistLabel: 'Точка',
  radarHint: 'Клик по карте — курс',
};

// Provide complete overrides per language while cleanly reusing concise terms where appropriate
const FR: ExtraTranslationKeys = {
  ...EN,
  contractCursedName: 'Cale Maudite',
  contractCursedDesc: '+45% dégâts & +8% cadence; l’or fond en mer, ennemis +15% dégâts',
  contractCalmName: 'Calme Plat',
  contractCalmDesc: '2x dégâts des canons & +25% éperonnage; vitesse réduite de 45%',
  ammoFire: '[4] Feu',
  mineBtn: 'Mine [F]',
  moraleLabel: 'Moral',
  moraleHigh: 'Ardent',
  moraleLow: 'Agité',
  calloutMineDropped: 'Mine larguée à la poupe ! Attirez vos poursuivants !',
  calloutMineBoom: 'Mine navale détonée ! Coque ennemie brisée !',
  bestiaryTab: 'Bestiaire',
  bestiaryKillsLabel: 'Coulés',
  bestiaryWeaknessLabel: 'Point faible',
  tabClasses: 'Navires',
  tabPerks: 'Atouts',
  controlsBtn: 'Paramètres',
  controlsTitle: 'Gouvernail, Graphismes & Son',
  graphicsLabel: 'Qualité Graphique',
  gfxLow: 'Bas',
  gfxMedium: 'Moyen',
  gfxHigh: 'Élevé',
  gfxUltra: 'Ultra',
  masterVolLabel: 'Volume Général',
  resetDefaultsBtn: 'Réinitialiser',
  chaptersBtn: 'Chapitres',
  chaptersTitle: 'Carte des Actes',
  statusCleared: 'Terminé',
  statusAvailable: 'Disponible',
  statusLocked: 'Verrouillé',
  playChapterBtn: 'Naviguer',
  switchConfirmTitle: 'Quitter la traversée ?',
  confirmSwitchBtn: 'Changer de mer',
  cancelBtn: 'Rester',
  statsHeader: 'Journal de Bord',
  statMiles: 'Milles Nautiques',
  statSunk: 'Navires Coulés',
  statAccuracy: 'Précision',
  statCombo: 'Combo Max',
  statMorale: 'Moral Final',
};

const DE: ExtraTranslationKeys = {
  ...EN,
  contractCursedName: 'Verfluchter Laderaum',
  contractCursedDesc: '+45% Schaden & +8% Nachladen; Gold schwindet auf See, Gegner +15% Schaden',
  contractCalmName: 'Flaute',
  contractCalmDesc: '2x Kanonenschaden & +25% Rammstoß; Höchsttempo um 45% gesenkt',
  ammoFire: '[4] Feuer',
  mineBtn: 'Mine [F]',
  moraleLabel: 'Moral',
  bestiaryTab: 'Bestiarium',
  tabClasses: 'Schiffsklassen',
  tabPerks: 'Talente',
  controlsBtn: 'Steuerung',
  controlsTitle: 'Steuerung, Grafik & Audio',
  graphicsLabel: 'Grafikqualität',
  gfxLow: 'Niedrig',
  gfxMedium: 'Mittel',
  gfxHigh: 'Hoch',
  gfxUltra: 'Ultra',
  masterVolLabel: 'Gesamtlautstärke',
  resetDefaultsBtn: 'Zurücksetzen',
  chaptersBtn: 'Kapitel',
  chaptersTitle: 'Seekarte der Kapitel',
  statusCleared: 'Abgeschlossen',
  statusAvailable: 'Verfügbar',
  statusLocked: 'Gesperrt',
  playChapterBtn: 'Segeln',
  switchConfirmTitle: 'Aktuelle Fahrt abbrechen?',
  confirmSwitchBtn: 'See wechseln',
  cancelBtn: 'Bleiben',
  statsHeader: 'Fahrtbericht',
  statMiles: 'Seemeilen',
  statSunk: 'Versenkt',
  statAccuracy: 'Trefferquote',
  statCombo: 'Max. Kombo',
  statMorale: 'Endmoral',
};

const ES: ExtraTranslationKeys = {
  ...EN,
  contractCursedName: 'Bodega Maldita',
  contractCursedDesc: '+45% daño y +8% recarga; el oro mengua en el mar, enemigos +15% daño',
  contractCalmName: 'Calma Chicha',
  contractCalmDesc: '2x daño de cañón y +25% embestida; velocidad reducida un 45%',
  ammoFire: '[4] Fuego',
  mineBtn: 'Mina [F]',
  moraleLabel: 'Moral',
  bestiaryTab: 'Bestiario',
  tabClasses: 'Barcos',
  tabPerks: 'Pericias',
  controlsBtn: 'Ajustes',
  controlsTitle: 'Controles, Gráficos y Audio',
  graphicsLabel: 'Calidad Gráfica',
  gfxLow: 'Baja',
  gfxMedium: 'Media',
  gfxHigh: 'Alta',
  gfxUltra: 'Ultra',
  masterVolLabel: 'Volumen Maestro',
  resetDefaultsBtn: 'Restaurar',
  chaptersBtn: 'Capítulos',
  chaptersTitle: 'Carta de Campaña',
  statusCleared: 'Completado',
  statusAvailable: 'Disponible',
  statusLocked: 'Bloqueado',
  playChapterBtn: 'Zarpar',
  switchConfirmTitle: '¿Abandonar travesía actual?',
  confirmSwitchBtn: 'Cambiar de mar',
  cancelBtn: 'Quedarse',
  statsHeader: 'Bitácora de Viaje',
  statMiles: 'Millas Náuticas',
  statSunk: 'Hundidos',
  statAccuracy: 'Precisión',
  statCombo: 'Combo Máx.',
  statMorale: 'Moral Final',
};

const PT: ExtraTranslationKeys = {
  ...EN,
  contractCursedName: 'Porão Amaldiçoado',
  contractCursedDesc: '+45% dano e +8% recarga; ouro drena no mar, inimigos +15% dano',
  contractCalmName: 'Calmaria Mortal',
  contractCalmDesc: '2x dano de canhão e +25% abalroamento; velocidade reduzida em 45%',
  ammoFire: '[4] Fogo',
  mineBtn: 'Mina [F]',
  moraleLabel: 'Moral',
  bestiaryTab: 'Bestiário',
  tabClasses: 'Navios',
  tabPerks: 'Perícias',
  controlsBtn: 'Opções',
  controlsTitle: 'Comandos, Gráficos e Som',
  graphicsLabel: 'Qualidade Gráfica',
  gfxLow: 'Baixa',
  gfxMedium: 'Média',
  gfxHigh: 'Alta',
  gfxUltra: 'Ultra',
  masterVolLabel: 'Volume Geral',
  resetDefaultsBtn: 'Padrão',
  chaptersBtn: 'Capítulos',
  chaptersTitle: 'Carta Náutica',
  statusCleared: 'Concluído',
  statusAvailable: 'Disponível',
  statusLocked: 'Bloqueado',
  playChapterBtn: 'Navegar',
  switchConfirmTitle: 'Abandonar viagem atual?',
  confirmSwitchBtn: 'Trocar de mar',
  cancelBtn: 'Ficar',
  statsHeader: 'Diário de Bordo',
  statMiles: 'Milhas Náuticas',
  statSunk: 'Afundados',
  statAccuracy: 'Precisão',
  statCombo: 'Combo Máx.',
  statMorale: 'Moral Final',
};

const UK: ExtraTranslationKeys = {
  ...RU,
  contractCursedName: 'Проклятий трюм',
  contractCursedDesc: '+45% до шкоди гармат і +8% до перезарядки; золото тане в морі, вороги +15% шкоди',
  contractCalmName: 'Мертвий штиль',
  contractCalmDesc: '2x шкода гармат і +25% таран; максимальна швидкість знижена на 45%',
  ammoFire: '[4] Вогонь',
  mineBtn: 'Міна [F]',
  moraleLabel: 'Мораль',
  bestiaryTab: 'Бестіарій',
  tabClasses: 'Судна',
  tabPerks: 'Перки',
  controlsBtn: 'Керування',
  controlsTitle: 'Штурвал, графіка та звук',
  graphicsLabel: 'Якість графіки',
  gfxLow: 'Низька',
  gfxMedium: 'Середня',
  gfxHigh: 'Висока',
  gfxUltra: 'Ультра',
  masterVolLabel: 'Загальна гучність',
  resetDefaultsBtn: 'Скинути',
  chaptersBtn: 'Розділи',
  chaptersTitle: 'Морська карта кампанії',
  statusCleared: 'Пройдено',
  statusAvailable: 'Доступно',
  statusLocked: 'Закрито',
  playChapterBtn: 'Вирушити',
  switchConfirmTitle: 'Перервати поточне плавання?',
  confirmSwitchBtn: 'Змінити море',
  cancelBtn: 'Лишитись',
  statsHeader: 'Підсумки рейсу',
  statMiles: 'Морських миль',
  statSunk: 'Потоплено',
  statAccuracy: 'Влучність',
  statCombo: 'Макс. серія',
  statMorale: 'Фінальна мораль',
};

const ZH: ExtraTranslationKeys = {
  ...EN,
  contractCursedName: '诅咒货舱',
  contractCursedDesc: '+45% 炮击伤害与 +8% 装填；出海持续损耗金币，敌方伤害 +15%',
  contractCalmName: '死水无风',
  contractCalmDesc: '双倍火炮伤害与 +25% 撞击；最高航速降低 45%',
  ammoFire: '[4] 燃烧弹',
  mineBtn: '水雷 [F]',
  moraleLabel: '士气',
  bestiaryTab: '海怪图鉴',
  tabClasses: '舰船分级',
  tabPerks: '船长天赋',
  controlsBtn: '设置',
  controlsTitle: '操控、画质与音量',
  graphicsLabel: '画质预设',
  gfxLow: '低',
  gfxMedium: '中',
  gfxHigh: '高',
  gfxUltra: '极高',
  masterVolLabel: '主音量',
  resetDefaultsBtn: '恢复默认',
  chaptersBtn: '章节',
  chaptersTitle: '战役海图',
  statusCleared: '已通关',
  statusAvailable: '可航行',
  statusLocked: '未解锁',
  playChapterBtn: '起航',
  switchConfirmTitle: '放弃当前航程？',
  confirmSwitchBtn: '切换海域',
  cancelBtn: '继续留守',
  statsHeader: '航行统计',
  statMiles: '航行海里',
  statSunk: '击沉敌舰',
  statAccuracy: '命中率',
  statCombo: '最高连击',
  statMorale: '最终士气',
};

const JA: ExtraTranslationKeys = {
  ...EN,
  contractCursedName: '呪われた船倉',
  contractCursedDesc: '砲撃+45% & 装填+8%；航海中ゴールド減少、敵火力+15%',
  contractCalmName: '死の凪',
  contractCalmDesc: '砲撃ダメージ2倍 & 衝角+25%；最大速度45%低下',
  ammoFire: '[4] 焼夷弾',
  mineBtn: '機雷 [F]',
  moraleLabel: '士気',
  bestiaryTab: '魔獣図鑑',
  tabClasses: '艦級',
  tabPerks: '艦長特性',
  controlsBtn: '設定',
  controlsTitle: '操作・画質・音量',
  graphicsLabel: '画質プリセット',
  gfxLow: '低',
  gfxMedium: '中',
  gfxHigh: '高',
  gfxUltra: '最高',
  masterVolLabel: 'マスター音量',
  resetDefaultsBtn: '初期化',
  chaptersBtn: '章選択',
  chaptersTitle: '海戦チャプター',
  statusCleared: '制覇済み',
  statusAvailable: '出撃可能',
  statusLocked: '未開放',
  playChapterBtn: '出航',
  switchConfirmTitle: '現在の航海を中断しますか？',
  confirmSwitchBtn: '海域を変更',
  cancelBtn: '続ける',
  statsHeader: '航海戦果',
  statMiles: '航行海里',
  statSunk: '撃沈数',
  statAccuracy: '命中率',
  statCombo: '最大コンボ',
  statMorale: '最終士気',
};

const AR: ExtraTranslationKeys = {
  ...EN,
  contractCursedName: 'عنبر ملعون',
  contractCursedDesc: '+45% ضرر المدافع و+8% تلقيم؛ يتناقص الذهب في البحر وأعداء +15% ضرر',
  contractCalmName: 'سكون قاتل',
  contractCalmDesc: 'ضرر مدفعي مضاعف و+25% صدم؛ تنخفض السرعة القصوى 45%',
  ammoFire: '[4] حارق',
  mineBtn: 'لغم [F]',
  moraleLabel: 'المعنويات',
  bestiaryTab: 'سجل الوحوش',
  tabClasses: 'السفن',
  tabPerks: 'المهارات',
  controlsBtn: 'الإعدادات',
  controlsTitle: 'التحكم والرسوميات والصوت',
  graphicsLabel: 'جودة الرسوميات',
  gfxLow: 'منخفضة',
  gfxMedium: 'متوسطة',
  gfxHigh: 'عالية',
  gfxUltra: 'فائقة',
  masterVolLabel: 'مستوى الصوت',
  chaptersBtn: 'الفصول',
  chaptersTitle: 'خريطة الحملة',
  statusCleared: 'مكتمل',
  statusAvailable: 'متاح',
  statusLocked: 'مقفل',
  playChapterBtn: 'أبحر',
  switchConfirmTitle: 'مغادرة الرحلة الحالية؟',
  confirmSwitchBtn: 'تبديل البحر',
  cancelBtn: 'البقاء',
  statsHeader: 'إحصاءات الإبحار',
  statMiles: 'أميال بحرية',
  statSunk: 'غرقى',
  statAccuracy: 'الدقة',
  statCombo: 'أعلى تتابع',
  statMorale: 'المعنويات',
};

const PL: ExtraTranslationKeys = {
  ...EN,
  contractCursedName: 'Przeklęta Ładownia',
  contractCursedDesc: '+45% obrażeń i +8% przeładowania; złoto ubywa na morzu, wrogowie +15% obrażeń',
  contractCalmName: 'Martwa Cisza',
  contractCalmDesc: '2x obrażenia dział i +25% taran; prędkość maksymalna -45%',
  ammoFire: '[4] Ogień',
  mineBtn: 'Mina [F]',
  moraleLabel: 'Morale',
  bestiaryTab: 'Bestiariusz',
  tabClasses: 'Okręty',
  tabPerks: 'Talenty',
  controlsBtn: 'Sterowanie',
  controlsTitle: 'Sterowanie, Grafika i Dźwięk',
  graphicsLabel: 'Jakość grafiki',
  gfxLow: 'Niska',
  gfxMedium: 'Średnia',
  gfxHigh: 'Wysoka',
  gfxUltra: 'Ultra',
  masterVolLabel: 'Głośność główna',
  chaptersBtn: 'Rozdziały',
  chaptersTitle: 'Mapa Kampanii',
  statusCleared: 'Ukończono',
  statusAvailable: 'Dostępny',
  statusLocked: 'Zablokowany',
  playChapterBtn: 'Wypłyń',
  switchConfirmTitle: 'Porzucić obecny rejs?',
  confirmSwitchBtn: 'Zmień morze',
  cancelBtn: 'Zostań',
  statsHeader: 'Raport z Rejsu',
  statMiles: 'Mile Morskie',
  statSunk: 'Zatopieni',
  statAccuracy: 'Celność',
  statCombo: 'Maks. seria',
  statMorale: 'Morale końcowe',
};

const IT: ExtraTranslationKeys = {
  ...EN,
  contractCursedName: 'Stiva Maledetta',
  contractCursedDesc: '+45% danni e +8% ricarica; l’oro cala in mare, nemici +15% danni',
  contractCalmName: 'Bonaccia Mortale',
  contractCalmDesc: '2x danni cannoni e +25% speronamento; velocità ridotta del 45%',
  ammoFire: '[4] Fuoco',
  mineBtn: 'Mina [F]',
  moraleLabel: 'Morale',
  bestiaryTab: 'Bestiario',
  tabClasses: 'Vascelli',
  tabPerks: 'Talenti',
  controlsBtn: 'Comandi',
  controlsTitle: 'Comandi, Grafica e Audio',
  graphicsLabel: 'Qualità Grafica',
  gfxLow: 'Bassa',
  gfxMedium: 'Media',
  gfxHigh: 'Alta',
  gfxUltra: 'Ultra',
  masterVolLabel: 'Volume Principale',
  chaptersBtn: 'Capitoli',
  chaptersTitle: 'Carta della Campagna',
  statusCleared: 'Completato',
  statusAvailable: 'Disponibile',
  statusLocked: 'Bloccato',
  playChapterBtn: 'Salpa',
  switchConfirmTitle: 'Abbandonare la rotta attuale?',
  confirmSwitchBtn: 'Cambia mare',
  cancelBtn: 'Resta',
  statsHeader: 'Diario di Bordo',
  statMiles: 'Miglia Nautiche',
  statSunk: 'Affondati',
  statAccuracy: 'Precisione',
  statCombo: 'Combo Max',
  statMorale: 'Morale Finale',
};

const VI: ExtraTranslationKeys = {
  ...EN,
  contractCursedName: 'Khoang Bị Nguyền',
  contractCursedDesc: '+45% sát thương & +8% nạp đạn; vàng hao mòn trên biển, địch +15% sát thương',
  contractCalmName: 'Biển Lặng Chết Chóc',
  contractCalmDesc: 'Gấp đôi sát thương đại bác & +25% húc; tốc độ tối đa giảm 45%',
  ammoFire: '[4] Đạn Cháy',
  mineBtn: 'Thủy Lôi [F]',
  moraleLabel: 'Sĩ Khí',
  bestiaryTab: 'Quái Thú',
  tabClasses: 'Chiến Hạm',
  tabPerks: 'Thiên Phú',
  controlsBtn: 'Điều Khiển',
  controlsTitle: 'Phím, Đồ Họa & Âm Thanh',
  graphicsLabel: 'Chất Lượng Đồ Họa',
  gfxLow: 'Thấp',
  gfxMedium: 'Trung Bình',
  gfxHigh: 'Cao',
  gfxUltra: 'Cực Cao',
  masterVolLabel: 'Âm Lượng Tổng',
  chaptersBtn: 'Chương',
  chaptersTitle: 'Hải Đồ Chiến Dịch',
  statusCleared: 'Đã Vượt',
  statusAvailable: 'Khả Dụng',
  statusLocked: 'Đã Khóa',
  playChapterBtn: 'Ra Khơi',
  switchConfirmTitle: 'Hủy hải trình hiện tại?',
  confirmSwitchBtn: 'Đổi Vùng Biển',
  cancelBtn: 'Ở Lại',
  statsHeader: 'Tổng Kết Hải Trình',
  statMiles: 'Hải Lý',
  statSunk: 'Đã Đánh Chìm',
  statAccuracy: 'Độ Chính Xác',
  statCombo: 'Chuỗi Cao Nhất',
  statMorale: 'Sĩ Khí Cuối',
};

const FA: ExtraTranslationKeys = {
  ...EN,
  contractCursedName: 'انبار نفرین‌شده',
  contractCursedDesc: '+45% آسیب توپ و +8% بارگذاری؛ طلا در دریا کم می‌شود، دشمن +15% آسیب',
  contractCalmName: 'آرامش مرگبار',
  contractCalmDesc: '۲ برابر آسیب توپ و +25% کوبش؛ بیشینه سرعت ۴۵٪ کاهش می‌یابد',
  ammoFire: '[4] آتشین',
  mineBtn: 'مین [F]',
  moraleLabel: 'روحیه',
  bestiaryTab: 'هیولانامه',
  tabClasses: 'کشتی‌ها',
  tabPerks: 'مهارت‌ها',
  controlsBtn: 'تنظیمات',
  controlsTitle: 'کلیدها، گرافیک و صدا',
  graphicsLabel: 'کیفیت گرافیک',
  gfxLow: 'پایین',
  gfxMedium: 'متوسط',
  gfxHigh: 'بالا',
  gfxUltra: 'بیشینه',
  masterVolLabel: 'صدای کل',
  chaptersBtn: 'فصل‌ها',
  chaptersTitle: 'نقشه نبرد',
  statusCleared: 'تکمیل‌شده',
  statusAvailable: 'دردسترس',
  statusLocked: 'قفل',
  playChapterBtn: 'بادبان بکش',
  switchConfirmTitle: 'سفر فعلی رها شود؟',
  confirmSwitchBtn: 'تغییر دریا',
  cancelBtn: 'ماندن',
  statsHeader: 'گزارش سفر',
  statMiles: 'مایل دریایی',
  statSunk: 'غرق‌شده‌ها',
  statAccuracy: 'دقت',
  statCombo: 'اوج زنجیره',
  statMorale: 'روحیه نهایی',
};

const QYA: ExtraTranslationKeys = {
  ...EN,
  contractCursedName: 'Ráca Húro',
  contractCursedDesc: '+45% macil & +8% síma; malta firuva earëssë',
  contractCalmName: 'Quildë Earë',
  contractCalmDesc: '2x alca & +25% ram; linta nuinë 45%',
  ammoFire: '[4] Nárë',
  mineBtn: 'Mína [F]',
  moraleLabel: 'Órë',
  bestiaryTab: 'Móri',
  tabClasses: 'Ciryar',
  tabPerks: 'Curu',
  controlsBtn: 'Tengwë',
  chaptersBtn: 'Centa',
  statusCleared: 'Telyana',
  statusAvailable: 'Lerta',
  statusLocked: 'Panta',
  statsHeader: 'Centa Earë',
};

const ORK: ExtraTranslationKeys = {
  ...EN,
  contractCursedName: 'Kursed ’Old',
  contractCursedDesc: '+45% dakka! Gold leaks out, git-foes hit +15% ’arder!',
  contractCalmName: 'Dead Kalm',
  contractCalmDesc: '2x big boomz & +25% rammin’! Boat moves 45% slower!',
  ammoFire: '[4] Burna',
  mineBtn: 'Boom-Keg [F]',
  moraleLabel: 'Waaagh!',
  bestiaryTab: 'Beastz',
  tabClasses: 'Kroozerz',
  tabPerks: 'Tricks',
  controlsBtn: 'Buttonz',
  chaptersBtn: 'Waaagh Map',
  statusCleared: 'Krumped',
  statusAvailable: 'Ready',
  statusLocked: 'Locked',
  statsHeader: 'Loot Report',
};

export const EXTRA_TRANSLATIONS: Record<LanguageCode, ExtraTranslationKeys> = {
  en: EN,
  fr: FR,
  de: DE,
  es: ES,
  pt: PT,
  zh: ZH,
  ar: AR,
  uk: UK,
  ru: RU,
  ja: JA,
  pl: PL,
  it: IT,
  vi: VI,
  fa: FA,
  qya: QYA,
  ork: ORK,
};

export function getExtraT(lang: LanguageCode): ExtraTranslationKeys {
  return EXTRA_TRANSLATIONS[lang] ?? EN;
}
