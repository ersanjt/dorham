import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  CreateVenueHangPlanBody,
  CreateVenueReviewBody,
  ListVenuesQuery,
  ModerateVenueContentBody,
  SubmitVenueBody,
  SubmitVenuePhotoBody,
  VenueCheckInBody,
} from "@dorham/shared";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { assertActive } from "../../common/account-status";
import { newOpaqueToken, secretsEqual } from "../../common/crypto";
import { loadEnv } from "../../config/env";
import { MediaService } from "../media/media.service";
import { NotificationsService } from "../users/notifications.service";
import { osmMapPreviewUrl, streetViewEmbedUrl } from "./map-preview";

const publishedReviewCount = { reviews: { where: { status: "PUBLISHED" as const } } };

const venueDtoInclude = {
  _count: { select: publishedReviewCount },
  communityPhotos: {
    where: { status: "PUBLISHED" as const },
    orderBy: { createdAt: "desc" as const },
    take: 16,
    select: { mediaId: true, caption: true },
  },
};

@Injectable()
export class VenuesService {
  private readonly env = loadEnv();

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(query: ListVenuesQuery) {
    const where: Prisma.VenueWhereInput = {
      city: query.city,
      published: true,
    };
    if (query.kind) where.kind = query.kind;
    if (query.area) where.area = query.area;

    const rows = await this.prisma.venue.findMany({
      where,
      orderBy: [{ area: "asc" }, { kind: "asc" }, { name: "asc" }],
      take: query.limit,
      include: venueDtoInclude,
    });
    return {
      data: await Promise.all(rows.map((row) => this.toDto(row))),
      page: { nextCursor: null, limit: query.limit },
    };
  }

  async get(idOrSlug: string) {
    const row = await this.prisma.venue.findFirst({
      where: {
        published: true,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: venueDtoInclude,
    });
    if (!row) {
      throw new NotFoundException({ code: "VENUE_NOT_FOUND", message: "Venue not found." });
    }
    return { data: await this.toDto(row) };
  }

  async submit(userId: string, body: SubmitVenueBody) {
    const account = await this.prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
    assertActive(account?.status ?? "DELETED");
    const slug = await this.uniqueSlug(body.name, body.area, body.kind);
    const row = await this.prisma.venue.create({
      data: {
        slug,
        name: body.name,
        kind: body.kind,
        city: "istanbul",
        area: body.area,
        address: body.address,
        mapsQuery: body.mapsUrl,
        description: body.description,
        hours: body.hours || null,
        phone: body.phone || null,
        website: body.website || null,
        priceRange: body.priceRange || null,
        menuNotes: body.menuNotes || null,
        published: false,
        submitterId: userId,
        ownerId: userId,
        checkInSecret: newOpaqueToken(),
      },
      include: venueDtoInclude,
    });
    await this.prisma.auditLog.create({
      data: { userId, action: "venue.submit", entity: "Venue", entityId: row.id },
    });
    return {
      data: {
        ...(await this.toDto(row)),
        published: false as const,
        pendingReview: true as const,
      },
    };
  }

  async listPending() {
    const rows = await this.prisma.venue.findMany({
      where: { published: false },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: venueDtoInclude,
    });
    return { data: await Promise.all(rows.map((row) => this.toDto(row))) };
  }

  async publish(venueId: string, actorId: string) {
    const row = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!row) {
      throw new NotFoundException({ code: "VENUE_NOT_FOUND", message: "Venue not found." });
    }
    const updated = await this.prisma.venue.update({
      where: { id: venueId },
      data: { published: true },
      include: venueDtoInclude,
    });
    await this.prisma.auditLog.create({
      data: { userId: actorId, action: "venue.publish", entity: "Venue", entityId: venueId },
    });
    return { data: await this.toDto(updated) };
  }

  async reviews(idOrSlug: string) {
    const venue = await this.requirePublished(idOrSlug);
    const rows = await this.prisma.venueReview.findMany({
      where: { venueId: venue.id, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { author: { include: { profile: true, verification: true } } },
    });
    return { data: rows.map((row) => this.reviewDto(row)) };
  }

  async addReview(idOrSlug: string, userId: string, body: CreateVenueReviewBody) {
    const account = await this.prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
    assertActive(account?.status ?? "DELETED");
    const venue = await this.requirePublished(idOrSlug);
    try {
      const row = await this.prisma.venueReview.create({
        data: { venueId: venue.id, authorId: userId, body: body.body, status: "PENDING" },
        include: { author: { include: { profile: true, verification: true } } },
      });
      await this.prisma.auditLog.create({
        data: { userId, action: "venue.review_submit", entity: "VenueReview", entityId: row.id },
      });
      return { data: this.reviewDto(row) };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException({ code: "REVIEW_DUPLICATE", message: "You already reviewed this venue." });
      }
      throw err;
    }
  }

  async listPendingReviews() {
    const rows = await this.prisma.venueReview.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 60,
      include: {
        venue: true,
        author: { include: { profile: true, verification: true } },
      },
    });
    return {
      data: rows.map((row) => ({
        ...this.reviewDto(row),
        venueId: row.venueId,
        venueSlug: row.venue.slug,
        venueName: row.venue.name,
      })),
    };
  }

  async moderateReview(id: string, actorId: string, body: ModerateVenueContentBody) {
    const row = await this.prisma.venueReview.findUnique({ where: { id } });
    if (!row) throw new NotFoundException({ code: "VENUE_NOT_FOUND", message: "Review not found." });
    const updated = await this.prisma.venueReview.update({
      where: { id },
      data: { status: body.status, reviewedAt: new Date(), reviewedById: actorId },
      include: { author: { include: { profile: true, verification: true } }, venue: true },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: body.status === "PUBLISHED" ? "venue.review_publish" : "venue.review_reject",
        entity: "VenueReview",
        entityId: id,
      },
    });
    await this.notifications.push({
      userId: updated.authorId,
      kind: body.status === "PUBLISHED" ? "review.published" : "review.rejected",
      title: body.status === "PUBLISHED" ? "نظرت منتشر شد" : "نظرت پذیرفته نشد",
      body:
        body.status === "PUBLISHED"
          ? `تجربه‌ات برای «${updated.venue.name}» حالا عمومی است.`
          : `نظر برای «${updated.venue.name}» رد شد.`,
      href: `/venues/${updated.venue.slug}`,
    });
    return {
      data: {
        ...this.reviewDto(updated),
        venueId: updated.venueId,
        venueSlug: updated.venue.slug,
        venueName: updated.venue.name,
      },
    };
  }

  async submitPhoto(idOrSlug: string, userId: string, body: SubmitVenuePhotoBody) {
    const account = await this.prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
    assertActive(account?.status ?? "DELETED");
    const venue = await this.requirePublished(idOrSlug);
    await this.media.requireOwned(userId, body.mediaId, "VENUE_PHOTO");
    const recent = await this.prisma.venuePhoto.count({
      where: {
        uploaderId: userId,
        venueId: venue.id,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (recent >= 5) {
      throw new BadRequestException({ code: "RATE_LIMITED", message: "Too many photos today for this venue." });
    }
    const row = await this.prisma.venuePhoto.create({
      data: {
        venueId: venue.id,
        uploaderId: userId,
        mediaId: body.mediaId,
        caption: body.caption?.trim() || null,
        status: "PENDING",
      },
      include: { venue: true, uploader: { include: { profile: true } } },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: "venue.photo_submit", entity: "VenuePhoto", entityId: row.id },
    });
    return { data: await this.photoDto(row) };
  }

  async listPendingPhotos() {
    const rows = await this.prisma.venuePhoto.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 60,
      include: { venue: true, uploader: { include: { profile: true } } },
    });
    return { data: await Promise.all(rows.map((row) => this.photoDto(row))) };
  }

  async moderatePhoto(id: string, actorId: string, body: ModerateVenueContentBody) {
    const row = await this.prisma.venuePhoto.findUnique({ where: { id } });
    if (!row) throw new NotFoundException({ code: "MEDIA_NOT_FOUND", message: "Photo not found." });
    const updated = await this.prisma.venuePhoto.update({
      where: { id },
      data: { status: body.status, reviewedAt: new Date(), reviewedById: actorId },
      include: { venue: true, uploader: { include: { profile: true } } },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: body.status === "PUBLISHED" ? "venue.photo_publish" : "venue.photo_reject",
        entity: "VenuePhoto",
        entityId: id,
      },
    });
    return { data: await this.photoDto(updated) };
  }

  async listHangPlans(idOrSlug: string) {
    const venue = await this.requirePublished(idOrSlug);
    const now = new Date();
    const horizon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.venueHangPlan.findMany({
      where: {
        venueId: venue.id,
        cancelledAt: null,
        startsAt: { gte: now, lte: horizon },
      },
      orderBy: { startsAt: "asc" },
      take: 80,
      include: { venue: true, user: { include: { profile: true, verification: true } } },
    });
    return { data: rows.map((row) => this.hangDto(row)) };
  }

  async createHangPlan(idOrSlug: string, userId: string, body: CreateVenueHangPlanBody) {
    const account = await this.prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
    assertActive(account?.status ?? "DELETED");
    const venue = await this.requirePublished(idOrSlug);
    const startsAt = new Date(body.startsAt);
    const now = new Date();
    const max = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    if (!(startsAt > now) || startsAt > max) {
      throw new BadRequestException({
        code: "HANG_PLAN_INVALID",
        message: "Pick a time between now and 14 days ahead.",
      });
    }
    const dayStart = new Date(startsAt);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
    const existing = await this.prisma.venueHangPlan.findFirst({
      where: {
        venueId: venue.id,
        userId,
        cancelledAt: null,
        startsAt: { gte: dayStart, lt: dayEnd },
      },
    });
    if (existing) {
      const updated = await this.prisma.venueHangPlan.update({
        where: { id: existing.id },
        data: {
          startsAt,
          intent: body.intent,
          note: body.note?.trim() || null,
        },
        include: { venue: true, user: { include: { profile: true, verification: true } } },
      });
      return { data: this.hangDto(updated) };
    }
    const row = await this.prisma.venueHangPlan.create({
      data: {
        venueId: venue.id,
        userId,
        startsAt,
        intent: body.intent,
        note: body.note?.trim() || null,
      },
      include: { venue: true, user: { include: { profile: true, verification: true } } },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: "venue.hang_plan", entity: "VenueHangPlan", entityId: row.id },
    });
    return { data: this.hangDto(row) };
  }

  async cancelHangPlan(planId: string, userId: string) {
    const row = await this.prisma.venueHangPlan.findUnique({ where: { id: planId } });
    if (!row || row.userId !== userId) {
      throw new NotFoundException({ code: "VENUE_NOT_FOUND", message: "Plan not found." });
    }
    await this.prisma.venueHangPlan.update({
      where: { id: planId },
      data: { cancelledAt: new Date() },
    });
    return { data: { ok: true as const } };
  }

  /** Guest asks to be checked in — stays PENDING until the venue owner confirms. */
  async requestVisit(idOrSlug: string, userId: string) {
    const account = await this.prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
    assertActive(account?.status ?? "DELETED");
    const venue = await this.requirePublishedFull(idOrSlug);
    const existing = await this.prisma.venueVisit.findUnique({
      where: { venueId_userId: { venueId: venue.id, userId } },
    });
    if (existing?.status === "VERIFIED") {
      return { data: this.visitDto({ ...existing, venue }) };
    }
    if (existing) {
      return { data: this.visitDto({ ...existing, venue }) };
    }
    const row = await this.prisma.venueVisit.create({
      data: { venueId: venue.id, userId, status: "PENDING" },
      include: { venue: true },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: "venue.visit_request", entity: "VenueVisit", entityId: row.id },
    });
    return { data: this.visitDto(row) };
  }

  /** Owner/staff confirms a guest was at the place (QR secret or manual userId). */
  async checkInVisit(idOrSlug: string, actor: { id: string; role: string }, body: VenueCheckInBody) {
    const venue = await this.requirePublishedFull(idOrSlug);
    const isStaff = actor.role === "ADMIN" || actor.role === "MODERATOR";
    const isOwner = venue.ownerId === actor.id;
    let guestId = body.userId;

    if (body.secret) {
      const secret = await this.ensureVenueSecret(venue);
      if (!secretsEqual(body.secret, secret)) {
        throw new ForbiddenException({ code: "EVENT_CHECKIN_INVALID", message: "Invalid door code." });
      }
      guestId = actor.id;
    } else if (!isOwner && !isStaff) {
      throw new ForbiddenException({ code: "VENUE_VISIT_FORBIDDEN", message: "Only the venue owner can check guests in." });
    }

    if (!guestId) {
      throw new BadRequestException({ code: "VALIDATION_FAILED", message: "userId is required." });
    }
    if (guestId === actor.id && !body.secret && !isStaff) {
      throw new ForbiddenException({ code: "USER_SELF_ACTION", message: "Ask the venue to confirm your visit." });
    }

    const now = new Date();
    const row = await this.prisma.venueVisit.upsert({
      where: { venueId_userId: { venueId: venue.id, userId: guestId } },
      create: {
        venueId: venue.id,
        userId: guestId,
        status: "VERIFIED",
        verifiedById: actor.id,
        verifiedAt: now,
        lastVisitedAt: now,
        visitCount: 1,
      },
      update: {
        status: "VERIFIED",
        verifiedById: actor.id,
        verifiedAt: now,
        lastVisitedAt: now,
        visitCount: { increment: 1 },
      },
      include: { venue: true },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: "venue.visit_verify",
        entity: "VenueVisit",
        entityId: row.id,
        meta: { guestId },
      },
    });
    return { data: this.visitDto(row) };
  }

  async claimOwner(idOrSlug: string, userId: string) {
    const account = await this.prisma.user.findUnique({ where: { id: userId }, select: { status: true, role: true } });
    assertActive(account?.status ?? "DELETED");
    const venue = await this.requirePublishedFull(idOrSlug);
    if (venue.ownerId && venue.ownerId !== userId && account?.role !== "ADMIN") {
      throw new ForbiddenException({ code: "VENUE_VISIT_FORBIDDEN", message: "This venue already has an owner." });
    }
    const canClaim =
      account?.role === "ADMIN" ||
      account?.role === "MODERATOR" ||
      account?.role === "HOST" ||
      venue.submitterId === userId;
    if (!canClaim) {
      throw new ForbiddenException({ code: "VENUE_OWNER_REQUIRED", message: "Hosts and submitters can claim a venue." });
    }
    const updated = await this.prisma.venue.update({
      where: { id: venue.id },
      data: {
        ownerId: userId,
        checkInSecret: venue.checkInSecret ?? newOpaqueToken(),
      },
      include: venueDtoInclude,
    });
    return { data: await this.toDto(updated) };
  }

  async door(idOrSlug: string, actor: { id: string; role: string }) {
    const venue = await this.requirePublishedFull(idOrSlug);
    const isOwner = venue.ownerId === actor.id;
    const isStaff = actor.role === "ADMIN" || actor.role === "MODERATOR";
    if (!isOwner && !isStaff) {
      throw new ForbiddenException({ code: "VENUE_VISIT_FORBIDDEN", message: "Only the venue owner can open the door page." });
    }
    const secret = await this.ensureVenueSecret(venue);
    const [verifiedCount, pendingCount] = await Promise.all([
      this.prisma.venueVisit.count({ where: { venueId: venue.id, status: "VERIFIED" } }),
      this.prisma.venueVisit.count({ where: { venueId: venue.id, status: "PENDING" } }),
    ]);
    return {
      data: {
        venueId: venue.id,
        slug: venue.slug,
        name: venue.name,
        url: `${this.env.APP_URL.replace(/\/$/, "")}/venues/${venue.slug}/checkin?s=${encodeURIComponent(secret)}`,
        verifiedCount,
        pendingCount,
      },
    };
  }

  async listVisits(idOrSlug: string, actor: { id: string; role: string }) {
    const venue = await this.requirePublishedFull(idOrSlug);
    const isOwner = venue.ownerId === actor.id;
    const isStaff = actor.role === "ADMIN" || actor.role === "MODERATOR";
    if (!isOwner && !isStaff) {
      throw new ForbiddenException({ code: "VENUE_VISIT_FORBIDDEN", message: "Only the venue owner can list visits." });
    }
    const rows = await this.prisma.venueVisit.findMany({
      where: { venueId: venue.id },
      orderBy: [{ status: "asc" }, { lastVisitedAt: "desc" }],
      take: 80,
      include: { venue: true, user: { include: { profile: true } } },
    });
    return {
      data: rows.map((row) => ({
        ...this.visitDto(row),
        guestName: row.user.profile?.displayName ?? "عضو",
        guestId: row.userId,
      })),
    };
  }

  private reviewDto(row: {
    id: string;
    body: string;
    status: "PENDING" | "PUBLISHED" | "REJECTED";
    createdAt: Date;
    authorId: string;
    author: {
      profile: { displayName: string } | null;
      verification: { status: "NONE" | "PENDING" | "VERIFIED" | "REJECTED" } | null;
    };
  }) {
    return {
      id: row.id,
      body: row.body,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      author: {
        id: row.authorId,
        displayName: row.author.profile?.displayName ?? "عضو",
        verificationStatus: row.author.verification?.status ?? "NONE",
      },
    };
  }

  private async photoDto(row: {
    id: string;
    venueId: string;
    mediaId: string;
    caption: string | null;
    status: "PENDING" | "PUBLISHED" | "REJECTED";
    createdAt: Date;
    uploaderId: string;
    venue: { slug: string; name: string };
    uploader: { profile: { displayName: string } | null };
  }) {
    return {
      id: row.id,
      venueId: row.venueId,
      venueSlug: row.venue.slug,
      venueName: row.venue.name,
      url: this.media.signedUrl(row.mediaId, 7 * 24 * 60 * 60),
      caption: row.caption,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      uploader: {
        id: row.uploaderId,
        displayName: row.uploader.profile?.displayName ?? "عضو",
      },
    };
  }

  private hangDto(row: {
    id: string;
    venueId: string;
    startsAt: Date;
    intent: "LUNCH" | "DINNER" | "COFFEE" | "OTHER";
    note: string | null;
    createdAt: Date;
    userId: string;
    venue: { slug: string; name: string; area: string };
    user: {
      profile: { displayName: string } | null;
      verification: { status: "NONE" | "PENDING" | "VERIFIED" | "REJECTED" } | null;
    };
  }) {
    return {
      id: row.id,
      venueId: row.venueId,
      venueSlug: row.venue.slug,
      venueName: row.venue.name,
      venueArea: row.venue.area,
      startsAt: row.startsAt.toISOString(),
      intent: row.intent,
      note: row.note,
      createdAt: row.createdAt.toISOString(),
      user: {
        id: row.userId,
        displayName: row.user.profile?.displayName ?? "عضو",
        verificationStatus: row.user.verification?.status ?? "NONE",
      },
    };
  }

  private visitDto(row: {
    id: string;
    venueId: string;
    status: "PENDING" | "VERIFIED" | "REJECTED";
    visitCount: number;
    lastVisitedAt: Date;
    verifiedAt: Date | null;
    venue: { slug: string; name: string; area: string };
  }) {
    return {
      id: row.id,
      venueId: row.venueId,
      venueSlug: row.venue.slug,
      venueName: row.venue.name,
      venueArea: row.venue.area,
      status: row.status,
      visitCount: row.visitCount,
      lastVisitedAt: row.lastVisitedAt.toISOString(),
      verifiedAt: row.verifiedAt?.toISOString() ?? null,
    };
  }

  private async requirePublishedFull(idOrSlug: string) {
    const row = await this.prisma.venue.findFirst({
      where: {
        published: true,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
    if (!row) {
      throw new NotFoundException({ code: "VENUE_NOT_FOUND", message: "Venue not found." });
    }
    return row;
  }

  private async ensureVenueSecret(venue: { id: string; checkInSecret: string | null }) {
    if (venue.checkInSecret) return venue.checkInSecret;
    const checkInSecret = newOpaqueToken();
    await this.prisma.venue.update({ where: { id: venue.id }, data: { checkInSecret } });
    return checkInSecret;
  }

  private async requirePublished(idOrSlug: string) {
    const row = await this.prisma.venue.findFirst({
      where: {
        published: true,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      select: { id: true },
    });
    if (!row) {
      throw new NotFoundException({ code: "VENUE_NOT_FOUND", message: "Venue not found." });
    }
    return row;
  }

  private async uniqueSlug(name: string, area: string, kind: string) {
    const fromName = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    const fromPlace = `${kind.toLowerCase()}-${area.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`.replace(/^-|-$/g, "");
    const base = fromName || fromPlace || "venue";
    for (let i = 0; i < 20; i += 1) {
      const slug = i === 0 ? base : `${base}-${i + 1}`;
      const taken = await this.prisma.venue.findUnique({ where: { slug }, select: { id: true } });
      if (!taken) return slug;
    }
    throw new BadRequestException({ code: "VALIDATION_FAILED", message: "Could not make a venue slug." });
  }

  private async toDto(row: {
    id: string;
    slug: string;
    name: string;
    kind: "RESTAURANT" | "CAFE" | "MARKET" | "CULTURAL";
    city: string;
    area: string;
    address: string;
    mapsQuery: string;
    lat: number | null;
    lng: number | null;
    phone: string | null;
    website: string | null;
    hours: string | null;
    priceRange: string | null;
    menuNotes: string | null;
    description: string;
    photos?: unknown;
    communityPhotos?: Array<{ mediaId: string; caption: string | null }>;
    _count: { reviews: number };
  }) {
    const mapsUrl = row.mapsQuery.startsWith("http")
      ? row.mapsQuery
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.mapsQuery)}`;

    let mapImageUrl: string | null = null;
    let mapsEmbedUrl: string | null = null;
    const gallery: Array<{ kind: "photo" | "street" | "map"; src: string; label: string }> = [];
    const stored = Array.isArray(row.photos)
      ? (row.photos as unknown[]).filter((u): u is string => typeof u === "string" && /^https?:\/\//i.test(u))
      : [];

    // Prefer real place photos (community-approved, then curated) over maps.
    for (const photo of row.communityPhotos ?? []) {
      gallery.push({
        kind: "photo",
        src: this.media.signedUrl(photo.mediaId, 7 * 24 * 60 * 60),
        label: photo.caption?.trim() || row.name,
      });
    }
    for (const url of stored) {
      gallery.push({ kind: "photo", src: url, label: row.name });
    }

    if (row.lat != null && row.lng != null) {
      const key = this.env.GOOGLE_MAPS_API_KEY?.trim();
      if (key) {
        // Same-origin /v1 proxy — Google key stays on the API (no browser IP / key leak).
        mapImageUrl = `/v1/maps/static?lat=${row.lat}&lng=${row.lng}`;
        for (const heading of [20, 140, 260]) {
          gallery.push({
            kind: "street",
            src: `/v1/maps/streetview?lat=${row.lat}&lng=${row.lng}&heading=${heading}`,
            label: `نمای خیابان · ${heading}°`,
          });
        }
      } else {
        mapImageUrl = osmMapPreviewUrl(row.lat, row.lng, 15);
        for (const heading of [20, 140, 260]) {
          gallery.push({
            kind: "street",
            src: streetViewEmbedUrl(row.lat, row.lng, heading),
            label: `نمای خیابان · ${heading}°`,
          });
        }
      }
      mapsEmbedUrl = `https://maps.google.com/maps?q=${row.lat},${row.lng}&z=16&hl=tr&output=embed`;
      if (mapsEmbedUrl) {
        gallery.push({ kind: "map", src: mapsEmbedUrl, label: "نقشه گوگل" });
      }
    }

    // Card covers: real photos → Street View stills → map tile last.
    const photos: string[] = [];
    for (const g of gallery) {
      if (g.kind === "photo") photos.push(g.src);
    }
    for (const g of gallery) {
      if (g.kind === "street" && !g.src.includes("svembed")) photos.push(g.src);
    }
    if (photos.length === 0 && mapImageUrl) {
      photos.push(mapImageUrl);
    }

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      kind: row.kind,
      city: row.city as "istanbul" | "ankara" | "izmir",
      area: row.area,
      address: row.address,
      mapsUrl,
      mapImageUrl,
      mapsEmbedUrl,
      gallery,
      photos,
      lat: row.lat,
      lng: row.lng,
      phone: row.phone,
      website: row.website,
      hours: row.hours,
      priceRange: row.priceRange,
      menuNotes: row.menuNotes,
      reviewCount: row._count.reviews,
      description: row.description,
    };
  }
}
