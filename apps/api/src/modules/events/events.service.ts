import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CheckInBody, CreateEventBody, ListEventsQuery, UpdateEventBody } from "@dorham/shared";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { assertActive, assertNotDeleted, assertNotSuspended } from "../../common/account-status";
import { newOpaqueToken, secretsEqual } from "../../common/crypto";
import { loadEnv } from "../../config/env";
import { MediaService } from "../media/media.service";

@Injectable()
export class EventsService {
  private readonly env = loadEnv();

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  async list(query: ListEventsQuery) {
    const limit = query.limit;
    const where: Prisma.EventWhereInput = {
      city: query.city,
      status: "PUBLISHED",
      startsAt: { gte: new Date(Date.now() - 6 * 3600_000) },
    };
    if (query.hostId) {
      where.hostId = query.hostId;
    }
    if (query.venueSlug) {
      where.venueSlug = query.venueSlug;
    }
    if (query.cursor) {
      where.id = { lt: query.cursor };
    }

    const rows = await this.prisma.event.findMany({
      where,
      orderBy: [{ startsAt: "asc" }, { id: "desc" }],
      take: limit + 1,
      include: this.eventInclude(),
    });

    const page = rows.slice(0, limit);
    const next = rows[limit];
    const waitlists = await this.waitlistCounts(page.map((row) => row.id));
    return {
      data: page.map((row) => this.toDto(row, waitlists.get(row.id) ?? 0)),
      page: { nextCursor: next?.id ?? null, limit },
    };
  }

  async get(id: string, viewerId?: string) {
    const row = await this.prisma.event.findFirst({
      where: { id, status: { in: ["PUBLISHED", "CANCELLED", "ENDED"] } },
      include: this.eventInclude(),
    });
    if (!row) {
      throw new NotFoundException({ code: "EVENT_NOT_FOUND", message: "Event not found." });
    }
    const waitlists = await this.waitlistCounts([row.id]);
    const myRsvp = await this.viewerRsvp(row.id, viewerId);
    return { data: this.toDto(row, waitlists.get(row.id) ?? 0, myRsvp) };
  }

  async mine(userId: string) {
    const rows = await this.prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        startsAt: { gte: new Date(Date.now() - 6 * 3600_000) },
        OR: [
          { hostId: userId },
          { rsvps: { some: { userId, status: { in: ["GOING", "INTERESTED"] } } } },
        ],
      },
      orderBy: [{ startsAt: "asc" }, { id: "desc" }],
      take: 20,
      include: this.eventInclude(),
    });
    const waitlists = await this.waitlistCounts(rows.map((row) => row.id));
    const rsvps = await this.prisma.eventRsvp.findMany({
      where: { userId, eventId: { in: rows.map((row) => row.id) }, status: { in: ["GOING", "INTERESTED"] } },
    });
    const byEvent = new Map(rsvps.map((row) => [row.eventId, row]));
    return {
      data: rows.map((row) => {
        const mine = byEvent.get(row.id);
        return this.toDto(
          row,
          waitlists.get(row.id) ?? 0,
          mine
            ? {
                status: mine.status as "GOING" | "INTERESTED",
                ticketStatus: mine.ticketStatus as "NONE" | "DUE" | "PAID_DOOR",
                checkedInAt: mine.checkedInAt?.toISOString() ?? null,
              }
            : null,
        );
      }),
    };
  }

  async create(hostId: string, body: CreateEventBody) {
    const host = await this.prisma.user.findUnique({ where: { id: hostId }, select: { status: true } });
    assertActive(host?.status ?? "DELETED");

    let venue = body.venue ?? null;
    let address = body.address ?? null;
    let venueSlug = body.venueSlug ?? null;
    let lat: number | null = null;
    let lng: number | null = null;

    if (venueSlug) {
      const place = await this.prisma.venue.findFirst({
        where: { slug: venueSlug, published: true, city: body.city },
      });
      if (!place) {
        throw new BadRequestException({ code: "VENUE_NOT_FOUND", message: "Venue not found." });
      }
      venue = place.name;
      address = place.address;
      lat = place.lat;
      lng = place.lng;
      venueSlug = place.slug;
    }

    const row = await this.prisma.event.create({
      data: {
        hostId,
        title: body.title,
        description: body.description,
        city: body.city,
        venue,
        venueSlug,
        address,
        lat,
        lng,
        startsAt: new Date(body.startsAt),
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        capacity: body.capacity,
        priceTry: body.priceTry ?? 0,
        status: "PUBLISHED",
        checkInSecret: newOpaqueToken(),
      },
      include: this.eventInclude(),
    });
    await this.prisma.auditLog.create({
      data: { userId: hostId, action: "event.create", entity: "Event", entityId: row.id },
    });
    return { data: this.toDto(row, 0) };
  }

  async update(eventId: string, actor: { id: string; role: string }, body: UpdateEventBody) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException({ code: "EVENT_NOT_FOUND", message: "Event not found." });
    }
    if (event.status === "CANCELLED" || event.status === "ENDED") {
      throw new BadRequestException({ code: "EVENT_CANCELLED", message: "Event cannot be edited." });
    }
    this.assertHostOrStaff(event.hostId, actor);

    let venue = body.venue;
    let address = body.address;
    let venueSlug = body.venueSlug;
    let lat: number | null | undefined;
    let lng: number | null | undefined;
    const city = body.city ?? event.city;

    if (body.venueSlug) {
      const place = await this.prisma.venue.findFirst({
        where: { slug: body.venueSlug, published: true, city },
      });
      if (!place) {
        throw new BadRequestException({ code: "VENUE_NOT_FOUND", message: "Venue not found." });
      }
      venue = place.name;
      address = place.address;
      lat = place.lat;
      lng = place.lng;
      venueSlug = place.slug;
    }

    const row = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.city !== undefined ? { city: body.city } : {}),
        ...(venue !== undefined ? { venue } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(venueSlug !== undefined ? { venueSlug } : {}),
        ...(lat !== undefined ? { lat } : {}),
        ...(lng !== undefined ? { lng } : {}),
        ...(body.startsAt !== undefined ? { startsAt: new Date(body.startsAt) } : {}),
        ...(body.endsAt !== undefined ? { endsAt: body.endsAt ? new Date(body.endsAt) : null } : {}),
        ...(body.capacity !== undefined ? { capacity: body.capacity } : {}),
        ...(body.priceTry !== undefined ? { priceTry: body.priceTry } : {}),
      },
      include: this.eventInclude(),
    });
    await this.prisma.auditLog.create({
      data: { userId: actor.id, action: "event.update", entity: "Event", entityId: row.id },
    });
    const waitlists = await this.waitlistCounts([row.id]);
    return { data: this.toDto(row, waitlists.get(row.id) ?? 0) };
  }

  async cancelEvent(eventId: string, actor: { id: string; role: string }) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException({ code: "EVENT_NOT_FOUND", message: "Event not found." });
    }
    if (event.status === "CANCELLED") {
      return { data: { ok: true as const } };
    }
    this.assertHostOrStaff(event.hostId, actor);
    await this.prisma.event.update({
      where: { id: eventId },
      data: { status: "CANCELLED" },
    });
    await this.prisma.auditLog.create({
      data: { userId: actor.id, action: "event.cancel", entity: "Event", entityId: eventId },
    });
    return { data: { ok: true as const } };
  }

  private assertHostOrStaff(hostId: string, actor: { id: string; role: string }) {
    if (actor.id === hostId || actor.role === "ADMIN" || actor.role === "MODERATOR") return;
    throw new ForbiddenException({ code: "AUTH_FORBIDDEN", message: "Only the host can do this." });
  }

  async rsvp(eventId: string, userId: string) {
    const account = await this.prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
    assertActive(account?.status ?? "DELETED");

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { rsvps: { where: { status: "GOING" } } } } },
    });
    if (!event || event.status !== "PUBLISHED") {
      throw new NotFoundException({ code: "EVENT_NOT_FOUND", message: "Event not found." });
    }

    const blocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: event.hostId },
          { blockerId: event.hostId, blockedId: userId },
        ],
      },
    });
    if (blocked) {
      throw new ForbiddenException({ code: "AUTH_FORBIDDEN", message: "You cannot join this event." });
    }

    const existing = await this.prisma.eventRsvp.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (existing?.status === "GOING") {
      return {
        data: {
          ok: true as const,
          status: "GOING" as const,
          waitlisted: false,
          ticketStatus: existing.ticketStatus as "NONE" | "DUE" | "PAID_DOOR",
        },
      };
    }

    const full = Boolean(event.capacity && event._count.rsvps >= event.capacity);
    const status = full ? "INTERESTED" : "GOING";
    const ticketStatus = !full && event.priceTry > 0 ? "DUE" : "NONE";
    await this.prisma.eventRsvp.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, status, ticketStatus },
      update: { status, ticketStatus },
    });
    return { data: { ok: true as const, status, waitlisted: full, ticketStatus } };
  }

  async cancelRsvp(eventId: string, userId: string) {
    // PAUSED may still cancel so a seat frees for the waitlist.
    const account = await this.prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
    assertNotDeleted(account?.status ?? "DELETED");
    assertNotSuspended(account?.status ?? "DELETED");
    const current = await this.prisma.eventRsvp.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    await this.prisma.eventRsvp.updateMany({
      where: { eventId, userId },
      data: { status: "CANCELLED", checkedInAt: null, ticketStatus: "NONE" },
    });
    if (current?.status === "GOING") {
      const event = await this.prisma.event.findUnique({ where: { id: eventId }, select: { priceTry: true } });
      const next = await this.prisma.eventRsvp.findFirst({
        where: { eventId, status: "INTERESTED" },
        orderBy: { createdAt: "asc" },
      });
      if (next) {
        await this.prisma.eventRsvp.update({
          where: { id: next.id },
          data: {
            status: "GOING",
            ticketStatus: (event?.priceTry ?? 0) > 0 ? "DUE" : "NONE",
          },
        });
      }
    }
    return { data: { ok: true as const } };
  }

  async guests(eventId: string, viewerId?: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, status: { in: ["PUBLISHED", "CANCELLED", "ENDED"] } },
      select: { id: true },
    });
    if (!event) {
      throw new NotFoundException({ code: "EVENT_NOT_FOUND", message: "Event not found." });
    }

    const hidden = viewerId
      ? await this.prisma.block.findMany({
          where: { OR: [{ blockerId: viewerId }, { blockedId: viewerId }] },
          select: { blockerId: true, blockedId: true },
        })
      : [];
    const hide = new Set(
      hidden.flatMap((row) => (row.blockerId === viewerId ? [row.blockedId] : [row.blockerId])),
    );

    const rows = await this.prisma.eventRsvp.findMany({
      where: { eventId, status: { in: ["GOING", "INTERESTED"] } },
      orderBy: { createdAt: "asc" },
      include: {
        user: { include: { profile: true, verification: true } },
      },
    });

    return {
      data: await Promise.all(
        rows
          .filter((row) => !hide.has(row.userId))
          .map(async (row) => ({
            id: row.userId,
            displayName: row.user.profile?.displayName ?? "Member",
            verificationStatus: row.user.verification?.status ?? "NONE",
            photoUrl: await this.media.photoUrl(row.user.profile?.photoId),
            status: row.status as "GOING" | "INTERESTED",
            ticketStatus: viewerId ? (row.ticketStatus as "NONE" | "DUE" | "PAID_DOOR") : "NONE",
            checkedInAt: viewerId ? (row.checkedInAt?.toISOString() ?? null) : null,
          })),
      ),
    };
  }

  async door(eventId: string, actor: { id: string; role: string }) {
    const event = await this.requireHostEvent(eventId, actor);
    const secret = await this.ensureSecret(event.id, event.checkInSecret);
    const [goingCount, checkedInCount, dueCount, paidCount] = await Promise.all([
      this.prisma.eventRsvp.count({ where: { eventId, status: "GOING" } }),
      this.prisma.eventRsvp.count({ where: { eventId, status: "GOING", checkedInAt: { not: null } } }),
      this.prisma.eventRsvp.count({ where: { eventId, status: "GOING", ticketStatus: "DUE" } }),
      this.prisma.eventRsvp.count({ where: { eventId, status: "GOING", ticketStatus: "PAID_DOOR" } }),
    ]);
    return {
      data: {
        eventId: event.id,
        title: event.title,
        url: `${this.env.APP_URL}/events/${event.id}/checkin?s=${encodeURIComponent(secret)}`,
        goingCount,
        checkedInCount,
        dueCount,
        paidCount,
      },
    };
  }

  async checkIn(eventId: string, actor: { id: string; role: string }, body: CheckInBody) {
    const account = await this.prisma.user.findUnique({ where: { id: actor.id }, select: { status: true } });
    assertActive(account?.status ?? "DELETED");

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, hostId: true, status: true, checkInSecret: true, title: true },
    });
    if (!event || event.status !== "PUBLISHED") {
      throw new NotFoundException({ code: "EVENT_NOT_FOUND", message: "Event not found." });
    }

    let targetUserId = actor.id;
    if (body.userId) {
      const canHost = event.hostId === actor.id || actor.role === "ADMIN" || actor.role === "MODERATOR";
      if (!canHost) {
        throw new ForbiddenException({ code: "AUTH_FORBIDDEN", message: "Only the host can check someone else in." });
      }
      targetUserId = body.userId;
    } else if (!body.secret || !event.checkInSecret || !secretsEqual(body.secret, event.checkInSecret)) {
      throw new BadRequestException({
        code: "EVENT_CHECKIN_INVALID",
        message: "This check-in code is wrong.",
      });
    }

    const rsvp = await this.prisma.eventRsvp.findUnique({
      where: { eventId_userId: { eventId, userId: targetUserId } },
      include: { user: { include: { profile: true } } },
    });
    if (!rsvp || rsvp.status !== "GOING") {
      throw new BadRequestException({
        code: "EVENT_NOT_GOING",
        message: "This person is not on the going list.",
      });
    }

    const checkedInAt = rsvp.checkedInAt ?? new Date();
    if (!rsvp.checkedInAt) {
      await this.prisma.eventRsvp.update({
        where: { id: rsvp.id },
        data: {
          checkedInAt,
          ticketStatus: rsvp.ticketStatus === "DUE" ? "PAID_DOOR" : rsvp.ticketStatus,
        },
      });
      await this.prisma.auditLog.create({
        data: {
          userId: actor.id,
          action: "event.checkin",
          entity: "Event",
          entityId: eventId,
          meta: { targetUserId },
        },
      });
    }

    return {
      data: {
        ok: true as const,
        already: Boolean(rsvp.checkedInAt),
        displayName: rsvp.user.profile?.displayName ?? "Member",
        checkedInAt: checkedInAt.toISOString(),
        ticketStatus: (rsvp.checkedInAt
          ? rsvp.ticketStatus
          : rsvp.ticketStatus === "DUE"
            ? "PAID_DOOR"
            : rsvp.ticketStatus) as "NONE" | "DUE" | "PAID_DOOR",
      },
    };
  }

  private async requireHostEvent(eventId: string, actor: { id: string; role: string }) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, hostId: true, checkInSecret: true, status: true },
    });
    if (!event) {
      throw new NotFoundException({ code: "EVENT_NOT_FOUND", message: "Event not found." });
    }
    const allowed = event.hostId === actor.id || actor.role === "ADMIN" || actor.role === "MODERATOR";
    if (!allowed) {
      throw new ForbiddenException({ code: "AUTH_FORBIDDEN", message: "Only the host can open the door QR." });
    }
    return event;
  }

  private async ensureSecret(eventId: string, current: string | null) {
    if (current) return current;
    const checkInSecret = newOpaqueToken();
    await this.prisma.event.update({ where: { id: eventId }, data: { checkInSecret } });
    return checkInSecret;
  }

  private async waitlistCounts(eventIds: string[]) {
    if (eventIds.length === 0) return new Map<string, number>();
    const rows = await this.prisma.eventRsvp.groupBy({
      by: ["eventId"],
      where: { eventId: { in: eventIds }, status: "INTERESTED" },
      _count: { _all: true },
    });
    return new Map(rows.map((row) => [row.eventId, row._count._all]));
  }

  private eventInclude() {
    return {
      host: { include: { profile: true } },
      _count: {
        select: {
          rsvps: { where: { status: "GOING" } },
        },
      },
    } satisfies Prisma.EventInclude;
  }

  private async viewerRsvp(eventId: string, viewerId?: string) {
    if (!viewerId) return undefined;
    const row = await this.prisma.eventRsvp.findUnique({
      where: { eventId_userId: { eventId, userId: viewerId } },
    });
    if (!row || (row.status !== "GOING" && row.status !== "INTERESTED")) return null;
    return {
      status: row.status as "GOING" | "INTERESTED",
      ticketStatus: row.ticketStatus as "NONE" | "DUE" | "PAID_DOOR",
      checkedInAt: row.checkedInAt?.toISOString() ?? null,
    };
  }

  private toDto(
    row: {
      id: string;
      title: string;
      description: string;
      city: string;
      venue: string | null;
      venueSlug: string | null;
      address: string | null;
      startsAt: Date;
      endsAt: Date | null;
      capacity: number | null;
      priceTry: number;
      status: string;
      host: { id: string; profile: { displayName: string } | null };
      _count: { rsvps: number };
    },
    waitlistCount = 0,
    myRsvp?: {
      status: "GOING" | "INTERESTED";
      ticketStatus: "NONE" | "DUE" | "PAID_DOOR";
      checkedInAt: string | null;
    } | null,
  ) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      city: row.city as "istanbul" | "ankara" | "izmir",
      venue: row.venue,
      venueSlug: row.venueSlug,
      address: row.address,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt?.toISOString() ?? null,
      capacity: row.capacity,
      goingCount: row._count.rsvps,
      waitlistCount,
      priceTry: row.priceTry,
      status: row.status,
      host: {
        id: row.host.id,
        displayName: row.host.profile?.displayName ?? "Host",
      },
      ...(myRsvp !== undefined ? { myRsvp } : {}),
    };
  }
}
