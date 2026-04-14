import express from "express";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// ── In-memory store ──────────────────────────────────────────────────────────
const store = {
  state: { messages: [], users: [] },

  getState() {
    return this.state;
  },

  setState(patch) {
    this.state = { ...this.state, ...patch };
    broadcast(this.state);
  },
};

// ── SSE client registry ──────────────────────────────────────────────────────
// Map<channel, Set<res>>
const channels = new Map();

function getChannel(name) {
  if (!channels.has(name)) channels.set(name, new Set());
  return channels.get(name);
}

/**
 * Broadcast a payload to all subscribers of a channel (default: "global").
 * Pass channel="*" to hit every connected client.
 */
export function broadcast(data, channel = "global", event = "state") {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  if (channel === "*") {
    for (const clients of channels.values()) {
      for (const res of clients) res.write(payload);
    }
  } else {
    const clients = channels.get(channel);
    if (clients) {
      for (const res of clients) res.write(payload);
    }
  }
}

// ── SSE endpoint ─────────────────────────────────────────────────────────────
// GET /api/events?channel=<name>   (channel defaults to "global")
app.get("/api/events", (req, res) => {
  const channel = typeof req.query.channel === "string" ? req.query.channel : "global";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Send current state immediately on connect
  res.write(`event: state\ndata: ${JSON.stringify(store.getState())}\n\n`);

  // Register client
  const clients = getChannel(channel);
  clients.add(res);

  // Keep-alive ping every 25s
  const heartbeat = setInterval(() => res.write(": ping\n\n"), 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(res);
    if (clients.size === 0) channels.delete(channel);
  });
});

// ── Action endpoints (actions go UP via HTTP POST) ───────────────────────────
app.post("/api/actions/message", (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "text is required" });
  }
  const message = { id: Date.now(), text, ts: new Date().toISOString() };
  store.setState({ messages: [...store.state.messages, message] });
  res.status(201).json(message);
});

app.post("/api/actions/user", (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "name is required" });
  }
  const user = { id: Date.now(), name };
  store.setState({ users: [...store.state.users, user] });
  res.status(201).json(user);
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 3001;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => console.log(`SSE server listening on http://localhost:${PORT}`));
}
