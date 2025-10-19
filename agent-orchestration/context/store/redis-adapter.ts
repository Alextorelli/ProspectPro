import { createClient, RedisClientType } from "redis";

export class RedisAdapter {
  private client: RedisClientType | any;

  constructor(redisUrl: string, client?: any) {
    if (client) {
      this.client = client;
    } else {
      this.client = createClient({ url: redisUrl });
      this.client.connect();
    }
  }

  async get(key: string) {
    return await this.client.get(key);
  }

  async set(key: string, value: any) {
    return await this.client.set(key, JSON.stringify(value));
  }

  async delete(key: string) {
    return await this.client.del(key);
  }

  async disconnect() {
    if (typeof this.client.disconnect === "function") {
      await this.client.disconnect();
    }
  }
}
