const { timingSafeEqual, secureRandom, sha256, hmacSha256, generateId } = require("../src/security/crypto");

describe("Security Crypto Utilities", () => {
  test("timingSafeEqual returns true for matching strings", () => {
    expect(timingSafeEqual("abc123", "abc123")).toBe(true);
  });

  test("timingSafeEqual returns false for different strings", () => {
    expect(timingSafeEqual("abc123", "abc124")).toBe(false);
  });

  test("timingSafeEqual returns false for different lengths", () => {
    expect(timingSafeEqual("short", "much longer string")).toBe(false);
  });

  test("timingSafeEqual handles non-strings", () => {
    expect(timingSafeEqual(null, "abc")).toBe(false);
    expect(timingSafeEqual("abc", undefined)).toBe(false);
    expect(timingSafeEqual(123, 123)).toBe(false);
  });

  test("secureRandom generates hex strings of correct length", () => {
    const r16 = secureRandom(16);
    expect(r16).toHaveLength(32); // 16 bytes = 32 hex chars
    const r32 = secureRandom(32);
    expect(r32).toHaveLength(64);
    expect(/^[a-f0-9]+$/.test(r32)).toBe(true);
  });

  test("secureRandom generates unique values", () => {
    const a = secureRandom();
    const b = secureRandom();
    expect(a).not.toBe(b);
  });

  test("sha256 produces consistent hashes", () => {
    const hash1 = sha256("hello");
    const hash2 = sha256("hello");
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  test("sha256 produces different hashes for different inputs", () => {
    expect(sha256("hello")).not.toBe(sha256("world"));
  });

  test("hmacSha256 produces consistent HMACs", () => {
    const hmac1 = hmacSha256("key", "data");
    const hmac2 = hmacSha256("key", "data");
    expect(hmac1).toBe(hmac2);
    expect(hmac1).toHaveLength(64);
  });

  test("hmacSha256 varies with key", () => {
    expect(hmacSha256("key1", "data")).not.toBe(hmacSha256("key2", "data"));
  });

  test("generateId returns UUID format", () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe("Request Validator", () => {
  const { validateBody } = require("../src/security/request-validator");

  test("validates authToken schema", () => {
    const middleware = validateBody("authToken");
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    // Valid
    middleware({ body: { apiKey: "test-key" } }, res, next);
    expect(next).toHaveBeenCalled();

    // Invalid — missing apiKey
    next.mockClear();
    middleware({ body: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test("rejects non-object body", () => {
    const middleware = validateBody("authToken");
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    middleware({ body: null }, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("throws for unknown schema", () => {
    expect(() => validateBody("nonexistent")).toThrow("Unknown validation schema");
  });
});
