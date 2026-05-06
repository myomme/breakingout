import { createLargeHexMap } from "../editor/gridGenerator.js";
import { RaidGameState } from "./gameState.js";
import { GameRenderer } from "./gameRenderer.js";

const canvas = document.querySelector("#gameCanvas");
const mapImport = document.querySelector("#gameMapImport");
const resetRaid = document.querySelector("#resetRaid");
const lootAction = document.querySelector("#lootAction");
const attackAction = document.querySelector("#attackAction");
const endTurn = document.querySelector("#endTurn");
const nextRaid = document.querySelector("#nextRaid");
const tileActionPopup = document.querySelector("#tileActionPopup");
const attackOverlay = document.querySelector("#attackOverlay");
const attackDiceTray = document.querySelector("#attackDiceTray");
const weaponSelect = document.querySelector("#weaponSelect");
const moveMode = document.querySelector("#moveMode");
const armorSelect = document.querySelector("#armorSelect");
const loadoutPanel = document.querySelector("#loadoutPanel");
const loadoutHeader = document.querySelector(".loadout-header");
const minimizeLoadout = document.querySelector("#minimizeLoadout");
const tabEquipment = document.querySelector("#tabEquipment");
const tabBag = document.querySelector("#tabBag");
const tabEvent = document.querySelector("#tabEvent");
const tabOther = document.querySelector("#tabOther");
const loadoutTitle = document.querySelector("#loadoutTitle");
const loadoutSubtitle = document.querySelector("#loadoutSubtitle");
const weaponCardTitle = document.querySelector("#weaponCardTitle");
const weaponDiceBadge = document.querySelector("#weaponDiceBadge");
const weaponCardStats = document.querySelector("#weaponCardStats");
const weaponPassive = document.querySelector("#weaponPassive");
const bagSlotsLabel = document.querySelector("#bagSlotsLabel");
const raidStatus = document.querySelector("#raidStatus");
const raidNumber = document.querySelector("#raidNumber");
const phaseNumber = document.querySelector("#phaseNumber");
const raidProgressLabel = document.querySelector("#raidProgressLabel");
const phaseProgressLabel = document.querySelector("#phaseProgressLabel");
const raidProgressSegments = document.querySelector("#raidProgressSegments");
const phaseProgressSegments = document.querySelector("#phaseProgressSegments");
const turnTimerValue = document.querySelector("#turnTimerValue");
const turnTimerLabel = document.querySelector("#turnTimerLabel");
const activePlayer = document.querySelector("#activePlayer");
const turnOrder = document.querySelector("#turnOrder");
const turnBonus = document.querySelector("#turnBonus");
const staminaValue = document.querySelector("#staminaValue");
const actionState = document.querySelector("#actionState");
const raidResult = document.querySelector("#raidResult");
const currentEvent = document.querySelector("#currentEvent");
const eventEffect = document.querySelector("#eventEffect");
const playerPosition = document.querySelector("#playerPosition");
const bagValue = document.querySelector("#bagValue");
const stashValue = document.querySelector("#stashValue");
const bagList = document.querySelector("#bagList");
const actionLog = document.querySelector("#actionLog");
const opponentTurnOverlay = document.querySelector("#opponentTurnOverlay");
const bodyHp = document.querySelector("#bodyHp");
const diceResults = document.querySelector("#diceResults");
const targetHp = document.querySelector("#targetHp");
const playerArmor = document.querySelector("#playerArmor");
const targetArmor = document.querySelector("#targetArmor");
const moveLimit = document.querySelector("#moveLimit");
const tileDetails = document.querySelector("#gameTileDetails");
const raidLog = document.querySelector("#raidLog");
const killLog = document.querySelector("#killLog");
const raidSummaryOverlay = document.querySelector("#raidSummaryOverlay");
const raidSummaryTitle = document.querySelector("#raidSummaryTitle");
const raidSummaryCountdown = document.querySelector("#raidSummaryCountdown");
const raidSummaryStats = document.querySelector("#raidSummaryStats");
const gameSummaryActions = document.querySelector("#gameSummaryActions");
const restartGameButton = document.querySelector("#restartGameButton");
const returnLobbyButton = document.querySelector("#returnLobbyButton");
const lootOverlay = document.querySelector("#lootOverlay");
const lootRevealCard = document.querySelector("#lootRevealCard");
const lootRevealImage = document.querySelector("#lootRevealImage");
const lootRevealTier = document.querySelector("#lootRevealTier");
const lootRevealName = document.querySelector("#lootRevealName");
const lootRevealValue = document.querySelector("#lootRevealValue");
const corpseLootOverlay = document.querySelector("#corpseLootOverlay");
const corpseLootTitle = document.querySelector("#corpseLootTitle");
const corpseLootTimer = document.querySelector("#corpseLootTimer");
const corpseLootClose = document.querySelector("#corpseLootClose");
const corpseLootItems = document.querySelector("#corpseLootItems");
const corpseLootPlayerBag = document.querySelector("#corpseLootPlayerBag");
const corpseLootBagStatus = document.querySelector("#corpseLootBagStatus");
const startOverlay = document.querySelector("#startOverlay");
const startOverlayStatus = document.querySelector("#startOverlayStatus");
const startGameButton = document.querySelector("#startGameButton");
const loginStep = document.querySelector("#loginStep");
const lobbyStep = document.querySelector("#lobbyStep");
const roomStep = document.querySelector("#roomStep");
const nicknameInput = document.querySelector("#nicknameInput");
const enterLobbyButton = document.querySelector("#enterLobbyButton");
const lobbyNickname = document.querySelector("#lobbyNickname");
const createRoomButton = document.querySelector("#createRoomButton");
const roomCodeInput = document.querySelector("#roomCodeInput");
const joinRoomButton = document.querySelector("#joinRoomButton");
const refreshRoomsButton = document.querySelector("#refreshRoomsButton");
const roomList = document.querySelector("#roomList");
const roomCodeLabel = document.querySelector("#roomCodeLabel");
const leaveRoomButton = document.querySelector("#leaveRoomButton");
const roomSlotList = document.querySelector("#roomSlotList");
const addMockPlayerButton = document.querySelector("#addMockPlayerButton");
const clearMockPlayersButton = document.querySelector("#clearMockPlayersButton");
const roomMapImport = document.querySelector("#roomMapImport");
const roomMapName = document.querySelector("#roomMapName");
const roomMapStatus = document.querySelector("#roomMapStatus");
const roomMapMeta = document.querySelector("#roomMapMeta");
const comPlayerCount = document.querySelector("#comPlayerCount");
const playerLoadoutSettings = document.querySelector("#playerLoadoutSettings");
const comLoadoutSettings = document.querySelector("#comLoadoutSettings");

let state;
let renderer;
let playerTemplate;
let lootTables;
let weapons;
let dice;
let armor;
let events;
let pendingTileAction = null;
let attackSequenceRunning = false;
let cardRevealRunning = false;
let eventRevealRunning = false;
let movementSequenceRunning = false;
let aiTurnRunning = false;
let aiTurnTimer = 0;
let opponentMessageTimer = 0;
let turnTimerInterval = 0;
let turnTimerStartedAt = 0;
let turnTimerPlayerIndex = null;
let turnTimerPhase = null;
let lastHudRaid = null;
let lastHudPhase = null;
let raidAutoAdvanceTimer = 0;
let raidAutoAdvanceRemaining = 0;
let raidAutoAdvanceRunning = false;
let raidAutoAdvanceSourceRaid = 0;
let activeDrawerTab = "equipment";
let orderCardDisplay = null;
let orderCardBadge = null;
let orderCardSummary = null;
let eventDrawerTitle = null;
let eventDrawerEffect = null;
let eventPhaseBadge = null;
let eventCardPreview = null;
let eventHoldList = null;
let eventDebugSelect = null;
let eventDebugRun = null;
let soundSettingsList = null;
let simulationRunCount = null;
let simulationRunButton = null;
let simulationOutput = null;
let raidOrderOverlay = null;
let raidOrderStage = null;
let audioUnlocked = false;
let audioUnlockBound = false;
const queuedSounds = [];
let gameStarted = false;
let gameStarting = false;
let gameBootstrapped = false;
let simulationRunning = false;
let lobbySession = createEmptyLobbySession();
let corpseLootSession = null;
let corpseLootTimerInterval = 0;
let currentMapData = null;
let lastActivePlayerIndexForUi = null;
const unreadTabs = new Set();
const lastBagCountsByPlayer = new Map();
const roomMapCache = new Map();
let roomStoreCache = [];
const ROOM_STORAGE_KEY = "breakingOutPrototypeRooms";
const LOCAL_PLAYER_STORAGE_KEY = "breakingOutPrototypePlayer";
const SESSION_PLAYER_ID_KEY = "breakingOutPrototypeSessionPlayerId";
const SESSION_ROOM_ID_KEY = "breakingOutPrototypeSessionRoomId";
const ROOM_SYNC_CHANNEL = "breakingOutPrototypeRoomSync";
const GAME_STATE_STORAGE_PREFIX = "breakingOutPrototypeGameState:";
const PLAYER_COMMAND_STORAGE_PREFIX = "breakingOutPrototypePlayerCommand:";
const PRESENCE_HEARTBEAT_MS = 4000;
const RECONNECT_GRACE_MS = 90000;
let roomSyncChannel = null;
let gameServerSocket = null;
let gameServerConnected = false;
let pendingServerSnapshotRoomId = null;
let queuedRemoteGameSnapshot = null;
const pendingRoomActions = new Map();
let applyingRemoteSnapshot = false;
let lastSnapshotVersion = 0;
let remoteOrderRevealPlayedVersion = 0;
let activeOrderRevealVersion = 0;
const playedAttackRevealVersions = new Set();
const playedEventRevealVersions = new Set();
const processedRemoteCommandIds = new Set();
let presenceHeartbeatTimer = 0;

const ORDER_CARD_IMAGES = Object.fromEntries(
  Array.from({ length: 8 }, (_, index) => {
    const cardNumber = index + 1;
    return [cardNumber, new URL(`../../assets/cards/%EC%88%9C%EC%84%9C%20%EC%B9%B4%EB%93%9C/${cardNumber}.png`, import.meta.url).href];
  })
);

const WEAPON_CARD_IMAGES = {
  AR: new URL("../../assets/cards/%EB%AC%B4%EA%B8%B0%20%EC%B9%B4%EB%93%9C/AR.png", import.meta.url).href,
  SMG: new URL("../../assets/cards/%EB%AC%B4%EA%B8%B0%20%EC%B9%B4%EB%93%9C/SMG.png", import.meta.url).href,
  SR: new URL("../../assets/cards/%EB%AC%B4%EA%B8%B0%20%EC%B9%B4%EB%93%9C/SR.png", import.meta.url).href,
  DMR: new URL("../../assets/cards/%EB%AC%B4%EA%B8%B0%20%EC%B9%B4%EB%93%9C/DMR.png", import.meta.url).href
};

const EVENT_CARD_IMAGES = Object.fromEntries(
  Array.from({ length: 16 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return [index + 1, new URL(`../../assets/cards/eventcards/${number}.png`, import.meta.url).href];
  })
);

const SOUND_URLS = {
  diceRoll1: new URL("../../assets/sfx/dice_roll1.mp3", import.meta.url).href,
  diceRoll2: new URL("../../assets/sfx/dice_roll2.mp3", import.meta.url).href,
  pieceTap: new URL("../../assets/sfx/piece_tap.mp3", import.meta.url).href,
  hit: new URL("../../assets/sfx/hit.mp3", import.meta.url).href,
  AR: new URL("../../assets/sfx/AR.mp3", import.meta.url).href,
  DMR: new URL("../../assets/sfx/DMR.mp3", import.meta.url).href,
  SR: new URL("../../assets/sfx/SR.mp3", import.meta.url).href,
  SMG: new URL("../../assets/sfx/SMG.mp3", import.meta.url).href,
  pageUp: new URL("../../assets/sfx/page_up.mp3", import.meta.url).href,
  backpackOpen: new URL("../../assets/sfx/backpack_open.mp3", import.meta.url).href,
  backpackClose: new URL("../../assets/sfx/backpack_close.mp3", import.meta.url).href,
  drawerOpen: new URL("../../assets/sfx/drawer_open.mp3", import.meta.url).href,
  drawerClose: new URL("../../assets/sfx/drawer_close.mp3", import.meta.url).href,
  ticktock: new URL("../../assets/sfx/ticktock.mp3", import.meta.url).href,
  switchOff: new URL("../../assets/sfx/switchoff.mp3", import.meta.url).href,
  commonLoot: new URL("../../assets/sfx/common.mp3", import.meta.url).href,
  goldLoot: new URL("../../assets/sfx/gold.mp3", import.meta.url).href,
  gameStart: new URL("../../assets/sfx/game%20start.mp3", import.meta.url).href,
  cardDraw: new URL("../../assets/sfx/card_draw.mp3", import.meta.url).href,
  cardFlick: new URL("../../assets/sfx/card_flick.mp3", import.meta.url).href
};

const SOUND_SETTINGS = {
  master: 100,
  gameStart: 100,
  pageUp: 100,
  backpackOpen: 100,
  backpackClose: 100,
  cardDraw: 100,
  cardFlick: 100,
  drawerOpen: 100,
  drawerClose: 100,
  pieceTap: 100,
  diceRoll1: 100,
  diceRoll2: 100,
  AR: 37,
  SMG: 100,
  SR: 100,
  DMR: 100,
  hit: 100,
  ticktock: 100,
  switchOff: 100,
  commonLoot: 100,
  goldLoot: 100
};

const SOUND_SETTING_DEFS = [
  { key: "master", label: "Master" },
  { key: "gameStart", label: "Game Start" },
  { key: "pageUp", label: "Tab Open" },
  { key: "backpackOpen", label: "Backpack Open" },
  { key: "backpackClose", label: "Backpack Close" },
  { key: "cardDraw", label: "Card Draw" },
  { key: "cardFlick", label: "Card Flick" },
  { key: "drawerOpen", label: "Loot Open" },
  { key: "drawerClose", label: "Loot Close" },
  { key: "pieceTap", label: "Piece Tap" },
  { key: "diceRoll1", label: "Dice Roll 1" },
  { key: "diceRoll2", label: "Dice Roll 2" },
  { key: "AR", label: "AR Shot" },
  { key: "SMG", label: "SMG Shot" },
  { key: "SR", label: "SR Shot" },
  { key: "DMR", label: "DMR Shot" },
  { key: "hit", label: "Hit Impact" },
  { key: "ticktock", label: "Countdown Tick" },
  { key: "switchOff", label: "Turn Switch" },
  { key: "commonLoot", label: "Common Loot" },
  { key: "goldLoot", label: "Gold Loot" }
];

const SOUND_URL_TO_KEY = Object.fromEntries(
  Object.entries(SOUND_URLS).map(([key, value]) => [value, key])
);

const AI_TURN_TIMING = {
  turnStart: [220, 520],
  thinkBeforeAction: [260, 620],
  targetConfirm: [220, 520],
  afterVisibleAction: [420, 900],
  afterHiddenAction: [240, 640],
  betweenActions: [260, 700],
  turnEnd: [240, 620]
};

const AI_PROFILE_SETTINGS = {
  aggressive: {
    label: "Aggressive",
    attackScoreBonus: 2.2,
    attackThresholdOffset: -1.4,
    chaseTolerance: 2,
    lootScoreBonus: -1,
    lootRiskMultiplier: 0.9,
    extractValueOffset: 4,
    extractDistanceOffset: -1
  },
  looter: {
    label: "Looter",
    attackScoreBonus: -0.8,
    attackThresholdOffset: 1.1,
    chaseTolerance: -1,
    lootScoreBonus: 5,
    lootRiskMultiplier: 0.8,
    extractValueOffset: 2,
    extractDistanceOffset: 1
  },
  survivor: {
    label: "Survivor",
    attackScoreBonus: -1.6,
    attackThresholdOffset: 2.2,
    chaseTolerance: -2,
    lootScoreBonus: -0.5,
    lootRiskMultiplier: 1.35,
    extractValueOffset: -4,
    extractDistanceOffset: 2
  },
  balanced: {
    label: "Balanced",
    attackScoreBonus: 0,
    attackThresholdOffset: 0,
    chaseTolerance: 0,
    lootScoreBonus: 0,
    lootRiskMultiplier: 1,
    extractValueOffset: 0,
    extractDistanceOffset: 0
  },
  hunter: {
    label: "Hunter",
    attackScoreBonus: 1.4,
    attackThresholdOffset: -0.7,
    chaseTolerance: 1,
    lootScoreBonus: -2,
    lootRiskMultiplier: 1.05,
    extractValueOffset: 6,
    extractDistanceOffset: -1
  }
};

function createEmptyLobbySession() {
  return {
    localPlayerId: createLocalId("player"),
    nickname: "",
    currentRoom: null
  };
}

function createLocalId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 9999).toString(36)}`;
}

async function loadJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  return response.json();
}

function initStartOverlay() {
  if (!startGameButton) {
    bootstrap().catch((error) => {
      if (canvas) {
        canvas.replaceWith(document.createTextNode(error.message));
      }
    });
    return;
  }

  bindAudioUnlock();
  restoreLobbySession();
  initRoomSync();
  initServerSync();
  startPresenceHeartbeat();
  bindLobbyEvents();
  startGameButton.addEventListener("click", handleStartGame);
  bootstrap().catch((error) => {
    if (startOverlayStatus) {
      startOverlayStatus.textContent = error.message;
    }
  });
  renderLobby();
}

async function handleStartGame({ remoteStart = false } = {}) {
  if (gameStarted || gameStarting) {
    return;
  }

  if (!lobbySession.currentRoom) {
    setStartStatus("방에 입장한 뒤 게임을 시작하세요.");
    showLobbyStep("lobby");
    return;
  }

  if (!remoteStart && !isLocalHost()) {
    setStartStatus("게임 시작은 방장만 할 수 있습니다.");
    return;
  }

  if (!remoteStart && !areHumanPlayersReady(lobbySession.currentRoom)) {
    setStartStatus("모든 참가자가 READY를 눌러야 게임을 시작할 수 있습니다.");
    renderRoomPanel();
    return;
  }

  if (!applyRoomMapPackage(lobbySession.currentRoom)) {
    setStartStatus("방 맵을 아직 다운로드하지 못했습니다. 방장이 맵을 다시 설정해 주세요.");
    return;
  }

  gameStarting = true;
  audioUnlocked = true;
  startGameButton.disabled = true;
  if (startOverlayStatus) {
    startOverlayStatus.textContent = "Revealing order cards...";
  }

  try {
    if (!gameBootstrapped) {
      if (startOverlayStatus) {
        startOverlayStatus.textContent = "Loading raid systems...";
      }
      await bootstrap();
    }

    if (currentMapData) {
      state = createRaidState(currentMapData);
      clearPendingTileAction();
      renderer.replaceState(state);
      updateUi();
      renderer.render();
    }

    playSound(SOUND_URLS.gameStart, { volume: 0.86 }, { allowQueue: false });
    if (startOverlay) {
      startOverlay.hidden = true;
    }
    gameStarted = true;

    if (remoteStart) {
      actionLog.textContent = "방장 상태 동기화를 기다리는 중입니다.";
      renderer.render();
      updateUi({ skipSnapshotBroadcast: true });
      gameStarting = false;
      return;
    }

    markCurrentRoomInProgress();
    broadcastGameSnapshot("orderReveal");
    await wait(160);
    await playRaidOrderReveal();
    broadcastGameSnapshot("gameStart");
    queueAiTurn();
    if (comPlayerCount) {
      comPlayerCount.disabled = true;
    }
  } catch (error) {
    gameStarting = false;
    startGameButton.disabled = false;
    if (startOverlay) {
      startOverlay.hidden = false;
    }
    if (startOverlayStatus) {
      startOverlayStatus.textContent = error.message;
    }
    return;
  }

  gameStarting = false;
}

async function bootstrap() {
  if (gameBootstrapped) {
    return;
  }

  const [terrainTypes, loadedPlayerTemplate, loadedLootTables, loadedWeapons, loadedDice, loadedArmor, loadedEvents] = await Promise.all([
    loadJson("./data/rules/terrainTypes.json"),
    loadJson("./data/rules/playerTemplate.json"),
    loadJson("./data/rules/lootTables.json"),
    loadJson("./data/rules/weapons.json"),
    loadJson("./data/rules/dice.json"),
    loadJson("./data/rules/armor.json"),
    loadJson("./data/rules/events.json")
  ]);

  playerTemplate = loadedPlayerTemplate;
  lootTables = loadedLootTables;
  weapons = loadedWeapons;
  dice = loadedDice;
  armor = loadedArmor;
  events = loadedEvents;

  const mapData = createLargeHexMap({ columns: 18, rows: 12, hexSize: 30 });
  seedPlayableTestMap(mapData);
  currentMapData = mapData;

  populateWeapons();
  populateArmor();
  renderPlayerLoadoutSettings();
  renderComLoadoutSettings();

  state = createRaidState(mapData);
  renderer = new GameRenderer({
    canvas,
    state,
    terrainTypes,
    onTileClick: handleTileClick,
    onMovementStep: handleMovementStepSfx,
    getViewerPlayer: getUiPlayer
  });

  bindAudioUnlock();
  bindEvents();
  initTopDrawerUi();
  updateUi();
  renderer.render();
  gameBootstrapped = true;
  if (startOverlayStatus) {
    startOverlayStatus.textContent = "Load a map if needed, then press Start Game.";
  }
}

function createRaidState(mapData) {
  return new RaidGameState({
    mapData,
    playerTemplate,
    lootTables,
    weapons,
    dice,
    armor,
    events,
    aiCount: Math.max(0, getConfiguredPlayerLoadouts().length - 1),
    playerLoadouts: getConfiguredPlayerLoadouts()
  });
}

function getConfiguredAiCount() {
  return getRoomSlots().filter((slot) => slot.type === "computer").length;
}

function getConfiguredPlayerLoadouts() {
  let humanIndex = 0;
  let computerIndex = 0;
  return getRoomSlots()
    .filter((slot) => slot.type === "player" || slot.type === "computer")
    .map((slot) => {
      if (slot.type === "computer") {
        computerIndex += 1;
        return {
          name: `COM ${computerIndex}`,
          controllerId: null,
          isAi: true,
          weaponId: slot.weaponId ?? "SMG",
          armorId: slot.armorId ?? "lightSet"
        };
      }

      humanIndex += 1;
      return {
        name: slot.nickname || `Player ${humanIndex}`,
        controllerId: slot.playerId,
        isAi: false,
        weaponId: slot.weaponId ?? "AR",
        armorId: slot.armorId ?? "lightSet"
      };
    });
}

function renderPlayerLoadoutSettings() {
  if (!playerLoadoutSettings || !weapons || !armor) {
    return;
  }

  const previousWeapon = document.querySelector("#playerStartWeapon")?.value ?? "AR";
  const previousArmor = document.querySelector("#playerStartArmor")?.value ?? "lightSet";

  playerLoadoutSettings.innerHTML = `
    <div class="com-loadout-row player-loadout-row">
      <strong>${escapeHtml(lobbySession.nickname || "Player 1")}</strong>
      <select id="playerStartWeapon" aria-label="Player 1 weapon"></select>
      <select id="playerStartArmor" aria-label="Player 1 armor"></select>
    </div>
  `;

  const playerWeaponSelect = playerLoadoutSettings.querySelector("#playerStartWeapon");
  const playerArmorSelect = playerLoadoutSettings.querySelector("#playerStartArmor");

  Object.entries(weapons).forEach(([weaponId, weapon]) => {
    const option = document.createElement("option");
    option.value = weaponId;
    option.textContent = `${weaponId} ${weapon.label ?? weaponId}`;
    playerWeaponSelect.append(option);
  });

  Object.entries(armor).forEach(([armorId, armorItem]) => {
    const option = document.createElement("option");
    option.value = armorId;
    option.textContent = armorItem.name ?? armorId;
    playerArmorSelect.append(option);
  });

  playerWeaponSelect.value = weapons[previousWeapon] ? previousWeapon : "AR";
  playerArmorSelect.value = armor[previousArmor] ? previousArmor : "lightSet";
}

function renderComLoadoutSettings() {
  if (!comLoadoutSettings || !weapons || !armor) {
    return;
  }

  const aiCount = getConfiguredAiCount();
  const previousLoadouts = getConfiguredPlayerLoadouts();
  const hostControlsDisabled = lobbySession.currentRoom && !isLocalHost();

  comLoadoutSettings.innerHTML = "";

  for (let index = 1; index <= aiCount; index += 1) {
    const row = document.createElement("div");
    row.className = "com-loadout-row";
    row.innerHTML = `
      <strong>COM ${index}</strong>
      <select id="comWeapon${index}" aria-label="COM ${index} weapon"></select>
      <select id="comArmor${index}" aria-label="COM ${index} armor"></select>
    `;

    const weaponSelectForCom = row.querySelector(`#comWeapon${index}`);
    const armorSelectForCom = row.querySelector(`#comArmor${index}`);

    Object.entries(weapons).forEach(([weaponId, weapon]) => {
      const option = document.createElement("option");
      option.value = weaponId;
      option.textContent = `${weaponId} ${weapon.label ?? weaponId}`;
      weaponSelectForCom.append(option);
    });

    Object.entries(armor).forEach(([armorId, armorItem]) => {
      const option = document.createElement("option");
      option.value = armorId;
      option.textContent = armorItem.name ?? armorId;
      armorSelectForCom.append(option);
    });

    weaponSelectForCom.value = previousLoadouts[index]?.weaponId ?? "SMG";
    armorSelectForCom.value = previousLoadouts[index]?.armorId ?? "lightSet";
    weaponSelectForCom.disabled = Boolean(hostControlsDisabled);
    armorSelectForCom.disabled = Boolean(hostControlsDisabled);
    comLoadoutSettings.append(row);
  }
}

function getRoomSlots(room = lobbySession.currentRoom) {
  if (room?.slots?.length) {
    return normalizeRoomSlots(room.slots, room);
  }

  return createDefaultRoomSlots(room);
}

function createDefaultRoomSlots(room = lobbySession.currentRoom) {
  const players = room?.players?.length
    ? room.players
    : [{ id: lobbySession.localPlayerId, nickname: lobbySession.nickname || "Player 1" }];
  const slots = Array.from({ length: 6 }, (_, index) => ({
    type: "open",
    weaponId: index === 1 ? "SMG" : "AR",
    armorId: "lightSet"
  }));

  players.slice(0, 6).forEach((player, index) => {
    slots[index] = {
      ...slots[index],
      type: "player",
      playerId: player.id,
      nickname: player.nickname,
      isMock: player.isMock,
      ready: player.id === room?.hostId ? true : player.ready ?? false,
      connected: player.connected ?? true,
      lastSeen: player.lastSeen ?? Date.now(),
      disconnectedAt: player.disconnectedAt ?? null,
      weaponId: player.weaponId ?? slots[index].weaponId,
      armorId: player.armorId ?? slots[index].armorId
    };
  });

  if (players.length < 6) {
    slots[players.length] = {
      ...slots[players.length],
      type: "computer",
      weaponId: "SMG",
      armorId: "lightSet"
    };
  }

  return slots;
}

function normalizeRoomSlots(slots, room = lobbySession.currentRoom) {
  const normalized = Array.from({ length: 6 }, (_, index) => ({
    type: "open",
    weaponId: index === 1 ? "SMG" : "AR",
    armorId: "lightSet"
  }));

  slots.slice(0, 6).forEach((slot, index) => {
    normalized[index] = {
      ...normalized[index],
      ...slot,
      slotIndex: index,
      type: ["open", "closed", "computer", "player"].includes(slot.type) ? slot.type : "open"
    };
  });

  return normalized;
}

function syncPlayersFromSlots(room) {
  room.slots = normalizeRoomSlots(room.slots, room);
  room.players = room.slots
    .filter((slot) => slot.type === "player")
    .map((slot) => ({
      id: slot.playerId,
      nickname: slot.nickname,
      ready: slot.playerId === room.hostId || Boolean(slot.ready),
      weaponId: slot.weaponId,
      armorId: slot.armorId,
      isMock: slot.isMock,
      connected: slot.connected !== false,
      lastSeen: slot.lastSeen ?? Date.now(),
      disconnectedAt: slot.disconnectedAt ?? null,
      joinedAt: slot.joinedAt ?? Date.now()
    }));
  room.comCount = room.slots.filter((slot) => slot.type === "computer").length;
  return room;
}

function bindLobbyEvents() {
  enterLobbyButton?.addEventListener("click", enterLobby);
  nicknameInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      enterLobby();
    }
  });
  createRoomButton?.addEventListener("click", createRoom);
  joinRoomButton?.addEventListener("click", () => joinRoomByCode(roomCodeInput?.value));
  roomCodeInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      joinRoomByCode(roomCodeInput.value);
    }
  });
  refreshRoomsButton?.addEventListener("click", renderRoomList);
  leaveRoomButton?.addEventListener("click", leaveRoom);
  addMockPlayerButton?.addEventListener("click", addMockPlayerToRoom);
  clearMockPlayersButton?.addEventListener("click", clearMockPlayersFromRoom);
  roomMapImport?.addEventListener("change", (event) => {
    void handleRoomMapImport(event);
  });
  roomList?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-room-id]");
    if (button) {
      joinRoomByCode(button.dataset.roomId);
    }
  });
  roomSlotList?.addEventListener("change", (event) => {
    handleRoomSlotChange(event);
  });
  roomSlotList?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-ready-slot]");
    if (button) {
      handleRoomReadyToggle(Number(button.dataset.readySlot));
    }
  });
  restartGameButton?.addEventListener("click", () => {
    void restartGameFromSummary();
  });
  returnLobbyButton?.addEventListener("click", returnToLobbyFromGame);
}

function restoreLobbySession() {
  lobbySession.localPlayerId = getSessionPlayerId();
  try {
    localStorage.removeItem(LOCAL_PLAYER_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
  if (nicknameInput) {
    nicknameInput.value = "";
    nicknameInput.removeAttribute("value");
    nicknameInput.setAttribute("autocomplete", "off");
  }
  cleanupStoredRooms();
  restoreRoomFromSession();
}

function getSessionPlayerId() {
  try {
    const savedId = sessionStorage.getItem(SESSION_PLAYER_ID_KEY);
    if (savedId) {
      return savedId;
    }
    const id = createLocalId("player");
    sessionStorage.setItem(SESSION_PLAYER_ID_KEY, id);
    return id;
  } catch {
    return lobbySession.localPlayerId || createLocalId("player");
  }
}

function restoreRoomFromSession() {
  try {
    const roomId = sessionStorage.getItem(SESSION_ROOM_ID_KEY);
    if (!roomId) {
      return;
    }

    const room = getStoredRooms().find((entry) => entry.id === roomId);
    const slot = room ? getRoomSlots(room).find((entry) => entry.type === "player" && entry.playerId === lobbySession.localPlayerId) : null;
    if (!room || !slot) {
      sessionStorage.removeItem(SESSION_ROOM_ID_KEY);
      return;
    }

    slot.connected = true;
    slot.lastSeen = Date.now();
    slot.disconnectedAt = null;
    lobbySession.nickname = slot.nickname ?? lobbySession.nickname;
    lobbySession.currentRoom = room;
    showLobbyStep(room.status === "waiting" ? "room" : "lobby");
  } catch {
    // Session restore is best-effort in the local prototype.
  }
}

function cleanupStoredRooms() {
  const now = Date.now();
  const rooms = readJsonStorage(ROOM_STORAGE_KEY, []);
  if (!Array.isArray(rooms)) {
    return;
  }

  const cleanedRooms = rooms.filter((room) => !shouldRemoveStoredRoom(room, now));
  roomStoreCache = roomStoreCache.filter((room) => !shouldRemoveStoredRoom(room, now));

  if (cleanedRooms.length !== rooms.length) {
    writeJsonStorage(ROOM_STORAGE_KEY, cleanedRooms);
    broadcastRoomStoreChanged("cleanupRooms", cleanedRooms);
  }
}

function shouldRemoveStoredRoom(room, now = Date.now()) {
  if (!room?.id) {
    return true;
  }

  const players = Array.isArray(room.players) ? room.players : [];
  const hostInPlayers = players.some((player) => player.id === room.hostId);
  const hostInSlots = getRoomSlots(room).some((slot) => slot.type === "player" && slot.playerId === room.hostId);
  const age = now - (room.createdAt ?? now);

  return room.status === "finished" ||
    players.length === 0 ||
    !room.hostId ||
    (!hostInPlayers && !hostInSlots) ||
    (room.status !== "waiting" && age > 6 * 60 * 60 * 1000) ||
    age > 24 * 60 * 60 * 1000;
}

function enterLobby() {
  const nickname = normalizeNickname(nicknameInput?.value);
  if (!nickname) {
    setStartStatus("닉네임을 입력하세요.");
    nicknameInput?.focus();
    return;
  }

  lobbySession.nickname = nickname;
  showLobbyStep("lobby");
  renderLobby();
  setStartStatus("방을 만들거나 방 번호로 입장하세요.");
}

function createRoom() {
  if (!lobbySession.nickname) {
    showLobbyStep("login");
    setStartStatus("닉네임을 먼저 입력하세요.");
    return;
  }

  if (!currentMapData) {
    setStartStatus("맵 시스템을 불러오는 중입니다. 잠시 후 다시 시도하세요.");
    return;
  }

  if (sendRoomAction("createRoom", {
    player: createRoomPlayer(),
    maxPlayers: 6,
    mapPackage: createMapPackage(currentMapData, "Built-in test map")
  })) {
    setStartStatus("서버에 방 생성을 요청했습니다.");
    return;
  }

  const rooms = getStoredRooms().filter((room) => room.status !== "finished");
  const room = {
    id: generateRoomCode(rooms),
    hostId: lobbySession.localPlayerId,
    status: "waiting",
    createdAt: Date.now(),
    maxPlayers: 6,
    comCount: 1,
    mapPackage: createMapPackage(currentMapData, "Built-in test map"),
    players: [createRoomPlayer()]
  };
  room.slots = createDefaultRoomSlots(room);
  syncPlayersFromSlots(room);
  cacheRoomMapPackage(room.mapPackage);
  lobbySession.currentRoom = room;
  rememberCurrentRoom(room.id);
  saveRoomToStorage(room);
  if (comPlayerCount) {
    comPlayerCount.value = String(room.comCount);
  }
  showLobbyStep("room");
  renderPlayerLoadoutSettings();
  renderComLoadoutSettings();
  renderLobby();
  setStartStatus(`방 ${room.id} 생성 완료. 친구는 방 번호로 입장할 수 있습니다.`);
}

function joinRoomByCode(rawCode) {
  if (!lobbySession.nickname) {
    showLobbyStep("login");
    setStartStatus("닉네임을 먼저 입력하세요.");
    return;
  }

  const code = normalizeRoomCode(rawCode);
  if (!code) {
    setStartStatus("입장할 방 번호를 입력하세요.");
    return;
  }

  if (sendRoomAction("joinRoom", {
    roomId: code,
    player: createRoomPlayer()
  })) {
    setStartStatus(`서버 방 ${code} 입장 요청 중...`);
    return;
  }

  const rooms = getStoredRooms();
  const room = rooms.find((entry) => entry.id === code);
  if (!room) {
    setStartStatus("해당 방 번호를 찾을 수 없습니다. 방장이 먼저 방을 만들어야 합니다.");
    return;
  }

  if (room.status !== "waiting") {
    setStartStatus("진행 중인 방에는 입장할 수 없습니다.");
    return;
  }

  room.slots = getRoomSlots(room);
  if (!room.slots.some((slot) => slot.type === "player" && slot.playerId === lobbySession.localPlayerId) && !room.slots.some((slot) => slot.type === "open")) {
    setStartStatus("방 인원이 가득 찼습니다.");
    return;
  }

  if (!room.slots.some((slot) => slot.type === "player" && slot.playerId === lobbySession.localPlayerId)) {
    const openSlot = room.slots.find((slot) => slot.type === "open");
    Object.assign(openSlot, {
      type: "player",
      playerId: lobbySession.localPlayerId,
      nickname: lobbySession.nickname,
      weaponId: "AR",
      armorId: "lightSet",
      ready: false,
      connected: true,
      lastSeen: Date.now(),
      disconnectedAt: null,
      joinedAt: Date.now()
    });
  }
  syncPlayersFromSlots(room);
  cacheRoomMapPackage(room.mapPackage);
  applyRoomMapPackage(room, { silent: true });
  lobbySession.currentRoom = room;
  rememberCurrentRoom(room.id);
  saveRoomToStorage(room);
  if (comPlayerCount) {
    comPlayerCount.value = String(room.comCount ?? 1);
  }
  renderPlayerLoadoutSettings();
  renderComLoadoutSettings();
  renderLobby();
  showLobbyStep("room");
  setStartStatus(`방 ${room.id} 입장 완료.`);
}

function leaveRoom() {
  const room = lobbySession.currentRoom;
  if (!room) {
    showLobbyStep("lobby");
    return;
  }

  if (sendRoomAction("leaveRoom", { roomId: room.id })) {
    lobbySession.currentRoom = null;
    forgetCurrentRoom();
    renderLobby();
    showLobbyStep("lobby");
    setStartStatus("로비로 돌아왔습니다.");
    return;
  }

  const rooms = getStoredRooms();
  const storedRoom = rooms.find((entry) => entry.id === room.id);
  if (storedRoom && storedRoom.status === "waiting") {
    storedRoom.slots = getRoomSlots(storedRoom).map((slot) => (
      slot.type === "player" && slot.playerId === lobbySession.localPlayerId
        ? { type: "open", weaponId: slot.weaponId ?? "AR", armorId: slot.armorId ?? "lightSet" }
        : slot
    ));
    syncPlayersFromSlots(storedRoom);
    if (storedRoom.players.length === 0) {
      saveStoredRooms(rooms.filter((entry) => entry.id !== storedRoom.id));
    } else {
    if (storedRoom.hostId === lobbySession.localPlayerId) {
        storedRoom.hostId = storedRoom.players[0]?.id;
      }
      saveStoredRooms(rooms);
    }
  }

  lobbySession.currentRoom = null;
  forgetCurrentRoom();
  renderLobby();
  showLobbyStep("lobby");
  setStartStatus("로비로 돌아왔습니다.");
}

function addMockPlayerToRoom() {
  const room = lobbySession.currentRoom;
  if (!room || !isLocalHost()) {
    setStartStatus("테스트 인원 추가는 방장만 사용할 수 있습니다.");
    return;
  }

  const currentTotal = (room.players?.length ?? 0) + getConfiguredAiCount();
  if (currentTotal >= room.maxPlayers) {
    setStartStatus("방 슬롯이 가득 찼습니다. COM 수를 줄이거나 빈 슬롯을 확보하세요.");
    return;
  }

  const mockIndex = (room.players ?? []).filter((player) => player.isMock).length + 2;
  room.slots = getRoomSlots(room);
  const openSlot = room.slots.find((slot) => slot.type === "open");
  if (!openSlot) return;
  Object.assign(openSlot, {
    type: "player",
    playerId: createLocalId("mock"),
    nickname: `Test Player ${mockIndex}`,
    weaponId: "AR",
    armorId: "lightSet",
    ready: true,
    connected: true,
    lastSeen: Date.now(),
    disconnectedAt: null,
    isMock: true
  });
  syncPlayersFromSlots(room);
  saveRoomToStorage(room);
  renderRoomPanel();
  renderRoomList();
  setStartStatus("로컬 테스트 플레이어를 추가했습니다. 실제 멀티 접속자는 서버 연결 단계에서 동기화됩니다.");
}

function clearMockPlayersFromRoom() {
  const room = lobbySession.currentRoom;
  if (!room || !isLocalHost()) {
    setStartStatus("테스트 인원 정리는 방장만 사용할 수 있습니다.");
    return;
  }

  room.slots = getRoomSlots(room).map((slot) => slot.isMock ? { type: "open", weaponId: "AR", armorId: "lightSet" } : slot);
  syncPlayersFromSlots(room);
  saveRoomToStorage(room);
  renderRoomPanel();
  renderRoomList();
  setStartStatus("로컬 테스트 인원을 비웠습니다.");
}

async function handleRoomMapImport(event) {
  const file = event.target.files?.[0];
  event.target.value = "";

  if (!file) {
    return;
  }

  const room = lobbySession.currentRoom;
  if (!room || !isLocalHost()) {
    setStartStatus("맵 설정은 방장만 변경할 수 있습니다.");
    return;
  }

  try {
    setRoomMapStatus("맵 패키지 읽는 중...");
    const text = await file.text();
    const mapData = JSON.parse(text);
    validateMapPackageData(mapData);

    room.mapPackage = createMapPackage(mapData, file.name);
    if (sendRoomAction("setMap", {
      roomId: room.id,
      mapPackage: room.mapPackage
    })) {
      cacheRoomMapPackage(room.mapPackage);
      currentMapData = cloneData(mapData);
      applyRoomMapPackage(room);
      setStartStatus(`${file.name} 맵을 서버 방에 설정하는 중입니다.`);
      return;
    }

    cacheRoomMapPackage(room.mapPackage);
    currentMapData = cloneData(mapData);
    saveRoomToStorage(room);
    applyRoomMapPackage(room);
    renderRoomPanel();
    setStartStatus(`${file.name} 맵을 방에 설정했습니다. 참가자는 게임 시작 전 자동으로 같은 맵을 적용합니다.`);
  } catch (error) {
    setRoomMapStatus("맵 적용 실패");
    setStartStatus(error.message);
  }
}

function handleRoomSlotChange(event) {
  const room = lobbySession.currentRoom;
  if (!room || gameStarted) return;
  const target = event.target;
  room.slots = getRoomSlots(room);

  const typeIndex = target.dataset.slotIndex;
  const weaponIndex = target.dataset.slotWeapon;
  const armorIndex = target.dataset.slotArmor;

  if (typeIndex !== undefined) {
    if (!isLocalHost()) {
      renderRoomPanel();
      setStartStatus("슬롯 상태 변경은 방장만 가능합니다.");
      return;
    }
    const index = Number(typeIndex);
    if (sendRoomAction("slotType", {
      roomId: room.id,
      slotIndex: index,
      slotType: target.value
    })) {
      setStartStatus("서버에 슬롯 설정을 요청했습니다.");
      return;
    }
    const previous = room.slots[index];
    room.slots[index] = {
      type: target.value,
      weaponId: previous.weaponId ?? (target.value === "computer" ? "SMG" : "AR"),
      armorId: previous.armorId ?? "lightSet",
      ...(target.value === "player" && previous.type === "player" ? {
        playerId: previous.playerId,
        nickname: previous.nickname,
        ready: previous.ready
      } : {})
    };
    if (target.value === "player" && !room.slots[index].playerId) {
      room.slots[index].type = "open";
    }
  } else if (weaponIndex !== undefined || armorIndex !== undefined) {
    const index = Number(weaponIndex ?? armorIndex);
    const slot = room.slots[index];
    const canEdit = (isLocalHost() && slot.type === "computer") ||
      (slot.type === "player" && slot.playerId === lobbySession.localPlayerId);
    if (!canEdit) {
      renderRoomPanel();
      setStartStatus("자기 슬롯의 장비만 변경할 수 있습니다.");
      return;
    }
    if (sendRoomAction("slotLoadout", {
      roomId: room.id,
      slotIndex: index,
      ...(weaponIndex !== undefined ? { weaponId: target.value } : {}),
      ...(armorIndex !== undefined ? { armorId: target.value } : {})
    })) {
      setStartStatus("서버에 장비 변경을 요청했습니다.");
      return;
    }
    if (weaponIndex !== undefined) slot.weaponId = target.value;
    if (armorIndex !== undefined) slot.armorId = target.value;
  }

  syncPlayersFromSlots(room);
  saveRoomToStorage(room);
  renderRoomPanel();
  setStartStatus("슬롯 설정을 갱신했습니다.");
}

function handleRoomReadyToggle(index) {
  const room = lobbySession.currentRoom;
  if (!room || gameStarted) {
    return;
  }

  room.slots = getRoomSlots(room);
  const slot = room.slots[index];
  if (!slot || slot.type !== "player" || slot.playerId !== lobbySession.localPlayerId || slot.playerId === room.hostId) {
    return;
  }

  slot.ready = !slot.ready;
  if (sendRoomAction("ready", {
    roomId: room.id,
    slotIndex: index,
    ready: slot.ready
  })) {
    setStartStatus(slot.ready ? "READY 상태를 서버에 전송했습니다." : "READY 해제를 서버에 전송했습니다.");
    return;
  }
  syncPlayersFromSlots(room);
  saveRoomToStorage(room);
  renderRoomPanel();
  setStartStatus(slot.ready ? "READY 상태입니다. 방장의 게임 시작을 기다리세요." : "READY를 해제했습니다.");
}

function createRoomPlayer() {
  return {
    id: lobbySession.localPlayerId,
    nickname: lobbySession.nickname,
    ready: true,
    connected: true,
    lastSeen: Date.now(),
    disconnectedAt: null,
    isHost: false,
    joinedAt: Date.now()
  };
}

function renderLobby() {
  if (lobbyNickname) {
    lobbyNickname.textContent = lobbySession.nickname || "-";
  }
  renderRoomList();
  renderRoomPanel();
}

function renderRoomList() {
  if (!roomList) {
    return;
  }

  const rooms = getStoredRooms().filter((room) => room.status === "waiting");
  if (rooms.length === 0) {
    roomList.innerHTML = "<li class=\"room-list-empty\">대기 중인 방이 없습니다.</li>";
    return;
  }

  roomList.innerHTML = rooms.map((room) => `
    <li>
      <div>
        <strong>${room.id}</strong>
        <span>${escapeHtml(room.players?.[0]?.nickname ?? "Host")} / ${room.players?.length ?? 0}/${room.maxPlayers} / COM ${room.comCount ?? 0} / ${escapeHtml(room.mapPackage?.name ?? "Built-in test map")}</span>
      </div>
      <button type="button" data-room-id="${room.id}">입장</button>
    </li>
  `).join("");
}

function renderRoomPanel() {
  const room = lobbySession.currentRoom;
  if (!room) {
    if (roomSlotList) {
      roomSlotList.innerHTML = "";
    }
    return;
  }
  if (!gameStarted) {
    applyRoomMapPackage(room, { silent: true });
  }

  const host = isLocalHost();

  if (roomCodeLabel) {
    roomCodeLabel.textContent = room.id;
  }
  if (roomSlotList) {
    room.slots = getRoomSlots(room);
    roomSlotList.innerHTML = room.slots.map((slot, index) => renderRoomSlot(slot, index, host)).join("");
  }

  if (startGameButton) {
    const ready = areHumanPlayersReady(room);
    startGameButton.disabled = !host || room.status !== "waiting" || !ready;
    startGameButton.textContent = host ? (ready ? "게임 시작" : "READY 대기 중") : "방장 대기 중";
  }
  if (comPlayerCount) comPlayerCount.closest(".start-option-field")?.setAttribute("hidden", "");
  playerLoadoutSettings?.setAttribute("hidden", "");
  comLoadoutSettings?.setAttribute("hidden", "");
  if (addMockPlayerButton) {
    addMockPlayerButton.disabled = !host || gameStarted;
  }
  if (clearMockPlayersButton) {
    clearMockPlayersButton.disabled = !host || gameStarted;
  }
  if (roomMapImport) {
    roomMapImport.disabled = !host || gameStarted;
  }
  renderRoomMapPanel(room);
}

function areHumanPlayersReady(room = lobbySession.currentRoom) {
  const slots = getRoomSlots(room);
  const humanSlots = slots.filter((slot) => slot.type === "player");
  const guestSlots = humanSlots.filter((slot) => slot.playerId !== room?.hostId);

  return humanSlots.length > 0 && guestSlots.every((slot) => slot.ready);
}

function renderRoomMapPanel(room) {
  const mapPackage = room?.mapPackage ?? createMapPackage(currentMapData, "Built-in test map");
  const cachedData = getRoomMapData(mapPackage);
  const tileCount = cachedData?.tiles?.filter((tile) => tile.enabled !== false).length ?? mapPackage.tileCount ?? 0;
  const hasBackground = Boolean(cachedData?.backgroundImage || mapPackage.hasBackground);

  if (roomMapName) {
    roomMapName.textContent = mapPackage.name ?? mapPackage.mapId ?? "Built-in test map";
  }
  if (roomMapMeta) {
    roomMapMeta.textContent = `${mapPackage.mapId ?? "unknown"} | tiles ${tileCount} | background ${hasBackground ? "included" : "none"}`;
  }
  setRoomMapStatus(cachedData ? "다운로드 완료" : "다운로드 필요");
}

function renderRoomSlot(slot, index, host) {
  const canEditSlotType = host && !gameStarted;
  const canEditLoadout = !gameStarted && (
    (host && slot.type === "computer") ||
    (slot.type === "player" && slot.playerId === lobbySession.localPlayerId)
  );
  const slotLabel = slot.type === "player"
    ? `${slot.nickname}${slot.playerId === lobbySession.currentRoom?.hostId ? " / 방장" : slot.connected === false ? " / 재접속 대기" : ""}`
    : slot.type === "computer" ? `${slot.takeoverName ? `${slot.takeoverName} 인계 COM` : `Computer ${index + 1}`}` : slot.type === "closed" ? "Closed" : "Open";
  const readyControl = slot.type === "player"
    ? renderReadyControl(slot, index)
    : "";

  return `
    <li class="room-slot-row is-${slot.type}">
      <div class="room-slot-main">
        <strong>Slot ${index + 1}</strong>
        <span>${escapeHtml(slotLabel)}</span>
      </div>
      ${readyControl}
      <select class="room-slot-type" data-slot-index="${index}" ${canEditSlotType ? "" : "disabled"}>
        <option value="open" ${slot.type === "open" ? "selected" : ""}>Open</option>
        <option value="closed" ${slot.type === "closed" ? "selected" : ""}>Closed</option>
        <option value="computer" ${slot.type === "computer" ? "selected" : ""}>Computer</option>
        <option value="player" ${slot.type === "player" ? "selected" : ""} ${slot.type === "player" ? "" : "disabled"}>Player</option>
      </select>
      <select class="room-slot-weapon" data-slot-weapon="${index}" ${canEditLoadout && ["player", "computer"].includes(slot.type) ? "" : "disabled"}>
        ${renderWeaponOptions(slot.weaponId)}
      </select>
      <select class="room-slot-armor" data-slot-armor="${index}" ${canEditLoadout && ["player", "computer"].includes(slot.type) ? "" : "disabled"}>
        ${renderArmorOptions(slot.armorId)}
      </select>
    </li>
  `;
}

function renderReadyControl(slot, index) {
  if (slot.playerId === lobbySession.currentRoom?.hostId) {
    return "<span class=\"room-slot-ready is-host\">HOST</span>";
  }

  if (slot.playerId === lobbySession.localPlayerId && !gameStarted) {
    return `<button class="room-slot-ready ${slot.ready ? "is-ready" : ""}" type="button" data-ready-slot="${index}">${slot.ready ? "READY" : "NOT READY"}</button>`;
  }

  return `<span class="room-slot-ready ${slot.ready ? "is-ready" : ""}">${slot.ready ? "READY" : "WAIT"}</span>`;
}

function renderWeaponOptions(selectedWeaponId = "AR") {
  return Object.entries(weapons ?? {}).map(([weaponId, weapon]) => (
    `<option value="${weaponId}" ${weaponId === selectedWeaponId ? "selected" : ""}>${weaponId} ${escapeHtml(weapon.label ?? weaponId)}</option>`
  )).join("");
}

function renderArmorOptions(selectedArmorId = "lightSet") {
  return Object.entries(armor ?? {}).map(([armorId, armorItem]) => (
    `<option value="${armorId}" ${armorId === selectedArmorId ? "selected" : ""}>${escapeHtml(armorItem.name ?? armorId)}</option>`
  )).join("");
}

function setRoomMapStatus(message) {
  if (roomMapStatus) {
    roomMapStatus.textContent = message;
  }
}

function createMapPackage(mapData, name = "Map") {
  const data = cloneData(mapData ?? currentMapData ?? {});
  const id = data.mapId ?? `map_${Date.now().toString(36)}`;
  const json = JSON.stringify(data);
  const packageId = `${id}_${hashString(json)}`;

  return {
    packageId,
    mapId: id,
    name,
    updatedAt: Date.now(),
    bytes: json.length,
    tileCount: Array.isArray(data.tiles) ? data.tiles.filter((tile) => tile.enabled !== false).length : 0,
    hasBackground: Boolean(data.backgroundImage),
    data
  };
}

function cacheRoomMapPackage(mapPackage) {
  if (mapPackage?.packageId && mapPackage.data) {
    roomMapCache.set(mapPackage.packageId, cloneData(mapPackage.data));
  }
}

function getRoomMapData(mapPackage) {
  if (!mapPackage) {
    return null;
  }

  if (mapPackage.data) {
    cacheRoomMapPackage(mapPackage);
    return cloneData(mapPackage.data);
  }

  const cached = roomMapCache.get(mapPackage.packageId);
  return cached ? cloneData(cached) : null;
}

function applyRoomMapPackage(room, { silent = false } = {}) {
  const mapData = getRoomMapData(room?.mapPackage);

  if (!mapData) {
    if (!silent) {
      setRoomMapStatus("맵 다운로드 필요");
    }
    return false;
  }

  currentMapData = mapData;
  if (gameBootstrapped && renderer && state && !gameStarted) {
    state = createRaidState(currentMapData);
    clearPendingTileAction();
    renderer.replaceState(state);
    lastActivePlayerIndexForUi = null;
    renderer.render();
    updateUi();
  }
  if (!silent) {
    setRoomMapStatus("다운로드 완료");
  }
  return true;
}

function validateMapPackageData(mapData) {
  if (!mapData || !Array.isArray(mapData.tiles) || mapData.tiles.length === 0) {
    throw new Error("유효한 mapData.json이 아닙니다. tiles 배열이 필요합니다.");
  }

  if (!mapData.tiles.some((tile) => tile.spawnPoint)) {
    throw new Error("스폰 타일이 없는 맵입니다.");
  }

  if (!mapData.tiles.some((tile) => tile.extractionPoint)) {
    throw new Error("탈출구 타일이 없는 맵입니다.");
  }
}

function hashString(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash).toString(36);
}

function showLobbyStep(step) {
  const activeMap = {
    login: loginStep,
    lobby: lobbyStep,
    room: roomStep
  };

  [loginStep, lobbyStep, roomStep].forEach((element) => {
    element?.classList.toggle("is-active", element === activeMap[step]);
  });
}

function setStartStatus(message) {
  if (startOverlayStatus) {
    startOverlayStatus.textContent = message;
  }
}

function rememberCurrentRoom(roomId) {
  try {
    sessionStorage.setItem(SESSION_ROOM_ID_KEY, roomId);
  } catch {
    // Ignore storage failures in local prototype mode.
  }
}

function forgetCurrentRoom() {
  try {
    sessionStorage.removeItem(SESSION_ROOM_ID_KEY);
  } catch {
    // Ignore storage failures in local prototype mode.
  }
}

function isLocalHost() {
  return lobbySession.currentRoom?.hostId === lobbySession.localPlayerId;
}

function markCurrentRoomInProgress() {
  setCurrentRoomStatus("inProgress");
}

function setCurrentRoomStatus(status) {
  if (!lobbySession.currentRoom) {
    return;
  }
  if (sendRoomAction("setStatus", {
    roomId: lobbySession.currentRoom.id,
    status
  })) {
    lobbySession.currentRoom.status = status;
    lobbySession.currentRoom.updatedAt = Date.now();
    return;
  }
  const rooms = getStoredRooms();
  const room = rooms.find((entry) => entry.id === lobbySession.currentRoom.id);
  if (room) {
    room.status = status;
    room.comCount = getConfiguredAiCount();
    room.updatedAt = Date.now();
    lobbySession.currentRoom = room;
    saveStoredRooms(rooms);
  } else {
    lobbySession.currentRoom.status = status;
    lobbySession.currentRoom.updatedAt = Date.now();
  }
}

function syncRoomSettingsFromUi() {
  const room = lobbySession.currentRoom;
  if (!room) {
    return;
  }
  room.comCount = getConfiguredAiCount();
  const rooms = getStoredRooms();
  const storedRoom = rooms.find((entry) => entry.id === room.id);
    if (storedRoom) {
      storedRoom.comCount = room.comCount;
      const mergedRoom = mergeRoomPreservingMapPackage(storedRoom, {
        ...storedRoom,
        comCount: room.comCount
      });
      const roomIndex = rooms.findIndex((entry) => entry.id === room.id);
      rooms[roomIndex] = mergedRoom;
      lobbySession.currentRoom = mergedRoom;
      saveStoredRooms(rooms);
    }
}

function getStoredRooms() {
  return mergeRoomLists(readJsonStorage(ROOM_STORAGE_KEY, []), roomStoreCache);
}

function saveStoredRooms(rooms) {
  const mergedRooms = mergeRoomsPreservingMapPackages(rooms)
    .map((room) => ({ ...room, updatedAt: room.updatedAt ?? Date.now() }))
    .slice(0, 12);
  roomStoreCache = mergedRooms;
  writeJsonStorage(ROOM_STORAGE_KEY, mergedRooms);
  broadcastRoomStoreChanged("saveRooms", mergedRooms);
}

function mergeRoomLists(primaryRooms = [], secondaryRooms = []) {
  const roomMap = new Map();
  const now = Date.now();

  [...secondaryRooms, ...primaryRooms].forEach((room) => {
    if (shouldRemoveStoredRoom(room, now)) {
      return;
    }
    const existing = roomMap.get(room.id);
    roomMap.set(room.id, existing ? mergeRoomPreservingMapPackage(existing, room) : room);
  });

  return Array.from(roomMap.values()).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

function saveRoomToStorage(room) {
  const rooms = getStoredRooms();
  const index = rooms.findIndex((entry) => entry.id === room.id);
  const mergedRoom = {
    ...mergeRoomPreservingMapPackage(rooms[index], room),
    updatedAt: Date.now()
  };
  if (index >= 0) {
    rooms[index] = mergedRoom;
  } else {
    rooms.unshift(mergedRoom);
  }
  lobbySession.currentRoom = mergedRoom;
  saveStoredRooms(rooms);
}

function mergeRoomsPreservingMapPackages(rooms) {
  const existingRooms = getStoredRooms();

  return rooms.map((room) => {
    const existing = existingRooms.find((entry) => entry.id === room.id);
    return mergeRoomPreservingMapPackage(existing, room);
  });
}

function mergeRoomPreservingMapPackage(existingRoom, nextRoom) {
  if (!existingRoom?.mapPackage) {
    return nextRoom;
  }

  if (!nextRoom?.mapPackage) {
    return {
      ...nextRoom,
      mapPackage: existingRoom.mapPackage
    };
  }

  const existingMapTime = existingRoom.mapPackage.updatedAt ?? 0;
  const nextMapTime = nextRoom.mapPackage.updatedAt ?? 0;

  if (existingMapTime > nextMapTime) {
    return {
      ...nextRoom,
      mapPackage: existingRoom.mapPackage
    };
  }

  return nextRoom;
}

function mergeRoomWithLocalMapPackage(room) {
  const localRoom = lobbySession.currentRoom?.id === room.id ? lobbySession.currentRoom : null;
  return mergeRoomPreservingMapPackage(localRoom, room);
}

function generateRoomCode(existingRooms) {
  const used = new Set(existingRooms.map((room) => room.id));
  let code = "";

  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
  } while (used.has(code));

  return code;
}

function normalizeNickname(value) {
  return String(value ?? "").trim().slice(0, 18);
}

function normalizeRoomCode(value) {
  return String(value ?? "").trim().replace(/\D/g, "").slice(0, 6);
}

function readJsonStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local storage can be unavailable in some browser privacy modes.
  }
}

function initRoomSync() {
  if ("BroadcastChannel" in window) {
    roomSyncChannel = new BroadcastChannel(ROOM_SYNC_CHANNEL);
    roomSyncChannel.addEventListener("message", (event) => {
      if (event.data?.sourceId !== lobbySession.localPlayerId) {
        if (event.data?.type === "gameSnapshot") {
          handleRemoteGameSnapshot(event.data);
        } else if (event.data?.type === "playerCommand") {
          void handleRemotePlayerCommand(event.data);
        } else {
          handleRoomStoreChanged(event.data?.reason ?? "broadcast", event.data?.rooms ?? null);
        }
      }
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key === ROOM_STORAGE_KEY) {
      handleRoomStoreChanged("storage");
    } else if (event.key?.startsWith(GAME_STATE_STORAGE_PREFIX) && event.newValue) {
      try {
        handleRemoteGameSnapshot(JSON.parse(event.newValue));
      } catch {
        // Ignore malformed external storage writes.
      }
    } else if (event.key?.startsWith(PLAYER_COMMAND_STORAGE_PREFIX) && event.newValue) {
      try {
        void handleRemotePlayerCommand(JSON.parse(event.newValue));
      } catch {
        // Ignore malformed external command writes.
      }
    }
  });

  window.addEventListener("beforeunload", markLocalPlayerDisconnected);
}

function initServerSync() {
  if (!("WebSocket" in window)) {
    return;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
  gameServerSocket = socket;

  socket.addEventListener("open", () => {
    gameServerConnected = true;
    sendServerMessage({ type: "getRooms", sourceId: lobbySession.localPlayerId });
    if (lobbySession.currentRoom?.id) {
      requestServerGameSnapshot(lobbySession.currentRoom.id);
    }
    setStartStatus("서버 멀티 연결됨.");
  });

  socket.addEventListener("message", (event) => {
    try {
      handleServerMessage(JSON.parse(event.data));
    } catch {
      // Ignore malformed server payloads.
    }
  });

  socket.addEventListener("close", () => {
    gameServerConnected = false;
    pendingRoomActions.clear();
    setStartStatus("서버 연결이 끊겼습니다. 로컬 테스트 동기화만 사용합니다.");
  });
}

function handleServerMessage(message) {
  if (!message || message.sourceId === lobbySession.localPlayerId) {
    return;
  }

  if (message.type === "roomsChanged") {
    handleRoomStoreChanged(message.reason ?? "server", message.rooms ?? null);
    return;
  }

  if (message.type === "roomActionResult") {
    handleRoomActionResult(message);
    return;
  }

  if (message.type === "serverError") {
    setStartStatus(`서버 오류: ${message.message ?? "알 수 없는 오류"}`);
    return;
  }

  if (message.type === "gameSnapshot") {
    handleRemoteGameSnapshot(message);
    return;
  }

  if (message.type === "snapshotRequest") {
    handleSnapshotRequest(message);
    return;
  }

  if (message.type === "snapshotUnavailable") {
    if (message.roomId === lobbySession.currentRoom?.id && !isLocalHost()) {
      setStartStatus("서버에 저장된 진행 정보가 없어 방장에게 다시 요청 중입니다.");
    }
    return;
  }

  if (message.type === "playerCommand") {
    void handleRemotePlayerCommand(message);
  }
}

function sendServerMessage(message) {
  if (!gameServerSocket || gameServerSocket.readyState !== WebSocket.OPEN) {
    return false;
  }

  gameServerSocket.send(JSON.stringify(message));
  return true;
}

function sendRoomAction(action, payload = {}) {
  if (!gameServerConnected) {
    return false;
  }

  const actionId = `${lobbySession.localPlayerId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const timeout = window.setTimeout(() => {
    if (!pendingRoomActions.has(actionId)) {
      return;
    }
    pendingRoomActions.delete(actionId);
    setStartStatus("서버 응답이 없습니다. 배포 서버가 최신 코드인지 확인한 뒤 다시 시도하세요.");
  }, 8000);
  pendingRoomActions.set(actionId, timeout);

  return sendServerMessage({
    type: "roomAction",
    action,
    actionId,
    payload,
    sourceId: lobbySession.localPlayerId,
    at: Date.now()
  });
}

function handleRoomActionResult(message) {
  if (message.targetPlayerId && message.targetPlayerId !== lobbySession.localPlayerId) {
    return;
  }

  if (message.actionId && pendingRoomActions.has(message.actionId)) {
    window.clearTimeout(pendingRoomActions.get(message.actionId));
    pendingRoomActions.delete(message.actionId);
  }

  if (!message.ok) {
    setStartStatus(message.message || "서버 방 작업에 실패했습니다.");
    renderLobby();
    return;
  }

  if (!message.room) {
    if (message.action === "leaveRoom") {
      lobbySession.currentRoom = null;
      forgetCurrentRoom();
      renderLobby();
      showLobbyStep("lobby");
      setStartStatus("로비로 돌아왔습니다.");
    }
    return;
  }

  const room = mergeRoomWithLocalMapPackage(message.room);
  cacheRoomMapPackage(room.mapPackage);
  lobbySession.currentRoom = room;
  rememberCurrentRoom(room.id);
  roomStoreCache = mergeRoomLists([room], roomStoreCache);
  writeJsonStorage(ROOM_STORAGE_KEY, roomStoreCache);
  if (!gameStarted) {
    applyRoomMapPackage(room, { silent: true });
    showLobbyStep("room");
  }
  if (comPlayerCount) {
    comPlayerCount.value = String(room.comCount ?? 0);
  }
  renderPlayerLoadoutSettings();
  renderComLoadoutSettings();
  renderLobby();

  const statusMessages = {
    createRoom: `방 ${room.id} 생성 완료. 친구는 방 번호로 입장할 수 있습니다.`,
    joinRoom: `방 ${room.id} 입장 완료.`,
    ready: "READY 상태를 갱신했습니다.",
    slotType: "슬롯 설정을 갱신했습니다.",
    slotLoadout: "장비 설정을 갱신했습니다.",
    setMap: `${room.mapPackage?.name ?? "맵"}을 방에 설정했습니다.`,
    setStatus: room.status === "inProgress" ? "게임 시작 상태를 서버에 반영했습니다." : "방 상태를 갱신했습니다.",
    heartbeat: ""
  };

  if (statusMessages[message.action]) {
    setStartStatus(statusMessages[message.action]);
  }
}

function requestServerGameSnapshot(roomId) {
  if (!roomId) {
    return false;
  }

  pendingServerSnapshotRoomId = roomId;
  setStartStatus("방장과 진행 상황 동기화 중입니다.");
  return sendServerMessage({
    type: "getGameSnapshot",
    roomId,
    sourceId: lobbySession.localPlayerId
  });
}

function startPresenceHeartbeat() {
  if (presenceHeartbeatTimer) {
    return;
  }

  presenceHeartbeatTimer = window.setInterval(updateLocalPresence, PRESENCE_HEARTBEAT_MS);
  updateLocalPresence();
}

function updateLocalPresence() {
  const room = lobbySession.currentRoom;
  if (!room) {
    return;
  }

  if (sendRoomAction("heartbeat", { roomId: room.id })) {
    return;
  }

  const rooms = getStoredRooms();
  const storedRoom = rooms.find((entry) => entry.id === room.id);
  if (!storedRoom) {
    return;
  }

  let changed = touchLocalPlayerSlot(storedRoom);
  if (storedRoom.hostId === lobbySession.localPlayerId) {
    changed = reconcileDisconnectedRoom(storedRoom) || changed;
  }

  if (changed) {
    saveRoomToStorage(storedRoom);
  }
}

function touchLocalPlayerSlot(room) {
  const now = Date.now();
  room.slots = getRoomSlots(room);
  const slot = room.slots.find((entry) => entry.type === "player" && entry.playerId === lobbySession.localPlayerId);
  if (!slot) {
    return false;
  }

  const changed = slot.connected !== true || slot.disconnectedAt !== null || Math.abs((slot.lastSeen ?? 0) - now) > PRESENCE_HEARTBEAT_MS / 2;
  slot.connected = true;
  slot.lastSeen = now;
  slot.disconnectedAt = null;
  syncPlayersFromSlots(room);
  return changed;
}

function markLocalPlayerDisconnected() {
  const room = lobbySession.currentRoom;
  if (!room) {
    return;
  }

  const rooms = getStoredRooms();
  const storedRoom = rooms.find((entry) => entry.id === room.id);
  if (!storedRoom) {
    return;
  }

  storedRoom.slots = getRoomSlots(storedRoom);
  const slot = storedRoom.slots.find((entry) => entry.type === "player" && entry.playerId === lobbySession.localPlayerId);
  if (!slot) {
    return;
  }

  slot.connected = false;
  slot.disconnectedAt = Date.now();
  syncPlayersFromSlots(storedRoom);
  writeJsonStorage(ROOM_STORAGE_KEY, mergeRoomsPreservingMapPackages(rooms));
}

function reconcileDisconnectedRoom(room) {
  const now = Date.now();
  let changed = false;
  room.slots = getRoomSlots(room);

  room.slots.forEach((slot, index) => {
    if (slot.type !== "player" || slot.isMock || slot.playerId === room.hostId) {
      return;
    }

    const stale = now - (slot.lastSeen ?? room.createdAt ?? now) > RECONNECT_GRACE_MS;
    if (!stale && slot.connected !== false) {
      return;
    }

    if (!stale) {
      return;
    }

    room.slots[index] = {
      type: "computer",
      weaponId: slot.weaponId ?? "SMG",
      armorId: slot.armorId ?? "lightSet",
      takeoverFromPlayerId: slot.playerId,
      takeoverName: slot.nickname,
      takeoverAt: now
    };
    changed = true;
  });

  if (changed) {
    syncPlayersFromSlots(room);
    convertDisconnectedStatePlayersToAi(room);
  }

  return changed;
}

function convertDisconnectedStatePlayersToAi(room) {
  if (!gameStarted || !state?.players || !isLocalHost()) {
    return;
  }

  const takeoverIds = new Set(
    getRoomSlots(room)
      .filter((slot) => slot.type === "computer" && slot.takeoverFromPlayerId)
      .map((slot) => slot.takeoverFromPlayerId)
  );
  let converted = false;

  state.players.forEach((player, index) => {
    if (!player.controllerId || !takeoverIds.has(player.controllerId)) {
      return;
    }

    player.isAi = true;
    player.controllerId = null;
    player.aiProfile = getAiProfileId(index + 1);
    player.name = `${player.name} (COM)`;
    converted = true;
  });

  if (converted) {
    actionLog.textContent = "연결이 끊긴 플레이어를 COM이 인계했습니다.";
    renderer?.render();
    updateUi();
    queueAiTurn();
  }
}

function broadcastRoomStoreChanged(reason = "roomUpdate", rooms = getStoredRooms()) {
  const payload = {
    type: "roomsChanged",
    reason,
    sourceId: lobbySession.localPlayerId,
    rooms,
    at: Date.now()
  };
  roomSyncChannel?.postMessage(payload);
  sendServerMessage(payload);
}

function handleRoomStoreChanged(reason = "sync", syncedRooms = null) {
  if (Array.isArray(syncedRooms)) {
    roomStoreCache = mergeRoomLists(syncedRooms, roomStoreCache);
  }

  const previousRoomId = lobbySession.currentRoom?.id ?? null;
  const rooms = syncedRooms ?? getStoredRooms();
  let activeRoom = previousRoomId ? rooms.find((room) => room.id === previousRoomId) ?? null : null;

  if (previousRoomId && !activeRoom) {
    lobbySession.currentRoom = null;
    renderLobby();
    if (!gameStarted) {
      showLobbyStep("lobby");
      setStartStatus("방이 해체되어 로비로 돌아왔습니다.");
    }
    return;
  }

  if (activeRoom) {
    activeRoom = mergeRoomWithLocalMapPackage(activeRoom);
    if (isLocalHost()) {
      reconcileDisconnectedRoom(activeRoom);
    }
    cacheRoomMapPackage(activeRoom.mapPackage);
    lobbySession.currentRoom = activeRoom;
    if (comPlayerCount) {
      comPlayerCount.value = String(activeRoom.comCount ?? 0);
    }
    applyRoomMapPackage(activeRoom, { silent: true });
  }

  renderLobby();

  if (activeRoom?.status === "inProgress" && !gameStarted && !gameStarting) {
    void handleRemoteGameStart(activeRoom);
    return;
  }

  if (reason === "broadcast" && activeRoom && !gameStarted) {
    setStartStatus("방 정보가 갱신되었습니다.");
  }
}

async function handleRemoteGameStart(room) {
  lobbySession.currentRoom = room;
  setStartStatus("방장이 게임을 시작했습니다. 같은 맵으로 진입합니다.");
  if (!applyRoomMapPackage(room)) {
    setStartStatus("맵 다운로드가 끝나지 않아 자동 진입하지 못했습니다.");
    return;
  }

    await handleStartGame({ remoteStart: true });
  if (queuedRemoteGameSnapshot?.roomId === room.id) {
    const queuedSnapshot = queuedRemoteGameSnapshot;
    queuedRemoteGameSnapshot = null;
    handleRemoteGameSnapshot(queuedSnapshot);
    return;
  }

  const savedSnapshot = readJsonStorage(`${GAME_STATE_STORAGE_PREFIX}${room.id}`, null);
  if (savedSnapshot) {
    handleRemoteGameSnapshot(savedSnapshot);
  } else if (!requestServerGameSnapshot(room.id)) {
    setStartStatus("서버 스냅샷을 기다리는 중입니다.");
  }
}

function broadcastGameSnapshot(reason = "state", meta = {}) {
  if (!state || !gameStarted || applyingRemoteSnapshot || !lobbySession.currentRoom || !isLocalHost()) {
    return;
  }

  const payload = {
    type: "gameSnapshot",
    roomId: lobbySession.currentRoom.id,
    sourceId: lobbySession.localPlayerId,
    version: Date.now(),
    reason,
    meta,
    snapshot: state.exportSnapshot()
  };

  lastSnapshotVersion = payload.version;
  roomSyncChannel?.postMessage(payload);
  sendServerMessage(payload);
  writeJsonStorage(`${GAME_STATE_STORAGE_PREFIX}${payload.roomId}`, payload);
}

function handleSnapshotRequest(message) {
  if (!isLocalHost() || !gameStarted || message.roomId !== lobbySession.currentRoom?.id) {
    return;
  }

  broadcastGameSnapshot("snapshotReply", {
    requestedBy: message.requesterId ?? null
  });
}

function handleRemoteGameSnapshot(payload) {
  if (!payload || payload.sourceId === lobbySession.localPlayerId || payload.roomId !== lobbySession.currentRoom?.id) {
    return;
  }

  if (pendingServerSnapshotRoomId === payload.roomId) {
    pendingServerSnapshotRoomId = null;
  }

  if (isLocalHost()) {
    return;
  }

  if (payload.reason === "attackReveal" && payload.version <= lastSnapshotVersion) {
    void playRemoteAttackReveal(payload.meta, payload.version);
    return;
  }

  if (payload.reason === "lootReveal" && payload.version <= lastSnapshotVersion) {
    void playRemoteLootReveal(payload.meta, payload.version);
    return;
  }

  if (["orderReveal", "eventReveal"].includes(payload.reason) && payload.version <= lastSnapshotVersion) {
    handleRemoteRevealSnapshot(payload);
    return;
  }

  if (["corpseLootOpen", "corpseLootUpdate"].includes(payload.reason) && payload.version <= lastSnapshotVersion) {
    handleRemoteCorpseLootMeta(payload.meta);
    return;
  }

  if (payload.reason === "discardUpdate" && payload.version <= lastSnapshotVersion) {
    handleRemoteDiscardMeta(payload.meta);
    return;
  }

  if (payload.version <= lastSnapshotVersion) {
    return;
  }

  if (!state || !gameStarted) {
    queuedRemoteGameSnapshot = payload;
    return;
  }

  applyingRemoteSnapshot = true;
  lastSnapshotVersion = payload.version;
  const previousPositions = snapshotPlayerPositions();
  closeCorpseLoot("remote-sync");
  clearPendingTileAction();
  state.importSnapshot(payload.snapshot);
  updateUi({ skipSnapshotBroadcast: true });
  animateRemotePositionChanges(previousPositions, payload.meta);
  renderer.render();
  restoreLocalPendingTileActionFromSnapshot(payload.reason);
  applyingRemoteSnapshot = false;

  handleRemoteRevealSnapshot(payload);

  if (payload.reason === "attackReveal") {
    void playRemoteAttackReveal(payload.meta, payload.version);
  }

  if (payload.reason === "lootReveal") {
    void playRemoteLootReveal(payload.meta, payload.version);
  }

  if (["corpseLootOpen", "corpseLootUpdate"].includes(payload.reason)) {
    handleRemoteCorpseLootMeta(payload.meta);
  }

  if (payload.reason === "discardUpdate") {
    handleRemoteDiscardMeta(payload.meta);
  }
}

function handleRemoteRevealSnapshot(payload) {
  if (!payload || payload.roomId !== lobbySession.currentRoom?.id || !state || !gameStarted) {
    return;
  }

  if (payload.reason === "orderReveal" && remoteOrderRevealPlayedVersion !== payload.version) {
    if (cardRevealRunning || activeOrderRevealVersion === payload.version) {
      return;
    }
    remoteOrderRevealPlayedVersion = payload.version;
    activeOrderRevealVersion = payload.version;
    if (payload.snapshot) {
      applyingRemoteSnapshot = true;
      state.importSnapshot(payload.snapshot);
      updateUi({ skipSnapshotBroadcast: true });
      renderer.render();
      applyingRemoteSnapshot = false;
    }
    void playRaidOrderReveal().finally(() => {
      if (activeOrderRevealVersion === payload.version) {
        activeOrderRevealVersion = 0;
      }
    });
  }

  if (payload.reason === "eventReveal" && payload.snapshot && !playedEventRevealVersions.has(payload.version)) {
    playedEventRevealVersions.add(payload.version);
    if (playedEventRevealVersions.size > 100) {
      playedEventRevealVersions.clear();
    }
    applyingRemoteSnapshot = true;
    state.importSnapshot(payload.snapshot);
    updateUi({ skipSnapshotBroadcast: true });
    renderer.render();
    applyingRemoteSnapshot = false;
  }
}

function snapshotPlayerPositions() {
  if (!state?.players) {
    return new Map();
  }

  return new Map(state.players.map((player) => [
    player.id,
    player.position ? { q: player.position.q, r: player.position.r } : null
  ]));
}

function animateRemotePositionChanges(previousPositions, meta = {}) {
  if (!renderer || !state?.players || cardRevealRunning || eventRevealRunning) {
    return;
  }

  const viewer = getUiPlayer();
  state.players.forEach((player) => {
    const previous = previousPositions.get(player.id);
    const current = player.position;
    const metaPath = meta.type === "movement" && meta.unitId === player.id && Array.isArray(meta.path)
      ? meta.path
      : null;

    if (!previous || !current || `${previous.q},${previous.r}` === `${current.q},${current.r}`) {
      return;
    }

    const visibleMove = player.id === viewer?.id ||
      state.isTileVisibleToPlayer(previous, viewer) ||
      state.isTileVisibleToPlayer(current, viewer) ||
      isSpectatorVisionActive();

    if (!visibleMove) {
      return;
    }

    void renderer.playMovementAnimation(player.id, metaPath?.length >= 2 ? metaPath : [previous, current]);
  });
}

function restoreLocalPendingTileActionFromSnapshot(reason) {
  if (!canLocalControlActivePlayer() || isInteractionLocked() || ["movement", "attackReveal", "gameStart"].includes(reason)) {
    return;
  }

  const tile = state.selectedTile;
  if (tile) {
    buildTileAction(tile);
  }
}

async function playRemoteAttackReveal(meta = {}, version = Date.now()) {
  const viewers = meta.viewerControllerIds ?? (meta.viewerControllerId ? [meta.viewerControllerId] : []);
  if (playedAttackRevealVersions.has(version)) {
    return;
  }

  if (!meta || !shouldPlayAttackRevealForLocalPlayer(meta, viewers) || !Array.isArray(meta.roll) || attackSequenceRunning) {
    return;
  }

  playedAttackRevealVersions.add(version);
  attackSequenceRunning = true;
  clearPendingTileAction();
  updateUi({ skipSnapshotBroadcast: true });
  await playAttackDiceOverlay(meta.roll);
  playAttackCombatSfx({
    weapon: { name: meta.weaponId },
    roll: meta.roll,
    damageEvents: meta.summary?.damageEvents ?? []
  });
  if (meta.summary) {
    renderer.playAttackAnimation(meta.summary);
  }
  await wait(760);
  attackSequenceRunning = false;
  renderer.render();
  updateUi({ skipSnapshotBroadcast: true });
}

async function playRemoteLootReveal(meta = {}, version = Date.now()) {
  if (playedAttackRevealVersions.has(`loot-${version}`)) {
    return;
  }

  const viewers = meta.viewerControllerIds ?? [];
  if (!viewers.includes(lobbySession.localPlayerId) || !Array.isArray(meta.items)) {
    return;
  }

  playedAttackRevealVersions.add(`loot-${version}`);
  setTabUnread("bag", activeDrawerTab !== "bag");
  actionLog.textContent = meta.items.length > 1
    ? `${meta.items.length}개 아이템 획득`
    : `${meta.items[0]?.name ?? "아이템"} 획득`;
  renderer.render();
  updateUi({ skipSnapshotBroadcast: true });
  await playLootRevealItems(meta.items);
}

function handleRemoteCorpseLootMeta(meta = {}) {
  const viewers = meta.viewerControllerIds ?? [];
  if (!viewers.includes(lobbySession.localPlayerId) || !meta.corpseBagId) {
    return;
  }

  openCorpseLootPanel(meta.corpseBagId, { announce: meta.reason ?? "opened" });
}

function handleRemoteDiscardMeta(meta = {}) {
  const viewers = meta.viewerControllerIds ?? [];
  if (!viewers.includes(lobbySession.localPlayerId)) {
    return;
  }

  actionLog.textContent = meta.reason ?? "아이템을 버렸습니다.";
  setDrawerTab("bag");
  loadoutPanel.classList.remove("is-minimized");
  renderer.render();
  updateUi({ skipSnapshotBroadcast: true });
}

function shouldPlayAttackRevealForLocalPlayer(meta, viewers = []) {
  if (viewers.includes(lobbySession.localPlayerId)) {
    return true;
  }

  const player = getUiPlayer();
  if (!player) {
    return false;
  }

  return player.id === meta.attackerId ||
    player.id === meta.targetId ||
    player.id === meta.summary?.attackerId ||
    player.id === meta.summary?.targetId;
}

function isRemoteMultiplayerClient() {
  return Boolean(gameStarted && lobbySession.currentRoom && !isLocalHost());
}

function sendPlayerCommand(command) {
  if (!isRemoteMultiplayerClient() || !canLocalControlActivePlayer()) {
    actionLog.textContent = `입력 불가 | active ${state.player?.name ?? "-"} | mine ${getUiPlayer()?.name ?? "-"}`;
    return false;
  }

  const payload = {
    type: "playerCommand",
    roomId: lobbySession.currentRoom.id,
    sourceId: lobbySession.localPlayerId,
    controllerId: lobbySession.localPlayerId,
    commandId: `${lobbySession.localPlayerId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    command,
    at: Date.now()
  };

  roomSyncChannel?.postMessage(payload);
  sendServerMessage(payload);
  writeJsonStorage(`${PLAYER_COMMAND_STORAGE_PREFIX}${payload.roomId}:${payload.at}:${Math.random().toString(36).slice(2)}`, payload);
  actionLog.textContent = "입력을 방장에게 전송했습니다.";
  return true;
}

async function handleRemotePlayerCommand(payload) {
  if (!isLocalHost() || payload.roomId !== lobbySession.currentRoom?.id || !state?.player) {
    return;
  }

  if (payload.commandId && processedRemoteCommandIds.has(payload.commandId)) {
    return;
  }

  if (payload.commandId) {
    processedRemoteCommandIds.add(payload.commandId);
    if (processedRemoteCommandIds.size > 300) {
      processedRemoteCommandIds.clear();
    }
  }

  if (state.player.controllerId !== payload.controllerId || state.player.isAi) {
    actionLog.textContent = `원격 입력 대기 중 | 현재 ${state.player.name}`;
    return;
  }

  const command = payload.command ?? {};
  actionLog.textContent = `${state.player.name} 원격 입력 처리: ${command.type}`;

  if (command.type === "tileClick") {
    const tile = state.gameMap.tilesByKey.get(command.tileKey);
    if (tile) {
      handleTileClick(tile, { fromRemote: true });
    }
    return;
  }

  if (command.type === "tileAction") {
    if (command.tileKey && (!pendingTileAction || pendingTileAction.tileKey !== command.tileKey)) {
      const tile = state.gameMap.tilesByKey.get(command.tileKey);
      if (tile) {
        state.selectTile(tile);
        buildTileAction(tile, { showUi: false });
      }
    }
    await runPendingTileAction(command.action, { fromRemote: true });
    return;
  }

  if (command.type === "loot") {
    await runLootAction({ fromRemote: true });
    return;
  }

  if (command.type === "corpseTake") {
    const item = state.takeCorpseBagItem(command.corpseBagId, Number(command.itemIndex));
    if (item) {
      broadcastGameSnapshot("corpseLootUpdate", {
        viewerControllerIds: [payload.controllerId],
        corpseBagId: command.corpseBagId,
        reason: `${item.name} moved to bag`
      });
    }
    renderer.render();
    updateUi();
    return;
  }

  if (command.type === "corpseDrop") {
    const item = state.dropBagItem(Number(command.itemIndex));
    if (item) {
      broadcastGameSnapshot("corpseLootUpdate", {
        viewerControllerIds: [payload.controllerId],
        corpseBagId: command.corpseBagId,
        reason: `${item.name} dropped`
      });
    }
    renderer.render();
    updateUi();
    return;
  }

  if (command.type === "discardBagItem") {
    const item = state.discardSelectedBagItem(Number(command.itemIndex));
    if (item) {
      broadcastGameSnapshot("discardUpdate", {
        viewerControllerIds: [payload.controllerId],
        reason: `${item.name} discarded`
      });
    }
    renderer.render();
    updateUi();
    if (state.player?.pendingDiscardCount <= 0) {
      queueAiTurn();
    }
    return;
  }

  if (command.type === "attack") {
    await runAttackSequence();
    return;
  }

  if (command.type === "endTurn") {
    endLocalTurn();
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function bindEvents() {
  mapImport.addEventListener("change", async (event) => {
    stopRaidAutoAdvance();
    const file = event.target.files[0];
    if (!file) return;

    const text = await file.text();
    const mapData = JSON.parse(text);
    currentMapData = mapData;
    state = createRaidState(mapData);
    armorSelect.value = state.player.armorId;
    clearPendingTileAction();
    renderer.replaceState(state);
    lastActivePlayerIndexForUi = null;
    updateUi();
    renderer.render();
    if (gameStarted) {
      await playRaidOrderReveal();
      queueAiTurn();
    } else if (startOverlayStatus) {
      startOverlayStatus.textContent = "Map loaded. Press Start Game when ready.";
    }
    event.target.value = "";
  });

  resetRaid.addEventListener("click", async () => {
    stopRaidAutoAdvance();
    closeCorpseLoot("closed");
    state = createRaidState(currentMapData ?? state.gameMap);
    armorSelect.value = state.player.armorId;
    clearPendingTileAction();
    renderer.replaceState(state);
    lastActivePlayerIndexForUi = null;
    renderer.render();
    updateUi();
    if (gameStarted) {
      await playRaidOrderReveal();
      queueAiTurn();
    } else if (startOverlayStatus) {
      startOverlayStatus.textContent = "Raid reset. Press Start Game when ready.";
    }
  });

  endTurn.addEventListener("click", () => {
    if (sendPlayerCommand({ type: "endTurn" })) {
      return;
    }

    endLocalTurn();
  });

  nextRaid.addEventListener("click", async () => {
    stopRaidAutoAdvance();
    closeCorpseLoot("closed");
    if (state.startNextRaid()) {
      actionLog.textContent = `Raid ${state.raid} started`;
      broadcastGameSnapshot("orderReveal");
      await playRaidOrderReveal();
    }

    clearPendingTileAction();
    renderer.render();
    updateUi();
    queueAiTurn();
  });

  lootAction.addEventListener("click", async () => {
    if (sendPlayerCommand({ type: "loot" })) {
      return;
    }

    await runLootAction();
  });

  attackAction.addEventListener("click", async () => {
    if (sendPlayerCommand({ type: "attack" })) {
      return;
    }

    await runAttackSequence();
  });

  weaponSelect.addEventListener("change", () => {
    if (gameStarted) {
      weaponSelect.value = state.player.weaponId;
      return;
    }
    state.setWeapon(weaponSelect.value);
    actionLog.textContent = `${weaponDisplayName(state.player.weaponId)} selected`;
    renderer.render();
    updateUi();
  });

  moveMode.addEventListener("change", () => {
    state.setMoveMode(moveMode.value);
    actionLog.textContent = `${state.getSelectedMoveAction().label} selected`;
    renderer.render();
    updateUi();
  });

  armorSelect.addEventListener("change", () => {
    if (gameStarted) {
      armorSelect.value = state.player.armorId;
      return;
    }
    state.setPlayerArmor(armorSelect.value);
    actionLog.textContent = `${armorDisplayName(state.player.armorId)} equipped`;
    renderer.render();
    updateUi();
  });

  minimizeLoadout.addEventListener("click", () => closeDrawer());
  tabEquipment?.addEventListener("click", () => toggleDrawer("equipment"));
  tabBag?.addEventListener("click", () => toggleDrawer("bag"));
  tabEvent?.addEventListener("click", () => toggleDrawer("event"));
  tabOther?.addEventListener("click", () => toggleDrawer("other"));
  comPlayerCount?.addEventListener("change", () => {
    syncRoomSettingsFromUi();
    renderComLoadoutSettings();
    renderRoomPanel();
    if (!gameStarted && gameBootstrapped && currentMapData) {
      state = createRaidState(currentMapData);
      clearPendingTileAction();
      renderer.replaceState(state);
      renderer.render();
      updateUi();
      if (startOverlayStatus) {
        startOverlayStatus.textContent = `${getConfiguredAiCount()} COM player(s) ready. Press Start Game.`;
      }
    }
  });
  playerLoadoutSettings?.addEventListener("change", () => {
    if (!gameStarted && gameBootstrapped && currentMapData) {
      state = createRaidState(currentMapData);
      clearPendingTileAction();
      renderer.replaceState(state);
      renderer.render();
      updateUi();
      if (startOverlayStatus) {
        startOverlayStatus.textContent = "Player equipment updated. Press Start Game.";
      }
    }
  });
  comLoadoutSettings?.addEventListener("change", () => {
    if (lobbySession.currentRoom && !isLocalHost()) {
      renderComLoadoutSettings();
      setStartStatus("COM 장비 설정은 방장만 변경할 수 있습니다.");
      return;
    }
    if (!gameStarted && gameBootstrapped && currentMapData) {
      state = createRaidState(currentMapData);
      clearPendingTileAction();
      renderer.replaceState(state);
      renderer.render();
      updateUi();
      if (startOverlayStatus) {
        startOverlayStatus.textContent = "COM equipment updated. Press Start Game.";
      }
    }
  });

  tileActionPopup.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || !pendingTileAction) {
      return;
    }

    if (sendPlayerCommand({
      type: "tileAction",
      action: button.dataset.action,
      tileKey: pendingTileAction.tileKey
    })) {
      clearPendingTileAction();
      return;
    }

    await runPendingTileAction(button.dataset.action);
  });

  corpseLootClose?.addEventListener("click", () => closeCorpseLoot("closed"));
  corpseLootItems?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-corpse-item-index]");

    if (!button || !corpseLootSession) {
      return;
    }

    if (sendPlayerCommand({
      type: "corpseTake",
      corpseBagId: corpseLootSession.corpseBagId,
      itemIndex: Number(button.dataset.corpseItemIndex)
    })) {
      return;
    }

    const item = state.takeCorpseBagItem(corpseLootSession.corpseBagId, Number(button.dataset.corpseItemIndex));

    if (item) {
      setTabUnread("bag", activeDrawerTab !== "bag");
      actionLog.textContent = `${item.name} moved to bag`;
      renderCorpseLootWindow();
      renderer.render();
      updateUi();
    }
  });
  corpseLootPlayerBag?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-player-bag-index]");

    if (!button || !corpseLootSession) {
      return;
    }

    if (sendPlayerCommand({
      type: "corpseDrop",
      corpseBagId: corpseLootSession.corpseBagId,
      itemIndex: Number(button.dataset.playerBagIndex)
    })) {
      return;
    }

    const item = state.dropBagItem(Number(button.dataset.playerBagIndex));

    if (item) {
      actionLog.textContent = `${item.name} dropped`;
      renderCorpseLootWindow();
      renderer.render();
      updateUi();
    }
  });

  bagList?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-discard-index]");
    if (!button) return;
    const player = getUiPlayer();
    const index = Number(button.dataset.discardIndex);
    if (!Number.isInteger(index) || player.pendingDiscardCount <= 0 || !player.bag[index]) {
      return;
    }

    if (sendPlayerCommand({ type: "discardBagItem", itemIndex: index })) {
      actionLog.textContent = "아이템 버리기 요청을 전송했습니다.";
      return;
    }

    const removed = state.discardSelectedBagItem(index, player);
    if (!removed) {
      return;
    }
    actionLog.textContent = `${removed.name} discarded`;
    renderBag();
    renderLoadoutHeader();
    renderer.render();
    updateUi();
    if (player.pendingDiscardCount <= 0) {
      queueAiTurn();
    }
  });
}

function initTopDrawerUi() {
  setupDrawerPanes();
  loadoutPanel.classList.add("is-minimized");
  setDrawerTab("equipment");
}

function setupDrawerPanes() {
  if (!loadoutPanel || loadoutPanel.dataset.tabsReady === "true") {
    return;
  }

  const baseContent = loadoutPanel.querySelector(".loadout-content");

  if (!baseContent) {
    return;
  }

  const equipmentPane = document.createElement("div");
  equipmentPane.className = "drawer-pane is-active";
  equipmentPane.dataset.pane = "equipment";
  loadoutPanel.insertBefore(equipmentPane, baseContent);
  equipmentPane.append(baseContent);

  const bagSection = baseContent.querySelector(".loadout-bag-section");

  const orderSection = document.createElement("section");
  orderSection.className = "loadout-section order-card-section";
  orderSection.innerHTML = `
    <div class="loadout-section-title">
      <h3>Order Card</h3>
      <span id="orderCardBadge" class="loadout-count">#-</span>
    </div>
    <div id="orderCardDisplay" class="order-card-display" aria-label="Current order card"></div>
    <p id="orderCardSummary" class="weapon-passive">-</p>
  `;
  baseContent.insertBefore(orderSection, baseContent.children[1] ?? null);

  const bagPane = document.createElement("div");
  bagPane.className = "drawer-pane";
  bagPane.dataset.pane = "bag";
  bagPane.innerHTML = `
    <div class="bag-drawer-content"></div>
  `;

  if (bagSection) {
    bagPane.querySelector(".bag-drawer-content").append(bagSection);
  }

  const eventPane = document.createElement("div");
  eventPane.className = "drawer-pane";
  eventPane.dataset.pane = "event";
  eventPane.innerHTML = `
    <div class="drawer-pane-content">
      <section class="drawer-card">
        <div class="loadout-section-title">
          <h3>Current Event</h3>
          <span id="eventPhaseBadge" class="loadout-count">-</span>
        </div>
        <div id="eventCardPreview" class="event-card-preview event-card-preview--back">
          <span>EVENT</span>
        </div>
        <p id="eventDrawerTitle" class="drawer-title">None</p>
        <p id="eventDrawerEffect" class="weapon-passive">-</p>
      </section>
      <section class="drawer-card">
        <div class="loadout-section-title">
          <h3>Held Cards</h3>
          <span class="loadout-count">Future Use</span>
        </div>
        <ul id="eventHoldList" class="drawer-simple-list">
          <li><span>No held cards</span></li>
        </ul>
      </section>
      <section class="drawer-card event-debug-card">
        <div class="loadout-section-title">
          <h3>Event Debug</h3>
          <span class="loadout-count">Test</span>
        </div>
        <label class="event-debug-field">
          <span>Card</span>
          <select id="eventDebugSelect"></select>
        </label>
        <button id="eventDebugRun" class="event-debug-run" type="button">선택 카드 실행</button>
      </section>
    </div>
  `;

  const otherPane = document.createElement("div");
  otherPane.className = "drawer-pane";
  otherPane.dataset.pane = "other";
  otherPane.innerHTML = `
    <div class="drawer-pane-content">
      <section class="drawer-card">
        <div class="loadout-section-title">
          <h3>System Audio</h3>
          <span class="loadout-count">Live Mix</span>
        </div>
        <p class="weapon-passive">Adjust each sound in real time and note the percentages you want to keep.</p>
        <div id="soundSettingsList" class="sound-settings-list"></div>
      </section>
      <section class="drawer-card simulation-card">
        <div class="loadout-section-title">
          <h3>COM Simulation</h3>
          <span class="loadout-count">Balance Lab</span>
        </div>
        <div class="simulation-controls">
          <label class="simulation-field">
            <span>Runs</span>
            <input id="simulationRunCount" type="number" min="1" max="500" step="1" value="50">
          </label>
          <button id="simulationRunButton" type="button">Run COM Test</button>
        </div>
        <pre id="simulationOutput" class="simulation-output">No simulation data yet.</pre>
      </section>
    </div>
  `;

  loadoutPanel.append(bagPane, eventPane, otherPane);
  orderCardDisplay = document.querySelector("#orderCardDisplay");
  orderCardBadge = document.querySelector("#orderCardBadge");
  orderCardSummary = document.querySelector("#orderCardSummary");
  eventDrawerTitle = document.querySelector("#eventDrawerTitle");
  eventDrawerEffect = document.querySelector("#eventDrawerEffect");
  eventPhaseBadge = document.querySelector("#eventPhaseBadge");
  eventCardPreview = document.querySelector("#eventCardPreview");
  eventHoldList = document.querySelector("#eventHoldList");
  eventDebugSelect = document.querySelector("#eventDebugSelect");
  eventDebugRun = document.querySelector("#eventDebugRun");
  soundSettingsList = document.querySelector("#soundSettingsList");
  simulationRunCount = document.querySelector("#simulationRunCount");
  simulationRunButton = document.querySelector("#simulationRunButton");
  simulationOutput = document.querySelector("#simulationOutput");

  if (eventDebugRun && eventDebugRun.dataset.bound !== "true") {
    eventDebugRun.addEventListener("click", () => {
      void runEventDebugCard();
    });
    eventDebugRun.dataset.bound = "true";
  }

  raidOrderOverlay = document.querySelector("#raidOrderOverlay");
  raidOrderStage = document.querySelector("#raidOrderStage");

  if (!raidOrderOverlay || !raidOrderStage) {
    raidOrderOverlay = document.createElement("div");
    raidOrderOverlay.id = "raidOrderOverlay";
    raidOrderOverlay.className = "raid-order-overlay";
    raidOrderOverlay.hidden = true;
    raidOrderOverlay.innerHTML = `
      <div class="raid-order-backdrop"></div>
      <div class="raid-order-stage" id="raidOrderStage"></div>
    `;
    document.body.append(raidOrderOverlay);
    raidOrderStage = raidOrderOverlay.querySelector("#raidOrderStage");
  }

  loadoutPanel.dataset.tabsReady = "true";
  populateEventDebugSelect();
  renderSoundSettings();
  bindSoundSettings();
  bindSimulationControls();
}

function setDrawerTab(tab) {
  activeDrawerTab = tab;
  loadoutPanel.dataset.activeTab = tab;
  loadoutPanel.classList.toggle("is-bag-tab", tab === "bag");
  loadoutPanel.classList.toggle("is-system-tab", tab === "other");

  if (tab === "equipment") {
    loadoutTitle.textContent = `${state.player.name} Equipment`;
    loadoutSubtitle.textContent = "Weapon / Armor / Order Card";
  } else if (tab === "bag") {
    loadoutTitle.textContent = `${state.player.name} Bag`;
    loadoutSubtitle.textContent = `Stamina ${state.player.stamina}/${state.player.staminaMax} | Bag ${state.player.bag.length}/${state.player.bagSlots}`;
  } else if (tab === "event") {
    loadoutTitle.textContent = "Event";
    loadoutSubtitle.textContent = "Review the current event and held cards";
  } else {
    loadoutTitle.textContent = "System";
    loadoutSubtitle.textContent = "Adjust live sound levels";
  }

  loadoutPanel.querySelectorAll(".drawer-pane").forEach((pane) => {
    pane.classList.toggle("is-active", pane.dataset.pane === tab);
  });

  setTabUnread(tab, false);

  [tabEquipment, tabBag, tabEvent, tabOther].forEach((button) => {
    if (!button) {
      return;
    }

    const active = button.dataset.tab === tab;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });
}

function toggleDrawer(tab) {
  if (loadoutPanel.classList.contains("is-minimized")) {
    playDrawerOpenSfx(tab);
    setDrawerTab(tab);
    loadoutPanel.classList.remove("is-minimized");
    return;
  }

  if (activeDrawerTab === tab) {
    closeDrawer();
    return;
  }

  playDrawerOpenSfx(tab);
  setDrawerTab(tab);
}

function setTabUnread(tab, unread = true) {
  if (unread) {
    unreadTabs.add(tab);
  } else {
    unreadTabs.delete(tab);
  }

  refreshTabUnreadClasses();
}

function refreshTabUnreadClasses() {
  [tabEquipment, tabBag, tabEvent, tabOther].forEach((button) => {
    if (!button) {
      return;
    }

    button.classList.toggle("has-unread", unreadTabs.has(button.dataset.tab));
  });
}

function closeDrawer() {
  playDrawerCloseSfx(activeDrawerTab);
  loadoutPanel.classList.add("is-minimized");
}

function renderSoundSettings() {
  if (!soundSettingsList) {
    return;
  }

  soundSettingsList.innerHTML = SOUND_SETTING_DEFS.map((setting) => `
    <label class="sound-setting-row" for="sound-${setting.key}">
      <span class="sound-setting-label">${setting.label}</span>
      <input
        id="sound-${setting.key}"
        class="sound-setting-slider"
        type="range"
        min="0"
        max="150"
        step="1"
        value="${SOUND_SETTINGS[setting.key]}"
        data-sound-key="${setting.key}"
      >
      <span class="sound-setting-value" data-sound-value="${setting.key}">${SOUND_SETTINGS[setting.key]}%</span>
    </label>
  `).join("");
}

function bindSoundSettings() {
  if (!soundSettingsList || soundSettingsList.dataset.bound === "true") {
    return;
  }

  const syncSoundSetting = (input) => {
    const key = input.dataset.soundKey;

    if (!key || !(key in SOUND_SETTINGS)) {
      return;
    }

    SOUND_SETTINGS[key] = Number(input.value);
    const valueNode = soundSettingsList.querySelector(`[data-sound-value="${key}"]`);

    if (valueNode) {
      valueNode.textContent = `${SOUND_SETTINGS[key]}%`;
    }
  };

  soundSettingsList.addEventListener("input", (event) => {
    const input = event.target.closest("input[data-sound-key]");

    if (!input) {
      return;
    }

    syncSoundSetting(input);
  });

  soundSettingsList.dataset.bound = "true";
}

function bindSimulationControls() {
  if (!simulationRunButton || simulationRunButton.dataset.bound === "true") {
    return;
  }

  simulationRunButton.addEventListener("click", () => {
    void runComSimulationFromUi();
  });
  simulationRunButton.dataset.bound = "true";
}

async function runComSimulationFromUi() {
  if (simulationRunning) {
    return;
  }

  if (!gameBootstrapped) {
    await bootstrap();
  }

  const runs = Math.max(1, Math.min(500, Number(simulationRunCount?.value ?? 50)));
  const liveState = state;
  simulationRunning = true;
  simulationRunButton.disabled = true;
  simulationOutput.textContent = `Running ${runs} COM simulation(s)...`;

  const stats = createSimulationStats(runs);

  try {
    for (let runIndex = 0; runIndex < runs; runIndex += 1) {
      const simState = createComSimulationState();
      runSingleComSimulation(simState, stats, runIndex + 1);

      if ((runIndex + 1) % 10 === 0 || runIndex === runs - 1) {
        simulationOutput.textContent = formatSimulationSummary(stats, runIndex + 1);
        await wait(0);
      }
    }
  } finally {
    state = liveState;
    simulationRunning = false;
    simulationRunButton.disabled = false;
    simulationOutput.textContent = formatSimulationSummary(stats, runs);
  }
}

function createComSimulationState() {
  const simMapData = cloneData(currentMapData ?? state.gameMap);
  const simState = new RaidGameState({
    mapData: simMapData,
    playerTemplate,
    lootTables,
    weapons,
    dice,
    armor,
    events,
    aiCount: Math.max(1, getConfiguredAiCount()),
    playerLoadouts: getConfiguredPlayerLoadouts()
  });

  normalizeSimulationPlayers(simState);

  return simState;
}

function normalizeSimulationPlayers(simState) {
  simState.players.forEach((player, index) => {
    player.isAi = true;
    player.name = `SIM COM ${index + 1}`;
    player.aiProfile = getAiProfileId(index + 1);
  });
}

function cloneData(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function createSimulationStats(runs) {
  return {
    runs,
    completedRuns: 0,
    raids: 0,
    turns: 0,
    actions: 0,
    moves: 0,
    movedTiles: 0,
    attacks: 0,
    damage: 0,
    kills: 0,
    loots: 0,
    lootValue: 0,
    escapes: 0,
    deaths: 0,
    phaseMovement: new Map(),
    raidBreakdown: new Map(),
    playerTotals: new Map(),
    sampleLog: []
  };
}

function runSingleComSimulation(simState, stats, runNumber) {
  const liveState = state;
  state = simState;

  try {
    let guard = 0;

    while (guard < 5000) {
      guard += 1;

      if (simState.raidEnded) {
        recordSimulationRaid(simState, stats, runNumber);

        if (simState.raid >= 3) {
          recordSimulationRunScores(simState, stats);
          stats.completedRuns += 1;
          break;
        }

        simState.startNextRaid();
        normalizeSimulationPlayers(simState);
        continue;
      }

      simulateComTurn(simState, stats, runNumber);
    }
  } finally {
    state = liveState;
  }
}

function simulateComTurn(simState, stats, runNumber) {
  const actor = simState.player;

  if (!actor || !simState.isPlayerActive(actor)) {
    simState.endTurn();
    return;
  }

  stats.turns += 1;
  ensureSimulationPlayerStats(stats, actor);
  let guard = 0;

  while (simState.player?.id === actor.id && simState.isPlayerActive(actor) && !simState.raidEnded && guard < 8) {
    guard += 1;
    const action = chooseSimulationAction(simState, actor);

    if (!action) {
      simState.endTurn();
      return;
    }

    applySimulationAction(simState, stats, runNumber, actor, action);

    if (simState.raidEnded || simState.player?.id !== actor.id) {
      return;
    }

    if (simState.getAvailableStamina() <= 0 || simState.actionLocked) {
      simState.endTurn();
      return;
    }
  }

  if (!simState.raidEnded && simState.player?.id === actor.id) {
    simState.endTurn();
  }
}

function chooseSimulationAction(simState, actor) {
  const opponents = getAiOpponents(actor);

  if (shouldAiExtract(actor, opponents)) {
    if (simState.canPlayerExtractFromTile(actor, simState.currentTile)) {
      return { type: "extract" };
    }

    const extractionPlan = chooseAiGoalPlan(simState.getExtractionTilesForPlayer(actor));

    if (extractionPlan?.moveTile) {
      return { type: "move", tile: extractionPlan.moveTile, reason: "extract" };
    }
  }

  const attackPlan = chooseAiAttackPlan(actor, opponents);

  if (attackPlan?.attackNow) {
    return { type: "attack", target: attackPlan.target };
  }

  if (simState.canLoot() && shouldAiLootCurrentTile(actor, opponents)) {
    return { type: "loot" };
  }

  if (attackPlan?.moveTile) {
    return { type: "move", tile: attackPlan.moveTile, reason: "attack" };
  }

  const lootPlan = chooseAiLootPlan(actor, opponents);

  if (lootPlan?.moveTile) {
    return { type: "move", tile: lootPlan.moveTile, reason: "loot" };
  }

  if (simState.canLoot()) {
    return { type: "loot" };
  }

  const fallbackExtraction = chooseAiGoalPlan(simState.getExtractionTilesForPlayer(actor));

  if (fallbackExtraction?.moveTile) {
    return { type: "move", tile: fallbackExtraction.moveTile, reason: "fallback" };
  }

  return null;
}

function applySimulationAction(simState, stats, runNumber, actor, action) {
  stats.actions += 1;
  const playerStats = ensureSimulationPlayerStats(stats, actor);

  if (action.type === "extract") {
    const beforeEscaped = actor.extractedThisRaid;
    simState.endTurn();

    if (!beforeEscaped && actor.extractedThisRaid) {
      appendSimulationLog(stats, `R${runNumber}.${simState.raid} P${simState.phase}: ${actor.name} extracted value ${actor.bagValue}`);
    }
    return;
  }

  if (action.type === "move") {
    const result = simState.movePlayer(action.tile);

    if (result) {
      const raidStats = ensureSimulationRaidStats(stats, simState.raid);
      stats.moves += 1;
      stats.movedTiles += result.distance;
      raidStats.moves += 1;
      raidStats.movedTiles += result.distance;
      playerStats.moves += 1;
      playerStats.movedTiles += result.distance;
      addPhaseMovement(stats, simState.phase, result.distance);
      appendSimulationLog(stats, `R${runNumber}.${simState.raid} P${simState.phase}: ${actor.name} moved ${result.distance} (${action.reason})`);
    }
    return;
  }

  if (action.type === "loot") {
    const result = simState.lootCurrentTile();

    if (result) {
      const raidStats = ensureSimulationRaidStats(stats, simState.raid);
      const items = result.items ?? [result];
      const value = items.reduce((sum, item) => sum + (item.value ?? 0), 0);
      stats.loots += items.length;
      stats.lootValue += value;
      raidStats.loots += items.length;
      raidStats.lootValue += value;
      playerStats.loots += items.length;
      playerStats.lootValue += value;
      appendSimulationLog(stats, `R${runNumber}.${simState.raid} P${simState.phase}: ${actor.name} looted ${items.map((item) => item.name).join(", ")} (${value})`);
    }
    return;
  }

  if (action.type === "attack") {
    const target = action.target;
    const targetWasAlive = target?.alive;
    simState.selectTile(target.position);
    const result = simState.attackSelectedEnemy();

    if (result) {
      const raidStats = ensureSimulationRaidStats(stats, simState.raid);
      const damage = result.damageEvents.reduce((sum, event) => sum + event.damage, 0);
      stats.attacks += 1;
      stats.damage += damage;
      raidStats.attacks += 1;
      raidStats.damage += damage;
      playerStats.attacks += 1;
      playerStats.damage += damage;

      if (targetWasAlive && target.dead) {
        stats.kills += 1;
        raidStats.kills += 1;
        playerStats.kills += 1;
      }

      appendSimulationLog(stats, `R${runNumber}.${simState.raid} P${simState.phase}: ${actor.name} attacked ${target.name}, damage ${damage}`);
      simState.endTurn();
    }
  }
}

function ensureSimulationPlayerStats(stats, player) {
  if (!stats.playerTotals.has(player.id)) {
    stats.playerTotals.set(player.id, {
      name: player.name,
      profile: getAiProfileLabel(player),
      attacks: 0,
      damage: 0,
      kills: 0,
      loots: 0,
      lootValue: 0,
      moves: 0,
      movedTiles: 0,
      escapes: 0,
      deaths: 0,
      score: 0
    });
  }

  return stats.playerTotals.get(player.id);
}

function ensureSimulationRaidStats(stats, raid) {
  if (!stats.raidBreakdown.has(raid)) {
    stats.raidBreakdown.set(raid, {
      raids: 0,
      slots: 0,
      moves: 0,
      movedTiles: 0,
      attacks: 0,
      damage: 0,
      kills: 0,
      loots: 0,
      lootValue: 0,
      escapes: 0,
      deaths: 0
    });
  }

  return stats.raidBreakdown.get(raid);
}

function recordSimulationRaid(simState, stats, runNumber) {
  stats.raids += 1;
  const raidStats = ensureSimulationRaidStats(stats, simState.raid);
  raidStats.raids += 1;
  raidStats.slots += simState.players.length;

  simState.players.forEach((player) => {
    const playerStats = ensureSimulationPlayerStats(stats, player);

    if (player.extractedThisRaid) {
      stats.escapes += 1;
      raidStats.escapes += 1;
      playerStats.escapes += 1;
    }

    if (player.dead) {
      stats.deaths += 1;
      raidStats.deaths += 1;
      playerStats.deaths += 1;
    }
  });

  appendSimulationLog(stats, `R${runNumber}.${simState.raid}: raid ended ${simState.raidResult}`);
}

function recordSimulationRunScores(simState, stats) {
  simState.players.forEach((player) => {
    const playerStats = ensureSimulationPlayerStats(stats, player);
    playerStats.score += simState.getPlayerScore(player);
  });
}

function addPhaseMovement(stats, phase, distance) {
  const current = stats.phaseMovement.get(phase) ?? { movedTiles: 0, moves: 0 };
  current.movedTiles += distance;
  current.moves += 1;
  stats.phaseMovement.set(phase, current);
}

function appendSimulationLog(stats, message) {
  if (stats.sampleLog.length >= 60) {
    return;
  }

  stats.sampleLog.push(message);
}

function formatSimulationSummary(stats, completedRuns = stats.completedRuns) {
  const playerCount = Math.max(1, stats.playerTotals.size);
  const totalSlots = Math.max(1, stats.raids * playerCount);
  const avg = (value, divisor) => (value / Math.max(1, divisor)).toFixed(2);
  const phaseMovement = [...stats.phaseMovement.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([phase, entry]) => `P${phase}:${avg(entry.movedTiles, entry.moves)}`)
    .join(" ");
  const raidBreakdown = [...stats.raidBreakdown.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([raid, entry]) => {
      const slots = Math.max(1, entry.slots);
      return `Raid ${raid}: loot/run ${avg(entry.lootValue, completedRuns)}, dmg/run ${avg(entry.damage, completedRuns)}, escape ${Math.round(entry.escapes / slots * 100)}%, death ${Math.round(entry.deaths / slots * 100)}%, move ${avg(entry.movedTiles, entry.moves)}`;
    })
    .join("\n");
  const players = [...stats.playerTotals.values()]
    .map((entry) => {
      return `${entry.name} [${entry.profile}] score ${avg(entry.score, Math.max(1, stats.raids))}, loot ${avg(entry.lootValue, completedRuns)}, dmg ${avg(entry.damage, completedRuns)}, escape ${Math.round(entry.escapes / Math.max(1, stats.raids) * 100)}%`;
    })
    .join("\n");

  return [
    `COM Simulation ${completedRuns}/${stats.runs} run(s)`,
    `Raids: ${stats.raids}`,
    `Actions: ${stats.actions} | Turns: ${stats.turns}`,
    `Move avg tiles/action: ${avg(stats.movedTiles, stats.moves)}`,
    `Loot avg value/run: ${avg(stats.lootValue, completedRuns)}`,
    `Attack avg damage/run: ${avg(stats.damage, completedRuns)} | Kills: ${stats.kills}`,
    `Escape rate: ${Math.round(stats.escapes / totalSlots * 100)}% | Death rate: ${Math.round(stats.deaths / totalSlots * 100)}%`,
    `Phase move avg: ${phaseMovement || "-"}`,
    "",
    "By Raid",
    raidBreakdown || "-",
    "",
    "By COM",
    players || "-",
    "",
    "Sample Log",
    stats.sampleLog.join("\n") || "-"
  ].join("\n");
}

function populateEventDebugSelect() {
  if (!eventDebugSelect || !events?.length) {
    return;
  }

  eventDebugSelect.innerHTML = events
    .map((card) => {
      const number = String(card.number ?? "?").padStart(2, "0");
      return `<option value="${card.id}">${number}. ${card.name}</option>`;
    })
    .join("");

  const precious = events.find((card) => card.id === "my_precious");
  if (precious) {
    eventDebugSelect.value = precious.id;
  }
}

async function runEventDebugCard() {
  if (!eventDebugSelect || !state || eventRevealRunning || cardRevealRunning || attackSequenceRunning || movementSequenceRunning) {
    return;
  }

  const result = state.triggerEventForPlayer(eventDebugSelect.value, 0);

  if (!result) {
    actionLog.textContent = "이벤트 디버그 실행 실패";
    return;
  }

  setDrawerTab("event");
  loadoutPanel.classList.remove("is-minimized");
  actionLog.textContent = `디버그 이벤트 실행: ${result.card.name}`;
  setTabUnread("event", false);
  renderer.render();
  updateUi();
  await playPendingEventResults();
  await playPendingEventDiceRolls();
  renderer.render();
  updateUi();
}

function handleTileClick(tile, { fromRemote = false } = {}) {
  if (!fromRemote && isInteractionLocked()) {
    return;
  }

  const key = `${tile.q},${tile.r}`;

  if (pendingTileAction?.type === "move" && pendingTileAction.tileKey === key) {
    if (!fromRemote && sendPlayerCommand({ type: "tileAction", action: "move" })) {
      clearPendingTileAction();
      return;
    }

    void performMoveToTile(tile);
    return;
  }

  if (!fromRemote && sendPlayerCommand({ type: "tileClick", tileKey: key })) {
    state.selectTile(tile);
    buildTileAction(tile);
    renderer.render();
    updateUi({ skipSnapshotBroadcast: true });
    return;
  }

  state.selectTile(tile);
  if (fromRemote) {
    buildTileAction(tile, { showUi: false });
  } else if (canLocalControlActivePlayer()) {
    buildTileAction(tile);
  } else {
    clearPendingTileAction();
  }
  renderer.render();
  updateUi();
}

function buildTileAction(tile, { showUi = true } = {}) {
  const target = state.getTargetAt(tile);

  if (target && state.canAttackSelectedTile()) {
    setTileAction(tile, "attack", [{ action: "attack", label: "Attack", primary: true }], { showUi });
    return;
  }

  const moveOption = state.getMovementOptionTo(tile);

  if (moveOption) {
    setTileAction(tile, "move", [{ action: "move", label: moveOption.label, primary: true }], { showUi });
    return;
  }

  if (state.currentTile && state.canLoot() && `${state.currentTile.q},${state.currentTile.r}` === `${tile.q},${tile.r}`) {
    setTileAction(tile, "loot", [{ action: "loot", label: "Loot", primary: true }], { showUi });
    return;
  }

  if (state.currentTile && state.canLootCorpseBag(tile) && `${state.currentTile.q},${state.currentTile.r}` === `${tile.q},${tile.r}`) {
    setTileAction(tile, "corpseLoot", [{ action: "corpseLoot", label: "Corpse Bag", primary: true }], { showUi });
    return;
  }

  clearPendingTileAction();
}

function setTileAction(tile, type, actions, { showUi = true } = {}) {
  if (showUi) {
    showTileAction(tile, type, actions);
    return;
  }

  pendingTileAction = {
    type,
    tileKey: `${tile.q},${tile.r}`
  };
  tileActionPopup.hidden = true;
  tileActionPopup.innerHTML = "";
}

function showContextActionForCurrentTile() {
  if (!isLocalPlayerTurn() || !state.currentTile) {
    return;
  }

  if (state.canLoot()) {
    showTileAction(state.currentTile, "loot", [{ action: "loot", label: "Loot", primary: true }]);
    return;
  }

  if (state.canLootCorpseBag()) {
    showTileAction(state.currentTile, "corpseLoot", [{ action: "corpseLoot", label: "Corpse Bag", primary: true }]);
  }
}

function showTileAction(tile, type, actions) {
  pendingTileAction = {
    type,
    tileKey: `${tile.q},${tile.r}`
  };

  const center = renderer.getTileScreenCenter(tile);
  tileActionPopup.innerHTML = actions
    .map((action) => `<button class="${action.primary ? "is-primary" : ""}" type="button" data-action="${action.action}">${action.label}</button>`)
    .join("");
  tileActionPopup.hidden = false;
  tileActionPopup.style.left = `${center.x}px`;
  tileActionPopup.style.top = `${center.y - getTileActionPopupOffset(type)}px`;
}

function getTileActionPopupOffset(type) {
  const radius = (state.gameMap.hexSize ?? 30) * (renderer.camera?.zoom ?? 1);
  const buttonGap = type === "move" ? 7 : 2;
  return Math.max(18, Math.min(42, radius * 0.45 + buttonGap));
}

function clearPendingTileAction() {
  pendingTileAction = null;
  tileActionPopup.hidden = true;
  tileActionPopup.innerHTML = "";
}

function openCorpseLoot(tile) {
  if (!corpseLootOverlay) {
    return false;
  }

  const corpseBag = state.openCorpseBag(tile);

  if (!corpseBag) {
    actionLog.textContent = "Corpse bag is not available.";
    renderer.render();
    updateUi();
    return false;
  }

  return openCorpseLootPanel(corpseBag.id, { announce: `${corpseBag.ownerName}'s corpse bag opened` });
}

function openCorpseLootPanel(corpseBagId, { announce = "Corpse bag opened" } = {}) {
  if (!corpseLootOverlay) {
    return false;
  }

  const corpseBag = state.getCorpseBagById(corpseBagId);
  if (!corpseBag) {
    return false;
  }

  if (corpseLootSession?.corpseBagId === corpseBagId) {
    actionLog.textContent = announce;
    renderCorpseLootWindow();
    renderer.render();
    updateUi({ skipSnapshotBroadcast: true });
    return true;
  }

  if (corpseLootSession) {
    closeCorpseLoot("switch");
  }

  corpseLootSession = {
    corpseBagId,
    openedAt: Date.now()
  };
  corpseLootOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  playSound(SOUND_URLS.drawerOpen, { volume: 0.76 });
  renderCorpseLootWindow();

  if (!corpseLootTimerInterval) {
    corpseLootTimerInterval = window.setInterval(handleCorpseLootTick, 250);
  }

  actionLog.textContent = announce;
  renderer.render();
  updateUi();
  return true;
}

function closeCorpseLoot(reason = "closed") {
  if (!corpseLootSession) {
    return;
  }

  corpseLootSession = null;
  if (corpseLootTimerInterval) {
    window.clearInterval(corpseLootTimerInterval);
    corpseLootTimerInterval = 0;
  }
  if (corpseLootOverlay) {
    corpseLootOverlay.hidden = true;
  }
  document.body.style.overflow = "";
  playSound(SOUND_URLS.drawerClose, { volume: 0.7 });
  actionLog.textContent = reason === "timeout" ? "Corpse looting time expired" : "Corpse bag closed";
  renderer.render();
  updateUi();
  showContextActionForCurrentTile();
}

function handleCorpseLootTick() {
  if (!corpseLootSession) {
    return;
  }

  renderCorpseLootWindow();

  if (getTurnTimerRemaining() <= 0) {
    closeCorpseLoot("timeout");
  }
}

function renderCorpseLootWindow() {
  if (!corpseLootSession || !corpseLootItems || !corpseLootPlayerBag) {
    return;
  }

  const corpseBag = state.getCorpseBagById(corpseLootSession.corpseBagId);
  const player = getUiPlayer();

  if (!corpseBag) {
    closeCorpseLoot("closed");
    return;
  }

  if (corpseLootTitle) {
    corpseLootTitle.textContent = `${corpseBag.ownerName}'s Bag`;
  }
  if (corpseLootTimer) {
    corpseLootTimer.textContent = `Time :${String(getTurnTimerRemaining()).padStart(2, "0")}`;
  }
  if (corpseLootBagStatus) {
    corpseLootBagStatus.textContent = `${player.bag.length} / ${player.bagSlots}`;
  }

  corpseLootItems.innerHTML = corpseBag.items.length > 0
    ? corpseBag.items.map((item, index) => renderCorpseLootItem(item, index, "corpse")).join("")
    : "<li class=\"corpse-loot-empty\">Empty</li>";

  corpseLootPlayerBag.innerHTML = player.bag.length > 0
    ? player.bag.map((item, index) => renderCorpseLootItem(item, index, "player")).join("")
    : "<li class=\"corpse-loot-empty\">Your bag is empty</li>";
}

function renderCorpseLootItem(item, index, source) {
  const action = source === "corpse"
    ? `data-corpse-item-index="${index}"`
    : `data-player-bag-index="${index}"`;
  const player = getUiPlayer();
  const disabled = source === "corpse" && player.bag.length >= player.bagSlots ? "disabled" : "";
  const verb = source === "corpse" ? "Take" : "Drop";

  return `
    <li>
      <button type="button" ${action} ${disabled}>
        <span>${item.name}</span>
        <strong>${item.value ?? 0}</strong>
        <em>${verb}</em>
      </button>
    </li>
  `;
}

async function runPendingTileAction(action, { fromRemote = false } = {}) {
  if (!pendingTileAction) {
    return;
  }

  const tile = state.gameMap.tilesByKey.get(pendingTileAction.tileKey);

  if (!tile) {
    clearPendingTileAction();
    return;
  }

  if (action === "move") {
    await performMoveToTile(tile);
    return;
  }

  if (action === "attack") {
    clearPendingTileAction();
    await runAttackSequence();
    return;
  }

  if (action === "loot") {
    const item = state.lootCurrentTile();
    const revealLoot = !fromRemote && canLocalControlActivePlayer();
    if (item && revealLoot) {
      setTabUnread("bag", activeDrawerTab !== "bag");
      await playLootRevealItems(item.items ?? [item]);
    } else if (item && fromRemote && state.player.controllerId) {
      broadcastGameSnapshot("lootReveal", {
        viewerControllerIds: [state.player.controllerId],
        items: item.items ?? [item]
      });
    }
    actionLog.textContent = item ? `${item.name} acquired (${item.value})` : "No more loot is available on this tile.";
    clearPendingTileAction();
    renderer.render();
    updateUi();

    if (item && maybeAutoAdvanceTurn("Loot complete")) {
      return;
    }

    showContextActionForCurrentTile();
    queueAiTurn();
    return;
  }

  if (action === "corpseLoot") {
    clearPendingTileAction();
    if (fromRemote) {
      const corpseBag = state.openCorpseBag(tile);
      if (corpseBag && state.player.controllerId) {
        broadcastGameSnapshot("corpseLootOpen", {
          viewerControllerIds: [state.player.controllerId],
          corpseBagId: corpseBag.id,
          reason: `${corpseBag.ownerName}'s corpse bag opened`
        });
      }
      renderer.render();
      updateUi();
      return;
    }
    openCorpseLoot(tile);
  }
}

function endLocalTurn() {
  closeCorpseLoot("closed");
  const result = state.endTurn();
  clearPendingTileAction();
  actionLog.textContent = result === "inProgress" ? `${state.player.name} turn ready` : resultLabel(result);
  renderer.render();
  updateUi();
  queueAiTurn();
}

async function runLootAction({ fromRemote = false } = {}) {
  const item = state.lootCurrentTile();
  clearPendingTileAction();
  const revealLoot = !fromRemote && canLocalControlActivePlayer();
  if (item && revealLoot) {
    setTabUnread("bag", activeDrawerTab !== "bag");
    await playLootRevealItems(item.items ?? [item]);
  } else if (item && fromRemote && state.player.controllerId) {
    broadcastGameSnapshot("lootReveal", {
      viewerControllerIds: [state.player.controllerId],
      items: item.items ?? [item]
    });
  }
  actionLog.textContent = item ? `${item.name} acquired (${item.value})` : "No more loot is available on this tile.";
  renderer.render();
  updateUi();
  if (item) {
    maybeAutoAdvanceTurn("Loot complete");
  }
}

async function performMoveToTile(tile, { reason = "Move complete" } = {}) {
  if (movementSequenceRunning || !tile) {
    return false;
  }

  const wasPostAttackMove = state.postAttackMoveAvailable;
  const moveResult = state.movePlayer(tile);

  if (!moveResult) {
    return false;
  }

  movementSequenceRunning = true;
  clearPendingTileAction();
  renderer.render();
  if (!state.player.isAi && !canLocalControlActivePlayer()) {
    broadcastGameSnapshot("movement", {
      type: "movement",
      unitId: state.player.id,
      path: moveResult.path
    });
  }
  updateUi();
  const revealMovement = !state.player.isAi || shouldRevealAiMovement(moveResult);

  try {
    if (revealMovement) {
      await renderer.playMovementAnimation(state.player.id, moveResult.path);
      if (state.player.isAi) {
        await waitAiTiming("afterVisibleAction");
      }
    } else if (state.player.isAi) {
      await waitAiTiming("afterHiddenAction");
    }
  } finally {
    movementSequenceRunning = false;
  }

  actionLog.textContent = state.player.isAi && !revealMovement ? `${state.player.name} 차례입니다.. 진행중..` : reason;
  renderer.render();
  updateUi();

  if (moveResult.extracted) {
    if (state.player.isAi) {
      await waitAiTiming("afterHiddenAction");
    }
    const result = state.endTurn();
    actionLog.textContent = result === "inProgress" ? "Extracted and ended turn" : resultLabel(result);
    renderer.render();
    updateUi();
    queueAiTurn();
    return true;
  }

  if (wasPostAttackMove) {
    if (state.player.isAi) {
      await waitAiTiming("afterHiddenAction");
    }
    const result = state.endTurn();
    actionLog.textContent = result === "inProgress"
      ? "AR bonus move complete | turn end"
      : `AR bonus move complete | ${resultLabel(result)}`;
    renderer.render();
    updateUi();
    queueAiTurn();
    return true;
  }

  if (maybeAutoAdvanceTurn("No stamina")) {
    return true;
  }

  showContextActionForCurrentTile();
  queueAiTurn();
  return true;
}

async function runAttackSequence() {
  if (attackSequenceRunning || cardRevealRunning || eventRevealRunning || movementSequenceRunning) {
    return false;
  }

  attackSequenceRunning = true;
  updateUi();
  clearPendingTileAction();

  const result = state.attackSelectedEnemy();

  if (!result) {
    actionLog.textContent = "No valid attack target.";
    attackSequenceRunning = false;
    renderer.render();
    updateUi();
    queueAiTurn();
    return false;
  }

  const revealAttack = state.player.isAi
    ? shouldRevealAiAttack(result)
    : shouldPlayerSeeAttackReveal(getUiPlayer(), result, state.lastAttackSummary);
  const remoteAttackViewers = getRemoteAttackRevealControllerIds(result);
  if (remoteAttackViewers.length > 0) {
    broadcastGameSnapshot("attackReveal", {
      viewerControllerIds: remoteAttackViewers,
      attackerId: state.player.id,
      targetId: result.enemy?.id,
      weaponId: result.weapon?.name ?? state.player.weaponId,
      roll: result.roll,
      summary: state.lastAttackSummary
    });
  }

  if (revealAttack) {
    await playAttackDiceOverlay(result.roll);
    playAttackCombatSfx(result);
  }
  if (revealAttack) {
    renderer.playAttackAnimation(state.lastAttackSummary);
    if (state.player.isAi) {
      await waitAiTiming("afterVisibleAction");
    }
  } else if (state.player.isAi) {
    await waitAiTiming("afterHiddenAction");
  }
  const attackSummary = `${weaponDisplayName(state.player.weaponId)}: ${result.roll.map((face) => dieFaceLabel(face)).join(", ")}`;
  attackSequenceRunning = false;

  if (state.postAttackMoveAvailable && !state.raidEnded) {
    actionLog.textContent = revealAttack ? `${attackSummary} | AR bonus move available` : `${state.player.name} 차례입니다.. 진행중..`;
    renderer.render();
    updateUi();
    showContextActionForCurrentTile();
    queueAiTurn();
    return true;
  }

  const endResult = state.raidEnded ? state.raidResult : state.endTurn();
  actionLog.textContent = revealAttack
    ? (endResult === "inProgress" ? `${attackSummary} | turn end` : `${attackSummary} | ${resultLabel(endResult)}`)
    : (endResult === "inProgress" ? `${state.player.name} 차례입니다.. 진행중..` : resultLabel(endResult));
  renderer.render();
  updateUi();
  queueAiTurn();
  return true;
}

function maybeAutoAdvanceTurn(reason = "No stamina") {
  if (attackSequenceRunning || cardRevealRunning || eventRevealRunning || movementSequenceRunning || state.raidEnded) {
    return false;
  }

  if (state.getAvailableStamina() > 0) {
    return false;
  }

  if (hasHpMoveChoiceAvailable()) {
    actionLog.textContent = "스태미나 0 | 살려면 달려! HP를 소모해 추가 이동할 수 있습니다.";
    renderer.render();
    updateUi();
    return false;
  }

  clearPendingTileAction();
  const result = state.endTurn();
  actionLog.textContent = result === "inProgress"
    ? `${reason} | turn end`
    : `${reason} | ${resultLabel(result)}`;
  renderer.render();
  updateUi();
  queueAiTurn();
  return true;
}

function hasHpMoveChoiceAvailable() {
  return Boolean(
    canLocalControlActivePlayer() &&
    state.canUseHpMove?.() &&
    state.getMovementEntries?.().length > 0
  );
}

function shouldRevealAiMovement(moveResult) {
  const viewer = getUiPlayer();

  if (isSpectatorVisionActive()) {
    return true;
  }

  return moveResult.path?.some((step) => state.isTileVisibleToPlayer(step, viewer)) ?? false;
}

function shouldRevealAiAttack(result) {
  const viewer = getUiPlayer();
  const summary = state.lastAttackSummary;

  if (isSpectatorVisionActive()) {
    return true;
  }

  if (result.enemy?.id === viewer.id) {
    return true;
  }

  return Boolean(
    summary?.from &&
    summary?.to &&
    state.isTileVisibleToPlayer(summary.from, viewer) &&
    state.isTileVisibleToPlayer(summary.to, viewer)
  );
}

function getRemoteAttackRevealControllerIds(result) {
  const summary = state.lastAttackSummary;
  if (!summary) {
    return [];
  }

  return state.players
    .filter((player) => player.controllerId && player.controllerId !== lobbySession.localPlayerId)
    .filter((player) => shouldPlayerSeeAttackReveal(player, result, summary))
    .map((player) => player.controllerId);
}

function shouldPlayerSeeAttackReveal(player, result, summary) {
  if (!player?.controllerId) {
    return false;
  }

  if (player.id === summary.attackerId || player.id === summary.targetId || player.id === result.enemy?.id) {
    return true;
  }

  if (player.dead || player.escaped || !player.position) {
    return true;
  }

  return Boolean(
    summary.from &&
    summary.to &&
    state.isTileVisibleToPlayer(summary.from, player) &&
    state.isTileVisibleToPlayer(summary.to, player)
  );
}

function isSpectatorVisionActive() {
  const player = getUiPlayer();
  return Boolean(player?.dead || player?.escaped || !player?.position);
}

function isInteractionLocked() {
  return !canLocalControlActivePlayer() || attackSequenceRunning || cardRevealRunning || eventRevealRunning || movementSequenceRunning || aiTurnRunning || state.player?.isAi || hasBlockingPlayerDiscard();
}

function isLocalPlayerTurn() {
  return canLocalControlActivePlayer() && !isSpectatorVisionActive();
}

function canLocalControlActivePlayer() {
  if (!gameStarted || !state?.player || state.player.isAi) {
    return false;
  }

  const localPlayer = getUiPlayer();
  return state.player.controllerId === lobbySession.localPlayerId ||
    state.player.id === localPlayer?.id ||
    (!state.player.controllerId && isLocalHost());
}

function queueAiTurn() {
  window.clearTimeout(aiTurnTimer);
  aiTurnTimer = 0;

  if (
    !state ||
    isRemoteMultiplayerClient() ||
    state.raidEnded ||
    !state.player?.isAi ||
    hasBlockingPlayerDiscard() ||
    attackSequenceRunning ||
    cardRevealRunning ||
    eventRevealRunning ||
    movementSequenceRunning ||
    aiTurnRunning
  ) {
    return;
  }

  aiTurnTimer = window.setTimeout(() => {
    aiTurnTimer = 0;
    void runAiTurn();
  }, randomAiTiming("turnStart"));
}

async function runAiTurn() {
  if (!state.player?.isAi || state.raidEnded || aiTurnRunning) {
    return;
  }

  aiTurnRunning = true;
  clearPendingTileAction();
  actionLog.textContent = `${state.player.name} 차례입니다.. 진행중..`;
  renderer.render();
  updateUi();
  await waitAiTiming("thinkBeforeAction");

  try {
    let guard = 0;

    while (state.player?.isAi && !state.raidEnded && guard < 8) {
      guard += 1;
      actionLog.textContent = `${state.player.name} 차례입니다.. 생각 중..`;
      renderer.render();
      updateUi();
      await waitAiTiming("thinkBeforeAction");
      const acted = await performAiStep();

      if (!acted) {
        await waitAiTiming("turnEnd");
        const result = state.endTurn();
        actionLog.textContent = result === "inProgress" ? `${state.player.name} 차례입니다.. 진행중..` : resultLabel(result);
        renderer.render();
        updateUi();
        break;
      }

      if (!state.player?.isAi || state.raidEnded) {
        break;
      }

      if (state.getAvailableStamina() <= 0 || state.actionLocked) {
        await waitAiTiming("turnEnd");
        maybeAutoAdvanceTurn("COM spent stamina");
        break;
      }

      await waitAiTiming("betweenActions");
    }
  } finally {
    aiTurnRunning = false;
    actionLog.textContent = state.player?.isAi ? `${state.player.name} 차례입니다.. 진행중..` : `${state.player.name} turn ready`;
    updateUi();
    if (!hasBlockingPlayerDiscard()) {
      queueAiTurn();
    }
  }
}

async function performAiStep() {
  const ai = state.player;
  const opponents = getAiOpponents(ai);

  if (!ai?.isAi || !state.isPlayerActive(ai)) {
    return false;
  }

  if (shouldAiExtract(ai, opponents)) {
    if (state.canPlayerExtractFromTile(ai, state.currentTile)) {
      const result = state.endTurn();
      actionLog.textContent = result === "inProgress" ? `${ai.name} 차례입니다.. 진행중..` : resultLabel(result);
      renderer.render();
      updateUi();
      return true;
    }

    const extractionPlan = chooseAiGoalPlan(state.getExtractionTilesForPlayer(ai));

    if (extractionPlan?.moveTile) {
      return performMoveToTile(extractionPlan.moveTile, { reason: "COM repositioning to extract" });
    }
  }

  const attackPlan = chooseAiAttackPlan(ai, opponents);

  if (attackPlan?.attackNow) {
    state.selectTile(attackPlan.target.position);
    renderer.render();
    updateUi();
    await waitAiTiming("targetConfirm");
    return runAttackSequence();
  }

  if (state.canLoot() && shouldAiLootCurrentTile(ai, opponents)) {
    await waitAiTiming("targetConfirm");
    const item = state.lootCurrentTile();
    actionLog.textContent = `${ai.name} 차례입니다.. 진행중..`;
    renderer.render();
    updateUi();
    await waitAiTiming("afterHiddenAction");

    if (item) {
      maybeAutoAdvanceTurn("COM loot complete");
    }

    return Boolean(item);
  }

  if (attackPlan?.moveTile) {
    return performMoveToTile(attackPlan.moveTile, { reason: "COM advancing" });
  }

  const lootPlan = chooseAiLootPlan(ai, opponents);

  if (lootPlan?.moveTile) {
    return performMoveToTile(lootPlan.moveTile, { reason: "COM sweeping for loot" });
  }

  if (state.canLoot()) {
    await waitAiTiming("targetConfirm");
    const item = state.lootCurrentTile();

    if (item) {
      actionLog.textContent = `${ai.name} 차례입니다.. 진행중..`;
      renderer.render();
      updateUi();
      await waitAiTiming("afterHiddenAction");
      maybeAutoAdvanceTurn("COM loot complete");
      return true;
    }
  }

  const fallbackExtraction = chooseAiGoalPlan(state.getExtractionTilesForPlayer(ai));

  if (fallbackExtraction?.moveTile) {
    return performMoveToTile(fallbackExtraction.moveTile, { reason: "COM falling back" });
  }

  return false;
}

function getAiOpponents(ai) {
  return state.players.filter((player) => {
    return player.id !== ai?.id && state.isPlayerActive(player);
  });

  setTabUnread(tab, false);
}

function chooseAiAttackPlan(ai, opponents) {
  if (opponents.length === 0) {
    return null;
  }

  const targetPlans = opponents
    .map((target) => scoreAiAttackTarget(ai, target))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
  const bestTarget = targetPlans[0];

  if (!bestTarget || bestTarget.score < getAiAttackThreshold(ai)) {
    return null;
  }

  const attackableTarget = state.getAttackableTargets().find((target) => target.id === bestTarget.target.id);

  if (attackableTarget) {
    return { attackNow: true, target: bestTarget.target };
  }

  if (!shouldAiChaseAttack(ai, bestTarget)) {
    return null;
  }

  const targetTile = state.gameMap.tilesByKey.get(`${bestTarget.target.position.q},${bestTarget.target.position.r}`);
  const path = targetTile ? state.findPathToTile(ai.position, targetTile, { ignorePlayerId: ai.id }) : null;
  const moveTile = path ? getReachableTileAlongPath(path) : null;

  return moveTile ? { moveTile, target: bestTarget.target } : null;
}

function getAiProfile(player) {
  return AI_PROFILE_SETTINGS[player?.aiProfile] ?? AI_PROFILE_SETTINGS.balanced;
}

function getAiProfileId(index) {
  const profiles = ["aggressive", "looter", "survivor", "balanced", "hunter"];
  return profiles[Math.max(0, index - 1) % profiles.length];
}

function getAiProfileLabel(player) {
  return getAiProfile(player).label;
}

function shouldAiChaseAttack(ai, plan) {
  const extractionDistance = getNearestPathDistance(ai.position, state.getExtractionTilesForPlayer(ai), ai.id);
  const aiHealth = getBodyHealthScore(ai);
  const profile = getAiProfile(ai);
  const targetValue = plan.target?.bagValue ?? 0;
  const ownValue = ai.bagValue ?? 0;
  const targetNearExit = plan.targetExtractionDistance <= 4;
  const highValueIntercept = targetValue >= 16 && (targetNearExit || targetValue > ownValue + 8);

  if (plan.canShootNow) {
    return true;
  }

  if (aiHealth <= 7) {
    return false;
  }

  if (state.raid >= 3 && state.phase >= 11 && ownValue > 0 && extractionDistance <= 9) {
    return false;
  }

  if (ownValue >= 12 && extractionDistance <= 6 + profile.extractDistanceOffset && !highValueIntercept) {
    return false;
  }

  if (state.raid >= 2 && ownValue >= 10 && extractionDistance <= 6 + profile.extractDistanceOffset && !highValueIntercept) {
    return false;
  }

  if (plan.chaseDistance > Math.max(2, state.getEffectiveWeapon(ai).range - 1 + profile.chaseTolerance) && !highValueIntercept) {
    return false;
  }

  return plan.score >= getAiAttackThreshold(ai) + 1.5;
}

function scoreAiAttackTarget(ai, target) {
  if (!target?.position) {
    return null;
  }

  const distanceToTarget = hexDistanceLocal(ai.position, target.position);
  const weapon = state.getEffectiveWeapon(ai);
  const targetTile = state.gameMap.tilesByKey.get(`${target.position.q},${target.position.r}`);
  const pathToTarget = targetTile ? state.findPathToTile(ai.position, targetTile, { ignorePlayerId: ai.id }) : null;
  const chaseDistance = pathToTarget ? Math.max(0, pathToTarget.length - 1) : 99;
  const aiExtractionDistance = getNearestPathDistance(ai.position, state.getExtractionTilesForPlayer(ai), ai.id);
  const targetExtractionDistance = getNearestPathDistance(target.position, state.getExtractionTilesForPlayer(target), target.id);
  const aiHealth = getBodyHealthScore(ai);
  const targetHealth = getBodyHealthScore(target);
  const targetWeak = targetHealth <= 6;
  const lootSwing = Math.max(0, (target.bagValue ?? 0) - Math.max(0, (ai.bagValue ?? 0) * 0.35));
  const targetAboutToLeave = (target.bagValue ?? 0) >= 10 && targetExtractionDistance <= 4;
  const latePressure = state.phase >= 12 ? 4 : state.phase >= 9 ? 2 : 0;
  const proximityPressure = Math.max(0, (weapon.range + 1) - distanceToTarget);
  const canShootNow = distanceToTarget <= weapon.range && state.hasLineOfSight(ai.position, target.position);
  const shotWindowBonus = canShootNow ? 3 : 0;
  const interceptionBonus = targetAboutToLeave ? 5 : 0;
  const selfRiskPenalty = (aiHealth <= 6 ? 6 : 0)
    + ((ai.bagValue ?? 0) >= 14 && aiExtractionDistance <= 5 ? 4 : 0)
    + Math.max(0, chaseDistance - Math.max(1, weapon.range)) * 0.9;
  const profile = getAiProfile(ai);
  const score = lootSwing * 0.62
    + (targetWeak ? 5 : 0)
    + latePressure
    + proximityPressure
    + shotWindowBonus
    + interceptionBonus
    - selfRiskPenalty
    + profile.attackScoreBonus;

  return { target, score, canShootNow, chaseDistance, targetExtractionDistance };
}

function getAiAttackThreshold(ai) {
  const aiHealth = getBodyHealthScore(ai);
  const extractionDistance = getNearestPathDistance(ai.position, state.getExtractionTilesForPlayer(ai), ai.id);
  const profile = getAiProfile(ai);
  let threshold = 6.5;

  if (state.raid >= 3 && state.phase >= 11 && (ai.bagValue ?? 0) > 0 && extractionDistance <= 9) {
    return 12 + profile.attackThresholdOffset;
  }

  if (aiHealth <= 6) {
    threshold = 8;
    return threshold + profile.attackThresholdOffset;
  }

  if ((ai.bagValue ?? 0) >= 18 && extractionDistance <= 5) {
    threshold = 9;
    return threshold + profile.attackThresholdOffset;
  }

  if (state.raid >= 2 && (ai.bagValue ?? 0) >= 12 && extractionDistance <= 6) {
    threshold = 9;
    return threshold + profile.attackThresholdOffset;
  }

  if (state.phase >= 12) {
    threshold = 5;
    return threshold + profile.attackThresholdOffset;
  }

  if (state.raid >= 2) {
    threshold = 7;
    return threshold + profile.attackThresholdOffset;
  }

  return threshold + profile.attackThresholdOffset;
}

function chooseAiLootPlan(ai, opponents) {
  const lootTiles = state.gameMap.lootTiles.filter((tile) => !tile.looted);
  const extractionTiles = state.getExtractionTilesForPlayer(ai);
  const profile = getAiProfile(ai);
  let bestPlan = null;

  lootTiles.forEach((tile) => {
    const path = state.findPathToTile(ai.position, tile, { ignorePlayerId: ai.id });

    if (!path) {
      return;
    }

    const pathDistance = Math.max(0, path.length - 1);
    const extractionDistance = getNearestPathDistance(tile, extractionTiles, ai.id);
    const nearestOpponentDistance = getNearestOpponentDistance(tile, opponents);
    const risk = Number.isFinite(nearestOpponentDistance)
      ? Math.max(0, 7 - nearestOpponentDistance) * 1.35 * profile.lootRiskMultiplier
      : 0;
    const baseValue = tile.lootType === "rare" ? 16 : 8;
    const score = baseValue + profile.lootScoreBonus - pathDistance * 1.6 - extractionDistance * 0.45 - risk;
    const moveTile = getReachableTileAlongPath(path);

    if (!moveTile) {
      return;
    }

    if (!bestPlan || score > bestPlan.score) {
      bestPlan = { tile, moveTile, score };
    }
  });

  return bestPlan;
}

function chooseAiGoalPlan(goalTiles) {
  const ai = state.player;
  let bestPlan = null;

  goalTiles.forEach((tile) => {
    const path = state.findPathToTile(ai.position, tile, { ignorePlayerId: ai.id });

    if (!path) {
      return;
    }

    const distance = Math.max(0, path.length - 1);
    const moveTile = getReachableTileAlongPath(path);

    if (!moveTile) {
      return;
    }

    if (!bestPlan || distance < bestPlan.distance) {
      bestPlan = { tile, moveTile, distance };
    }
  });

  return bestPlan;
}

function shouldAiExtract(ai, opponents) {
  const extractionDistance = getNearestPathDistance(ai.position, state.getExtractionTilesForPlayer(ai), ai.id);
  const profile = getAiProfile(ai);
  const leadingOpponentScore = opponents.reduce((best, opponent) => {
    return Math.max(best, state.getPlayerScore(opponent));
  }, 0);
  const aiScore = state.getPlayerScore(ai);
  const aiHealth = getBodyHealthScore(ai);
  const nearestOpponentDistance = getNearestOpponentDistance(ai.position, opponents);
  const safeToExtract = !Number.isFinite(nearestOpponentDistance) || nearestOpponentDistance >= 4;
  const pressuredButLoaded = ai.bagValue >= 12 + profile.extractValueOffset && extractionDistance <= 6 + profile.extractDistanceOffset && state.raid >= 2;
  const woundedWithLoot = aiHealth <= 8 && ai.bagValue >= 8 + profile.extractValueOffset && extractionDistance <= 7 + profile.extractDistanceOffset;

  if (state.raid >= 3) {
    if (state.phase >= 14 && Number.isFinite(extractionDistance)) {
      return true;
    }

    if (state.phase >= 11 && ai.bagValue > 0 && extractionDistance <= 9 + profile.extractDistanceOffset) {
      return true;
    }

    if (state.phase >= 9 && ai.bagValue >= 8 + profile.extractValueOffset && extractionDistance <= 8 + profile.extractDistanceOffset) {
      return true;
    }
  }

  if ((pressuredButLoaded || woundedWithLoot) && (!Number.isFinite(nearestOpponentDistance) || nearestOpponentDistance >= 2)) {
    return true;
  }

  if (ai.bagValue >= 18 + profile.extractValueOffset && safeToExtract) {
    return true;
  }

  if (ai.bagValue >= 12 + profile.extractValueOffset && extractionDistance <= 4 + profile.extractDistanceOffset && safeToExtract) {
    return true;
  }

  if (state.phase >= 12 && ai.bagValue > 0) {
    return true;
  }

  if (aiHealth <= 5 && ai.bagValue >= 6) {
    return true;
  }

  if (opponents.length === 0 && ai.bagValue > 0) {
    return true;
  }

  return state.phase >= 9 && aiScore >= leadingOpponentScore && ai.bagValue >= 10 && safeToExtract;
}

function shouldAiLootCurrentTile(ai, opponents) {
  const tile = state.currentTile;
  const profile = getAiProfile(ai);

  if (!tile || tile.looted || tile.lootType === "none") {
    return false;
  }

  if (tile.lootType === "rare") {
    return true;
  }

  if (profile === AI_PROFILE_SETTINGS.looter && ai.bag.length < ai.bagSlots) {
    return true;
  }

  if (opponents.length === 0) {
    return true;
  }

  const pressure = getNearestOpponentDistance(ai.position, opponents);
  const requiredDistance = profile === AI_PROFILE_SETTINGS.survivor ? 4 : 3;
  const valueLimit = profile === AI_PROFILE_SETTINGS.aggressive ? 5 : 8;
  return pressure >= requiredDistance || ai.bagValue < valueLimit;
}

function getNearestOpponentDistance(origin, opponents) {
  return opponents.reduce((best, opponent) => {
    if (!opponent.position) {
      return best;
    }

    return Math.min(best, hexDistanceLocal(origin, opponent.position));
  }, Number.POSITIVE_INFINITY);
}

function getReachableTileAlongPath(path) {
  const entryMap = new Map(state.getMovementEntries().map((entry) => [`${entry.tile.q},${entry.tile.r}`, entry.tile]));

  for (let index = path.length - 1; index >= 1; index -= 1) {
    const step = path[index];
    const tile = entryMap.get(`${step.q},${step.r}`);

    if (tile) {
      return tile;
    }
  }

  return null;
}

function getNearestPathDistance(origin, targets, ignorePlayerId) {
  let bestDistance = Number.POSITIVE_INFINITY;

  targets.forEach((tile) => {
    const path = state.findPathToTile(origin, tile, { ignorePlayerId });

    if (!path) {
      return;
    }

    bestDistance = Math.min(bestDistance, Math.max(0, path.length - 1));
  });

  return Number.isFinite(bestDistance) ? bestDistance : 99;
}

function getBodyHealthScore(player) {
  return Object.values(player.bodyHp ?? {}).reduce((sum, value) => sum + value, 0);
}

async function playRaidOrderReveal() {
  if (!raidOrderOverlay || !raidOrderStage || state.raidEnded || cardRevealRunning) {
    return;
  }

  cardRevealRunning = true;
  updateUi();
  raidOrderStage.innerHTML = "";
  raidOrderOverlay.hidden = false;

  for (const entry of state.turnOrder) {
    const player = state.players[entry.playerIndex];
    const card = createRaidOrderCard(player, entry.card);
    raidOrderStage.append(card);
    playCardSfx("draw");
    await wait(70);
    card.classList.add("is-dealt");
    await wait(520);
    playCardSfx("flip");
    card.classList.add("is-revealed");
    await wait(480);
  }

  await wait(900);
  raidOrderOverlay.hidden = true;
  raidOrderStage.innerHTML = "";
  cardRevealRunning = false;
  renderer.render();
  updateUi();
}

function schedulePendingEventReveal() {
  if (!state || eventRevealRunning || cardRevealRunning || !raidOrderOverlay || !raidOrderStage) {
    return;
  }

  const draws = state.consumeEventDraws?.() ?? [];

  if (draws.length === 0) {
    return;
  }

  if (isLocalHost()) {
    state.lastEventDraws = draws;
    broadcastGameSnapshot("eventReveal");
    state.lastEventDraws = [];
  }

  setTabUnread("event", activeDrawerTab !== "event");
  void playEventReveal(draws);
}

async function playEventReveal(draws) {
  if (!draws?.length || eventRevealRunning || !raidOrderOverlay || !raidOrderStage) {
    return;
  }

  eventRevealRunning = true;
  cardRevealRunning = true;
  clearPendingTileAction();
  updateUi();

  raidOrderStage.innerHTML = "";
  raidOrderStage.classList.add("is-event-stage");
  raidOrderOverlay.hidden = false;

  const cards = draws.map((draw) => createEventRevealCard(draw));
  cards.forEach((card) => raidOrderStage.append(card));

  for (const card of cards) {
    playCardSfx("draw");
    await wait(80);
    card.classList.add("is-dealt");
  }

  await wait(460);
  cards.forEach((card, index) => {
    window.setTimeout(() => {
      playCardSfx("flip");
      card.classList.add("is-revealed");
    }, index * 90);
  });

  await wait(360 + cards.length * 90);
  const countdown = document.createElement("p");
  countdown.className = "event-reveal-countdown";
  raidOrderStage.append(countdown);
  await waitWithCountdown(5, (remaining) => {
    countdown.textContent = `${remaining}초 동안 이벤트 카드 확인`;
  });
  cards.forEach((card) => card.classList.add("is-stored"));
  await wait(520);

  raidOrderOverlay.hidden = true;
  raidOrderStage.innerHTML = "";
  raidOrderStage.classList.remove("is-event-stage");

  await playPendingEventResults();
  await playPendingEventDiceRolls();

  cardRevealRunning = false;
  eventRevealRunning = false;
  renderer.render();
  updateUi();
  queueAiTurn();
}

function createEventRevealCard(draw) {
  const card = document.createElement("div");
  const mine = draw.playerId === getUiPlayer()?.id;
  card.className = `raid-order-card event-reveal-card${mine ? " is-mine" : ""}`;
  const image = EVENT_CARD_IMAGES[draw.card?.number];
  const fallbackNumber = String(draw.card?.number ?? "?").padStart(2, "0");

  card.innerHTML = `
    <div class="raid-order-card-inner">
      <div class="raid-order-face raid-order-face--back event-reveal-back"><span>EVENT</span></div>
      <div class="raid-order-face raid-order-face--front event-reveal-front${image ? " has-card-image" : ""}">
        ${image ? `<img src="${image}" alt="${draw.card?.name ?? "Event card"}">` : ""}
        <span>${fallbackNumber}</span>
        ${mine ? "<b>내 카드</b>" : ""}
      </div>
    </div>
    <p class="raid-order-card-label">${draw.playerName}<br><span>${draw.card?.name ?? "Event"}</span></p>
  `;

  const imageElement = card.querySelector(".event-reveal-front img");
  imageElement?.addEventListener("load", () => {
    card.querySelector(".event-reveal-front")?.classList.add("has-card-image");
  });
  if (imageElement?.complete && imageElement.naturalWidth > 0) {
    card.querySelector(".event-reveal-front")?.classList.add("has-card-image");
  }
  imageElement?.addEventListener("error", () => {
    imageElement.remove();
    card.querySelector(".event-reveal-front")?.classList.remove("has-card-image");
  });

  return card;
}

async function playPendingEventResults() {
  const results = state.consumeEventResults?.() ?? [];

  if (results.length === 0) {
    return;
  }

  const viewer = getUiPlayer();

  for (const result of results) {
    if (result.type !== "loot" || !result.items?.length) {
      continue;
    }

    const itemNames = result.items.map((item) => `${item.name}(${item.value})`).join(", ");
    state.raidLog.unshift(`${result.playerName} 이벤트 획득: ${itemNames}`);

    if (result.playerId === viewer.id) {
      setTabUnread("bag", activeDrawerTab !== "bag");
      actionLog.textContent = `${result.card?.name ?? "이벤트"} 획득: ${itemNames}`;
      renderer.render();
      updateUi();
      await playLootRevealItems(result.items);
    }
  }
}

async function playPendingEventDiceRolls() {
  const rolls = state.consumePendingEventDiceRolls?.() ?? [];
  const viewer = getUiPlayer();

  for (const entry of rolls) {
    const result = state.resolveEventDiceRoll(entry);

    if (!result) {
      continue;
    }

    if (result.player.id !== viewer.id && !isSpectatorVisionActive()) {
      continue;
    }

    actionLog.textContent = `${result.playerName} 이벤트 주사위`;
    renderer.render();
    updateUi();
    await playAttackDiceOverlay(result.roll);

    if (result.damageEvents.length > 0) {
      renderer.playEventDamageAnimation(result.player.id, result.player.position, result.damageEvents);
      playSound(SOUND_URLS.hit, { volume: 0.72 });
      await wait(780);
    } else {
      await wait(420);
    }
  }
}

function createRaidOrderCard(player, cardNumber) {
  const card = document.createElement("div");
  card.className = "raid-order-card";
  const image = ORDER_CARD_IMAGES[cardNumber];

  card.innerHTML = `
    <div class="raid-order-card-inner">
      <div class="raid-order-face raid-order-face--back" style="background-image:url('${image}')"></div>
      <div class="raid-order-face raid-order-face--front" style="background-image:url('${image}')"></div>
    </div>
    <p class="raid-order-card-label">${player.name}</p>
  `;

  return card;
}

async function playAttackDiceOverlay(roll) {
  if (!attackOverlay || !attackDiceTray) {
    return;
  }

  try {
    attackDiceTray.innerHTML = "";
    attackOverlay.hidden = false;
    document.body.style.overflow = "hidden";

    const diceElements = roll.map((face, index) => createAttackDie(face, index));
    diceElements.forEach((element) => attackDiceTray.append(element));

    await wait(30);
    playDiceRollSfx(roll.length);
    diceElements.forEach((element) => element.classList.add("is-rolling"));

    const longestDuration = Math.max(...diceElements.map((element) => Number(element.dataset.duration)));
    await wait(longestDuration + 320);
  } finally {
    attackOverlay.hidden = true;
    attackDiceTray.innerHTML = "";
    document.body.style.overflow = "";
  }
}

function createAttackDie(face, index) {
  const die = document.createElement("div");
  die.className = "attack-die";
  const duration = 1180 + index * 140;
  const xTurns = 720 + index * 80;
  const yTurns = 620 + index * 110;
  const zTurns = 420 + index * 45;

  die.dataset.duration = String(duration);
  die.style.setProperty("--roll-duration", `${duration}ms`);
  die.style.setProperty("--roll-start", `rotateX(-26deg) rotateY(${index * 18 + 16}deg) rotateZ(${index * -8}deg)`);
  die.style.setProperty("--roll-mid", `rotateX(${xTurns}deg) rotateY(${yTurns}deg) rotateZ(${zTurns}deg)`);
  die.style.setProperty("--roll-end", `rotateX(0deg) rotateY(${index * 14}deg) rotateZ(0deg)`);

  const core = document.createElement("div");
  core.className = "attack-die-core";

  const faceDefinitions = [
    { className: "attack-die-face attack-die-face--front", label: buildAttackDieLabel(face) },
    { className: "attack-die-face attack-die-face--back", label: "<div class=\"attack-die-result\"><small>ROLL</small><span>...</span></div>" },
    { className: "attack-die-face attack-die-face--right", label: "<div class=\"attack-die-result\"><small>ROLL</small><span>...</span></div>" },
    { className: "attack-die-face attack-die-face--left", label: "<div class=\"attack-die-result\"><small>ROLL</small><span>...</span></div>" },
    { className: "attack-die-face attack-die-face--top", label: buildAttackDieLabel(face) },
    { className: "attack-die-face attack-die-face--bottom", label: "<div class=\"attack-die-result\"><small>ROLL</small><span>...</span></div>" }
  ];

  faceDefinitions.forEach((definition) => {
    const faceElement = document.createElement("div");
    faceElement.className = definition.className;
    faceElement.innerHTML = definition.label;
    core.append(faceElement);
  });

  die.append(core);
  return die;
}

function buildAttackDieLabel(face) {
  const primary = dieFaceLabel(face);
  const secondary = face?.bodyPart ? "HIT" : "MISS";

  return `<div class="attack-die-result"><small>${secondary}</small><span>${primary}</span></div>`;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitWithCountdown(seconds, onTick) {
  for (let remaining = seconds; remaining > 0; remaining -= 1) {
    onTick?.(remaining);
    if (remaining <= 5) {
      playCountdownTick();
    }
    await wait(1000);
  }
}

function waitAiTiming(key) {
  return wait(randomAiTiming(key));
}

function randomAiTiming(key) {
  const range = AI_TURN_TIMING[key] ?? [250, 650];
  const [min, max] = Array.isArray(range) ? range : [range, range];
  return Math.floor(min + Math.random() * Math.max(0, max - min));
}

function bindAudioUnlock() {
  if (audioUnlockBound) {
    return;
  }

  const unlock = () => {
    audioUnlocked = true;
    flushQueuedSounds();
    window.removeEventListener("pointerdown", unlock, true);
    window.removeEventListener("keydown", unlock, true);
  };

  window.addEventListener("pointerdown", unlock, true);
  window.addEventListener("keydown", unlock, true);
  audioUnlockBound = true;
}

function flushQueuedSounds() {
  while (queuedSounds.length > 0) {
    const sound = queuedSounds.shift();
    playSound(sound.url, { volume: sound.volume, delay: sound.delay }, { allowQueue: false });
  }
}

function playSound(url, { volume = 0.8, delay = 0 } = {}, { allowQueue = true } = {}) {
  window.setTimeout(() => {
    const soundKey = SOUND_URL_TO_KEY[url] ?? null;
    const masterGain = (SOUND_SETTINGS.master ?? 100) / 100;
    const soundGain = soundKey ? (SOUND_SETTINGS[soundKey] ?? 100) / 100 : 1;
    const finalVolume = Math.max(0, Math.min(1, volume * masterGain * soundGain));

    if (finalVolume <= 0) {
      return;
    }

    const audio = new Audio(url);
    audio.preload = "auto";
    audio.volume = finalVolume;
    audio.play().catch(() => {
      if (allowQueue && !audioUnlocked) {
        queuedSounds.push({ url, volume, delay: 0 });
      }
    });
  }, delay);
}

function playCardSfx(kind) {
  if (kind === "draw") {
    playSound(SOUND_URLS.cardDraw, { volume: 0.74 });
    return;
  }

  if (kind === "flip") {
    playSound(SOUND_URLS.cardFlick, { volume: 0.82 });
  }
}

function playCountdownTick() {
  playSound(SOUND_URLS.ticktock, { volume: 0.78 });
}

function playDrawerOpenSfx(tab) {
  if (tab === "bag") {
    playSound(SOUND_URLS.backpackOpen, { volume: 0.82 });
    return;
  }

  playSound(SOUND_URLS.pageUp, { volume: 0.7 });
}

function playDrawerCloseSfx(tab) {
  if (tab === "bag") {
    playSound(SOUND_URLS.backpackClose, { volume: 0.82 });
    return;
  }

  playSound(SOUND_URLS.drawerClose, { volume: 0.66 });
}

function playDiceRollSfx(diceCount) {
  if (diceCount <= 0) {
    return;
  }

  if (diceCount === 1) {
    playSound(SOUND_URLS.diceRoll1, { volume: 0.72 });
    return;
  }

  if (diceCount <= 3) {
    playSound(SOUND_URLS.diceRoll1, { volume: 0.76 });
    playSound(SOUND_URLS.diceRoll2, { volume: 0.76, delay: 90 });
    return;
  }

  for (let index = 0; index < diceCount; index += 1) {
    playSound(index % 2 === 0 ? SOUND_URLS.diceRoll1 : SOUND_URLS.diceRoll2, {
      volume: 0.72,
      delay: index * 70
    });
  }
}

function handleMovementStepSfx() {
  playSound(SOUND_URLS.pieceTap, { volume: 0.62 });
}

function playAttackCombatSfx(result) {
  if (!result?.weapon) {
    return;
  }

  const shotCount = Math.max(1, result.roll?.length ?? 1);
  const hitCount = Math.max(0, result.damageEvents?.length ?? 0);
  const shotSpacing = result.weapon.name === "DMR" ? 120 : 95;
  let finalShotDelay = 0;

  if (result.weapon.name === "AR" || result.weapon.name === "DMR") {
    for (let index = 0; index < shotCount; index += 1) {
      const delay = index * shotSpacing;
      finalShotDelay = delay;
      playSound(SOUND_URLS[result.weapon.name], { volume: 0.82, delay });
    }
  } else if (result.weapon.name === "SMG" || result.weapon.name === "SR") {
    playSound(SOUND_URLS[result.weapon.name], { volume: result.weapon.name === "SMG" ? 0.84 : 0.88 });
  }

  const hitBaseDelay = finalShotDelay + 120;

  for (let index = 0; index < hitCount; index += 1) {
    playSound(SOUND_URLS.hit, { volume: 0.72, delay: hitBaseDelay + index * 115 });
  }
}

async function playLootReveal(item) {
  if (!item || !lootOverlay || !lootRevealCard || !lootRevealName || !lootRevealValue || !lootRevealTier) {
    return;
  }

  lootRevealName.textContent = item.name;
  lootRevealValue.textContent = `Value ${item.value}`;
  lootRevealTier.textContent = itemRarityLabel(item.rarity);
  lootRevealCard.dataset.rarity = item.rarity ?? "common";
  lootRevealCard.classList.toggle("is-rare", ["gold", "legend"].includes(item.rarity) || item.value >= 40);
  if (lootRevealImage) {
    lootRevealImage.hidden = !item.image;
    lootRevealImage.src = item.image ?? "";
    lootRevealImage.alt = item.name;
  }
  lootRevealCard.classList.remove("is-visible");
  lootOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  playLootItemSfx(item);
  await wait(120);
  lootRevealCard.classList.add("is-visible");
  await wait(920);
  lootRevealCard.classList.remove("is-visible");
  await wait(260);
  lootOverlay.hidden = true;
  document.body.style.overflow = "";
}

function playLootItemSfx(item) {
  const rareSound = ["gold", "legend"].includes(item.rarity);
  playSound(rareSound ? SOUND_URLS.goldLoot : SOUND_URLS.commonLoot, { volume: 0.84 });
}

function itemRarityLabel(rarity) {
  const labels = {
    common: "일반",
    uncommon: "희귀",
    epic: "에픽",
    gold: "고급",
    legend: "레전드"
  };

  return labels[rarity] ?? "일반";
}

async function playLootRevealItems(items) {
  for (const item of items.filter(Boolean)) {
    await playLootReveal(item);
  }
}

function stopRaidAutoAdvance() {
  if (raidAutoAdvanceTimer) {
    window.clearInterval(raidAutoAdvanceTimer);
    raidAutoAdvanceTimer = 0;
  }

  raidAutoAdvanceRunning = false;
  raidAutoAdvanceRemaining = 0;
  raidAutoAdvanceSourceRaid = 0;

  if (raidSummaryOverlay) {
    raidSummaryOverlay.hidden = true;
  }
}

function syncBoardOverlays() {
  if (opponentTurnOverlay) {
    const showProgress = gameStarted &&
      !state.raidEnded &&
      !canLocalControlActivePlayer() &&
      !cardRevealRunning &&
      !eventRevealRunning &&
      !attackSequenceRunning &&
      !movementSequenceRunning;
    opponentTurnOverlay.hidden = !showProgress;
    const label = opponentTurnOverlay.querySelector("p");
    if (label && showProgress) {
      label.dataset.baseText = `${state.player.name} 진행 중`;
      label.textContent = `${label.dataset.baseText}${getWaitingDots()}`;
      startOpponentMessageAnimation();
    } else {
      stopOpponentMessageAnimation();
    }
  }

  if (state.raidEnded && state.raid < 3) {
    if (!raidAutoAdvanceRunning) {
      startRaidAutoAdvance();
    } else {
      renderRaidSummaryOverlay();
    }
  } else if (state.raidEnded && state.raid >= 3) {
    renderGameSummaryOverlay();
  } else if (!raidAutoAdvanceRunning) {
    if (raidSummaryOverlay) {
      raidSummaryOverlay.hidden = true;
    }
  }
}

function startOpponentMessageAnimation() {
  if (opponentMessageTimer || !opponentTurnOverlay) {
    return;
  }

  opponentMessageTimer = window.setInterval(() => {
    const label = opponentTurnOverlay.querySelector("p");
    if (!label || opponentTurnOverlay.hidden) {
      stopOpponentMessageAnimation();
      return;
    }
    label.textContent = `${label.dataset.baseText ?? "진행 중"}${getWaitingDots()}`;
  }, 450);
}

function stopOpponentMessageAnimation() {
  if (!opponentMessageTimer) {
    return;
  }

  window.clearInterval(opponentMessageTimer);
  opponentMessageTimer = 0;
}

function getWaitingDots() {
  return "·".repeat((Math.floor(Date.now() / 450) % 3) + 1);
}

function startRaidAutoAdvance() {
  if (!state.raidEnded || state.raid >= 3 || raidAutoAdvanceRunning) {
    return;
  }

  raidAutoAdvanceRunning = true;
  raidAutoAdvanceRemaining = 10;
  raidAutoAdvanceSourceRaid = state.raid;
  renderRaidSummaryOverlay();

  raidAutoAdvanceTimer = window.setInterval(async () => {
    raidAutoAdvanceRemaining -= 1;

    if (raidAutoAdvanceRemaining > 0 && raidAutoAdvanceRemaining <= 5) {
      playCountdownTick();
    }

    if (raidAutoAdvanceRemaining > 0) {
      renderRaidSummaryOverlay();
      return;
    }

    const sourceRaid = raidAutoAdvanceSourceRaid;
    stopRaidAutoAdvance();

    if (!state.raidEnded || state.raid !== sourceRaid) {
      return;
    }

    if (!state.startNextRaid()) {
      updateUi();
      renderer.render();
      return;
    }

    actionLog.textContent = `Raid ${state.raid} started`;
    renderer.render();
    updateUi();
    broadcastGameSnapshot("orderReveal");
    await playRaidOrderReveal();
    queueAiTurn();
  }, 1000);
}

function renderRaidSummaryOverlay() {
  if (!raidSummaryOverlay || !raidSummaryCountdown || !raidSummaryStats) {
    return;
  }

  raidSummaryOverlay.hidden = false;
  if (gameSummaryActions) {
    gameSummaryActions.hidden = true;
  }
  if (raidSummaryTitle) {
    raidSummaryTitle.textContent = "Raid Summary";
  }
  raidSummaryCountdown.textContent = `${raidAutoAdvanceRemaining} seconds until the next raid.`;
  raidSummaryStats.innerHTML = detailRows([
    ["Raid", `${state.raid} / 3`],
    ["Result", resultLabel(state.raidResult)],
    ...state.players.flatMap((player) => ([
      [`${player.name} raid value`, player.extractedThisRaid ? String(player.bagValue ?? 0) : "Lost"],
      [`${player.name} total`, String(state.getPlayerScore(player))]
    ]))
  ]);
}

function renderGameSummaryOverlay() {
  if (!raidSummaryOverlay || !raidSummaryCountdown || !raidSummaryStats) {
    return;
  }

  const summary = state.getGameSummary();
  const winnerText = summary.winners.length > 1
    ? `공동 승리: ${summary.winners.map((winner) => winner.name).join(", ")}`
    : `승리자: ${summary.winners[0]?.name ?? "-"}`;

  raidSummaryOverlay.hidden = false;
  if (gameSummaryActions) {
    gameSummaryActions.hidden = false;
  }
  if (restartGameButton) {
    restartGameButton.hidden = true;
  }
  if (returnLobbyButton) {
    returnLobbyButton.textContent = "메인으로";
  }
  if (raidSummaryTitle) {
    raidSummaryTitle.textContent = "Game Summary";
  }
  raidSummaryCountdown.textContent = `${winnerText} | 최종 가치 ${summary.winners[0]?.score ?? 0}`;
  raidSummaryStats.innerHTML = detailRows([
    ["Raids", "3 / 3"],
    ["Winner", winnerText],
    ...summary.standings.flatMap((entry, index) => ([
      [`#${index + 1} ${entry.name}`, String(entry.score)],
      [`${entry.name} final raid`, entry.extractedThisRaid ? "Extracted" : entry.dead ? "Dead / Lost" : "Failed / Lost"]
    ]))
  ]);
}

async function restartGameFromSummary() {
  stopRaidAutoAdvance();
  closeCorpseLoot("closed");
  if (gameSummaryActions) {
    gameSummaryActions.hidden = true;
  }
  if (raidSummaryOverlay) {
    raidSummaryOverlay.hidden = true;
  }
  gameStarted = false;
  gameStarting = false;
  if (lobbySession.currentRoom) {
    setCurrentRoomStatus("waiting");
  }
  if (currentMapData) {
    state = createRaidState(currentMapData);
    clearPendingTileAction();
    renderer.replaceState(state);
    lastActivePlayerIndexForUi = null;
    renderer.render();
    updateUi();
  }
  await handleStartGame();
}

function returnToLobbyFromGame() {
  stopRaidAutoAdvance();
  closeCorpseLoot("closed");
  gameStarted = false;
  gameStarting = false;
  if (lobbySession.currentRoom) {
    setCurrentRoomStatus("waiting");
  }
  if (raidSummaryOverlay) {
    raidSummaryOverlay.hidden = true;
  }
  if (gameSummaryActions) {
    gameSummaryActions.hidden = true;
  }
  if (startOverlay) {
    startOverlay.hidden = false;
  }
  renderLobby();
  showLobbyStep(lobbySession.currentRoom ? "room" : "lobby");
  setStartStatus("대기방으로 돌아왔습니다. 설정을 바꾼 뒤 다시 시작할 수 있습니다.");
}

function updateUi({ skipSnapshotBroadcast = false } = {}) {
  const map = state.gameMap;
  const player = getUiPlayer();

  const controlsLocked = !canLocalControlActivePlayer() || attackSequenceRunning || cardRevealRunning || eventRevealRunning || movementSequenceRunning || aiTurnRunning || state.player?.isAi;
  maybePlayPlayerTurnReturnSfx();

  raidStatus.textContent = `${map.mapId} | tiles ${map.tiles.length} | spawns ${map.spawnPoints.length} | exits ${countVisibleExtractionTiles()}`;
  raidNumber.textContent = `${state.raid} / 3`;
  phaseNumber.textContent = `${state.phase} / ${state.maxPhase}`;
  renderProgressHud();
  syncTurnTimer();
  activePlayer.textContent = state.player?.isAi ? `${state.player.name} 진행 중` : state.player.name;
  turnOrder.textContent = state.turnOrder
    .map((entry) => `${state.players[entry.playerIndex].name}:${entry.card}`)
    .join(" / ");
  turnBonus.textContent = state.phase === 1
    ? `${player.firstTurnBonus?.label ?? "none"} | phase active`
    : "Phase 1 bonus expired";
  staminaValue.textContent = `${player.stamina} / ${player.staminaMax}`;
  actionState.textContent = actionStateLabel();
  raidResult.textContent = resultLabel(state.raidResult);
  playerPosition.textContent = player.position
    ? `q ${player.position.q}, r ${player.position.r} | spawn ${player.spawnSlot ?? "-"} | exit ${player.assignedExtractionSlots?.join(", ") ?? "-"}`
    : "-";
  bagValue.textContent = String(player.bagValue);
  stashValue.textContent = state.players
    .map((scorePlayer) => `${scorePlayer.name} ${state.getPlayerScore(scorePlayer)}`)
    .join(" / ");
  lootAction.disabled = !state.canLoot() || controlsLocked;
  attackAction.disabled = !state.canAttackSelectedTile() || controlsLocked;
  endTurn.disabled = state.raidEnded || controlsLocked || hasBlockingPlayerDiscard();
  nextRaid.disabled = !state.raidEnded || state.raid >= 3 || controlsLocked;
  weaponSelect.disabled = controlsLocked || gameStarted;
  armorSelect.disabled = controlsLocked || gameStarted;
  moveMode.disabled = controlsLocked;
  ensureSelectOption(weaponSelect, player.weaponId, weaponDisplayName(player.weaponId));
  weaponSelect.value = player.weaponId;
  armorSelect.value = player.armorId;
  enforcePendingDiscardUi();
  renderLoadoutHeader();
  renderWeaponCard();
  renderBodyHp();
  renderBag();
  syncInactiveBagUnread();
  renderDiceResults();
  renderTargetHp();
  renderArmor();
  renderEvent();
  renderOrderCard();
  renderRaidLog();
  renderKillLog();
  renderTileDetails();
  setDrawerTab(activeDrawerTab);
  syncBoardOverlays();
  refreshTabUnreadClasses();
  if (!skipSnapshotBroadcast) {
    broadcastGameSnapshot("ui");
  }
  schedulePendingEventReveal();
}

function maybePlayPlayerTurnReturnSfx() {
  if (lastActivePlayerIndexForUi !== null && lastActivePlayerIndexForUi !== state.activePlayerIndex && canLocalControlActivePlayer() && !state.raidEnded) {
    playSound(SOUND_URLS.switchOff, { volume: 0.82 });
  }

  lastActivePlayerIndexForUi = state.activePlayerIndex;
}

function renderProgressHud() {
  if (raidProgressLabel) {
    raidProgressLabel.textContent = `레이드 ${state.raid}`;
    if (lastHudRaid !== null && lastHudRaid !== state.raid) {
      pulseHudLabel(raidProgressLabel);
    }
    lastHudRaid = state.raid;
  }

  if (phaseProgressLabel) {
    phaseProgressLabel.textContent = `페이즈 ${state.phase}`;
    if (lastHudPhase !== null && lastHudPhase !== state.phase) {
      pulseHudLabel(phaseProgressLabel);
    }
    lastHudPhase = state.phase;
  }

  if (raidProgressSegments) {
    raidProgressSegments.innerHTML = Array.from({ length: 3 }, (_, index) => (
      `<span class="${index < state.raid ? "is-filled" : ""}"></span>`
    )).join("");
  }

  if (phaseProgressSegments) {
    phaseProgressSegments.innerHTML = Array.from({ length: state.maxPhase }, (_, index) => (
      `<span class="${index < state.phase ? "is-filled" : ""}"></span>`
    )).join("");
  }
}

function pulseHudLabel(label) {
  label.classList.remove("is-pulsing");
  void label.offsetWidth;
  label.classList.add("is-pulsing");
  playSound(SOUND_URLS.gameStart, { volume: 0.58 });
}

function syncTurnTimer() {
  if (!turnTimerValue || !turnTimerLabel) {
    return;
  }

  if (
    turnTimerPlayerIndex !== state.activePlayerIndex ||
    turnTimerPhase !== state.phase ||
    turnTimerStartedAt === 0
  ) {
    resetTurnTimer();
  }

  renderTurnTimer();

  if (!turnTimerInterval) {
    turnTimerInterval = window.setInterval(handleTurnTimerTick, 250);
  }
}

function resetTurnTimer() {
  turnTimerStartedAt = Date.now();
  turnTimerPlayerIndex = state.activePlayerIndex;
  turnTimerPhase = state.phase;
}

function handleTurnTimerTick() {
  if (!state || state.raidEnded) {
    renderTurnTimer();
    return;
  }

  renderTurnTimer();

  if (
    isLocalHost() &&
    !state.player?.isAi &&
    !hasBlockingPlayerDiscard() &&
    getTurnTimerRemaining() <= 0
  ) {
    if (corpseLootSession) {
      closeCorpseLoot("timeout");
    }
    const result = state.endTurn();
    clearPendingTileAction();
    actionLog.textContent = result === "inProgress" ? "시간 초과 | turn end" : resultLabel(result);
    renderer.render();
    updateUi();
    queueAiTurn();
  }
}

function getTurnTimerRemaining() {
  return Math.max(0, 45 - Math.floor((Date.now() - turnTimerStartedAt) / 1000));
}

function renderTurnTimer() {
  const remaining = state?.raidEnded ? 0 : getTurnTimerRemaining();
  turnTimerValue.textContent = `:${String(remaining).padStart(2, "0")}`;
  turnTimerLabel.textContent = canLocalControlActivePlayer()
    ? "내 턴"
    : `${state?.player?.name ?? "상대"} 진행 중`;
}

function countVisibleExtractionTiles() {
  return state.gameMap.extractionPoints.filter((tile) => state.canPlayerExtractFromTile(getUiPlayer(), tile)).length;
}

function getUiPlayer() {
  return state.players.find((player) => player.controllerId === lobbySession.localPlayerId) ?? state.players[0] ?? state.player;
}

function hasBlockingPlayerDiscard() {
  return (getUiPlayer()?.pendingDiscardCount ?? 0) > 0;
}

function enforcePendingDiscardUi() {
  if (!hasBlockingPlayerDiscard() || cardRevealRunning || eventRevealRunning) {
    return;
  }

  activeDrawerTab = "bag";
  loadoutPanel.classList.remove("is-minimized");
  setDrawerTab("bag");
  actionLog.textContent = `가방에서 버릴 아이템 ${getUiPlayer().pendingDiscardCount}개를 선택하세요.`;
}

function renderEvent() {
  const eventCard = getUiPlayer().currentEvent;
  renderEventHoldList();

  if (!eventCard) {
    currentEvent.textContent = "None";
    eventEffect.textContent = "-";
    if (eventDrawerTitle) eventDrawerTitle.textContent = "None";
    if (eventDrawerEffect) eventDrawerEffect.textContent = "-";
    if (eventPhaseBadge) eventPhaseBadge.textContent = "-";
    if (eventCardPreview) {
      eventCardPreview.classList.add("event-card-preview--back");
      eventCardPreview.style.backgroundImage = "";
      eventCardPreview.innerHTML = "<span>EVENT</span>";
    }
    return;
  }

  currentEvent.textContent = eventCard.name;
  eventEffect.textContent = eventEffectLabel(eventCard);
  if (eventCardPreview) {
    const image = EVENT_CARD_IMAGES[eventCard.number];
    eventCardPreview.classList.remove("event-card-preview--back");
    eventCardPreview.classList.toggle("has-card-image", Boolean(image));
    eventCardPreview.style.backgroundImage = "";
    const fallbackNumber = String(eventCard.number ?? "?").padStart(2, "0");
    eventCardPreview.innerHTML = image
      ? `<img src="${image}" alt="${eventCard.name}"><span>${fallbackNumber}</span>`
      : `<span>${fallbackNumber}</span>`;
    const imageElement = eventCardPreview.querySelector("img");
    imageElement?.addEventListener("load", () => eventCardPreview.classList.add("has-card-image"));
    if (imageElement?.complete && imageElement.naturalWidth > 0) {
      eventCardPreview.classList.add("has-card-image");
    }
    imageElement?.addEventListener("error", () => {
      imageElement.remove();
      eventCardPreview.classList.remove("has-card-image");
      eventCardPreview.classList.add("event-card-preview--back");
    });
  }
  if (eventDrawerTitle) {
    eventDrawerTitle.textContent = eventCard.name;
  }
  if (eventDrawerEffect) {
    eventDrawerEffect.textContent = eventEffectLabel(eventCard);
  }
  if (eventPhaseBadge) {
    eventPhaseBadge.textContent = `phase ${state.phase}`;
  }
}

function eventEffectLabel(card) {
  const effect = card?.effect;

  if (!effect) {
    return "-";
  }

  switch (effect.type) {
    case "damageIfOnLootTile":
      return `loot tile: abdomen -${effect.arms ?? 0}, legs -${effect.legs ?? 0}`;
    case "damageBodyParts":
      return `abdomen -${effect.abdomen ?? 0}, legs -${effect.legs ?? 0}`;
    case "gainTaxiTicket":
      return "gain a taxi ticket";
    case "cannotBeAttackTarget":
      return "cannot be targeted by player attacks this phase";
    case "drawLoot":
      return `draw ${effect.count ?? 1} ${lootTypeLabel(effect.lootType)} loot`;
    case "limitStaminaThisPhase":
      return `stamina capped at ${effect.value} this phase`;
    case "modifyAttackDamage":
      return `attack damage modifier ${effect.value}`;
    case "rollBodyPartDamage":
      return `random body part -${effect.damage}`;
    case "moveWhenUpperBodyDamaged":
      return `reaction move up to ${effect.maxDistance} after upper body damage`;
    case "hpMoveWhenExhausted":
      return `when stamina is 0, move with HP cost up to ${effect.maxDistance}`;
    case "discardBagItem":
      return `discard ${effect.count ?? 1} bag item(s)`;
    case "gainSelfRevive":
      return "gain self revive kit";
    case "healAllBodyParts":
      return "heal all body parts";
    case "dashUpgradeUntilNextEvent":
      return `dash becomes ${effect.staminaCost} stamina / ${effect.range} tiles until next event`;
    case "rangeBonusUntilRaidEnd":
      return `AR/DMR/SR range +${effect.rangeBonus} until raid end`;
    case "diceBonusUntilRaidEnd":
      return `AR/SMG attack dice +${effect.diceBonus} until raid end`;
    case "doubleLootThisPhase":
      return `loot ${effect.count ?? 2} items this phase`;
    default:
      return effect.type;
  }
}

function renderEventHoldList() {
  if (!eventHoldList) {
    return;
  }

  const heldCards = getUiPlayer().heldEventCards ?? [];

  if (heldCards.length === 0) {
    eventHoldList.className = "event-hold-stack is-empty";
    eventHoldList.innerHTML = "<li><span>No held cards</span></li>";
    return;
  }

  eventHoldList.className = "event-hold-stack";
  eventHoldList.innerHTML = heldCards
    .map((entry, index) => {
      const image = EVENT_CARD_IMAGES[entry.card.number];
      const durationLabel = entry.duration === "phase" ? "페이즈" : entry.duration === "raid" ? "레이드" : "보유";
      return `
        <li class="event-hold-card" style="--i:${index}">
          <span class="event-hold-duration">${durationLabel}</span>
          ${image ? `<img src="${image}" alt="${entry.card.name}">` : `<strong>${String(entry.card.number).padStart(2, "0")}</strong>`}
          <em>${entry.card.name}</em>
        </li>
      `;
    })
    .join("");
}

function lootTypeLabel(lootType) {
  return lootType === "rare" ? "rare" : "normal";
}

function actionStateLabel() {
  if (cardRevealRunning) {
    return eventRevealRunning ? "Revealing event cards" : "Dealing order cards";
  }

  if (movementSequenceRunning) {
    return "Moving";
  }

  if (aiTurnRunning) {
    return "COM thinking";
  }

  if (attackSequenceRunning) {
    return "Rolling attack dice";
  }

  if (state.raidEnded) {
    return resultLabel(state.raidResult);
  }

  if (state.actionLocked) {
    return "Action spent";
  }

  if (state.postAttackMoveAvailable) {
    return "Bonus move";
  }

  return state.getSelectedMoveAction().label;
}

function renderOrderCard() {
  if (!orderCardDisplay || !orderCardBadge || !orderCardSummary) {
    return;
  }

  const player = getUiPlayer();
  const cardNumber = player.orderCard ?? null;
  const image = cardNumber ? ORDER_CARD_IMAGES[cardNumber] : null;
  orderCardDisplay.style.backgroundImage = image ? `url('${image}')` : "none";
  orderCardDisplay.style.backgroundSize = image ? "100% 200%" : "";
  orderCardDisplay.style.backgroundPosition = image ? "center top" : "";
  orderCardBadge.textContent = cardNumber ? `#${cardNumber}` : "#-";
  orderCardSummary.textContent = state.phase === 1
    ? `${player.firstTurnBonus?.label ?? "none"} | phase active`
    : `${player.firstTurnBonus?.label ?? "none"} | expired`;

  if (!state.currentEvent) {
    if (eventDrawerTitle) eventDrawerTitle.textContent = "None";
    if (eventDrawerEffect) eventDrawerEffect.textContent = "-";
    if (eventPhaseBadge) eventPhaseBadge.textContent = "-";
  }
}

function renderDiceResults() {
  const faces = state.lastAttackRoll;

  if (faces.length === 0 || state.lastAttackSummary?.attackerId !== getUiPlayer().id) {
    diceResults.innerHTML = "<li><span>No roll yet</span></li>";
    return;
  }

  diceResults.innerHTML = faces
    .map((face) => {
      const index = dice.weaponHitDie.faces.findIndex((dieFace) => dieFace.id === face.id);
      const y = index * 20;
      return `
        <li>
          <span class="die-face" style="background-image: url('${dice.weaponHitDie.image}'); background-position-y: ${y}%;"></span>
          <span>${dieFaceLabel(face)}</span>
        </li>
      `;
    })
    .join("");
}

function renderTargetHp() {
  const enemy = state.selectedTile ? state.getTargetAt(state.selectedTile) : null;

  if (!enemy || state.player?.id !== getUiPlayer()?.id || !state.isTileVisibleToPlayer(enemy.position, getUiPlayer())) {
    targetHp.innerHTML = "<li><span>No target selected</span></li>";
    return;
  }

  targetHp.innerHTML = Object.entries(enemy.bodyHp)
    .map(([part, value]) => `<li><span>${bodyPartLabel(part)}</span><span>${value}</span></li>`)
    .join("");
}

function populateWeapons() {
  Object.entries(weapons).forEach(([id, weapon]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = `${weaponDisplayName(id)} / R${weapon.range} / ${weapon.attackDice}D`;
    weaponSelect.append(option);
  });
}

function populateArmor() {
  Object.entries(armor).forEach(([id, armorItem]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = `${armorDisplayName(id)} / durability ${armorItem.durability}`;
    armorSelect.append(option);
  });
}

function renderArmor() {
  const player = getUiPlayer();
  const playerArmorState = player.armor;
  const enemy = state.player?.id === player.id && state.selectedTile ? state.getTargetAt(state.selectedTile) : null;
  const enemyArmorState = enemy?.armor;
  const armorData = armor[player.armorId];
  const limit = armorData?.maxMoveActionsPerTurn;

  playerArmor.textContent = armorLabel(playerArmorState);
  targetArmor.textContent = armorLabel(enemyArmorState);
  moveLimit.textContent = limit ? `${player.movementSpentThisPhase} / ${limit}` : state.getSelectedMoveAction().label;
}

function armorLabel(armorState) {
  if (!armorState) {
    return "None";
  }

  return `${armorDisplayName(armorState.id)} ${armorState.durability}/${armorState.maxDurability}`;
}

function renderLoadoutHeader() {
  const player = getUiPlayer();
  if (activeDrawerTab === "equipment") {
    loadoutTitle.textContent = `${player.name} Equipment`;
    loadoutSubtitle.textContent = "Weapon / Armor / Order Card";
  } else if (activeDrawerTab === "bag") {
    loadoutTitle.textContent = `${player.name} Bag`;
    loadoutSubtitle.textContent = `Stamina ${player.stamina}/${player.staminaMax} | Bag ${player.bag.length}/${player.bagSlots}`;
  }
}

function renderWeaponCard() {
  const player = getUiPlayer();
  const weapon = state.getEffectiveWeapon(player);
  const image = WEAPON_CARD_IMAGES[player.weaponId] ?? null;

  weaponCardTitle.textContent = weaponDisplayName(player.weaponId);
  weaponDiceBadge.textContent = `D${weapon.attackDice}`;
  weaponCardStats.innerHTML = detailRows([
    ["range", `up to ${weapon.range}`],
    ["head", weapon.damage.head],
    ["chest", weapon.damage.chest],
    ["abdomen", weapon.damage.abdomen],
    ["legs", weapon.damage.legs]
  ]);
  weaponPassive.textContent = passiveLabel(weapon.passive);
  weaponCard.style.backgroundImage = image ? `url('${image}')` : "";
  weaponCard.setAttribute(
    "aria-label",
    `${weaponDisplayName(player.weaponId)} | range ${weapon.range} | dice ${weapon.attackDice} | ${passiveLabel(weapon.passive)}`
  );
}

function renderBag() {
  const player = getUiPlayer();
  const previousCount = lastBagCountsByPlayer.get(player.id) ?? player.bag.length;
  if (player.bag.length > previousCount && activeDrawerTab !== "bag") {
    setTabUnread("bag", true);
  }
  lastBagCountsByPlayer.set(player.id, player.bag.length);

  bagSlotsLabel.textContent = `${player.bag.length} / ${player.bagSlots}`;
  const slots = Array.from({ length: player.bagSlots }, (_, index) => player.bag[index] ?? null);
  const mustDiscard = player.pendingDiscardCount > 0;

  bagList.innerHTML = slots
    .map((item, index) => {
      if (!item) {
        return "<li><span>Empty</span><span>-</span></li>";
      }

      return `
        <li>
          ${item.image ? `<img class="bag-item-image" src="${item.image}" alt="${item.name}">` : ""}
          <span class="bag-item-name">${item.name}</span>
          <span class="bag-item-value">${item.value}</span>
          ${mustDiscard ? `<button class="bag-discard-button" type="button" data-discard-index="${index}">버리기</button>` : ""}
        </li>
      `;
    })
    .join("");

  if (mustDiscard) {
    setTabUnread("bag", activeDrawerTab !== "bag");
  }
}

function syncInactiveBagUnread() {
  state.players.forEach((player) => {
    lastBagCountsByPlayer.set(player.id, player.bag.length);
  });
}

function ensureSelectOption(select, value, label) {
  if (!value || select.querySelector(`option[value="${value}"]`)) {
    return;
  }

  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  select.append(option);
}

function renderBodyHp() {
  const maxHp = playerTemplate.bodyHp;
  const player = getUiPlayer();

  bodyHp.innerHTML = Object.entries(player.bodyHp)
    .map(([part, value]) => {
      const percent = Math.max(0, Math.min(100, (value / maxHp[part]) * 100));
      return `
        <div class="hp-row">
          <span>${bodyPartLabel(part)}</span>
          <div class="hp-bar"><div class="hp-fill" style="width: ${percent}%"></div></div>
          <span>${value}</span>
        </div>
      `;
    })
    .join("");
}

function renderRaidLog() {
  const entries = state.raidLog.filter((entry) => isPlayerVisibleLogEntry(entry));

  if (entries.length === 0) {
    raidLog.innerHTML = "<li><span>No log entries yet</span></li>";
    return;
  }

  raidLog.innerHTML = entries
    .slice(0, 8)
    .map((entry) => `<li><span>${entry}</span></li>`)
    .join("");
}

function isPlayerVisibleLogEntry(entry) {
  return !/^COM \d+/.test(entry)
    && !/^Event: COM \d+/.test(entry)
    && !entry.includes("COM ");
}

function renderKillLog() {
  if (!killLog) {
    return;
  }

  const entries = state.killLog ?? [];

  if (entries.length === 0) {
    killLog.innerHTML = "<li><span>아직 교전 기록 없음</span></li>";
    return;
  }

  killLog.innerHTML = entries
    .slice(0, 5)
    .map((entry) => {
      const source = entry.killerName ?? "환경";
      return `<li><strong>${source}</strong><span>→</span><strong>${entry.victimName}</strong><small>R${entry.raid} P${entry.phase}</small></li>`;
    })
    .join("");
}

function renderTileDetails() {
  const tile = state.selectedTile;

  if (!tile) {
    tileDetails.innerHTML = detailRows([["status", "no tile selected"]]);
    return;
  }

  if (!state.isTileVisibleToPlayer(tile, getUiPlayer())) {
    tileDetails.innerHTML = detailRows([
      ["coords", `q ${tile.q}, r ${tile.r}`],
      ["status", "outside vision"]
    ]);
    return;
  }

  const viewer = getUiPlayer();
  const extractionVisible = state.canPlayerExtractFromTile(viewer, tile);
  const corpseBag = state.getCorpseBagAtTile(tile);

  tileDetails.innerHTML = detailRows([
    ["coords", `q ${tile.q}, r ${tile.r}`],
    ["terrain", terrainLabel(tile.terrain)],
    ["walkable", tile.walkable ? "yes" : "no"],
    ["cover", coverLabel(tile.cover)],
    ["blocks sight", tile.blocksSight ? "yes" : "no"],
    ["loot", lootLabel(tile.lootType, tile.looted)],
    ["corpse bag", corpseBag ? `${corpseBag.ownerName} / ${corpseBag.items.length}` : "-"],
    ["extraction", extractionVisible ? "visible" : "hidden"],
    ["exit slot", extractionVisible ? (tile.extractionSlots?.length ? tile.extractionSlots.join(", ") : "shared") : "-"],
    ["spawn", tile.spawnSlot ? "yes" : "no"],
    ["spawn slot", tile.spawnSlot ?? "-"],
    ...combatRows(tile)
  ]);
}

function combatRows(tile) {
  const player = getUiPlayer();
  if (!player.position) {
    return [];
  }

  const enemy = state.getTargetAt(tile);
  const distance = hexDistanceLocal(player.position, tile);
  const inRange = distance <= state.getEffectiveWeapon(player).range;
  const lineOfSight = state.hasLineOfSight(player.position, tile);
  const attackable = enemy && state.player?.id === player.id ? state.canAttackTarget(enemy) : false;
  const extractionAllowed = state.canPlayerExtractFromTile(player, tile);

  return [
    ["distance", `${distance}`],
    ["in range", inRange ? "yes" : "no"],
    ["line of sight", lineOfSight ? "clear" : "blocked"],
    ["target", enemy ? enemy.name : "none"],
    ["can attack", attackable ? "yes" : "no"],
    ["can extract", extractionAllowed ? "yes" : "no"]
  ];
}

function detailRows(rows) {
  return rows
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("");
}

function bodyPartLabel(part) {
  const labels = {
    head: "Head",
    chest: "Chest",
    abdomen: "Abdomen",
    legs: "Legs"
  };

  return labels[part] ?? part;
}

function dieFaceLabel(face) {
  if (!face?.bodyPart) {
    return "Miss";
  }

  return bodyPartLabel(face.bodyPart);
}

function weaponDisplayName(weaponId) {
  const labels = {
    AR: "AR Assault Rifle",
    SMG: "SMG",
    SR: "SR Sniper Rifle",
    DMR: "DMR Marksman Rifle"
  };

  return labels[weaponId] ?? weaponId;
}

function armorDisplayName(armorId) {
  const labels = {
    lightSet: "Light Set",
    heavySet: "Heavy Set"
  };

  return labels[armorId] ?? armorId;
}

function passiveLabel(passive) {
  const labels = {
    moveOneAfterAttackIfStaminaRemains: "Move 1 after attack if stamina remains",
    doubleHeadChestAbdomenAtRangeOneToTwo: "Double head, chest, abdomen damage at range 1-2",
    legsBecomeHeadAtRangeOneToFive: "Leg results become head hits at range 1-5",
    bonusTwoChestResults: "Gain +2 damage when chest appears at least twice"
  };

  return labels[passive] ?? "-";
}

function resultLabel(result) {
  const labels = {
    inProgress: "In Progress",
    escaped: "Escaped",
    failed: "Failed"
  };

  return labels[result] ?? result;
}

function terrainLabel(terrain) {
  const labels = {
    road: "Road",
    wall: "Wall",
    grass: "Grass",
    bush: "Grass",
    tree: "Tree",
    water: "Water",
    wrecked_car: "Wrecked Car",
    building: "Building Marble",
    building_marble: "Building Marble",
    building_wood: "Building Wood",
    iron_gate: "Iron Gate",
    loot_zone_normal: "Normal Loot",
    loot_zone_rare: "Rare Loot",
    extraction_zone: "Extraction"
  };

  return labels[terrain] ?? terrain;
}

function coverLabel(cover) {
  const labels = {
    none: "None",
    light: "Light Cover",
    hard: "Hard Cover"
  };

  return labels[cover] ?? cover;
}

function lootLabel(lootType, looted = false) {
  if (looted) {
    return "Looted";
  }

  const labels = {
    none: "None",
    normal: "Normal",
    rare: "Rare"
  };

  return labels[lootType] ?? lootType;
}

function hexDistanceLocal(a, b) {
  return (
    Math.abs(a.q - b.q) +
    Math.abs(a.q + a.r - b.q - b.r) +
    Math.abs(a.r - b.r)
  ) / 2;
}

function seedPlayableTestMap(mapData) {
  mapData.mapId = "playtest_seed_map";

  mapData.tiles.forEach((tile) => {
    if (tile.q === -8 && tile.r === -5) {
      tile.spawnPoint = true;
      tile.spawnSlot = "A1";
    }
    if (tile.q === -8 && tile.r === 5) {
      tile.spawnPoint = true;
      tile.spawnSlot = "B1";
    }
    if (tile.q === 8 && tile.r === 5) {
      tile.extractionPoint = true;
      tile.extractionSlots = ["A1"];
    }
    if (tile.q === 8 && tile.r === -5) {
      tile.extractionPoint = true;
      tile.extractionSlots = ["B1"];
    }
    if ((tile.q === 0 && tile.r >= -3 && tile.r <= 3) || (tile.r === 0 && tile.q >= -4 && tile.q <= 4)) {
      tile.terrain = "wall";
      tile.blocksSight = true;
      tile.walkable = false;
      tile.cover = "hard";
    }
    if (tile.q > 3 && tile.r < -2) tile.terrain = "grass";
    if (tile.q === -2 && tile.r === 2) tile.lootType = "normal";
    if (tile.q === 3 && tile.r === -1) tile.lootType = "rare";
    if (tile.q === 1 && tile.r === 1) tile.walkable = false;
  });
}

initStartOverlay();
