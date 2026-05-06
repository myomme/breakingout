import { getDefaultSpawnSlot, isValidSpawnSlot } from "../core/spawnSlots.js";
import { getHexNeighbors, hexDistance, tileKey } from "../core/hex.js";

export function createGameMap(mapData, { keepBackground = false } = {}) {
  let legacySpawnIndex = 0;
  const tiles = mapData.tiles
    .filter((tile) => tile.enabled ?? true)
    .map((tile) => {
      const spawnSlot = isValidSpawnSlot(tile.spawnSlot)
        ? tile.spawnSlot
        : tile.spawnPoint
          ? getDefaultSpawnSlot(legacySpawnIndex++)
          : null;
      const extractionSlots = Array.isArray(tile.extractionSlots)
        ? tile.extractionSlots.filter(isValidSpawnSlot)
        : [];

      const terrain = normalizeTerrain(tile.terrain);

      return {
        q: tile.q,
        r: tile.r,
        terrain,
        walkable: isTerrainWalkable(terrain, tile.walkable),
        cover: tile.cover,
        blocksSight: doesTerrainBlockSight(terrain, tile.blocksSight),
        lootType: tile.lootType,
        looted: tile.looted ?? false,
        extractionPoint: tile.extractionPoint,
        extractionSlots,
        spawnPoint: Boolean(spawnSlot),
        spawnSlot
      };
    });

  const tilesByKey = new Map(tiles.map((tile) => [tileKey(tile), tile]));
  const spawnPoints = tiles
    .filter((tile) => tile.spawnSlot)
    .sort((a, b) => a.spawnSlot.localeCompare(b.spawnSlot));

  return {
    mapId: mapData.mapId,
    backgroundImage: keepBackground ? mapData.backgroundImage ?? null : null,
    backgroundX: mapData.backgroundX ?? 0,
    backgroundY: mapData.backgroundY ?? 0,
    backgroundScale: mapData.backgroundScale ?? 1,
    backgroundLayer: normalizeBackgroundLayer(mapData.backgroundLayer),
    hexSize: mapData.hexSize,
    originX: mapData.originX,
    originY: mapData.originY,
    gridRotation: mapData.gridRotation,
    tiles,
    tilesByKey,
    spawnPoints,
    extractionPoints: tiles.filter((tile) => tile.extractionPoint),
    lootTiles: tiles.filter((tile) => tile.lootType !== "none")
  };
}

function normalizeTerrain(terrain) {
  if (terrain === "bush") {
    return "grass";
  }

  if (terrain === "building") {
    return "building_marble";
  }

  return terrain;
}

function isTerrainWalkable(terrain, walkable) {
  if (terrain === "wall" || terrain === "tree" || terrain === "water") {
    return false;
  }

  if (terrain === "iron_gate" || terrain === "building_marble" || terrain === "building_wood") {
    return true;
  }

  return walkable;
}

function doesTerrainBlockSight(terrain, blocksSight) {
  if (terrain === "wall" || terrain === "tree" || terrain === "iron_gate") {
    return true;
  }

  if (terrain === "building_marble" || terrain === "building_wood" || terrain === "water" || terrain === "grass") {
    return false;
  }

  return blocksSight;
}

export function getTile(gameMap, q, r) {
  return gameMap.tilesByKey.get(`${q},${r}`) ?? null;
}

export function canEnterTile(gameMap, q, r) {
  const tile = getTile(gameMap, q, r);
  return Boolean(tile?.walkable);
}

export function getTilesInRange(gameMap, origin, range) {
  return gameMap.tiles.filter((tile) => hexDistance(origin, tile) <= range);
}

export function getWalkableTilesInRange(gameMap, origin, range) {
  return getTilesInRange(gameMap, origin, range).filter((tile) => tile.walkable);
}

export function getReachableWalkableTiles(gameMap, origin, movementPoints) {
  const originKey = tileKey(origin);
  const visited = new Map([[originKey, 0]]);
  const previous = new Map();
  const queue = [origin];
  const results = [];

  while (queue.length > 0) {
    const current = queue.shift();
    const currentCost = visited.get(tileKey(current));

    for (const neighborHex of getHexNeighbors(current)) {
      const neighborKey = tileKey(neighborHex);
      const neighbor = gameMap.tilesByKey.get(neighborKey);
      const nextCost = currentCost + 1;

      if (!neighbor || !neighbor.walkable || visited.has(neighborKey) || nextCost > movementPoints) {
        continue;
      }

      visited.set(neighborKey, nextCost);
      previous.set(neighborKey, tileKey(current));
      queue.push(neighbor);
      results.push({
        tile: neighbor,
        cost: nextCost,
        path: rebuildPath(previous, gameMap.tilesByKey, originKey, neighborKey)
      });
    }
  }

  return results;
}

export function findWalkablePath(gameMap, origin, target, { blockedKeys = new Set() } = {}) {
  const originKey = tileKey(origin);
  const targetKey = tileKey(target);

  if (originKey === targetKey) {
    return [{ q: origin.q, r: origin.r }];
  }

  const visited = new Set([originKey]);
  const previous = new Map();
  const queue = [origin];

  while (queue.length > 0) {
    const current = queue.shift();

    for (const neighborHex of getHexNeighbors(current)) {
      const neighborKey = tileKey(neighborHex);
      const neighbor = gameMap.tilesByKey.get(neighborKey);

      if (
        !neighbor ||
        !neighbor.walkable ||
        visited.has(neighborKey) ||
        (blockedKeys.has(neighborKey) && neighborKey !== targetKey)
      ) {
        continue;
      }

      visited.add(neighborKey);
      previous.set(neighborKey, tileKey(current));

      if (neighborKey === targetKey) {
        return rebuildPath(previous, gameMap.tilesByKey, originKey, targetKey);
      }

      queue.push(neighbor);
    }
  }

  return null;
}

function rebuildPath(previous, tilesByKey, originKey, targetKey) {
  const path = [];
  let cursor = targetKey;

  while (cursor) {
    const tile = tilesByKey.get(cursor);

    if (!tile) {
      break;
    }

    path.unshift({ q: tile.q, r: tile.r });

    if (cursor === originKey) {
      return path;
    }

    cursor = previous.get(cursor) ?? null;
  }

  return [];
}

export function serializeForGame(mapData) {
  const gameMap = createGameMap(mapData);

  return {
    mapId: gameMap.mapId,
    backgroundImage: mapData.backgroundImage ?? null,
    backgroundX: mapData.backgroundX ?? 0,
    backgroundY: mapData.backgroundY ?? 0,
    backgroundScale: mapData.backgroundScale ?? 1,
    backgroundLayer: normalizeBackgroundLayer(mapData.backgroundLayer),
    hexSize: gameMap.hexSize,
    originX: gameMap.originX,
    originY: gameMap.originY,
    gridRotation: gameMap.gridRotation,
    tiles: gameMap.tiles
  };
}

function normalizeBackgroundLayer(layer) {
  return ["below", "same", "above"].includes(layer) ? layer : "below";
}
