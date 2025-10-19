import { RedisAdapter } from "./redis-adapter";

describe("RedisAdapter", () => {
  const redisUrl = "redis://localhost:6379";
  let adapter: RedisAdapter;

  beforeAll(() => {
    adapter = new RedisAdapter(redisUrl);
  });

  afterAll(async () => {
    await adapter.disconnect();
  });

  it("should set and get a value", async () => {
    await adapter.set("test-key", { foo: "bar" });
    const value = await adapter.get("test-key");
    expect(JSON.parse(value)).toEqual({ foo: "bar" });
  });

  it("should delete a value", async () => {
    await adapter.set("delete-key", "baz");
    await adapter.delete("delete-key");
    const value = await adapter.get("delete-key");
    expect(value).toBeNull();
  });
});
