import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MediaModule } from "../media/media.module";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [AuthModule, MediaModule],
  controllers: [UsersController],
  providers: [UsersService, NotificationsService],
  exports: [UsersService, NotificationsService],
})
export class UsersModule {}
