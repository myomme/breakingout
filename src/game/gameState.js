import { createGameMap, findWalkablePath, getReachableWalkableTiles } from "./mapDataAdapter.js";
import { getHexNeighbors, hexDistance, hexLine, tileKey } from "../core/hex.js";

export class RaidGameState {
  constructor({ mapData, playerTemplate, lootTables, weapons, dice, armor, events, aiCount = 1, playerLoadouts = [] }) {
    this.playerTemplate = playerTemplate;
    this.lootTables = lootTables;
    this.weapons = weapons;
    this.dice = dice;
    this.armor = armor;
    this.events = events;
    this.aiCount = clampAiCount(aiCount);
    this.playerLoadouts = playerLoadouts;
    this.loadMap(mapData);
  }

  loadMap(mapData) {
    this.gameMap = createGameMap(mapData, { keepBackground: true });
    this.raid = 1;
    this.phase = 1;
    this.maxPhase = 15;
    this.raidLog = [];
    this.killLog = [];
    this.corpseBags = [];
    this.raidEnded = false;
    this.raidResult = "inProgress";
    this.stashValue = 0;
    this.selectedMoveMode = "walk";
    this.lastAttackRoll = [];
    this.actionLocked = false;
    this.postAttackMoveAvailable = false;
    this.eventDeck = this.shuffleEvents();
    this.currentEvent = null;
    this.lastEventDraws = [];
    this.lastEventResults = [];
    this.pendingEventDiceRolls = [];
    this.phaseEffects = this.createEmptyPhaseEffects();
    this.selectedTileKey = null;
    this.lastAttackSummary = null;
    this.playerScores = this.createScoreMap();
    this.players = this.createPlayers();
    this.turnOrder = this.drawTurnOrder();
    this.activePlayerIndex = this.turnOrder[0]?.playerIndex ?? 0;
    this.enemies = this.createEnemies();
    this.players.forEach((player) => this.revealVisibleTiles(player));
    this.lastRaidSpawnKeys = new Set(this.players.filter((player) => player.position).map((player) => tileKey(player.position)));
  }

  get player() {
    return this.players[this.activePlayerIndex];
  }

  isPlayerActive(player) {
    return Boolean(player && player.alive && !player.dead && !player.escaped && player.position);
  }

  getActivePlayerIndices() {
    return this.players
      .map((player, index) => ({ player, index }))
      .filter(({ player }) => this.isPlayerActive(player))
      .map(({ index }) => index);
  }

  exportSnapshot() {
    return {
      raid: this.raid,
      phase: this.phase,
      maxPhase: this.maxPhase,
      raidEnded: this.raidEnded,
      raidResult: this.raidResult,
      stashValue: this.stashValue,
      selectedMoveMode: this.selectedMoveMode,
      lastAttackRoll: clonePlain(this.lastAttackRoll),
      actionLocked: this.actionLocked,
      postAttackMoveAvailable: this.postAttackMoveAvailable,
      eventDeck: clonePlain(this.eventDeck),
      currentEvent: clonePlain(this.currentEvent),
      lastEventDraws: clonePlain(this.lastEventDraws),
      lastEventResults: clonePlain(this.lastEventResults),
      pendingEventDiceRolls: clonePlain(this.pendingEventDiceRolls),
      phaseEffects: clonePlain(this.phaseEffects),
      selectedTileKey: this.selectedTileKey,
      lastAttackSummary: clonePlain(this.lastAttackSummary),
      playerScores: Array.from(this.playerScores.entries()),
      players: this.players.map((player) => ({
        ...clonePlain(player),
        discoveredTileKeys: Array.from(player.discoveredTileKeys ?? [])
      })),
      turnOrder: clonePlain(this.turnOrder),
      activePlayerIndex: this.activePlayerIndex,
      enemies: clonePlain(this.enemies),
      corpseBags: clonePlain(this.corpseBags),
      raidLog: clonePlain(this.raidLog),
      killLog: clonePlain(this.killLog),
      lastRaidSpawnKeys: Array.from(this.lastRaidSpawnKeys ?? []),
      lootedTileKeys: this.gameMap.tiles.filter((tile) => tile.looted).map((tile) => tileKey(tile))
    };
  }

  importSnapshot(snapshot) {
    if (!snapshot) {
      return;
    }

    this.raid = snapshot.raid;
    this.phase = snapshot.phase;
    this.maxPhase = snapshot.maxPhase;
    this.raidEnded = snapshot.raidEnded;
    this.raidResult = snapshot.raidResult;
    this.stashValue = snapshot.stashValue;
    this.selectedMoveMode = snapshot.selectedMoveMode;
    this.lastAttackRoll = clonePlain(snapshot.lastAttackRoll ?? []);
    this.actionLocked = snapshot.actionLocked;
    this.postAttackMoveAvailable = snapshot.postAttackMoveAvailable;
    this.eventDeck = clonePlain(snapshot.eventDeck ?? []);
    this.currentEvent = clonePlain(snapshot.currentEvent ?? null);
    this.lastEventDraws = clonePlain(snapshot.lastEventDraws ?? []);
    this.lastEventResults = clonePlain(snapshot.lastEventResults ?? []);
    this.pendingEventDiceRolls = clonePlain(snapshot.pendingEventDiceRolls ?? []);
    this.phaseEffects = clonePlain(snapshot.phaseEffects ?? this.createEmptyPhaseEffects());
    this.selectedTileKey = snapshot.selectedTileKey ?? null;
    this.lastAttackSummary = clonePlain(snapshot.lastAttackSummary ?? null);
    this.playerScores = new Map(snapshot.playerScores ?? []);
    this.players = (snapshot.players ?? []).map((player) => ({
      ...clonePlain(player),
      discoveredTileKeys: new Set(player.discoveredTileKeys ?? [])
    }));
    this.turnOrder = clonePlain(snapshot.turnOrder ?? []);
    this.activePlayerIndex = snapshot.activePlayerIndex ?? 0;
    this.enemies = clonePlain(snapshot.enemies ?? []);
    this.corpseBags = clonePlain(snapshot.corpseBags ?? []);
    this.raidLog = clonePlain(snapshot.raidLog ?? []);
    this.killLog = clonePlain(snapshot.killLog ?? []);
    this.lastRaidSpawnKeys = new Set(snapshot.lastRaidSpawnKeys ?? []);

    const lootedKeys = new Set(snapshot.lootedTileKeys ?? []);
    this.gameMap.tiles.forEach((tile) => {
      tile.looted = lootedKeys.has(tileKey(tile));
    });
  }

  shuffleEvents() {
    const cards = [...this.events];

    for (let i = cards.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    return cards;
  }

  createEmptyPhaseEffects() {
    return {
      staminaLimit: null,
      attackDamageModifier: 0
    };
  }

  getPlayerCount() {
    return 1 + this.aiCount;
  }

  createScoreMap() {
    return new Map(
      Array.from({ length: this.getPlayerCount() }, (_, index) => [`player_${index + 1}`, 0])
    );
  }

  createPlayers(count = this.getPlayerCount()) {
    const spawns = this.getRandomizedSpawnPoints(count);

    return Array.from({ length: count }, (_, index) => {
      const spawn = spawns[index]
        ?? this.gameMap.spawnPoints[0]
        ?? this.gameMap.tiles.find((tile) => tile.walkable);

      return this.createPlayer(index, spawn);
    });
  }

  createPlayer(index = 0, spawn = null) {
    const defaultIsAi = index > 0;
    const loadout = this.resolveRaidLoadout(index, defaultIsAi);
    const isAi = loadout.isAi ?? defaultIsAi;
    const armorId = this.armor[loadout.armorId] ? loadout.armorId : "lightSet";
    const armorState = this.createArmor(armorId);
    const staminaMax = this.getStaminaMaxForArmor(armorId, armorState);
    const id = `player_${index + 1}`;
    const fallbackWeaponId = isAi ? "SMG" : "AR";
    const weaponId = this.weapons[loadout.weaponId] ? loadout.weaponId : fallbackWeaponId;

    return {
      id,
      name: loadout.name ?? (isAi ? `COM ${index}` : "Player 1"),
      isAi,
      controllerId: loadout.controllerId ?? null,
      aiProfile: isAi ? getAiProfileId(index) : "human",
      position: spawn ? { q: spawn.q, r: spawn.r } : null,
      spawnSlot: spawn?.spawnSlot ?? null,
      assignedExtractionSlots: spawn?.spawnSlot ? [spawn.spawnSlot] : [],
      weaponId,
      staminaMax,
      stamina: staminaMax,
      armorId,
      armor: armorState,
      cosmetics: loadout.cosmetics ?? null,
      movementSpentThisPhase: 0,
      bodyHp: { ...this.playerTemplate.bodyHp },
      bagSlots: 20,
      bag: [],
      bagValue: 0,
      alive: true,
      dead: false,
      escaped: false,
      extractedThisRaid: false,
      taxiTicket: false,
      eventReactionMoveRemaining: 0,
      hpMoveUntilPhase: null,
      hpMoveMaxDistance: 0,
      hpMoveSpentThisPhase: 0,
      selfReviveKit: false,
      untargetablePhase: null,
      dashUpgradeUntilPhase: null,
      staminaLimitPhase: null,
      staminaLimitValue: null,
      attackDamageModifierPhase: null,
      attackDamageModifierValue: 0,
      scopeUntilRaid: false,
      drumUntilRaid: false,
      doubleLootPhase: null,
      insuranceUntilRaid: false,
      pendingInsuranceSelection: false,
      insuredItemKey: null,
      nextAttackDicePenalty: 0,
      playerRevealPhase: null,
      playerRevealRadius: 0,
      currentEvent: null,
      heldEventCards: [],
      pendingDiscardCount: 0,
      discoveredTileKeys: new Set(),
      orderCard: null,
      firstTurnBonus: null,
      firstTurnBonusUsed: false,
      totalStashValue: this.getPlayerScore(id)
    };
  }

  resolveRaidLoadout(index, isAi) {
    const configured = this.playerLoadouts[index] ?? {};
    const resolvedIsAi = configured.isAi ?? isAi;

    if (!resolvedIsAi) {
      return {
        ...configured,
        weaponId: this.raid > 1 ? this.getRandomWeaponId(configured.weaponId ?? "AR") : configured.weaponId
      };
    }

    if (this.raid <= 1 && (configured.weaponId || configured.armorId)) {
      return configured;
    }

    return this.chooseAiRaidLoadout(index, configured);
  }

  chooseAiRaidLoadout(index, fallback = {}) {
    const humanScore = this.getPlayerScore("player_1");
    const aiScore = this.getPlayerScore(`player_${index + 1}`);
    const behind = aiScore + 20 < humanScore;
    const profile = (this.raid + index + (behind ? 1 : 0)) % 4;
    const plans = [
      { weaponId: "AR", armorId: "lightSet" },
      { weaponId: "DMR", armorId: "lightSet" },
      { weaponId: "SMG", armorId: "heavySet" },
      { weaponId: "SR", armorId: "heavySet" }
    ];
    const plan = behind
      ? (this.raid >= 3 ? { weaponId: "SR", armorId: "heavySet" } : { weaponId: "DMR", armorId: "lightSet" })
      : plans[profile];

    return {
      weaponId: this.weapons[plan.weaponId] ? plan.weaponId : fallback.weaponId,
      armorId: this.armor[plan.armorId] ? plan.armorId : fallback.armorId
    };
  }

  getRandomWeaponId(excludeWeaponId = null) {
    const weaponIds = Object.keys(this.weapons);
    const candidates = weaponIds.filter((weaponId) => weaponId !== excludeWeaponId);
    const pool = candidates.length > 0 ? candidates : weaponIds;
    return pool[Math.floor(Math.random() * pool.length)] ?? excludeWeaponId ?? "AR";
  }

  getRandomizedSpawnPoints(count) {
    const spawnPool = [...this.gameMap.spawnPoints];

    for (let i = spawnPool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [spawnPool[i], spawnPool[j]] = [spawnPool[j], spawnPool[i]];
    }

    const previousSpawnKeys = this.lastRaidSpawnKeys ?? new Set();
    const sortedByFreshness = spawnPool.sort((a, b) => {
      const aUsed = previousSpawnKeys.has(tileKey(a)) ? 1 : 0;
      const bUsed = previousSpawnKeys.has(tileKey(b)) ? 1 : 0;
      return aUsed - bUsed;
    });

    if (sortedByFreshness.length >= count) {
      return sortedByFreshness.slice(0, count);
    }

    if (sortedByFreshness.length === 0) {
      return [];
    }

    const fallback = [...sortedByFreshness];
    while (fallback.length < count) {
      fallback.push(sortedByFreshness[fallback.length % sortedByFreshness.length]);
    }

    return fallback;
  }

  drawTurnOrder() {
    const deck = Array.from({ length: 8 }, (_, index) => index + 1);

    for (let i = deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const order = this.players
      .map((player, playerIndex) => ({ player, playerIndex }))
      .filter(({ player }) => this.isPlayerActive(player))
      .map(({ player, playerIndex }) => {
      const card = deck[playerIndex];
      player.orderCard = card;
      player.firstTurnBonus = this.getFirstTurnBonus(card);
      player.firstTurnBonusUsed = false;
      return { playerIndex, card };
      });

    order.sort((a, b) => a.card - b.card);
    return order;
  }

  getFirstTurnBonus(card) {
    if (card >= 8) {
      return {
        moveRangeBonus: 1,
        lootStaminaDiscount: 1,
        label: "move +1 / loot +1"
      };
    }

    if (card >= 5) {
      return {
        moveRangeBonus: 1,
        lootStaminaDiscount: 0,
        label: "move +1"
      };
    }

    return {
      moveRangeBonus: 0,
      lootStaminaDiscount: 0,
      label: "none"
    };
  }

  getActiveFirstTurnBonus() {
    if (this.phase !== 1) {
      return {
        moveRangeBonus: 0,
        lootStaminaDiscount: 0,
        label: "none"
      };
    }

    return this.player.firstTurnBonus ?? {
      moveRangeBonus: 0,
      lootStaminaDiscount: 0,
      label: "none"
    };
  }

  createEnemies() {
    return [];
  }

  getPlayerScore(playerOrId) {
    const id = typeof playerOrId === "string" ? playerOrId : playerOrId?.id;
    return this.playerScores.get(id) ?? 0;
  }

  getGameSummary() {
    const standings = this.players
      .map((player) => ({
        id: player.id,
        name: player.name,
        score: this.getPlayerScore(player),
        extractedThisRaid: player.extractedThisRaid,
        dead: player.dead,
        escaped: player.escaped
      }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    const topScore = standings[0]?.score ?? 0;
    const winners = standings.filter((entry) => entry.score === topScore);

    return {
      raid: this.raid,
      phase: this.phase,
      standings,
      winners
    };
  }

  awardPlayerScore(player, value) {
    if (!player?.id || value <= 0) {
      return;
    }

    const nextScore = this.getPlayerScore(player.id) + value;
    this.playerScores.set(player.id, nextScore);
    player.totalStashValue = nextScore;
  }

  createArmor(armorId) {
    const armorData = this.armor[armorId];

    if (!armorData) {
      return null;
    }

    return {
      id: armorId,
      name: armorData.name,
      durability: armorData.durability,
      maxDurability: armorData.durability
    };
  }

  get selectedTile() {
    if (!this.selectedTileKey) {
      return null;
    }

    return this.gameMap.tilesByKey.get(this.selectedTileKey) ?? null;
  }

  selectTile(tile) {
    this.selectedTileKey = tileKey(tile);
  }

  setWeapon(weaponId) {
    if (this.weapons[weaponId]) {
      this.player.weaponId = weaponId;
    }
  }

  setMoveMode(moveMode) {
    if (["walk", "dash"].includes(moveMode)) {
      this.selectedMoveMode = moveMode;
    }
  }

  getSelectedMoveAction() {
    const bonusRange = this.getActiveFirstTurnBonus().moveRangeBonus;

    if (this.postAttackMoveAvailable) {
      return {
        id: "postAttackMove",
        label: "AR bonus move",
        staminaCost: 1,
        range: 1
      };
    }

    if (this.selectedMoveMode === "dash") {
      const availableStamina = this.getAvailableStamina();

      if (availableStamina < 2 && availableStamina >= 1) {
        return {
          id: "walk",
          label: "Move",
          staminaCost: 1,
          range: 1 + bonusRange
        };
      }

      return {
        id: "dash",
        label: "Dash",
        staminaCost: 2,
        range: 3 + bonusRange
      };
    }

    return {
      id: "walk",
      label: "Move",
      staminaCost: 1,
      range: 1 + bonusRange
    };
  }

  setPlayerArmor(armorId) {
    if (!this.armor[armorId]) {
      return;
    }

    this.player.armorId = armorId;
    this.player.armor = this.createArmor(armorId);
    this.player.staminaMax = this.getPlayerStaminaMax();
    this.player.stamina = Math.min(this.player.stamina, this.player.staminaMax);
    this.player.movementSpentThisPhase = 0;
  }

  getPlayerStaminaMax() {
    return this.getStaminaMaxForArmor(this.player.armorId, this.player.armor);
  }

  getStaminaMaxForArmor(armorId, armorState) {
    const armorData = this.armor[armorId];
    const bonus = this.isArmorActive(armorState) ? armorData?.staminaBonusPerTurn ?? 0 : 0;

    return this.playerTemplate.stamina.base + bonus;
  }

  getRemainingMovePoints() {
    const armorData = this.armor[this.player.armorId];
    const armorMoveLimit = this.isArmorActive(this.player.armor)
      ? armorData?.maxMoveActionsPerTurn
      : null;

    const armorLimit = armorMoveLimit === null || armorMoveLimit === undefined
      ? Number.POSITIVE_INFINITY
      : Math.max(0, armorMoveLimit - this.player.movementSpentThisPhase);

    return armorLimit;
  }

  getAvailableStamina() {
    const playerLimit = this.player.staminaLimitPhase === this.phase
      ? this.player.staminaLimitValue
      : null;

    return playerLimit === null || playerLimit === undefined
      ? this.player.stamina
      : Math.min(this.player.stamina, playerLimit);
  }

  isArmorActive(armorState) {
    return Boolean(armorState && armorState.durability > 0);
  }

  get selectedWeapon() {
    return this.getEffectiveWeapon(this.player);
  }

  getEffectiveWeapon(player = this.player) {
    const baseWeapon = this.weapons[player?.weaponId];

    if (!baseWeapon) {
      return null;
    }

    const weapon = {
      ...baseWeapon,
      damage: { ...baseWeapon.damage }
    };

    if (player.scopeUntilRaid && ["AR", "DMR", "SR"].includes(player.weaponId)) {
      weapon.range += 6;
    }

    if (player.drumUntilRaid && ["AR", "SMG"].includes(player.weaponId)) {
      weapon.attackDice += 1;
    }

    if (player.nextAttackDicePenalty > 0) {
      weapon.attackDice = Math.max(1, weapon.attackDice - player.nextAttackDicePenalty);
    }

    return weapon;
  }

  getVisionRange(player = this.player) {
    const weapon = this.getEffectiveWeapon(player);
    const baseRange = 6;

    if (!weapon) {
      return baseRange;
    }

    if (["DMR", "SR"].includes(player.weaponId)) {
      return Math.max(baseRange, weapon.range);
    }

    return baseRange;
  }

  isTileVisibleToPlayer(tile, player = this.player) {
    if (!tile || !player?.position) {
      return false;
    }

    if (tileKey(tile) === tileKey(player.position)) {
      return true;
    }

    return hexDistance(player.position, tile) <= this.getVisionRange(player)
      && this.hasLineOfSight(player.position, tile);
  }

  getVisibleTileKeys(player = this.player) {
    const visibleKeys = new Set();

    if (!player?.position) {
      return visibleKeys;
    }

    this.gameMap.tiles.forEach((tile) => {
      if (this.isTileVisibleToPlayer(tile, player)) {
        visibleKeys.add(tileKey(tile));
      }
    });

    visibleKeys.add(tileKey(player.position));
    return visibleKeys;
  }

  revealVisibleTiles(player = this.player) {
    if (!player?.discoveredTileKeys) {
      return;
    }

    this.getVisibleTileKeys(player).forEach((key) => player.discoveredTileKeys.add(key));
  }

  getDiscoveredTileKeys(player = this.player) {
    return player?.discoveredTileKeys ?? new Set();
  }

  getMovementTiles() {
    if (this.raidEnded || this.actionLocked || !this.player.position) {
      return [];
    }

    return this.getMovementEntries().map((entry) => entry.tile);
  }

  getMovementEntries() {
    const movePoints = this.getAutoMoveRange();

    if (
      this.raidEnded ||
      this.actionLocked ||
      !this.player.position ||
      movePoints <= 0
    ) {
      return [];
    }

    return getReachableWalkableTiles(this.gameMap, this.player.position, movePoints)
      .filter((entry) => !this.getTargetAt(entry.tile))
      .map((entry) => ({
        ...entry,
        staminaCost: this.getMoveStaminaCostForDistance(entry.cost)
      }));
  }

  getMovementEntryTo(tile) {
    if (!tile) {
      return null;
    }

    return this.getMovementEntries()
      .find((moveEntry) => tileKey(moveEntry.tile) === tileKey(tile)) ?? null;
  }

  getAutoMoveRange() {
    if (this.postAttackMoveAvailable) {
      return Math.min(1, this.getRemainingMovePoints());
    }

    const availableStamina = this.getAvailableStamina();

    if (availableStamina <= 0 && this.canUseHpMove()) {
      return Math.min(this.getRemainingHpMoveDistance(), this.player.bodyHp.chest - 1, this.getRemainingMovePoints());
    }

    if (availableStamina >= 2) {
      const dashRange = this.player.dashUpgradeUntilPhase >= this.phase ? 4 : 3;
      return Math.min(dashRange + this.getActiveFirstTurnBonus().moveRangeBonus, this.getRemainingMovePoints());
    }

    if (availableStamina >= 1) {
      return Math.min(1 + this.getActiveFirstTurnBonus().moveRangeBonus, this.getRemainingMovePoints());
    }

    return 0;
  }

  getMoveStaminaCostForDistance(distance) {
    if (this.postAttackMoveAvailable) {
      return 1;
    }

    if (this.getAvailableStamina() <= 0 && this.canUseHpMove()) {
      return 0;
    }

    const walkRange = 1 + this.getActiveFirstTurnBonus().moveRangeBonus;
    return distance <= walkRange ? 1 : 2;
  }

  canUseHpMove() {
    return this.player.hpMoveUntilPhase === this.phase &&
      this.player.bodyHp.chest > 1 &&
      this.getRemainingHpMoveDistance() > 0;
  }

  getRemainingHpMoveDistance() {
    const maxDistance = this.player.hpMoveMaxDistance ?? 5;
    const spent = this.player.hpMoveSpentThisPhase ?? 0;

    return Math.max(0, maxDistance - spent);
  }

  getMovementOptionTo(tile) {
    const entry = this.getMovementEntryTo(tile);

    if (!entry) {
      return null;
    }

    return {
      distance: entry.cost,
      staminaCost: entry.staminaCost,
      hpCost: this.getAvailableStamina() <= 0 && this.canUseHpMove() ? entry.cost : 0,
      label: this.getAvailableStamina() <= 0 && this.canUseHpMove() ? `HP-${entry.cost}` : `-${entry.staminaCost}`
    };
  }

  getMovementCostTo(tile) {
    return this.getMovementEntryTo(tile)?.cost ?? null;
  }

  getMovementPathTo(tile) {
    return this.getMovementEntryTo(tile)?.path?.map((step) => ({ ...step })) ?? null;
  }

  getOccupiedTileKeys({ ignorePlayerId = null, ignoreEnemyId = null } = {}) {
    const occupiedKeys = new Set();

    this.players.forEach((player) => {
      if (!player.position || player.id === ignorePlayerId || !this.isPlayerActive(player)) {
        return;
      }

      occupiedKeys.add(tileKey(player.position));
    });

    this.enemies.forEach((enemy) => {
      if (!enemy.position || enemy.id === ignoreEnemyId || !enemy.alive) {
        return;
      }

      occupiedKeys.add(tileKey(enemy.position));
    });

    return occupiedKeys;
  }

  findPathToTile(origin, tile, { ignorePlayerId = null } = {}) {
    if (!origin || !tile) {
      return null;
    }

    return findWalkablePath(this.gameMap, origin, tile, {
      blockedKeys: this.getOccupiedTileKeys({ ignorePlayerId })
    });
  }

  getExtractionTilesForPlayer(player = this.player) {
    return this.gameMap.extractionPoints.filter((tile) => this.canPlayerExtractFromTile(player, tile));
  }

  getWeaponRangeTiles() {
    if (!this.player.position || this.raidEnded) {
      return [];
    }

    const weapon = this.selectedWeapon;

    return this.gameMap.tiles.filter((tile) => {
      return hexDistance(this.player.position, tile) <= weapon.range;
    });
  }

  getAttackableTargets() {
    if (!this.player.position || this.raidEnded || this.actionLocked || this.postAttackMoveAvailable || this.getAvailableStamina() < 1) {
      return [];
    }

    return this.getAttackTargets().filter((target) => this.canAttackTarget(target));
  }

  getAttackableEnemies() {
    return this.getAttackableTargets();
  }

  getAttackTargets() {
    const enemyTargets = this.enemies.filter((enemy) => enemy.alive);
    const playerTargets = this.players.filter((player, index) => {
      return index !== this.activePlayerIndex && !player.escaped && !player.dead && player.position;
    });

    return [...enemyTargets, ...playerTargets];
  }

  canAttackTarget(target) {
    if (target.untargetablePhase === this.phase) {
      return false;
    }

    const weapon = this.selectedWeapon;
    const distance = hexDistance(this.player.position, target.position);

    return distance <= weapon.range && this.hasLineOfSight(this.player.position, target.position);
  }

  hasLineOfSight(from, to) {
    const line = hexLine(from, to).slice(1, -1);

    return !line.some((hex) => {
      const tile = this.gameMap.tilesByKey.get(tileKey(hex));
      return tile?.blocksSight || (tile && !tile.walkable);
    });
  }

  getEnemyAt(tile) {
    const target = this.getTargetAt(tile);
    return target?.id?.startsWith("enemy_") ? target : null;
  }

  getTargetAt(tile) {
    const key = tileKey(tile);
    return this.getAttackTargets().find((target) => tileKey(target.position) === key) ?? null;
  }

  canAttackSelectedTile() {
    if (!this.selectedTile) {
      return false;
    }

    const target = this.getTargetAt(this.selectedTile);
    return Boolean(target && !this.actionLocked && !this.postAttackMoveAvailable && this.getAvailableStamina() >= 1 && this.canAttackTarget(target));
  }

  attackSelectedEnemy() {
    if (!this.canAttackSelectedTile()) {
      return null;
    }

    const enemy = this.getTargetAt(this.selectedTile);
    const weapon = this.selectedWeapon;
    const distance = hexDistance(this.player.position, enemy.position);
    const roll = this.rollWeaponDice(weapon.attackDice);
    if (this.player.nextAttackDicePenalty > 0) {
      this.player.nextAttackDicePenalty = 0;
      this.player.heldEventCards = this.player.heldEventCards.filter((entry) => entry.card?.effect?.type !== "nextAttackDicePenalty");
    }
    const targetTile = this.gameMap.tilesByKey.get(tileKey(enemy.position));
    const weaponHits = this.applyWeaponPassives(roll.filter((face) => face.bodyPart), weapon, distance);
    const coverHits = this.applyCoverToHits(weaponHits, targetTile);
    const damageEvents = this.buildDamageEvents(coverHits, weapon, distance);
    const finalDamageEvents = this.applyArmorToDamageEvents(damageEvents, enemy);

    finalDamageEvents.forEach((damageEvent) => {
      applyBodyDamage(enemy, damageEvent.bodyPart, damageEvent.damage);
    });

    if (enemy.bodyHp.head <= 0 || enemy.bodyHp.chest <= 0) {
      this.checkPlayerDeath(enemy, "eliminated", this.player);
    } else {
      this.applyReactionMoveIfNeeded(enemy, finalDamageEvents, this.player.position);
    }

    this.lastAttackRoll = roll;
    this.lastAttackSummary = {
      from: { ...this.player.position },
      to: { ...enemy.position },
      attackerId: this.player.id,
      targetId: enemy.id,
      shotCount: weaponHits.length,
      resolvedHitCount: coverHits.length,
      damageEvents: finalDamageEvents.map((event) => ({ ...event }))
    };
    this.player.stamina = Math.max(0, this.player.stamina - 1);
    this.postAttackMoveAvailable = weapon.passive === "moveOneAfterAttackIfStaminaRemains" && this.getAvailableStamina() >= 1;
    this.actionLocked = !this.postAttackMoveAvailable;

    if (this.postAttackMoveAvailable) {
      this.raidLog.unshift("AR effect: 1 tile move available");
    }
    this.raidLog.unshift(`${weapon.name} attack: ${roll.map((face) => face.label).join(", ")}`);

    return { enemy, weapon, roll, hits: coverHits, damageEvents: finalDamageEvents };
  }

  applyWeaponPassives(hits, weapon, distance) {
    if (weapon.passive === "legsBecomeHeadAtRangeOneToFive" && distance >= 1 && distance <= 5) {
      return hits.map((hit) => {
        if (hit.bodyPart !== "legs") {
          return hit;
        }

        return {
          ...hit,
          id: "head_from_legs",
          label: "Head",
          bodyPart: "head"
        };
      });
    }

    return hits;
  }

  buildDamageEvents(hits, weapon, distance) {
    const events = hits.map((hit) => {
      let damage = weapon.damage[hit.bodyPart] ?? 0;

      if (
        weapon.passive === "doubleHeadChestAbdomenAtRangeOneToTwo" &&
        distance >= 1 &&
        distance <= 2 &&
        ["head", "chest", "abdomen"].includes(hit.bodyPart)
      ) {
        damage *= 2;
      }

      return {
        bodyPart: hit.bodyPart,
        damage
      };
    });

    if (weapon.passive === "bonusTwoChestResults") {
      const chestCount = events.filter((event) => event.bodyPart === "chest").length;

      if (chestCount >= 2) {
        events.push({ bodyPart: "chest", damage: 2 });
        this.raidLog.unshift("DMR effect: bonus chest damage +2");
      }
    }

    return events;
  }

  applyArmorToDamageEvents(damageEvents, target) {
    if (damageEvents.length === 0) {
      return damageEvents;
    }

    const armorActive = this.isArmorActive(target.armor);
    const armorData = armorActive ? this.armor[target.armor.id] : null;
    const protectedEvents = damageEvents.map((damageEvent) => {
      const protection = armorActive ? armorData?.protection?.[damageEvent.bodyPart] ?? 0 : 0;

      return {
        ...damageEvent,
        damage: Math.max(0, damageEvent.damage + this.getAttackDamageModifier(this.player) - protection)
      };
    });

    if (armorActive) {
      target.armor.durability = Math.max(0, target.armor.durability - 1);
      this.raidLog.unshift(`Armor durability ${target.armor.durability}/${target.armor.maxDurability}`);
    }

    return protectedEvents.filter((damageEvent) => damageEvent.damage > 0);
  }

  getAttackDamageModifier(player = this.player) {
    return player.attackDamageModifierPhase === this.phase
      ? player.attackDamageModifierValue ?? 0
      : 0;
  }

  applyCoverToHits(hits, targetTile) {
    if (!targetTile || targetTile.cover === "none" || hits.length === 0) {
      return hits;
    }

    const reduction = targetTile.cover === "hard" ? 1 : 0;

    if (reduction > 0) {
      this.raidLog.unshift("Cover effect: reduce hits by 1");
    }

    return hits.slice(0, Math.max(0, hits.length - reduction));
  }

  rollWeaponDice(count) {
    const faces = this.dice.weaponHitDie.faces;
    const results = [];

    for (let i = 0; i < count; i += 1) {
      results.push(faces[Math.floor(Math.random() * faces.length)]);
    }

    return results;
  }

  canMoveTo(tile) {
    return this.getMovementTiles().some((moveTile) => tileKey(moveTile) === tileKey(tile));
  }

  movePlayer(tile) {
    const entry = this.getMovementEntryTo(tile);

    if (!entry) {
      return null;
    }

    const moveOption = {
      distance: entry.cost,
      staminaCost: entry.staminaCost,
      hpCost: this.getAvailableStamina() <= 0 && this.canUseHpMove() ? entry.cost : 0
    };
    const from = { ...this.player.position };
    this.player.position = { q: tile.q, r: tile.r };
    if (moveOption.hpCost > 0) {
      this.player.bodyHp.chest = Math.max(1, this.player.bodyHp.chest - moveOption.hpCost);
      this.player.hpMoveSpentThisPhase = (this.player.hpMoveSpentThisPhase ?? 0) + moveOption.distance;
    } else {
      this.player.stamina = Math.max(0, this.player.stamina - moveOption.staminaCost);
    }
    this.player.movementSpentThisPhase += moveOption.distance;
    if (this.postAttackMoveAvailable) {
      this.postAttackMoveAvailable = false;
      this.actionLocked = true;
    }
    this.selectTile(tile);
    this.revealVisibleTiles(this.player);
    const extracted = this.checkExtraction();

    return {
      from,
      to: { q: tile.q, r: tile.r },
      distance: moveOption.distance,
      staminaCost: moveOption.staminaCost,
      hpCost: moveOption.hpCost,
      path: entry.path?.map((step) => ({ ...step })) ?? [from, { q: tile.q, r: tile.r }],
      extracted
    };
  }

  canLoot() {
    const tile = this.currentTile;
    return Boolean(
      !this.raidEnded &&
      !this.actionLocked &&
      !this.postAttackMoveAvailable &&
      tile &&
      tile.lootType !== "none" &&
      !tile.looted &&
      this.getAvailableStamina() >= this.getLootCost()
    );
  }

  lootCurrentTile() {
    if (!this.canLoot()) {
      return null;
    }

    const lootType = this.currentTile.lootType;
    const table = this.lootTables[lootType] ?? [];

    if (table.length === 0) {
      return null;
    }

    const drawCount = this.player.doubleLootPhase === this.phase ? 2 : 1;
    const drawnItems = [];

    for (let i = 0; i < drawCount; i += 1) {
      drawnItems.push(this.drawWeightedLootItem(table));
    }

    const item = drawnItems[0];
    this.player.stamina -= this.getLootCost();
    this.currentTile.looted = true;
    drawnItems.forEach((lootItem) => this.addItemToBag(lootItem));
    this.raidLog.unshift(`${drawnItems.map((lootItem) => lootItem.name).join(", ")} acquired`);
    return {
      ...item,
      items: drawnItems
    };
  }

  getLootCost() {
    const bonus = this.getActiveFirstTurnBonus();
    return Math.max(0, 1 - bonus.lootStaminaDiscount);
  }

  addItemToBag(item, player = this.player) {
    player.bag.push(item);
    player.bag.sort((a, b) => b.value - a.value);

    if (player.bag.length > player.bagSlots) {
      player.bag.pop();
    }

    player.bagValue = player.bag.reduce((sum, bagItem) => sum + bagItem.value, 0);
  }

  drawWeightedLootItem(table) {
    const totalWeight = table.reduce((sum, item) => sum + Math.max(0, Number(item.weight ?? 1)), 0);

    if (totalWeight <= 0) {
      return { ...table[Math.floor(Math.random() * table.length)] };
    }

    let roll = Math.random() * totalWeight;

    for (const item of table) {
      roll -= Math.max(0, Number(item.weight ?? 1));
      if (roll <= 0) {
        return { ...item };
      }
    }

    return { ...table[table.length - 1] };
  }

  get currentTile() {
    if (!this.player.position) {
      return null;
    }

    return this.gameMap.tilesByKey.get(tileKey(this.player.position)) ?? null;
  }

  getTileForPlayer(player) {
    if (!player?.position) {
      return null;
    }

    return this.gameMap.tilesByKey.get(tileKey(player.position)) ?? null;
  }

  drawEventCard() {
    return this.drawEventCardForPlayer(this.player, this.activePlayerIndex);
  }

  drawEventCardForPlayer(player, playerIndex) {
    if (this.eventDeck.length === 0) {
      this.eventDeck = this.shuffleEvents();
    }

    const card = this.eventDeck.shift();
    player.currentEvent = card;
    if (playerIndex === this.activePlayerIndex) {
      this.currentEvent = card;
    }
    this.raidLog.unshift(`Event: ${player.name} - ${card.name}`);
    this.applyEvent(card, player);
    return { playerIndex, playerId: player.id, playerName: player.name, card };
  }

  drawEventCardsForActivePlayers() {
    const draws = this.turnOrder
      .filter((entry) => this.isPlayerActive(this.players[entry.playerIndex]))
      .map((entry) => this.drawEventCardForPlayer(this.players[entry.playerIndex], entry.playerIndex));

    this.lastEventDraws = draws;
    this.currentEvent = this.player?.currentEvent ?? draws[0]?.card ?? null;
    return draws;
  }

  consumeEventDraws() {
    const draws = this.lastEventDraws ?? [];
    this.lastEventDraws = [];
    return draws;
  }

  consumePendingEventDiceRolls() {
    const rolls = this.pendingEventDiceRolls ?? [];
    this.pendingEventDiceRolls = [];
    return rolls;
  }

  consumeEventResults() {
    const results = this.lastEventResults ?? [];
    this.lastEventResults = [];
    return results;
  }

  recordEventResult(result) {
    this.lastEventResults.push({
      raid: this.raid,
      phase: this.phase,
      ...result
    });
  }

  triggerEventForPlayer(eventId, playerIndex = this.activePlayerIndex) {
    const player = this.players[playerIndex];
    const card = this.events.find((eventCard) => eventCard.id === eventId || String(eventCard.number) === String(eventId));

    if (!player || !card) {
      return null;
    }

    player.currentEvent = card;
    if (playerIndex === this.activePlayerIndex) {
      this.currentEvent = card;
    }

    this.raidLog.unshift(`Debug Event: ${player.name} - ${card.name}`);
    this.applyEvent(card, player);

    return { player, card, playerIndex };
  }

  applyEvent(card, player = this.player) {
    const effect = card.effect;

    switch (effect.type) {
      case "damageIfOnLootTile":
        if (this.getTileForPlayer(player)?.lootType !== "none") {
          this.damagePlayerParts({
            abdomen: effect.arms ?? 0,
            legs: effect.legs ?? 0
          }, player);
        }
        break;
      case "damageBodyParts":
        this.damagePlayerParts({
          abdomen: effect.abdomen ?? 0,
          legs: effect.legs ?? 0
        }, player);
        break;
      case "gainTaxiTicket":
        player.taxiTicket = true;
        this.rememberHeldEventCard(player, card, "raid");
        this.raidLog.unshift(`${player.name} taxi ticket acquired`);
        break;
      case "cannotBeAttackTarget":
        player.untargetablePhase = this.phase;
        this.rememberHeldEventCard(player, card, "phase");
        break;
      case "drawLoot":
        this.recordEventResult({
          type: "loot",
          playerId: player.id,
          playerName: player.name,
          card,
          items: this.drawLootByType(effect.lootType, effect.count ?? 1, player)
        });
        break;
      case "limitStaminaThisPhase":
        player.staminaLimitPhase = this.phase;
        player.staminaLimitValue = effect.value;
        player.stamina = Math.min(player.stamina, effect.value);
        this.rememberHeldEventCard(player, card, "phase");
        break;
      case "modifyAttackDamage":
        player.attackDamageModifierPhase = this.phase;
        player.attackDamageModifierValue = (player.attackDamageModifierValue ?? 0) + effect.value;
        this.rememberHeldEventCard(player, card, "phase");
        break;
      case "rollBodyPartDamage":
        this.pendingEventDiceRolls.push({
          playerIndex: this.players.findIndex((entry) => entry.id === player.id),
          playerId: player.id,
          playerName: player.name,
          damage: effect.damage
        });
        break;
      case "discardBagItem":
        if (player.isAi) {
          this.discardBagItems(effect.count ?? 1, player);
        } else {
          player.pendingDiscardCount = Math.min(effect.count ?? 1, player.bag.length);
          if (player.pendingDiscardCount <= 0) {
            this.discardBagItems(effect.count ?? 1, player);
          } else {
            this.raidLog.unshift(`${player.name} must discard ${player.pendingDiscardCount} bag item(s)`);
          }
        }
        break;
      case "hpMoveWhenExhausted":
        player.hpMoveUntilPhase = this.phase;
        player.hpMoveMaxDistance = effect.maxDistance ?? 5;
        player.hpMoveSpentThisPhase = 0;
        this.rememberHeldEventCard(player, card, "phase");
        this.raidLog.unshift(`HP movement ready: up to ${effect.maxDistance ?? 5} tiles`);
        break;
      case "gainSelfRevive":
        player.selfReviveKit = true;
        this.rememberHeldEventCard(player, card, "raid");
        this.raidLog.unshift("Self revive kit acquired");
        break;
      case "healAllBodyParts":
        this.healAllBodyParts(player);
        this.raidLog.unshift("All body parts healed");
        break;
      case "dashUpgradeUntilNextEvent":
        player.dashUpgradeUntilPhase = this.phase + 3;
        this.rememberHeldEventCard(player, card, "phase");
        this.raidLog.unshift("Dash upgraded until next event phase");
        break;
      case "rangeBonusUntilRaidEnd":
        player.scopeUntilRaid = true;
        this.rememberHeldEventCard(player, card, "raid");
        this.raidLog.unshift("Scope acquired");
        break;
      case "diceBonusUntilRaidEnd":
        player.drumUntilRaid = true;
        this.rememberHeldEventCard(player, card, "raid");
        this.raidLog.unshift("Drum magazine acquired");
        break;
      case "doubleLootThisPhase":
        player.doubleLootPhase = this.phase;
        this.rememberHeldEventCard(player, card, "phase");
        this.raidLog.unshift("Double loot active this phase");
        break;
      case "revealPlayersInRadiusThisPhase":
        player.playerRevealPhase = this.phase;
        player.playerRevealRadius = effect.radius ?? 7;
        this.rememberHeldEventCard(player, card, "phase");
        this.raidLog.unshift(`Headset active: player positions within ${effect.radius ?? 7} tiles`);
        break;
      case "nextAttackDicePenalty":
        player.nextAttackDicePenalty = Math.max(player.nextAttackDicePenalty ?? 0, effect.value ?? 1);
        this.rememberHeldEventCard(player, card, "attack");
        this.raidLog.unshift(`Weapon jam: next attack dice -${effect.value ?? 1}`);
        break;
      case "insureRaidItem":
        player.insuranceUntilRaid = true;
        player.pendingInsuranceSelection = true;
        this.rememberHeldEventCard(player, card, "raid");
        this.raidLog.unshift("Insurance active: choose one bag item to preserve");
        break;
      default:
        this.raidLog.unshift(`${card.name} effect is not handled: ${effect.type}`);
        break;
    }
  }

  damagePlayerParts(damageByPart, player = this.player) {
    Object.entries(damageByPart).forEach(([bodyPart, damage]) => {
      applyBodyDamage(player, bodyPart, damage);
    });
    this.checkPlayerDeath(player, "event damage");
    this.raidLog.unshift(`${player.name} event damage applied`);
  }

  rememberHeldEventCard(player, card, duration) {
    player.heldEventCards.push({
      card,
      duration,
      raid: this.raid,
      phase: this.phase
    });
  }

  damageRandomBodyPart(damage, player = this.player) {
    const parts = ["head", "chest", "abdomen", "legs"];
    const bodyPart = parts[Math.floor(Math.random() * parts.length)];
    applyBodyDamage(player, bodyPart, damage);
    this.checkPlayerDeath(player, "event damage");
    this.raidLog.unshift(`${player.name} event damage: ${bodyPart} -${damage}`);
  }

  damageRandomBodyPartByWeaponDie(damage, player = this.player) {
    const [face] = this.rollWeaponDice(1);
    this.lastAttackRoll = [face];

    if (!face?.bodyPart) {
      this.raidLog.unshift(`${player.name} event die: miss`);
      return;
    }

    applyBodyDamage(player, face.bodyPart, damage);
    this.checkPlayerDeath(player, "event damage");
    this.raidLog.unshift(`${player.name} event die: ${face.bodyPart} -${damage}`);
  }

  resolveEventDiceRoll(rollEntry) {
    const player = this.players.find((entry) => entry.id === rollEntry.playerId);

    if (!player || player.dead || player.escaped) {
      return null;
    }

    const [face] = this.rollWeaponDice(1);
    const damageEvents = [];
    this.lastAttackRoll = [face];

    if (face?.bodyPart) {
      applyBodyDamage(player, face.bodyPart, rollEntry.damage);
      damageEvents.push({ bodyPart: face.bodyPart, damage: rollEntry.damage });
      this.checkPlayerDeath(player, "event damage");
      this.raidLog.unshift(`${player.name} event die: ${face.bodyPart} -${rollEntry.damage}`);
    } else {
      this.raidLog.unshift(`${player.name} event die: miss`);
    }

    return {
      ...rollEntry,
      player,
      roll: [face],
      damageEvents
    };
  }

  drawLootByType(lootType, count, player = this.player) {
    const drawnItems = [];

    for (let i = 0; i < count; i += 1) {
      const table = this.lootTables[lootType] ?? [];
      if (table.length === 0) continue;
      const item = this.drawWeightedLootItem(table);
      this.addItemToBag(item, player);
      drawnItems.push(item);
    }
    const itemNames = drawnItems.map((item) => item.name).join(", ");
    this.raidLog.unshift(`${player.name} ${lootType} loot x${count} acquired${itemNames ? `: ${itemNames}` : ""}`);

    return drawnItems;
  }

  healAllBodyParts(player) {
    player.bodyHp = { ...this.playerTemplate.bodyHp };
  }

  discardBagItems(count, player = this.player) {
    const discardCount = Math.min(count, player.bag.length);

    for (let i = 0; i < discardCount; i += 1) {
      player.bag.pop();
    }
    player.bagValue = player.bag.reduce((sum, bagItem) => sum + bagItem.value, 0);
    this.raidLog.unshift(`${player.name} discarded ${discardCount} bag item(s)`);
  }

  discardSelectedBagItem(itemIndex, player = this.player) {
    if (!player || player.pendingDiscardCount <= 0 || itemIndex < 0 || itemIndex >= player.bag.length) {
      return null;
    }

    const [item] = player.bag.splice(itemIndex, 1);
    player.pendingDiscardCount = Math.max(0, player.pendingDiscardCount - 1);
    player.bagValue = player.bag.reduce((sum, bagItem) => sum + bagItem.value, 0);
    this.raidLog.unshift(`${player.name} discarded ${item.name}`);
    return item;
  }

  insureBagItem(itemIndex, player = this.player) {
    if (!player?.insuranceUntilRaid || itemIndex < 0 || itemIndex >= player.bag.length) {
      return null;
    }

    player.insuredItemKey = getBagItemInsuranceKey(player.bag[itemIndex], itemIndex);
    player.pendingInsuranceSelection = false;
    this.raidLog.unshift(`${player.name} insured ${player.bag[itemIndex].name}`);
    return player.bag[itemIndex];
  }

  checkPlayerDeath(player, reason = "dead", killer = null) {
    if (!player || player.dead || player.escaped) {
      return false;
    }

    if (player.bodyHp.head > 0 && player.bodyHp.chest > 0) {
      return false;
    }

    if (player.selfReviveKit) {
      player.selfReviveKit = false;
      this.healAllBodyParts(player);
      player.heldEventCards = player.heldEventCards.filter((entry) => entry.card?.effect?.type !== "gainSelfRevive");
      this.raidLog.unshift(`${player.name} used self revive kit`);
      return false;
    }

    this.killPlayer(player, reason, killer);
    return true;
  }

  killPlayer(player, reason = "dead", killer = null) {
    const lostValue = player.bagValue;
    const deathPosition = player.position ? { ...player.position } : null;
    const corpseItems = player.bag.map((item) => ({ ...item }));

    if (deathPosition) {
      this.corpseBags.push({
        id: `corpse_${player.id}_${this.raid}_${this.phase}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        ownerId: player.id,
        ownerName: player.name,
        position: deathPosition,
        items: corpseItems,
        opened: false
      });
    }

    player.alive = false;
    player.dead = true;
    player.bag = [];
    player.bagValue = 0;
    player.stamina = 0;
    player.position = null;
    this.killLog.unshift({
      raid: this.raid,
      phase: this.phase,
      killerName: killer?.name ?? null,
      victimName: player.name,
      reason
    });
    this.raidLog.unshift(`${player.name} ${reason}. Corpse loot value: ${lostValue}`);
  }

  getCorpseBagAtTile(tile) {
    if (!tile) {
      return null;
    }

    return this.corpseBags.find((corpseBag) => tileKey(corpseBag.position) === tileKey(tile)) ?? null;
  }

  canLootCorpseBag(tile = this.currentTile, player = this.player) {
    const corpseBag = this.getCorpseBagAtTile(tile);

    return Boolean(
      corpseBag &&
      player &&
      !this.raidEnded &&
      !this.actionLocked &&
      !this.postAttackMoveAvailable &&
      corpseBag.ownerId !== player.id &&
      player.position &&
      tileKey(player.position) === tileKey(tile) &&
      this.getAvailableStamina() >= 1
    );
  }

  openCorpseBag(tile = this.currentTile) {
    if (!this.canLootCorpseBag(tile)) {
      return null;
    }

    const corpseBag = this.getCorpseBagAtTile(tile);
    this.player.stamina = Math.max(0, this.player.stamina - 1);
    corpseBag.opened = true;
    this.raidLog.unshift(`${this.player.name} opened ${corpseBag.ownerName}'s corpse bag`);
    return corpseBag;
  }

  getCorpseBagById(corpseBagId) {
    return this.corpseBags.find((corpseBag) => corpseBag.id === corpseBagId) ?? null;
  }

  takeCorpseBagItem(corpseBagId, itemIndex, player = this.player) {
    const corpseBag = this.getCorpseBagById(corpseBagId);

    if (!corpseBag || !player || player.bag.length >= player.bagSlots || itemIndex < 0 || itemIndex >= corpseBag.items.length) {
      return null;
    }

    const [item] = corpseBag.items.splice(itemIndex, 1);
    this.addItemToBag(item, player);
    this.raidLog.unshift(`${player.name} took ${item.name} from ${corpseBag.ownerName}`);
    return item;
  }

  dropBagItem(itemIndex, player = this.player) {
    if (!player || itemIndex < 0 || itemIndex >= player.bag.length) {
      return null;
    }

    const [item] = player.bag.splice(itemIndex, 1);
    player.bagValue = player.bag.reduce((sum, bagItem) => sum + bagItem.value, 0);
    this.raidLog.unshift(`${player.name} dropped ${item.name}`);
    return item;
  }

  applyReactionMoveIfNeeded(target, damageEvents, threatPosition) {
    if (!target?.eventReactionMoveRemaining || !target.position) {
      return false;
    }

    const upperBodyDamaged = damageEvents.some((event) => {
      return event.damage > 0 && ["head", "chest"].includes(event.bodyPart);
    });

    if (!upperBodyDamaged) {
      return false;
    }

    const moved = this.moveTargetAwayOneStep(target, threatPosition);

    if (moved) {
      target.eventReactionMoveRemaining = Math.max(0, target.eventReactionMoveRemaining - 1);
      this.raidLog.unshift(`${target.name} reaction move: 1 tile`);
    }

    return moved;
  }

  moveTargetAwayOneStep(target, threatPosition) {
    const currentDistance = hexDistance(target.position, threatPosition);
    const occupiedKeys = new Set(
      [...this.players, ...this.enemies]
        .filter((unit) => unit !== target && !unit.dead && !unit.escaped && unit.position)
        .map((unit) => tileKey(unit.position))
    );

    const candidates = getHexNeighbors(target.position)
      .map((hex) => this.gameMap.tilesByKey.get(tileKey(hex)))
      .filter((tile) => {
        return tile?.enabled && tile.walkable && !occupiedKeys.has(tileKey(tile));
      })
      .map((tile) => ({
        tile,
        distance: hexDistance(tile, threatPosition)
      }))
      .filter((entry) => entry.distance > currentDistance)
      .sort((a, b) => b.distance - a.distance);

    if (candidates.length === 0) {
      return false;
    }

    target.position = { q: candidates[0].tile.q, r: candidates[0].tile.r };
    return true;
  }

  resetMapTileState() {
    this.gameMap.tiles.forEach((tile) => {
      tile.looted = false;
    });
  }

  resetRaid() {
    this.raid = 1;
    this.phase = 1;
    this.raidEnded = false;
    this.raidResult = "inProgress";
    this.corpseBags = [];
    this.raidLog = [];
    this.killLog = [];
    this.actionLocked = false;
    this.lastAttackRoll = [];
    this.lastAttackSummary = null;
    this.postAttackMoveAvailable = false;
    this.currentEvent = null;
    this.lastEventResults = [];
    this.pendingEventDiceRolls = [];
    this.phaseEffects = this.createEmptyPhaseEffects();
    this.resetMapTileState();
    this.playerScores = this.createScoreMap();
    this.stashValue = 0;
    this.players = this.createPlayers();
    this.turnOrder = this.drawTurnOrder();
    this.activePlayerIndex = this.turnOrder[0]?.playerIndex ?? 0;
    this.enemies = this.createEnemies();
    this.selectedTileKey = null;
    this.players.forEach((player) => this.revealVisibleTiles(player));
    this.lastRaidSpawnKeys = new Set(this.players.filter((player) => player.position).map((player) => tileKey(player.position)));
  }

  endTurn() {
    if (this.raidEnded) {
      return this.raidResult;
    }

    this.checkExtraction();

    if (this.raidEnded) {
      return this.raidResult;
    }

    this.advanceTurn();
    return this.raidResult;
  }

  advanceTurn() {
    const previousTurnOrder = this.turnOrder;
    const previousTurnIndex = previousTurnOrder.findIndex((entry) => entry.playerIndex === this.activePlayerIndex);
    const activeTurnOrder = previousTurnOrder.filter((entry) => this.isPlayerActive(this.players[entry.playerIndex]));

    if (activeTurnOrder.length === 0) {
      this.finishRaid();
      return;
    }

    const nextTurn = activeTurnOrder.find((entry) => {
      const originalIndex = previousTurnOrder.findIndex((turnEntry) => turnEntry.playerIndex === entry.playerIndex);
      return originalIndex > previousTurnIndex;
    }) ?? null;

    if (nextTurn) {
      this.activePlayerIndex = nextTurn.playerIndex;
      this.turnOrder = activeTurnOrder;
      this.currentEvent = this.player.currentEvent ?? null;
      this.resetActiveActionState();
      this.revealVisibleTiles(this.player);
      this.raidLog.unshift(`${this.player.name} turn`);
      this.checkExtraction();
      return;
    }

    if (this.phase >= this.maxPhase) {
      this.finishRaid();
      return;
    }

    this.phase += 1;
    this.phaseEffects = this.createEmptyPhaseEffects();
    this.players.forEach((player) => {
      if (!this.isPlayerActive(player)) {
        return;
      }

      player.heldEventCards = player.heldEventCards.filter((entry) => entry.duration !== "phase");
      player.staminaMax = this.getStaminaMaxForArmor(player.armorId, player.armor);
      player.stamina = player.staminaMax;
      player.movementSpentThisPhase = 0;
      player.hpMoveSpentThisPhase = 0;
    });
    this.turnOrder = activeTurnOrder;

    if (this.turnOrder.length === 0) {
      this.finishRaid();
      return;
    }

    this.activePlayerIndex = this.turnOrder[0]?.playerIndex ?? 0;
    this.currentEvent = this.player.currentEvent ?? null;
    this.resetActiveActionState();
    this.revealVisibleTiles(this.player);
    this.raidLog.unshift(`Phase ${this.phase} start`);

    if (this.phase % 4 === 0) {
      this.drawEventCardsForActivePlayers();
    }

    this.checkExtraction();
  }

  resetActiveActionState() {
    this.actionLocked = false;
    this.postAttackMoveAvailable = false;
    this.lastAttackRoll = [];
    this.lastAttackSummary = null;
  }

  canPlayerExtractFromTile(player, tile) {
    if (!tile?.extractionPoint) {
      return false;
    }

    if (player.taxiTicket) {
      return true;
    }

    if (!Array.isArray(tile.extractionSlots) || tile.extractionSlots.length === 0) {
      return true;
    }

    return tile.extractionSlots.some((slot) => player.assignedExtractionSlots.includes(slot));
  }

  checkExtraction() {
    const tile = this.currentTile;

    if (
      this.raidEnded ||
      this.player.escaped ||
      !this.canPlayerExtractFromTile(this.player, tile)
    ) {
      return false;
    }

    this.player.escaped = true;
    this.player.extractedThisRaid = true;
    this.awardPlayerScore(this.player, this.player.bagValue);
    this.stashValue = this.getPlayerScore("player_1");
    this.raidLog.unshift(`${this.player.name} extracted with value ${this.player.bagValue}`);
    return true;
  }

  finishRaid() {
    const escapedCount = this.players.filter((player) => player.extractedThisRaid).length;

    this.raidEnded = true;
    this.raidResult = escapedCount > 0 ? "escaped" : "failed";

    const forfeitedPlayers = this.players.filter((player) => !player.extractedThisRaid && player.bagValue > 0);
    forfeitedPlayers.forEach((player) => {
      const lostValue = player.bagValue;
      const preservedItem = this.consumeRaidInsurance(player);
      player.bag = preservedItem ? [preservedItem] : [];
      player.bagValue = preservedItem?.value ?? 0;
      if (preservedItem) {
        this.raidLog.unshift(`${player.name} insurance preserved ${preservedItem.name}`);
      }
      this.raidLog.unshift(`${player.name} failed to extract. Raid loot lost: ${Math.max(0, lostValue - (preservedItem?.value ?? 0))}`);
    });

    this.raidLog.unshift(
      escapedCount === 0
        ? "Raid failed. No one extracted; this raid's loot was lost."
        : `Raid complete. Extracted: ${escapedCount}`
    );
  }

  failRaid() {
    this.raidEnded = true;
    this.raidResult = "failed";
    this.players.forEach((player) => {
      const preservedItem = this.consumeRaidInsurance(player);
      player.bag = preservedItem ? [preservedItem] : [];
      player.bagValue = preservedItem?.value ?? 0;
      if (preservedItem) {
        this.raidLog.unshift(`${player.name} insurance preserved ${preservedItem.name}`);
      }
    });
    this.raidLog.unshift("Raid failed. Acquired items were lost.");
  }

  consumeRaidInsurance(player) {
    if (!player?.insuranceUntilRaid || !Array.isArray(player.bag) || player.bag.length === 0) {
      return null;
    }

    player.insuranceUntilRaid = false;
    player.pendingInsuranceSelection = false;
    player.heldEventCards = player.heldEventCards.filter((entry) => entry.card?.effect?.type !== "insureRaidItem");
    const insuredIndex = player.bag.findIndex((item, index) => getBagItemInsuranceKey(item, index) === player.insuredItemKey);
    const preservedItem = insuredIndex >= 0 ? player.bag[insuredIndex] : null;
    player.insuredItemKey = null;
    return preservedItem;
  }

  startNextRaid() {
    if (!this.raidEnded || this.raid >= 3) {
      return false;
    }

    this.raid += 1;
    this.phase = 1;
    this.raidEnded = false;
    this.raidResult = "inProgress";
    this.actionLocked = false;
    this.lastAttackRoll = [];
    this.lastAttackSummary = null;
    this.postAttackMoveAvailable = false;
    this.currentEvent = null;
    this.lastEventResults = [];
    this.pendingEventDiceRolls = [];
    this.phaseEffects = this.createEmptyPhaseEffects();
    this.corpseBags = [];
    this.resetMapTileState();
    this.players = this.createPlayers();
    this.turnOrder = this.drawTurnOrder();
    this.activePlayerIndex = this.turnOrder[0]?.playerIndex ?? 0;
    this.enemies = this.createEnemies();
    this.selectedTileKey = null;
    this.players.forEach((player) => this.revealVisibleTiles(player));
    this.lastRaidSpawnKeys = new Set(this.players.filter((player) => player.position).map((player) => tileKey(player.position)));
    this.raidLog.unshift(`Raid ${this.raid} started`);
    return true;
  }
}

function applyBodyDamage(target, bodyPart, damage) {
  if (bodyPart === "abdomen" && target.bodyHp.abdomen <= 0) {
    target.bodyHp.chest = Math.max(0, target.bodyHp.chest - damage);
    return;
  }

  if (bodyPart === "legs" && target.bodyHp.legs <= 0) {
    target.bodyHp.chest = Math.max(0, target.bodyHp.chest - damage);
    return;
  }

  target.bodyHp[bodyPart] = Math.max(0, target.bodyHp[bodyPart] - damage);
}

function getBagItemInsuranceKey(item, index) {
  return `${item?.id ?? item?.name ?? "item"}:${item?.value ?? 0}:${index}`;
}

function clonePlain(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

function clampAiCount(value) {
  const count = Number(value);

  if (!Number.isFinite(count)) {
    return 1;
  }

  return Math.max(0, Math.min(5, Math.floor(count)));
}

function getAiProfileId(index) {
  const profiles = ["aggressive", "looter", "survivor", "balanced", "hunter"];
  return profiles[Math.max(0, index - 1) % profiles.length];
}
