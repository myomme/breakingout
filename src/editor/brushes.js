export const BRUSHES = {
  plain: {
    id: "plain",
    label: "일반 지형",
    patch: {
      terrain: "road",
      walkable: true
    }
  },
  road: {
    id: "road",
    label: "도로",
    patch: {
      terrain: "road",
      walkable: true
    }
  },
  grass: {
    id: "grass",
    label: "잔디",
    patch: {
      terrain: "grass",
      walkable: true
    }
  },
  tree: {
    id: "tree",
    label: "나무",
    patch: {
      terrain: "tree",
      walkable: false,
      blocksSight: true
    }
  },
  water: {
    id: "water",
    label: "물",
    patch: {
      terrain: "water",
      walkable: false,
      blocksSight: false
    }
  },
  buildingMarble: {
    id: "buildingMarble",
    label: "건물_대리석",
    patch: {
      terrain: "building_marble",
      walkable: true,
      blocksSight: false
    }
  },
  buildingWood: {
    id: "buildingWood",
    label: "건물_나무",
    patch: {
      terrain: "building_wood",
      walkable: true
    }
  },
  wall: {
    id: "wall",
    label: "벽",
    patch: {
      terrain: "wall",
      walkable: false,
      blocksSight: true
    }
  },
  ironGate: {
    id: "ironGate",
    label: "철문",
    patch: {
      terrain: "iron_gate",
      walkable: true,
      blocksSight: true
    }
  },
  normalLoot: {
    id: "normalLoot",
    label: "일반 루팅 지역",
    patch: {
      lootType: "normal"
    }
  },
  rareLoot: {
    id: "rareLoot",
    label: "고급 루팅 지역",
    patch: {
      lootType: "rare"
    }
  },
  blocked: {
    id: "blocked",
    label: "이동 불가 지형",
    patch: {
      walkable: false
    }
  },
  cover: {
    id: "cover",
    label: "엄폐물",
    patch: {
      cover: "hard"
    }
  },
  sightBlocker: {
    id: "sightBlocker",
    label: "시야 차단",
    patch: {
      blocksSight: true
    }
  },
  extraction: {
    id: "extraction",
    label: "탈출구",
    patch: {
      extractionPoint: true
    }
  },
  spawn: {
    id: "spawn",
    label: "시작 위치",
    patch: {}
  },
  deleteTile: {
    id: "deleteTile",
    label: "삭제 브러시",
    patch: {
      enabled: false
    }
  },
  restoreTile: {
    id: "restoreTile",
    label: "복구 브러시",
    patch: {
      enabled: true
    }
  },
  clearLoot: {
    id: "clearLoot",
    label: "루팅 제거",
    patch: {
      lootType: "none"
    }
  },
  clearFlags: {
    id: "clearFlags",
    label: "특수 표시 제거",
    patch: {
      cover: "none",
      blocksSight: false,
      extractionPoint: false,
      spawnPoint: false,
      spawnSlot: null,
      extractionSlots: [],
      walkable: true
    }
  }
};

export function getBrushByTile(tile) {
  if (!tile.enabled) return BRUSHES.deleteTile;
  if (tile.spawnSlot) return BRUSHES.spawn;
  if (tile.extractionPoint) return BRUSHES.extraction;
  if (tile.lootType === "rare") return BRUSHES.rareLoot;
  if (tile.lootType === "normal") return BRUSHES.normalLoot;
  if (tile.terrain === "iron_gate") return BRUSHES.ironGate;
  if (tile.terrain === "water") return BRUSHES.water;
  if (tile.terrain === "tree") return BRUSHES.tree;
  if (tile.terrain === "wall") return BRUSHES.wall;
  if (tile.terrain === "building_wood") return BRUSHES.buildingWood;
  if (tile.terrain === "building_marble" || tile.terrain === "building") return BRUSHES.buildingMarble;
  if (tile.terrain === "grass" || tile.terrain === "bush") return BRUSHES.grass;
  if (tile.blocksSight) return BRUSHES.sightBlocker;
  if (tile.cover !== "none") return BRUSHES.cover;
  if (!tile.walkable) return BRUSHES.blocked;
  return BRUSHES.road;
}
