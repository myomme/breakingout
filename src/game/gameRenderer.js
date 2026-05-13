import { getHexCorners, hexToPixel, pixelToHex, tileKey } from "../core/hex.js";
import { drawTextureInPolygon, getTileTextureLayers, loadTileTextures } from "../render/tileTextures.js";

export class GameRenderer {
  constructor({ canvas, state, terrainTypes, onTileClick, onMovementStep = null, getViewerPlayer = null }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.state = state;
    this.terrainTypes = terrainTypes;
    this.onTileClick = onTileClick;
    this.onMovementStep = onMovementStep;
    this.getViewerPlayerOverride = getViewerPlayer;
    this.camera = { x: 0, y: 0, zoom: 1 };
    this.isMobileViewport = this.detectMobileViewport();
    this.pixelRatio = this.getRenderPixelRatio();
    this.backgroundImage = null;
    this.tileTextures = loadTileTextures(() => this.requestRender());
    this.holdPan = false;
    this.panning = false;
    this.lastPointer = null;
    this.touchPointers = new Map();
    this.lastTouchDistance = 0;
    this.lastTouchCenter = null;
    this.suppressNextClick = false;
    this.fastRenderUntil = 0;
    this.effects = [];
    this.animationFrame = null;
    this.lastAnimationTime = 0;
    this.pendingRenderFrame = 0;

    this.bindEvents();
    this.resize();
    this.loadBackground();
    this.centerCamera();
  }

  bindEvents() {
    window.addEventListener("resize", () => {
      this.isMobileViewport = this.detectMobileViewport();
      this.resize();
      this.requestRender();
    });

    window.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() === "h") {
        this.holdPan = true;
        this.canvas.classList.add("is-panning");
      }
    });

    window.addEventListener("keyup", (event) => {
      if (event.key.toLowerCase() === "h") {
        this.holdPan = false;
        this.panning = false;
        this.canvas.classList.remove("is-panning");
      }
    });

    this.canvas.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") {
        event.preventDefault();
        if (this.touchPointers.size === 0) {
          this.lastTouchDistance = 0;
          this.lastTouchCenter = null;
        }
        this.touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        this.canvas.setPointerCapture(event.pointerId);
        this.updateTouchGestureState();
        return;
      }

      if (event.button !== 0 || !this.holdPan) return;
      this.panning = true;
      this.lastPointer = { x: event.clientX, y: event.clientY };
      this.canvas.setPointerCapture(event.pointerId);
    }, { passive: false });

    this.canvas.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch" && this.touchPointers.has(event.pointerId)) {
        event.preventDefault();
        this.handleTouchMove(event);
        return;
      }

      if (!this.panning || !this.lastPointer) return;
      this.camera.x += event.clientX - this.lastPointer.x;
      this.camera.y += event.clientY - this.lastPointer.y;
      this.lastPointer = { x: event.clientX, y: event.clientY };
      this.markFastRender();
      this.requestRender();
    }, { passive: false });

    window.addEventListener("pointerup", (event) => {
      if (event.pointerType === "touch") {
        this.touchPointers.delete(event.pointerId);
        if (this.canvas.hasPointerCapture?.(event.pointerId)) {
          this.canvas.releasePointerCapture(event.pointerId);
        }
        this.updateTouchGestureState();
      }
      this.panning = false;
      this.lastPointer = null;
    });

    window.addEventListener("pointercancel", (event) => {
      if (event.pointerType === "touch") {
        this.touchPointers.delete(event.pointerId);
        if (this.canvas.hasPointerCapture?.(event.pointerId)) {
          this.canvas.releasePointerCapture(event.pointerId);
        }
        this.updateTouchGestureState();
      }
      this.panning = false;
      this.lastPointer = null;
    });

    this.canvas.addEventListener("lostpointercapture", (event) => {
      if (event.pointerType !== "touch") {
        return;
      }
      this.touchPointers.delete(event.pointerId);
      this.updateTouchGestureState();
    });

    this.canvas.addEventListener("click", (event) => {
      if (this.holdPan || this.suppressNextClick) {
        this.suppressNextClick = false;
        return;
      }
      const tile = this.getTileFromEvent(event);

      if (tile) {
        this.onTileClick(tile);
      }
    });

    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const mouse = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const before = this.screenToWorld(mouse);
      this.camera.zoom = clamp(this.camera.zoom * (event.deltaY < 0 ? 1.12 : 0.88), 0.18, 4);
      const after = this.screenToWorld(mouse);
      this.camera.x += (after.x - before.x) * this.camera.zoom;
      this.camera.y += (after.y - before.y) * this.camera.zoom;
      this.markFastRender();
      this.requestRender();
    }, { passive: false });
  }

  detectMobileViewport() {
    return window.matchMedia?.("(pointer: coarse), (max-width: 920px)")?.matches ?? window.innerWidth <= 920;
  }

  getRenderPixelRatio() {
    const deviceRatio = window.devicePixelRatio || 1;
    return this.isMobileViewport ? Math.min(deviceRatio, 1.25) : Math.min(deviceRatio, 2);
  }

  requestRender() {
    if (this.pendingRenderFrame) {
      return;
    }

    this.pendingRenderFrame = requestAnimationFrame(() => {
      this.pendingRenderFrame = 0;
      this.render();
    });
  }

  markFastRender(duration = 180) {
    this.fastRenderUntil = performance.now() + duration;
  }

  handleTouchMove(event) {
    const previous = this.touchPointers.get(event.pointerId);
    this.touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const pointers = Array.from(this.touchPointers.values());

    if (pointers.length === 1) {
      const current = pointers[0];
      this.lastTouchDistance = 0;
      this.lastTouchCenter = current;
      if (previous) {
        const dx = current.x - previous.x;
        const dy = current.y - previous.y;
        if (Math.abs(dx) + Math.abs(dy) > 2) {
          this.suppressNextClick = true;
        }
        this.camera.x += dx;
        this.camera.y += dy;
        this.markFastRender();
        this.requestRender();
      }
      return;
    }

    if (pointers.length >= 2) {
      const [first, second] = pointers;
      const center = {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2
      };
      const distance = Math.hypot(first.x - second.x, first.y - second.y);

      if (this.lastTouchDistance > 0 && this.lastTouchCenter) {
        const rect = this.canvas.getBoundingClientRect();
        const screenCenter = { x: center.x - rect.left, y: center.y - rect.top };
        const before = this.screenToWorld(screenCenter);
        const zoomDelta = distance / Math.max(1, this.lastTouchDistance);
        this.camera.zoom = clamp(this.camera.zoom * zoomDelta, 0.18, 4);
        const after = this.screenToWorld(screenCenter);
        this.camera.x += (after.x - before.x) * this.camera.zoom;
        this.camera.y += (after.y - before.y) * this.camera.zoom;
        this.camera.x += center.x - this.lastTouchCenter.x;
        this.camera.y += center.y - this.lastTouchCenter.y;
        this.suppressNextClick = true;
        this.markFastRender();
        this.requestRender();
      }

      this.lastTouchDistance = distance;
      this.lastTouchCenter = center;
    }
  }

  updateTouchGestureState() {
    const pointers = Array.from(this.touchPointers.values());
    if (pointers.length >= 2) {
      const [first, second] = pointers;
      this.lastTouchDistance = Math.hypot(first.x - second.x, first.y - second.y);
      this.lastTouchCenter = {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2
      };
      return;
    }

    this.lastTouchDistance = 0;
    this.lastTouchCenter = pointers[0] ?? null;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.pixelRatio = this.getRenderPixelRatio();
    this.canvas.width = Math.max(1, Math.floor(rect.width * this.pixelRatio));
    this.canvas.height = Math.max(1, Math.floor(rect.height * this.pixelRatio));
    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
  }

  loadBackground() {
    if (!this.state.gameMap.backgroundImage) {
      this.backgroundImage = null;
      return;
    }

    const image = new Image();
    image.addEventListener("load", () => {
      this.backgroundImage = image;
      this.requestRender();
    });
    image.src = this.state.gameMap.backgroundImage;
  }

  centerCamera() {
    const bounds = this.getWorldBounds();
    const rect = this.canvas.getBoundingClientRect();
    const zoomX = rect.width / Math.max(1, bounds.width);
    const zoomY = rect.height / Math.max(1, bounds.height);
    const fitZoom = Math.min(zoomX, zoomY) * 0.84;
    const gameplayZoom = this.getDefaultGameplayZoom();

    this.camera.zoom = clamp(Math.max(fitZoom, gameplayZoom), 0.18, 2.5);
    this.camera.x = rect.width / 2 - (bounds.minX + bounds.width / 2) * this.camera.zoom;
    this.camera.y = rect.height / 2 - (bounds.minY + bounds.height / 2) * this.camera.zoom;
  }

  fitMapToView() {
    const bounds = this.getWorldBounds();
    const rect = this.canvas.getBoundingClientRect();
    const zoomX = rect.width / Math.max(1, bounds.width);
    const zoomY = rect.height / Math.max(1, bounds.height);

    this.camera.zoom = clamp(Math.min(zoomX, zoomY) * 0.84, 0.12, 2.5);
    this.camera.x = rect.width / 2 - (bounds.minX + bounds.width / 2) * this.camera.zoom;
    this.camera.y = rect.height / 2 - (bounds.minY + bounds.height / 2) * this.camera.zoom;
  }

  centerOnPlayer(player, { zoom = this.getDefaultGameplayZoom() } = {}) {
    if (!player?.position) {
      this.centerCamera();
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const center = this.hexToWorld(player.position);

    this.camera.zoom = clamp(zoom, 0.18, 2.5);
    this.camera.x = rect.width / 2 - center.x * this.camera.zoom;
    this.camera.y = rect.height / 2 - center.y * this.camera.zoom;
  }

  getDefaultGameplayZoom() {
    return this.isMobileViewport ? 0.68 : 0.9;
  }

  render() {
    if (this.pendingRenderFrame) {
      cancelAnimationFrame(this.pendingRenderFrame);
      this.pendingRenderFrame = 0;
    }
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
    this.ctx.fillStyle = "#ece7dc";
    this.ctx.fillRect(0, 0, rect.width, rect.height);
    const visibleKeys = this.getVisibleKeysForRender();
    const discoveredKeys = this.getDiscoveredKeysForRender();
    const backgroundLayer = this.state.gameMap.backgroundLayer ?? "below";

    if (backgroundLayer === "below") {
      this.drawBackground(0.78);
    }
    this.drawTiles(visibleKeys, discoveredKeys);
    if (backgroundLayer === "same") {
      this.drawBackground(0.45);
    } else if (backgroundLayer === "above") {
      this.drawBackground(1);
    }
    this.drawVisionMask(visibleKeys, discoveredKeys);
    this.drawMoveRange();
    this.drawEnemies(visibleKeys);
    this.drawPlayers(visibleKeys);
    this.drawEffects();
  }

  drawBackground(alpha = 0.78) {
    if (!this.backgroundImage) {
      return;
    }

    const map = this.state.gameMap;
    const topLeft = this.worldToScreen({ x: map.backgroundX, y: map.backgroundY });
    this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(
      this.backgroundImage,
      topLeft.x,
      topLeft.y,
      this.backgroundImage.width * map.backgroundScale * this.camera.zoom,
      this.backgroundImage.height * map.backgroundScale * this.camera.zoom
    );
    this.ctx.globalAlpha = 1;
  }

  drawTiles(visibleKeys, discoveredKeys) {
    const selectedKey = this.state.selectedTileKey;
    const spectatorVision = this.isSpectatorVisionActive();
    const viewer = this.getViewerPlayer();
    const playerTurn = this.state.player?.id === viewer?.id && !spectatorVision;
    const moveKeys = playerTurn ? new Set(this.state.getMovementTiles().map((tile) => tileKey(tile))) : new Set();
    const rangeKeys = playerTurn ? new Set(this.state.getWeaponRangeTiles().map((tile) => tileKey(tile))) : new Set();
    const visiblePlayerKeys = new Set(this.state.players
      .filter((player, index) => {
        if (!player.position) {
          return false;
        }

        return player.id === viewer?.id || visibleKeys.has(tileKey(player.position));
      })
      .map((player) => tileKey(player.position)));
    const activeExtractionSlots = new Set(viewer?.assignedExtractionSlots ?? []);
    const playerExtractionKeys = new Set(
      this.state.gameMap.extractionPoints
        .filter((extractionTile) => this.state.canPlayerExtractFromTile(viewer, extractionTile))
        .map((extractionTile) => tileKey(extractionTile))
    );

    for (const tile of this.state.gameMap.tiles) {
      const terrain = this.terrainTypes[tile.terrain] ?? this.terrainTypes.road;
      const center = this.worldToScreen(this.hexToWorld(tile));
      const corners = getHexCorners(center, this.state.gameMap.hexSize * this.camera.zoom);
      const key = tileKey(tile);
      const visible = visibleKeys.has(key);
      const discovered = discoveredKeys.has(key);
      const isVisibleExtraction = this.isExtractionVisibleToActivePlayer(tile, activeExtractionSlots);
      const isPlayerExtraction = playerExtractionKeys.has(key);

      this.ctx.beginPath();
      corners.forEach((corner, index) => {
        if (index === 0) this.ctx.moveTo(corner.x, corner.y);
        else this.ctx.lineTo(corner.x, corner.y);
      });
      this.ctx.closePath();
      this.ctx.fillStyle = isPlayerExtraction ? "#b9e86d" : terrain.color;
      this.ctx.fill();
      if (!isPlayerExtraction && !this.shouldUseFastRender()) {
        this.drawTileTextures(tile, corners);
      }

      if (visible && tile.looted) {
        this.ctx.fillStyle = "rgba(38, 38, 38, 0.12)";
        this.ctx.fill();
      }

      const selectedVisible = key === selectedKey && visible && playerTurn;
      const playerVisible = visiblePlayerKeys.has(key);

      this.ctx.strokeStyle = selectedVisible ? "#123f43" : playerVisible ? "#ffffff" : terrain.stroke;
      this.ctx.lineWidth = selectedVisible || playerVisible ? 3 : Math.max(0.6, this.camera.zoom);
      this.ctx.stroke();

      if (isPlayerExtraction) {
        this.ctx.strokeStyle = visible ? "#2d7b32" : "rgba(121, 182, 91, 0.7)";
        this.ctx.lineWidth = visible ? 2 : 1.4;
        this.ctx.stroke();
        this.drawExtractionBeacon(center, corners, visible);
      }

      if (visible && rangeKeys.has(key)) {
        this.drawRangeIndicator(corners);
      }

      if (visible && moveKeys.has(key)) {
        this.drawMoveIndicator(center, corners);
      }

      if ((visible || isPlayerExtraction) && !(this.shouldUseFastRender() && !isPlayerExtraction)) {
        this.drawTacticalMarks(tile, center, isPlayerExtraction);
      }
    }
  }

  drawTileTextures(tile, corners) {
    const layers = getTileTextureLayers(tile);

    layers.forEach((layer) => {
      drawTextureInPolygon(this.ctx, corners, this.tileTextures[layer.key], layer.alpha);
    });
  }

  drawRangeIndicator(corners) {
    this.ctx.save();
    this.ctx.beginPath();
    corners.forEach((corner, index) => {
      if (index === 0) this.ctx.moveTo(corner.x, corner.y);
      else this.ctx.lineTo(corner.x, corner.y);
    });
    this.ctx.closePath();
    this.ctx.strokeStyle = "rgba(163, 89, 71, 0.55)";
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawMoveIndicator(center, corners) {
    this.ctx.save();
    this.ctx.beginPath();
    corners.forEach((corner, index) => {
      if (index === 0) this.ctx.moveTo(corner.x, corner.y);
      else this.ctx.lineTo(corner.x, corner.y);
    });
    this.ctx.closePath();
    this.ctx.strokeStyle = "rgba(153, 214, 201, 0.82)";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, clamp(3.5 * this.camera.zoom, 2.5, 5), 0, Math.PI * 2);
    this.ctx.fillStyle = "rgba(210, 244, 236, 0.95)";
    this.ctx.fill();
    this.ctx.strokeStyle = "rgba(34, 85, 81, 0.55)";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawExtractionBeacon(center, corners, visible) {
    this.ctx.save();
    this.ctx.beginPath();
    corners.forEach((corner, index) => {
      if (index === 0) this.ctx.moveTo(corner.x, corner.y);
      else this.ctx.lineTo(corner.x, corner.y);
    });
    this.ctx.closePath();
    this.ctx.fillStyle = visible ? "rgba(185, 232, 109, 0.28)" : "rgba(185, 232, 109, 0.18)";
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, clamp(12 * this.camera.zoom, 7, 18), 0, Math.PI * 2);
    this.ctx.strokeStyle = "rgba(185, 232, 109, 0.86)";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.restore();
  }

  isExtractionVisibleToActivePlayer(tile, activeExtractionSlots) {
    if (!tile.extractionPoint) {
      return false;
    }

    if (!Array.isArray(tile.extractionSlots) || tile.extractionSlots.length === 0) {
      return true;
    }

    return tile.extractionSlots.some((slot) => activeExtractionSlots.has(slot));
  }

  drawTacticalMarks(tile, center, isVisibleExtraction) {
    const radius = clamp(5 * this.camera.zoom, 3, 7);

    if (tile.lootType !== "none") {
      this.drawLootCrateMarker(center.x - 8, center.y + 8, radius + 1, tile);
    }
    const corpseBag = this.state.getCorpseBagAtTile?.(tile);
    if (corpseBag) {
      this.drawCorpseBagMarker(center.x + 8, center.y - 8, radius + 1, corpseBag);
    }
    if (isVisibleExtraction) this.drawMarker(center.x + 8, center.y + 8, radius, "#1e7f32", "E");
    if (tile.spawnSlot) {
      this.drawMarker(center.x, center.y + 12, radius, "#ffffff", "S", "#222222");
      if (this.camera.zoom > 0.7) {
        this.drawTinyLabel(center.x, center.y - 11, tile.spawnSlot);
      }
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

  drawLootCrateMarker(x, y, radius, tile) {
    const size = radius * 2.15;
    const left = x - size / 2;
    const top = y - size / 2;
    const fill = tile.looted
      ? "#6a655d"
      : tile.lootType === "rare"
        ? "#8f6fca"
        : "#9a7742";
    const stroke = tile.looted
      ? "rgba(34, 31, 28, 0.7)"
      : tile.lootType === "rare"
        ? "#f1e7ff"
        : "#f6ead4";

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.roundRect(left, top, size, size, Math.max(2, radius * 0.65));
    this.ctx.fillStyle = fill;
    this.ctx.fill();
    this.ctx.strokeStyle = stroke;
    this.ctx.lineWidth = 1.3;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(left + size * 0.22, top + size * 0.38);
    this.ctx.lineTo(left + size * 0.78, top + size * 0.38);
    this.ctx.moveTo(left + size * 0.5, top + size * 0.18);
    this.ctx.lineTo(left + size * 0.5, top + size * 0.82);
    this.ctx.strokeStyle = tile.looted ? "rgba(34, 31, 28, 0.52)" : "rgba(255, 248, 240, 0.72)";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    if (tile.looted) {
      this.ctx.beginPath();
      this.ctx.moveTo(left + size * 0.24, top + size * 0.24);
      this.ctx.lineTo(left + size * 0.76, top + size * 0.76);
      this.ctx.moveTo(left + size * 0.76, top + size * 0.24);
      this.ctx.lineTo(left + size * 0.24, top + size * 0.76);
      this.ctx.strokeStyle = "rgba(35, 30, 27, 0.88)";
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawCorpseBagMarker(x, y, radius, corpseBag) {
    const size = radius * 2.35;
    const left = x - size / 2;
    const top = y - size / 2;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.roundRect(left, top, size, size * 0.78, Math.max(2, radius * 0.55));
    this.ctx.fillStyle = corpseBag.items.length > 0 ? "#3f3328" : "#5d5650";
    this.ctx.fill();
    this.ctx.strokeStyle = corpseBag.items.length > 0 ? "#f1d0a2" : "rgba(255, 255, 255, 0.42)";
    this.ctx.lineWidth = 1.3;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(x, top + size * 0.22, size * 0.22, Math.PI, 0);
    this.ctx.strokeStyle = "rgba(255, 239, 207, 0.72)";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    if (this.camera.zoom > 0.58) {
      this.ctx.fillStyle = "#fff3d9";
      this.ctx.font = "800 8px Inter, system-ui, sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText("BAG", x, top + size * 0.48);
    }

    this.ctx.restore();
  }

  drawMoveRange() {
    const viewer = this.getViewerPlayer();
    if (this.state.player?.id !== viewer?.id || this.isSpectatorVisionActive()) {
      return;
    }

    const position = this.getAnimatedUnitPosition(viewer.id) ?? viewer.position;

    if (!position) {
      return;
    }

    const center = this.worldToScreen(this.hexToWorld(position));
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, 10, 0, Math.PI * 2);
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
  }

  drawEnemies(visibleKeys) {
    const spectatorVision = this.isSpectatorVisionActive();
    const viewer = this.getViewerPlayer();
    const attackableKeys = this.state.player?.id === viewer?.id && !spectatorVision
      ? new Set(this.state.getAttackableEnemies().map((enemy) => tileKey(enemy.position)))
      : new Set();

    this.state.enemies.forEach((enemy) => {
      if (!enemy.alive) return;
      if (!spectatorVision && !visibleKeys.has(tileKey(enemy.position))) return;
      const center = this.worldToScreen(this.hexToWorld(enemy.position));
      const attackable = attackableKeys.has(tileKey(enemy.position));
      const hitFlash = this.effects.some((effect) => effect.type === "hit" && effect.targetId === enemy.id);

      this.ctx.beginPath();
      this.ctx.arc(center.x, center.y, 8, 0, Math.PI * 2);
      this.ctx.fillStyle = hitFlash ? "#ff8b7c" : attackable ? "#b5302d" : "#5d5650";
      this.ctx.fill();
      this.ctx.strokeStyle = attackable ? "#fff2ee" : "#ffffff";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      if (attackable || hitFlash) {
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, hitFlash ? 17 : 14, 0, Math.PI * 2);
        this.ctx.strokeStyle = hitFlash ? "rgba(255, 139, 124, 0.9)" : "rgba(181, 48, 45, 0.8)";
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
    });
  }

  drawPlayers(visibleKeys) {
    const spectatorVision = this.isSpectatorVisionActive();
    const viewer = this.getViewerPlayer();
    const attackableKeys = this.state.player?.id === viewer?.id && !spectatorVision
      ? new Set(this.state.getAttackableTargets().map((target) => tileKey(target.position)))
      : new Set();

    this.state.players.forEach((player, index) => {
      if (!this.state.isPlayerActive(player)) {
        return;
      }
      if (!spectatorVision && player.id !== viewer?.id && !visibleKeys.has(tileKey(player.position))) {
        return;
      }

      const active = spectatorVision ? index === this.state.activePlayerIndex : player.id === viewer?.id;
      const attackable = !active && attackableKeys.has(tileKey(player.position));
      const renderPosition = this.getAnimatedUnitPosition(player.id) ?? player.position;
      const center = this.worldToScreen(this.hexToWorld(renderPosition));
      const hitFlash = this.effects.some((effect) => effect.type === "hit" && effect.targetId === player.id);
      const tokenSkin = player.cosmetics?.equipped?.tokenSkin ?? "default";
      const tokenRadius = this.getPlayerTokenRadius(active);
      const detailLevel = this.getTokenDetailLevel();
      const fillColor = getPlayerTokenFill({ active, attackable, hitFlash, tokenSkin });
      const strokeColor = getPlayerTokenStroke({ active, tokenSkin });
      const advancedToken = TOKEN_SKIN_STYLES[tokenSkin];

      if (advancedToken) {
        drawDemoScaleToken(this.ctx, center, tokenRadius, tokenSkin, String(index + 1), {
          attackable,
          hitFlash,
          detailLevel
        });
      } else {
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, tokenRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = fillColor;
        this.ctx.fill();
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = active ? 3 : 2.2;
        this.ctx.stroke();

        if (tokenSkin === "token_ember") {
          this.ctx.beginPath();
          this.ctx.arc(center.x, center.y, tokenRadius + 3, 0, Math.PI * 2);
          this.ctx.strokeStyle = "rgba(255, 153, 74, 0.48)";
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
        }

        if (tokenSkin === "token_signal_blue") {
          this.ctx.beginPath();
          this.ctx.arc(center.x, center.y, tokenRadius + 4, 0, Math.PI * 2);
          this.ctx.strokeStyle = "rgba(99, 194, 255, 0.58)";
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
        }

        if (tokenSkin === "token_hazard") {
          this.ctx.save();
          this.ctx.translate(center.x, center.y);
          this.ctx.rotate(Math.PI / 4);
          this.ctx.strokeStyle = "rgba(255, 212, 87, 0.68)";
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(-tokenRadius - 2, -tokenRadius - 2, (tokenRadius + 2) * 2, (tokenRadius + 2) * 2);
          this.ctx.restore();
        }

        drawAdvancedTokenMarkings(this.ctx, center, tokenRadius + 3, tokenSkin, detailLevel);
      }

      if (attackable || hitFlash) {
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, hitFlash ? 18 : 15, 0, Math.PI * 2);
        this.ctx.strokeStyle = hitFlash ? "rgba(255, 142, 132, 0.92)" : "rgba(181, 48, 45, 0.82)";
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }

      if (!advancedToken && this.state.gameMap.hexSize * this.camera.zoom > 22) {
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = `${Math.max(9, Math.min(16, tokenRadius * 0.52))}px Inter, system-ui, sans-serif`;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(String(index + 1), center.x, center.y + tokenRadius * 0.08);
      }
    });
  }

  getPlayerTokenRadius(active) {
    const tileRadius = this.state.gameMap.hexSize * this.camera.zoom;
    const ratio = active ? 0.82 : 0.68;
    const maxRadius = active ? 36 : 31;
    const minRadius = active ? 18 : 14;
    return clamp(tileRadius * ratio, minRadius, maxRadius);
  }

  getTokenDetailLevel() {
    const tileRadius = this.state.gameMap.hexSize * this.camera.zoom;
    if (tileRadius < 24) return 0;
    if (tileRadius < 36) return 1;
    return 2;
  }

  drawEffects() {
    const now = performance.now();

    this.effects.forEach((effect) => {
      const elapsed = now - effect.start;
      const progress = Math.max(0, Math.min(1, elapsed / effect.duration));

      if (effect.type === "shot") {
        this.drawShotEffect(effect, progress);
      }

      if (effect.type === "hit") {
        this.drawHitEffect(effect, progress);
      }

      if (effect.type === "damageText") {
        this.drawDamageTextEffect(effect, progress);
      }
    });
  }

  getAnimatedUnitPosition(unitId) {
    const now = performance.now();
    const effect = this.effects.find((entry) => entry.type === "move" && entry.unitId === unitId);

    if (!effect) {
      return null;
    }

    return this.getMovementEffectPosition(effect, now);
  }

  getVisibleKeysForRender() {
    const viewer = this.getViewerPlayer();

    if (this.isSpectatorVisionActive()) {
      return this.getAllTileKeys();
    }

    const animatedPosition = this.getAnimatedUnitPosition(viewer?.id);

    if (!animatedPosition) {
      return this.state.getVisibleTileKeys(viewer);
    }

    return this.state.getVisibleTileKeys({
      ...viewer,
      position: animatedPosition
    });
  }

  getDiscoveredKeysForRender() {
    if (this.isSpectatorVisionActive()) {
      return this.getAllTileKeys();
    }

    return this.state.getDiscoveredTileKeys(this.getViewerPlayer());
  }

  getViewerPlayer() {
    if (this.getViewerPlayerOverride) {
      return this.getViewerPlayerOverride() ?? this.state.players[0] ?? this.state.player;
    }

    return this.state.players[0] ?? this.state.player;
  }

  isSpectatorVisionActive() {
    const viewer = this.getViewerPlayer();
    return Boolean(viewer?.dead || viewer?.escaped || !viewer?.position);
  }

  getAllTileKeys() {
    return new Set(this.state.gameMap.tiles.map((tile) => tileKey(tile)));
  }

  drawVisionMask(visibleKeys = this.getVisibleKeysForRender(), discoveredKeys = this.getDiscoveredKeysForRender()) {
    const viewer = this.getViewerPlayer();
    if (this.isSpectatorVisionActive() || !viewer?.position) {
      return;
    }

    const hexRadius = this.state.gameMap.hexSize * this.camera.zoom;
    const playerExtractionKeys = new Set(
      this.state.gameMap.extractionPoints
        .filter((extractionTile) => this.state.canPlayerExtractFromTile(viewer, extractionTile))
        .map((extractionTile) => tileKey(extractionTile))
    );

    this.ctx.save();
    for (const tile of this.state.gameMap.tiles) {
      const key = tileKey(tile);
      if (visibleKeys.has(key) || playerExtractionKeys.has(key)) {
        continue;
      }

      const center = this.worldToScreen(this.hexToWorld(tile));
      const corners = getHexCorners(center, hexRadius * 1.02);

      this.ctx.beginPath();
      corners.forEach((corner, index) => {
        if (index === 0) this.ctx.moveTo(corner.x, corner.y);
        else this.ctx.lineTo(corner.x, corner.y);
      });
      this.ctx.closePath();
      this.ctx.fillStyle = discoveredKeys.has(key) ? "rgba(8, 10, 12, 0.34)" : "rgba(8, 10, 12, 0.68)";
      this.ctx.fill();
      this.ctx.strokeStyle = "rgba(18, 22, 26, 0.72)";
      this.ctx.lineWidth = Math.max(0.8, this.camera.zoom);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  shouldUseFastRender() {
    return this.isMobileViewport && performance.now() < this.fastRenderUntil;
  }

  drawShotEffect(effect, progress) {
    const from = this.worldToScreen(this.hexToWorld(effect.from));
    const to = this.worldToScreen(this.hexToWorld(effect.to));
    const current = {
      x: from.x + (to.x - from.x) * progress,
      y: from.y + (to.y - from.y) * progress
    };

    this.ctx.save();
    this.ctx.strokeStyle = "rgba(255, 232, 179, 0.82)";
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(current.x, current.y);
    this.ctx.stroke();

    this.ctx.fillStyle = "#fff3c4";
    this.ctx.beginPath();
    this.ctx.arc(current.x, current.y, 3.2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawHitEffect(effect, progress) {
    const center = this.worldToScreen(this.hexToWorld(effect.to));
    const radius = 12 + progress * 14;
    const alpha = 1 - progress;

    this.ctx.save();
    this.ctx.strokeStyle = `rgba(255, 129, 115, ${alpha})`;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawDamageTextEffect(effect, progress) {
    const center = this.worldToScreen(this.hexToWorld(effect.to));
    const offsetY = 8 + progress * 34 + effect.stackOffset;
    const alpha = 1 - progress;

    this.ctx.save();
    this.ctx.fillStyle = `rgba(255, 244, 232, ${alpha})`;
    this.ctx.strokeStyle = `rgba(92, 20, 15, ${alpha})`;
    this.ctx.lineWidth = 3;
    this.ctx.font = "700 14px Inter, system-ui, sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.strokeText(effect.label, center.x, center.y - offsetY);
    this.ctx.fillText(effect.label, center.x, center.y - offsetY);
    this.ctx.restore();
  }

  playAttackAnimation(summary) {
    if (!summary?.from || !summary?.to) {
      return;
    }

    const now = performance.now();
    const shotCount = Math.max(1, summary.shotCount ?? 1);
    const shotSpacing = 65;
    const shotDuration = 110;

    for (let index = 0; index < shotCount; index += 1) {
      this.effects.push({
        type: "shot",
        start: now + index * shotSpacing,
        duration: shotDuration,
        from: summary.from,
        to: summary.to
      });
    }

    const hitStart = now + Math.max(0, (shotCount - 1) * shotSpacing) + Math.min(shotDuration, 85);
    this.effects.push({
      type: "hit",
      start: hitStart,
      duration: 260,
      to: summary.to,
      targetId: summary.targetId
    });

    summary.damageEvents.forEach((damageEvent, index) => {
      this.effects.push({
        type: "damageText",
        start: hitStart + index * 170,
        duration: 880,
        to: summary.to,
        label: `${bodyPartLabel(damageEvent.bodyPart)} -${damageEvent.damage}`,
        stackOffset: index * 12,
        targetId: summary.targetId
      });
    });

    this.ensureAnimationLoop();
  }

  playEventDamageAnimation(targetId, position, damageEvents = []) {
    if (!position) {
      return;
    }

    const now = performance.now();
    this.effects.push({
      type: "hit",
      start: now,
      duration: 300,
      to: position,
      targetId
    });

    damageEvents.forEach((damageEvent, index) => {
      this.effects.push({
        type: "damageText",
        start: now + index * 160,
        duration: 900,
        to: position,
        label: `${bodyPartLabel(damageEvent.bodyPart)} -${damageEvent.damage}`,
        stackOffset: index * 12,
        targetId
      });
    });

    this.ensureAnimationLoop();
  }

  playMovementAnimation(unitId, path) {
    if (!Array.isArray(path) || path.length < 2) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.effects.push({
        type: "move",
        unitId,
        path: path.map((step) => ({ q: step.q, r: step.r })),
        start: performance.now(),
        duration: (path.length - 1) * 240,
        segmentDuration: 240,
        lastStepIndex: -1,
        resolve
      });
      this.ensureAnimationLoop();
    });
  }

  ensureAnimationLoop() {
    if (this.animationFrame) {
      return;
    }

    const tick = (time) => {
      this.animationFrame = null;
      this.lastAnimationTime = time;
      const before = this.effects.length;
      const expired = [];
      this.effects.forEach((effect) => {
        if (effect.type === "move") {
          this.updateMovementEffect(effect, time);
        }
      });
      this.effects = this.effects.filter((effect) => {
        const active = time <= effect.start + effect.duration;

        if (!active) {
          expired.push(effect);
        }

        return active;
      });
      expired.forEach((effect) => effect.resolve?.());
      this.render();

      if (this.effects.length > 0 || before > 0) {
        this.animationFrame = requestAnimationFrame(tick);
      }
    };

    this.animationFrame = requestAnimationFrame(tick);
  }

  updateMovementEffect(effect, now) {
    const path = effect.path ?? [];

    if (path.length < 2) {
      return;
    }

    const elapsed = Math.max(0, now - effect.start);
    const segmentDuration = effect.segmentDuration ?? 240;
    const totalSegments = path.length - 1;
    const segmentIndex = Math.min(totalSegments - 1, Math.floor(elapsed / segmentDuration));

    if (segmentIndex <= effect.lastStepIndex) {
      return;
    }

    effect.lastStepIndex = segmentIndex;
    this.onMovementStep?.({
      unitId: effect.unitId,
      stepIndex: segmentIndex,
      from: path[segmentIndex],
      to: path[segmentIndex + 1]
    });
  }

  getMovementEffectPosition(effect, now) {
    const path = effect.path ?? [];

    if (path.length < 2) {
      return path[0] ?? null;
    }

    const elapsed = Math.max(0, now - effect.start);
    const segmentDuration = effect.segmentDuration ?? 240;
    const totalSegments = path.length - 1;
    const segmentIndex = Math.min(totalSegments - 1, Math.floor(elapsed / segmentDuration));
    const segmentElapsed = elapsed - segmentIndex * segmentDuration;
    const travelDuration = segmentDuration * 0.58;
    const from = path[segmentIndex];
    const to = path[segmentIndex + 1];

    if (!from || !to) {
      return path[path.length - 1] ?? null;
    }

    if (segmentElapsed >= travelDuration) {
      return to;
    }

    const progress = easeOutCubic(segmentElapsed / travelDuration);

    return {
      q: from.q + (to.q - from.q) * progress,
      r: from.r + (to.r - from.r) * progress
    };
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

  getTileFromEvent(event) {
    const rect = this.canvas.getBoundingClientRect();
    const screenPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    const gridPoint = this.screenToGrid(screenPoint);
    const hex = pixelToHex(gridPoint, this.state.gameMap.hexSize);

    return this.state.gameMap.tilesByKey.get(tileKey(hex)) ?? null;
  }

  getTileScreenCenter(tile) {
    const center = this.worldToScreen(this.hexToWorld(tile));
    const rect = this.canvas.getBoundingClientRect();

    return {
      x: rect.left + center.x,
      y: rect.top + center.y
    };
  }

  hexToWorld(hex) {
    const point = hexToPixel(hex, this.state.gameMap.hexSize);
    const rotated = rotatePoint(point, degreesToRadians(this.state.gameMap.gridRotation));

    return {
      x: rotated.x + this.state.gameMap.originX,
      y: rotated.y + this.state.gameMap.originY
    };
  }

  screenToGrid(point) {
    const world = this.screenToWorld(point);
    const translated = {
      x: world.x - this.state.gameMap.originX,
      y: world.y - this.state.gameMap.originY
    };

    return rotatePoint(translated, -degreesToRadians(this.state.gameMap.gridRotation));
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

  getWorldBounds() {
    if (this.state.gameMap.tiles.length === 0) {
      return {
        minX: -100,
        minY: -100,
        width: 200,
        height: 200
      };
    }

    const size = this.state.gameMap.hexSize;
    const points = this.state.gameMap.tiles.map((tile) => this.hexToWorld(tile));
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const padding = size * 3;

    return {
      minX: Math.min(...xs) - padding,
      minY: Math.min(...ys) - padding,
      width: Math.max(...xs) - Math.min(...xs) + padding * 2,
      height: Math.max(...ys) - Math.min(...ys) + padding * 2
    };
  }

  replaceState(state) {
    this.state = state;
    this.effects = [];
    this.loadBackground();
    this.centerCamera();
    this.requestRender();
  }
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

function getPlayerTokenFill({ active, attackable, hitFlash, tokenSkin }) {
  if (hitFlash) {
    return "#f18e84";
  }

  const advanced = TOKEN_SKIN_STYLES[tokenSkin];
  if (advanced) {
    return attackable ? "#b5302d" : active ? advanced.activeFill : advanced.fill;
  }

  if (tokenSkin === "token_ember") {
    return active ? "#8a3f22" : attackable ? "#b5302d" : "#a85d32";
  }

  if (tokenSkin === "token_white_ring") {
    return active ? "#203b3d" : attackable ? "#b5302d" : "#5d8588";
  }

  if (tokenSkin === "token_signal_blue") {
    return active ? "#123d59" : attackable ? "#b5302d" : "#1b6f9b";
  }

  if (tokenSkin === "token_hazard") {
    return active ? "#5a4610" : attackable ? "#b5302d" : "#8a6b1b";
  }

  return active ? "#1b383a" : attackable ? "#b5302d" : "#4c7780";
}

function getPlayerTokenStroke({ active, tokenSkin }) {
  const advanced = TOKEN_SKIN_STYLES[tokenSkin];
  if (advanced) {
    return active ? advanced.activeStroke : advanced.stroke;
  }

  if (tokenSkin === "token_ember") {
    return active ? "#ffe0b2" : "#ffb46f";
  }

  if (tokenSkin === "token_white_ring") {
    return "#ffffff";
  }

  if (tokenSkin === "token_signal_blue") {
    return active ? "#d6f3ff" : "#8ed8ff";
  }

  if (tokenSkin === "token_hazard") {
    return active ? "#fff0a8" : "#ffd457";
  }

  return active ? "#ffffff" : "#e7efe8";
}

const TOKEN_SKIN_STYLES = {
  token_standard_issue: { fill: "#4f5a52", activeFill: "#27342f", stroke: "#dce5d8", activeStroke: "#ffffff", accent: "#dce5d8", top: "#5b655d", mid: "#2e3732", low: "#121817", mode: "standard" },
  token_recon: { fill: "#2f5940", activeFill: "#183526", stroke: "#9dc6a6", activeStroke: "#d7ffe1", accent: "#9dc6a6", top: "#405144", mid: "#203129", low: "#0d1412", mode: "recon" },
  token_thermal: { fill: "#7a4b2a", activeFill: "#3b2519", stroke: "#f0a35c", activeStroke: "#ffd0a0", accent: "#f0a35c", top: "#5b4132", mid: "#281e1a", low: "#100d0c", mode: "thermal" },
  token_hazmat: { fill: "#77702c", activeFill: "#383612", stroke: "#d4c45b", activeStroke: "#fff1a5", accent: "#d4c45b", top: "#565238", mid: "#2c2b1d", low: "#12120c", mode: "hazmat" },
  token_jammer: { fill: "#2b6370", activeFill: "#17343b", stroke: "#78a9b7", activeStroke: "#c9f5ff", accent: "#78a9b7", top: "#334b52", mid: "#1b282c", low: "#0b1113", mode: "jammer" },
  token_black_cell: { fill: "#161a1d", activeFill: "#070909", stroke: "#7f8790", activeStroke: "#d1d6db", accent: "#7f8790", top: "#282c31", mid: "#111417", low: "#040505", mode: "blackCell" },
  token_contraband: { fill: "#73502c", activeFill: "#332112", stroke: "#b9854b", activeStroke: "#f1c47f", accent: "#b9854b", top: "#4f3929", mid: "#251a14", low: "#100b09", mode: "contraband" },
  token_extraction_mark: { fill: "#426735", activeFill: "#1f321b", stroke: "#b8f36e", activeStroke: "#edffd2", accent: "#b8f36e", top: "#4c6840", mid: "#243522", low: "#0d130d", mode: "extract" }
};

function drawDemoScaleToken(ctx, center, radius, tokenSkin, label, { attackable = false, hitFlash = false, detailLevel = 1 } = {}) {
  const style = TOKEN_SKIN_STYLES[tokenSkin];
  if (!style) return;

  const scale = radius / 34;
  const accent = attackable ? "#ff8b7c" : hitFlash ? "#ffd0c9" : style.accent;

  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.scale(scale, scale);

  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fillStyle = "#050707";
  ctx.fill();

  const shell = ctx.createRadialGradient(-8, -12, 3, 0, 0, 34);
  shell.addColorStop(0, hitFlash ? "#f18e84" : style.top);
  shell.addColorStop(0.58, attackable ? "#6b2422" : style.mid);
  shell.addColorStop(1, style.low);
  ctx.beginPath();
  ctx.arc(0, 0, 32, 0, Math.PI * 2);
  ctx.fillStyle = shell;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, 31, 0, Math.PI * 2);
  ctx.clip();
  drawTokenTexture(ctx, style, detailLevel);
  drawTokenBody(ctx, style, accent, detailLevel);
  ctx.restore();

  drawTokenRing(ctx, style, accent, detailLevel);

  ctx.beginPath();
  ctx.arc(0, 0, 13.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(5,8,8,0.74)";
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.globalAlpha = 1;

  if (detailLevel > 0) {
    ctx.fillStyle = "#f7f8ee";
    ctx.font = "900 13px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 2.6);
  }

  ctx.restore();
}

function drawTokenTexture(ctx, style, detailLevel) {
  if (detailLevel <= 0) return;

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = style.accent;
  ctx.fillStyle = style.accent;
  ctx.lineWidth = 1;

  if (style.mode === "recon") {
    for (let x = -28; x <= 28; x += 8) {
      for (let y = -28; y <= 28; y += 8) {
        ctx.beginPath();
        ctx.arc(x + 2, y + 2, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (style.mode === "thermal" || style.mode === "jammer") {
    for (let y = -28; y <= 28; y += 8) {
      ctx.beginPath();
      ctx.moveTo(-31, y);
      ctx.lineTo(31, y);
      ctx.stroke();
    }
  } else if (style.mode === "blackCell") {
    for (let x = -32; x < 32; x += 8) {
      for (let y = -32; y < 32; y += 8) {
        if (((x + y) / 8) % 2 === 0) {
          ctx.fillRect(x, y, 4, 4);
        }
      }
    }
  } else {
    for (let offset = -48; offset <= 48; offset += 10) {
      ctx.beginPath();
      ctx.moveTo(offset, 31);
      ctx.lineTo(offset + 36, -31);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawTokenBody(ctx, style, accent, detailLevel) {
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;
  ctx.lineWidth = 1.6;

  if (style.mode === "standard") {
    const slash = ctx.createLinearGradient(-24, -24, 24, 24);
    slash.addColorStop(0, accent);
    slash.addColorStop(1, "rgba(255,255,255,0.08)");
    ctx.globalAlpha = 0.34;
    ctx.beginPath();
    ctx.moveTo(-18, 12);
    ctx.lineTo(18, -12);
    ctx.lineTo(22, -6);
    ctx.lineTo(-14, 18);
    ctx.closePath();
    ctx.fillStyle = slash;
    ctx.fill();
    ctx.globalAlpha = 0.52;
    ctx.beginPath();
    ctx.moveTo(-14, 14);
    ctx.lineTo(14, 14);
    ctx.stroke();
  } else if (style.mode === "recon") {
    ctx.globalAlpha = 0.44;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.arc(16, -14, 3, 0, Math.PI * 2);
    ctx.fill();
    drawCrosshair(ctx, accent);
  } else if (style.mode === "thermal") {
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.moveTo(-24, 14);
    ctx.bezierCurveTo(-12, 6, -11, -6, 2, -9);
    ctx.bezierCurveTo(13, -12, 19, -19, 26, -24);
    ctx.lineTo(26, 22);
    ctx.lineTo(-24, 22);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(12, -12, 5, 0, Math.PI * 2);
    ctx.fill();
    drawBodyLines(ctx, "rgba(255,255,255,0.12)", [-11, -4, 3, 10]);
  } else if (style.mode === "hazmat") {
    ctx.globalAlpha = 0.44;
    ctx.beginPath();
    ctx.moveTo(0, -23);
    ctx.lineTo(21, 14);
    ctx.lineTo(-21, 14);
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(0, 2, 9, 0, Math.PI * 2);
    ctx.stroke();
    drawCross(ctx);
  } else if (style.mode === "jammer") {
    ctx.globalAlpha = 0.62;
    drawBodyLines(ctx, accent, [-6, 2, 10]);
    ctx.globalAlpha = 0.5;
    ctx.fillRect(-18, -18, 10, 9);
  } else if (style.mode === "blackCell") {
    ctx.globalAlpha = 0.26;
    ctx.beginPath();
    ctx.moveTo(-20, -16);
    ctx.lineTo(20, -20);
    ctx.lineTo(16, 20);
    ctx.lineTo(-16, 16);
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.strokeRect(-13, -10, 26, 20);
    if (detailLevel >= 2) {
      ctx.beginPath();
      ctx.moveTo(-13, 10);
      ctx.lineTo(13, -10);
      ctx.stroke();
    }
  } else if (style.mode === "contraband") {
    ctx.globalAlpha = 0.26;
    ctx.beginPath();
    ctx.moveTo(-23, 8);
    ctx.lineTo(23, -14);
    ctx.lineTo(25, -7);
    ctx.lineTo(-21, 15);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.7;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(-11, 20);
    ctx.lineTo(11, 20);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (style.mode === "extract") {
    ctx.globalAlpha = 0.48;
    ctx.beginPath();
    ctx.moveTo(0, -23);
    ctx.lineTo(19, -5);
    ctx.lineTo(12, -5);
    ctx.lineTo(12, 16);
    ctx.lineTo(-12, 16);
    ctx.lineTo(-12, -5);
    ctx.lineTo(-19, -5);
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 0.82;
    ctx.beginPath();
    ctx.arc(0, -11, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawTokenRing(ctx, style, accent, detailLevel) {
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;

  if (style.mode === "standard") {
    ctx.globalAlpha = 0.42;
    ctx.beginPath();
    ctx.arc(0, 0, 27, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.48;
    drawCompassTicks(ctx);
  } else if (style.mode === "recon") {
    ctx.globalAlpha = 0.44;
    ctx.setLineDash([12, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (style.mode === "thermal") {
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 27, Math.PI, Math.PI * 1.5);
    ctx.stroke();
    ctx.strokeStyle = "#9c2f26";
    ctx.beginPath();
    ctx.arc(0, 0, 27, 0, Math.PI * 0.5);
    ctx.stroke();
  } else if (style.mode === "hazmat") {
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.72;
    ctx.setLineDash([9, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (style.mode === "jammer") {
    ctx.globalAlpha = 0.7;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.arc(0, -2, 28, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.arc(0, 0, 30, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();
  } else if (style.mode === "blackCell") {
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.62;
    ctx.beginPath();
    ctx.arc(0, 0, 29, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
  } else if (style.mode === "contraband") {
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.48;
    ctx.setLineDash([18, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, 27, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (style.mode === "extract") {
    ctx.globalAlpha = 0.9;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 29, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    if (detailLevel >= 1) {
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.68;
      ctx.beginPath();
      ctx.moveTo(0, -31);
      ctx.lineTo(5, -24);
      ctx.lineTo(-5, -24);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 31);
      ctx.lineTo(-5, 24);
      ctx.lineTo(5, 24);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawCrosshair(ctx, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.lineTo(-7, 0);
  ctx.moveTo(7, 0);
  ctx.lineTo(16, 0);
  ctx.moveTo(0, -16);
  ctx.lineTo(0, -7);
  ctx.moveTo(0, 7);
  ctx.lineTo(0, 16);
  ctx.stroke();
}

function drawBodyLines(ctx, color, rows) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  rows.forEach((y, index) => {
    ctx.beginPath();
    ctx.moveTo(-20 + index * 2, y);
    ctx.lineTo(20 - index * 2, y - 3);
    ctx.stroke();
  });
}

function drawCross(ctx) {
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(0, 11);
  ctx.moveTo(-9, 7);
  ctx.lineTo(9, -3);
  ctx.moveTo(-9, -3);
  ctx.lineTo(9, 7);
  ctx.stroke();
}

function drawCompassTicks(ctx) {
  ctx.beginPath();
  ctx.moveTo(0, -29);
  ctx.lineTo(0, -22);
  ctx.moveTo(0, 22);
  ctx.lineTo(0, 29);
  ctx.moveTo(-29, 0);
  ctx.lineTo(-22, 0);
  ctx.moveTo(22, 0);
  ctx.lineTo(29, 0);
  ctx.stroke();
}

function drawAdvancedTokenMarkings(ctx, center, radius, tokenSkin, detailLevel = 1) {
  const style = TOKEN_SKIN_STYLES[tokenSkin];
  if (!style) {
    return;
  }

  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.strokeStyle = style.accent;
  ctx.fillStyle = style.accent;
  ctx.lineWidth = 1.4;

  if (style.mode === "standard") {
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.82, radius * 0.35);
    ctx.lineTo(radius * 0.82, -radius * 0.42);
    ctx.stroke();
  } else if (style.mode === "recon") {
    ctx.globalAlpha = 0.66;
    if (detailLevel >= 1) {
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(0, 0, radius + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.beginPath();
    ctx.arc(radius * 0.62, -radius * 0.62, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (style.mode === "thermal") {
    ctx.globalAlpha = 0.42;
    (detailLevel >= 2 ? [-5, 0, 5] : [0]).forEach((y, index) => {
      ctx.beginPath();
      ctx.moveTo(-radius + index * 2, y);
      ctx.lineTo(radius - index * 2, y - 3);
      ctx.stroke();
    });
  } else if (style.mode === "hazmat") {
    ctx.globalAlpha = 0.64;
    if (detailLevel >= 1) {
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(0, 0, radius + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.8);
    ctx.lineTo(radius * 0.62, radius * 0.46);
    ctx.lineTo(-radius * 0.62, radius * 0.46);
    ctx.closePath();
    ctx.stroke();
  } else if (style.mode === "jammer") {
    ctx.globalAlpha = 0.58;
    (detailLevel >= 2 ? [-5, 0, 5] : [-3, 3]).forEach((y, index) => {
      ctx.beginPath();
      ctx.moveTo(-radius, y);
      ctx.lineTo(radius * (0.5 + index * 0.18), y + (index % 2 ? -2 : 2));
      ctx.stroke();
    });
  } else if (style.mode === "blackCell") {
    ctx.globalAlpha = 0.44;
    ctx.strokeRect(-radius * 0.55, -radius * 0.55, radius * 1.1, radius * 1.1);
    if (detailLevel >= 2) {
      ctx.beginPath();
      ctx.moveTo(-radius * 0.52, radius * 0.52);
      ctx.lineTo(radius * 0.52, -radius * 0.52);
      ctx.stroke();
    }
  } else if (style.mode === "contraband") {
    ctx.globalAlpha = 0.5;
    ctx.rotate(-0.35);
    ctx.fillRect(-radius, -3, radius * 2, 6);
    ctx.strokeStyle = "rgba(0,0,0,0.42)";
    ctx.beginPath();
    ctx.moveTo(-radius, 0);
    ctx.lineTo(radius, 0);
    ctx.stroke();
  } else if (style.mode === "extract") {
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.lineTo(radius * 0.66, 0);
    ctx.lineTo(radius * 0.28, 0);
    ctx.lineTo(radius * 0.28, radius * 0.72);
    ctx.lineTo(-radius * 0.28, radius * 0.72);
    ctx.lineTo(-radius * 0.28, 0);
    ctx.lineTo(-radius * 0.66, 0);
    ctx.closePath();
    ctx.stroke();
  }

  ctx.restore();
}

function easeOutCubic(value) {
  return 1 - ((1 - value) ** 3);
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
