import { getHexCorners, hexToPixel, tileKey } from "../core/hex.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export class HexMapRenderer {
  constructor({ container, state, onTileSelected }) {
    this.container = container;
    this.state = state;
    this.onTileSelected = onTileSelected;
    this.svg = document.createElementNS(SVG_NS, "svg");
    this.svg.classList.add("hex-map");
    this.container.append(this.svg);
  }

  render() {
    this.svg.replaceChildren();

    const size = this.state.map.layout.hexSize;
    const positions = this.state.map.tiles.map((tile) => ({
      tile,
      center: hexToPixel(tile, size)
    }));

    const bounds = this.getBounds(positions, size);
    this.svg.setAttribute("viewBox", `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`);

    positions.forEach(({ tile, center }) => {
      this.svg.append(this.createTileGroup(tile, center, size));
    });
  }

  createTileGroup(tile, center, size) {
    const terrain = this.state.getTerrain(tile);
    const group = document.createElementNS(SVG_NS, "g");
    const polygon = document.createElementNS(SVG_NS, "polygon");
    const label = document.createElementNS(SVG_NS, "text");
    const coord = document.createElementNS(SVG_NS, "text");

    group.classList.add("hex-tile");

    if (!tile.walkable) {
      group.classList.add("blocked");
    }

    if (tileKey(tile) === this.state.selectedTileKey) {
      group.classList.add("selected");
    }

    polygon.setAttribute("points", this.pointsToString(getHexCorners(center, size)));
    polygon.setAttribute("fill", terrain.color);
    polygon.setAttribute("stroke", terrain.stroke);
    polygon.setAttribute("stroke-width", "2");

    label.classList.add("hex-label");
    label.setAttribute("x", center.x);
    label.setAttribute("y", center.y - 5);
    label.setAttribute("fill", terrain.textColor);
    label.textContent = terrain.label;

    coord.classList.add("hex-coord");
    coord.setAttribute("x", center.x);
    coord.setAttribute("y", center.y + 11);
    coord.textContent = `${tile.q},${tile.r}`;

    group.append(polygon, label, coord);
    this.appendMarkers(group, tile, center, size);

    group.addEventListener("click", () => {
      this.onTileSelected(tile);
    });

    return group;
  }

  appendMarkers(group, tile, center, size) {
    const markers = [];

    if (tile.extractionPoint) {
      markers.push(this.createCircle(center.x - size * 0.42, center.y - size * 0.36, 7, "#2f6f73", "EX"));
    }

    if (tile.spawnPoint) {
      markers.push(this.createCircle(center.x + size * 0.42, center.y - size * 0.36, 7, "#ffffff", "SP", "#222222"));
    }

    if (tile.lootType !== "none") {
      const color = tile.lootType === "rare" ? "#7660a8" : "#8c772e";
      markers.push(this.createCircle(center.x - size * 0.42, center.y + size * 0.36, 7, color, "LT"));
    }

    if (tile.blocksSight) {
      markers.push(this.createCircle(center.x + size * 0.42, center.y + size * 0.36, 7, "#a3433f", "B"));
    }

    markers.forEach((marker) => group.append(marker));
  }

  createCircle(x, y, radius, fill, text, stroke = "none") {
    const group = document.createElementNS(SVG_NS, "g");
    const circle = document.createElementNS(SVG_NS, "circle");
    const label = document.createElementNS(SVG_NS, "text");

    group.classList.add("marker");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", radius);
    circle.setAttribute("fill", fill);
    circle.setAttribute("stroke", stroke);
    circle.setAttribute("stroke-width", stroke === "none" ? "0" : "2");

    label.setAttribute("x", x);
    label.setAttribute("y", y + 0.5);
    label.setAttribute("fill", fill === "#ffffff" ? "#222222" : "#ffffff");
    label.setAttribute("font-size", "6");
    label.setAttribute("font-weight", "800");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "middle");
    label.textContent = text;

    group.append(circle, label);
    return group;
  }

  getBounds(positions, size) {
    const padding = size * 1.4;
    const xs = positions.map(({ center }) => center.x);
    const ys = positions.map(({ center }) => center.y);
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

  pointsToString(points) {
    return points.map((point) => `${point.x},${point.y}`).join(" ");
  }
}
