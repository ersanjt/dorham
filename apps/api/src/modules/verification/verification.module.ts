import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MediaModule } from "../media/media.module";
import { RolesGuard } from "../../common/roles";
import { VerificationController } from "./verification.controller";
import { VerificationService } from "./verification.service";

@Module({
  imports: [AuthModule, MediaModule],
  controllers: [VerificationController],
  providers: [VerificationService, RolesGuard],
})
export class VerificationModule {}
