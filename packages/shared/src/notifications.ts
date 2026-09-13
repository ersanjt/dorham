import { z } from "zod";

export const notificationSchema = z.object({
  id: z.string(),
  kind: z.string(),
  title: z.string(),
  body: z.string(),
  href: z.string().nullable(),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type NotificationDto = z.infer<typeof notificationSchema>;

export const notificationsListSchema = z.object({
  unreadCount: z.number().int().nonnegative(),
  items: z.array(notificationSchema),
});

export type NotificationsList = z.infer<typeof notificationsListSchema>;
