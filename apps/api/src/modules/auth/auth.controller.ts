import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { loginBodySchema, refreshBodySchema, registerBodySchema, verifyEmailBodySchema } from "@dorham/shared";
import { ZodPipe } from "../../common/zod-pipe";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { CurrentUser } from "../../common/current-user";
import { AuthService } from "./auth.service";

type ReqMeta = { ip?: string; headers: Record<string, unknown> };

@ApiTags("auth")
@SkipThrottle({ default: true })
@Throttle({ auth: { limit: 20, ttl: 60_000 } })
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  async register(
    @Body(new ZodPipe(registerBodySchema)) body: ReturnType<typeof registerBodySchema.parse>,
    @Req() req: ReqMeta,
  ) {
    const data = await this.auth.register(body, this.meta(req));
    return { data };
  }

  @Post("login")
  async login(
    @Body(new ZodPipe(loginBodySchema)) body: ReturnType<typeof loginBodySchema.parse>,
    @Req() req: ReqMeta,
  ) {
    const data = await this.auth.login(body, this.meta(req));
    return { data };
  }

  @Post("refresh")
  async refresh(
    @Body(new ZodPipe(refreshBodySchema)) body: ReturnType<typeof refreshBodySchema.parse>,
    @Req() req: ReqMeta,
  ) {
    const data = await this.auth.refresh(body.refreshToken, this.meta(req));
    return { data };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: { sessionId: string }) {
    await this.auth.logout(user.sessionId);
    return { data: { ok: true } };
  }

  @Post("verify-email")
  async verifyEmail(@Body(new ZodPipe(verifyEmailBodySchema)) body: ReturnType<typeof verifyEmailBodySchema.parse>) {
    return { data: await this.auth.verifyEmail(body.token) };
  }

  @Post("resend-verification")
  @UseGuards(JwtAuthGuard)
  async resend(@CurrentUser() user: { id: string }) {
    return { data: await this.auth.resendVerification(user.id) };
  }

  private meta(req: ReqMeta) {
    const ua = req.headers["user-agent"];
    return {
      ip: req.ip,
      userAgent: typeof ua === "string" ? ua : undefined,
    };
  }
}
