import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MediaModule } from "../media/media.module";
import { FeedController } from "./feed.controller";
import { FeedService } from "./feed.service";

@Module({
  imports: [AuthModule, MediaModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
