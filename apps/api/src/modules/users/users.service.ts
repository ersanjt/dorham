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

  async activity(userId: string) {
    const now = new Date();
    const [venuesVisited, eventsAttended, eventsGoing, eventsHosted, pendingVenueVisits, venueRows, eventRows, hangRows] =
      await Promise.all([
        this.prisma.venueVisit.count({ where: { userId, status: "VERIFIED" } }),
        this.prisma.eventRsvp.count({ where: { userId, checkedInAt: { not: null } } }),
        this.prisma.eventRsvp.count({
          where: { userId, status: { in: ["GOING", "INTERESTED"] } },
        }),
        this.prisma.event.count({ where: { hostId: userId, status: { in: ["PUBLISHED", "ENDED"] } } }),
        this.prisma.venueVisit.count({ where: { userId, status: "PENDING" } }),
        this.prisma.venueVisit.findMany({
          where: { userId, status: "VERIFIED" },
          orderBy: { lastVisitedAt: "desc" },
          take: 40,
          include: { venue: true },
        }),
        this.prisma.eventRsvp.findMany({
          where: { userId, checkedInAt: { not: null } },
          orderBy: { checkedInAt: "desc" },
          take: 40,
          include: { event: true },
        }),
        this.prisma.venueHangPlan.findMany({
          where: { userId, cancelledAt: null, startsAt: { gte: now } },
          orderBy: { startsAt: "asc" },
          take: 20,
          include: { venue: true },
        }),
      ]);

    return {
      stats: {
        venuesVisited,
        eventsAttended,
        eventsGoing,
        eventsHosted,
        pendingVenueVisits,
      },
      venues: venueRows.map((row) => ({
        id: row.id,
        venueId: row.venueId,
        venueSlug: row.venue.slug,
        venueName: row.venue.name,
        venueArea: row.venue.area,
        status: row.status,
        visitCount: row.visitCount,
        lastVisitedAt: row.lastVisitedAt.toISOString(),
        verifiedAt: row.verifiedAt?.toISOString() ?? null,
      })),
      eventsAttended: eventRows.map((row) => ({
        id: row.event.id,
        title: row.event.title,
        venue: row.event.venue,
        startsAt: row.event.startsAt.toISOString(),
        checkedInAt: row.checkedInAt?.toISOString() ?? null,
      })),
      hangPlans: hangRows.map((row) => ({
        id: row.id,
        venueId: row.venueId,
        venueSlug: row.venue.slug,
        venueName: row.venue.name,
        venueArea: row.venue.area,
        startsAt: row.startsAt.toISOString(),
        intent: row.intent,
        note: row.note,
      })),
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

    const [venuesVisited, eventsAttended, eventsHosted, venueRows] = await Promise.all([
      this.prisma.venueVisit.count({ where: { userId, status: "VERIFIED" } }),
      this.prisma.eventRsvp.count({ where: { userId, checkedInAt: { not: null } } }),
      this.prisma.event.count({ where: { hostId: userId, status: { in: ["PUBLISHED", "ENDED"] } } }),
      this.prisma.venueVisit.findMany({
        where: { userId, status: "VERIFIED" },
        orderBy: { lastVisitedAt: "desc" },
        take: 24,
        include: { venue: true },
      }),
    ]);

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
      stats: { venuesVisited, eventsAttended, eventsHosted },
      venuesVisited: venueRows.map((row) => ({
        venueId: row.venueId,
        venueSlug: row.venue.slug,
        venueName: row.venue.name,
        venueArea: row.venue.area,
        visitCount: row.visitCount,
        lastVisitedAt: row.lastVisitedAt.toISOString(),
      })),
    };
  }

  async patchMe(userId: string, body: PatchMeBody) {
    const account = await this.prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
    assertActive(account?.status ?? "DELETED");
    await this.prisma.$transaction([
      ...(body.locale
        ? [
            this.prisma.user.update({
              where: { id: userId },
              data: { locale: body.locale },
            }),
          ]
        : []),
      this.prisma.profile.update({
        where: { userId },
        data: {
          ...(body.displayName !== undefined ? { displayName: body.displayName } : {}),
          ...(body.bio !== undefined ? { bio: body.bio } : {}),
          ...(body.city !== undefined ? { city: body.city } : {}),
          ...(body.datingEnabled !== undefined ? { datingEnabled: body.datingEnabled } : {}),
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
