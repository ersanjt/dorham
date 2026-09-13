import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MediaModule } from "../media/media.module";
import { UsersModule } from "../users/users.module";
import { VenuesController } from "./venues.controller";
import { MapsController } from "./maps.controller";
import { VenuesService } from "./venues.service";

@Module({
  imports: [AuthModule, MediaModule, UsersModule],
  controllers: [VenuesController, MapsController],
  providers: [VenuesService],
  exports: [VenuesService],
})
export class VenuesModule {}
