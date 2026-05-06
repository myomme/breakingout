const SQRT_3 = Math.sqrt(3);
const AXIAL_DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 }
];

export function hexToPixel(hex, size) {
  return {
    x: size * (SQRT_3 * hex.q + (SQRT_3 / 2) * hex.r),
    y: size * (1.5 * hex.r)
  };
}

export function pixelToHex(point, size) {
  const q = ((SQRT_3 / 3) * point.x - (1 / 3) * point.y) / size;
  const r = ((2 / 3) * point.y) / size;

  return roundAxial({ q, r });
}

export function roundAxial(hex) {
  let q = Math.round(hex.q);
  let r = Math.round(hex.r);
  let s = Math.round(-hex.q - hex.r);

  const qDiff = Math.abs(q - hex.q);
  const rDiff = Math.abs(r - hex.r);
  const sDiff = Math.abs(s - (-hex.q - hex.r));

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  } else {
    s = -q - r;
  }

  return { q, r };
}

export function getHexCorners(center, size) {
  const corners = [];

  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    corners.push({
      x: center.x + size * Math.cos(angle),
      y: center.y + size * Math.sin(angle)
    });
  }

  return corners;
}

export function hexDistance(a, b) {
  return (
    Math.abs(a.q - b.q) +
    Math.abs(a.q + a.r - b.q - b.r) +
    Math.abs(a.r - b.r)
  ) / 2;
}

export function hexLine(a, b) {
  const distance = hexDistance(a, b);
  const results = [];

  if (distance === 0) {
    return [{ q: a.q, r: a.r }];
  }

  for (let i = 0; i <= distance; i += 1) {
    const t = i / distance;
    results.push(roundAxial({
      q: lerp(a.q, b.q, t),
      r: lerp(a.r, b.r, t)
    }));
  }

  return dedupeHexes(results);
}

export function hexesInRadius(center, radius) {
  const results = [];

  for (let dq = -radius; dq <= radius; dq += 1) {
    const minDr = Math.max(-radius, -dq - radius);
    const maxDr = Math.min(radius, -dq + radius);

    for (let dr = minDr; dr <= maxDr; dr += 1) {
      results.push({ q: center.q + dq, r: center.r + dr });
    }
  }

  return results;
}

export function getHexNeighbors(hex) {
  return AXIAL_DIRECTIONS.map((direction) => ({
    q: hex.q + direction.q,
    r: hex.r + direction.r
  }));
}

export function tileKey(tile) {
  return `${tile.q},${tile.r}`;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function dedupeHexes(hexes) {
  const seen = new Set();
  const results = [];

  hexes.forEach((hex) => {
    const key = tileKey(hex);

    if (!seen.has(key)) {
      seen.add(key);
      results.push(hex);
    }
  });

  return results;
}
