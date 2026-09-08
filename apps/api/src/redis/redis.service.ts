import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import { loadEnv } from "../config/env";

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor() {
    super(loadEnv().REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true });
    this.on("error", () => {
      // Redis is optional in local Windows setup. Rate-limit still works in memory.
    });
  }

  async onModuleDestroy() {
    try {
      await this.quit();
    } catch {
      this.disconnect();
    }
  }
}
