import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async push(input: {
    userId: string;
    kind: string;
    title: string;
    body: string;
    href?: string | null;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        kind: input.kind,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
      },
    });
  }

  async listForUser(userId: string) {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return {
      unreadCount,
      items: items.map((row) => ({
        id: row.id,
        kind: row.kind,
        title: row.title,
        body: row.body,
        href: row.href,
        readAt: row.readAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async markRead(userId: string, id?: string) {
    if (id) {
      await this.prisma.notification.updateMany({
        where: { id, userId, readAt: null },
        data: { readAt: new Date() },
      });
    } else {
      await this.prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      });
    }
    return { ok: true as const };
  }
}
