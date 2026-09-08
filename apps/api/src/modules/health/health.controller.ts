import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../redis/redis.service";

@ApiTags("health")
@SkipThrottle()
@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  live() {
    return { data: { ok: true, service: "dorham-api" } };
  }

  @Get("ready")
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    let redis = false;
    try {
      if (this.redis.status !== "ready") {
        await this.redis.connect();
      }
      await this.redis.ping();
      redis = true;
    } catch {
      redis = false;
    }
    return { data: { ok: true, postgres: true, redis } };
  }
}
