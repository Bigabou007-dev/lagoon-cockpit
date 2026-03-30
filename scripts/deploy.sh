#!/usr/bin/env bash
# Lagoon Cockpit — Zero-downtime deploy with automatic rollback
# Usage:
#   ./scripts/deploy.sh              # Build + deploy (blue-green)
#   ./scripts/deploy.sh --rollback   # Rollback to previous image
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/docker-compose.yml"
SERVICE="cockpit-api"
CONTAINER="lagoon_cockpit_api"
IMAGE="ghcr.io/lagoon-tech-systems/cockpit"
HEALTH_URL="http://localhost:3000/health"
HEALTH_TIMEOUT=60
BACKUP_TAG="rollback"

log() { echo "[deploy] $(date '+%H:%M:%S') $*"; }
die() { echo "[deploy] ERROR: $*" >&2; exit 1; }

# ── Pre-flight checks ─────────────────────────────────────
command -v docker >/dev/null || die "docker not found"
[ -f "$COMPOSE_FILE" ] || die "docker-compose.yml not found at $COMPOSE_FILE"

wait_healthy() {
  local url="$1" timeout="$2" start elapsed
  start=$(date +%s)
  log "Waiting up to ${timeout}s for health check..."
  while true; do
    elapsed=$(( $(date +%s) - start ))
    if [ "$elapsed" -ge "$timeout" ]; then
      return 1
    fi
    if wget -qO- "$url" 2>/dev/null | grep -q '"status":"ok"'; then
      log "Health check passed (${elapsed}s)"
      return 0
    fi
    sleep 2
  done
}

# ── Rollback mode ─────────────────────────────────────────
if [ "${1:-}" = "--rollback" ]; then
  log "Rolling back to previous image ($IMAGE:$BACKUP_TAG)..."

  if ! docker image inspect "$IMAGE:$BACKUP_TAG" >/dev/null 2>&1; then
    die "No rollback image found. Was a deploy ever run?"
  fi

  # Tag the rollback image as :latest so compose picks it up
  docker tag "$IMAGE:$BACKUP_TAG" "$IMAGE:latest"

  # Recreate the container with the old image
  docker compose -f "$COMPOSE_FILE" up -d --no-build "$SERVICE"

  if wait_healthy "$HEALTH_URL" "$HEALTH_TIMEOUT"; then
    log "Rollback successful"
    exit 0
  else
    die "Rollback failed — container unhealthy. Manual intervention required."
  fi
fi

# ── Deploy mode ───────────────────────────────────────────
log "Starting zero-downtime deploy..."

# 1. Save current image as rollback tag (if container exists)
if docker inspect "$CONTAINER" >/dev/null 2>&1; then
  CURRENT_IMAGE=$(docker inspect --format='{{.Image}}' "$CONTAINER")
  log "Saving current image as $IMAGE:$BACKUP_TAG"
  docker tag "$CURRENT_IMAGE" "$IMAGE:$BACKUP_TAG" 2>/dev/null || true
fi

# 2. Pull latest code (if in a git repo)
if [ -d "$REPO_ROOT/.git" ]; then
  log "Pulling latest changes..."
  git -C "$REPO_ROOT" pull --ff-only || log "Git pull skipped (not on tracking branch or conflicts)"
fi

# 3. Build the new image
log "Building new image..."
docker compose -f "$COMPOSE_FILE" build --no-cache "$SERVICE"

# 4. Stop old container gracefully (SIGTERM → 10s grace)
log "Stopping old container (graceful)..."
docker compose -f "$COMPOSE_FILE" stop -t 10 "$SERVICE" 2>/dev/null || true

# 5. Start new container
log "Starting new container..."
docker compose -f "$COMPOSE_FILE" up -d "$SERVICE"

# 6. Wait for health check
if wait_healthy "$HEALTH_URL" "$HEALTH_TIMEOUT"; then
  log "Deploy successful"

  # Clean up dangling images from the build
  docker image prune -f --filter "label=org.opencontainers.image.title=Lagoon Cockpit API" 2>/dev/null || true
  exit 0
fi

# 7. Auto-rollback on failure
log "New container unhealthy — auto-rolling back..."
docker compose -f "$COMPOSE_FILE" stop -t 5 "$SERVICE" 2>/dev/null || true

if docker image inspect "$IMAGE:$BACKUP_TAG" >/dev/null 2>&1; then
  docker tag "$IMAGE:$BACKUP_TAG" "$IMAGE:latest"
  docker compose -f "$COMPOSE_FILE" up -d --no-build "$SERVICE"

  if wait_healthy "$HEALTH_URL" "$HEALTH_TIMEOUT"; then
    log "Auto-rollback successful. Investigate the failed build."
    exit 1
  fi
fi

die "Auto-rollback failed. Manual intervention required."
