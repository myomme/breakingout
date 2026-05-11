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
const chatMessagesByRoom = new Map();
const ROOM_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_CHAT_MESSAGES = 80;
const ACCOUNT_DB_PATH = process.env.ACCOUNT_DB_PATH
  ? path.resolve(process.env.ACCOUNT_DB_PATH)
  : path.join(__dirname, "data", "serverAccounts.json");
const ACCOUNT_DB_PERSISTENT = Boolean(process.env.ACCOUNT_DB_PATH);
const DATABASE_URL = process.env.DATABASE_URL ?? "";
const ACCOUNT_RESULT_HISTORY_LIMIT = 80;
const ACCOUNT_SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const ADMIN_KEY = process.env.ADMIN_KEY ?? "";
const accountDb = await createAccountDb();
const accounts = await loadAccounts();
const ACCOUNT_STORAGE_MODE = accountDb ? "postgres" : ACCOUNT_DB_PERSISTENT ? "persistent-path" : "ephemeral-app-path";
let accountSaveTimer = 0;

function getProgressionReward({ kills = 0, dead = false, extracted = false, winner = false } = {}) {
  return {
    experience: 50 + (Math.max(0, kills) * 100) + (extracted ? 150 : 0) + (winner ? 200 : 0),
    rankScore: Math.max(0, kills) * 10 - (dead ? 4 : 0)
  };
}

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
        accounts: accounts.size,
        accountStorage: ACCOUNT_STORAGE_MODE,
        uptime: Math.floor(process.uptime())
      }));
      return;
    }

    if (url.pathname === "/admin/accounts") {
      handleAdminAccountsRequest(request, response, url);
      return;
    }

    if (url.pathname === "/api/leaderboard") {
      handleLeaderboardRequest(response);
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

function handleAdminAccountsRequest(request, response, url) {
  if (!ADMIN_KEY) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const providedKey = request.headers["x-admin-key"] ?? url.searchParams.get("key");
  if (providedKey !== ADMIN_KEY) {
    response.writeHead(403, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify({ ok: false, message: "Forbidden" }));
    return;
  }

  const rows = [...accounts.values()]
    .map((account) => sanitizeAccountForAdmin(normalizeAccount(account, account.accountId, account.nickname)))
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify({
    ok: true,
    count: rows.length,
    sessionTtlDays: Math.round(ACCOUNT_SESSION_TTL_MS / (24 * 60 * 60 * 1000)),
    accounts: rows
  }, null, 2));
}

function handleLeaderboardRequest(response) {
  const entries = [...accounts.values()]
    .map((account) => createPublicLeaderboardEntry(normalizeAccount(account, account.accountId, account.nickname)))
    .filter((entry) => entry.accountId && entry.gamesCompleted > 0);
  const sorters = {
    rp: (a, b) => b.rankScore - a.rankScore || b.kills - a.kills || b.lifetimeLootValue - a.lifetimeLootValue,
    value: (a, b) => b.lifetimeLootValue - a.lifetimeLootValue || b.rankScore - a.rankScore,
    survival: (a, b) => b.survivalRate - a.survivalRate || b.extracts - a.extracts || b.gamesCompleted - a.gamesCompleted,
    kd: (a, b) => b.kd - a.kd || b.kills - a.kills || b.rankScore - a.rankScore
  };
  const rankings = Object.fromEntries(Object.entries(sorters).map(([key, sorter]) => [
    key,
    [...entries].sort(sorter).slice(0, 50).map((entry, index) => ({ ...entry, rank: index + 1 }))
  ]));

  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify({
    ok: true,
    generatedAt: Date.now(),
    count: entries.length,
    rankings
  }));
}

function createPublicLeaderboardEntry(account) {
  const stats = account.stats ?? {};
  const wallet = account.wallet ?? {};
  const gamesCompleted = Math.max(0, Number(stats.gamesCompleted ?? 0));
  const kills = Math.max(0, Number(stats.kills ?? 0));
  const deaths = Math.max(0, Number(stats.deaths ?? 0));
  const extracts = Math.max(0, Number(stats.extracts ?? 0));
  const rankScore = Math.max(0, Number(stats.rankScore ?? 0));
  const survivalRate = gamesCompleted > 0 ? extracts / gamesCompleted : 0;
  const kd = deaths > 0 ? kills / deaths : kills;

  return {
    accountId: account.accountId,
    nickname: account.nickname || account.username || "Operator",
    rankScore,
    lifetimeLootValue: Math.max(0, Number(wallet.lifetimeLootValue ?? 0)),
    gamesCompleted,
    kills,
    deaths,
    extracts,
    survivalRate,
    kd,
    bestGameValue: Math.max(0, Number(stats.bestGameValue ?? 0)),
    updatedAt: account.updatedAt ?? 0
  };
}

function sanitizeAccountForAdmin(account) {
  const publicAccount = sanitizeAccountForClient(account);
  return {
    accountId: publicAccount.accountId,
    username: publicAccount.username ?? null,
    nickname: publicAccount.nickname,
    createdAt: publicAccount.createdAt,
    updatedAt: publicAccount.updatedAt,
    wallet: publicAccount.wallet,
    stats: publicAccount.stats,
    cosmetics: publicAccount.cosmetics,
    lastGame: publicAccount.lastGame,
    appliedGameResultsCount: publicAccount.appliedGameResults?.length ?? 0,
    activeSessions: account.sessions?.length ?? 0
  };
}

function handleMessage(client, message) {
  if (!message?.type) return;

  if (message.type === "getRooms") {
    pruneRooms();
    sendJson(client, { type: "roomsChanged", reason: "serverSync", sourceId: "server", rooms, at: Date.now() });
    return;
  }

  if (message.type === "getChat") {
    sendJson(client, {
      type: "chatHistory",
      roomId: message.roomId,
      sourceId: "server",
      messages: chatMessagesByRoom.get(message.roomId) ?? [],
      at: Date.now()
    });
    return;
  }

  if (message.type === "getAccount") {
    const account = getAccountRecord(message.sourceId, message.nickname);
    sendJson(client, { type: "accountUpdated", sourceId: "server", account: sanitizeAccountForClient(account), at: Date.now() });
    return;
  }

  if (message.type === "accountAuth") {
    handleAccountAuth(client, message);
    return;
  }

  if (message.type === "gameResult") {
    handleGameResult(client, message);
    return;
  }

  if (message.type === "accountAction") {
    handleAccountAction(client, message);
    return;
  }

  if (message.type === "chatMessage") {
    handleChatMessage(client, message);
    return;
  }

  if (message.type === "clearChat") {
    handleClearChat(message);
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
    if (snapshot) {
      sendJson(client, snapshot);
    } else {
      broadcast({
        type: "snapshotRequest",
        roomId: message.roomId,
        requesterId: message.sourceId ?? null,
        sourceId: "server",
        at: Date.now()
      });
      sendJson(client, {
        type: "snapshotUnavailable",
        roomId: message.roomId,
        sourceId: "server",
        at: Date.now()
      });
    }
    return;
  }

  if (message.type === "playerCommand") {
    broadcast({ ...message, sourceClientId: client.id });
  }
}

async function createAccountDb() {
  if (!DATABASE_URL) {
    return null;
  }

  try {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: shouldUsePostgresSsl() ? { rejectUnauthorized: false } : undefined
    });
    await pool.query(`
      create table if not exists accounts (
        account_id text primary key,
        data jsonb not null,
        updated_at bigint not null
      )
    `);
    return pool;
  } catch (error) {
    console.warn(`PostgreSQL account storage unavailable: ${error.message}`);
    return null;
  }
}

function shouldUsePostgresSsl() {
  return /sslmode=require/i.test(DATABASE_URL) ||
    /\.neon\.tech/i.test(DATABASE_URL) ||
    /supabase\./i.test(DATABASE_URL) ||
    process.env.PGSSL === "true";
}

async function loadAccounts() {
  if (accountDb) {
    const result = await accountDb.query("select account_id, data from accounts");
    return new Map(result.rows.map((row) => [row.account_id, row.data]));
  }

  try {
    const raw = await fs.readFile(ACCOUNT_DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return new Map(Object.entries(parsed.accounts ?? {}));
  } catch {
    return new Map();
  }
}

function scheduleAccountSave() {
  if (accountSaveTimer) return;
  accountSaveTimer = setTimeout(() => {
    accountSaveTimer = 0;
    void saveAccounts();
  }, 500);
}

async function saveAccounts() {
  if (accountDb) {
    const entries = [...accounts.entries()];
    await Promise.all(entries.map(([accountId, account]) => accountDb.query(
      `
        insert into accounts (account_id, data, updated_at)
        values ($1, $2::jsonb, $3)
        on conflict (account_id)
        do update set data = excluded.data, updated_at = excluded.updated_at
      `,
      [accountId, JSON.stringify(account), Date.now()]
    )));
    return;
  }

  await fs.mkdir(path.dirname(ACCOUNT_DB_PATH), { recursive: true });
  await fs.writeFile(ACCOUNT_DB_PATH, JSON.stringify({
    version: 1,
    updatedAt: Date.now(),
    accounts: Object.fromEntries(accounts)
  }, null, 2));
}

function createDefaultAccount(playerId, nickname = "") {
  const now = Date.now();
  return {
    accountId: String(playerId ?? ""),
    nickname: String(nickname ?? "").trim().slice(0, 18),
    createdAt: now,
    updatedAt: now,
    wallet: {
      lifetimeLootValue: 0,
      spendableValue: 0,
      spentValue: 0
    },
    stats: {
      gamesPlayed: 0,
      gamesCompleted: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      experience: 0,
      rankScore: 0,
      bestGameValue: 0,
      extracts: 0
    },
    cosmetics: {
      equipped: {
        nameplate: "default",
        chatBubble: "default",
        tokenSkin: "default",
        title: "default"
      },
      owned: ["default"]
    },
    lastGame: null,
    appliedGameResults: []
  };
}

function normalizeAccount(account, playerId, nickname = "") {
  const base = createDefaultAccount(playerId, nickname);
  return {
    ...base,
    ...(account ?? {}),
    accountId: String(playerId ?? account?.accountId ?? ""),
    nickname: String(nickname || account?.nickname || "").trim().slice(0, 18),
    wallet: { ...base.wallet, ...(account?.wallet ?? {}) },
    stats: { ...base.stats, ...(account?.stats ?? {}) },
    cosmetics: { ...base.cosmetics, ...(account?.cosmetics ?? {}) },
    username: account?.username ?? null,
    passwordSalt: account?.passwordSalt ?? null,
    passwordHash: account?.passwordHash ?? null,
    sessions: Array.isArray(account?.sessions) ? account.sessions : [],
    appliedGameResults: Array.isArray(account?.appliedGameResults) ? account.appliedGameResults : []
  };
}

function getAccountRecord(playerId, nickname = "") {
  if (!playerId) return createDefaultAccount("", nickname);
  const account = normalizeAccount(accounts.get(playerId), playerId, nickname);
  if (!accounts.has(playerId) || (nickname && account.nickname !== nickname)) {
    account.updatedAt = Date.now();
    accounts.set(playerId, account);
    scheduleAccountSave();
  }
  return account;
}

function handleAccountAuth(client, message) {
  const action = String(message.action ?? "");
  if (action === "register") {
    registerAccount(client, message);
    return;
  }
  if (action === "login") {
    loginAccount(client, message);
    return;
  }
  if (action === "resume") {
    resumeAccount(client, message);
    return;
  }
  if (action === "logout") {
    logoutAccount(client, message);
    return;
  }
  sendJson(client, { type: "accountAuthResult", sourceId: "server", ok: false, message: "Unknown account auth action", at: Date.now() });
}

function registerAccount(client, message) {
  const username = normalizeUsername(message.username);
  const password = String(message.password ?? "");
  const nickname = String(message.nickname ?? username).trim().slice(0, 18) || username;
  if (!username) {
    sendAccountAuthFailure(client, "계정 ID는 영문/숫자/밑줄 3~20자로 입력하세요.");
    return;
  }
  if (password.length < 4) {
    sendAccountAuthFailure(client, "비밀번호는 최소 4자 이상이어야 합니다.");
    return;
  }

  const accountId = getRegisteredAccountId(username);
  if (accounts.has(accountId)) {
    sendAccountAuthFailure(client, "이미 존재하는 계정 ID입니다.");
    return;
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const account = {
    ...createDefaultAccount(accountId, nickname),
    accountId,
    username,
    passwordSalt: salt,
    passwordHash: hashPassword(password, salt),
    sessions: []
  };
  accounts.set(accountId, account);
  completeAccountAuth(client, account);
}

function loginAccount(client, message) {
  const username = normalizeUsername(message.username);
  const password = String(message.password ?? "");
  const accountId = getRegisteredAccountId(username);
  const account = accounts.get(accountId);
  if (!username || !account?.passwordHash || !account.passwordSalt) {
    sendAccountAuthFailure(client, "계정 ID 또는 비밀번호가 올바르지 않습니다.");
    return;
  }
  if (hashPassword(password, account.passwordSalt) !== account.passwordHash) {
    sendAccountAuthFailure(client, "계정 ID 또는 비밀번호가 올바르지 않습니다.");
    return;
  }
  completeAccountAuth(client, normalizeAccount(account, accountId, account.nickname));
}

function resumeAccount(client, message) {
  const accountId = String(message.accountId ?? "");
  const account = normalizeAccount(accounts.get(accountId), accountId);
  const tokenHash = hashSessionToken(message.sessionToken);
  const now = Date.now();
  account.sessions = account.sessions.filter((session) => now - (session.lastSeen ?? session.createdAt ?? 0) <= ACCOUNT_SESSION_TTL_MS);
  const validSession = account.sessions.find((session) => session.tokenHash === tokenHash);
  if (!account?.accountId || !tokenHash || !validSession) {
    if (account?.accountId) {
      accounts.set(accountId, account);
      scheduleAccountSave();
    }
    sendAccountAuthFailure(client, "저장된 로그인 세션이 만료되었습니다.");
    return;
  }
  account.sessions = account.sessions.map((session) => (
    session.tokenHash === tokenHash ? { ...session, lastSeen: now } : session
  ));
  accounts.set(accountId, account);
  scheduleAccountSave();
  sendJson(client, {
    type: "accountAuthResult",
    sourceId: "server",
    ok: true,
    account: sanitizeAccountForClient(account),
    sessionToken: message.sessionToken,
    at: Date.now()
  });
}

function logoutAccount(client, message) {
  const accountId = String(message.accountId ?? message.sourceId ?? "");
  const account = normalizeAccount(accounts.get(accountId), accountId);
  const tokenHash = hashSessionToken(message.sessionToken);
  if (account?.accountId && tokenHash) {
    account.sessions = account.sessions.filter((session) => session.tokenHash !== tokenHash);
    account.updatedAt = Date.now();
    accounts.set(accountId, account);
    scheduleAccountSave();
  }
  sendJson(client, { type: "accountAuthResult", sourceId: "server", ok: false, message: "로그아웃되었습니다.", at: Date.now() });
}

function completeAccountAuth(client, account) {
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const normalized = normalizeAccount(account, account.accountId, account.nickname);
  normalized.sessions = [
    { tokenHash: hashSessionToken(sessionToken), createdAt: Date.now(), lastSeen: Date.now() },
    ...(normalized.sessions ?? [])
  ].slice(0, 6);
  normalized.updatedAt = Date.now();
  accounts.set(normalized.accountId, normalized);
  scheduleAccountSave();
  sendJson(client, {
    type: "accountAuthResult",
    sourceId: "server",
    ok: true,
    account: sanitizeAccountForClient(normalized),
    sessionToken,
    at: Date.now()
  });
}

function sendAccountAuthFailure(client, message) {
  sendJson(client, { type: "accountAuthResult", sourceId: "server", ok: false, message, at: Date.now() });
}

function normalizeUsername(value) {
  const username = String(value ?? "").trim().toLowerCase();
  return /^[a-z0-9_]{3,20}$/.test(username) ? username : "";
}

function getRegisteredAccountId(username) {
  return `acct_${username}`;
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
}

function hashSessionToken(token) {
  if (!token) return "";
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function sanitizeAccountForClient(account) {
  const { passwordHash, passwordSalt, sessions, ...publicAccount } = account;
  return publicAccount;
}

function handleGameResult(client, message) {
  const playerId = message.sourceId;
  if (!playerId) {
    sendJson(client, { type: "accountRejected", sourceId: "server", message: "Missing player id", at: Date.now() });
    return;
  }

  const room = message.roomId ? findRoom(message.roomId) : null;
  if (room) {
    const slot = normalizeServerSlots(room.slots).find((entry) => entry.type === "player" && entry.playerId === playerId);
    if (!slot) {
      sendJson(client, { type: "accountRejected", sourceId: "server", message: "Player not in room", at: Date.now() });
      return;
    }
  }

  const account = getAccountRecord(playerId, message.nickname);
  const resultKey = String(message.resultKey ?? `${message.roomId ?? "solo"}:${playerId}:${message.at ?? Date.now()}`);
  if (!account.appliedGameResults.includes(resultKey)) {
    const result = message.result ?? {};
    const value = Math.max(0, Math.floor(Number(result.value ?? 0)));
    const kills = Math.max(0, Math.floor(Number(result.kills ?? 0)));
    const dead = Boolean(result.dead);
    const finalRaidExtracted = Boolean(result.finalRaidExtracted);
    const winner = Boolean(result.winner);
    const progression = getProgressionReward({ kills, dead, extracted: finalRaidExtracted, winner });
    account.wallet.lifetimeLootValue += value;
    account.wallet.spendableValue += value;
    account.stats.gamesPlayed += 1;
    account.stats.gamesCompleted += 1;
    account.stats.wins += winner ? 1 : 0;
    account.stats.kills += kills;
    account.stats.deaths += dead ? 1 : 0;
    account.stats.extracts += finalRaidExtracted ? 1 : 0;
    account.stats.experience = Math.max(0, Number(account.stats.experience ?? 0) + progression.experience);
    account.stats.rankScore = Math.max(0, Number(account.stats.rankScore ?? 0) + progression.rankScore);
    account.stats.bestGameValue = Math.max(account.stats.bestGameValue ?? 0, value);
    account.lastGame = {
      at: Date.now(),
      roomId: message.roomId ?? null,
      mapId: result.mapId ?? null,
      value,
      winner,
      kills,
      dead,
      finalRaidExtracted
    };
    account.appliedGameResults = [...account.appliedGameResults, resultKey].slice(-ACCOUNT_RESULT_HISTORY_LIMIT);
    account.updatedAt = Date.now();
    accounts.set(playerId, account);
    scheduleAccountSave();
  }

  sendJson(client, { type: "accountUpdated", sourceId: "server", account: sanitizeAccountForClient(account), at: Date.now() });
}

function handleAccountAction(client, message) {
  const playerId = message.sourceId;
  const action = String(message.action ?? "");
  const account = getAccountRecord(playerId, message.nickname);

  if (!playerId) {
    sendJson(client, { type: "accountRejected", sourceId: "server", message: "Missing player id", at: Date.now() });
    return;
  }

  if (action === "debugGrantValue") {
    const amount = Math.max(1, Math.min(10000, Math.floor(Number(message.amount ?? 500))));
    account.wallet.lifetimeLootValue += amount;
    account.wallet.spendableValue += amount;
    account.updatedAt = Date.now();
    accounts.set(playerId, account);
    scheduleAccountSave();
    sendJson(client, { type: "accountUpdated", sourceId: "server", account: sanitizeAccountForClient(account), at: Date.now() });
    return;
  }

  const item = getCosmeticCatalog().find((entry) => entry.id === message.itemId);
  if (!item) {
    sendJson(client, { type: "accountRejected", sourceId: "server", message: "Invalid shop item", at: Date.now() });
    return;
  }

  const owned = new Set(account.cosmetics.owned ?? ["default"]);

  if (action === "purchaseCosmetic") {
    if (owned.has(item.id)) {
      sendJson(client, { type: "accountUpdated", sourceId: "server", account: sanitizeAccountForClient(account), at: Date.now() });
      return;
    }
    if ((account.wallet.spendableValue ?? 0) < item.price) {
      sendJson(client, { type: "accountRejected", sourceId: "server", message: "Not enough value", at: Date.now() });
      return;
    }
    account.wallet.spendableValue -= item.price;
    account.wallet.spentValue += item.price;
    owned.add(item.id);
    account.cosmetics.owned = Array.from(owned);
  } else if (action === "equipCosmetic") {
    if (!owned.has(item.id)) {
      sendJson(client, { type: "accountRejected", sourceId: "server", message: "Item not owned", at: Date.now() });
      return;
    }
  } else {
    sendJson(client, { type: "accountRejected", sourceId: "server", message: "Unknown account action", at: Date.now() });
    return;
  }

  account.cosmetics.equipped = {
    ...account.cosmetics.equipped,
    [item.category]: item.id
  };
  account.updatedAt = Date.now();
  accounts.set(playerId, account);
  syncAccountCosmeticsToRooms(playerId, account.cosmetics);
  scheduleAccountSave();
  sendJson(client, { type: "accountUpdated", sourceId: "server", account: sanitizeAccountForClient(account), at: Date.now() });
  broadcastRooms("accountCosmetics");
}

function syncAccountCosmeticsToRooms(playerId, cosmetics) {
  rooms.forEach((room) => {
    let changed = false;
    room.slots = normalizeServerSlots(room.slots).map((slot) => {
      if (slot.type !== "player" || slot.playerId !== playerId) {
        return slot;
      }
      changed = true;
      return { ...slot, cosmetics };
    });

    if (changed) {
      room.updatedAt = Date.now();
      syncServerPlayersFromSlots(room);
    }
  });
}

function getCosmeticCatalog() {
  return [
    { id: "nameplate_ranger", category: "nameplate", price: 80 },
    { id: "nameplate_blacksite", category: "nameplate", price: 160 },
    { id: "chat_radio", category: "chatBubble", price: 60 },
    { id: "chat_amber", category: "chatBubble", price: 140 },
    { id: "token_white_ring", category: "tokenSkin", price: 90 },
    { id: "token_ember", category: "tokenSkin", price: 180 },
    { id: "title_rookie", category: "title", price: 50 },
    { id: "title_contractor", category: "title", price: 130 }
  ];
}

function handleChatMessage(client, message) {
  const room = findRoom(message.roomId);
  if (!room) {
    sendJson(client, { type: "chatRejected", sourceId: "server", roomId: message.roomId ?? null, message: "Room not found", at: Date.now() });
    return;
  }

  const slot = normalizeServerSlots(room.slots).find((entry) => entry.type === "player" && entry.playerId === message.sourceId);
  if (!slot) {
    sendJson(client, { type: "chatRejected", sourceId: "server", roomId: room.id, message: "Player not in room", at: Date.now() });
    return;
  }

  const text = trimChatText(String(message.text ?? "").replace(/\s+/g, " ").trim());
  if (!text) {
    sendJson(client, { type: "chatRejected", sourceId: "server", roomId: room.id, message: "Empty message", at: Date.now() });
    return;
  }

  const chatMessage = {
    id: message.messageId ?? crypto.randomUUID(),
    roomId: room.id,
    playerId: message.sourceId,
    nickname: slot.nickname ?? "Player",
    text,
    cosmetics: getAccountRecord(message.sourceId, slot.nickname).cosmetics?.equipped ?? {},
    phase: message.phase ?? null,
    raid: message.raid ?? null,
    at: Date.now()
  };
  const messages = [...(chatMessagesByRoom.get(room.id) ?? []), chatMessage].slice(-MAX_CHAT_MESSAGES);
  chatMessagesByRoom.set(room.id, messages);
  broadcast({ type: "chatMessage", sourceId: "server", roomId: room.id, message: chatMessage, at: Date.now() });
}

function trimChatText(value, maxWeight = 100) {
  let weight = 0;
  let result = "";
  for (const char of String(value ?? "")) {
    const nextWeight = weight + (/^[\x00-\x7F]$/.test(char) ? 0.5 : 1);
    if (nextWeight > maxWeight) break;
    weight = nextWeight;
    result += char;
  }
  return result;
}

function handleClearChat(message) {
  const room = findRoom(message.roomId);
  if (!room || room.hostId !== message.sourceId) return;
  chatMessagesByRoom.delete(room.id);
  broadcast({ type: "chatCleared", sourceId: "server", roomId: room.id, at: Date.now() });
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
  void saveAccounts()
    .catch(() => {})
    .finally(() => accountDb?.end?.())
    .finally(() => server.close(() => {
      process.exit(0);
    }));
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
    chatMessagesByRoom.delete(room.id);
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
      cosmetics: slot.cosmetics ?? null,
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
  const account = getAccountRecord(playerId, player.nickname ?? player.name ?? "Player");
  return {
    id: playerId,
    playerId,
    nickname: String(player.nickname ?? player.name ?? "Player").trim().slice(0, 18) || "Player",
    weaponId: String(player.weaponId ?? "AR"),
    armorId: String(player.armorId ?? "lightSet"),
    cosmetics: account.cosmetics,
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
    cosmetics: hostPlayer.cosmetics ?? null,
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
      chatMessagesByRoom.delete(roomId);
    }
  }

  for (const roomId of chatMessagesByRoom.keys()) {
    if (!roomIds.has(roomId)) {
      chatMessagesByRoom.delete(roomId);
    }
  }
}
