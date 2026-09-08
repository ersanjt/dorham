import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { attachMediaBodySchema, patchMeBodySchema } from "@dorham/shared";
import { JwtAuthGuard, OptionalJwtAuthGuard } from "../../common/jwt-auth.guard";
import { CurrentUser, OptionalUser } from "../../common/current-user";
import { ZodPipe } from "../../common/zod-pipe";
import { UsersService } from "./users.service";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: { id: string }) {
    return { data: await this.users.me(user.id) };
  }

  @Patch("me")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async patch(
    @CurrentUser() user: { id: string },
    @Body(new ZodPipe(patchMeBodySchema)) body: ReturnType<typeof patchMeBodySchema.parse>,
  ) {
    return { data: await this.users.patchMe(user.id, body) };
  }

  @Post("me/photo")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async photo(
    @CurrentUser() user: { id: string },
    @Body(new ZodPipe(attachMediaBodySchema)) body: ReturnType<typeof attachMediaBodySchema.parse>,
  ) {
    return { data: await this.users.setPhoto(user.id, body) };
  }

  @Post("me/pause")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async pause(@CurrentUser() user: { id: string }) {
    return { data: await this.users.pause(user.id) };
  }

  @Post("me/resume")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async resume(@CurrentUser() user: { id: string }) {
    return { data: await this.users.resume(user.id) };
  }

  @Delete("me")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async remove(@CurrentUser() user: { id: string; sessionId: string }) {
    return { data: await this.users.remove(user.id, user.sessionId) };
  }

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  async publicProfile(@Param("id") id: string, @OptionalUser() user?: { id: string }) {
    return { data: await this.users.publicById(user?.id, id) };
  }
}
