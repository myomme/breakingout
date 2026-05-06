import { getSpawnSlotLabel } from "../core/spawnSlots.js";
import { getBrushByTile } from "../editor/brushes.js";
import { createLargeHexMap } from "../editor/gridGenerator.js";
import { HistoryStack } from "../editor/historyStack.js";
import { serializeForGame } from "../game/mapDataAdapter.js";
import {
  getHexCorners,
  hexesInRadius,
  hexLine,
  hexToPixel,
  pixelToHex,
  tileKey
} from "../core/hex.js";
import { drawTextureInPolygon, getTileTextureLayers, loadTileTextures } from "./tileTextures.js";

export class CanvasMapEditor {
  constructor({
    canvas,
    minimap,
    state,
    brushSelect,
    sizeSelect,
    spawnSlotSelect,
    tileDetails,
    exportButton,
    exportGameButton,
    importInput,
    backgroundInput,
    clearBackgroundButton,
    generateButton,
    columnsInput,
    rowsInput,
    hexSizeInput,
    originXInput,
    originYInput,
    rotationInput,
    opacityInput,
    bgScaleInput,
    bgLayerSelect,
    bgXInput,
    bgYInput,
    homeButton,
    onBrushPicked,
    onStatsChanged,
    onStatusChanged
  }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.minimap = minimap;
    this.minimapCtx = minimap.getContext("2d");
    this.state = state;
    this.brushSelect = brushSelect;
    this.sizeSelect = sizeSelect;
    this.spawnSlotSelect = spawnSlotSelect;
    this.tileDetails = tileDetails;
    this.exportButton = exportButton;
    this.exportGameButton = exportGameButton;
    this.importInput = importInput;
    this.backgroundInput = backgroundInput;
    this.clearBackgroundButton = clearBackgroundButton;
    this.generateButton = generateButton;
    this.columnsInput = columnsInput;
    this.rowsInput = rowsInput;
    this.hexSizeInput = hexSizeInput;
    this.originXInput = originXInput;
    this.originYInput = originYInput;
    this.rotationInput = rotationInput;
    this.opacityInput = opacityInput;
    this.bgScaleInput = bgScaleInput;
    this.bgLayerSelect = bgLayerSelect;
    this.bgXInput = bgXInput;
    this.bgYInput = bgYInput;
    this.homeButton = homeButton;
    this.onBrushPicked = onBrushPicked;
    this.onStatsChanged = onStatsChanged;
    this.onStatusChanged = onStatusChanged;
    this.history = new HistoryStack(this.state.toMapData());
    this.camera = { x: 0, y: 0, zoom: 1 };
    this.backgroundImage = null;
    this.painting = false;
    this.panning = false;
    this.spaceDown = false;
    this.strokeChanged = false;
    this.strokeAnchor = null;
    this.paintedThisStroke = new Set();
    this.hoverKey = null;
    this.hoverWorldPoint = null;
    this.lastPointer = null;
    this.pixelRatio = window.devicePixelRatio || 1;
    this.pendingSpawnLink = null;
    this.tileTextures = loadTileTextures(() => this.render());

    this.syncControlsFromMap();
    this.loadBackgroundFromMap();
    this.bindEvents();
    this.resize();
    this.centerCamera();
    this.refreshStatus();
    this.render();
  }

  bindEvents() {
    window.addEventListener("resize", () => {
      this.resize();
      this.render();
    });

    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();

      if (event.code === "Space") {
        this.spaceDown = true;
        this.canvas.classList.add("is-panning");
        event.preventDefault();
      }

      if (event.ctrlKey && key === "z") {
        event.preventDefault();
        this.replaceMap(this.history.undo(this.state.toMapData()), false);
      }

      if (event.ctrlKey && key === "y") {
        event.preventDefault();
        this.replaceMap(this.history.redo(this.state.toMapData()), false);
      }

      if (event.key === "Escape" && this.pendingSpawnLink) {
        this.pendingSpawnLink = null;
        this.refreshStatus();
        this.render();
      }
    });

    window.addEventListener("keyup", (event) => {
      if (event.code === "Space") {
        this.spaceDown = false;
        this.panning = false;
        this.canvas.classList.remove("is-panning");
      }
    });

    this.canvas.addEventListener("wheel", (event) => this.handleWheel(event), { passive: false });
    this.canvas.addEventListener("pointerdown", (event) => this.handlePointerDown(event));
    this.canvas.addEventListener("pointermove", (event) => this.handlePointerMove(event));
    window.addEventListener("pointerup", () => this.endPointerAction());
    this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());

    this.minimap.addEventListener("click", (event) => this.jumpFromMinimap(event));
    this.exportButton.addEventListener("click", () => this.exportMap());
    this.exportGameButton.addEventListener("click", () => this.exportGameMap());
    this.importInput.addEventListener("change", (event) => this.importMap(event));
    this.backgroundInput.addEventListener("change", (event) => this.importBackground(event));
    this.clearBackgroundButton.addEventListener("click", () => this.clearBackground());
    this.generateButton.addEventListener("click", () => this.generateGrid());
    this.homeButton.addEventListener("click", () => {
      this.centerCamera();
      this.render();
    });
    this.brushSelect.addEventListener("change", () => this.refreshStatus());
    this.spawnSlotSelect?.addEventListener("change", () => this.refreshStatus());

    [
      this.hexSizeInput,
      this.originXInput,
      this.originYInput,
      this.rotationInput,
      this.opacityInput,
      this.bgScaleInput,
      this.bgLayerSelect,
      this.bgXInput,
      this.bgYInput
    ].forEach((input) => {
      input.addEventListener("input", () => {
        this.applyControlValues();
        this.render();
      });
    });
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const miniRect = this.minimap.getBoundingClientRect();
    this.pixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.floor(rect.width * this.pixelRatio));
    this.canvas.height = Math.max(1, Math.floor(rect.height * this.pixelRatio));
    this.minimap.width = Math.max(1, Math.floor(miniRect.width * this.pixelRatio));
    this.minimap.height = Math.max(1, Math.floor(miniRect.height * this.pixelRatio));
    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    this.minimapCtx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
  }

  centerCamera() {
    const bounds = this.getWorldBounds();
    const rect = this.canvas.getBoundingClientRect();
    const zoomX = rect.width / Math.max(1, bounds.width);
    const zoomY = rect.height / Math.max(1, bounds.height);

    this.camera.zoom = clamp(Math.min(zoomX, zoomY) * 0.82, 0.18, 2.8);
    this.camera.x = rect.width / 2 - (bounds.minX + bounds.width / 2) * this.camera.zoom;
    this.camera.y = rect.height / 2 - (bounds.minY + bounds.height / 2) * this.camera.zoom;
  }

  render() {
    const rect = this.canvas.getBoundingClientRect();
    const backgroundLayer = this.state.map.backgroundLayer ?? "below";
    this.ctx.clearRect(0, 0, rect.width, rect.height);
    this.ctx.fillStyle = "#ece7dc";
    this.ctx.fillRect(0, 0, rect.width, rect.height);
    if (backgroundLayer === "below") {
      this.drawBackground(0.82);
    }
    this.drawVisibleTiles();
    if (backgroundLayer === "same") {
      this.drawBackground(0.48);
    } else if (backgroundLayer === "above") {
      this.drawBackground(1);
      this.drawImageLayerEditGuides();
    }
    this.drawPendingSpawnLink();
    this.drawHud();
    this.drawMinimap();
    this.renderStats();
  }

  drawBackground(alpha = 0.82) {
    if (!this.backgroundImage) {
      return;
    }

    const map = this.state.map;
    const topLeft = this.worldToScreen({ x: map.backgroundX, y: map.backgroundY });
    const width = this.backgroundImage.width * map.backgroundScale * this.camera.zoom;
    const height = this.backgroundImage.height * map.backgroundScale * this.camera.zoom;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(this.backgroundImage, topLeft.x, topLeft.y, width, height);
    this.ctx.restore();
  }

  drawImageLayerEditGuides() {
    const selectedKey = this.state.selectedTileKey;
    const guideKeys = new Set([selectedKey, this.hoverKey].filter(Boolean));

    if (guideKeys.size === 0) {
      return;
    }

    this.ctx.save();
    guideKeys.forEach((key) => {
      const tile = this.state.tilesByKey.get(key);

      if (!tile) {
        return;
      }

      const center = this.worldToScreen(this.hexToWorld(tile));
      const corners = getHexCorners(center, this.state.map.hexSize * this.camera.zoom);
      this.ctx.beginPath();
      corners.forEach((corner, index) => {
        if (index === 0) this.ctx.moveTo(corner.x, corner.y);
        else this.ctx.lineTo(corner.x, corner.y);
      });
      this.ctx.closePath();
      this.ctx.strokeStyle = key === selectedKey ? "rgba(185, 232, 109, 0.95)" : "rgba(255, 255, 255, 0.54)";
      this.ctx.lineWidth = key === selectedKey ? 3 : 1.5;
      this.ctx.stroke();
    });
    this.ctx.restore();
  }

  drawVisibleTiles() {
    const map = this.state.map;
    const size = map.hexSize;
    const selectedKey = this.state.selectedTileKey;
    const view = this.getScreenWorldRect();
    const margin = size * 3;

    this.ctx.save();
    this.ctx.globalAlpha = map.gridOpacity;

    for (const tile of map.tiles) {
      const worldCenter = this.hexToWorld(tile);

      if (
        worldCenter.x < view.minX - margin ||
        worldCenter.x > view.maxX + margin ||
        worldCenter.y < view.minY - margin ||
        worldCenter.y > view.maxY + margin
      ) {
        continue;
      }

      this.drawTile(tile, worldCenter, tileKey(tile) === selectedKey);
    }

    this.ctx.restore();
  }

  drawTile(tile, worldCenter, selected) {
    const map = this.state.map;
    const terrain = this.state.getTerrain(tile);
    const center = this.worldToScreen(worldCenter);
    const corners = getHexCorners(center, map.hexSize * this.camera.zoom);
    const key = tileKey(tile);
    const enabled = tile.enabled;
    const linkedToPending = this.pendingSpawnLink && tile.extractionSlots.includes(this.pendingSpawnLink.spawnSlot);
    const showDisabledGuide = !enabled && (selected || key === this.hoverKey || linkedToPending);

    this.ctx.beginPath();
    corners.forEach((corner, index) => {
      if (index === 0) {
        this.ctx.moveTo(corner.x, corner.y);
      } else {
        this.ctx.lineTo(corner.x, corner.y);
      }
    });
    this.ctx.closePath();

    if (!enabled && !showDisabledGuide) {
      return;
    }

    if (enabled) {
      this.ctx.fillStyle = tile.extractionPoint ? "#b9e86d" : terrain.color;
      this.ctx.fill();
      if (!tile.extractionPoint) {
        this.drawTileTextures(tile, corners);
      }
    } else {
      this.ctx.fillStyle = "rgba(37, 35, 31, 0.015)";
      this.ctx.fill();
    }

    this.ctx.strokeStyle = selected
      ? "#123f43"
      : enabled
        ? terrain.stroke
        : "rgba(70, 66, 58, 0.04)";
    this.ctx.lineWidth = selected ? 3 : enabled ? Math.max(0.6, this.camera.zoom) : 0.5;
    this.ctx.stroke();

    if (linkedToPending) {
      this.ctx.save();
      this.ctx.fillStyle = "rgba(130, 200, 80, 0.24)";
      this.ctx.fill();
      this.ctx.restore();
    }

    if (enabled) {
      this.drawTileOverlays(tile, corners);
    }

    if (key === this.hoverKey) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.22;
      this.ctx.fillStyle = "#1d4f53";
      this.ctx.fill();
      this.ctx.restore();
    }

    if (this.camera.zoom > 0.55 && enabled) {
      this.drawTileMarkers(tile, center);
    }
  }

  drawTileTextures(tile, corners) {
    const layers = getTileTextureLayers(tile);

    layers.forEach((layer) => {
      drawTextureInPolygon(this.ctx, corners, this.tileTextures[layer.key], layer.alpha);
    });
  }

  drawTileMarkers(tile, center) {
    const radius = clamp(5 * this.camera.zoom, 3, 7);

    if (!tile.walkable) this.drawMarker(center.x, center.y, radius, "#3d3d40", "W");
    if (tile.cover !== "none") this.drawMarker(center.x - 8, center.y - 8, radius, "#8f633f", "C");
    if (tile.blocksSight) this.drawMarker(center.x + 8, center.y - 8, radius, "#a3433f", "B");
    if (tile.lootType !== "none") this.drawMarker(center.x - 8, center.y + 8, radius, tile.lootType === "rare" ? "#7660a8" : "#8c772e", "L");
    if (tile.extractionPoint) {
      this.drawExtractionIcon(center.x + 8, center.y + 8, radius + 2);
      if (tile.extractionSlots.length > 0 && this.camera.zoom > 0.7) {
        this.drawTinyLabel(center.x, center.y - 11, tile.extractionSlots.join(","));
      }
    }
    if (tile.spawnSlot) {
      this.drawMarker(center.x, center.y + 12, radius, "#ffffff", "S", "#222222");
      if (this.camera.zoom > 0.7) {
        this.drawTinyLabel(center.x, center.y - 11, tile.spawnSlot);
      }
    }
  }

  drawPendingSpawnLink() {
    if (!this.pendingSpawnLink) {
      return;
    }

    const spawnCenter = this.worldToScreen(this.hexToWorld(this.pendingSpawnLink.spawnTile));
    const targetCenter = this.hoverKey
      ? this.worldToScreen(this.hexToWorld(this.state.tilesByKey.get(this.hoverKey)))
      : this.hoverWorldPoint
        ? this.worldToScreen(this.hoverWorldPoint)
        : null;

    if (!targetCenter) {
      return;
    }

    this.ctx.save();
    this.ctx.strokeStyle = "rgba(52, 124, 214, 0.86)";
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([10, 8]);
    this.ctx.beginPath();
    this.ctx.moveTo(spawnCenter.x, spawnCenter.y);
    this.ctx.lineTo(targetCenter.x, targetCenter.y);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.fillStyle = "#347cd6";
    this.ctx.beginPath();
    this.ctx.arc(targetCenter.x, targetCenter.y, 6, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawTileOverlays(tile, corners) {
    if (tile.cover !== "none") {
      this.drawHatch(corners, "rgba(218, 54, 48, 0.56)", 11, 1.5);
    }
  }

  drawHatch(corners, color, spacing, lineWidth, reverse = false) {
    const xs = corners.map((corner) => corner.x);
    const ys = corners.map((corner) => corner.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const span = maxX - minX + maxY - minY;

    this.ctx.save();
    this.clipPolygon(corners);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;

    for (let offset = -span; offset < span * 2; offset += spacing) {
      this.ctx.beginPath();

      if (reverse) {
        this.ctx.moveTo(minX + offset, maxY + 8);
        this.ctx.lineTo(minX + offset + span, minY - 8);
      } else {
        this.ctx.moveTo(minX + offset, minY - 8);
        this.ctx.lineTo(minX + offset + span, maxY + 8);
      }

      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  clipPolygon(corners) {
    this.ctx.beginPath();
    corners.forEach((corner, index) => {
      if (index === 0) {
        this.ctx.moveTo(corner.x, corner.y);
      } else {
        this.ctx.lineTo(corner.x, corner.y);
      }
    });
    this.ctx.closePath();
    this.ctx.clip();
  }

  drawExtractionIcon(x, y, radius) {
    this.ctx.save();
    this.ctx.fillStyle = "#245b25";
    this.ctx.strokeStyle = "#f7ffe7";
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.roundRect(x - radius, y - radius, radius * 2, radius * 2, 3);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.strokeStyle = "#f7ffe7";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x - 4, y);
    this.ctx.lineTo(x + 4, y);
    this.ctx.moveTo(x + 1, y - 3);
    this.ctx.lineTo(x + 4, y);
    this.ctx.lineTo(x + 1, y + 3);
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawMarker(x, y, radius, fill, label, stroke = "transparent") {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = fill;
    this.ctx.strokeStyle = stroke;
    this.ctx.lineWidth = stroke === "transparent" ? 0 : 1.5;
    this.ctx.fill();
    this.ctx.stroke();

    if (this.camera.zoom > 0.8) {
      this.ctx.fillStyle = fill === "#ffffff" ? "#222222" : "#ffffff";
      this.ctx.font = "700 6px Inter, system-ui, sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(label, x, y + 0.5);
    }
  }

  drawTinyLabel(x, y, label) {
    this.ctx.save();
    this.ctx.fillStyle = "rgba(18, 21, 24, 0.75)";
    this.ctx.font = "700 10px Inter, system-ui, sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(label, x, y);
    this.ctx.restore();
  }

  drawHud() {
    const rect = this.canvas.getBoundingClientRect();
    const helperText = this.pendingSpawnLink
      ? `${this.pendingSpawnLink.spawnSlot} 탈출구 칸을 클릭하세요 | Esc 취소`
      : "Zoom 100%".replace("100", String(Math.round(this.camera.zoom * 100)));

    this.ctx.fillStyle = "rgba(255, 253, 248, 0.9)";
    this.ctx.fillRect(12, rect.height - 40, 420, 28);
    this.ctx.fillStyle = "#403b32";
    this.ctx.font = "700 12px Inter, system-ui, sans-serif";
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(
      this.pendingSpawnLink
        ? helperText
        : `Zoom ${Math.round(this.camera.zoom * 100)}% | Space+Drag Pan | Wheel Zoom`,
      22,
      rect.height - 26
    );
  }

  drawMinimap() {
    const rect = this.minimap.getBoundingClientRect();
    const ctx = this.minimapCtx;
    const bounds = this.getWorldBounds();
    const scale = Math.min(rect.width / bounds.width, rect.height / bounds.height) * 0.84;
    const offsetX = rect.width / 2 - (bounds.minX + bounds.width / 2) * scale;
    const offsetY = rect.height / 2 - (bounds.minY + bounds.height / 2) * scale;

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#f7f3ea";
    ctx.fillRect(0, 0, rect.width, rect.height);

    this.state.map.tiles.forEach((tile) => {
      if (!tile.enabled) return;
      const point = this.hexToWorld(tile);
      ctx.fillStyle = tile.extractionPoint ? "#2f6f73" : tile.spawnSlot ? "#222222" : "#9f9278";
      ctx.fillRect(point.x * scale + offsetX, point.y * scale + offsetY, 2, 2);
    });

    const view = this.getScreenWorldRect();
    ctx.strokeStyle = "#a3433f";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      view.minX * scale + offsetX,
      view.minY * scale + offsetY,
      (view.maxX - view.minX) * scale,
      (view.maxY - view.minY) * scale
    );
  }

  handleWheel(event) {
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mouse = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const before = this.screenToWorld(mouse);
    const zoomFactor = event.deltaY < 0 ? 1.12 : 0.88;
    this.camera.zoom = clamp(this.camera.zoom * zoomFactor, 0.14, 4.5);
    const after = this.screenToWorld(mouse);

    this.camera.x += (after.x - before.x) * this.camera.zoom;
    this.camera.y += (after.y - before.y) * this.camera.zoom;
    this.render();
  }

  handlePointerDown(event) {
    if (event.button !== 0) return;

    this.lastPointer = { x: event.clientX, y: event.clientY };

    if (this.spaceDown) {
      this.panning = true;
      this.canvas.setPointerCapture(event.pointerId);
      return;
    }

    const tile = this.getTileFromEvent(event);
    if (!tile) return;

    if (event.altKey) {
      this.pickBrush(tile);
      return;
    }

    if (this.pendingSpawnLink) {
      this.completePendingSpawnLink(tile);
      return;
    }

    this.canvas.setPointerCapture(event.pointerId);
    this.painting = true;
    this.strokeChanged = false;
    this.strokeAnchor = tile;
    this.paintedThisStroke = new Set();
    this.paintAt(tile, event.shiftKey);
  }

  handlePointerMove(event) {
    if (this.panning && this.lastPointer) {
      this.camera.x += event.clientX - this.lastPointer.x;
      this.camera.y += event.clientY - this.lastPointer.y;
      this.lastPointer = { x: event.clientX, y: event.clientY };
      this.render();
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    this.hoverWorldPoint = this.screenToWorld({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });

    const tile = this.getTileFromEvent(event);
    this.hoverKey = tile ? tileKey(tile) : null;

    if (this.painting && tile) {
      this.paintAt(tile, event.shiftKey);
    } else {
      this.render();
    }
  }

  endPointerAction() {
    this.panning = false;

    if (!this.painting) {
      return;
    }

    this.painting = false;
    this.strokeAnchor = null;
    this.paintedThisStroke = new Set();

    if (this.strokeChanged) {
      this.history.push(this.state.toMapData());
    }
  }

  paintAt(tile, straightLine) {
    const targets = straightLine && this.strokeAnchor ? hexLine(this.strokeAnchor, tile) : [tile];

    targets.forEach((target) => this.applyBrushArea(target));

    if (this.strokeChanged) {
      this.render();
      this.renderTileDetails();
      this.refreshStatus();
    }
  }

  applyBrushArea(center) {
    const radius = Number(this.sizeSelect.value);
    const brush = this.getSelectedBrush();

    if (brush.id === "spawn") {
      const key = tileKey(center);
      const tile = this.state.tilesByKey.get(key);
      if (!tile || this.paintedThisStroke.has(key)) {
        return;
      }

      this.paintedThisStroke.add(key);
      this.applySpawnBrush(tile);
      return;
    }

    hexesInRadius(center, radius).forEach((target) => {
      const key = tileKey(target);
      const tile = this.state.tilesByKey.get(key);

      if (!tile || this.paintedThisStroke.has(key)) {
        return;
      }

      this.paintedThisStroke.add(key);
      this.state.updateTile(tile, brush.patch);
      this.state.selectTile(tile);
      this.strokeChanged = true;
    });
  }

  applySpawnBrush(tile) {
    const spawnSlot = this.spawnSlotSelect?.value;
    if (!spawnSlot) {
      return;
    }

    this.clearSpawnSlotFromMap(spawnSlot);
    this.state.updateTile(tile, {
      enabled: true,
      walkable: true,
      spawnPoint: true,
      spawnSlot
    });
    this.removeSpawnSlotFromExtractionTiles(spawnSlot);
    this.state.selectTile(tile);
    this.pendingSpawnLink = {
      spawnSlot,
      spawnTile: tile
    };
    this.strokeChanged = true;
  }

  completePendingSpawnLink(tile) {
    const pending = this.pendingSpawnLink;
    if (!pending) {
      return;
    }

    this.removeSpawnSlotFromExtractionTiles(pending.spawnSlot);
    const extractionSlots = new Set(tile.extractionSlots ?? []);
    extractionSlots.add(pending.spawnSlot);
    this.state.updateTile(tile, {
      enabled: true,
      walkable: true,
      extractionPoint: true,
      extractionSlots: Array.from(extractionSlots).sort()
    });
    this.state.selectTile(tile);
    this.pendingSpawnLink = null;
    this.strokeChanged = true;
    this.history.push(this.state.toMapData());
    this.painting = false;
    this.refreshStatus();
    this.render();
    this.renderTileDetails();
  }

  clearSpawnSlotFromMap(spawnSlot) {
    this.state.map.tiles.forEach((tile) => {
      if (tile.spawnSlot !== spawnSlot) {
        return;
      }

      this.state.updateTile(tile, {
        spawnSlot: null,
        spawnPoint: false
      });
    });
  }

  removeSpawnSlotFromExtractionTiles(spawnSlot) {
    this.state.map.tiles.forEach((tile) => {
      if (!tile.extractionSlots?.includes(spawnSlot)) {
        return;
      }

      const nextSlots = tile.extractionSlots.filter((slot) => slot !== spawnSlot);
      this.state.updateTile(tile, {
        extractionSlots: nextSlots,
        extractionPoint: nextSlots.length > 0
      });
    });
  }

  pickBrush(tile) {
    const brush = getBrushByTile(tile);
    this.brushSelect.value = brush.id;
    if (tile.spawnSlot && this.spawnSlotSelect) {
      this.spawnSlotSelect.value = tile.spawnSlot;
    }
    this.state.selectTile(tile);
    this.onBrushPicked(brush);
    this.refreshStatus();
    this.render();
    this.renderTileDetails();
  }

  generateGrid() {
    const map = createLargeHexMap({
      columns: Number(this.columnsInput.value),
      rows: Number(this.rowsInput.value),
      hexSize: Number(this.hexSizeInput.value)
    });

    this.pendingSpawnLink = null;
    this.replaceMap(map, true);
    this.syncControlsFromMap();
    this.centerCamera();
    this.refreshStatus();
    this.render();
  }

  async importBackground(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      this.state.map.backgroundImage = reader.result;
      this.loadBackgroundFromMap();
      this.render();
    });
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  clearBackground() {
    this.state.map.backgroundImage = null;
    this.backgroundImage = null;
    this.render();
  }

  exportMap() {
    const map = this.state.toMapData();
    delete map.layout;

    this.downloadJson(map, "mapData.json");
  }

  exportGameMap() {
    this.downloadJson(serializeForGame(this.state.toMapData()), "mapData.game.json");
  }

  downloadJson(value, filename) {
    const data = JSON.stringify(value, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async importMap(event) {
    const file = event.target.files[0];
    if (!file) return;

    const text = await file.text();
    const map = JSON.parse(text);
    this.pendingSpawnLink = null;
    this.replaceMap(map, true);
    this.syncControlsFromMap();
    this.loadBackgroundFromMap();
    this.centerCamera();
    this.refreshStatus();
    this.render();
    event.target.value = "";
  }

  replaceMap(map, resetHistory) {
    this.state.replaceMap(map);

    if (resetHistory) {
      this.history.reset(this.state.toMapData());
    }

    this.renderTileDetails();
  }

  getSelectedBrush() {
    return this.brushSelect.selectedOptions[0].brush;
  }

  getTileFromEvent(event) {
    const rect = this.canvas.getBoundingClientRect();
    const screenPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    const gridPoint = this.screenToGrid(screenPoint);
    const hex = pixelToHex(gridPoint, this.state.map.hexSize);

    return this.state.tilesByKey.get(tileKey(hex)) ?? null;
  }

  hexToWorld(hex) {
    const point = hexToPixel(hex, this.state.map.hexSize);
    const rotated = rotatePoint(point, degreesToRadians(this.state.map.gridRotation));

    return {
      x: rotated.x + this.state.map.originX,
      y: rotated.y + this.state.map.originY
    };
  }

  screenToGrid(point) {
    const world = this.screenToWorld(point);
    const translated = {
      x: world.x - this.state.map.originX,
      y: world.y - this.state.map.originY
    };

    return rotatePoint(translated, -degreesToRadians(this.state.map.gridRotation));
  }

  worldToScreen(point) {
    return {
      x: point.x * this.camera.zoom + this.camera.x,
      y: point.y * this.camera.zoom + this.camera.y
    };
  }

  screenToWorld(point) {
    return {
      x: (point.x - this.camera.x) / this.camera.zoom,
      y: (point.y - this.camera.y) / this.camera.zoom
    };
  }

  getScreenWorldRect() {
    const rect = this.canvas.getBoundingClientRect();
    const topLeft = this.screenToWorld({ x: 0, y: 0 });
    const bottomRight = this.screenToWorld({ x: rect.width, y: rect.height });

    return {
      minX: Math.min(topLeft.x, bottomRight.x),
      minY: Math.min(topLeft.y, bottomRight.y),
      maxX: Math.max(topLeft.x, bottomRight.x),
      maxY: Math.max(topLeft.y, bottomRight.y)
    };
  }

  getWorldBounds() {
    const size = this.state.map.hexSize;
    const points = this.state.map.tiles.map((tile) => this.hexToWorld(tile));
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const padding = size * 3;
    const minX = Math.min(...xs) - padding;
    const maxX = Math.max(...xs) + padding;
    const minY = Math.min(...ys) - padding;
    const maxY = Math.max(...ys) + padding;

    return {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  jumpFromMinimap(event) {
    const rect = this.minimap.getBoundingClientRect();
    const bounds = this.getWorldBounds();
    const scale = Math.min(rect.width / bounds.width, rect.height / bounds.height) * 0.84;
    const offsetX = rect.width / 2 - (bounds.minX + bounds.width / 2) * scale;
    const offsetY = rect.height / 2 - (bounds.minY + bounds.height / 2) * scale;
    const world = {
      x: (event.offsetX - offsetX) / scale,
      y: (event.offsetY - offsetY) / scale
    };
    const canvasRect = this.canvas.getBoundingClientRect();

    this.camera.x = canvasRect.width / 2 - world.x * this.camera.zoom;
    this.camera.y = canvasRect.height / 2 - world.y * this.camera.zoom;
    this.render();
  }

  syncControlsFromMap() {
    const map = this.state.map;
    this.hexSizeInput.value = map.hexSize;
    this.originXInput.value = map.originX;
    this.originYInput.value = map.originY;
    this.rotationInput.value = map.gridRotation;
    this.opacityInput.value = map.gridOpacity;
    this.bgScaleInput.value = map.backgroundScale;
    if (this.bgLayerSelect) {
      this.bgLayerSelect.value = map.backgroundLayer ?? "below";
    }
    this.bgXInput.value = map.backgroundX;
    this.bgYInput.value = map.backgroundY;
  }

  applyControlValues() {
    const map = this.state.map;
    map.hexSize = Number(this.hexSizeInput.value);
    map.layout.hexSize = map.hexSize;
    map.originX = Number(this.originXInput.value);
    map.originY = Number(this.originYInput.value);
    map.gridRotation = Number(this.rotationInput.value);
    map.gridOpacity = Number(this.opacityInput.value);
    map.backgroundScale = Number(this.bgScaleInput.value);
    map.backgroundLayer = ["below", "same", "above"].includes(this.bgLayerSelect?.value)
      ? this.bgLayerSelect.value
      : "below";
    map.backgroundX = Number(this.bgXInput.value);
    map.backgroundY = Number(this.bgYInput.value);
  }

  loadBackgroundFromMap() {
    if (!this.state.map.backgroundImage) {
      this.backgroundImage = null;
      return;
    }

    const image = new Image();
    image.addEventListener("load", () => {
      this.backgroundImage = image;
      this.render();
    });
    image.src = this.state.map.backgroundImage;
  }

  renderTileDetails() {
    const tile = this.state.selectedTile;

    if (!tile) {
      this.tileDetails.innerHTML = detailRows([["상태", "선택된 타일 없음"]]);
      return;
    }

    this.tileDetails.innerHTML = detailRows([
      ["좌표", `q ${tile.q}, r ${tile.r}`],
      ["사용 여부", tile.enabled ? "사용" : "삭제됨"],
      ["지형", tile.terrain],
      ["이동 가능", tile.walkable ? "가능" : "불가"],
      ["엄폐", tile.cover],
      ["시야 차단", tile.blocksSight ? "차단" : "통과"],
      ["루팅", tile.lootType],
      ["탈출구", tile.extractionPoint ? "예" : "아니오"],
      ["연결 탈출 슬롯", tile.extractionSlots.length > 0 ? tile.extractionSlots.join(", ") : "-"],
      ["시작 위치", tile.spawnSlot ? "예" : "아니오"],
      ["시작 슬롯", tile.spawnSlot ?? "-"]
    ]);
  }

  renderStats() {
    const enabled = this.state.map.tiles.filter((tile) => tile.enabled).length;
    this.onStatsChanged({
      total: this.state.map.tiles.length,
      enabled,
      disabled: this.state.map.tiles.length - enabled,
      zoom: this.camera.zoom
    });
  }

  refreshStatus() {
    const brush = this.getSelectedBrush();

    if (this.pendingSpawnLink) {
      this.onStatusChanged?.(`${getSpawnSlotLabel(this.pendingSpawnLink.spawnSlot)}에 연결할 탈출 지점을 클릭하세요. Esc로 취소할 수 있습니다.`);
      return;
    }

    if (brush.id === "spawn") {
      this.onStatusChanged?.(`${getSpawnSlotLabel(this.spawnSlotSelect?.value)}를 배치하면 바로 연결 탈출구 지정 단계로 넘어갑니다.`);
      return;
    }

    this.onStatusChanged?.(brush.label);
  }
}

function detailRows(rows) {
  return rows
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("");
}

function rotatePoint(point, radians) {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos
  };
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
