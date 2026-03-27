const express = require("express");
const router = express.Router();

const networks = require("../docker/networks");
const volumes = require("../docker/volumes");
const images = require("../docker/images");
const { requireAuth, requireRole } = require("../auth/middleware");
const { auditLog } = require("../db/sqlite");
const { validateVolumeName, validateImageId, safeError } = require("../middleware");

// ── Docker Networks ──────────────────────────────────────
router.get("/api/networks", requireAuth, async (_req, res) => {
  try {
    const list = await networks.listNetworks();
    res.json({ networks: list });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

// ── Docker Volumes ───────────────────────────────────────
router.get("/api/volumes", requireAuth, async (_req, res) => {
  try {
    const list = await volumes.listVolumes();
    res.json({ volumes: list });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

router.delete("/api/volumes/:name", requireAuth, requireRole("admin"), validateVolumeName, async (req, res) => {
  try {
    await volumes.removeVolume(req.params.name);
    auditLog(req.user.id, "volume.remove", req.params.name);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

// ── Docker Images ────────────────────────────────────────
router.get("/api/images", requireAuth, async (_req, res) => {
  try {
    const list = await images.listImages();
    res.json({ images: list });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

router.delete("/api/images/:id", requireAuth, requireRole("admin"), validateImageId, async (req, res) => {
  try {
    const result = await images.removeImage(req.params.id);
    auditLog(req.user.id, "image.remove", req.params.id);
    res.json({ ok: true, deleted: result });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

router.post("/api/images/prune", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const result = await images.pruneImages();
    auditLog(req.user.id, "image.prune", null, `Reclaimed: ${result.SpaceReclaimed || 0} bytes`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

module.exports = router;
