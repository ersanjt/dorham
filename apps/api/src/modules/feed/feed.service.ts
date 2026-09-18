import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateCommentBody, CreatePostBody, FeedReportBody, ListFeedQuery } from "@dorham/shared";
import { Prisma, UserRole, VerificationStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { assertActive } from "../../common/account-status";
import { MediaService } from "../media/media.service";

const authorInclude = {
  profile: true,
  verification: true,
} as const;

const hiddenAuthorStatuses = ["DELETED", "SUSPENDED", "PAUSED"] as const;

type AuthorRow = {
  id: string;
  status: string;
  profile: { displayName: string; photoId: string | null } | null;
  verification: { status: VerificationStatus } | null;
};

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  async list(query: ListFeedQuery, viewerId?: string) {
    const blocked = await this.blockedIds(viewerId);
    const cursor = this.parseCursor(query.cursor);
    const where: Prisma.PostWhereInput = {
      city: query.city,
      status: "PUBLISHED",
      author: { status: { notIn: [...hiddenAuthorStatuses] } },
      ...(blocked.length ? { authorId: { notIn: blocked } } : {}),
      ...(cursor
        ? {
            OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }],
          }
        : {}),
    };

    const rows = await this.prisma.post.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: Math.min((query.limit + 1) * 3, 80),
      include: {
        author: { include: authorInclude },
        _count: { select: { comments: true } },
      },
    });

    const usable = rows.filter((row) => row.body.trim().length >= 20);
    const page = usable.slice(0, query.limit);
    const next = usable[query.limit];
    return {
      data: await Promise.all(page.map((row) => this.toPostDto(row))),
      page: {
        nextCursor: next ? this.encodeCursor(next.createdAt, next.id) : null,
        limit: query.limit,
      },
    };
  }

  async get(id: string, viewerId?: string) {
    const row = await this.loadPublished(id, viewerId);
    const commentCount = await this.prisma.postComment.count({ where: { postId: row.id } });
    return { data: await this.toPostDto({ ...row, _count: { comments: commentCount } }) };
  }

  async create(authorId: string, body: CreatePostBody) {
    const user = await this.prisma.user.findUnique({
      where: { id: authorId },
      include: { verification: true },
    });
    assertActive(user?.status ?? "DELETED");
    this.assertCanPost(user?.role ?? "MEMBER", user?.verification?.status ?? "NONE");

    if (body.eventId) {
      const event = await this.prisma.event.findFirst({
        where: { id: body.eventId, status: "PUBLISHED" },
        select: { id: true },
      });
      if (!event) {
        throw new NotFoundException({ code: "EVENT_NOT_FOUND", message: "Event not found." });
      }
    }
    if (body.venueSlug) {
      const venue = await this.prisma.venue.findFirst({
        where: { slug: body.venueSlug, published: true },
        select: { slug: true },
      });
      if (!venue) {
        throw new NotFoundException({ code: "VENUE_NOT_FOUND", message: "Venue not found." });
      }
    }

    const row = await this.prisma.post.create({
      data: {
        authorId,
        city: body.city,
        body: body.body,
        eventId: body.eventId,
        venueSlug: body.venueSlug,
      },
      include: { author: { include: authorInclude }, _count: { select: { comments: true } } },
    });
    await this.prisma.auditLog.create({
      data: { userId: authorId, action: "feed.post", entity: "Post", entityId: row.id },
    });
    return { data: await this.toPostDto(row) };
  }

  async remove(id: string, actor: { id: string; role: UserRole }) {
    const row = await this.prisma.post.findUnique({ where: { id }, select: { id: true, authorId: true, status: true } });
    if (!row || row.status === "HIDDEN") {
      throw new NotFoundException({ code: "POST_NOT_FOUND", message: "Post not found." });
    }
    const privileged = actor.role === "MODERATOR" || actor.role === "ADMIN";
    if (row.authorId !== actor.id && !privileged) {
      throw new ForbiddenException({ code: "FEED_FORBIDDEN", message: "You cannot remove this post." });
    }
    await this.prisma.post.update({ where: { id }, data: { status: "HIDDEN" } });
    await this.prisma.auditLog.create({
      data: { userId: actor.id, action: "feed.hide", entity: "Post", entityId: id },
    });
    return { ok: true as const };
  }

  async comments(postId: string, viewerId?: string) {
    await this.loadPublished(postId, viewerId);
    const blocked = await this.blockedIds(viewerId);
    const rows = await this.prisma.postComment.findMany({
      where: {
        postId,
        author: { status: { notIn: [...hiddenAuthorStatuses] } },
        ...(blocked.length ? { authorId: { notIn: blocked } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: 50,
      include: { author: { include: authorInclude } },
    });
    return { data: await Promise.all(rows.map((row) => this.toCommentDto(row))) };
  }

  async comment(postId: string, authorId: string, body: CreateCommentBody) {
    await this.loadPublished(postId, authorId);
    const user = await this.prisma.user.findUnique({ where: { id: authorId }, select: { status: true } });
    assertActive(user?.status ?? "DELETED");
    const row = await this.prisma.postComment.create({
      data: { postId, authorId, body: body.body },
      include: { author: { include: authorInclude } },
    });
    return { data: await this.toCommentDto(row) };
  }

  async report(postId: string, reporterId: string, body: FeedReportBody) {
    const post = await this.loadPublished(postId, reporterId);
    if (post.authorId === reporterId) {
      throw new ForbiddenException({ code: "USER_SELF_ACTION", message: "You cannot report your own post." });
    }
    const user = await this.prisma.user.findUnique({ where: { id: reporterId }, select: { status: true } });
    assertActive(user?.status ?? "DELETED");
    const existing = await this.prisma.feedReport.findFirst({
      where: { reporterId, targetType: "POST", targetId: postId },
    });
    if (existing) return { ok: true as const, id: existing.id };
    const report = await this.prisma.feedReport.create({
      data: {
        reporterId,
        targetType: "POST",
        targetId: postId,
        postId,
        reason: body.reason,
        details: body.details,
      },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: reporterId,
        action: "feed.report",
        entity: "FeedReport",
        entityId: report.id,
        meta: { postId, reason: body.reason },
      },
    });
    return { ok: true as const, id: report.id };
  }

  private async loadPublished(id: string, viewerId?: string) {
    const row = await this.prisma.post.findFirst({
      where: { id, status: "PUBLISHED" },
      include: { author: { include: authorInclude } },
    });
    if (!row || hiddenAuthorStatuses.includes(row.author.status as (typeof hiddenAuthorStatuses)[number])) {
      throw new NotFoundException({ code: "POST_NOT_FOUND", message: "Post not found." });
    }
    if (viewerId && (await this.isBlockedEitherWay(viewerId, row.authorId))) {
      throw new NotFoundException({ code: "POST_NOT_FOUND", message: "Post not found." });
    }
    return row;
  }

  private assertCanPost(role: UserRole, verification: VerificationStatus) {
    if (role === "HOST" || role === "MODERATOR" || role === "ADMIN") return;
    if (verification === "VERIFIED") return;
    throw new ForbiddenException({
      code: "FEED_FORBIDDEN",
      message: "Only hosts and verified members can post.",
    });
  }

  private async blockedIds(viewerId?: string) {
    if (!viewerId) return [];
    const rows = await this.prisma.block.findMany({
      where: { OR: [{ blockerId: viewerId }, { blockedId: viewerId }] },
      select: { blockerId: true, blockedId: true },
    });
    return [...new Set(rows.map((row) => (row.blockerId === viewerId ? row.blockedId : row.blockerId)))];
  }

  private async isBlockedEitherWay(a: string, b: string) {
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

  private parseCursor(cursor?: string) {
    if (!cursor) return null;
    const idx = cursor.lastIndexOf("_");
    if (idx <= 0) {
      throw new BadRequestException({ code: "VALIDATION_FAILED", message: "Request is invalid." });
    }
    const createdAt = new Date(cursor.slice(0, idx));
    const id = cursor.slice(idx + 1);
    if (Number.isNaN(createdAt.getTime()) || !id) {
      throw new BadRequestException({ code: "VALIDATION_FAILED", message: "Request is invalid." });
    }
    return { createdAt, id };
  }

  private encodeCursor(createdAt: Date, id: string) {
    return `${createdAt.toISOString()}_${id}`;
  }

  private async toAuthor(author: AuthorRow) {
    return {
      id: author.id,
      displayName: author.profile?.displayName ?? "عضو",
      photoUrl: await this.media.photoUrl(author.profile?.photoId),
      verificationStatus: author.verification?.status ?? "NONE",
    };
  }

  private async toPostDto(row: {
    id: string;
    body: string;
    city: string;
    eventId: string | null;
    venueSlug: string | null;
    createdAt: Date;
    author: AuthorRow;
    _count: { comments: number };
  }) {
    return {
      id: row.id,
      body: row.body,
      city: row.city as "istanbul" | "ankara" | "izmir",
      eventId: row.eventId,
      venueSlug: row.venueSlug,
      commentCount: row._count.comments,
      author: await this.toAuthor(row.author),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async toCommentDto(row: { id: string; body: string; createdAt: Date; author: AuthorRow }) {
    return {
      id: row.id,
      body: row.body,
      author: await this.toAuthor(row.author),
      createdAt: row.createdAt.toISOString(),
    };
  }
}
