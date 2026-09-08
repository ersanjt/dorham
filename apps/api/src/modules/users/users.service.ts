import { randomBytes } from "node:crypto";
import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { AttachMediaBody, PatchMeBody } from "@dorham/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { assertActive } from "../../common/account-status";
import { hashPassword } from "../../common/crypto";
import { MediaService } from "../media/media.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, verification: true },
    });
    if (!user || !user.profile || user.status === "DELETED") {
      throw new UnauthorizedException({ code: "AUTH_UNAUTHORIZED" });
    }
    return {
      id: user.id,
      email: user.email,
      displayName: user.profile.displayName,
      bio: user.profile.bio,
      city: user.profile.city as "istanbul" | "ankara" | "izmir",
      locale: user.locale,
      role: user.role,
      status: user.status,
      emailVerified: Boolean(user.emailVerifiedAt),
      verificationStatus: user.verification?.status ?? "NONE",
      datingEnabled: user.profile.datingEnabled,
      photoUrl: await this.media.photoUrl(user.profile.photoId),
      createdAt: user.createdAt.toISOString(),
    };
  }

  async publicById(viewerId: string | undefined, userId: string) {
    if (viewerId && (await this.isBlockedEitherWay(viewerId, userId))) {
      throw new NotFoundException({ code: "USER_NOT_FOUND", message: "User not found." });
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, verification: true },
    });
    if (!user || !user.profile || user.status === "DELETED") {
      throw new NotFoundException({ code: "USER_NOT_FOUND", message: "User not found." });
    }
    if (
      (user.status === "PAUSED" || user.status === "SUSPENDED") &&
      viewerId !== userId
    ) {
      throw new NotFoundException({ code: "USER_NOT_FOUND", message: "User not found." });
    }
    return {
      id: user.id,
      displayName: user.profile.displayName,
      bio: user.profile.bio,
      city: user.profile.city as "istanbul" | "ankara" | "izmir",
      locale: user.locale,
      verificationStatus: user.verification?.status ?? "NONE",
      datingEnabled: false,
      photoUrl: await this.media.photoUrl(user.profile.photoId),
      createdAt: user.createdAt.toISOString(),
    };
  }

  async patchMe(userId: string, body: PatchMeBody) {
    const account = await this.prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
    assertActive(account?.status ?? "DELETED");
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { locale: body.locale },
      }),
      this.prisma.profile.update({
        where: { userId },
        data: {
          displayName: body.displayName,
          bio: body.bio === undefined ? undefined : body.bio,
          city: body.city,
          datingEnabled: body.datingEnabled,
        },
      }),
    ]);
    return this.me(userId);
  }

  async setPhoto(userId: string, body: AttachMediaBody) {
    const account = await this.prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
    assertActive(account?.status ?? "DELETED");
    await this.media.requireOwned(userId, body.mediaId, "PROFILE");
    await this.prisma.profile.update({
      where: { userId },
      data: { photoId: body.mediaId },
    });
    return this.me(userId);
  }

  async pause(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: "PAUSED" },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: "user.pause", entity: "User", entityId: userId },
    });
    return this.me(userId);
  }

  async resume(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE" },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: "user.resume", entity: "User", entityId: userId },
    });
    return this.me(userId);
  }

  async remove(userId: string, sessionId: string) {
    const assets = await this.prisma.mediaAsset.findMany({ where: { userId } });
    for (const asset of assets) {
      await this.media.deleteOwned(userId, asset.id);
    }
    const passwordHash = await hashPassword(randomBytes(32).toString("hex"));
    await this.prisma.$transaction([
      this.prisma.session.updateMany({ where: { userId }, data: { revokedAt: new Date() } }),
      this.prisma.emailToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } }),
      this.prisma.profile.update({
        where: { userId },
        data: { displayName: "حساب حذف‌شده", bio: null, photoId: null, datingEnabled: false },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          status: "DELETED",
          email: `deleted+${userId}@invalid.dorham`,
          phone: null,
          passwordHash,
        },
      }),
      this.prisma.auditLog.create({
        data: { userId, action: "user.delete", entity: "User", entityId: userId },
      }),
    ]);
    await this.prisma.session.updateMany({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    return { ok: true as const };
  }

  async isBlockedEitherWay(a: string, b: string) {
    const row = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a },
        ],
      },
      select: { id: true },
    });
    return Boolean(row);
  }
}
