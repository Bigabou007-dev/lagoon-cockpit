const { hasFeature, availableFeatures, defaultLimits, CE_LIMITS, PRO_LIMITS } = require("../src/edition/features");

describe("Edition Features", () => {
  test("CE has basic container features", () => {
    expect(hasFeature("ce", "containers")).toBe(true);
    expect(hasFeature("ce", "stacks")).toBe(true);
    expect(hasFeature("ce", "system_metrics")).toBe(true);
    expect(hasFeature("ce", "sse_stream")).toBe(true);
  });

  test("CE does not have Pro features", () => {
    expect(hasFeature("ce", "incidents")).toBe(false);
    expect(hasFeature("ce", "remediation")).toBe(false);
    expect(hasFeature("ce", "status_pages")).toBe(false);
    expect(hasFeature("ce", "sso_saml")).toBe(false);
  });

  test("Pro has CE + Pro features", () => {
    expect(hasFeature("pro", "containers")).toBe(true);
    expect(hasFeature("pro", "incidents")).toBe(true);
    expect(hasFeature("pro", "remediation")).toBe(true);
    expect(hasFeature("pro", "uptime_monitoring")).toBe(true);
  });

  test("Pro does not have Enterprise features", () => {
    expect(hasFeature("pro", "sso_saml")).toBe(false);
    expect(hasFeature("pro", "white_label")).toBe(false);
  });

  test("Enterprise has everything except private-only", () => {
    expect(hasFeature("enterprise", "containers")).toBe(true);
    expect(hasFeature("enterprise", "incidents")).toBe(true);
    expect(hasFeature("enterprise", "sso_saml")).toBe(true);
    expect(hasFeature("enterprise", "white_label")).toBe(true);
  });

  test("Private has everything", () => {
    expect(hasFeature("private", "containers")).toBe(true);
    expect(hasFeature("private", "incidents")).toBe(true);
    expect(hasFeature("private", "sso_saml")).toBe(true);
    expect(hasFeature("private", "white_label")).toBe(true);
  });

  test("Unknown feature returns false", () => {
    expect(hasFeature("private", "nonexistent_feature")).toBe(false);
    expect(hasFeature("ce", "")).toBe(false);
  });

  test("CE limits are correct", () => {
    const limits = defaultLimits("ce");
    expect(limits.servers).toBe(3);
    expect(limits.alertRules).toBe(5);
    expect(limits.users).toBe(1);
    expect(limits.webhooks).toBe(3);
    expect(limits.integrations).toBe(2);
  });

  test("Pro limits are higher", () => {
    const limits = defaultLimits("pro");
    expect(limits.servers).toBe(20);
    expect(limits.alertRules).toBe(100);
    expect(limits.integrations).toBe(10);
  });

  test("Private/Enterprise have no limits", () => {
    const privLimits = defaultLimits("private");
    const entLimits = defaultLimits("enterprise");
    expect(Object.keys(privLimits)).toHaveLength(0);
    expect(Object.keys(entLimits)).toHaveLength(0);
  });

  test("availableFeatures returns correct count per edition", () => {
    const ceFeatures = availableFeatures("ce");
    const proFeatures = availableFeatures("pro");
    const entFeatures = availableFeatures("enterprise");
    expect(ceFeatures.length).toBeGreaterThan(0);
    expect(proFeatures.length).toBeGreaterThan(ceFeatures.length);
    expect(entFeatures.length).toBeGreaterThan(proFeatures.length);
  });
});
