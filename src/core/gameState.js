import { getDefaultSpawnSlot, isValidSpawnSlot } from "./spawnSlots.js";
import { tileKey } from "./hex.js";

export class GameState {
  constructor({ map, terrainTypes }) {
    this.map = normalizeMap(map);
    this.terrainTypes = terrainTypes;
    this.selectedTileKey = null;
    this.tilesByKey = new Map(this.map.tiles.map((tile) => [tileKey(tile), tile]));
  }

  selectTile(tile) {
    this.selectedTileKey = tileKey(tile);
  }

  replaceMap(map) {
    this.map = normalizeMap(map);
    this.selectedTileKey = null;
    this.tilesByKey = new Map(this.map.tiles.map((tile) => [tileKey(tile), tile]));
  }

  updateTile(tile, patch) {
    Object.assign(tile, patch);
  }

  toMapData() {
    return JSON.parse(JSON.stringify(this.map));
  }

  get selectedTile() {
    if (!this.selectedTileKey) {
      return null;
    }

    return this.tilesByKey.get(this.selectedTileKey) ?? null;
  }

  getTerrain(tile) {
    return this.terrainTypes[tile.terrain];
  }
}

function normalizeMap(map) {
  const normalized = {
    mapId: map.mapId ?? map.id ?? "raid_editor_map",
    name: map.name ?? "Raid Editor Map",
    backgroundImage: map.backgroundImage ?? null,
    backgroundX: map.backgroundX ?? 0,
    backgroundY: map.backgroundY ?? 0,
    backgroundScale: map.backgroundScale ?? 1,
    backgroundLayer: normalizeBackgroundLayer(map.backgroundLayer),
    hexSize: map.hexSize ?? map.layout?.hexSize ?? 28,
    originX: map.originX ?? 0,
    originY: map.originY ?? 0,
    gridRotation: map.gridRotation ?? 0,
    gridOpacity: map.gridOpacity ?? 0.86,
    tiles: map.tiles ?? []
  };

  normalized.layout = {
    coordinateSystem: "axial",
    hexSize: normalized.hexSize
  };

  let legacySpawnIndex = 0;

  normalized.tiles = normalized.tiles.map((tile) => {
    const spawnSlot = isValidSpawnSlot(tile.spawnSlot)
      ? tile.spawnSlot
      : tile.spawnPoint
        ? getDefaultSpawnSlot(legacySpawnIndex++)
        : null;
    const extractionSlots = Array.isArray(tile.extractionSlots)
      ? tile.extractionSlots.filter(isValidSpawnSlot)
      : [];

    const terrain = normalizeTerrain(tile.terrain ?? "road");

    return {
      q: tile.q,
      r: tile.r,
      enabled: tile.enabled ?? true,
      terrain,
      walkable: isTerrainWalkable(terrain, tile.walkable),
      cover: tile.cover ?? "none",
      blocksSight: doesTerrainBlockSight(terrain, tile.blocksSight),
      lootType: tile.lootType ?? "none",
      extractionPoint: tile.extractionPoint ?? false,
      extractionSlots,
      spawnPoint: Boolean(spawnSlot),
      spawnSlot
    };
  });

  return normalized;
}

function normalizeBackgroundLayer(layer) {
  return ["below", "same", "above"].includes(layer) ? layer : "below";
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

  return walkable ?? true;
}

function doesTerrainBlockSight(terrain, blocksSight) {
  if (terrain === "wall" || terrain === "tree" || terrain === "iron_gate") {
    return true;
  }

  if (terrain === "building_marble" || terrain === "building_wood" || terrain === "water" || terrain === "grass") {
    return false;
  }

  return blocksSight ?? false;
}
