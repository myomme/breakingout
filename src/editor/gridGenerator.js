export function createLargeHexMap({
  mapId = "large_raid_map",
  columns = 44,
  rows = 28,
  hexSize = 24
} = {}) {
  const tiles = [];
  const qOffset = Math.floor(columns / 2);
  const rOffset = Math.floor(rows / 2);

  for (let r = 0; r < rows; r += 1) {
    for (let q = 0; q < columns; q += 1) {
      tiles.push(createDefaultTile(q - qOffset, r - rOffset));
    }
  }

  return {
    mapId,
    name: "Large Raid Map",
    backgroundImage: null,
    backgroundX: 0,
    backgroundY: 0,
    backgroundScale: 1,
    backgroundLayer: "below",
    hexSize,
    originX: 0,
    originY: 0,
    gridRotation: 0,
    gridOpacity: 0.86,
    tiles
  };
}

export function createDefaultTile(q, r) {
  return {
    q,
    r,
    enabled: true,
    terrain: "road",
    walkable: true,
    cover: "none",
    blocksSight: false,
    lootType: "none",
    extractionPoint: false,
    extractionSlots: [],
    spawnPoint: false,
    spawnSlot: null
  };
}
