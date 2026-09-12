import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateVenueReviewBody, ListVenuesQuery, SubmitVenueBody, VenueCheckInBody } from "@dorham/shared";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { assertActive } from "../../common/account-status";
import { newOpaqueToken, secretsEqual } from "../../common/crypto";
import { loadEnv } from "../../config/env";
import { cartoMapPreviewUrl, streetViewEmbedUrl, streetViewPhotoUrl } from "./map-preview";

@Injectable()
export class VenuesService {
  private readonly env = loadEnv();

  constructor(private readonly prisma: PrismaService) {}

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
      include: { _count: { select: { reviews: true } } },
    });
    return {
      data: rows.map((row) => this.toDto(row)),
      page: { nextCursor: null, limit: query.limit },
    };
  }

  async get(idOrSlug: string) {
    const row = await this.prisma.venue.findFirst({
      where: {
        published: true,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: { _count: { select: { reviews: true } } },
    });
    if (!row) {
      throw new NotFoundException({ code: "VENUE_NOT_FOUND", message: "Venue not found." });
    }
    return { data: this.toDto(row) };
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
      include: { _count: { select: { reviews: true } } },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: "venue.submit", entity: "Venue", entityId: row.id },
    });
    return {
      data: {
        ...this.toDto(row),
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
      include: { _count: { select: { reviews: true } } },
    });
    return { data: rows.map((row) => this.toDto(row)) };
  }

  async publish(venueId: string, actorId: string) {
    const row = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!row) {
      throw new NotFoundException({ code: "VENUE_NOT_FOUND", message: "Venue not found." });
    }
    const updated = await this.prisma.venue.update({
      where: { id: venueId },
      data: { published: true },
      include: { _count: { select: { reviews: true } } },
    });
    await this.prisma.auditLog.create({
      data: { userId: actorId, action: "venue.publish", entity: "Venue", entityId: venueId },
    });
    return { data: this.toDto(updated) };
  }

  async reviews(idOrSlug: string) {
    const venue = await this.requirePublished(idOrSlug);
    const rows = await this.prisma.venueReview.findMany({
      where: { venueId: venue.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { author: { include: { profile: true, verification: true } } },
    });
    return {
      data: rows.map((row) => ({
        id: row.id,
        body: row.body,
        createdAt: row.createdAt.toISOString(),
        author: {
          id: row.authorId,
          displayName: row.author.profile?.displayName ?? "عضو",
          verificationStatus: row.author.verification?.status ?? "NONE",
        },
      })),
    };
  }

  async addReview(idOrSlug: string, userId: string, body: CreateVenueReviewBody) {
    const account = await this.prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
    assertActive(account?.status ?? "DELETED");
    const venue = await this.requirePublished(idOrSlug);
    try {
      const row = await this.prisma.venueReview.create({
        data: { venueId: venue.id, authorId: userId, body: body.body },
        include: { author: { include: { profile: true, verification: true } } },
      });
      return {
        data: {
          id: row.id,
          body: row.body,
          createdAt: row.createdAt.toISOString(),
          author: {
            id: row.authorId,
            displayName: row.author.profile?.displayName ?? "عضو",
            verificationStatus: row.author.verification?.status ?? "NONE",
          },
        },
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException({ code: "REVIEW_DUPLICATE", message: "You already reviewed this venue." });
      }
      throw err;
    }
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

    const guest = await this.prisma.user.findUnique({ where: { id: guestId }, select: { id: true, status: true } });
    if (!guest || guest.status === "DELETED") {
      throw new NotFoundException({ code: "USER_NOT_FOUND", message: "User not found." });
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
      include: { _count: { select: { reviews: true } } },
    });
    return { data: this.toDto(updated) };
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

  private toDto(row: {
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

    for (const url of stored) {
      gallery.push({ kind: "photo", src: url, label: row.name });
    }

    if (row.lat != null && row.lng != null) {
      const key = this.env.GOOGLE_MAPS_API_KEY?.trim();
      if (key) {
        const marker = `${row.lat},${row.lng}`;
        mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${marker}&zoom=16&size=640x360&scale=2&maptype=roadmap&markers=color:0xB12E28%7C${marker}&key=${encodeURIComponent(key)}`;
        for (const heading of [20, 140, 260]) {
          gallery.push({
            kind: "street",
            src: streetViewPhotoUrl(row.lat, row.lng, heading, key),
            label: `نمای خیابان · ${heading}°`,
          });
        }
      } else {
        mapImageUrl = cartoMapPreviewUrl(row.lat, row.lng, 15);
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

    const photos: string[] = gallery
      .filter((g) => g.kind === "photo" || (g.kind === "street" && !g.src.includes("svembed")))
      .map((g) => g.src);
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
