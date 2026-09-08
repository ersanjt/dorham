import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  attachMediaBodySchema,
  listVerificationsQuerySchema,
  reviewVerificationBodySchema,
} from "@dorham/shared";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { CurrentUser } from "../../common/current-user";
import { Roles, RolesGuard } from "../../common/roles";
import { ZodPipe } from "../../common/zod-pipe";
import { PrismaService } from "../../prisma/prisma.service";
import { assertActive } from "../../common/account-status";
import { VerificationService } from "./verification.service";

@ApiTags("verification")
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(
    private readonly verification: VerificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("users/me/verification")
  mine(@CurrentUser() user: { id: string }) {
    return this.verification.mine(user.id).then((data) => ({ data }));
  }

  @Post("users/me/verification")
  async submit(
    @CurrentUser() user: { id: string },
    @Body(new ZodPipe(attachMediaBodySchema)) body: ReturnType<typeof attachMediaBodySchema.parse>,
  ) {
    const account = await this.prisma.user.findUnique({ where: { id: user.id }, select: { status: true } });
    assertActive(account?.status ?? "DELETED");
    return { data: await this.verification.submit(user.id, body) };
  }

  @Get("admin/verifications")
  @UseGuards(RolesGuard)
  @Roles("MODERATOR", "ADMIN")
  queue(@Query(new ZodPipe(listVerificationsQuerySchema)) query: ReturnType<typeof listVerificationsQuerySchema.parse>) {
    return this.verification.queue(query);
  }

  @Post("admin/verifications/:id/review")
  @UseGuards(RolesGuard)
  @Roles("MODERATOR", "ADMIN")
  review(
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
    @Body(new ZodPipe(reviewVerificationBodySchema)) body: ReturnType<typeof reviewVerificationBodySchema.parse>,
  ) {
    return this.verification.review(user.id, id, body);
  }
}
