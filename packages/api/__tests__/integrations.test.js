const { BaseAdapter, createMetric, createEvent, createAlert } = require("../src/integrations/adapter");
const { registerAdapter, getAdapterClass, listAdapterTypes, hasAdapter, createAdapterInstance } = require("../src/integrations/registry");

describe("BaseAdapter", () => {
  test("throws on unimplemented methods", async () => {
    const adapter = new BaseAdapter({});
    await expect(adapter.validateConfig()).rejects.toThrow("not implemented");
    await expect(adapter.testConnection()).rejects.toThrow("not implemented");
    await expect(adapter.pull()).rejects.toThrow("not implemented");
  });

  test("static configSchema returns empty schema", () => {
    const schema = BaseAdapter.configSchema();
    expect(schema.type).toBe("object");
    expect(schema.properties).toEqual({});
  });
});

describe("Normalized Data Helpers", () => {
  test("createMetric produces correct structure", () => {
    const m = createMetric("test", "int-1", "cpu_usage", 75.5, "percent", { host: "web-1" });
    expect(m.source).toBe("test");
    expect(m.type).toBe("metric");
    expect(m.metric.name).toBe("cpu_usage");
    expect(m.metric.value).toBe(75.5);
    expect(m.metric.unit).toBe("percent");
    expect(m.metric.labels.host).toBe("web-1");
    expect(m.timestamp).toBeDefined();
  });

  test("createEvent produces correct structure", () => {
    const e = createEvent("test", "int-1", "Deploy done", "info", "v2.0 deployed");
    expect(e.type).toBe("event");
    expect(e.event.title).toBe("Deploy done");
    expect(e.event.severity).toBe("info");
  });

  test("createAlert produces correct structure", () => {
    const a = createAlert("test", "int-1", "High CPU", "critical", "firing", "http://example.com");
    expect(a.type).toBe("alert");
    expect(a.alert.title).toBe("High CPU");
    expect(a.alert.status).toBe("firing");
    expect(a.alert.source_url).toBe("http://example.com");
  });
});

describe("Adapter Registry", () => {
  class TestAdapter extends BaseAdapter {
    constructor(config) {
      super(config);
      this.name = "test-adapter";
      this.displayName = "Test Adapter";
    }
    async validateConfig() { return { valid: true }; }
    async testConnection() { return { ok: true, message: "OK" }; }
    async pull() { return []; }
    static configSchema() {
      return { type: "object", properties: { url: { type: "string" } }, required: ["url"] };
    }
  }

  test("registerAdapter and hasAdapter", () => {
    registerAdapter("test-adapter", TestAdapter);
    expect(hasAdapter("test-adapter")).toBe(true);
    expect(hasAdapter("nonexistent")).toBe(false);
  });

  test("getAdapterClass returns class", () => {
    const cls = getAdapterClass("test-adapter");
    expect(cls).toBe(TestAdapter);
  });

  test("createAdapterInstance creates instance", () => {
    const instance = createAdapterInstance("test-adapter", { url: "http://test" });
    expect(instance).toBeInstanceOf(TestAdapter);
    expect(instance.name).toBe("test-adapter");
  });

  test("listAdapterTypes includes registered adapters", () => {
    const types = listAdapterTypes();
    const testType = types.find((t) => t.name === "test-adapter");
    expect(testType).toBeDefined();
    expect(testType.displayName).toBe("Test Adapter");
    expect(testType.configSchema.required).toContain("url");
  });
});
