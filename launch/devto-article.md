---
title: "Your AI Agents Run 24/7. Your Laptop Doesn't. I Built a Mobile Docker Dashboard."
published: false
description: "Lagoon Cockpit: an open-source mobile-native app for managing Docker containers, Compose stacks, and server health from your phone — built for the age of always-on automation."
tags: devops, docker, opensource, reactnative
canonical_url: https://github.com/Lagoon-Tech-Systems/lagoon-cockpit
cover_image:
---

## The Problem

It's 2026. Your infrastructure doesn't sleep.

You've got n8n pipelines processing data around the clock. AI agents running inference jobs. Deployment managers watching your CI/CD. Scheduled backups, monitoring bots, reverse proxies serving traffic globally. These services run 24/7 because that's the whole point — automation that works while you don't.

But when something breaks — a container crashes, an agent pipeline stalls, a resource spike cascades — you need to respond *now*. Not after you drive home. Not after you open your laptop. Now.

And you're not at your desk. You're commuting. At dinner. In a meeting. Traveling. Sleeping.

Your options:
1. SSH from your phone (fat-finger your passphrase three times, squint at truncated output)
2. Open Portainer on mobile Safari (pinch-zoom through a desktop UI on a 6-inch screen)
3. Wait until you get to your laptop (while your automation is down and your clients are affected)

**None of these are acceptable when your infrastructure runs autonomously.**

Portainer, Rancher, and similar tools are excellent — but they were built for a world where you sit at a monitor. That's not how infrastructure works anymore.

So I built **Lagoon Cockpit**.

## What It Is

Lagoon Cockpit is an open-source, mobile-native command center for Docker infrastructure. It has three parts:

1. **A lightweight API agent** (`cockpit-api`) — a Docker container that runs on your server and talks to the Docker Engine via the unix socket
2. **A native mobile app** — built with Expo/React Native, designed for phone screens with biometric lock
3. **A CLI** — 25+ commands for terminal workflows (`npx lagoon-cockpit-cli`)

```
Phone (Expo app) / CLI / PWA
  │ HTTPS
  │
[cockpit-api]  ← Docker container on your server (~22MB RAM)
  ├── Docker Engine API (/var/run/docker.sock)
  ├── /proc (system metrics)
  ├── SQLite (users, audit log)
  └── Prometheus export (37 metrics at /metrics)
```

The API container uses ~22MB of RAM and 0% CPU at idle. It's not another heavy monitoring platform — it's a thin layer between your phone and your Docker daemon.

## What You Can Actually Do From Your Phone

### Real-Time Dashboard
One screen shows you everything: CPU, RAM, disk usage, container count, stack health, and recent alerts. Auto-refresh via SSE every 15 seconds.

### Container Lifecycle
Browse all containers with status indicators. Tap into any container to see:
- Live CPU and memory stats
- Network I/O and PID count
- Full log output with regex search
- Exec into containers with security-hardened command whitelist
- Start / Stop / Restart with confirmation dialogs

### Docker Compose Stack Management
Containers are automatically grouped by their `com.docker.compose.project` label — no config needed. Start, stop, or restart an entire stack at once. One tap to bring your automation pipeline back online.

### Visual System Map
See your entire Docker topology at a glance — stacks grouped, networks connected, health color-coded. Tap any node to manage it.

### SSL & Endpoint Monitoring
The API probes your configured domains and endpoints on request:
- HTTP status codes and response times
- SSL certificate expiry (days remaining, color-coded)

### Custom Alerts + Webhooks
Set alert rules (CPU > 90% for 5 minutes → push notification). Integrate with Slack, Discord, or n8n for automated incident response.

### Scheduled Actions
Set cron schedules for container actions — restart your memory-leaky service every Sunday at 3 AM without waking up.

### Security
- **No public ports** — access via Tailscale, VPN, or reverse proxy with IP restriction
- **Dual auth**: API key mode (single admin) or multi-user mode with roles (admin/operator/viewer)
- **Biometric lock** on the mobile app (fingerprint/face)
- **JWT with refresh token rotation**, rate limiting, audit logging
- **2 independent security audits** — 35 findings, all fixed before release
- All container IDs validated to prevent path traversal on the Docker socket

### Multi-Server
Add your production, staging, and dev servers. Switch between them from any screen.

## How the Docker API Client Works

Instead of shelling out to `docker ps` and parsing text (fragile, slow, blocks the event loop), the API talks directly to the Docker Engine REST API via the unix socket:

```javascript
const http = require("http");

function dockerAPI(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      socketPath: "/var/run/docker.sock",
      path: `/v1.43${path}`,
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
    }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString();
        resolve(JSON.parse(raw));
      });
    });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// List all containers
const containers = await dockerAPI("GET", "/containers/json?all=true");

// Get one-shot stats
const stats = await dockerAPI("GET", `/containers/${id}/stats?stream=false`);

// Restart a container
await dockerAPI("POST", `/containers/${id}/restart`);
```

Zero dependencies for the Docker client. Node.js's built-in `http` module handles unix sockets natively.

## Stack Discovery Without Config

Docker Compose automatically labels containers with `com.docker.compose.project`. We use this to group containers into stacks without needing access to compose files:

```javascript
const containers = await dockerAPI("GET", "/containers/json?all=true");
const stacks = {};
for (const c of containers) {
  const project = c.Labels["com.docker.compose.project"];
  if (project) {
    (stacks[project] ??= []).push(c);
  }
}
```

This means the API doesn't need to mount your compose files — it discovers stacks purely from Docker labels.

## Quick Start

### Deploy the API (one command)

```bash
docker run -d \
  -e API_KEY=your-key \
  -v /var/run/docker.sock:/var/run/docker.sock \
  ghcr.io/lagoon-tech-systems/cockpit:latest
```

Or with Docker Compose for production setups:

```bash
git clone https://github.com/Lagoon-Tech-Systems/lagoon-cockpit.git
cd lagoon-cockpit/packages/api
cp .env.example .env
# Edit .env: set API_KEY, JWT_SECRET, SERVER_NAME
docker compose up -d
```

The container joins your Docker network with no public ports. Access it via your VPN or reverse proxy.

### Run the Mobile App

```bash
cd lagoon-cockpit/packages/app
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone. Add your server URL + API key, and you're in.

### Or Use the CLI

```bash
npx lagoon-cockpit-cli overview
npx lagoon-cockpit-cli ps
npx lagoon-cockpit-cli logs my-container
```

## What's Next

- [ ] Terminal/exec into containers from the app
- [ ] Docker image pull/update
- [ ] Resource usage graphs (historical)
- [ ] App Store / Play Store release

## Try It

GitHub: [github.com/Lagoon-Tech-Systems/lagoon-cockpit](https://github.com/Lagoon-Tech-Systems/lagoon-cockpit)

AGPL-3.0 licensed. Stars, issues, and PRs welcome.

Your agents run 24/7. Now you can manage them from anywhere.

---

*Built by [Lagoon Tech Systems](https://lagoontechsystems.com) — we build digital infrastructure for businesses in West Africa.*
