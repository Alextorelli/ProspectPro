const {
  ContextManager,
} = require("../../../agent-orchestration/context/context-manager.cjs");
const dataset = require("./fixture-dataset.json");

describe("ContextManager integration", () => {
  const context = new ContextManager("redis://localhost:6379");

  afterAll(async () => {
    for (const item of dataset) {
      await context.delete(item.key);
    }
    await context.redis.disconnect();
  });

  it("should set and get all fixture values", async () => {
    for (const item of dataset) {
      await context.set(item.key, item.value);
      const value = await context.get(item.key);
      expect(JSON.parse(value)).toEqual(item.value);
    }
  });
});
