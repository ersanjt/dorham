import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { reportBodySchema } from "@dorham/shared";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { CurrentUser } from "../../common/current-user";
import { ZodPipe } from "../../common/zod-pipe";
import { TrustService } from "./trust.service";

@ApiTags("trust")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TrustController {
  constructor(private readonly trust: TrustService) {}

  @Get("users/me/blocks")
  blocks(@CurrentUser() user: { id: string }) {
    return this.trust.listBlocks(user.id);
  }

  @Post("users/:id/block")
  async block(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return { data: await this.trust.block(user.id, id) };
  }

  @Delete("users/:id/block")
  async unblock(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return { data: await this.trust.unblock(user.id, id) };
  }

  @Post("reports")
  async report(
    @CurrentUser() user: { id: string },
    @Body(new ZodPipe(reportBodySchema)) body: ReturnType<typeof reportBodySchema.parse>,
  ) {
    return { data: await this.trust.report(user.id, body) };
  }
}
