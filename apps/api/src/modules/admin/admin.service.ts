import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { SetUserRoleBody } from "@dorham/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

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
}
