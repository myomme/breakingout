const TILE_TEXTURE_SOURCES = {
  grass: new URL("../../assets/tile/지형_잔디.png", import.meta.url).href,
  marble: new URL("../../assets/tile/건물_돌바닥.png", import.meta.url).href,
  wall: new URL("../../assets/tile/건물_벽.png", import.meta.url).href,
  wood: new URL("../../assets/tile/건물_나무판자.png", import.meta.url).href,
  rock: new URL("../../assets/tile/지형_바위.png", import.meta.url).href,
  cover: new URL("../../assets/tile/건물_엄폐물.png", import.meta.url).href,
  water: new URL("../../assets/tile/지형_물.png", import.meta.url).href,
  tree: new URL("../../assets/tile/지형_나무.png", import.meta.url).href,
  ironGate: new URL("../../assets/tile/건물_철문.png", import.meta.url).href
};

export function loadTileTextures(onLoad = () => {}) {
  const textures = {};

  Object.entries(TILE_TEXTURE_SOURCES).forEach(([key, src]) => {
    const image = new Image();
    image.addEventListener("load", onLoad);
    image.src = src;
    textures[key] = image;
  });

  return textures;
}

export function getTileTextureLayers(tile) {
  const layers = [];

  if (tile.terrain === "grass" || tile.terrain === "bush") {
    layers.push({ key: "grass", alpha: 0.42 });
  } else if (tile.terrain === "tree") {
    layers.push({ key: "tree", alpha: 0.5 });
  } else if (tile.terrain === "building_marble" || tile.terrain === "building") {
    layers.push({ key: "marble", alpha: 0.42 });
  } else if (tile.terrain === "building_wood") {
    layers.push({ key: "wood", alpha: 0.42 });
  } else if (tile.terrain === "iron_gate") {
    layers.push({ key: "ironGate", alpha: 0.5 });
  } else if (tile.terrain === "wall") {
    layers.push({ key: "wall", alpha: 0.5 });
  } else if (tile.terrain === "water") {
    layers.push({ key: "water", alpha: 0.58 });
  } else if (tile.terrain === "road") {
    layers.push({ key: "rock", alpha: 0.18 });
  } else if (tile.terrain === "wrecked_car") {
    layers.push({ key: "wood", alpha: 0.24 });
  }

  if (tile.cover !== "none") {
    layers.push({ key: "cover", alpha: 0.52 });
  }

  if (tile.blocksSight && tile.terrain !== "wall") {
    layers.push({ key: "wall", alpha: 0.12 });
  }

  return layers;
}

export function drawTextureInPolygon(ctx, corners, image, alpha = 0.3) {
  if (!image?.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
    return;
  }

  const xs = corners.map((corner) => corner.x);
  const ys = corners.map((corner) => corner.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = maxX - minX;
  const height = maxY - minY;

  ctx.save();
  ctx.beginPath();
  corners.forEach((corner, index) => {
    if (index === 0) ctx.moveTo(corner.x, corner.y);
    else ctx.lineTo(corner.x, corner.y);
  });
  ctx.closePath();
  ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.drawImage(image, minX, minY, width, height);
  ctx.restore();
}
