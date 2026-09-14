import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ListAdminUsersQuery, SetUserRoleBody } from "@dorham/shared";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { MediaService } from "../media/media.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  async listUsers(query: ListAdminUsersQuery) {
    const where: Prisma.UserWhereInput = {
      status: { not: "DELETED" },
    };
    if (query.role) where.role = query.role;
    if (query.cursor) {
      where.createdAt = { lt: await this.cursorCreatedAt(query.cursor) };
    }
    if (query.q) {
      const q = query.q;
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { profile: { is: { displayName: { contains: q, mode: "insensitive" } } } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.user.count({
        where: {
          status: { not: "DELETED" },
          ...(query.role ? { role: query.role } : {}),
          ...(query.q
            ? {
                OR: [
                  { email: { contains: query.q, mode: "insensitive" } },
                  { profile: { is: { displayName: { contains: query.q, mode: "insensitive" } } } },
                ],
              }
            : {}),
        },
      }),
      this.prisma.user.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: query.limit + 1,
        include: { profile: true, verification: true },
      }),
    ]);

    const page = rows.slice(0, query.limit);
    const next = rows.length > query.limit ? page[page.length - 1]?.id ?? null : null;

    const items = await Promise.all(
      page.map(async (user) => ({
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName ?? "عضو",
        city: user.profile?.city ?? "istanbul",
        role: user.role,
        status: user.status,
        emailVerified: Boolean(user.emailVerifiedAt),
        verificationStatus: user.verification?.status ?? "NONE",
        photoUrl: await this.media.photoUrl(user.profile?.photoId),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
      })),
    );

    return { items, nextCursor: next, total };
  }

  async setRole(actorId: string, userId: string, body: SetUserRoleBody) {
    if (actorId === userId && body.role !== "ADMIN") {
      throw new BadRequestException({
        code: "USER_SELF_ACTION",
        message: "You cannot demote yourself this way.",
      });
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status === "DELETED") {
      throw new NotFoundException({ code: "USER_NOT_FOUND", message: "User not found." });
    }
    await this.prisma.user.update({ where: { id: userId }, data: { role: body.role } });
    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "admin.set_role",
        entity: "User",
        entityId: userId,
        meta: { role: body.role },
      },
    });
    return { ok: true as const, role: body.role };
  }

  async listReports() {
    const [person, feed] = await Promise.all([
      this.prisma.report.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
        include: {
          reporter: { include: { profile: true } },
          target: { include: { profile: true } },
        },
      }),
      this.prisma.feedReport.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
        include: { reporter: { include: { profile: true } } },
      }),
    ]);

    return {
      data: {
        people: person.map((row) => ({
          id: row.id,
          reason: row.reason,
          details: row.details,
          status: row.status,
          createdAt: row.createdAt.toISOString(),
          reporter: {
            id: row.reporterId,
            displayName: row.reporter.profile?.displayName ?? "عضو",
          },
          reported: {
            id: row.targetId,
            displayName: row.target.profile?.displayName ?? "عضو",
          },
        })),
        feed: feed.map((row) => ({
          id: row.id,
          targetType: row.targetType,
          targetId: row.targetId,
          postId: row.postId,
          reason: row.reason,
          details: row.details,
          status: row.status,
          createdAt: row.createdAt.toISOString(),
          reporter: {
            id: row.reporterId,
            displayName: row.reporter.profile?.displayName ?? "عضو",
          },
        })),
      },
    };
  }

  async resolveReport(kind: "people" | "feed", id: string, actorId: string) {
    if (kind === "people") {
      const row = await this.prisma.report.findUnique({ where: { id } });
      if (!row) throw new NotFoundException({ code: "REPORT_INVALID", message: "Report not found." });
      await this.prisma.report.update({ where: { id }, data: { status: "resolved" } });
    } else {
      const row = await this.prisma.feedReport.findUnique({ where: { id } });
      if (!row) throw new NotFoundException({ code: "REPORT_INVALID", message: "Report not found." });
      await this.prisma.feedReport.update({ where: { id }, data: { status: "resolved" } });
    }
    await this.prisma.auditLog.create({
      data: { userId: actorId, action: "admin.resolve_report", entity: kind, entityId: id },
    });
    return { ok: true as const };
  }

  private async cursorCreatedAt(cursor: string) {
    const row = await this.prisma.user.findUnique({ where: { id: cursor }, select: { createdAt: true } });
    if (!row) {
      throw new BadRequestException({ code: "VALIDATION_FAILED", message: "Invalid cursor." });
    }
    return row.createdAt;
  }
}
