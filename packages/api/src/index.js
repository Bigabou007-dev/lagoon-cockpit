require("dotenv").config();
const express = require("express");
const { init: initDb, auditLog } = require("./db/sqlite");
const db = initDb();
const { init: initUsers, createUser } = require("./auth/users");
const containers = require("./docker/containers");
const { getSystemMetrics } = require("./system/metrics");
const metricsHistory = require("./system/history");
const alertEngine = require("./system/alerts");
const webhooks = require("./system/webhooks");
const scheduler = require("./system/scheduler");
const { broadcast, getClientCount, closeAllClients } = require("./stream/sse");
const { init: initPush, sendPushNotification } = require("./push/expo");
const authRoutes = require("./routes/auth");
const containerRoutes = require("./routes/containers");
const stackRoutes = require("./routes/stacks");
const systemRoutes = require("./routes/system");
const manageRoutes = require("./routes/manage");
const dockerRoutes = require("./routes/docker");

const AUTH_MODE = process.env.AUTH_MODE || "key";
const PORT = parseInt(process.env.PORT || "3000", 10);
const SERVER_NAME = process.env.SERVER_NAME || "Cockpit Server";
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "").split(",").filter(Boolean);

if (AUTH_MODE === "users") {
  initUsers(db);
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
  if (userCount === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    createUser(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD, "admin");
    console.log(`[COCKPIT] Initial admin created: ${process.env.ADMIN_EMAIL}`);
  }
}

initPush(db);
metricsHistory.init(db);
alertEngine.init(db, sendPushNotification);
webhooks.init(db);
scheduler.init(db, auditLog);

const app = express();
app.use(express.json({ limit: "16kb" }));
app.locals.maintenanceMode = false;

app.use((req, _res, next) => { console.log(`[REQ] ${req.method} ${req.url} from ${req.ip}`); next(); });
app.get("/", (_req, res) => { res.json({ service: "lagoon-cockpit-api", status: "ok", docs: "/health" }); });
app.use((_req, res, next) => { res.header("X-Content-Type-Options", "nosniff"); res.header("X-Frame-Options", "DENY"); next(); });
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.length > 0 && origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin); res.header("Vary", "Origin");
  } else if (ALLOWED_ORIGINS.length === 0) { res.header("Access-Control-Allow-Origin", "*"); }
  res.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.get("/health", (_req, res) => { res.json({ status: "ok", timestamp: new Date().toISOString() }); });

app.use(authRoutes);
app.use(containerRoutes);
app.use(stackRoutes);
app.use(systemRoutes);
app.use(manageRoutes);
app.use(dockerRoutes);

let previousContainerStates = {};
async function broadcastLoop() {
  try {
    if (getClientCount() === 0) return;

    const [allContainers, metrics] = await Promise.all([
      containers.listContainers(true),
      Promise.resolve(getSystemMetrics()),
    ]);

    const running = allContainers.filter((c) => c.state === "running").length;
    const containerStats = { total: allContainers.length, running, stopped: allContainers.length - running };
    metricsHistory.recordMetrics(metrics, containerStats);
    if (!app.locals.maintenanceMode) alertEngine.evaluateRules(metrics, containerStats);
    broadcast("metrics", metrics);
    broadcast("containers", allContainers.map((c) => ({
      id: c.id, name: c.name, state: c.state, health: c.health, image: c.image, composeProject: c.composeProject,
    })));
    for (const c of allContainers) {
      const prev = previousContainerStates[c.id];
      if (prev && prev !== c.state) {
        const alert = {
          type: "container_state_change", containerId: c.id, containerName: c.name,
          previousState: prev, currentState: c.state, timestamp: new Date().toISOString(),
        };
        broadcast("alert", alert);

        if (c.state !== "running" && prev === "running" && !app.locals.maintenanceMode) {
          sendPushNotification(
            `Container Down: ${c.name}`,
            `${c.name} changed from ${prev} to ${c.state}`,
            { type: "container", containerId: c.id }
          ).catch(() => {});
          webhooks.fireWebhooks("container.down", alert).catch(() => {});
        }
        webhooks.fireWebhooks("container.state_change", alert).catch(() => {});
      }
      previousContainerStates[c.id] = c.state;
    }

    const currentIds = new Set(allContainers.map((c) => c.id));
    for (const id of Object.keys(previousContainerStates)) if (!currentIds.has(id)) delete previousContainerStates[id];
  } catch (err) { console.error("[SSE] Broadcast error:", err.message); }
}

const broadcastInterval = setInterval(broadcastLoop, 15000);

const server = app.listen(PORT, () => {
  console.log(`[COCKPIT] API on :${PORT} | ${SERVER_NAME} | auth=${AUTH_MODE} | SSE=15s`);
});

// Graceful shutdown — close SSE clients, stop broadcast, checkpoint SQLite WAL
function shutdown(signal) {
  console.log(`[COCKPIT] ${signal} received — shutting down gracefully`);
  clearInterval(broadcastInterval);
  closeAllClients();
  server.close(() => {
    console.log("[COCKPIT] HTTP server closed");
    process.exit(0);
  });
  setTimeout(() => { console.error("[COCKPIT] Forced exit after 5s timeout"); process.exit(1); }, 5000);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
