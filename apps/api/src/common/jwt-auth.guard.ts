import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { AuthUser } from "./current-user";

type AccessPayload = { sub: string; sid: string; role: AuthUser["role"] };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthUser;
    }>();
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException({ code: "AUTH_UNAUTHORIZED" });
    }
    const token = header.slice(7);
    try {
      const payload = await this.jwt.verifyAsync<AccessPayload>(token);
      const session = await this.prisma.session.findFirst({
        where: { id: payload.sid, userId: payload.sub, revokedAt: null },
        include: { user: { select: { status: true, role: true } } },
      });
      if (!session || session.expiresAt < new Date() || session.user.status === "DELETED") {
        throw new UnauthorizedException({ code: "AUTH_UNAUTHORIZED" });
      }
      if (session.user.status === "SUSPENDED") {
        throw new ForbiddenException({
          code: "AUTH_ACCOUNT_SUSPENDED",
          message: "This account is suspended.",
        });
      }
      req.user = { id: payload.sub, sessionId: payload.sid, role: session.user.role };
      return true;
    } catch (err) {
      if (err instanceof ForbiddenException || err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException({ code: "AUTH_UNAUTHORIZED" });
    }
  }
}

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthUser;
    }>();
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return true;
    try {
      const payload = await this.jwt.verifyAsync<AccessPayload>(header.slice(7));
      const session = await this.prisma.session.findFirst({
        where: { id: payload.sid, userId: payload.sub, revokedAt: null },
        include: { user: { select: { status: true, role: true } } },
      });
      if (!session || session.expiresAt < new Date() || session.user.status === "DELETED") {
        return true;
      }
      if (session.user.status === "SUSPENDED") return true;
      req.user = { id: payload.sub, sessionId: payload.sid, role: session.user.role };
    } catch {
      return true;
    }
    return true;
  }
}
