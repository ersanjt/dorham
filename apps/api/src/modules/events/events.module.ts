import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MediaModule } from "../media/media.module";
import { UsersModule } from "../users/users.module";
import { RolesGuard } from "../../common/roles";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";

@Module({
  imports: [AuthModule, MediaModule, UsersModule],
  controllers: [EventsController],
  providers: [EventsService, RolesGuard],
})
export class EventsModule {}
