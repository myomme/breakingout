import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 5173);
const HOST = process.env.HOST ?? "0.0.0.0";
const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const clients = new Set();
let rooms = [];
const snapshots = new Map();
const ROOM_TTL_MS = 12 * 60 * 60 * 1000;

const MIME_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".mp3", "audio/mpeg"],
  [".svg", "image/svg+xml"]
]);

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
    if (url.pathname === "/healthz") {
      response.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      });
      response.end(JSON.stringify({
        ok: true,
        rooms: rooms.length,
        clients: clients.size,
        uptime: Math.floor(process.uptime())
      }));
      return;
    }

    const pathname = decodeURIComponent(url.pathname === "/" ? "/game.html" : url.pathname);
    const filePath = path.normalize(path.join(__dirname, pathname));

    if (!filePath.startsWith(__dirname)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const data = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES.get(path.extname(filePath).toLowerCase()) ?? "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(data);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.on("upgrade", (request, socket) => {
  if (request.headers.upgrade?.toLowerCase() !== "websocket") {
    socket.destroy();
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  if (url.pathname !== "/ws") {
    socket.destroy();
    return;
  }

  const key = request.headers["sec-websocket-key"];
  if (!key) {
    socket.destroy();
    return;
  }

  const accept = crypto.createHash("sha1").update(`${key}${WS_GUID}`).digest("base64");
  socket.write([
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${accept}`,
    "\r\n"
  ].join("\r\n"));

  const client = {
    socket,
    id: crypto.randomUUID(),
    buffer: Buffer.alloc(0),
    fragments: [],
    alive: true
  };
  clients.add(client);
  sendJson(client, { type: "roomsChanged", reason: "serverSync", sourceId: "server", rooms, at: Date.now() });

  socket.on("data", (chunk) => {
    client.buffer = Buffer.concat([client.buffer, chunk]);
    parseFrames(client);
  });
  socket.on("close", () => clients.delete(client));
  socket.on("error", () => clients.delete(client));
});

function parseFrames(client) {
  while (client.buffer.length >= 2) {
    const first = client.buffer[0];
    const second = client.buffer[1];
    const finalFrame = Boolean(first & 0x80);
    const opcode = first & 0x0f;
    const masked = Boolean(second & 0x80);
    let length = second & 0x7f;
    let offset = 2;

    if (length === 126) {
      if (client.buffer.length < offset + 2) return;
      length = client.buffer.readUInt16BE(offset);
      offset += 2;
    } else if (length === 127) {
      if (client.buffer.length < offset + 8) return;
      length = Number(client.buffer.readBigUInt64BE(offset));
      offset += 8;
    }

    const maskLength = masked ? 4 : 0;
    if (client.buffer.length < offset + maskLength + length) return;

    const mask = masked ? client.buffer.subarray(offset, offset + 4) : null;
    offset += maskLength;
    const payload = client.buffer.subarray(offset, offset + length);
    client.buffer = client.buffer.subarray(offset + length);

    if (opcode === 0x8) {
      client.socket.end();
      clients.delete(client);
      return;
    }

    if (opcode === 0x9) {
      sendFrame(client.socket, Buffer.alloc(0), 0xA);
      continue;
    }

    const data = Buffer.alloc(payload.length);
    for (let index = 0; index < payload.length; index += 1) {
      data[index] = mask ? payload[index] ^ mask[index % 4] : payload[index];
    }

    if (opcode === 0x0) {
      client.fragments.push(data);
      if (!finalFrame) continue;
      const completePayload = Buffer.concat(client.fragments);
      client.fragments = [];
      readClientJson(client, completePayload);
      continue;
    }

    if (opcode !== 0x1) continue;

    if (!finalFrame) {
      client.fragments = [data];
      continue;
    }

    const completePayload = client.fragments.length ? Buffer.concat([...client.fragments, data]) : data;
    client.fragments = [];
    readClientJson(client, completePayload);
  }
}

function readClientJson(client, data) {
    try {
      handleMessage(client, JSON.parse(data.toString("utf8")));
    } catch (error) {
      sendJson(client, {
        type: "serverError",
        message: "Malformed message",
        detail: error.message
      });
    }
}

function handleMessage(client, message) {
  if (!message?.type) return;

  if (message.type === "getRooms") {
    pruneRooms();
    sendJson(client, { type: "roomsChanged", reason: "serverSync", sourceId: "server", rooms, at: Date.now() });
    return;
  }

  if (message.type === "roomAction") {
    handleRoomAction(client, message);
    return;
  }

  if (message.type === "roomsChanged") {
    rooms = mergeRooms(rooms, Array.isArray(message.rooms) ? message.rooms : []).slice(0, 32);
    pruneRooms();
    broadcast({ ...message, rooms, sourceClientId: client.id });
    return;
  }

  if (message.type === "gameSnapshot") {
    if (message.roomId) snapshots.set(message.roomId, message);
    broadcast({ ...message, sourceClientId: client.id });
    return;
  }

  if (message.type === "getGameSnapshot") {
    const snapshot = snapshots.get(message.roomId);
    if (snapshot) sendJson(client, snapshot);
    return;
  }

  if (message.type === "playerCommand") {
    broadcast({ ...message, sourceClientId: client.id });
  }
}

function handleRoomAction(client, message) {
  const action = String(message.action ?? "");
  const payload = message.payload ?? {};
  const playerId = message.sourceId ?? payload.playerId ?? null;
  let result;

  try {
    switch (action) {
      case "createRoom":
        result = createServerRoom(payload, playerId);
        break;
      case "joinRoom":
        result = joinServerRoom(payload, playerId);
        break;
      case "leaveRoom":
        result = leaveServerRoom(payload, playerId);
        break;
      case "ready":
        result = setServerReady(payload, playerId);
        break;
      case "slotType":
        result = setServerSlotType(payload, playerId);
        break;
      case "slotLoadout":
        result = setServerSlotLoadout(payload, playerId);
        break;
      case "setMap":
        result = setServerMap(payload, playerId);
        break;
      case "setStatus":
        result = setServerStatus(payload, playerId);
        break;
      case "heartbeat":
        result = touchServerPresence(payload, playerId);
        break;
      default:
        result = { ok: false, message: "Unknown room action" };
        break;
    }
  } catch (error) {
    result = { ok: false, message: error.message || "Room action failed" };
  }

  sendJson(client, {
    type: "roomActionResult",
    action,
    actionId: message.actionId ?? null,
    ok: Boolean(result?.ok),
    message: result?.message ?? "",
    room: result?.room ?? null,
    sourceId: "server",
    targetPlayerId: playerId,
    at: Date.now()
  });

  if (result?.ok) {
    pruneRooms();
    broadcastRooms(action);
  }
}

function broadcast(message) {
  for (const client of clients) {
    sendJson(client, message);
  }
}

function sendJson(client, data) {
  if (client.socket.destroyed) return;
  try {
    sendFrame(client.socket, Buffer.from(JSON.stringify(data), "utf8"), 0x1);
  } catch {
    clients.delete(client);
  }
}

function sendFrame(socket, payload, opcode = 0x1) {
  const length = payload.length;
  let header;

  if (length < 126) {
    header = Buffer.from([0x80 | opcode, length]);
  } else if (length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }

  socket.write(Buffer.concat([header, payload]));
}

server.listen(PORT, HOST, () => {
  console.log(`Breaking Out server running at http://${HOST}:${PORT}/game.html`);
});

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

function shutdown() {
  for (const client of clients) {
    client.socket.end();
  }
  server.close(() => {
    process.exit(0);
  });
}

function broadcastRooms(reason = "roomAction") {
  broadcast({ type: "roomsChanged", reason, sourceId: "server", rooms, at: Date.now() });
}

function createServerRoom(payload, playerId) {
  if (!playerId) return { ok: false, message: "Missing player id" };
  const player = sanitizePlayer(payload.player, playerId, true);
  const room = {
    id: generateRoomCode(rooms),
    hostId: player.id,
    status: "waiting",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    maxPlayers: clampInt(payload.maxPlayers, 1, 6, 6),
    comCount: 1,
    mapPackage: payload.mapPackage ?? null,
    players: [player],
    slots: createDefaultServerSlots(player)
  };
  syncServerPlayersFromSlots(room);
  rooms.unshift(room);
  rooms = rooms.slice(0, 32);
  return { ok: true, room, message: `Room ${room.id} created` };
}

function joinServerRoom(payload, playerId) {
  if (!playerId) return { ok: false, message: "Missing player id" };
  const room = findRoom(payload.roomId);
  if (!room) return { ok: false, message: "Room not found" };
  if (room.status !== "waiting") return { ok: false, message: "Room already in progress" };

  room.slots = normalizeServerSlots(room.slots);
  let slot = room.slots.find((entry) => entry.type === "player" && entry.playerId === playerId);
  if (!slot) {
    slot = room.slots.find((entry) => entry.type === "open");
    if (!slot) return { ok: false, message: "Room is full" };
  }

  Object.assign(slot, sanitizePlayer(payload.player, playerId, false), {
    type: "player",
    ready: slot.playerId === room.hostId ? true : Boolean(slot.ready),
    connected: true,
    lastSeen: Date.now(),
    disconnectedAt: null
  });

  room.updatedAt = Date.now();
  syncServerPlayersFromSlots(room);
  return { ok: true, room, message: `Joined ${room.id}` };
}

function leaveServerRoom(payload, playerId) {
  const room = findRoom(payload.roomId);
  if (!room) return { ok: true, room: null, message: "Already left" };

  room.slots = normalizeServerSlots(room.slots).map((slot) => (
    slot.type === "player" && slot.playerId === playerId
      ? { type: "open", weaponId: slot.weaponId ?? "AR", armorId: slot.armorId ?? "lightSet" }
      : slot
  ));
  syncServerPlayersFromSlots(room);

  if (!room.players.length) {
    rooms = rooms.filter((entry) => entry.id !== room.id);
    snapshots.delete(room.id);
    return { ok: true, room: null, message: "Room removed" };
  }

  if (room.hostId === playerId) {
    room.hostId = room.players[0].id;
    room.slots = normalizeServerSlots(room.slots).map((slot) => (
      slot.type === "player" && slot.playerId === room.hostId ? { ...slot, ready: true } : slot
    ));
    syncServerPlayersFromSlots(room);
  }

  room.updatedAt = Date.now();
  return { ok: true, room, message: "Left room" };
}

function setServerReady(payload, playerId) {
  const room = findRoom(payload.roomId);
  if (!room) return { ok: false, message: "Room not found" };
  if (room.status !== "waiting") return { ok: false, message: "Game already started" };

  room.slots = normalizeServerSlots(room.slots);
  const slot = room.slots[Number(payload.slotIndex)];
  if (!slot || slot.type !== "player" || slot.playerId !== playerId || playerId === room.hostId) {
    return { ok: false, message: "Cannot change ready state" };
  }
  slot.ready = Boolean(payload.ready);
  slot.lastSeen = Date.now();
  room.updatedAt = Date.now();
  syncServerPlayersFromSlots(room);
  return { ok: true, room, message: "Ready updated" };
}

function setServerSlotType(payload, playerId) {
  const room = findRoom(payload.roomId);
  if (!room) return { ok: false, message: "Room not found" };
  if (room.hostId !== playerId) return { ok: false, message: "Only host can edit slots" };
  if (room.status !== "waiting") return { ok: false, message: "Game already started" };

  room.slots = normalizeServerSlots(room.slots);
  const index = clampInt(payload.slotIndex, 0, 5, -1);
  const type = ["open", "closed", "computer", "player"].includes(payload.slotType) ? payload.slotType : "open";
  if (index < 0) return { ok: false, message: "Invalid slot" };

  const previous = room.slots[index] ?? {};
  if (type === "player" && previous.type !== "player") {
    return { ok: false, message: "Empty player slots are filled by joining players" };
  }

  room.slots[index] = {
    type,
    weaponId: previous.weaponId ?? (type === "computer" ? "SMG" : "AR"),
    armorId: previous.armorId ?? "lightSet",
    ...(type === "player" ? {
      playerId: previous.playerId,
      nickname: previous.nickname,
      ready: previous.playerId === room.hostId || Boolean(previous.ready),
      connected: previous.connected !== false,
      lastSeen: previous.lastSeen ?? Date.now(),
      disconnectedAt: previous.disconnectedAt ?? null
    } : {})
  };
  room.updatedAt = Date.now();
  syncServerPlayersFromSlots(room);
  return { ok: true, room, message: "Slot updated" };
}

function setServerSlotLoadout(payload, playerId) {
  const room = findRoom(payload.roomId);
  if (!room) return { ok: false, message: "Room not found" };
  if (room.status !== "waiting") return { ok: false, message: "Game already started" };

  room.slots = normalizeServerSlots(room.slots);
  const index = clampInt(payload.slotIndex, 0, 5, -1);
  const slot = room.slots[index];
  if (!slot) return { ok: false, message: "Invalid slot" };

  const canEdit = (room.hostId === playerId && slot.type === "computer") ||
    (slot.type === "player" && slot.playerId === playerId);
  if (!canEdit) return { ok: false, message: "Cannot edit this loadout" };

  if (payload.weaponId) slot.weaponId = String(payload.weaponId);
  if (payload.armorId) slot.armorId = String(payload.armorId);
  if (slot.type === "player") {
    slot.ready = slot.playerId === room.hostId ? true : false;
  }
  room.updatedAt = Date.now();
  syncServerPlayersFromSlots(room);
  return { ok: true, room, message: "Loadout updated" };
}

function setServerMap(payload, playerId) {
  const room = findRoom(payload.roomId);
  if (!room) return { ok: false, message: "Room not found" };
  if (room.hostId !== playerId) return { ok: false, message: "Only host can set map" };
  if (room.status !== "waiting") return { ok: false, message: "Game already started" };
  if (!payload.mapPackage) return { ok: false, message: "Missing map package" };

  room.mapPackage = payload.mapPackage;
  room.updatedAt = Date.now();
  return { ok: true, room, message: "Map updated" };
}

function setServerStatus(payload, playerId) {
  const room = findRoom(payload.roomId);
  if (!room) return { ok: false, message: "Room not found" };
  if (room.hostId !== playerId) return { ok: false, message: "Only host can start game" };
  const status = ["waiting", "inProgress", "finished"].includes(payload.status) ? payload.status : "waiting";
  if (status === "inProgress" && !areServerHumansReady(room)) {
    return { ok: false, message: "Not all players are ready" };
  }
  room.status = status;
  room.updatedAt = Date.now();
  syncServerPlayersFromSlots(room);
  return { ok: true, room, message: "Status updated" };
}

function touchServerPresence(payload, playerId) {
  const room = findRoom(payload.roomId);
  if (!room) return { ok: false, message: "Room not found" };
  room.slots = normalizeServerSlots(room.slots);
  const slot = room.slots.find((entry) => entry.type === "player" && entry.playerId === playerId);
  if (!slot) return { ok: false, message: "Player not in room" };
  slot.connected = true;
  slot.lastSeen = Date.now();
  slot.disconnectedAt = null;
  room.updatedAt = Date.now();
  syncServerPlayersFromSlots(room);
  return { ok: true, room, message: "Presence updated" };
}

function mergeRooms(existingRooms = [], incomingRooms = []) {
  const map = new Map();

  [...existingRooms, ...incomingRooms].forEach((room) => {
    if (!room?.id) return;
    const previous = map.get(room.id);
    if (!previous) {
      map.set(room.id, room);
      return;
    }

    const previousTime = Math.max(previous.updatedAt ?? 0, previous.createdAt ?? 0, previous.mapPackage?.updatedAt ?? 0);
    const nextTime = Math.max(room.updatedAt ?? 0, room.createdAt ?? 0, room.mapPackage?.updatedAt ?? 0);
    const base = nextTime >= previousTime ? room : previous;
    const other = base === room ? previous : room;
    map.set(room.id, mergeRoomState(base, other));
  });

  return Array.from(map.values()).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

function mergeRoomState(baseRoom, otherRoom) {
  if (!baseRoom || !otherRoom || baseRoom.id !== otherRoom.id) {
    return baseRoom;
  }

  const mergedRoom = { ...baseRoom };
  mergedRoom.mapPackage = chooseMapPackage(baseRoom.mapPackage, otherRoom.mapPackage);
  mergedRoom.slots = mergeSlots(baseRoom.slots, otherRoom.slots);
  mergedRoom.players = buildPlayersFromSlots(mergedRoom.slots, mergedRoom.hostId);
  mergedRoom.comCount = mergedRoom.slots.filter((slot) => slot.type === "computer").length;
  return mergedRoom;
}

function chooseMapPackage(left, right) {
  if (!left) return right;
  if (!right) return left;
  return (right.updatedAt ?? 0) > (left.updatedAt ?? 0) ? right : left;
}

function mergeSlots(baseSlots = [], otherSlots = []) {
  const slots = Array.from({ length: 6 }, (_, index) => ({
    ...(baseSlots[index] ?? { type: "open", weaponId: "AR", armorId: "lightSet" })
  }));
  const occupiedPlayerIds = new Set(slots.filter((slot) => slot.type === "player" && slot.playerId).map((slot) => slot.playerId));

  otherSlots.forEach((slot) => {
    if (slot?.type !== "player" || !slot.playerId || occupiedPlayerIds.has(slot.playerId)) {
      return;
    }

    const sameIndex = Number.isInteger(slot.slotIndex) ? slot.slotIndex : -1;
    const preferredIndex = sameIndex >= 0 && slots[sameIndex]?.type === "open"
      ? sameIndex
      : slots.findIndex((entry) => entry.type === "open");

    if (preferredIndex >= 0) {
      slots[preferredIndex] = { ...slot };
      occupiedPlayerIds.add(slot.playerId);
    }
  });

  return slots;
}

function buildPlayersFromSlots(slots = [], hostId = null) {
  return slots
    .filter((slot) => slot.type === "player" && slot.playerId)
    .map((slot) => ({
      id: slot.playerId,
      nickname: slot.nickname,
      ready: slot.playerId === hostId || Boolean(slot.ready),
      weaponId: slot.weaponId,
      armorId: slot.armorId,
      isMock: slot.isMock,
      connected: slot.connected !== false,
      lastSeen: slot.lastSeen ?? Date.now(),
      disconnectedAt: slot.disconnectedAt ?? null,
      joinedAt: slot.joinedAt ?? Date.now()
    }));
}

function generateRoomCode(existingRooms = []) {
  const used = new Set(existingRooms.map((room) => room.id));
  let code = "";
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
  } while (used.has(code));
  return code;
}

function findRoom(roomId) {
  return rooms.find((room) => room.id === String(roomId ?? "").trim());
}

function clampInt(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(number)));
}

function sanitizePlayer(player = {}, playerId, ready = false) {
  return {
    id: playerId,
    playerId,
    nickname: String(player.nickname ?? player.name ?? "Player").trim().slice(0, 18) || "Player",
    weaponId: String(player.weaponId ?? "AR"),
    armorId: String(player.armorId ?? "lightSet"),
    ready,
    connected: true,
    lastSeen: Date.now(),
    disconnectedAt: null,
    joinedAt: player.joinedAt ?? Date.now()
  };
}

function createDefaultServerSlots(hostPlayer) {
  const slots = Array.from({ length: 6 }, (_, index) => ({
    slotIndex: index,
    type: "open",
    weaponId: index === 1 ? "SMG" : "AR",
    armorId: "lightSet"
  }));
  slots[0] = {
    ...slots[0],
    type: "player",
    playerId: hostPlayer.id,
    nickname: hostPlayer.nickname,
    weaponId: hostPlayer.weaponId ?? "AR",
    armorId: hostPlayer.armorId ?? "lightSet",
    ready: true,
    connected: true,
    lastSeen: Date.now(),
    disconnectedAt: null,
    joinedAt: hostPlayer.joinedAt ?? Date.now()
  };
  slots[1] = {
    ...slots[1],
    type: "computer",
    weaponId: "SMG",
    armorId: "lightSet"
  };
  return slots;
}

function normalizeServerSlots(slots = []) {
  const normalized = Array.from({ length: 6 }, (_, index) => ({
    slotIndex: index,
    type: "open",
    weaponId: index === 1 ? "SMG" : "AR",
    armorId: "lightSet"
  }));

  slots.slice(0, 6).forEach((slot, index) => {
    normalized[index] = {
      ...normalized[index],
      ...slot,
      slotIndex: index,
      type: ["open", "closed", "computer", "player"].includes(slot.type) ? slot.type : "open"
    };
  });

  return normalized;
}

function syncServerPlayersFromSlots(room) {
  room.slots = normalizeServerSlots(room.slots);
  room.players = buildPlayersFromSlots(room.slots, room.hostId);
  room.comCount = room.slots.filter((slot) => slot.type === "computer").length;
  return room;
}

function areServerHumansReady(room) {
  const slots = normalizeServerSlots(room.slots).filter((slot) => slot.type === "player");
  const guests = slots.filter((slot) => slot.playerId !== room.hostId);
  return slots.length > 0 && guests.every((slot) => slot.ready);
}

function pruneRooms() {
  const now = Date.now();
  rooms = rooms.filter((room) => {
    if (!room?.id || room.status === "finished") return false;
    const createdAt = room.createdAt ?? now;
    return now - createdAt < ROOM_TTL_MS;
  });

  const roomIds = new Set(rooms.map((room) => room.id));
  for (const roomId of snapshots.keys()) {
    if (!roomIds.has(roomId)) {
      snapshots.delete(roomId);
    }
  }
}
