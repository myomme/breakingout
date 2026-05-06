import { GameState } from "./core/gameState.js";
import { SPAWN_SLOT_GROUPS } from "./core/spawnSlots.js";
import { BRUSHES } from "./editor/brushes.js";
import { createLargeHexMap } from "./editor/gridGenerator.js";
import { CanvasMapEditor } from "./render/canvasMapEditor.js";

const canvas = document.querySelector("#mapCanvas");
const minimap = document.querySelector("#minimap");
const brushSelect = document.querySelector("#brushSelect");
const brushSize = document.querySelector("#brushSize");
const spawnSlotSelect = document.querySelector("#spawnSlotSelect");
const brushStatus = document.querySelector("#brushStatus");
const mapStats = document.querySelector("#mapStats");
const tileDetails = document.querySelector("#tileDetails");
const exportButton = document.querySelector("#exportMap");
const exportGameButton = document.querySelector("#exportGameMap");
const importInput = document.querySelector("#importMap");
const backgroundInput = document.querySelector("#backgroundImage");
const clearBackgroundButton = document.querySelector("#clearBackground");
const generateButton = document.querySelector("#generateGrid");
const columnsInput = document.querySelector("#gridColumns");
const rowsInput = document.querySelector("#gridRows");
const hexSizeInput = document.querySelector("#hexSize");
const originXInput = document.querySelector("#originX");
const originYInput = document.querySelector("#originY");
const rotationInput = document.querySelector("#gridRotation");
const opacityInput = document.querySelector("#gridOpacity");
const bgScaleInput = document.querySelector("#backgroundScale");
const bgLayerSelect = document.querySelector("#backgroundLayer");
const bgXInput = document.querySelector("#backgroundX");
const bgYInput = document.querySelector("#backgroundY");
const homeButton = document.querySelector("#homeView");

async function loadJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  return response.json();
}

async function bootstrap() {
  const terrainTypes = await loadJson("./data/rules/terrainTypes.json");
  const map = createLargeHexMap({
    columns: Number(columnsInput.value),
    rows: Number(rowsInput.value),
    hexSize: Number(hexSizeInput.value)
  });

  populateBrushes();
  populateSpawnSlots();

  const state = new GameState({ map, terrainTypes });
  const editor = new CanvasMapEditor({
    canvas,
    minimap,
    state,
    brushSelect,
    sizeSelect: brushSize,
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
    onBrushPicked: (brush) => {
      brushStatus.textContent = brush.label;
    },
    onStatsChanged: ({ total, enabled, disabled, zoom }) => {
      mapStats.textContent = `${enabled}/${total} enabled, ${disabled} removed, zoom ${Math.round(zoom * 100)}%`;
    },
    onStatusChanged: (message) => {
      brushStatus.textContent = message;
    }
  });

  editor.renderTileDetails();
}

function populateBrushes() {
  Object.values(BRUSHES).forEach((brush) => {
    const option = document.createElement("option");

    option.value = brush.id;
    option.textContent = brush.label;
    option.brush = brush;
    brushSelect.append(option);
  });
}

function populateSpawnSlots() {
  SPAWN_SLOT_GROUPS.forEach((group) => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = `${group.group} 라인`;

    group.slots.forEach((slot) => {
      const option = document.createElement("option");
      option.value = slot;
      option.textContent = slot;
      optgroup.append(option);
    });

    spawnSlotSelect.append(optgroup);
  });
}

bootstrap().catch((error) => {
  canvas.replaceWith(document.createTextNode(error.message));
});
