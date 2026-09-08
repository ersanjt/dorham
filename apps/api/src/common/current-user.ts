import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { UserRole } from "@prisma/client";

export type AuthUser = {
  id: string;
  sessionId: string;
  role: UserRole;
};

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  const req = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
  if (!req.user) {
    throw new UnauthorizedException({ code: "AUTH_UNAUTHORIZED" });
  }
  return req.user;
});

export const OptionalUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser | undefined => {
  const req = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
  return req.user;
});
