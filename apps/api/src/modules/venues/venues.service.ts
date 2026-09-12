import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateVenueReviewBody, ListVenuesQuery, SubmitVenueBody } from "@dorham/shared";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { assertActive } from "../../common/account-status";

import { loadEnv } from "../../config/env";
import { cartoMapPreviewUrl } from "./map-preview";

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
    _count: { reviews: number };
  }) {
    const mapsUrl = row.mapsQuery.startsWith("http")
      ? row.mapsQuery
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.mapsQuery)}`;

    let mapImageUrl: string | null = null;
    let mapsEmbedUrl: string | null = null;
    if (row.lat != null && row.lng != null) {
      const key = this.env.GOOGLE_MAPS_API_KEY?.trim();
      if (key) {
        const marker = `${row.lat},${row.lng}`;
        mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${marker}&zoom=16&size=640x360&scale=2&maptype=roadmap&markers=color:0xB12E28%7C${marker}&key=${encodeURIComponent(key)}`;
      } else {
        mapImageUrl = cartoMapPreviewUrl(row.lat, row.lng, 15);
      }
      mapsEmbedUrl = `https://maps.google.com/maps?q=${row.lat},${row.lng}&z=16&hl=tr&output=embed`;
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
