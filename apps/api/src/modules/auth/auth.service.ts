import { randomBytes } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma } from "@prisma/client";
import { ForgotPasswordBody, LoginBody, OAuthBody, OAuthStartBody, RegisterBody, ResetPasswordBody } from "@dorham/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { addDuration, accessTtlSeconds, hashPassword, hashToken, newOpaqueToken, newRefreshToken, verifyPassword } from "../../common/crypto";
import { loadEnv } from "../../config/env";
import { MailService } from "../mail/mail.service";
import { oauthConfigFromEnv, OAuthError, resolveOAuth, startOAuth, type ResolvedOAuth } from "./oauth";

const LOCK_AFTER = 8;
const LOCK_MINUTES = 20;
const EMAIL_TOKEN_HOURS = 24;
const RESET_TOKEN_HOURS = 2;

/** Keeps a missing account on the same Argon2 path as a real login. */
let dummyHash: Promise<string> | undefined;
function dummyPasswordHash() {
  dummyHash ??= hashPassword("dorham-login-timing-pad");
  return dummyHash;
}

@Injectable()
export class AuthService {
  private readonly env = loadEnv();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  async register(body: RegisterBody, meta: { ip?: string; userAgent?: string }) {
    const passwordHash = await hashPassword(body.password);
    const exists = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (exists) {
      throw new ConflictException({
        code: "AUTH_EMAIL_TAKEN",
        message: "An account with this email already exists.",
      });
    }
    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        locale: body.locale,
        profile: {
          create: {
            displayName: body.displayName,
            city: "istanbul",
            country: "TR",
          },
        },
        verification: { create: { status: "NONE" } },
      },
    });

    const verifyEmailToken = await this.issueEmailToken(user.id, "EMAIL_VERIFY", EMAIL_TOKEN_HOURS);
    await this.mail.sendVerifyEmail(user.email, verifyEmailToken);

    await this.prisma.auditLog.create({
      data: { userId: user.id, action: "auth.register", entity: "User", entityId: user.id, ip: meta.ip },
    });

    const tokens = await this.issueTokens(user.id, user.role, meta);
    return this.env.NODE_ENV === "production" ? tokens : { ...tokens, verifyEmailToken };
  }

  async login(body: LoginBody, meta: { ip?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: body.email } });
    const missing = !user || user.status === "DELETED";
    const ok = await verifyPassword(missing ? await dummyPasswordHash() : user.passwordHash, body.password);
    if (missing || !ok) {
      if (!missing && user.status !== "SUSPENDED" && !(user.lockedUntil && user.lockedUntil > new Date())) {
        const failed = user.failedLogins + 1;
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLogins: failed,
            lockedUntil: failed >= LOCK_AFTER ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
          },
        });
      }
      throw new UnauthorizedException({
        code: "AUTH_INVALID_CREDENTIALS",
        message: "Email or password is wrong.",
      });
    }

    if (user.status === "SUSPENDED") {
      throw new UnauthorizedException({
        code: "AUTH_ACCOUNT_SUSPENDED",
        message: "This account is suspended.",
      });
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException({
        code: "AUTH_LOCKED",
        message: "This account is temporarily locked. Try later.",
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    return this.issueTokens(user.id, user.role, meta);
  }

  async oauthStart(body: OAuthStartBody) {
    try {
      return startOAuth(oauthConfigFromEnv(this.env), body);
    } catch (err) {
      this.rethrowOAuth(err);
    }
  }

  async oauth(body: OAuthBody, meta: { ip?: string; userAgent?: string }) {
    const resolved = await resolveOAuth(oauthConfigFromEnv(this.env), body).catch((err: unknown) => this.rethrowOAuth(err));
    return this.completeOAuth(resolved, meta);
  }

  async refresh(refreshToken: string, meta: { ip?: string; userAgent?: string }) {
    const refreshTokenHash = hashToken(refreshToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshTokenHash },
      include: { user: true },
    });
    if (
      !session ||
      session.expiresAt < new Date() ||
      session.user.status === "DELETED" ||
      session.user.status === "SUSPENDED"
    ) {
      throw new UnauthorizedException({ code: "AUTH_UNAUTHORIZED", message: "Session expired." });
    }
    if (session.revokedAt) {
      // A token reused well after rotation means it was copied. End every live session.
      if (Date.now() - session.revokedAt.getTime() > 15_000) {
        await this.prisma.session.updateMany({
          where: { userId: session.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException({ code: "AUTH_UNAUTHORIZED", message: "Session expired." });
    }

    const consumed = await this.prisma.session.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (consumed.count !== 1) {
      throw new UnauthorizedException({ code: "AUTH_UNAUTHORIZED", message: "Session expired." });
    }

    return this.issueTokens(session.userId, session.user.role, meta);
  }

  async logout(sessionId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async verifyEmail(token: string) {
    const tokenHash = hashToken(token);
    const row = await this.prisma.emailToken.findFirst({
      where: { tokenHash, purpose: "EMAIL_VERIFY", usedAt: null },
    });
    if (!row || row.expiresAt < new Date()) {
      throw new UnauthorizedException({
        code: "AUTH_EMAIL_TOKEN_INVALID",
        message: "This verification link is invalid or expired.",
      });
    }

    await this.prisma.$transaction([
      this.prisma.emailToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
      this.prisma.user.update({
        where: { id: row.userId },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);

    return { ok: true as const };
  }

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.emailVerifiedAt) {
      return this.env.NODE_ENV === "production"
        ? { ok: true as const, alreadyVerified: true as const }
        : { ok: true as const, alreadyVerified: true as const, verifyEmailToken: undefined };
    }
    const verifyEmailToken = await this.issueEmailToken(userId, "EMAIL_VERIFY", EMAIL_TOKEN_HOURS);
    const mailed = await this.mail.sendVerifyEmail(user.email, verifyEmailToken);
    if (this.env.NODE_ENV === "production") {
      if (!mailed.sent) {
        throw new ServiceUnavailableException({
          code: "MAIL_UNAVAILABLE",
          message: "ارسال ایمیل الان ممکن نیست. کلید Resend روی سرور تنظیم نشده یا سرویس ایمیل قطع است.",
        });
      }
      return { ok: true as const, mailed: true as const };
    }
    return { ok: true as const, mailed: mailed.sent, verifyEmailToken };
  }

  /** Always returns ok to avoid email enumeration. */
  async forgotPassword(body: ForgotPasswordBody) {
    const user = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (user && user.status !== "DELETED") {
      const token = await this.issueEmailToken(user.id, "PASSWORD_RESET", RESET_TOKEN_HOURS);
      await this.mail.sendPasswordReset(user.email, token);
      if (this.env.NODE_ENV !== "production") {
        return { ok: true as const, resetToken: token };
      }
    }
    return { ok: true as const };
  }

  async resetPassword(body: ResetPasswordBody) {
    const tokenHash = hashToken(body.token);
    const row = await this.prisma.emailToken.findFirst({
      where: { tokenHash, purpose: "PASSWORD_RESET", usedAt: null },
    });
    if (!row || row.expiresAt < new Date()) {
      throw new UnauthorizedException({
        code: "AUTH_EMAIL_TOKEN_INVALID",
        message: "This reset link is invalid or expired.",
      });
    }

    const passwordHash = await hashPassword(body.password);
    await this.prisma.$transaction([
      this.prisma.emailToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
      this.prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash, failedLogins: 0, lockedUntil: null },
      }),
      this.prisma.session.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { ok: true as const };
  }

  private rethrowOAuth(err: unknown): never {
    if (err instanceof OAuthError) {
      if (err.code === "AUTH_OAUTH_UNAVAILABLE") {
        throw new ServiceUnavailableException({ code: err.code, message: err.message });
      }
      throw new BadRequestException({ code: err.code, message: err.message });
    }
    throw err;
  }

  private async completeOAuth(resolved: ResolvedOAuth, meta: { ip?: string; userAgent?: string }) {
    const provider = { google: "GOOGLE", apple: "APPLE", facebook: "FACEBOOK" } as const;
    const dbProvider = provider[resolved.profile.provider];
    const identity = { provider: dbProvider, providerUserId: resolved.profile.providerUserId };
    const linked = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerUserId: identity },
      include: { user: true },
    });
    if (linked) return this.issueForOAuthUser(linked.user, meta);

    const email = resolved.profile.email;
    if (!email || !resolved.profile.emailVerified) {
      throw new BadRequestException({
        code: email ? "AUTH_OAUTH_INVALID" : "AUTH_OAUTH_EMAIL",
        message: email ? "That email is not verified by the provider." : "The provider did not share an email.",
      });
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.status === "DELETED") {
        throw new UnauthorizedException({ code: "AUTH_UNAUTHORIZED", message: "This account was deleted." });
      }
      if (resolved.profile.provider === "facebook") {
        throw new ConflictException({
          code: "AUTH_EMAIL_TAKEN",
          message: "An account with this email already exists.",
        });
      }
      try {
        await this.prisma.oAuthAccount.create({
          data: { userId: existing.id, provider: dbProvider, providerUserId: resolved.profile.providerUserId },
        });
      } catch (err) {
        if (!uniqueViolation(err)) throw err;
        const raced = await this.prisma.oAuthAccount.findUnique({
          where: { provider_providerUserId: identity },
          include: { user: true },
        });
        if (raced) return this.issueForOAuthUser(raced.user, meta);
        throw err;
      }
      if (!existing.emailVerifiedAt) {
        await this.prisma.user.update({ where: { id: existing.id }, data: { emailVerifiedAt: new Date() } });
      }
      return this.issueForOAuthUser(existing, meta);
    }

    if (!resolved.adult) {
      throw new ForbiddenException({
        code: "AUTH_AGE_REQUIRED",
        message: "A new account needs the 18+ confirmation.",
      });
    }

    const displayName = resolved.displayName ?? resolved.profile.name ?? "عضو دورهم";
    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash: await hashPassword(randomBytes(32).toString("hex")),
          locale: resolved.locale,
          emailVerifiedAt: new Date(),
          profile: { create: { displayName, city: "istanbul", country: "TR" } },
          verification: { create: { status: "NONE" } },
          oauthAccounts: { create: { provider: dbProvider, providerUserId: resolved.profile.providerUserId } },
        },
      });
      await this.prisma.auditLog.create({
        data: { userId: user.id, action: "auth.oauth.register", entity: "User", entityId: user.id, ip: meta.ip },
      });
      return this.issueTokens(user.id, user.role, meta);
    } catch (err) {
      if (!uniqueViolation(err)) throw err;
      const raced = await this.prisma.oAuthAccount.findUnique({
        where: { provider_providerUserId: identity },
        include: { user: true },
      });
      if (raced) return this.issueForOAuthUser(raced.user, meta);
      throw new ConflictException({
        code: "AUTH_EMAIL_TAKEN",
        message: "An account with this email already exists.",
      });
    }
  }

  private async issueForOAuthUser(
    user: { id: string; role: "MEMBER" | "HOST" | "MODERATOR" | "ADMIN"; status: string; lockedUntil: Date | null },
    meta: { ip?: string; userAgent?: string },
  ) {
    if (user.status === "DELETED") {
      throw new UnauthorizedException({ code: "AUTH_UNAUTHORIZED", message: "This account was deleted." });
    }
    if (user.status === "SUSPENDED") {
      throw new UnauthorizedException({
        code: "AUTH_ACCOUNT_SUSPENDED",
        message: "This account is suspended.",
      });
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException({
        code: "AUTH_LOCKED",
        message: "This account is temporarily locked. Try later.",
      });
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: { userId: user.id, action: "auth.oauth", entity: "User", entityId: user.id, ip: meta.ip },
    });
    return this.issueTokens(user.id, user.role, meta);
  }

  private async issueEmailToken(
    userId: string,
    purpose: "EMAIL_VERIFY" | "PASSWORD_RESET",
    hours: number,
  ) {
    await this.prisma.emailToken.updateMany({
      where: { userId, purpose, usedAt: null },
      data: { usedAt: new Date() },
    });
    const token = newOpaqueToken();
    await this.prisma.emailToken.create({
      data: {
        userId,
        purpose,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + hours * 3600_000),
      },
    });
    return token;
  }

  private async issueTokens(
    userId: string,
    role: "MEMBER" | "HOST" | "MODERATOR" | "ADMIN",
    meta: { ip?: string; userAgent?: string },
  ) {
    const refreshToken = newRefreshToken();
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: hashToken(refreshToken),
        userAgent: meta.userAgent?.slice(0, 180),
        ip: meta.ip,
        expiresAt: addDuration(this.env.JWT_REFRESH_TTL),
      },
    });

    const accessToken = await this.jwt.signAsync({ sub: userId, sid: session.id, role });
    return {
      accessToken,
      refreshToken,
      expiresIn: accessTtlSeconds(this.env.JWT_ACCESS_TTL),
      tokenType: "Bearer" as const,
    };
  }
}

function uniqueViolation(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}
