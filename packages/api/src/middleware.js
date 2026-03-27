const os = require("os");

const SELF_HOSTNAME = os.hostname();

// ── Input Validation Patterns ────────────────────────────
const CONTAINER_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/;
const STACK_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,63}$/;
const VOLUME_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/;
const IMAGE_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.:\/@-]{0,255}$/;

function validateContainerId(req, res, next) {
  if (!CONTAINER_ID_RE.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid container ID" });
  }
  next();
}

function validateStackName(req, res, next) {
  if (!STACK_NAME_RE.test(req.params.name)) {
    return res.status(400).json({ error: "Invalid stack name" });
  }
  next();
}

function validateVolumeName(req, res, next) {
  if (!VOLUME_NAME_RE.test(req.params.name)) {
    return res.status(400).json({ error: "Invalid volume name" });
  }
  next();
}

function validateImageId(req, res, next) {
  if (!IMAGE_ID_RE.test(req.params.id) || req.params.id.includes("..")) {
    return res.status(400).json({ error: "Invalid image ID" });
  }
  next();
}

function blockSelfAction(req, res, next) {
  if (req.params.id === SELF_HOSTNAME) {
    return res.status(403).json({ error: "Cannot perform this action on the Cockpit API container" });
  }
  next();
}

function safeError(err, defaultMsg = "Internal server error") {
  console.error(`[API] ${defaultMsg}:`, err.message);
  return err.statusCode === 404 ? "Not found" : defaultMsg;
}

module.exports = {
  SELF_HOSTNAME,
  CONTAINER_ID_RE,
  STACK_NAME_RE,
  VOLUME_NAME_RE,
  IMAGE_ID_RE,
  validateContainerId,
  validateStackName,
  validateVolumeName,
  validateImageId,
  blockSelfAction,
  safeError,
};
