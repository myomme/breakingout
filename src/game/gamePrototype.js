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
const bodyHpHud = document.querySelector("#bodyHpHud");
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
const accountIdInput = document.querySelector("#accountIdInput");
const accountPasswordInput = document.querySelector("#accountPasswordInput");
const nicknameInput = document.querySelector("#nicknameInput");
const enterLobbyButton = document.querySelector("#enterLobbyButton");
const registerAccountButton = document.querySelector("#registerAccountButton");
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
let lobbyChatMessages = document.querySelector("#lobbyChatMessages");
let lobbyChatForm = document.querySelector("#lobbyChatForm");
let lobbyChatInput = document.querySelector("#lobbyChatInput");
let gameChatPanel = document.querySelector("#gameChatPanel");
let gameChatToggle = document.querySelector("#gameChatToggle");
let gameChatBadge = document.querySelector("#gameChatBadge");
let gameChatMessages = document.querySelector("#gameChatMessages");
let gameChatForm = document.querySelector("#gameChatForm");
let gameChatInput = document.querySelector("#gameChatInput");
let mobileViewResetButton = null;
let chatDisabled = false;

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
let cosmeticShopList = null;
let cosmeticShopOverlay = null;
let cosmeticShopClose = null;
let beginnerHelpPanel = null;
let beginnerHelpTitle = null;
let beginnerHelpBody = null;
let beginnerHelpProgress = null;
let beginnerHelpPrev = null;
let beginnerHelpNext = null;
let beginnerHelpClose = null;
let beginnerHelpToggle = null;
let beginnerHelpSwitch = null;
let beginnerHelpSpotlight = null;
let beginnerContextHint = null;
let raidOrderOverlay = null;
let raidOrderStage = null;
let audioUnlocked = false;
let audioUnlockBound = false;
const queuedSounds = [];
let gameStarted = false;
let gameStarting = false;
let gameBootstrapped = false;
let lobbySession = createEmptyLobbySession();
let corpseLootSession = null;
let corpseLootTimerInterval = 0;
let currentMapData = null;
let lastActivePlayerIndexForUi = null;
const unreadTabs = new Set();
const lastBagCountsByPlayer = new Map();
const lastHudStaminaByPlayer = new Map();
const roomMapCache = new Map();
let roomStoreCache = [];
const ROOM_STORAGE_KEY = "breakingOutPrototypeRooms";
const LOCAL_PLAYER_STORAGE_KEY = "breakingOutPrototypePlayer";
const SESSION_PLAYER_ID_KEY = "breakingOutPrototypeSessionPlayerId";
const ACCOUNT_SESSION_STORAGE_KEY = "breakingOutPrototypeAccountSession";
const SESSION_ROOM_ID_KEY = "breakingOutPrototypeSessionRoomId";
const ACCOUNT_STORAGE_PREFIX = "breakingOutPrototypeAccount:";
const ROOM_SYNC_CHANNEL = "breakingOutPrototypeRoomSync";
const GAME_STATE_STORAGE_PREFIX = "breakingOutPrototypeGameState:";
const PLAYER_COMMAND_STORAGE_PREFIX = "breakingOutPrototypePlayerCommand:";
const BEGINNER_HELP_STORAGE_KEY = "breakingOutPrototypeBeginnerHelp";
const DEFAULT_MAP_PATH = "./data/maps/map_Farm.json";
const DEFAULT_MAP_NAME = "Farm Raid Map";
const PRESENCE_HEARTBEAT_MS = 4000;
const RECONNECT_GRACE_MS = 90000;
let roomSyncChannel = null;
let gameServerSocket = null;
let gameServerConnected = false;
let pendingServerSnapshotRoomId = null;
let queuedRemoteGameSnapshot = null;
const pendingRoomActions = new Map();
let serverReconnectTimer = 0;
let applyingRemoteSnapshot = false;
let lastSnapshotVersion = 0;
let remoteOrderRevealPlayedVersion = 0;
let activeOrderRevealVersion = 0;
const playedAttackRevealVersions = new Set();
const playedEventRevealVersions = new Set();
const processedRemoteCommandIds = new Set();
let presenceHeartbeatTimer = 0;
const chatMessages = [];
const seenChatMessageIds = new Set();
let unreadGameChatCount = 0;
const clearedChatRoomIds = new Set();
const appliedAccountResultKeys = new Set();
const COSMETIC_CATALOG = [
  {
    id: "nameplate_ranger",
    category: "nameplate",
    categoryLabel: "이름표",
    label: "레인저 플레이트",
    rarity: "Field",
    preview: "RANGER",
    description: "프로필에 녹색 작전 라인을 두르고, 로비에서 생존자 느낌을 확실히 보여줍니다.",
    price: 80
  },
  {
    id: "nameplate_blacksite",
    category: "nameplate",
    categoryLabel: "이름표",
    label: "블랙사이트 플레이트",
    rarity: "Elite",
    preview: "BLACK",
    description: "어두운 보라빛 글로우가 들어간 고급 이름표입니다. 방 목록에서 제일 차갑게 보입니다.",
    price: 160
  },
  {
    id: "chat_radio",
    category: "chatBubble",
    categoryLabel: "채팅",
    label: "무전 말풍선",
    rarity: "Field",
    preview: "RADIO",
    description: "채팅에 녹색 무전 테두리를 적용합니다. 팀 보이스 없는 전장 느낌을 줍니다.",
    price: 60
  },
  {
    id: "chat_amber",
    category: "chatBubble",
    categoryLabel: "채팅",
    label: "앰버 말풍선",
    rarity: "Rare",
    preview: "AMBER",
    description: "주황색 경고등 같은 말풍선입니다. 메시지가 로그 사이에서도 눈에 잘 들어옵니다.",
    price: 140
  },
  {
    id: "token_white_ring",
    category: "tokenSkin",
    categoryLabel: "말",
    label: "화이트 링",
    rarity: "Field",
    preview: "○",
    description: "내 말 주변을 하얀 링으로 강조합니다. 전술 지도 위에서 위치 식별이 훨씬 쉬워집니다.",
    price: 90
  },
  {
    id: "token_ember",
    category: "tokenSkin",
    categoryLabel: "말",
    label: "엠버 토큰",
    rarity: "Elite",
    preview: "●",
    description: "붉은 엠버 색 말 스킨입니다. 상대 화면에서도 같은 색상으로 표시됩니다.",
    price: 180
  },
  {
    id: "title_rookie",
    category: "title",
    categoryLabel: "칭호",
    label: "신입 오퍼레이터",
    rarity: "Common",
    preview: "ROOKIE",
    description: "이제 막 레이드에 들어온 신입 칭호입니다. 싸지만 첫 장식으로 딱 좋습니다.",
    price: 50
  },
  {
    id: "title_contractor",
    category: "title",
    categoryLabel: "칭호",
    label: "컨트랙터",
    rarity: "Rare",
    preview: "CONTRACT",
    description: "돈 받고 들어온 전문 계약자 칭호입니다. 전적 카드에 조금 더 무게감을 줍니다.",
    price: 130
  }
];
let beginnerHelpEnabled = true;
let beginnerHelpOpen = false;
let beginnerHelpStepIndex = 0;
let beginnerHelpShownThisGame = false;
const BEGINNER_HELP_STEPS = [
  {
    selector: ".raid-progress-hud",
    title: "레이드와 페이즈",
    body: "총 3번의 레이드를 진행합니다. 각 레이드는 15페이즈이며, 제한 안에 탈출해야 이번 레이드의 아이템 가치가 보존됩니다."
  },
  {
    selector: "#turnTimerValue",
    title: "턴 제한 시간",
    body: "내 차례에는 최대 45초가 주어집니다. 시간이 끝나면 자동으로 턴이 넘어가니 이동, 루팅, 공격 중 우선순위를 빠르게 정하세요."
  },
  {
    selector: ".game-canvas",
    title: "맵 조작",
    body: "PC는 휠로 확대/축소하고 드래그로 화면을 이동합니다. 모바일은 손가락 드래그와 핀치 확대를 사용합니다."
  },
  {
    selector: "#tileActionPopup",
    title: "타일 위 액션",
    body: "이동 가능한 칸을 누르면 필요한 비용이 뜹니다. 같은 칸을 한 번 더 누르면 이동이 확정되고, 루팅/공격도 대상 바로 위 버튼으로 실행합니다."
  },
  {
    selector: "#bodyHpHud",
    title: "부위별 HP",
    body: "머리나 상체가 0이 되면 사망합니다. 복부나 하체가 0인 상태에서 추가 피해를 받으면 상체 피해로 전환됩니다."
  },
  {
    selector: ".board-tabs",
    title: "장비, 가방, 이벤트",
    body: "오른쪽 탭에서 현재 장비, 가방 아이템, 이벤트 카드를 확인합니다. 빨간 점은 새로 확인할 내용이 있다는 표시입니다."
  },
  {
    selector: ".kill-log-overlay",
    title: "로그와 시야 정보",
    body: "킬로그와 행동 로그는 중요한 전투 결과와 내 플레이에 관련된 정보를 알려줍니다. 시야 밖 정보는 일부러 숨겨질 수 있습니다."
  }
];
const loadoutDragState = {
  dragging: false,
  pointerId: null,
  offsetX: 0,
  offsetY: 0
};
const chatDragState = {
  dragging: false,
  pointerId: null,
  panel: null,
  offsetX: 0,
  offsetY: 0
};
const playedVoiceCueKeys = new Set();
let voiceStateInitialized = false;
let lastVoiceRaid = null;
let lastVoicePhase = null;
let lastVoiceRaidEnded = null;

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
  voRaidStart: new URL("../../assets/sfx/vo_raid_start.mp3", import.meta.url).href,
  voRaidMid: new URL("../../assets/sfx/vo_raid_mid.mp3", import.meta.url).href,
  voRaidEnd: new URL("../../assets/sfx/vo_raid_end.mp3", import.meta.url).href,
  voGameEnd: new URL("../../assets/sfx/vo_game_end.mp3", import.meta.url).href,
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
  goldLoot: 100,
  voRaidStart: 100,
  voRaidMid: 100,
  voRaidEnd: 100,
  voGameEnd: 100
};

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
    accountId: null,
    username: "",
    sessionToken: "",
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
  restoreBeginnerHelpPreference();
  normalizeLobbyCopy();
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
  ensureLobbyShopUi();
  bindLobbyEvents();
  startGameButton.addEventListener("click", handleStartGame);
  bootstrap().catch((error) => {
    if (startOverlayStatus) {
      startOverlayStatus.textContent = error.message;
    }
  });
  renderLobby();
}

function normalizeLobbyCopy() {
  const textBySelector = new Map([
    [".start-overlay-panel h1", "레이드 로비"],
    ["#enterLobbyButton", "로그인"],
    ["#registerAccountButton", "계정 생성"],
    ["#createRoomButton", "방 만들기"],
    ["#joinRoomButton", "방 번호 입장"],
    [".room-list-header h2", "방 목록"],
    ["#refreshRoomsButton", "새로고침"],
    ["#leaveRoomButton", "나가기"],
    ["#addMockPlayerButton", "테스트 플레이어 추가"],
    ["#clearMockPlayersButton", "테스트 인원 비우기"],
    ["#startGameButton", "게임 시작"],
    ["#startOverlayStatus", "계정으로 로그인하거나 새 계정을 생성하세요."]
  ]);

  textBySelector.forEach((text, selector) => {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = text;
    }
  });

  const accountIdLabel = document.querySelector("label[for='accountIdInput'] span") ?? accountIdInput?.closest(".start-option-field")?.querySelector("span");
  if (accountIdLabel) accountIdLabel.textContent = "계정 ID";
  if (accountIdInput) accountIdInput.placeholder = "영문/숫자 3~20자";

  const passwordLabel = document.querySelector("label[for='accountPasswordInput'] span") ?? accountPasswordInput?.closest(".start-option-field")?.querySelector("span");
  if (passwordLabel) passwordLabel.textContent = "비밀번호";
  if (accountPasswordInput) accountPasswordInput.placeholder = "비밀번호";

  const nicknameLabel = nicknameInput?.closest(".start-option-field")?.querySelector("span");
  if (nicknameLabel) nicknameLabel.textContent = "닉네임";
  if (nicknameInput) nicknameInput.placeholder = "닉네임 입력";

  const roomCodeLabel = document.querySelector(".lobby-room-code-field span");
  if (roomCodeLabel) roomCodeLabel.textContent = "방 번호";
  if (roomCodeInput) roomCodeInput.placeholder = "방 번호";

  const lobbyPlayerLabel = document.querySelector(".lobby-player-strip span");
  if (lobbyPlayerLabel) lobbyPlayerLabel.textContent = "접속자";

  const mapPackageLabel = document.querySelector(".room-map-header span");
  if (mapPackageLabel) mapPackageLabel.textContent = "맵 패키지";

  const mapUploadLabel = document.querySelector(".room-map-upload");
  if (mapUploadLabel) {
    const input = mapUploadLabel.querySelector("input");
    mapUploadLabel.textContent = "방장 맵 설정";
    if (input) mapUploadLabel.append(input);
  }

  if (roomMapMeta) {
    roomMapMeta.textContent = "게임 시작 전에 모든 플레이어가 같은 맵 데이터를 자동으로 적용합니다.";
  }

  const permissionNote = document.querySelector(".lobby-permission-note");
  if (permissionNote) {
    permissionNote.textContent = "내 장비만 변경할 수 있고, COM 설정과 게임 시작은 방장 권한입니다.";
  }
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
      resetGlobalVoiceTracking();
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
    startGlobalVoiceTracking({ playRaidStart: true });

    if (remoteStart) {
      actionLog.textContent = "방장 상태 동기화를 기다리는 중입니다.";
      renderer.render();
      updateUi({ skipSnapshotBroadcast: true });
      maybeShowBeginnerHelpOnGameStart();
      gameStarting = false;
      return;
    }

    markCurrentRoomInProgress();
    broadcastGameSnapshot("orderReveal");
    await wait(160);
    await playRaidOrderReveal();
    broadcastGameSnapshot("gameStart");
    maybeShowBeginnerHelpOnGameStart();
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

  const [terrainTypes, loadedPlayerTemplate, loadedLootTables, loadedWeapons, loadedDice, loadedArmor, loadedEvents, defaultMapData] = await Promise.all([
    loadJson("./data/rules/terrainTypes.json"),
    loadJson("./data/rules/playerTemplate.json"),
    loadJson("./data/rules/lootTables.json"),
    loadJson("./data/rules/weapons.json"),
    loadJson("./data/rules/dice.json"),
    loadJson("./data/rules/armor.json"),
    loadJson("./data/rules/events.json"),
    loadJson(DEFAULT_MAP_PATH)
  ]);

  playerTemplate = loadedPlayerTemplate;
  lootTables = loadedLootTables;
  weapons = loadedWeapons;
  dice = loadedDice;
  armor = loadedArmor;
  events = loadedEvents;

  const mapData = defaultMapData;
  validateMapPackageData(mapData);
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
  ensureBeginnerHelpUi();
  ensureMobileViewResetUi();
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
        armorId: slot.armorId ?? "lightSet",
        cosmetics: slot.playerId === lobbySession.localPlayerId ? readAccountRecord().cosmetics : slot.cosmetics ?? null
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
      armorId: player.armorId ?? slots[index].armorId,
      cosmetics: player.cosmetics ?? (player.id === lobbySession.localPlayerId ? readAccountRecord().cosmetics : null)
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
      cosmetics: slot.cosmetics ?? null,
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
  ensureSessionChatUi();
  enterLobbyButton?.addEventListener("click", () => authenticateAccount("login"));
  registerAccountButton?.addEventListener("click", () => authenticateAccount("register"));
  [accountIdInput, accountPasswordInput, nicknameInput].forEach((input) => input?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      authenticateAccount("login");
    }
  }));
  createRoomButton?.addEventListener("click", () => {
    void createRoom();
  });
  joinRoomButton?.addEventListener("click", () => joinRoomByCode(roomCodeInput?.value));
  roomCodeInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      joinRoomByCode(roomCodeInput.value);
    }
  });
  refreshRoomsButton?.addEventListener("click", refreshRoomListFromServer);
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
  bindLoadoutDrag();
  bindSessionChatEvents();
}

function restoreLobbySession() {
  lobbySession.localPlayerId = getSessionPlayerId();
  try {
    localStorage.removeItem(LOCAL_PLAYER_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
  if (accountIdInput) {
    accountIdInput.value = "";
    accountIdInput.removeAttribute("value");
  }
  if (accountPasswordInput) {
    accountPasswordInput.value = "";
    accountPasswordInput.removeAttribute("value");
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

function readStoredAccountSession() {
  return readJsonStorage(ACCOUNT_SESSION_STORAGE_KEY, null);
}

function rememberAccountSession(account, sessionToken) {
  writeJsonStorage(ACCOUNT_SESSION_STORAGE_KEY, {
    accountId: account.accountId,
    username: account.username ?? "",
    nickname: account.nickname ?? "",
    sessionToken,
    savedAt: Date.now()
  });
}

function requestAccountResume() {
  const saved = readStoredAccountSession();
  if (!saved?.accountId || !saved?.sessionToken) {
    return false;
  }

  return sendServerMessage({
    type: "accountAuth",
    action: "resume",
    accountId: saved.accountId,
    sessionToken: saved.sessionToken,
    sourceId: lobbySession.localPlayerId,
    at: Date.now()
  });
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

function authenticateAccount(action = "login") {
  const username = normalizeAccountUsername(accountIdInput?.value);
  const password = String(accountPasswordInput?.value ?? "");
  const nickname = normalizeNickname(nicknameInput?.value);

  if (!username) {
    setStartStatus("계정 ID는 영문/숫자/밑줄 3~20자로 입력하세요.");
    accountIdInput?.focus();
    return;
  }

  if (password.length < 4) {
    setStartStatus("비밀번호는 최소 4자 이상 입력하세요.");
    accountPasswordInput?.focus();
    return;
  }

  if (action === "register" && !nickname) {
    setStartStatus("계정 생성 시 사용할 닉네임을 입력하세요.");
    nicknameInput?.focus();
    return;
  }

  if (!sendServerMessage({
    type: "accountAuth",
    action,
    username,
    password,
    nickname,
    sourceId: lobbySession.localPlayerId,
    at: Date.now()
  })) {
    setStartStatus("서버 연결 후 계정 로그인을 사용할 수 있습니다.");
    return;
  }

  setStartStatus(action === "register" ? "계정 생성을 요청했습니다." : "로그인 중입니다.");
}

function normalizeAccountUsername(value) {
  const username = String(value ?? "").trim().toLowerCase();
  return /^[a-z0-9_]{3,20}$/.test(username) ? username : "";
}

function completeAccountLogin({ account, sessionToken }) {
  if (!account?.accountId || !sessionToken) {
    setStartStatus("계정 로그인 응답이 올바르지 않습니다.");
    return;
  }

  const previousId = lobbySession.localPlayerId;
  lobbySession.localPlayerId = account.accountId;
  lobbySession.accountId = account.accountId;
  lobbySession.username = account.username ?? "";
  lobbySession.sessionToken = sessionToken;
  lobbySession.nickname = account.nickname || lobbySession.username || "Player";
  rememberAccountSession(account, sessionToken);
  try {
    sessionStorage.setItem(SESSION_PLAYER_ID_KEY, account.accountId);
  } catch {
    // Ignore session persistence failures.
  }
  if (previousId !== lobbySession.localPlayerId) {
    pendingRoomActions.clear();
  }
  if (nicknameInput) {
    nicknameInput.value = lobbySession.nickname;
  }
  if (accountPasswordInput) {
    accountPasswordInput.value = "";
  }
  writeAccountRecord(account);
  showLobbyStep("lobby");
  renderLobby();
  requestServerRooms();
  setStartStatus(`${lobbySession.nickname} 계정으로 접속했습니다.`);
}

async function createRoom() {
  if (!lobbySession.nickname) {
    showLobbyStep("login");
    setStartStatus("닉네임을 먼저 입력하세요.");
    return;
  }

  try {
    await ensureDefaultMapData();
  } catch (error) {
    setStartStatus(`기본 Farm 맵을 불러오지 못했습니다: ${error.message}`);
    return;
  }

  if (!currentMapData) {
    setStartStatus("맵 시스템을 불러오는 중입니다. 잠시 후 다시 시도하세요.");
    return;
  }

  if (sendRoomAction("createRoom", {
    player: createRoomPlayer(),
    maxPlayers: 6,
    mapPackage: createMapPackage(currentMapData, DEFAULT_MAP_NAME)
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
    mapPackage: createMapPackage(currentMapData, DEFAULT_MAP_NAME),
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

async function ensureDefaultMapData() {
  if (currentMapData?.mapId && currentMapData.mapId !== "playtest_seed_map") {
    return currentMapData;
  }

  const mapData = await loadJson(DEFAULT_MAP_PATH);
  validateMapPackageData(mapData);
  currentMapData = mapData;
  cacheRoomMapPackage(createMapPackage(currentMapData, DEFAULT_MAP_NAME));
  return currentMapData;
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
    clearLocalChatMessages();
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
  clearLocalChatMessages();
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
    cosmetics: readAccountRecord().cosmetics,
    joinedAt: Date.now()
  };
}

function renderLobby() {
  if (lobbyNickname) {
    lobbyNickname.textContent = lobbySession.nickname || "-";
  }
  renderAccountSummary();
  renderRoomList();
  renderRoomPanel();
  renderSessionChat();
}

function renderAccountSummary() {
  const strip = document.querySelector(".lobby-player-strip");
  if (!strip || !lobbySession.localPlayerId) {
    return;
  }

  let summary = strip.querySelector(".account-summary-chip");
  if (!summary) {
    summary = document.createElement("div");
    summary.className = "account-summary-chip";
    strip.append(summary);
  }

  const account = readAccountRecord();
  summary.innerHTML = `
    <span>누적 가치 <b>${formatValue(account.wallet.lifetimeLootValue)}</b></span>
    <span>보유 가치 <b>${formatValue(account.wallet.spendableValue)}</b></span>
    <span>전적 <b>${account.stats.wins}/${account.stats.gamesCompleted}</b></span>
  `;

  renderAccountProfileCard(account);
}

function formatValue(value) {
  return Number(value ?? 0).toLocaleString("ko-KR");
}

function renderAccountProfileCard(account = readAccountRecord()) {
  [lobbyStep, roomStep].forEach((container) => {
    if (!container) {
      return;
    }

    let card = container.querySelector(".account-profile-card");
    if (!card) {
      card = document.createElement("section");
      card.className = "account-profile-card";
      const anchor = container.querySelector(".lobby-player-strip") ?? container.querySelector(".room-header");
      anchor?.insertAdjacentElement("afterend", card);
    }

    const completed = account.stats.gamesCompleted ?? 0;
    const winRate = completed > 0 ? Math.round((account.stats.wins ?? 0) / completed * 100) : 0;
    const lastGameText = account.lastGame
      ? `${formatValue(account.lastGame.value)} 가치 / ${account.lastGame.winner ? "승리" : "기록됨"}`
      : "아직 완료된 게임 없음";
    const equippedTitle = getCosmeticLabel(account.cosmetics?.equipped?.title);
    const nameplateClass = getCosmeticClass(account.cosmetics?.equipped?.nameplate, "account-profile-card--");

    card.innerHTML = `
      <div class="account-profile-main ${nameplateClass}">
        <span>임시 서버 계정</span>
        <strong>${escapeHtml(account.nickname || lobbySession.nickname || "Player")}</strong>
        <small>${escapeHtml(equippedTitle || "정식 로그인 전까지 현재 브라우저의 playerId로 기록됩니다.")}</small>
      </div>
      <dl class="account-profile-stats">
        <div>
          <dt>보유 가치</dt>
          <dd>${formatValue(account.wallet.spendableValue)}</dd>
        </div>
        <div>
          <dt>누적 가치</dt>
          <dd>${formatValue(account.wallet.lifetimeLootValue)}</dd>
        </div>
        <div>
          <dt>승률</dt>
          <dd>${winRate}%</dd>
        </div>
        <div>
          <dt>킬 / 사망</dt>
          <dd>${formatValue(account.stats.kills)} / ${formatValue(account.stats.deaths)}</dd>
        </div>
        <div>
          <dt>탈출</dt>
          <dd>${formatValue(account.stats.extracts)}</dd>
        </div>
        <div>
          <dt>최고 가치</dt>
          <dd>${formatValue(account.stats.bestGameValue)}</dd>
        </div>
      </dl>
      <div class="account-profile-actions">
        <button class="account-shop-open" type="button">상점 열기</button>
        <button class="account-debug-grant" type="button">디버그 +500</button>
      </div>
      <p class="account-profile-last">최근 게임: ${escapeHtml(lastGameText)}</p>
    `;
  });

  bindAccountProfileActions();
}

function getCosmeticLabel(id) {
  return COSMETIC_CATALOG.find((item) => item.id === id)?.label ?? "";
}

function getCosmeticClass(id, prefix = "") {
  return id ? `${prefix}${String(id).replace(/[^a-z0-9_-]/gi, "-")}` : "";
}

function applyLocalCosmeticsToPlayers() {
  if (!state?.players?.length) {
    return;
  }

  const account = readAccountRecord();
  state.players.forEach((player) => {
    if (player.controllerId === lobbySession.localPlayerId) {
      player.cosmetics = account.cosmetics;
    }
  });
  renderer?.requestRender?.();
}

function bindAccountProfileActions() {
  document.querySelectorAll(".account-shop-open").forEach((button) => {
    if (button.dataset.bound === "true") {
      return;
    }
    button.addEventListener("click", openCosmeticShopModal);
    button.dataset.bound = "true";
  });

  document.querySelectorAll(".account-debug-grant").forEach((button) => {
    if (button.dataset.bound === "true") {
      return;
    }
    button.addEventListener("click", () => sendDebugGrantValue(500));
    button.dataset.bound = "true";
  });
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
        <span>${escapeHtml(room.players?.[0]?.nickname ?? "Host")} / ${room.players?.length ?? 0}/${room.maxPlayers} / COM ${room.comCount ?? 0} / ${escapeHtml(room.mapPackage?.name ?? DEFAULT_MAP_NAME)}</span>
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
  const mapPackage = room?.mapPackage ?? createMapPackage(currentMapData, DEFAULT_MAP_NAME);
  const cachedData = getRoomMapData(mapPackage);
  const tileCount = cachedData?.tiles?.filter((tile) => tile.enabled !== false).length ?? mapPackage.tileCount ?? 0;
  const hasBackground = Boolean(cachedData?.backgroundImage || mapPackage.hasBackground);

  if (roomMapName) {
    roomMapName.textContent = mapPackage.name ?? mapPackage.mapId ?? DEFAULT_MAP_NAME;
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

function cloneData(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function getAccountStorageKey() {
  return `${ACCOUNT_STORAGE_PREFIX}${lobbySession.localPlayerId}`;
}

function createDefaultAccountRecord() {
  return {
    accountId: lobbySession.localPlayerId,
    nickname: lobbySession.nickname || "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    wallet: {
      lifetimeLootValue: 0,
      spendableValue: 0,
      spentValue: 0
    },
    stats: {
      gamesPlayed: 0,
      gamesCompleted: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      bestGameValue: 0,
      extracts: 0
    },
    cosmetics: {
      equipped: {
        nameplate: "default",
        chatBubble: "default",
        tokenSkin: "default",
        title: "default"
      },
      owned: ["default"]
    },
    lastGame: null,
    appliedGameResults: []
  };
}

function readAccountRecord() {
  const saved = readJsonStorage(getAccountStorageKey(), null);
  return {
    ...createDefaultAccountRecord(),
    ...(saved ?? {}),
    wallet: {
      ...createDefaultAccountRecord().wallet,
      ...(saved?.wallet ?? {})
    },
    stats: {
      ...createDefaultAccountRecord().stats,
      ...(saved?.stats ?? {})
    },
    cosmetics: {
      ...createDefaultAccountRecord().cosmetics,
      ...(saved?.cosmetics ?? {})
    },
    appliedGameResults: Array.isArray(saved?.appliedGameResults) ? saved.appliedGameResults : []
  };
}

function writeAccountRecord(account) {
  writeJsonStorage(getAccountStorageKey(), {
    ...account,
    nickname: lobbySession.nickname || account.nickname,
    updatedAt: Date.now()
  });
}

function ensureLobbyShopUi() {
  if (document.querySelector("#cosmeticShopOverlay")) {
    cosmeticShopOverlay = document.querySelector("#cosmeticShopOverlay");
    cosmeticShopList = document.querySelector("#cosmeticShopList");
    cosmeticShopClose = document.querySelector("#cosmeticShopClose");
    return;
  }

  cosmeticShopOverlay = document.createElement("div");
  cosmeticShopOverlay.id = "cosmeticShopOverlay";
  cosmeticShopOverlay.className = "cosmetic-shop-overlay";
  cosmeticShopOverlay.hidden = true;
  cosmeticShopOverlay.innerHTML = `
    <div class="cosmetic-shop-backdrop"></div>
    <section class="cosmetic-shop-panel" role="dialog" aria-modal="true" aria-labelledby="cosmeticShopTitle">
      <header class="cosmetic-shop-header">
        <div>
          <span>Account Shop</span>
          <h2 id="cosmeticShopTitle">코스메틱 상점</h2>
        </div>
        <button id="cosmeticShopClose" class="icon-button" type="button" aria-label="상점 닫기">-</button>
      </header>
      <p class="cosmetic-shop-note">밸런스에 영향을 주지 않는 이름표, 채팅 말풍선, 말 스킨, 칭호만 판매합니다.</p>
      <div id="cosmeticShopList" class="cosmetic-shop-list"></div>
    </section>
  `;
  document.body.append(cosmeticShopOverlay);
  cosmeticShopList = cosmeticShopOverlay.querySelector("#cosmeticShopList");
  cosmeticShopClose = cosmeticShopOverlay.querySelector("#cosmeticShopClose");
  cosmeticShopClose?.addEventListener("click", closeCosmeticShopModal);
  cosmeticShopOverlay.querySelector(".cosmetic-shop-backdrop")?.addEventListener("click", closeCosmeticShopModal);
}

function openCosmeticShopModal() {
  ensureLobbyShopUi();
  renderCosmeticShop();
  if (cosmeticShopOverlay) {
    cosmeticShopOverlay.hidden = false;
  }
}

function closeCosmeticShopModal() {
  if (cosmeticShopOverlay) {
    cosmeticShopOverlay.hidden = true;
  }
}

function handleServerAccountUpdated(account) {
  if (!account || account.accountId !== lobbySession.localPlayerId) {
    return;
  }

  const localAccount = readAccountRecord();
  const serverApplied = Array.isArray(account.appliedGameResults) ? account.appliedGameResults : [];
  const localApplied = Array.isArray(localAccount.appliedGameResults) ? localAccount.appliedGameResults : [];
  writeAccountRecord({
    ...localAccount,
    ...account,
    wallet: {
      ...localAccount.wallet,
      ...(account.wallet ?? {})
    },
    stats: {
      ...localAccount.stats,
      ...(account.stats ?? {})
    },
    cosmetics: {
      ...localAccount.cosmetics,
      ...(account.cosmetics ?? {})
    },
    appliedGameResults: Array.from(new Set([...localApplied, ...serverApplied])).slice(-80)
  });
  renderAccountSummary();
  renderCosmeticShop();
  syncLocalRoomCosmetics(account.cosmetics);
  applyLocalCosmeticsToPlayers();
}

function syncLocalRoomCosmetics(cosmetics) {
  if (!lobbySession.currentRoom?.slots?.length) {
    return;
  }

  lobbySession.currentRoom.slots = getRoomSlots(lobbySession.currentRoom).map((slot) => (
    slot.type === "player" && slot.playerId === lobbySession.localPlayerId ? { ...slot, cosmetics } : slot
  ));
  syncPlayersFromSlots(lobbySession.currentRoom);
  saveRoomToStorage(lobbySession.currentRoom);
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

  if (gameServerSocket && [WebSocket.OPEN, WebSocket.CONNECTING].includes(gameServerSocket.readyState)) {
    return;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
  gameServerSocket = socket;

  socket.addEventListener("open", () => {
    gameServerConnected = true;
    if (serverReconnectTimer) {
      window.clearTimeout(serverReconnectTimer);
      serverReconnectTimer = 0;
    }
    requestServerRooms();
    requestAccountResume();
    if (lobbySession.currentRoom?.id) {
      requestServerGameSnapshot(lobbySession.currentRoom.id);
      requestChatHistory(lobbySession.currentRoom.id);
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
    if (!serverReconnectTimer) {
      serverReconnectTimer = window.setTimeout(() => {
        serverReconnectTimer = 0;
        initServerSync();
      }, 2500);
    }
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

  if (message.type === "accountAuthResult") {
    if (message.ok) {
      completeAccountLogin(message);
    } else {
      setStartStatus(message.message || "계정 인증에 실패했습니다.");
    }
    return;
  }

  if (message.type === "accountUpdated") {
    handleServerAccountUpdated(message.account);
    return;
  }

  if (message.type === "accountRejected") {
    setStartStatus(`계정 저장 실패: ${message.message ?? "알 수 없는 오류"}`);
    return;
  }

  if (message.type === "chatHistory") {
    handleChatHistory(message);
    return;
  }

  if (message.type === "chatMessage") {
    handleChatMessage(message);
    return;
  }

  if (message.type === "chatCleared") {
    handleChatCleared(message);
    return;
  }

  if (message.type === "chatRejected") {
    handleChatRejected(message);
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

function requestServerRooms() {
  if (!sendServerMessage({ type: "getRooms", sourceId: lobbySession.localPlayerId })) {
    return false;
  }
  return true;
}

function requestServerAccount() {
  if (!lobbySession.localPlayerId) {
    return false;
  }

  return sendServerMessage({
    type: "getAccount",
    sourceId: lobbySession.localPlayerId,
    nickname: lobbySession.nickname,
    at: Date.now()
  });
}

function refreshRoomListFromServer() {
  if (requestServerRooms()) {
    setStartStatus("서버 방 목록을 새로고침 중입니다.");
    return;
  }

  renderRoomList();
  setStartStatus("서버 연결 전이라 로컬 방 목록만 표시합니다.");
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
  requestChatHistory(room.id);
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

function requestChatHistory(roomId = lobbySession.currentRoom?.id) {
  if (!roomId) {
    return false;
  }

  return sendServerMessage({
    type: "getChat",
    roomId,
    sourceId: lobbySession.localPlayerId,
    at: Date.now()
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
    clearLocalChatMessages();
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

  if (["server", "serverSync"].includes(reason) && !activeRoom && !gameStarted) {
    const waitingRooms = rooms.filter((room) => room.status === "waiting").length;
    setStartStatus(`서버 방 목록 갱신 완료: 대기방 ${waitingRooms}개`);
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
  if (tabOther) {
    tabOther.disabled = true;
    tabOther.classList.add("is-disabled");
    tabOther.setAttribute("aria-disabled", "true");
    tabOther.title = "기타 탭은 현재 비활성화되어 있습니다.";
  }
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
      <section class="drawer-card beginner-help-card">
        <div class="loadout-section-title">
          <h3>초보자 도움말</h3>
          <span class="loadout-count">Guide</span>
        </div>
        <p class="weapon-passive">처음 플레이할 때 필요한 설명을 화면 위에 단계별로 표시합니다.</p>
        <label class="help-toggle-row">
          <span>도움말 자동 표시</span>
          <input id="beginnerHelpSwitch" type="checkbox">
        </label>
        <button id="beginnerHelpToggle" class="beginner-help-open" type="button">도움말 다시 보기</button>
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
  beginnerHelpToggle = document.querySelector("#beginnerHelpToggle");
  beginnerHelpSwitch = document.querySelector("#beginnerHelpSwitch");

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
  bindBeginnerHelpControls();
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
    loadoutTitle.textContent = "기타";
    loadoutSubtitle.textContent = "현재 비활성화";
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
    normalizeLoadoutPanelForViewport();
    loadoutPanel.classList.remove("is-minimized");
    requestAnimationFrame(keepLoadoutPanelInViewport);
    return;
  }

  if (activeDrawerTab === tab) {
    closeDrawer();
    return;
  }

  playDrawerOpenSfx(tab);
  setDrawerTab(tab);
  normalizeLoadoutPanelForViewport();
}

function normalizeLoadoutPanelForViewport() {
  if (!loadoutPanel || !isMobileLayout()) {
    return;
  }

  loadoutPanel.style.left = "";
  loadoutPanel.style.top = "";
  loadoutPanel.style.right = "";
  loadoutPanel.style.bottom = "";
  loadoutPanel.style.maxHeight = "";
}

function isMobileLayout() {
  return window.matchMedia?.("(max-width: 920px)")?.matches ?? window.innerWidth <= 920;
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

function ensureMobileViewResetUi() {
  if (mobileViewResetButton) {
    return;
  }

  const boardPanel = document.querySelector(".game-board-panel");
  if (!boardPanel) {
    return;
  }

  mobileViewResetButton = document.createElement("button");
  mobileViewResetButton.id = "mobileViewReset";
  mobileViewResetButton.className = "mobile-view-reset";
  mobileViewResetButton.type = "button";
  mobileViewResetButton.textContent = "화면";
  mobileViewResetButton.setAttribute("aria-label", "맵 화면 리셋");
  mobileViewResetButton.addEventListener("click", resetMobileGameView);
  boardPanel.append(mobileViewResetButton);
}

function resetMobileGameView() {
  renderer?.centerCamera();
  renderer?.requestRender();
  clearPendingTileAction();
  if (actionLog) {
    actionLog.textContent = "맵 화면을 기본 위치로 되돌렸습니다.";
  }
}

function ensureSessionChatUi() {
  if (!roomStep || !document.querySelector("#lobbyChatMessages")) {
    let roomMain = document.querySelector(".room-main-column");
    let roomSide = document.querySelector(".room-side-column");
    if (roomStep && !roomMain) {
      roomMain = document.createElement("div");
      roomMain.className = "room-main-column";
      Array.from(roomStep.children).forEach((child) => roomMain.append(child));
      roomStep.append(roomMain);
    }
    if (roomStep && !roomSide) {
      roomSide = document.createElement("aside");
      roomSide.className = "room-side-column";
      roomStep.append(roomSide);
    }

    const lobbyChat = document.createElement("section");
    lobbyChat.className = "session-chat session-chat--lobby";
    lobbyChat.setAttribute("aria-label", "Room Chat");
    lobbyChat.innerHTML = `
      <header class="session-chat-header">
        <div>
          <strong>작전 채팅</strong>
          <span>방 세션 전용</span>
        </div>
        <div class="session-chat-actions">
          <button type="button" data-chat-action="toggle" data-chat-target="lobby" aria-label="채팅 접기">-</button>
          <button type="button" data-chat-action="disable" data-chat-target="lobby" aria-label="채팅 비활성화">off</button>
        </div>
      </header>
      <ul id="lobbyChatMessages" class="session-chat-messages"></ul>
      <form id="lobbyChatForm" class="session-chat-form">
        <input id="lobbyChatInput" type="text" maxlength="200" placeholder="방에 메시지 보내기" autocomplete="off">
        <button type="submit">전송</button>
      </form>
    `;
    document.body.append(lobbyChat);
  }

  const boardPanel = document.querySelector(".game-board-panel");
  if (boardPanel && !document.querySelector("#beginnerContextHint")) {
    beginnerContextHint = document.createElement("aside");
    beginnerContextHint.id = "beginnerContextHint";
    beginnerContextHint.className = "beginner-context-hint";
    beginnerContextHint.hidden = true;
    boardPanel.append(beginnerContextHint);
  }

  if (boardPanel && !document.querySelector("#gameChatPanel")) {
    const gameChat = document.createElement("section");
    gameChat.id = "gameChatPanel";
    gameChat.className = "session-chat session-chat--game is-collapsed";
    gameChat.setAttribute("aria-label", "Game Chat");
    gameChat.innerHTML = `
      <button id="gameChatToggle" class="session-chat-toggle" type="button" aria-expanded="false">
        <strong>⌄</strong>
        <span id="gameChatBadge" hidden>0</span>
      </button>
      <div class="session-chat-body">
        <header class="session-chat-header">
          <div>
            <strong>작전 채팅</strong>
            <span>레이드 세션</span>
          </div>
          <div class="session-chat-actions">
            <button type="button" data-chat-action="toggle" data-chat-target="game" aria-label="채팅 접기">-</button>
            <button type="button" data-chat-action="disable" data-chat-target="game" aria-label="채팅 비활성화">off</button>
          </div>
        </header>
        <ul id="gameChatMessages" class="session-chat-messages"></ul>
        <form id="gameChatForm" class="session-chat-form">
          <input id="gameChatInput" type="text" maxlength="200" placeholder="작전 메시지" autocomplete="off">
          <button type="submit">전송</button>
        </form>
      </div>
    `;
    boardPanel.append(gameChat);
  }

  lobbyChatMessages = document.querySelector("#lobbyChatMessages");
  lobbyChatForm = document.querySelector("#lobbyChatForm");
  lobbyChatInput = document.querySelector("#lobbyChatInput");
  gameChatPanel = document.querySelector("#gameChatPanel");
  gameChatToggle = document.querySelector("#gameChatToggle");
  gameChatBadge = document.querySelector("#gameChatBadge");
  gameChatMessages = document.querySelector("#gameChatMessages");
  gameChatForm = document.querySelector("#gameChatForm");
  gameChatInput = document.querySelector("#gameChatInput");
  beginnerContextHint = document.querySelector("#beginnerContextHint");
}

function bindSessionChatEvents() {
  if (lobbyChatForm?.dataset.bound !== "true") {
    lobbyChatForm.dataset.bound = "true";
    lobbyChatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      sendChatFromInput(lobbyChatInput);
    });
    lobbyChatInput?.addEventListener("input", () => enforceChatInputLimit(lobbyChatInput));
  }

  if (gameChatForm?.dataset.bound !== "true") {
    gameChatForm.dataset.bound = "true";
    gameChatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      sendChatFromInput(gameChatInput);
    });
    gameChatInput?.addEventListener("input", () => enforceChatInputLimit(gameChatInput));
  }

  if (gameChatToggle?.dataset.bound !== "true") {
    gameChatToggle.dataset.bound = "true";
    gameChatToggle.addEventListener("click", () => {
      const collapsed = gameChatPanel.classList.toggle("is-collapsed");
      gameChatToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      if (!collapsed) {
        unreadGameChatCount = 0;
        renderChatBadge();
        scrollChatToBottom(gameChatMessages);
      }
    });
  }

  document.querySelectorAll("[data-chat-action]").forEach((button) => {
    if (button.dataset.bound === "true") {
      return;
    }

    button.dataset.bound = "true";
    button.addEventListener("click", () => handleChatAction(button));
  });

  if (document.body.dataset.chatEnterBound !== "true") {
    document.body.dataset.chatEnterBound = "true";
    window.addEventListener("keydown", handleChatEnterShortcut);
  }

  bindChatWindowDrag(document.querySelector(".session-chat--lobby"));
  bindChatWindowDrag(gameChatPanel);
}

function bindChatWindowDrag(panel) {
  const header = panel?.querySelector(".session-chat-header");
  if (!panel || !header || header.dataset.dragBound === "true") {
    return;
  }

  header.dataset.dragBound = "true";
  header.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.pointerType !== "touch") {
      return;
    }

    if (event.target.closest("button, input, select, textarea")) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    chatDragState.dragging = true;
    chatDragState.pointerId = event.pointerId;
    chatDragState.panel = panel;
    chatDragState.offsetX = event.clientX - rect.left;
    chatDragState.offsetY = event.clientY - rect.top;
    panel.classList.add("is-dragging");
    panel.classList.add("has-custom-position");
    header.setPointerCapture(event.pointerId);
    event.preventDefault();
  }, { passive: false });

  header.addEventListener("pointermove", (event) => {
    if (!chatDragState.dragging || chatDragState.pointerId !== event.pointerId || chatDragState.panel !== panel) {
      return;
    }

    moveChatPanel(panel, event.clientX - chatDragState.offsetX, event.clientY - chatDragState.offsetY);
    event.preventDefault();
  }, { passive: false });

  const endDrag = (event) => {
    if (chatDragState.pointerId !== event.pointerId || chatDragState.panel !== panel) {
      return;
    }

    chatDragState.dragging = false;
    chatDragState.pointerId = null;
    chatDragState.panel = null;
    panel.classList.remove("is-dragging");
  };

  header.addEventListener("pointerup", endDrag);
  header.addEventListener("pointercancel", endDrag);
}

function moveChatPanel(panel, left, top) {
  const rect = panel.getBoundingClientRect();
  const margin = 8;
  const nextLeft = Math.max(margin, Math.min(left, window.innerWidth - rect.width - margin));
  const nextTop = Math.max(margin, Math.min(top, window.innerHeight - rect.height - margin));
  panel.style.left = `${nextLeft}px`;
  panel.style.top = `${nextTop}px`;
  panel.style.right = "auto";
  panel.style.bottom = "auto";
}

function handleChatAction(button) {
  const target = button.dataset.chatTarget;
  const panel = target === "lobby" ? document.querySelector(".session-chat--lobby") : gameChatPanel;
  if (!panel) {
    return;
  }

  if (button.dataset.chatAction === "toggle") {
    const collapsed = panel.classList.toggle("is-collapsed");
    button.textContent = collapsed ? "+" : "-";
    if (!collapsed && target === "game") {
      gameChatInput?.focus();
    }
    return;
  }

  if (button.dataset.chatAction === "disable") {
    chatDisabled = !chatDisabled;
    document.querySelectorAll(".session-chat").forEach((chat) => chat.classList.toggle("is-disabled", chatDisabled));
    [lobbyChatInput, gameChatInput].forEach((input) => {
      if (input) input.disabled = chatDisabled;
    });
    document.querySelectorAll("[data-chat-action='disable']").forEach((toggle) => {
      toggle.textContent = chatDisabled ? "on" : "off";
      toggle.setAttribute("aria-label", chatDisabled ? "채팅 활성화" : "채팅 비활성화");
    });
    setChatInputStatus(chatDisabled ? "채팅을 비활성화했습니다." : "채팅을 다시 활성화했습니다.");
  }
}

function handleChatEnterShortcut(event) {
  if (!gameStarted || event.key !== "Enter" || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
    return;
  }

  const active = document.activeElement;
  const typing = active === gameChatInput;
  if (typing) {
    event.preventDefault();
    sendChatFromInput(gameChatInput);
    gameChatInput?.blur();
    gameChatPanel?.classList.add("is-collapsed");
    gameChatToggle?.setAttribute("aria-expanded", "false");
    return;
  }

  if (active && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(active.tagName)) {
    return;
  }

  event.preventDefault();
  if (chatDisabled) {
    setChatInputStatus("채팅이 비활성화되어 있습니다.");
    return;
  }
  gameChatPanel?.classList.remove("is-collapsed");
  gameChatToggle?.setAttribute("aria-expanded", "true");
  gameChatInput?.focus();
}

function sendChatFromInput(input) {
  if (input) {
    enforceChatInputLimit(input);
  }
  const text = trimChatText(input?.value ?? "").trim();
  if (chatDisabled) {
    setChatInputStatus("채팅이 비활성화되어 있습니다.");
    return;
  }
  if (!text || !lobbySession.currentRoom?.id) {
    setChatInputStatus(!text ? "메시지를 입력하세요." : "방에 입장한 뒤 채팅할 수 있습니다.");
    return;
  }

  const ok = sendServerMessage({
    type: "chatMessage",
    roomId: lobbySession.currentRoom.id,
    sourceId: lobbySession.localPlayerId,
    text,
    raid: gameStarted ? state?.raid : null,
    phase: gameStarted ? state?.phase : null,
    messageId: `${lobbySession.localPlayerId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    at: Date.now()
  });

  if (ok) {
    input.value = "";
    setChatInputStatus("전송 중...");
  } else {
    setChatInputStatus("서버 연결 후 채팅을 사용할 수 있습니다.");
  }
}

function enforceChatInputLimit(input) {
  if (!input) {
    return;
  }

  const trimmed = trimChatText(input.value);
  if (trimmed !== input.value) {
    input.value = trimmed;
  }
}

function trimChatText(value, maxWeight = 100) {
  let weight = 0;
  let result = "";
  for (const char of String(value ?? "")) {
    const nextWeight = weight + getChatCharWeight(char);
    if (nextWeight > maxWeight) {
      break;
    }
    weight = nextWeight;
    result += char;
  }
  return result;
}

function getChatCharWeight(char) {
  return /^[\x00-\x7F]$/.test(char) ? 0.5 : 1;
}

function handleChatHistory(message) {
  if (message.roomId !== lobbySession.currentRoom?.id) {
    return;
  }

  chatMessages.length = 0;
  seenChatMessageIds.clear();
  (message.messages ?? []).forEach((entry) => addChatMessage(entry, { unread: false }));
  renderSessionChat();
}

function handleChatMessage(message) {
  if (message.roomId !== lobbySession.currentRoom?.id || !message.message) {
    return;
  }

  const mine = message.message.playerId === lobbySession.localPlayerId;
  const gameChatClosed = gameStarted && gameChatPanel?.classList.contains("is-collapsed");
  addChatMessage(message.message, { unread: !mine && gameChatClosed });
  renderSessionChat();
}

function handleChatCleared(message) {
  if (message.roomId !== lobbySession.currentRoom?.id) {
    return;
  }

  clearLocalChatMessages();
}

function handleChatRejected(message) {
  if (message.roomId && message.roomId !== lobbySession.currentRoom?.id) {
    return;
  }

  setChatInputStatus(`채팅 실패: ${message.message ?? "서버에서 거절되었습니다."}`);
}

function clearLocalChatMessages() {
  chatMessages.length = 0;
  seenChatMessageIds.clear();
  unreadGameChatCount = 0;
  renderSessionChat();
}

function addChatMessage(message, { unread = false } = {}) {
  if (!message?.id || seenChatMessageIds.has(message.id)) {
    return;
  }

  seenChatMessageIds.add(message.id);
  chatMessages.push(message);
  while (chatMessages.length > 80) {
    const removed = chatMessages.shift();
    seenChatMessageIds.delete(removed.id);
  }

  if (unread) {
    unreadGameChatCount += 1;
  }

  if (message.playerId === lobbySession.localPlayerId) {
    setChatInputStatus("전송 완료");
  }
}

function renderSessionChat() {
  ensureSessionChatUi();
  const lobbyChatPanel = document.querySelector(".session-chat--lobby");
  if (lobbyChatPanel) {
    lobbyChatPanel.hidden = gameStarted || !lobbySession.currentRoom;
  }
  if (gameChatPanel) {
    gameChatPanel.hidden = !gameStarted;
  }

  const html = chatMessages.length
    ? chatMessages.map(renderChatMessage).join("")
    : "<li class=\"session-chat-empty\">아직 메시지가 없습니다.</li>";

  if (lobbyChatMessages) {
    lobbyChatMessages.innerHTML = html;
    scrollChatToBottom(lobbyChatMessages);
  }

  if (gameChatMessages) {
    gameChatMessages.innerHTML = html;
    scrollChatToBottom(gameChatMessages);
  }

  renderChatBadge();
}

function renderChatMessage(message) {
  const mine = message.playerId === lobbySession.localPlayerId;
  const context = message.raid && message.phase ? `R${message.raid} P${message.phase}` : "Lobby";
  const bubbleClass = getCosmeticClass(message.cosmetics?.chatBubble, "chat-bubble--");
  return `
    <li class="session-chat-message ${mine ? "is-mine" : ""} ${bubbleClass}">
      <div>
        <strong>${escapeHtml(message.nickname ?? "Player")}</strong>
        <small>${context}</small>
      </div>
      <p>${escapeHtml(message.text ?? "")}</p>
    </li>
  `;
}

function renderChatBadge() {
  if (!gameChatBadge) {
    return;
  }

  gameChatBadge.hidden = unreadGameChatCount <= 0;
  gameChatBadge.textContent = String(Math.min(unreadGameChatCount, 9));
}

function setChatInputStatus(message) {
  if (gameStarted) {
    actionLog.textContent = message;
  } else {
    setStartStatus(message);
  }
}

function scrollChatToBottom(list) {
  if (!list) {
    return;
  }

  requestAnimationFrame(() => {
    list.scrollTop = list.scrollHeight;
  });
}

function restoreBeginnerHelpPreference() {
  const saved = readJsonStorage(BEGINNER_HELP_STORAGE_KEY, null);
  beginnerHelpEnabled = saved?.enabled !== false;
}

function saveBeginnerHelpPreference() {
  writeJsonStorage(BEGINNER_HELP_STORAGE_KEY, { enabled: beginnerHelpEnabled });
}

function ensureBeginnerHelpUi() {
  if (beginnerHelpPanel) {
    return;
  }

  beginnerHelpSpotlight = document.createElement("div");
  beginnerHelpSpotlight.className = "beginner-help-spotlight";
  beginnerHelpSpotlight.hidden = true;
  document.body.append(beginnerHelpSpotlight);

  beginnerHelpPanel = document.createElement("section");
  beginnerHelpPanel.className = "beginner-help-panel";
  beginnerHelpPanel.hidden = true;
  beginnerHelpPanel.setAttribute("role", "dialog");
  beginnerHelpPanel.setAttribute("aria-live", "polite");
  beginnerHelpPanel.innerHTML = `
    <div class="beginner-help-kicker">초보자 도움말</div>
    <h2 id="beginnerHelpTitle">도움말</h2>
    <p id="beginnerHelpBody">-</p>
    <div class="beginner-help-footer">
      <span id="beginnerHelpProgress">1 / 1</span>
      <div class="beginner-help-actions">
        <button id="beginnerHelpPrev" type="button">이전</button>
        <button id="beginnerHelpNext" type="button">다음</button>
        <button id="beginnerHelpClose" type="button">닫기</button>
      </div>
    </div>
  `;
  document.body.append(beginnerHelpPanel);

  beginnerHelpTitle = beginnerHelpPanel.querySelector("#beginnerHelpTitle");
  beginnerHelpBody = beginnerHelpPanel.querySelector("#beginnerHelpBody");
  beginnerHelpProgress = beginnerHelpPanel.querySelector("#beginnerHelpProgress");
  beginnerHelpPrev = beginnerHelpPanel.querySelector("#beginnerHelpPrev");
  beginnerHelpNext = beginnerHelpPanel.querySelector("#beginnerHelpNext");
  beginnerHelpClose = beginnerHelpPanel.querySelector("#beginnerHelpClose");

  beginnerHelpPrev?.addEventListener("click", () => showBeginnerHelpStep(beginnerHelpStepIndex - 1));
  beginnerHelpNext?.addEventListener("click", () => {
    if (beginnerHelpStepIndex >= BEGINNER_HELP_STEPS.length - 1) {
      closeBeginnerHelp();
      return;
    }
    showBeginnerHelpStep(beginnerHelpStepIndex + 1);
  });
  beginnerHelpClose?.addEventListener("click", closeBeginnerHelp);
  window.addEventListener("resize", () => {
    if (beginnerHelpOpen) {
      positionBeginnerHelp();
    }
  });
}

function bindBeginnerHelpControls() {
  if (beginnerHelpSwitch) {
    beginnerHelpSwitch.checked = beginnerHelpEnabled;
    if (beginnerHelpSwitch.dataset.bound !== "true") {
      beginnerHelpSwitch.addEventListener("change", () => {
        beginnerHelpEnabled = beginnerHelpSwitch.checked;
        saveBeginnerHelpPreference();
        if (!beginnerHelpEnabled) {
          closeBeginnerHelp();
        }
      });
      beginnerHelpSwitch.dataset.bound = "true";
    }
  }

  if (beginnerHelpToggle && beginnerHelpToggle.dataset.bound !== "true") {
    beginnerHelpToggle.addEventListener("click", () => openBeginnerHelp(0, { force: true }));
    beginnerHelpToggle.dataset.bound = "true";
  }
}

function maybeShowBeginnerHelpOnGameStart() {
  if (!beginnerHelpEnabled || beginnerHelpShownThisGame) {
    return;
  }

  beginnerHelpShownThisGame = true;
  window.setTimeout(() => openBeginnerHelp(0), 650);
}

function renderBeginnerContextHint() {
  ensureSessionChatUi();
  if (!beginnerContextHint) {
    return;
  }

  if (!gameStarted || !beginnerHelpEnabled || beginnerHelpOpen || state.raidEnded) {
    beginnerContextHint.hidden = true;
    return;
  }

  const hint = getBeginnerContextHint();
  if (!hint) {
    beginnerContextHint.hidden = true;
    return;
  }

  beginnerContextHint.hidden = false;
  beginnerContextHint.innerHTML = `
    <strong>${hint.title}</strong>
    <span>${hint.body}</span>
  `;
}

function getBeginnerContextHint() {
  const player = getUiPlayer();

  if (!canLocalControlActivePlayer()) {
    return {
      title: "대기 중",
      body: "다른 플레이어가 행동 중입니다. 내 차례가 오면 이동 가능 칸과 액션 버튼이 표시됩니다."
    };
  }

  if (player.pendingDiscardCount > 0) {
    return {
      title: "가방 정리 필요",
      body: "가방 탭에서 버릴 아이템을 선택해야 다음 행동을 진행할 수 있습니다."
    };
  }

  if (state.postAttackMoveAvailable) {
    return {
      title: "AR 추가 이동",
      body: "공격 후 남은 스태미나를 사용해 1칸 추가 이동할 수 있습니다. 이동할 칸을 선택하세요."
    };
  }

  if (pendingTileAction?.type === "move") {
    return {
      title: "이동 확정",
      body: "선택한 칸 위 비용 버튼을 누르거나 같은 칸을 한 번 더 누르면 이동합니다."
    };
  }

  if (pendingTileAction?.type === "attack") {
    return {
      title: "공격 가능",
      body: "대상 위 공격 버튼을 누르면 주사위를 굴리고, 공격 후 턴이 종료됩니다."
    };
  }

  if (pendingTileAction?.type === "loot" || pendingTileAction?.type === "corpseLoot") {
    return {
      title: "루팅 가능",
      body: "타일 위 루팅 버튼을 누르면 아이템을 획득합니다. 가방 공간을 확인하세요."
    };
  }

  if (state.canLoot()) {
    return {
      title: "현재 위치 루팅",
      body: "지금 밟고 있는 타일에서 루팅할 수 있습니다. 타일 위 루팅 버튼을 확인하세요."
    };
  }

  if (player.stamina <= 0) {
    return {
      title: "행동 자원 없음",
      body: "스태미나를 모두 사용했습니다. 가능한 특수 행동이 없다면 턴을 종료하세요."
    };
  }

  return {
    title: "내 차례",
    body: "이동할 칸, 루팅 타일, 공격 대상을 선택하세요. 행동은 스태미나를 사용합니다."
  };
}

function openBeginnerHelp(stepIndex = 0, { force = false } = {}) {
  ensureBeginnerHelpUi();
  if (!force && !beginnerHelpEnabled) {
    return;
  }

  beginnerHelpOpen = true;
  beginnerHelpPanel.hidden = false;
  beginnerHelpSpotlight.hidden = false;
  showBeginnerHelpStep(stepIndex);
}

function closeBeginnerHelp() {
  beginnerHelpOpen = false;
  if (beginnerHelpPanel) {
    beginnerHelpPanel.hidden = true;
  }
  if (beginnerHelpSpotlight) {
    beginnerHelpSpotlight.hidden = true;
  }
}

function showBeginnerHelpStep(index) {
  if (!beginnerHelpPanel) {
    return;
  }

  beginnerHelpStepIndex = Math.max(0, Math.min(BEGINNER_HELP_STEPS.length - 1, index));
  const step = BEGINNER_HELP_STEPS[beginnerHelpStepIndex];
  beginnerHelpTitle.textContent = step.title;
  beginnerHelpBody.textContent = step.body;
  beginnerHelpProgress.textContent = `${beginnerHelpStepIndex + 1} / ${BEGINNER_HELP_STEPS.length}`;
  beginnerHelpPrev.disabled = beginnerHelpStepIndex === 0;
  beginnerHelpNext.textContent = beginnerHelpStepIndex >= BEGINNER_HELP_STEPS.length - 1 ? "완료" : "다음";
  positionBeginnerHelp();
}

function positionBeginnerHelp() {
  if (!beginnerHelpPanel || !beginnerHelpOpen) {
    return;
  }

  const step = BEGINNER_HELP_STEPS[beginnerHelpStepIndex];
  const target = document.querySelector(step.selector);
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const panelRect = beginnerHelpPanel.getBoundingClientRect();
  const margin = 12;

  if (!target || target.hidden || target.getClientRects().length === 0) {
    beginnerHelpSpotlight.hidden = true;
    beginnerHelpPanel.style.left = `${Math.max(margin, (viewportWidth - panelRect.width) / 2)}px`;
    beginnerHelpPanel.style.top = `${Math.max(margin, viewportHeight - panelRect.height - 24)}px`;
    return;
  }

  const rect = target.getBoundingClientRect();
  beginnerHelpSpotlight.hidden = false;
  beginnerHelpSpotlight.style.left = `${Math.max(0, rect.left - 6)}px`;
  beginnerHelpSpotlight.style.top = `${Math.max(0, rect.top - 6)}px`;
  beginnerHelpSpotlight.style.width = `${Math.min(viewportWidth, rect.width + 12)}px`;
  beginnerHelpSpotlight.style.height = `${Math.min(viewportHeight, rect.height + 12)}px`;

  const preferRight = rect.left + rect.width / 2 < viewportWidth * 0.56;
  let left = preferRight ? rect.right + margin : rect.left - panelRect.width - margin;
  if (viewportWidth <= 720 || left < margin || left + panelRect.width > viewportWidth - margin) {
    left = Math.min(viewportWidth - panelRect.width - margin, Math.max(margin, rect.left));
  }

  let top = rect.top;
  if (top + panelRect.height > viewportHeight - margin) {
    top = rect.top - panelRect.height - margin;
  }
  if (top < margin) {
    top = Math.min(viewportHeight - panelRect.height - margin, rect.bottom + margin);
  }

  beginnerHelpPanel.style.left = `${Math.max(margin, Math.min(left, viewportWidth - panelRect.width - margin))}px`;
  beginnerHelpPanel.style.top = `${Math.max(margin, Math.min(top, viewportHeight - panelRect.height - margin))}px`;
}

function bindLoadoutDrag() {
  if (!loadoutHeader || !loadoutPanel || loadoutHeader.dataset.dragBound === "true") {
    return;
  }

  loadoutHeader.dataset.dragBound = "true";
  loadoutHeader.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.pointerType !== "touch") {
      return;
    }

    const rect = loadoutPanel.getBoundingClientRect();
    loadoutDragState.dragging = true;
    loadoutDragState.pointerId = event.pointerId;
    loadoutDragState.offsetX = event.clientX - rect.left;
    loadoutDragState.offsetY = event.clientY - rect.top;
    loadoutPanel.classList.add("is-dragging");
    loadoutHeader.setPointerCapture(event.pointerId);
    event.preventDefault();
  }, { passive: false });

  loadoutHeader.addEventListener("pointermove", (event) => {
    if (!loadoutDragState.dragging || loadoutDragState.pointerId !== event.pointerId) {
      return;
    }

    moveLoadoutPanel(event.clientX - loadoutDragState.offsetX, event.clientY - loadoutDragState.offsetY);
    event.preventDefault();
  }, { passive: false });

  const stopDrag = (event) => {
    if (loadoutDragState.pointerId !== event.pointerId) {
      return;
    }

    loadoutDragState.dragging = false;
    loadoutDragState.pointerId = null;
    loadoutPanel.classList.remove("is-dragging");
    keepLoadoutPanelInViewport();
  };

  loadoutHeader.addEventListener("pointerup", stopDrag);
  loadoutHeader.addEventListener("pointercancel", stopDrag);
  window.addEventListener("resize", keepLoadoutPanelInViewport);
}

function moveLoadoutPanel(left, top) {
  const rect = loadoutPanel.getBoundingClientRect();
  const maxLeft = Math.max(0, window.innerWidth - rect.width - 8);
  const maxTop = Math.max(0, window.innerHeight - Math.min(rect.height, window.innerHeight - 16) - 8);
  const nextLeft = Math.max(8, Math.min(maxLeft, left));
  const nextTop = Math.max(8, Math.min(maxTop, top));

  loadoutPanel.style.left = `${nextLeft}px`;
  loadoutPanel.style.top = `${nextTop}px`;
  loadoutPanel.style.right = "auto";
  loadoutPanel.style.bottom = "auto";
}

function keepLoadoutPanelInViewport() {
  if (!loadoutPanel || loadoutPanel.classList.contains("is-minimized")) {
    return;
  }

  if (isMobileLayout()) {
    normalizeLoadoutPanelForViewport();
    return;
  }

  loadoutPanel.style.maxHeight = `${Math.max(280, window.innerHeight - 16)}px`;
  const rect = loadoutPanel.getBoundingClientRect();
  moveLoadoutPanel(rect.left, rect.top);
}

function renderCosmeticShop() {
  if (!cosmeticShopList) {
    return;
  }

  const account = readAccountRecord();
  const owned = new Set(account.cosmetics?.owned ?? ["default"]);
  const equipped = account.cosmetics?.equipped ?? {};
  const balance = account.wallet?.spendableValue ?? 0;

  cosmeticShopList.innerHTML = `
    <div class="cosmetic-shop-balance">
      <span>보유 가치</span>
      <strong>${formatValue(balance)}</strong>
    </div>
    ${COSMETIC_CATALOG.map((item) => {
      const isOwned = owned.has(item.id);
      const isEquipped = equipped[item.category] === item.id;
      const affordable = balance >= item.price;
      const action = isOwned ? "equipCosmetic" : "purchaseCosmetic";
      const disabled = isEquipped || (!isOwned && !affordable);
      const label = isEquipped ? "장착 중" : isOwned ? "장착" : `${formatValue(item.price)} 구매`;
      return `
        <article class="cosmetic-shop-item ${isEquipped ? "is-equipped" : ""}">
          <div class="cosmetic-shop-preview ${getCosmeticClass(item.id, "cosmetic-preview--")}">
            <span>${escapeHtml(item.preview ?? item.categoryLabel)}</span>
          </div>
          <div class="cosmetic-shop-copy">
            <div class="cosmetic-shop-meta">
              <span>${escapeHtml(item.categoryLabel)}</span>
              <em>${escapeHtml(item.rarity ?? "Standard")}</em>
            </div>
            <strong>${escapeHtml(item.label)}</strong>
            <p>${escapeHtml(item.description)}</p>
          </div>
          <button
            type="button"
            data-cosmetic-action="${action}"
            data-cosmetic-id="${item.id}"
            ${disabled ? "disabled" : ""}
          >${label}</button>
        </article>
      `;
    }).join("")}
  `;

  if (cosmeticShopList.dataset.bound !== "true") {
    cosmeticShopList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-cosmetic-action]");
      if (!button) {
        return;
      }
      sendCosmeticAction(button.dataset.cosmeticAction, button.dataset.cosmeticId);
    });
    cosmeticShopList.dataset.bound = "true";
  }
}

function sendCosmeticAction(action, itemId) {
  const item = COSMETIC_CATALOG.find((entry) => entry.id === itemId);
  if (!item) {
    return;
  }

  const ok = sendServerMessage({
    type: "accountAction",
    action,
    itemId,
    sourceId: lobbySession.localPlayerId,
    nickname: lobbySession.nickname,
    at: Date.now()
  });

  setStartStatus(ok ? `${item.label} 요청을 서버에 전송했습니다.` : "서버 연결 후 상점을 사용할 수 있습니다.");
}

function sendDebugGrantValue(amount = 500) {
  const ok = sendServerMessage({
    type: "accountAction",
    action: "debugGrantValue",
    amount,
    sourceId: lobbySession.localPlayerId,
    nickname: lobbySession.nickname,
    at: Date.now()
  });

  setStartStatus(ok ? `디버그 가치 +${formatValue(amount)} 요청을 서버에 전송했습니다.` : "서버 연결 후 디버그 지급을 사용할 수 있습니다.");
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

function resetGlobalVoiceTracking() {
  playedVoiceCueKeys.clear();
  voiceStateInitialized = false;
  lastVoiceRaid = null;
  lastVoicePhase = null;
  lastVoiceRaidEnded = null;
}

function startGlobalVoiceTracking({ playRaidStart = false } = {}) {
  if (!state) {
    return;
  }

  voiceStateInitialized = true;
  lastVoiceRaid = state.raid;
  lastVoicePhase = state.phase;
  lastVoiceRaidEnded = state.raidEnded;

  if (playRaidStart && !state.raidEnded) {
    playGlobalVoiceCue("voRaidStart", `raid-start-${state.raid}`, 0.92);
  }
}

function syncGlobalVoiceOvers() {
  if (!gameStarted || !state) {
    return;
  }

  if (!voiceStateInitialized) {
    startGlobalVoiceTracking();
    return;
  }

  if (!state.raidEnded && state.raid !== lastVoiceRaid) {
    playGlobalVoiceCue("voRaidStart", `raid-start-${state.raid}`, 0.92);
  }

  if (!state.raidEnded && state.phase === 8 && lastVoicePhase !== state.phase) {
    playGlobalVoiceCue("voRaidMid", `raid-mid-${state.raid}`, 0.92);
  }

  if (state.raidEnded && lastVoiceRaidEnded !== true) {
    const gameEnded = state.raid >= 3;
    playGlobalVoiceCue(
      gameEnded ? "voGameEnd" : "voRaidEnd",
      gameEnded ? "game-end" : `raid-end-${state.raid}`,
      0.92
    );
  }

  lastVoiceRaid = state.raid;
  lastVoicePhase = state.phase;
  lastVoiceRaidEnded = state.raidEnded;
}

function playGlobalVoiceCue(soundKey, cueKey, volume = 0.92) {
  if (!SOUND_URLS[soundKey] || playedVoiceCueKeys.has(cueKey)) {
    return;
  }

  playedVoiceCueKeys.add(cueKey);
  playSound(SOUND_URLS[soundKey], { volume }, { allowQueue: false });
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
  applyGameSummaryToAccount(summary);
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

  clearSessionChatOnGameEnd();
}

function applyGameSummaryToAccount(summary) {
  const localPlayer = getUiPlayer();
  if (!localPlayer || !summary?.standings?.length) {
    return;
  }

  const roomId = lobbySession.currentRoom?.id ?? "solo";
  const resultKey = `${roomId}:${localPlayer.id}:${summary.standings.map((entry) => `${entry.id ?? entry.name}:${entry.score}`).join("|")}`;
  const account = readAccountRecord();
  if (appliedAccountResultKeys.has(resultKey) || account.appliedGameResults?.includes(resultKey)) {
    return;
  }

  const standing = summary.standings.find((entry) => entry.id === localPlayer.id || entry.name === localPlayer.name);
  if (!standing) {
    return;
  }

  appliedAccountResultKeys.add(resultKey);
  const confirmedValue = Math.max(0, Number(standing.score ?? 0));
  const localKills = (state.killLog ?? []).filter((entry) => entry.killerId === localPlayer.id || entry.killerName === localPlayer.name).length;
  const winner = summary.winners.some((entry) => entry.id === localPlayer.id || entry.name === localPlayer.name);

  account.wallet.lifetimeLootValue += confirmedValue;
  account.wallet.spendableValue += confirmedValue;
  account.stats.gamesPlayed += 1;
  account.stats.gamesCompleted += 1;
  account.stats.wins += winner ? 1 : 0;
  account.stats.kills += localKills;
  account.stats.deaths += localPlayer.dead ? 1 : 0;
  account.stats.bestGameValue = Math.max(account.stats.bestGameValue ?? 0, confirmedValue);
  account.lastGame = {
    at: Date.now(),
    roomId,
    mapId: state.gameMap?.mapId ?? null,
    value: confirmedValue,
    winner,
    kills: localKills,
    dead: Boolean(localPlayer.dead),
    finalRaidExtracted: Boolean(localPlayer.extractedThisRaid)
  };
  account.appliedGameResults = [...(account.appliedGameResults ?? []), resultKey].slice(-20);
  writeAccountRecord(account);
  sendServerGameResult({
    resultKey,
    value: confirmedValue,
    winner,
    kills: localKills,
    dead: Boolean(localPlayer.dead),
    finalRaidExtracted: Boolean(localPlayer.extractedThisRaid),
    mapId: state.gameMap?.mapId ?? null
  });
  renderAccountSummary();
}

function sendServerGameResult(result) {
  if (!lobbySession.localPlayerId) {
    return false;
  }

  return sendServerMessage({
    type: "gameResult",
    sourceId: lobbySession.localPlayerId,
    nickname: lobbySession.nickname,
    roomId: lobbySession.currentRoom?.id ?? null,
    resultKey: result.resultKey,
    result,
    at: Date.now()
  });
}

function clearSessionChatOnGameEnd() {
  const roomId = lobbySession.currentRoom?.id;
  if (!roomId || !isLocalHost() || clearedChatRoomIds.has(roomId)) {
    return;
  }

  clearedChatRoomIds.add(roomId);
  sendServerMessage({
    type: "clearChat",
    roomId,
    sourceId: lobbySession.localPlayerId,
    at: Date.now()
  });
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
  resetGlobalVoiceTracking();
  if (lobbySession.currentRoom) {
    setCurrentRoomStatus("waiting");
  }
    if (currentMapData) {
      state = createRaidState(currentMapData);
      resetGlobalVoiceTracking();
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
  resetGlobalVoiceTracking();
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
  syncGlobalVoiceOvers();
  refreshTabUnreadClasses();
  renderBeginnerContextHint();
  if (beginnerHelpOpen) {
    positionBeginnerHelp();
  }
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
  const entries = Object.entries(player.bodyHp);

  bodyHp.innerHTML = entries
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

  if (bodyHpHud) {
    const previousStamina = lastHudStaminaByPlayer.get(player.id);
    const staminaSpent = Number.isFinite(previousStamina) && player.stamina < previousStamina;
    const staminaMax = Math.max(1, player.staminaMax ?? 1);
    const staminaPips = Array.from({ length: staminaMax }, (_, index) => {
      const filled = index < player.stamina;
      const justSpent = staminaSpent && index >= player.stamina && index < previousStamina;
      return `<span class="${filled ? "is-filled" : ""}${justSpent ? " is-spent" : ""}"></span>`;
    }).join("");

    bodyHpHud.innerHTML = `
      <div class="body-hp-hud-stamina ${staminaSpent ? "is-draining" : ""}">
        <div class="body-hp-hud-row body-hp-hud-row--stamina">
          <span>스태미나</span>
          <div class="body-stamina-pips" aria-label="스태미나 ${player.stamina}/${staminaMax}">
            ${staminaPips}
          </div>
          <strong>${player.stamina}</strong>
        </div>
      </div>
    ` + entries
      .map(([part, value]) => {
        const max = maxHp[part] ?? 1;
        const percent = Math.max(0, Math.min(100, (value / max) * 100));
        const damagePercent = 100 - percent;
        return `
          <div class="body-hp-hud-row ${value <= 0 ? "is-zero" : ""}">
            <span>${bodyPartLabel(part)}</span>
            <div class="body-hp-hud-bar" aria-label="${bodyPartLabel(part)} ${value}/${max}">
              <div class="body-hp-hud-damage" style="width: ${damagePercent}%"></div>
            </div>
            <strong>${value}</strong>
          </div>
        `;
      })
      .join("");
    lastHudStaminaByPlayer.set(player.id, player.stamina);
  }
}

function renderRaidLog() {
  const entries = state.raidLog.filter((entry) => isPlayerVisibleLogEntry(entry));

  if (entries.length === 0) {
    raidLog.innerHTML = "<li><span>No log entries yet</span></li>";
    return;
  }

  raidLog.innerHTML = entries
    .slice(0, 3)
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
