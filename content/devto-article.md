---
title: "Your AI Agents Run 24/7. Your Laptop Doesn't. I Built a Mobile Docker Dashboard."
published: false
description: "Lagoon Cockpit: an open-source mobile-native app for managing Docker containers, Compose stacks, and server health from your phone — built for the age of always-on automation."
tags: docker, devops, reactnative, opensource
cover_image: ""
---

# Your AI Agents Run 24/7. Your Laptop Doesn't. I Built a Mobile Docker Dashboard.

It's 2026. Your infrastructure doesn't sleep.

You've got n8n pipelines processing data around the clock. AI agents running inference jobs. Deployment managers watching your CI/CD. Scheduled backups, monitoring bots, reverse proxies serving traffic globally. These services run 24/7 because that's the whole point — automation that works while you don't.

But when something breaks — a container crashes, an agent pipeline stalls, a resource spike cascades — you need to respond *now*. Not after you drive home. Not after you open your laptop. Now.

And you're not at your desk. You're commuting. At dinner. In a meeting. Traveling. Sleeping.

## The problem

Your options when something goes down:
1. SSH from your phone (fat-finger your passphrase three times, squint at truncated output)
2. Open Portainer on mobile Safari (pinch-zoom through a desktop UI on a 6-inch screen)
3. Wait until you get to your laptop (while your automation is down and your clients are affected)

**None of these are acceptable when your infrastructure runs autonomously.**

Portainer, Rancher, and similar tools are excellent — but they were built for a world where you sit at a monitor. That's not how infrastructure works anymore.

So I built **Lagoon Cockpit**.

## The architecture

**Lagoon Cockpit** is three things:

### 1. A lightweight API agent (per server)

A single Express.js container that talks to the Docker Engine API via the unix socket. No shell commands, no Docker CLI — just raw HTTP against `/var/run/docker.sock`.

```js
function dockerAPI(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      socketPath: '/var/run/docker.sock',
      path: `/v1.43${path}`,
      method,
    };
    const req = http.request(opts, (res) => {
      // parse JSON response
    });
    req.end();
  });
}
```

This is significantly faster and more reliable than spawning `docker ps` and parsing text output. You get structured JSON with all container metadata, stats, and logs.

**Stack discovery** uses Docker labels — no compose files needed:

```js
const containers = await dockerAPI('GET', '/containers/json?all=true');
const stacks = {};
for (const c of containers) {
  const project = c.Labels['com.docker.compose.project'];
  if (project) (stacks[project] ??= []).push(c);
}
```

Every container created by `docker compose` gets a `com.docker.compose.project` label. Group by that, and you've got stacks.

### 2. An Expo React Native mobile app

Five tabs: Overview, Containers, Stacks, Status, Alerts.

The app connects to any number of Cockpit API instances — add your production VPS, staging server, and dev box. Switch between them with a tap.

**Real-time updates** via Server-Sent Events (SSE). The API broadcasts system metrics and container state every 15 seconds. SSE is simpler than WebSocket, works over standard HTTP, and auto-reconnects on mobile network changes.

### 3. A CLI companion

25+ commands for terminal workflows: `npx lagoon-cockpit-cli ps`, `cockpit logs`, `cockpit exec` — everything the mobile app does, from your terminal.

## What you can do from your phone

- **Real-time dashboard** — CPU, RAM, disk, container count, stack health, alerts
- **Container lifecycle** — start/stop/restart, logs with regex search, exec with command whitelist
- **Compose stacks** — bring entire pipelines up/down with one tap
- **Visual system map** — see your Docker topology, tap any node to manage
- **SSL & endpoint monitoring** — cert expiry, response times, health checks
- **Custom alert rules** — CPU > 90% for 5 min → push notification
- **Scheduled cron actions** — restart that leaky container every Sunday at 3 AM
- **Webhook integrations** — Slack, Discord, n8n for automated incident response
- **Prometheus export** — 37 metrics at `/metrics` for Grafana dashboards

## The security model

This is the part that kept me up at night. You're exposing Docker socket control over a network. Two independent security audits (35 findings, all fixed) shaped these decisions:

**No public ports.** The API container joins your reverse proxy network but exposes zero ports to the internet. Access it via Tailscale, WireGuard, or an IP-restricted reverse proxy.

**Container ID validation.** Without this, a path traversal via crafted container IDs could hit arbitrary Docker Engine API endpoints. Every ID is validated against a strict regex.

**Self-protection.** The API detects its own container ID at startup and refuses to stop or restart itself.

**Dual auth modes:**
- **API key mode**: Single admin, one key. Simple for solo operators.
- **Multi-user mode**: SQLite-backed user accounts with three roles (viewer/operator/admin).

**JWT with refresh token rotation**: 15-minute access tokens, 7-day refresh tokens. Rate limiting: 5 failed attempts = 15-minute lockout.

**Exec whitelist**: Only pre-approved commands, argv execution, shell metacharacter blocking.

## Deployment

One command:

```bash
docker run -d \
  -e API_KEY=your-key \
  -v /var/run/docker.sock:/var/run/docker.sock \
  ghcr.io/lagoon-tech-systems/cockpit:latest
```

~22MB RAM. 0% CPU at idle. Connect from the mobile app or CLI and you're managing your infrastructure from your pocket.

## Try it

AGPL-3.0 licensed, open-source: [github.com/Lagoon-Tech-Systems/lagoon-cockpit](https://github.com/Lagoon-Tech-Systems/lagoon-cockpit)

Your agents run 24/7. Now you can manage them from anywhere.

---

*Built by [Lagoon Tech Systems](https://lagoontechsystems.com) in Abidjan, Côte d'Ivoire.*
