# Multiplayer Deployment

This prototype should be tested through one public server URL. The host PC should not be the game server once players are on different networks.

## Runtime Shape

- `server.mjs` serves `game.html`, assets, JSON data, and the WebSocket endpoint.
- Browser clients connect to the same origin:
  - Page: `https://your-server/game.html`
  - WebSocket: `wss://your-server/ws`
- Rooms and live game snapshots are kept in server memory for the current prototype.
- If the server restarts, rooms are cleared. Persistent rooms can be added later with Redis or a database.

## Local Server Check

```powershell
npm start
```

Open:

```text
http://localhost:5173/game.html
http://localhost:5173/healthz
```

## Render Deployment

1. Push this project to a Git repository.
2. Create a new Render Web Service from the repository.
3. Use these settings:
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Health Check Path: `/healthz`
4. After deployment, share the public Render URL with all testers.

The included `render.yaml` can also be used as a Render Blueprint.

## Docker Deployment

Build:

```powershell
docker build -t breaking-out-boardgame .
```

Run:

```powershell
docker run --rm -p 5173:5173 breaking-out-boardgame
```

Open:

```text
http://localhost:5173/game.html
```

## Current Prototype Limits

- A single Node process is required because room state is in memory.
- Do not scale horizontally yet. Multiple instances would create separate room lists.
- Use a platform setting that keeps WebSocket connections enabled.
- For production multiplayer, move rooms, snapshots, player sessions, reconnect timers, and command history to Redis or a database.
