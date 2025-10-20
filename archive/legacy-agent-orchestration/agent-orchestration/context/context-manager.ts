import { RedisAdapter } from "./store/redis-adapter";

export class ContextManager {
  private redis: RedisAdapter;
  constructor(redisUrl: string) {
    this.redis = new RedisAdapter(redisUrl);
  }
  async get(key: string) {
    return await this.redis.get(key);
  }
  async set(key: string, value: any) {
    return await this.redis.set(key, value);
  }
  async delete(key: string) {
    return await this.redis.delete(key);
  }
  // Add schema enforcement and hooks as needed
}
