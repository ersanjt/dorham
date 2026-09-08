import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AttachMediaBody, ListVerificationsQuery, ReviewVerificationBody } from "@dorham/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { MediaService } from "../media/media.service";

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  async mine(userId: string) {
    const row = await this.prisma.verification.upsert({
      where: { userId },
      create: { userId, status: "NONE" },
      update: {},
    });
    return {
      status: row.status,
      notes: row.notes,
      photoUrl: row.assetKey ? this.media.signedUrl(row.assetKey, 5 * 60) : null,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
    };
  }

  async submit(userId: string, body: AttachMediaBody) {
    const current = await this.prisma.verification.findUnique({ where: { userId } });
    if (current?.status === "VERIFIED") {
      throw new BadRequestException({
        code: "VERIFICATION_INVALID",
        message: "This account is already verified.",
      });
    }
    await this.media.requireOwned(userId, body.mediaId, "VERIFICATION");
    await this.prisma.verification.upsert({
      where: { userId },
      create: { userId, status: "PENDING", assetKey: body.mediaId, notes: null, reviewedAt: null },
      update: { status: "PENDING", assetKey: body.mediaId, notes: null, reviewedAt: null },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: "verification.submit", entity: "Verification", entityId: userId },
    });
    return this.mine(userId);
  }

  async queue(query: ListVerificationsQuery) {
    const rows = await this.prisma.verification.findMany({
      where: { status: query.status },
      orderBy: { createdAt: "asc" },
      take: query.limit,
      include: { user: { include: { profile: true } } },
    });
    return {
      data: rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        displayName: row.user.profile?.displayName ?? "Member",
        status: row.status,
        photoUrl: row.assetKey ? this.media.signedUrl(row.assetKey, 5 * 60) : null,
        createdAt: row.createdAt.toISOString(),
      })),
      page: { nextCursor: null, limit: query.limit },
    };
  }

  async review(reviewerId: string, id: string, body: ReviewVerificationBody) {
    const row = await this.prisma.verification.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException({ code: "VERIFICATION_NOT_FOUND", message: "Verification not found." });
    }
    await this.prisma.verification.update({
      where: { id },
      data: { status: body.status, notes: body.notes ?? null, reviewedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: reviewerId,
        action: `verification.${body.status.toLowerCase()}`,
        entity: "Verification",
        entityId: id,
        meta: { targetUserId: row.userId },
      },
    });
    return this.queue({ status: "PENDING", limit: 20 });
  }
}
