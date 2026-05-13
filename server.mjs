import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hexDistance, tileKey } from "./src/core/hex.js";
import { RaidGameState } from "./src/game/gameState.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 5173);
const HOST = process.env.HOST ?? "0.0.0.0";
const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const clients = new Set();
let rooms = [];
const snapshots = new Map();
const gameSessions = new Map();
const chatMessagesByRoom = new Map();
const supportReports = [];
const LOBBY_CHAT_ROOM_ID = "global_lobby";
const ROOM_TTL_MS = 12 * 60 * 60 * 1000;
const ROOM_PRESENCE_TTL_MS = 2 * 60 * 1000;
const ROOM_RECONNECT_GRACE_MS = 5 * 60 * 1000;
const MAX_CHAT_MESSAGES = 80;
const MAX_SUPPORT_REPORTS = 200;
const GAMEPLAY_HEX_SIZE = 42;
const SERVER_AI_STEP_DELAY_MS = 650;
const SERVER_AI_TURN_START_DELAY_MS = 900;
const ACCOUNT_DB_PATH = process.env.ACCOUNT_DB_PATH
  ? path.resolve(process.env.ACCOUNT_DB_PATH)
  : path.join(__dirname, "data", "serverAccounts.json");
const ACCOUNT_DB_PERSISTENT = Boolean(process.env.ACCOUNT_DB_PATH);
const DATABASE_URL = process.env.DATABASE_URL ?? "";
const ACCOUNT_RESULT_HISTORY_LIMIT = 80;
const ACCOUNT_SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const ADMIN_KEY = process.env.ADMIN_KEY ?? "";
const accountDb = await createAccountDb();
const gameRules = await loadGameRules();
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

    if (url.pathname === "/admin/accounts/delete") {
      await handleAdminAccountDeleteRequest(request, response, url);
      return;
    }

    if (url.pathname === "/admin/accounts/adjust") {
      await handleAdminAccountAdjustRequest(request, response, url);
      return;
    }

    if (url.pathname === "/admin/notice") {
      await handleAdminNoticeRequest(request, response, url);
      return;
    }

    if (url.pathname === "/admin/reports") {
      handleAdminReportsRequest(request, response, url);
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
    playerId: null,
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
  socket.on("close", () => {
    markClientDisconnected(client);
    clients.delete(client);
  });
  socket.on("error", () => {
    markClientDisconnected(client);
    clients.delete(client);
  });
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
  if (!isAdminAuthorized(request, url)) {
    sendAdminDenied(response, wantsJson(url));
    return;
  }

  const rows = getAdminAccountRows();
  const ghostRows = rows.filter((row) => row.flags.includes("ghost"));

  if (!wantsJson(url)) {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    response.end(renderAdminDashboardPage({
      key: url.searchParams.get("key") ?? "",
      rows,
      ghostRows
    }));
    return;
  }

  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify({
    ok: true,
    count: rows.length,
    ghostCount: ghostRows.length,
    sessionTtlDays: Math.round(ACCOUNT_SESSION_TTL_MS / (24 * 60 * 60 * 1000)),
    accounts: rows
  }, null, 2));
}

async function handleAdminAccountDeleteRequest(request, response, url) {
  if (!isAdminAuthorized(request, url)) {
    sendAdminDenied(response, true);
    return;
  }

  if (request.method !== "POST") {
    response.writeHead(405, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify({ ok: false, message: "Method Not Allowed" }));
    return;
  }

  const body = await readRequestBody(request);
  const params = new URLSearchParams(body);
  const accountId = String(params.get("accountId") ?? "").trim();
  const redirect = params.get("redirect") === "1";

  if (!accountId || !accounts.has(accountId)) {
    response.writeHead(404, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify({ ok: false, message: "Account not found" }));
    return;
  }

  accounts.delete(accountId);
  removeAccountFromRooms(accountId);
  await saveAccounts();
  broadcastAccountDeleted(accountId, "운영자가 계정을 정지(삭제)했습니다.");

  if (redirect) {
    response.writeHead(303, { Location: `/admin/accounts?key=${encodeURIComponent(url.searchParams.get("key") ?? "")}` });
    response.end();
    return;
  }

  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify({ ok: true, deleted: accountId }));
}

async function handleAdminAccountAdjustRequest(request, response, url) {
  if (!isAdminAuthorized(request, url)) {
    sendAdminDenied(response, true);
    return;
  }

  if (request.method !== "POST") {
    response.writeHead(405, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify({ ok: false, message: "Method Not Allowed" }));
    return;
  }

  const body = await readRequestBody(request);
  const params = new URLSearchParams(body);
  const accountId = String(params.get("accountId") ?? "").trim();
  const redirect = params.get("redirect") === "1";
  const account = accounts.has(accountId) ? normalizeAccount(accounts.get(accountId), accountId) : null;

  if (!account) {
    response.writeHead(404, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify({ ok: false, message: "Account not found" }));
    return;
  }

  applyAdminNumberDelta(account.wallet, "spendableValue", params.get("spendableDelta"), -1_000_000, 1_000_000);
  applyAdminNumberDelta(account.wallet, "lifetimeLootValue", params.get("lifetimeDelta"), -1_000_000, 1_000_000);
  applyAdminNumberDelta(account.stats, "rankScore", params.get("rankDelta"), -100_000, 100_000);
  applyAdminNumberDelta(account.stats, "experience", params.get("experienceDelta"), -100_000, 100_000);

  const grantItem = String(params.get("grantItem") ?? "").trim();
  const catalogItem = grantItem ? getCosmeticCatalog().find((item) => item.id === grantItem) : null;
  if (catalogItem) {
    const owned = new Set(account.cosmetics.owned ?? ["default"]);
    owned.add(catalogItem.id);
    account.cosmetics.owned = Array.from(owned);
  }

  account.wallet.spendableValue = Math.max(0, Number(account.wallet.spendableValue ?? 0));
  account.wallet.lifetimeLootValue = Math.max(0, Number(account.wallet.lifetimeLootValue ?? 0));
  account.stats.rankScore = Math.max(0, Number(account.stats.rankScore ?? 0));
  account.stats.experience = Math.max(0, Number(account.stats.experience ?? 0));
  account.updatedAt = Date.now();
  accounts.set(accountId, account);
  syncAccountCosmeticsToRooms(accountId, account.cosmetics);
  await saveAccounts();
  sendAccountUpdatedToPlayer(accountId, account);
  broadcastRooms("adminAccountAdjust");

  if (redirect) {
    response.writeHead(303, { Location: `/admin/accounts?key=${encodeURIComponent(url.searchParams.get("key") ?? "")}` });
    response.end();
    return;
  }

  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify({ ok: true, account: sanitizeAccountForClient(account) }));
}

async function handleAdminNoticeRequest(request, response, url) {
  if (!isAdminAuthorized(request, url)) {
    sendAdminDenied(response, true);
    return;
  }

  if (request.method !== "POST") {
    response.writeHead(405, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify({ ok: false, message: "Method Not Allowed" }));
    return;
  }

  const body = await readRequestBody(request);
  const params = new URLSearchParams(body);
  const text = String(params.get("message") ?? "").replace(/\s+/g, " ").trim().slice(0, 260);
  const redirect = params.get("redirect") === "1";

  if (!text) {
    response.writeHead(400, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify({ ok: false, message: "Notice message required" }));
    return;
  }

  broadcast({
    type: "adminNotice",
    sourceId: "server",
    message: text,
    durationMs: 10000,
    at: Date.now()
  });

  if (redirect) {
    response.writeHead(303, { Location: `/admin/accounts?key=${encodeURIComponent(url.searchParams.get("key") ?? "")}` });
    response.end();
    return;
  }

  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify({ ok: true }));
}

function handleAdminReportsRequest(request, response, url) {
  if (!isAdminAuthorized(request, url)) {
    sendAdminDenied(response, wantsJson(url));
    return;
  }

  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify({ ok: true, reports: supportReports }, null, 2));
}

function applyAdminNumberDelta(target, key, rawValue, min, max) {
  const delta = Math.max(min, Math.min(max, Math.trunc(Number(rawValue ?? 0) || 0)));
  if (!delta) return;
  target[key] = Number(target[key] ?? 0) + delta;
}

function isAdminAuthorized(request, url) {
  if (!ADMIN_KEY) return false;
  const providedKey = request.headers["x-admin-key"] ?? url.searchParams.get("key");
  return providedKey === ADMIN_KEY;
}

function sendAdminDenied(response, json = true) {
  if (!ADMIN_KEY) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(403, { "Content-Type": json ? "application/json; charset=utf-8" : "text/plain; charset=utf-8", "Cache-Control": "no-store" });
  response.end(json ? JSON.stringify({ ok: false, message: "Forbidden" }) : "Forbidden");
}

function wantsJson(url) {
  return url.searchParams.get("format") === "json";
}

function getAdminAccountRows() {
  return [...accounts.values()]
    .map((account) => {
      const normalized = normalizeAccount(account, account.accountId, account.nickname);
      const row = sanitizeAccountForAdmin(normalized);
      row.flags = getAccountAdminFlags(normalized);
      return row;
    })
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

function getAccountAdminFlags(account) {
  const flags = [];
  const stats = account.stats ?? {};
  const wallet = account.wallet ?? {};
  const sessions = Array.isArray(account.sessions) ? account.sessions : [];
  const noProgress = Number(stats.gamesPlayed ?? 0) === 0 &&
    Number(stats.gamesCompleted ?? 0) === 0 &&
    Number(wallet.lifetimeLootValue ?? 0) === 0 &&
    Number(wallet.spentValue ?? 0) === 0;
  const stale = Date.now() - Number(account.updatedAt ?? account.createdAt ?? 0) > ACCOUNT_SESSION_TTL_MS;
  const incomplete = !account.username && !account.passwordHash;

  if (noProgress && (sessions.length === 0 || stale || incomplete)) flags.push("ghost");
  if (stale) flags.push("stale");
  if (incomplete) flags.push("local-only");
  if (sessions.length > 0) flags.push("active-session");
  return flags;
}

function renderAdminDashboardPage({ key, rows, ghostRows }) {
  const totals = {
    accounts: rows.length,
    ghosts: ghostRows.length,
    completed: rows.reduce((sum, row) => sum + Number(row.stats?.gamesCompleted ?? 0), 0),
    value: rows.reduce((sum, row) => sum + Number(row.wallet?.lifetimeLootValue ?? 0), 0),
    reports: supportReports.length
  };
  const catalogOptions = getCosmeticCatalog()
    .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.category)} / ${escapeHtml(item.id)}</option>`)
    .join("");

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Breaking Out Admin</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, "Segoe UI", sans-serif; background: #080b0b; color: #f4f1e8; }
    body { margin: 0; background: #080b0b; }
    main { width: min(1320px, calc(100vw - 32px)); margin: 0 auto; padding: 28px 0 44px; }
    header { display: flex; justify-content: space-between; gap: 16px; align-items: end; border-bottom: 1px solid rgba(236,224,196,.16); padding-bottom: 18px; }
    h1 { margin: 0; font-size: 30px; }
    h2 { margin: 0 0 8px; font-size: 18px; }
    p { margin: 6px 0 0; color: rgba(244,241,232,.64); }
    .stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; margin: 18px 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .stat, .panel { border: 1px solid rgba(236,224,196,.14); border-radius: 8px; background: rgba(255,255,255,.045); padding: 14px; }
    .stat span, th { color: rgba(244,241,232,.58); font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
    .stat strong { display: block; margin-top: 6px; font-size: 24px; }
    .toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    textarea { width: 100%; min-height: 86px; resize: vertical; padding: 10px; }
    input, select, textarea, button { min-height: 34px; border: 1px solid rgba(236,224,196,.18); border-radius: 6px; background: rgba(255,255,255,.07); color: #f4f1e8; padding: 0 10px; font: inherit; box-sizing: border-box; }
    button { cursor: pointer; }
    .primary { border-color: rgba(185,232,109,.34); background: rgba(185,232,109,.12); color: #eaffbf; }
    button.danger { border-color: rgba(255,98,82,.44); background: rgba(255,98,82,.12); color: #ffd8d0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid rgba(236,224,196,.1); padding: 10px 8px; text-align: left; vertical-align: top; }
    td small { display: block; color: rgba(244,241,232,.58); margin-top: 3px; }
    .account-actions { display: grid; gap: 8px; min-width: 280px; }
    .adjust-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
    .adjust-form select, .adjust-form button { grid-column: 1 / -1; }
    .report-list { display: grid; gap: 8px; max-height: 310px; overflow: auto; }
    .report { border: 1px solid rgba(236,224,196,.12); border-radius: 8px; padding: 10px; background: rgba(0,0,0,.16); }
    .report strong { display: flex; justify-content: space-between; gap: 8px; }
    .report p { color: #f4f1e8; white-space: pre-wrap; }
    .flags { display: flex; flex-wrap: wrap; gap: 4px; }
    .flag { border: 1px solid rgba(185,232,109,.24); border-radius: 999px; padding: 2px 7px; color: #dff4b5; font-size: 11px; }
    .flag.ghost { border-color: rgba(255,98,82,.42); color: #ffd8d0; }
    @media (max-width: 900px) { .grid, .stats { grid-template-columns: 1fr; } table { font-size: 12px; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>운영자 관리 페이지</h1>
        <p>계정 삭제, 보상 지급, 전체 공지, 신고 및 건의 사항을 한 화면에서 처리합니다.</p>
      </div>
      <a style="color:#dff4b5" href="/admin/accounts?format=json&key=${escapeHtml(key)}">JSON</a>
    </header>
    <section class="stats">
      <article class="stat"><span>Accounts</span><strong>${totals.accounts}</strong></article>
      <article class="stat"><span>Ghosts</span><strong>${totals.ghosts}</strong></article>
      <article class="stat"><span>Completed</span><strong>${totals.completed}</strong></article>
      <article class="stat"><span>Lifetime Value</span><strong>${totals.value}</strong></article>
      <article class="stat"><span>Reports</span><strong>${totals.reports}</strong></article>
    </section>
    <section class="grid">
      <article class="panel">
        <h2>전체 공지</h2>
        <p>모든 접속자 화면 최상단에 10초 동안 팝업이 표시됩니다.</p>
        <form method="post" action="/admin/notice?key=${encodeURIComponent(key)}">
          <input type="hidden" name="redirect" value="1">
          <textarea name="message" maxlength="260" placeholder="잠시 후 서버를 임시 점검할 예정입니다. 게임 중인 플레이어는 참고 바랍니다."></textarea>
          <div class="toolbar"><button class="primary" type="submit">공지 발송</button></div>
        </form>
      </article>
      <article class="panel">
        <h2>신고 및 건의</h2>
        <div class="report-list">
          ${supportReports.slice(0, 8).map(renderAdminReport).join("") || "<p>접수된 신고 및 건의가 없습니다.</p>"}
        </div>
        <p><a style="color:#dff4b5" href="/admin/reports?format=json&key=${escapeHtml(key)}">전체 신고 JSON 보기</a></p>
      </article>
    </section>
    <section class="panel">
      <div class="toolbar">
        <input id="search" type="search" placeholder="계정, 닉네임 검색">
        <select id="filter"><option value="all">전체</option><option value="ghost">유령 계정</option><option value="stale">오래된 계정</option><option value="active-session">접속 세션</option></select>
      </div>
      <table>
        <thead><tr><th>계정</th><th>전적</th><th>가치</th><th>상태</th><th>관리</th></tr></thead>
        <tbody>${rows.map((row) => renderAdminDashboardRow(row, key, catalogOptions)).join("")}</tbody>
      </table>
    </section>
  </main>
  <script>
    const search = document.querySelector("#search");
    const filter = document.querySelector("#filter");
    function applyFilters() {
      const q = search.value.toLowerCase();
      const f = filter.value;
      document.querySelectorAll("tbody tr").forEach((row) => {
        const hay = row.dataset.search;
        const flags = row.dataset.flags;
        row.hidden = (q && !hay.includes(q)) || (f !== "all" && !flags.includes(f));
      });
    }
    search.addEventListener("input", applyFilters);
    filter.addEventListener("change", applyFilters);
    document.querySelectorAll("form[data-delete]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        const name = form.dataset.delete;
        if (!confirm(name + " 계정을 삭제할까요? 접속 중인 유저는 즉시 튕깁니다.")) event.preventDefault();
      });
    });
  </script>
</body>
</html>`;
}

function renderAdminReport(report) {
  return `<article class="report">
    <strong><span>${escapeHtml(report.category)}</span><time>${new Date(report.at ?? 0).toLocaleString("ko-KR")}</time></strong>
    <small>${escapeHtml(report.nickname)} / ${escapeHtml(report.accountId)} ${report.roomId ? `/ 방 ${escapeHtml(report.roomId)}` : ""}</small>
    <p>${escapeHtml(report.text)}</p>
  </article>`;
}

function renderAdminDashboardRow(row, key, catalogOptions) {
  const flags = row.flags ?? [];
  const search = `${row.accountId} ${row.username ?? ""} ${row.nickname ?? ""}`.toLowerCase();
  return `<tr data-search="${escapeHtml(search)}" data-flags="${escapeHtml(flags.join(" "))}">
    <td><strong>${escapeHtml(row.nickname)}</strong><small>${escapeHtml(row.accountId)}</small><small>${escapeHtml(row.username ?? "-")}</small></td>
    <td>${Number(row.stats?.gamesCompleted ?? 0)} 완료 / ${Number(row.stats?.wins ?? 0)} 승<small>K ${Number(row.stats?.kills ?? 0)} / D ${Number(row.stats?.deaths ?? 0)} / RP ${Number(row.stats?.rankScore ?? 0)}</small></td>
    <td>${Number(row.wallet?.spendableValue ?? 0)} 보유<small>누적 ${Number(row.wallet?.lifetimeLootValue ?? 0)} / 소비 ${Number(row.wallet?.spentValue ?? 0)}</small></td>
    <td><div class="flags">${flags.map((flag) => `<span class="flag ${flag}">${flag}</span>`).join("") || "<span class=\"flag\">normal</span>"}</div><small>${new Date(row.updatedAt ?? 0).toLocaleString("ko-KR")}</small></td>
    <td class="account-actions">
      <form class="adjust-form" method="post" action="/admin/accounts/adjust?key=${encodeURIComponent(key)}">
        <input type="hidden" name="accountId" value="${escapeHtml(row.accountId)}">
        <input type="hidden" name="redirect" value="1">
        <input name="spendableDelta" type="number" step="1" placeholder="보유 가치 +/-">
        <input name="lifetimeDelta" type="number" step="1" placeholder="누적 가치 +/-">
        <input name="rankDelta" type="number" step="1" placeholder="RP +/-">
        <input name="experienceDelta" type="number" step="1" placeholder="EXP +/-">
        <select name="grantItem"><option value="">외형 지급 없음</option>${catalogOptions}</select>
        <button class="primary" type="submit">보상/수정 적용</button>
      </form>
      <form method="post" action="/admin/accounts/delete?key=${encodeURIComponent(key)}" data-delete="${escapeHtml(row.nickname)}">
        <input type="hidden" name="accountId" value="${escapeHtml(row.accountId)}">
        <input type="hidden" name="redirect" value="1">
        <button class="danger" type="submit">계정 삭제</button>
      </form>
    </td>
  </tr>`;
}

function renderAdminAccountsPage({ key, rows, ghostRows }) {
  const totals = {
    accounts: rows.length,
    ghosts: ghostRows.length,
    completed: rows.reduce((sum, row) => sum + Number(row.stats?.gamesCompleted ?? 0), 0),
    value: rows.reduce((sum, row) => sum + Number(row.wallet?.lifetimeLootValue ?? 0), 0)
  };

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Breaking Out Admin</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, "Segoe UI", sans-serif; background: #080b0b; color: #f4f1e8; }
    body { margin: 0; background: #080b0b; }
    main { width: min(1180px, calc(100vw - 32px)); margin: 0 auto; padding: 28px 0 44px; }
    header { display: flex; justify-content: space-between; gap: 16px; align-items: end; border-bottom: 1px solid rgba(236,224,196,.16); padding-bottom: 18px; }
    h1 { margin: 0; font-size: 30px; }
    p { margin: 6px 0 0; color: rgba(244,241,232,.64); }
    .stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin: 18px 0; }
    .stat, .panel { border: 1px solid rgba(236,224,196,.14); border-radius: 8px; background: rgba(255,255,255,.045); padding: 14px; }
    .stat span, th { color: rgba(244,241,232,.58); font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
    .stat strong { display: block; margin-top: 6px; font-size: 24px; }
    .toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    input, select, button { min-height: 34px; border: 1px solid rgba(236,224,196,.18); border-radius: 6px; background: rgba(255,255,255,.07); color: #f4f1e8; padding: 0 10px; font: inherit; }
    button.danger { border-color: rgba(255,98,82,.44); background: rgba(255,98,82,.12); color: #ffd8d0; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid rgba(236,224,196,.1); padding: 10px 8px; text-align: left; vertical-align: top; }
    td small { display: block; color: rgba(244,241,232,.58); margin-top: 3px; }
    .flags { display: flex; flex-wrap: wrap; gap: 4px; }
    .flag { border: 1px solid rgba(185,232,109,.24); border-radius: 999px; padding: 2px 7px; color: #dff4b5; font-size: 11px; }
    .flag.ghost { border-color: rgba(255,98,82,.42); color: #ffd8d0; }
    @media (max-width: 760px) { .stats { grid-template-columns: repeat(2, 1fr); } table { font-size: 12px; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>운영자 계정 관리</h1>
        <p>유령 계정은 전적/가치가 없고 세션이 없거나 오래된 계정입니다.</p>
      </div>
      <a style="color:#dff4b5" href="/admin/accounts?format=json&key=${escapeHtml(key)}">JSON</a>
    </header>
    <section class="stats">
      <article class="stat"><span>Accounts</span><strong>${totals.accounts}</strong></article>
      <article class="stat"><span>Ghosts</span><strong>${totals.ghosts}</strong></article>
      <article class="stat"><span>Completed</span><strong>${totals.completed}</strong></article>
      <article class="stat"><span>Lifetime Value</span><strong>${totals.value}</strong></article>
    </section>
    <section class="panel">
      <div class="toolbar">
        <input id="search" type="search" placeholder="계정, 닉네임 검색">
        <select id="filter"><option value="all">전체</option><option value="ghost">유령 계정</option><option value="stale">오래된 계정</option></select>
      </div>
      <table>
        <thead><tr><th>계정</th><th>전적</th><th>재화</th><th>상태</th><th>관리</th></tr></thead>
        <tbody>
          ${rows.map((row) => renderAdminAccountRow(row, key)).join("")}
        </tbody>
      </table>
    </section>
  </main>
  <script>
    const search = document.querySelector("#search");
    const filter = document.querySelector("#filter");
    function applyFilters() {
      const q = search.value.toLowerCase();
      const f = filter.value;
      document.querySelectorAll("tbody tr").forEach((row) => {
        const hay = row.dataset.search;
        const flags = row.dataset.flags;
        row.hidden = (q && !hay.includes(q)) || (f !== "all" && !flags.includes(f));
      });
    }
    search.addEventListener("input", applyFilters);
    filter.addEventListener("change", applyFilters);
    document.querySelectorAll("form[data-delete]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        const name = form.dataset.delete;
        if (!confirm(name + " 계정을 삭제할까요? 이 작업은 되돌릴 수 없습니다.")) event.preventDefault();
      });
    });
  </script>
</body>
</html>`;
}

function renderAdminAccountRow(row, key) {
  const flags = row.flags ?? [];
  const search = `${row.accountId} ${row.username ?? ""} ${row.nickname ?? ""}`.toLowerCase();
  return `<tr data-search="${escapeHtml(search)}" data-flags="${escapeHtml(flags.join(" "))}">
    <td><strong>${escapeHtml(row.nickname)}</strong><small>${escapeHtml(row.accountId)}</small><small>${escapeHtml(row.username ?? "-")}</small></td>
    <td>${Number(row.stats?.gamesCompleted ?? 0)} 완료 / ${Number(row.stats?.wins ?? 0)} 승<small>K ${Number(row.stats?.kills ?? 0)} / D ${Number(row.stats?.deaths ?? 0)}</small></td>
    <td>${Number(row.wallet?.spendableValue ?? 0)} 보유<small>누적 ${Number(row.wallet?.lifetimeLootValue ?? 0)}</small></td>
    <td><div class="flags">${flags.map((flag) => `<span class="flag ${flag}">${flag}</span>`).join("") || "<span class=\"flag\">normal</span>"}</div><small>${new Date(row.updatedAt ?? 0).toLocaleString("ko-KR")}</small></td>
    <td><form method="post" action="/admin/accounts/delete?key=${encodeURIComponent(key)}" data-delete="${escapeHtml(row.nickname)}"><input type="hidden" name="accountId" value="${escapeHtml(row.accountId)}"><input type="hidden" name="redirect" value="1"><button class="danger" type="submit">삭제</button></form></td>
  </tr>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function removeAccountFromRooms(accountId) {
  rooms.forEach((room) => {
    room.slots = normalizeServerSlots(room.slots).map((slot) => (
      slot.type === "player" && slot.playerId === accountId
        ? room.status === "inProgress"
          ? {
              type: "computer",
              weaponId: slot.weaponId ?? "AR",
              armorId: slot.armorId ?? "lightSet",
              takeoverFromPlayerId: slot.playerId,
              takeoverName: slot.nickname,
              takeoverAt: Date.now(),
              removedByAdmin: true
            }
          : { type: "open", weaponId: slot.weaponId ?? "AR", armorId: slot.armorId ?? "lightSet" }
        : slot
    ));
    if (room.hostId === accountId) {
      const nextHost = room.slots.find((slot) => slot.type === "player" && slot.playerId);
      room.hostId = nextHost?.playerId ?? null;
    }
    syncServerPlayersFromSlots(room);
  });
  rooms = rooms.filter((room) => room.hostId && room.players.length > 0);
  broadcastRooms("adminDeleteAccount");
}

function broadcastAccountDeleted(accountId, message) {
  const payload = {
    type: "accountDeleted",
    sourceId: "server",
    targetPlayerId: accountId,
    message,
    at: Date.now()
  };

  clients.forEach((client) => {
    if (client.playerId === accountId) {
      sendJson(client, payload);
    }
  });
}

function sendAccountUpdatedToPlayer(accountId, account) {
  const payload = {
    type: "accountUpdated",
    sourceId: "server",
    account: sanitizeAccountForClient(account),
    at: Date.now()
  };

  clients.forEach((client) => {
    if (client.playerId === accountId) {
      sendJson(client, payload);
    }
  });
}

function markClientDisconnected(client) {
  const playerId = client?.playerId;
  if (!playerId) return;

  let changed = false;
  rooms.forEach((room) => {
    room.slots = normalizeServerSlots(room.slots);
    const slot = room.slots.find((entry) => entry.type === "player" && entry.playerId === playerId);
    if (!slot) return;
    if (slot.connected === false && slot.disconnectedAt) return;

    slot.connected = false;
    slot.disconnectedAt = Date.now();
    room.updatedAt = Date.now();
    syncServerPlayersFromSlots(room);
    changed = true;
  });

  if (changed) {
    broadcastRooms("playerDisconnected");
  }
}

function handleSupportReport(client, message) {
  const text = String(message.text ?? "").replace(/\s+/g, " ").trim().slice(0, 1000);
  const category = String(message.category ?? "bug").trim().slice(0, 40);
  if (!text) {
    sendJson(client, { type: "supportReportResult", sourceId: "server", ok: false, message: "내용을 입력해 주세요.", at: Date.now() });
    return;
  }

  const account = message.sourceId ? accounts.get(String(message.sourceId)) : null;
  const report = {
    id: crypto.randomUUID(),
    category,
    text,
    accountId: String(message.sourceId ?? ""),
    nickname: account?.nickname ?? String(message.nickname ?? "Player").slice(0, 18),
    roomId: message.roomId ?? null,
    gameStarted: Boolean(message.gameStarted),
    userAgent: String(message.userAgent ?? "").slice(0, 180),
    at: Date.now()
  };
  supportReports.unshift(report);
  supportReports.splice(MAX_SUPPORT_REPORTS);
  sendJson(client, { type: "supportReportResult", sourceId: "server", ok: true, reportId: report.id, message: "신고 및 건의가 접수되었습니다.", at: Date.now() });
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
  if (message.sourceId) {
    client.playerId = message.sourceId;
  }

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

  if (message.type === "supportReport") {
    handleSupportReport(client, message);
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
    const room = findRoom(message.roomId);
    const session = gameSessions.get(message.roomId);
    if (session?.state && room?.hostId === message.sourceId && message.snapshot) {
      session.state.importSnapshot(message.snapshot);
      scheduleServerAiTurn(room, session);
    }
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
    if (handleServerPlayerCommand(client, message)) {
      return;
    }
    broadcast({ ...message, sourceClientId: client.id });
    return;
  }

  if (message.type === "playerCommandResult") {
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

async function loadGameRules() {
  const readRule = async (relativePath) => JSON.parse(await fs.readFile(path.join(__dirname, relativePath), "utf8"));

  const [playerTemplate, lootTables, weapons, dice, armor, events] = await Promise.all([
    readRule("data/rules/playerTemplate.json"),
    readRule("data/rules/lootTables.json"),
    readRule("data/rules/weapons.json"),
    readRule("data/rules/dice.json"),
    readRule("data/rules/armor.json"),
    readRule("data/rules/events.json")
  ]);

  return { playerTemplate, lootTables, weapons, dice, armor, events };
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
      abandons: 0,
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
        tokenRing: "default",
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
  client.playerId = accountId;
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
  client.playerId = normalized.accountId;
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
    { id: "nameplate_ranger", category: "nameplate", price: 2800 },
    { id: "nameplate_blacksite", category: "nameplate", price: 4200 },
    { id: "nameplate_medtech", category: "nameplate", price: 3200 },
    { id: "nameplate_goldline", category: "nameplate", price: 5200 },
    { id: "nameplate_bloodmark", category: "nameplate", price: 6400 },
    { id: "nameplate_recon", category: "nameplate", price: 5600 },
    { id: "nameplate_thermal", category: "nameplate", price: 6200 },
    { id: "nameplate_hazmat", category: "nameplate", price: 6800 },
    { id: "chat_radio", category: "chatBubble", price: 60 },
    { id: "chat_amber", category: "chatBubble", price: 140 },
    { id: "chat_nightops", category: "chatBubble", price: 120 },
    { id: "chat_signal", category: "chatBubble", price: 230 },
    { id: "chat_bloodred", category: "chatBubble", price: 360 },
    { id: "token_ember", category: "tokenSkin", price: 1000 },
    { id: "token_signal_blue", category: "tokenSkin", price: 1000 },
    { id: "token_signal_green", category: "tokenSkin", price: 1000 },
    { id: "token_signal_violet", category: "tokenSkin", price: 1000 },
    { id: "token_signal_rose", category: "tokenSkin", price: 1000 },
    { id: "token_hazard", category: "tokenSkin", price: 1800 },
    { id: "token_hazard_cyan", category: "tokenSkin", price: 1800 },
    { id: "token_hazard_magenta", category: "tokenSkin", price: 1800 },
    { id: "token_hazard_white", category: "tokenSkin", price: 1800 },
    { id: "token_standard_issue", category: "tokenSkin", price: 5000 },
    { id: "token_recon", category: "tokenSkin", price: 5000 },
    { id: "token_thermal", category: "tokenSkin", price: 5000 },
    { id: "token_hazmat", category: "tokenSkin", price: 5000 },
    { id: "token_jammer", category: "tokenSkin", price: 5000 },
    { id: "token_black_cell", category: "tokenSkin", price: 5000 },
    { id: "token_contraband", category: "tokenSkin", price: 5000 },
    { id: "token_extraction_mark", category: "tokenSkin", price: 5000 },
    { id: "ring_white_glow", category: "tokenRing", price: 1500 },
    { id: "ring_ember_glow", category: "tokenRing", price: 1500 },
    { id: "ring_signal_glow", category: "tokenRing", price: 1500 },
    { id: "ring_hazmat_glow", category: "tokenRing", price: 1500 },
    { id: "title_rookie", category: "title", price: 50 },
    { id: "title_contractor", category: "title", price: 130 },
    { id: "title_pathfinder", category: "title", price: 180 },
    { id: "title_blackbox", category: "title", price: 280 },
    { id: "title_raidlegend", category: "title", price: 500 }
  ];
}

function handleChatMessage(client, message) {
  if (message.roomId === LOBBY_CHAT_ROOM_ID) {
    handleLobbyChatMessage(client, message);
    return;
  }

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

function handleLobbyChatMessage(client, message) {
  if (!message.sourceId) {
    sendJson(client, { type: "chatRejected", sourceId: "server", roomId: LOBBY_CHAT_ROOM_ID, message: "Login required", at: Date.now() });
    return;
  }

  const text = trimChatText(String(message.text ?? "").replace(/\s+/g, " ").trim());
  if (!text) {
    sendJson(client, { type: "chatRejected", sourceId: "server", roomId: LOBBY_CHAT_ROOM_ID, message: "Empty message", at: Date.now() });
    return;
  }

  const account = getAccountRecord(message.sourceId, message.nickname);
  const chatMessage = {
    id: message.messageId ?? crypto.randomUUID(),
    roomId: LOBBY_CHAT_ROOM_ID,
    playerId: message.sourceId,
    nickname: account.nickname || message.nickname || "Player",
    text,
    cosmetics: account.cosmetics?.equipped ?? {},
    phase: null,
    raid: null,
    at: Date.now()
  };
  const messages = [...(chatMessagesByRoom.get(LOBBY_CHAT_ROOM_ID) ?? []), chatMessage].slice(-MAX_CHAT_MESSAGES);
  chatMessagesByRoom.set(LOBBY_CHAT_ROOM_ID, messages);
  broadcast({ type: "chatMessage", sourceId: "server", roomId: LOBBY_CHAT_ROOM_ID, message: chatMessage, at: Date.now() });
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
  if (message.roomId === LOBBY_CHAT_ROOM_ID) {
    return;
  }

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
      case "reconnectRoom":
        result = reconnectServerRoom(payload, playerId);
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
  for (const session of gameSessions.values()) {
    clearServerAiTimer(session);
    clearServerRaidAdvanceTimer(session);
  }
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

  if (room.status === "inProgress") {
    room.slots = normalizeServerSlots(room.slots).map((slot) => (
      slot.type === "player" && slot.playerId === playerId
        ? {
            type: "computer",
            weaponId: slot.weaponId ?? "AR",
            armorId: slot.armorId ?? "lightSet",
            takeoverFromPlayerId: slot.playerId,
            takeoverName: slot.nickname,
            takeoverAt: Date.now()
          }
        : slot
    ));
    syncServerPlayersFromSlots(room);
    const humans = normalizeServerSlots(room.slots).filter((slot) => slot.type === "player");
    if (!humans.length) {
      rooms = rooms.filter((entry) => entry.id !== room.id);
      snapshots.delete(room.id);
      deleteGameSession(room.id);
      chatMessagesByRoom.delete(room.id);
      return { ok: true, room: null, message: "Room removed" };
    }
    if (room.hostId === playerId) {
      room.hostId = humans[0].playerId;
    }
    room.updatedAt = Date.now();
    syncServerPlayersFromSlots(room);
    return { ok: true, room, message: "Player replaced by COM" };
  }

  room.slots = normalizeServerSlots(room.slots).map((slot) => (
    slot.type === "player" && slot.playerId === playerId
      ? { type: "open", weaponId: slot.weaponId ?? "AR", armorId: slot.armorId ?? "lightSet" }
      : slot
  ));
  syncServerPlayersFromSlots(room);

  if (!room.players.length) {
    rooms = rooms.filter((entry) => entry.id !== room.id);
    snapshots.delete(room.id);
    deleteGameSession(room.id);
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
  if (status === "inProgress") {
    ensureGameSession(room, { reset: true });
  } else if (status === "finished") {
    deleteGameSession(room.id);
    snapshots.delete(room.id);
  }
  return { ok: true, room, message: "Status updated" };
}

function touchServerPresence(payload, playerId) {
  const room = findRoom(payload.roomId);
  if (!room) return { ok: false, message: "Room not found" };
  room.slots = normalizeServerSlots(room.slots);
  let slot = room.slots.find((entry) => entry.type === "player" && entry.playerId === playerId);
  if (!slot && room.status === "inProgress") {
    reconnectTakeoverSlot(room, playerId);
    slot = room.slots.find((entry) => entry.type === "player" && entry.playerId === playerId);
  }
  if (!slot) return { ok: false, message: "Player not in room" };
  slot.connected = true;
  slot.lastSeen = Date.now();
  slot.disconnectedAt = null;
  room.updatedAt = Date.now();
  syncServerPlayersFromSlots(room);
  return { ok: true, room, message: "Presence updated" };
}

function reconnectServerRoom(payload, playerId) {
  const room = findRoom(payload.roomId);
  if (!room) return { ok: false, message: "Room not found" };
  room.slots = normalizeServerSlots(room.slots);
  reconnectTakeoverSlot(room, playerId);
  const slot = room.slots.find((entry) => entry.type === "player" && entry.playerId === playerId);
  if (!slot) return { ok: false, message: "Reconnect slot not found" };
  slot.connected = true;
  slot.lastSeen = Date.now();
  slot.disconnectedAt = null;
  room.updatedAt = Date.now();
  syncServerPlayersFromSlots(room);
  return { ok: true, room, message: "Reconnected" };
}

function reconnectTakeoverSlot(room, playerId) {
  const index = room.slots.findIndex((slot) => slot.type === "computer" && slot.takeoverFromPlayerId === playerId);
  if (index < 0) return false;

  const slot = room.slots[index];
  if (slot.removedByAdmin || !accounts.has(playerId)) {
    return false;
  }
  const account = getAccountRecord(playerId, slot.takeoverName ?? "Player");
  room.slots[index] = {
    slotIndex: index,
    type: "player",
    playerId,
    nickname: slot.takeoverName ?? account.nickname ?? "Player",
    weaponId: slot.weaponId ?? "AR",
    armorId: slot.armorId ?? "lightSet",
    cosmetics: account.cosmetics ?? null,
    ready: true,
    connected: true,
    lastSeen: Date.now(),
    disconnectedAt: null,
    reconnectedAt: Date.now()
  };
  if (!room.hostId) {
    room.hostId = playerId;
  }
  return true;
}

function ensureGameSession(room, { reset = false } = {}) {
  if (!room?.id || room.status !== "inProgress") {
    return null;
  }

  const existing = gameSessions.get(room.id);
  if (existing && !reset) {
    return existing;
  }
  if (existing && reset) {
    deleteGameSession(room.id);
  }

  const mapData = getRoomMapDataForServer(room);
  if (!mapData) {
    throw new Error("Missing map data");
  }

  const state = new RaidGameState({
    mapData: createGameplayScaleMapData(mapData),
    ...gameRules,
    aiCount: Math.max(0, getServerPlayerLoadouts(room).length - 1),
    playerLoadouts: getServerPlayerLoadouts(room)
  });
  const session = {
    roomId: room.id,
    state,
    eventSeq: 0,
    aiTimer: null,
    aiRunning: false,
    raidAdvanceTimer: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  gameSessions.set(room.id, session);
  publishServerSnapshot(room, session, "orderReveal", { authority: "server", type: "gameStart" });
  scheduleServerAiTurn(room, session, SERVER_AI_TURN_START_DELAY_MS);
  return session;
}

function getRoomMapDataForServer(room) {
  return clonePlain(room?.mapPackage?.data ?? null);
}

function createGameplayScaleMapData(mapData) {
  const source = clonePlain(mapData);
  const originalHexSize = Number(source.hexSize ?? GAMEPLAY_HEX_SIZE);
  const targetHexSize = Math.max(GAMEPLAY_HEX_SIZE, originalHexSize);
  const scale = targetHexSize / Math.max(1, originalHexSize);

  source.gameplaySourceHexSize = originalHexSize;
  source.hexSize = targetHexSize;
  source.originX = Number(source.originX ?? 0) * scale;
  source.originY = Number(source.originY ?? 0) * scale;
  source.backgroundX = Number(source.backgroundX ?? 0) * scale;
  source.backgroundY = Number(source.backgroundY ?? 0) * scale;
  source.backgroundScale = Number(source.backgroundScale ?? 1) * scale;
  return source;
}

function getServerPlayerLoadouts(room) {
  let humanIndex = 0;
  let computerIndex = 0;
  return normalizeServerSlots(room.slots)
    .filter((slot) => slot.type === "player" || slot.type === "computer")
    .map((slot) => {
      if (slot.type === "computer") {
        computerIndex += 1;
        return {
          name: slot.takeoverName ? `${slot.takeoverName} (COM)` : `COM ${computerIndex}`,
          controllerId: null,
          isAi: true,
          weaponId: slot.weaponId ?? "SMG",
          armorId: slot.armorId ?? "lightSet"
        };
      }

      humanIndex += 1;
      return {
        name: slot.nickname || `Player ${humanIndex}`,
        controllerId: slot.playerId,
        isAi: false,
        weaponId: slot.weaponId ?? "AR",
        armorId: slot.armorId ?? "lightSet",
        cosmetics: slot.cosmetics?.equipped ?? slot.cosmetics ?? null
      };
    });
}

function handleServerPlayerCommand(client, message) {
  const room = findRoom(message.roomId);
  if (!room || room.status !== "inProgress") {
    return false;
  }

  const session = ensureGameSession(room);
  if (!session?.state) {
    return false;
  }

  const command = message.command ?? {};
  if (command.type === "tileClick") {
    return true;
  }

  const result = applyServerPlayerCommand(session, message);
  if (!result.handled) {
    return false;
  }

  if (!result.ok) {
    sendPlayerCommandResult(message, command, "rejected", { reason: result.reason ?? "입력 불가" });
    return true;
  }

  session.updatedAt = Date.now();
  sendPlayerCommandResult(message, command, "confirmed", { reason: result.reason ?? "confirmed" });
  publishServerSnapshot(room, session, result.snapshotReason ?? "state", {
    authority: "server",
    commandId: message.commandId ?? null,
    controllerId: message.controllerId ?? null,
    ...(result.meta ?? {})
  });
  scheduleServerRaidAdvance(room, session);
  scheduleServerAiTurn(room, session);
  return true;
}

function applyServerPlayerCommand(session, message) {
  const state = session.state;
  const command = message.command ?? {};
  const controllerId = message.controllerId ?? message.sourceId ?? null;
  const controllerPlayerIndex = state.players.findIndex((player) => player.controllerId === controllerId);
  const controllerPlayer = state.players[controllerPlayerIndex] ?? null;

  if (!controllerPlayer && command.type !== "leaveGame") {
    return { handled: true, ok: false, reason: "플레이어를 찾을 수 없습니다." };
  }

  if (command.type === "leaveGame") {
    convertServerControllerToAi(state, controllerId, command.nickname ?? "플레이어");
    return { handled: true, ok: true, snapshotReason: "playerLeft", reason: "playerLeft" };
  }

  if (command.type === "insureBagItem") {
    const item = state.insureBagItem(Number(command.itemIndex), controllerPlayer);
    return item
      ? { handled: true, ok: true, snapshotReason: "insuranceUpdate", meta: { viewerControllerIds: [controllerId], reason: `${item.name} insured` } }
      : { handled: true, ok: false, reason: "보험 처리할 아이템이 없습니다." };
  }

  if (command.type === "corpseTake") {
    const item = state.takeCorpseBagItem(command.corpseBagId, Number(command.itemIndex), controllerPlayer);
    return item
      ? { handled: true, ok: true, snapshotReason: "corpseLootUpdate", meta: { viewerControllerIds: [controllerId], corpseBagId: command.corpseBagId, reason: `${item.name} moved to bag` } }
      : { handled: true, ok: false, reason: "아이템을 옮길 수 없습니다." };
  }

  if (command.type === "corpseDrop") {
    const item = state.dropBagItem(Number(command.itemIndex), controllerPlayer);
    return item
      ? { handled: true, ok: true, snapshotReason: "corpseLootUpdate", meta: { viewerControllerIds: [controllerId], corpseBagId: command.corpseBagId, reason: `${item.name} dropped` } }
      : { handled: true, ok: false, reason: "아이템을 내려놓을 수 없습니다." };
  }

  if (command.type === "discardBagItem") {
    const item = state.discardSelectedBagItem(Number(command.itemIndex), controllerPlayer);
    return item
      ? { handled: true, ok: true, snapshotReason: "discardUpdate", meta: { viewerControllerIds: [controllerId], reason: `${item.name} discarded` } }
      : { handled: true, ok: false, reason: "버릴 아이템을 찾을 수 없습니다." };
  }

  if (state.player?.controllerId !== controllerId || state.player?.isAi) {
    return { handled: true, ok: false, reason: "현재 턴이 아닙니다." };
  }

  if (command.type === "tileAction" && command.action === "move") {
    const tile = state.gameMap.tilesByKey.get(command.tileKey);
    const wasPostAttackMove = state.postAttackMoveAvailable;
    const moveResult = tile ? state.movePlayer(tile) : null;
    if (!moveResult) {
      return { handled: true, ok: false, reason: "이동 불가" };
    }
    const endReason = finalizeServerActionTurn(state, { forceEnd: moveResult.extracted || wasPostAttackMove });
    return {
      handled: true,
      ok: true,
      snapshotReason: chooseServerSnapshotReason(state, "movement"),
      reason: "move:confirmed",
      meta: {
        type: "movement",
        event: "player:moved",
        unitId: state.players[controllerPlayerIndex]?.id ?? state.player?.id,
        path: moveResult.path,
        endReason
      }
    };
  }

  if (command.type === "tileAction" && command.action === "corpseLoot") {
    const tile = state.gameMap.tilesByKey.get(command.tileKey);
    const corpseBag = tile ? state.openCorpseBag(tile) : null;
    return corpseBag
      ? { handled: true, ok: true, snapshotReason: "corpseLootOpen", meta: { viewerControllerIds: [controllerId], corpseBagId: corpseBag.id, reason: `${corpseBag.ownerName}'s corpse bag opened` } }
      : { handled: true, ok: false, reason: "시체 가방을 열 수 없습니다." };
  }

  if (command.type === "tileAction" && command.action === "loot" || command.type === "loot") {
    const item = state.lootCurrentTile();
    if (!item) {
      return { handled: true, ok: false, reason: "루팅할 수 없습니다." };
    }
    const endReason = finalizeServerActionTurn(state);
    return {
      handled: true,
      ok: true,
      snapshotReason: chooseServerSnapshotReason(state, "lootReveal"),
      meta: { event: "player:looted", viewerControllerIds: [controllerId], items: item.items ?? [item], endReason }
    };
  }

  if (command.type === "tileAction" && command.action === "attack" || command.type === "attack") {
    const tileKeyValue = command.tileKey ?? command.targetTileKey ?? state.selectedTileKey;
    const tile = state.gameMap.tilesByKey.get(tileKeyValue);
    if (tile) {
      state.selectTile(tile);
    }
    const result = state.attackSelectedEnemy();
    if (!result) {
      return { handled: true, ok: false, reason: "공격할 수 없습니다." };
    }
    const attackSummary = clonePlain(state.lastAttackSummary);
    const attackerId = attackSummary?.attackerId;
    const targetId = attackSummary?.targetId;
    if (!state.postAttackMoveAvailable && !state.raidEnded) {
      state.endTurn();
    }
    return {
      handled: true,
      ok: true,
      snapshotReason: chooseServerSnapshotReason(state, "attackReveal"),
      meta: {
        event: "player:attacked",
        attackerId,
        targetId,
        weaponId: result.weapon?.name ?? state.player?.weaponId,
        roll: result.roll,
        summary: attackSummary
      }
    };
  }

  if (command.type === "endTurn") {
    const result = state.endTurn();
    return {
      handled: true,
      ok: true,
      snapshotReason: chooseServerSnapshotReason(state, "turnEnded"),
      meta: { event: "phase:advanced", result }
    };
  }

  return { handled: false, ok: false };
}

function finalizeServerActionTurn(state, { forceEnd = false } = {}) {
  if (state.raidEnded) {
    return state.raidResult;
  }

  if (forceEnd || (state.getAvailableStamina() <= 0 && !state.canUseHpMove())) {
    return state.endTurn();
  }

  return "inProgress";
}

function chooseServerSnapshotReason(state, fallback) {
  if (state.lastEventDraws?.length > 0) {
    return "eventReveal";
  }

  if (state.raidEnded) {
    return "state";
  }

  return fallback;
}

function sendPlayerCommandResult(message, command, status, detail = {}) {
  broadcast({
    type: "playerCommandResult",
    roomId: message.roomId,
    sourceId: "server",
    targetControllerId: message.controllerId ?? message.sourceId ?? null,
    commandId: message.commandId ?? null,
    commandType: command?.type ?? null,
    action: command?.action ?? null,
    status,
    ...detail,
    at: Date.now()
  });
}

function publishServerSnapshot(room, session, reason = "state", meta = {}) {
  const version = Date.now() + (++session.eventSeq / 1000);
  const payload = {
    type: "gameSnapshot",
    roomId: room.id,
    sourceId: "server",
    version,
    reason,
    meta,
    snapshot: session.state.exportSnapshot()
  };
  if (meta?.event) {
    broadcast({
      type: "gameEvent",
      roomId: room.id,
      sourceId: "server",
      version,
      reason,
      event: meta.event,
      meta,
      at: Date.now()
    });
  }
  snapshots.set(room.id, payload);
  broadcast(payload);
  return payload;
}

function convertServerControllerToAi(state, controllerId, nickname = "플레이어") {
  state.players.forEach((player, index) => {
    if (player.controllerId !== controllerId) {
      return;
    }

    player.isAi = true;
    player.controllerId = null;
    player.aiProfile = player.aiProfile ?? getServerAiProfileId(index + 1);
    player.name = player.name.includes("(COM)") ? player.name : `${player.name} (COM)`;
  });
  state.raidLog.unshift(`${nickname}님이 나갔습니다. COM이 인계합니다.`);
}

function scheduleServerAiTurn(room, session, delayMs = SERVER_AI_STEP_DELAY_MS) {
  if (!room || !session?.state) {
    return;
  }

  clearServerAiTimer(session);
  if (
    room.status !== "inProgress" ||
    session.aiRunning ||
    session.state.raidEnded ||
    !session.state.player?.isAi ||
    hasServerBlockingDiscard(session.state)
  ) {
    return;
  }

  session.aiTimer = setTimeout(() => {
    session.aiTimer = null;
    runServerAiTurn(room.id);
  }, delayMs);
}

function scheduleServerRaidAdvance(room, session) {
  if (!room || !session?.state || session.raidAdvanceTimer) {
    return;
  }

  if (room.status !== "inProgress" || !session.state.raidEnded || session.state.raid >= 3) {
    return;
  }

  session.raidAdvanceTimer = setTimeout(() => {
    session.raidAdvanceTimer = null;
    const activeRoom = findRoom(room.id);
    if (!activeRoom || activeRoom.status !== "inProgress" || !session.state.raidEnded || session.state.raid >= 3) {
      return;
    }

    if (!session.state.startNextRaid()) {
      return;
    }

    publishServerSnapshot(activeRoom, session, "orderReveal", {
      authority: "server",
      event: "raid:advanced",
      raid: session.state.raid
    });
    scheduleServerAiTurn(activeRoom, session, SERVER_AI_TURN_START_DELAY_MS);
  }, 10000);
}

function runServerAiTurn(roomId) {
  const room = findRoom(roomId);
  const session = gameSessions.get(roomId);
  if (!room || room.status !== "inProgress" || !session?.state || session.aiRunning) {
    return;
  }

  const state = session.state;
  if (state.raidEnded || !state.player?.isAi || hasServerBlockingDiscard(state)) {
    return;
  }

  session.aiRunning = true;
  let result;
  try {
    result = performServerAiStep(state);
  } catch (error) {
    console.warn(`Server AI failed in room ${roomId}: ${error.message}`);
    result = { acted: false, reason: "serverAiError" };
  } finally {
    session.aiRunning = false;
  }

  session.updatedAt = Date.now();
  publishServerSnapshot(room, session, chooseServerSnapshotReason(state, result?.snapshotReason ?? "aiTurn"), {
    authority: "server",
    event: result?.event ?? "ai:turn",
    actorId: result?.actorId ?? null,
    ...(result?.meta ?? {})
  });
  scheduleServerRaidAdvance(room, session);
  scheduleServerAiTurn(room, session);
}

function performServerAiStep(state) {
  const ai = state.player;
  if (!ai?.isAi || !state.isPlayerActive(ai)) {
    const turnResult = state.endTurn();
    return { acted: true, actorId: ai?.id ?? null, event: "ai:turnSkipped", snapshotReason: "turnEnded", meta: { result: turnResult } };
  }

  const opponents = getServerAiOpponents(state, ai);
  if (shouldServerAiExtract(state, ai, opponents)) {
    if (state.canPlayerExtractFromTile(ai, state.currentTile)) {
      const turnResult = state.endTurn();
      return { acted: true, actorId: ai.id, event: "ai:extracted", snapshotReason: "turnEnded", meta: { result: turnResult } };
    }

    const extractionPlan = chooseServerAiGoalPlan(state, ai, state.getExtractionTilesForPlayer(ai));
    if (extractionPlan?.moveTile) {
      return performServerAiMove(state, extractionPlan.moveTile, "ai:movedToExtract");
    }
  }

  const attackTarget = chooseServerAiAttackTarget(state, ai, opponents);
  if (attackTarget) {
    state.selectTile(attackTarget.position);
    const attack = state.attackSelectedEnemy();
    if (attack) {
      const attackSummary = clonePlain(state.lastAttackSummary);
      const attackerId = attackSummary?.attackerId;
      const targetId = attackSummary?.targetId;
      if (!state.postAttackMoveAvailable && !state.raidEnded) {
        state.endTurn();
      }
      return {
        acted: true,
        actorId: ai.id,
        event: "ai:attacked",
        snapshotReason: "attackReveal",
        meta: {
          attackerId,
          targetId,
          weaponId: attack.weapon?.name ?? ai.weaponId,
          roll: attack.roll,
          summary: attackSummary
        }
      };
    }
  }

  if (state.canLoot() && shouldServerAiLootCurrentTile(state, ai, opponents)) {
    const item = state.lootCurrentTile();
    const turnResult = finalizeServerActionTurn(state);
    return {
      acted: Boolean(item),
      actorId: ai.id,
      event: "ai:looted",
      snapshotReason: "lootReveal",
      meta: { items: item?.items ?? (item ? [item] : []), result: turnResult }
    };
  }

  const attackMove = chooseServerAiAttackMove(state, ai, opponents);
  if (attackMove?.moveTile) {
    return performServerAiMove(state, attackMove.moveTile, "ai:movedToAttack");
  }

  const lootPlan = chooseServerAiLootPlan(state, ai, opponents);
  if (lootPlan?.moveTile) {
    return performServerAiMove(state, lootPlan.moveTile, "ai:movedToLoot");
  }

  if (state.canLoot()) {
    const item = state.lootCurrentTile();
    const turnResult = finalizeServerActionTurn(state);
    return {
      acted: Boolean(item),
      actorId: ai.id,
      event: "ai:looted",
      snapshotReason: "lootReveal",
      meta: { items: item?.items ?? (item ? [item] : []), result: turnResult }
    };
  }

  const fallbackExtraction = chooseServerAiGoalPlan(state, ai, state.getExtractionTilesForPlayer(ai));
  if (fallbackExtraction?.moveTile) {
    return performServerAiMove(state, fallbackExtraction.moveTile, "ai:movedToFallback");
  }

  const turnResult = state.endTurn();
  return { acted: true, actorId: ai.id, event: "ai:endedTurn", snapshotReason: "turnEnded", meta: { result: turnResult } };
}

function performServerAiMove(state, tile, event) {
  const actorId = state.player?.id ?? null;
  const wasPostAttackMove = state.postAttackMoveAvailable;
  const moveResult = state.movePlayer(tile);
  if (!moveResult) {
    const turnResult = state.endTurn();
    return { acted: false, actorId, event: "ai:moveFailed", snapshotReason: "turnEnded", meta: { result: turnResult } };
  }

  const turnResult = finalizeServerActionTurn(state, { forceEnd: moveResult.extracted || wasPostAttackMove });
  return {
    acted: true,
    actorId,
    event,
    snapshotReason: "movement",
    meta: {
      type: "movement",
      unitId: actorId,
      path: moveResult.path,
      result: turnResult
    }
  };
}

function getServerAiOpponents(state, ai) {
  return state.players.filter((player) => player.id !== ai?.id && state.isPlayerActive(player));
}

function chooseServerAiAttackTarget(state, ai, opponents) {
  return state.getAttackableTargets()
    .filter((target) => opponents.some((opponent) => opponent.id === target.id))
    .map((target) => ({
      target,
      score: getServerAiTargetScore(state, ai, target)
    }))
    .sort((a, b) => b.score - a.score)[0]?.target ?? null;
}

function chooseServerAiAttackMove(state, ai, opponents) {
  const weapon = state.getEffectiveWeapon(ai);
  const candidates = opponents
    .map((target) => {
      const targetTile = state.gameMap.tilesByKey.get(tileKey(target.position));
      const path = targetTile ? state.findPathToTile(ai.position, targetTile, { ignorePlayerId: ai.id }) : null;
      const moveTile = path ? getServerReachableTileAlongPath(state, path) : null;
      return moveTile ? { moveTile, target, score: getServerAiTargetScore(state, ai, target) } : null;
    })
    .filter(Boolean)
    .filter((plan) => plan.score >= 6 || hexDistance(plan.moveTile, plan.target.position) <= weapon.range)
    .sort((a, b) => b.score - a.score);

  return candidates[0] ?? null;
}

function getServerAiTargetScore(state, ai, target) {
  const weapon = state.getEffectiveWeapon(ai);
  const distance = hexDistance(ai.position, target.position);
  const canShoot = distance <= weapon.range && state.hasLineOfSight(ai.position, target.position);
  const health = getServerBodyHealthScore(target);
  const lootValue = Number(target.bagValue ?? 0);
  return lootValue * 0.55 + Math.max(0, 10 - health) + (canShoot ? 4 : 0) - Math.max(0, distance - weapon.range) * 0.8;
}

function chooseServerAiLootPlan(state, ai, opponents) {
  const extractionTiles = state.getExtractionTilesForPlayer(ai);
  return state.gameMap.lootTiles
    .filter((tile) => !tile.looted)
    .map((tile) => {
      const path = state.findPathToTile(ai.position, tile, { ignorePlayerId: ai.id });
      const moveTile = path ? getServerReachableTileAlongPath(state, path) : null;
      if (!moveTile) {
        return null;
      }

      const pathDistance = Math.max(0, path.length - 1);
      const extractionDistance = getServerNearestPathDistance(state, tile, extractionTiles, ai.id);
      const pressure = getServerNearestOpponentDistance(tile, opponents);
      const risk = Number.isFinite(pressure) ? Math.max(0, 6 - pressure) : 0;
      const baseValue = tile.lootType === "rare" ? 16 : 8;
      return { tile, moveTile, score: baseValue - pathDistance * 1.5 - extractionDistance * 0.35 - risk };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)[0] ?? null;
}

function chooseServerAiGoalPlan(state, ai, goalTiles) {
  return goalTiles
    .map((tile) => {
      const path = state.findPathToTile(ai.position, tile, { ignorePlayerId: ai.id });
      const moveTile = path ? getServerReachableTileAlongPath(state, path) : null;
      return moveTile ? { tile, moveTile, distance: Math.max(0, path.length - 1) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance)[0] ?? null;
}

function getServerReachableTileAlongPath(state, path) {
  const entryMap = new Map(state.getMovementEntries().map((entry) => [tileKey(entry.tile), entry.tile]));
  for (let index = path.length - 1; index >= 1; index -= 1) {
    const tile = entryMap.get(tileKey(path[index]));
    if (tile) {
      return tile;
    }
  }
  return null;
}

function shouldServerAiLootCurrentTile(state, ai, opponents) {
  const tile = state.currentTile;
  if (!tile || tile.looted || tile.lootType === "none") {
    return false;
  }

  if (tile.lootType === "rare" || opponents.length === 0) {
    return true;
  }

  const pressure = getServerNearestOpponentDistance(ai.position, opponents);
  return !Number.isFinite(pressure) || pressure >= 3 || Number(ai.bagValue ?? 0) < 10;
}

function shouldServerAiExtract(state, ai, opponents) {
  const extractionDistance = getServerNearestPathDistance(state, ai.position, state.getExtractionTilesForPlayer(ai), ai.id);
  const nearestOpponentDistance = getServerNearestOpponentDistance(ai.position, opponents);
  const safe = !Number.isFinite(nearestOpponentDistance) || nearestOpponentDistance >= 3;
  const bagValue = Number(ai.bagValue ?? 0);
  const health = getServerBodyHealthScore(ai);

  if (state.raid >= 3 && state.phase >= 12 && bagValue > 0) {
    return true;
  }

  if (state.phase >= 14 && Number.isFinite(extractionDistance)) {
    return true;
  }

  if (bagValue >= 14 && extractionDistance <= 7 && safe) {
    return true;
  }

  return health <= 7 && bagValue > 0 && extractionDistance <= 8;
}

function getServerNearestPathDistance(state, origin, targets, ignorePlayerId) {
  return targets.reduce((best, tile) => {
    const path = state.findPathToTile(origin, tile, { ignorePlayerId });
    return path ? Math.min(best, Math.max(0, path.length - 1)) : best;
  }, Number.POSITIVE_INFINITY);
}

function getServerNearestOpponentDistance(origin, opponents) {
  return opponents.reduce((best, opponent) => (
    opponent.position ? Math.min(best, hexDistance(origin, opponent.position)) : best
  ), Number.POSITIVE_INFINITY);
}

function getServerBodyHealthScore(player) {
  return Object.values(player?.bodyHp ?? {}).reduce((sum, value) => sum + Number(value ?? 0), 0);
}

function hasServerBlockingDiscard(state) {
  return state.players.some((player) => !player.isAi && Number(player.pendingDiscardCount ?? 0) > 0);
}

function clearServerAiTimer(session) {
  if (session?.aiTimer) {
    clearTimeout(session.aiTimer);
    session.aiTimer = null;
  }
}

function clearServerRaidAdvanceTimer(session) {
  if (session?.raidAdvanceTimer) {
    clearTimeout(session.raidAdvanceTimer);
    session.raidAdvanceTimer = null;
  }
}

function deleteGameSession(roomId) {
  const session = gameSessions.get(roomId);
  clearServerAiTimer(session);
  clearServerRaidAdvanceTimer(session);
  gameSessions.delete(roomId);
}

function getServerAiProfileId(index) {
  const profiles = ["aggressive", "looter", "survivor", "balanced", "hunter"];
  return profiles[Math.max(0, index - 1) % profiles.length];
}

function clonePlain(value) {
  if (value === undefined || value === null) {
    return value ?? null;
  }

  return JSON.parse(JSON.stringify(value));
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
    const playerSlots = normalizeServerSlots(room.slots).filter((slot) => slot.type === "player");
    if (now - createdAt <= ROOM_PRESENCE_TTL_MS) {
      return playerSlots.length > 0;
    }
    const hasRecentPlayer = playerSlots.some((slot) => now - (slot.lastSeen ?? room.updatedAt ?? createdAt) <= ROOM_RECONNECT_GRACE_MS);
    return playerSlots.length > 0 && hasRecentPlayer && now - createdAt < ROOM_TTL_MS;
  });

  const roomIds = new Set(rooms.map((room) => room.id));
  for (const roomId of snapshots.keys()) {
    if (!roomIds.has(roomId)) {
      snapshots.delete(roomId);
      chatMessagesByRoom.delete(roomId);
    }
  }

  for (const roomId of gameSessions.keys()) {
    if (!roomIds.has(roomId)) {
      deleteGameSession(roomId);
    }
  }

  for (const roomId of chatMessagesByRoom.keys()) {
    if (roomId === LOBBY_CHAT_ROOM_ID) {
      continue;
    }

    if (!roomIds.has(roomId)) {
      chatMessagesByRoom.delete(roomId);
    }
  }
}
