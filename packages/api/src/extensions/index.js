const fs = require("fs");
const path = require("path");

const DEFAULT_EXTENSIONS_DIR = path.resolve(__dirname, "..", "..", "extensions");
const EXTENSIONS_DIR = process.env.EXTENSIONS_DIR
  ? path.resolve(process.env.EXTENSIONS_DIR)
  : DEFAULT_EXTENSIONS_DIR;

/**
 * Load all extensions from the extensions directory.
 * Each extension must export: { name, version, init(app, services) }
 *
 * Security:
 *   - EXTENSIONS_DIR must resolve to the default path or an absolute path
 *   - Symlinks are resolved and validated against the base directory
 *   - Extensions get a scoped router (force-prefixed to /api/ext/<name>)
 *   - Extensions do NOT get raw db or app access
 *
 * Extensions are loaded in alphabetical order by directory name.
 */
function loadExtensions(app, db, services) {
  // Validate extensions directory is safe
  if (EXTENSIONS_DIR !== DEFAULT_EXTENSIONS_DIR) {
    console.warn(`[EXT] Custom EXTENSIONS_DIR: ${EXTENSIONS_DIR}`);
  }

  if (!fs.existsSync(EXTENSIONS_DIR)) {
    return [];
  }

  // Resolve real path to prevent symlink escapes
  let realDir;
  try {
    realDir = fs.realpathSync(EXTENSIONS_DIR);
  } catch (err) {
    console.error(`[EXT] Cannot resolve extensions directory: ${err.message}`);
    return [];
  }

  const loaded = [];
  let entries;

  try {
    entries = fs.readdirSync(realDir).sort();
  } catch (err) {
    console.error(`[EXT] Failed to read extensions directory: ${err.message}`);
    return [];
  }

  for (const entry of entries) {
    const extPath = path.join(realDir, entry);

    try {
      // Resolve real path to catch symlinks pointing outside extensions dir
      const realExtPath = fs.realpathSync(extPath);
      if (!realExtPath.startsWith(realDir + path.sep) && realExtPath !== realDir) {
        console.warn(`[EXT] ${entry}: symlink escapes extensions directory, skipping`);
        continue;
      }

      const stat = fs.statSync(realExtPath);
      if (!stat.isDirectory()) continue;

      // Check for package.json or index.js
      const hasPackageJson = fs.existsSync(path.join(realExtPath, "package.json"));
      const hasIndex = fs.existsSync(path.join(realExtPath, "index.js")) ||
                       fs.existsSync(path.join(realExtPath, "src", "index.js"));

      if (!hasPackageJson && !hasIndex) {
        console.warn(`[EXT] ${entry}: no package.json or index.js, skipping`);
        continue;
      }

      const ext = require(realExtPath);

      if (typeof ext.init !== "function") {
        console.warn(`[EXT] ${entry}: missing init() function, skipping`);
        continue;
      }

      // Create a scoped services object (no raw db handle)
      const express = require("express");
      const extRouter = express.Router();
      const extName = ext.name || entry;

      const scopedServices = {
        broadcast: services.broadcast,
        sendPushNotification: services.sendPushNotification,
        auditLog: services.auditLog,
        alertEngine: services.alertEngine,
        metricsHistory: services.metricsHistory,
        webhooks: services.webhooks,
        db: createScopedDb(db, extName),
      };

      ext.init(extRouter, scopedServices);

      // Mount extension router under /api/ext/<name>
      app.use(`/api/ext/${extName}`, extRouter);

      const info = { name: extName, version: ext.version || "0.0.0" };
      loaded.push(info);
      console.log(`[EXT] Loaded: ${info.name} v${info.version} -> /api/ext/${extName}`);
    } catch (err) {
      console.error(`[EXT] Failed to load ${entry}: ${err.message}`);
    }
  }

  if (loaded.length > 0) {
    console.log(`[EXT] ${loaded.length} extension(s) loaded`);
  }

  return loaded;
}

/**
 * Create a scoped DB interface for extensions.
 * Extensions can only create/access tables prefixed with ext_<name>_.
 */
function createScopedDb(db, extName) {
  const prefix = `ext_${extName.replace(/[^a-z0-9]/gi, "_")}_`;

  return {
    exec(sql) {
      validateExtSql(sql, prefix);
      return db.exec(sql);
    },
    prepare(sql) {
      validateExtSql(sql, prefix);
      return db.prepare(sql);
    },
  };
}

function validateExtSql(sql, prefix) {
  // Allow CREATE TABLE, INSERT, SELECT, UPDATE, DELETE only on ext_ prefixed tables
  const tablePattern = /(?:FROM|INTO|UPDATE|TABLE(?:\s+IF\s+NOT\s+EXISTS)?)\s+(\w+)/gi;
  let match;
  while ((match = tablePattern.exec(sql)) !== null) {
    const tableName = match[1].toLowerCase();
    if (!tableName.startsWith(prefix.toLowerCase()) && tableName !== "sqlite_master") {
      throw new Error(`Extension "${prefix.slice(4, -1)}" cannot access table "${match[1]}". Use "${prefix}" prefix.`);
    }
  }
}

module.exports = { loadExtensions };
