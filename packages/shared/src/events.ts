import { z } from "zod";
import { CITIES } from "./cities.js";

export const eventStatusSchema = z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "ENDED"]);

export const ticketStatusSchema = z.enum(["NONE", "DUE", "PAID_DOOR"]);
export type TicketStatus = z.infer<typeof ticketStatusSchema>;

export const myRsvpSchema = z
  .object({
    status: z.enum(["GOING", "INTERESTED"]),
    ticketStatus: ticketStatusSchema,
    checkedInAt: z.string().datetime().nullable(),
  })
  .nullable();

export type MyRsvp = z.infer<typeof myRsvpSchema>;

export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  city: z.enum(CITIES),
  venue: z.string().nullable(),
  address: z.string().nullable(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().nullable(),
  capacity: z.number().int().positive().nullable(),
  goingCount: z.number().int().nonnegative(),
  waitlistCount: z.number().int().nonnegative(),
  priceTry: z.number().int().nonnegative(),
  status: eventStatusSchema,
  host: z.object({
    id: z.string(),
    displayName: z.string(),
  }),
  myRsvp: myRsvpSchema.optional(),
});

export type EventDto = z.infer<typeof eventSchema>;

export const listEventsQuerySchema = z.object({
  city: z.enum(CITIES).default("istanbul"),
  hostId: z.string().min(8).max(64).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;

export const createEventBodySchema = z.object({
  title: z.string().trim().min(4).max(80),
  description: z.string().trim().min(10).max(4000),
  city: z.enum(CITIES).default("istanbul"),
  venue: z.string().trim().max(120).optional(),
  address: z.string().trim().max(200).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  capacity: z.number().int().min(2).max(500).optional(),
  priceTry: z.number().int().min(0).max(2500).optional(),
});

export type CreateEventBody = z.infer<typeof createEventBodySchema>;

export const eventGuestSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  verificationStatus: z.enum(["NONE", "PENDING", "VERIFIED", "REJECTED"]),
  photoUrl: z.string().nullable(),
  status: z.enum(["GOING", "INTERESTED"]),
  ticketStatus: ticketStatusSchema,
  checkedInAt: z.string().datetime().nullable(),
});

export type EventGuest = z.infer<typeof eventGuestSchema>;

export const rsvpResultSchema = z.object({
  ok: z.literal(true),
  status: z.enum(["GOING", "INTERESTED"]),
  waitlisted: z.boolean(),
  ticketStatus: ticketStatusSchema,
});

export type RsvpResult = z.infer<typeof rsvpResultSchema>;

export const checkInBodySchema = z
  .object({
    secret: z.string().min(8).max(200).optional(),
    userId: z.string().min(8).max(64).optional(),
  })
  .refine((v) => Boolean(v.secret || v.userId), { message: "secret or userId is required" });

export type CheckInBody = z.infer<typeof checkInBodySchema>;

export const checkInResultSchema = z.object({
  ok: z.literal(true),
  already: z.boolean(),
  displayName: z.string(),
  checkedInAt: z.string().datetime(),
  ticketStatus: ticketStatusSchema,
});

export type CheckInResult = z.infer<typeof checkInResultSchema>;

export const eventDoorSchema = z.object({
  eventId: z.string(),
  title: z.string(),
  url: z.string(),
  goingCount: z.number().int().nonnegative(),
  checkedInCount: z.number().int().nonnegative(),
  dueCount: z.number().int().nonnegative(),
  paidCount: z.number().int().nonnegative(),
});

export type EventDoor = z.infer<typeof eventDoorSchema>;
