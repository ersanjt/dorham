import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { EventsModule } from "./modules/events/events.module";
import { HealthModule } from "./modules/health/health.module";
import { MediaModule } from "./modules/media/media.module";
import { TrustModule } from "./modules/trust/trust.module";
import { VerificationModule } from "./modules/verification/verification.module";
import { VenuesModule } from "./modules/venues/venues.module";
import { FeedModule } from "./modules/feed/feed.module";
import { MailModule } from "./modules/mail/mail.module";
import { AdminModule } from "./modules/admin/admin.module";

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        { name: "default", ttl: 60_000, limit: 120 },
        { name: "auth", ttl: 60_000, limit: 20 },
      ],
    }),
    PrismaModule,
    RedisModule,
    MailModule,
    AuthModule,
    AdminModule,
    UsersModule,
    EventsModule,
    HealthModule,
    MediaModule,
    TrustModule,
    VerificationModule,
    VenuesModule,
    FeedModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
