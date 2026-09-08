import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ReportBody } from "@dorham/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TrustService {
  constructor(private readonly prisma: PrismaService) {}

  async block(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new ConflictException({ code: "USER_SELF_ACTION", message: "You cannot block yourself." });
    }
    const target = await this.prisma.user.findUnique({ where: { id: blockedId }, select: { id: true, status: true } });
    if (!target || target.status === "DELETED") {
      throw new NotFoundException({ code: "USER_NOT_FOUND", message: "User not found." });
    }
    try {
      await this.prisma.block.create({ data: { blockerId, blockedId } });
    } catch {
      throw new ConflictException({ code: "ALREADY_BLOCKED", message: "This person is already blocked." });
    }
    await this.prisma.auditLog.create({
      data: { userId: blockerId, action: "user.block", entity: "User", entityId: blockedId },
    });
    return { ok: true as const };
  }

  async unblock(blockerId: string, blockedId: string) {
    await this.prisma.block.deleteMany({ where: { blockerId, blockedId } });
    return { ok: true as const };
  }

  async listBlocks(blockerId: string) {
    const rows = await this.prisma.block.findMany({
      where: { blockerId },
      orderBy: { createdAt: "desc" },
      include: { blocked: { include: { profile: true } } },
    });
    return {
      data: rows.map((row) => ({
        id: row.id,
        blockedId: row.blockedId,
        displayName: row.blocked.profile?.displayName ?? "Member",
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async report(reporterId: string, body: ReportBody) {
    if (reporterId === body.targetId) {
      throw new ConflictException({ code: "USER_SELF_ACTION", message: "You cannot report yourself." });
    }
    const target = await this.prisma.user.findUnique({ where: { id: body.targetId }, select: { id: true, status: true } });
    if (!target || target.status === "DELETED") {
      throw new NotFoundException({ code: "USER_NOT_FOUND", message: "User not found." });
    }
    const report = await this.prisma.report.create({
      data: {
        reporterId,
        targetId: body.targetId,
        reason: body.reason,
        details: body.details,
      },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: reporterId,
        action: "user.report",
        entity: "Report",
        entityId: report.id,
        meta: { targetId: body.targetId, reason: body.reason },
      },
    });
    return { ok: true as const, id: report.id };
  }
}
