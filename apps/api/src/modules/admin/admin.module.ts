import { Module } from "@nestjs/common";
import { RolesGuard } from "../../common/roles";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { VenuesModule } from "../venues/venues.module";
import { AuthModule } from "../auth/auth.module";
import { MediaModule } from "../media/media.module";

@Module({
  imports: [AuthModule, VenuesModule, MediaModule],
  controllers: [AdminController],
  providers: [AdminService, RolesGuard],
})
export class AdminModule {}
