import RedisMock from "ioredis-mock";

import { RedisAdapter } from "./redis-adapter";

describe("RedisAdapter (mocked)", () => {
  let adapter: RedisAdapter;
  let redisMock: any;

  beforeAll(() => {
    redisMock = new RedisMock();
    adapter = new RedisAdapter("mock://", redisMock);
  });

  afterAll(async () => {
    // ioredis-mock does not need disconnect
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
