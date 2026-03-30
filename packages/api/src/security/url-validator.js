const { URL } = require("url");
const dns = require("dns");
const { promisify } = require("util");

const dnsResolve = promisify(dns.resolve4);

/**
 * SSRF protection — validates URLs before server-side fetching.
 * Blocks private/internal IP ranges, localhost, link-local, and metadata endpoints.
 * Resolves DNS to catch rebinding attacks.
 */

const BLOCKED_RANGES = [
  { prefix: "127.", label: "loopback" },
  { prefix: "10.", label: "private (10.0.0.0/8)" },
  { prefix: "0.", label: "unspecified" },
  { prefix: "169.254.", label: "link-local" },
];

const BLOCKED_RANGES_172 = { min: 16, max: 31 }; // 172.16.0.0/12

function isPrivateIp(ip) {
  if (ip === "::1" || ip === "0.0.0.0") return true;
  if (ip.startsWith("fd") || ip.startsWith("fe80:")) return true;

  for (const range of BLOCKED_RANGES) {
    if (ip.startsWith(range.prefix)) return true;
  }

  if (ip.startsWith("192.168.")) return true;

  if (ip.startsWith("172.")) {
    const second = parseInt(ip.split(".")[1], 10);
    if (second >= BLOCKED_RANGES_172.min && second <= BLOCKED_RANGES_172.max) return true;
  }

  return false;
}

/**
 * Validate a URL for safe server-side fetching.
 * @param {string} urlStr - URL to validate
 * @param {object} [opts] - Options
 * @param {boolean} [opts.resolveDns=true] - Resolve DNS and check IP
 * @returns {Promise<{ safe: boolean, error?: string }>}
 */
async function validateFetchUrl(urlStr, opts = {}) {
  const resolveDns = opts.resolveDns !== false;

  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch {
    return { safe: false, error: "Invalid URL" };
  }

  // Only allow http/https
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { safe: false, error: `Blocked protocol: ${parsed.protocol}` };
  }

  // Block localhost hostnames
  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]") {
    return { safe: false, error: "Blocked: localhost" };
  }

  // Block cloud metadata endpoints
  if (hostname === "metadata.google.internal" || hostname === "169.254.169.254") {
    return { safe: false, error: "Blocked: cloud metadata endpoint" };
  }

  // Check if hostname is a raw IP
  if (isPrivateIp(hostname)) {
    return { safe: false, error: "Blocked: private/internal IP address" };
  }

  // DNS resolution check (catches DNS rebinding)
  if (resolveDns && !isIpAddress(hostname)) {
    try {
      const addresses = await dnsResolve(hostname);
      for (const addr of addresses) {
        if (isPrivateIp(addr)) {
          return { safe: false, error: `Blocked: ${hostname} resolves to private IP ${addr}` };
        }
      }
    } catch {
      return { safe: false, error: `DNS resolution failed for ${hostname}` };
    }
  }

  return { safe: true };
}

function isIpAddress(str) {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(str) || str.includes(":");
}

/**
 * Safe fetch wrapper — validates URL before making the request.
 * Drop-in replacement for fetch() with SSRF protection.
 */
async function safeFetch(urlStr, options = {}) {
  const result = await validateFetchUrl(urlStr);
  if (!result.safe) {
    throw new Error(`SSRF blocked: ${result.error}`);
  }
  return fetch(urlStr, options);
}

module.exports = { validateFetchUrl, safeFetch, isPrivateIp };
