import { Module } from "@nestjs/common";
import { RolesGuard } from "../../common/roles";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { VenuesModule } from "../venues/venues.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule, VenuesModule],
  controllers: [AdminController],
  providers: [AdminService, RolesGuard],
})
export class AdminModule {}
