import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/common/crypto";
import { ISTANBUL_VENUES } from "./venues-data";
import { ISTANBUL_SEED_EVENTS } from "./seed-events-data";
import { ISTANBUL_CITY_NOTES } from "./seed-city-notes";

const prisma = new PrismaClient();

/**
 * Seed = real venues + admin + city calendar facts + editorial city notes.
 * Never invent Dorham COMMUNITY gathers unless SEED_DEMO_EVENTS=1 (dev only).
 */
async function main() {
  const email = "host@dorham.app";
  const passwordHash = await hashPassword("DorhamHost1");
  await prisma.user.upsert({
    where: { email },
    update: {
      role: "ADMIN",
      emailVerifiedAt: new Date(),
      profile: {
        upsert: {
          create: {
            displayName: "سارا · میزبان استانبول",
            bio: "میزبان نمونهٔ دورهم در استانبول — رویداد واقعی، مکان ایرانی، مهمان‌لیست.",
            city: "istanbul",
            country: "TR",
          },
          update: {
            displayName: "سارا · میزبان استانبول",
            bio: "میزبان نمونهٔ دورهم در استانبول — رویداد واقعی، مکان ایرانی، مهمان‌لیست.",
          },
        },
      },
    },
    create: {
      email,
      passwordHash,
      role: "ADMIN",
      locale: "FA",
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: "سارا · میزبان استانبول",
          bio: "میزبان نمونهٔ دورهم در استانبول — رویداد واقعی، مکان ایرانی، مهمان‌لیست.",
          city: "istanbul",
          country: "TR",
        },
      },
      verification: { create: { status: "VERIFIED" } },
    },
  });

  for (const venue of ISTANBUL_VENUES) {
    await prisma.venue.upsert({
      where: { slug: venue.slug },
      update: {
        name: venue.name,
        kind: venue.kind,
        area: venue.area,
        address: venue.address,
        mapsQuery: venue.mapsQuery,
        lat: venue.lat,
        lng: venue.lng,
        phone: venue.phone,
        website: venue.website,
        hours: venue.hours,
        priceRange: venue.priceRange ?? null,
        menuNotes: venue.menuNotes ?? null,
        description: venue.description,
        published: true,
      },
      create: {
        slug: venue.slug,
        name: venue.name,
        kind: venue.kind,
        city: "istanbul",
        area: venue.area,
        address: venue.address,
        mapsQuery: venue.mapsQuery,
        lat: venue.lat,
        lng: venue.lng,
        phone: venue.phone,
        website: venue.website,
        hours: venue.hours,
        priceRange: venue.priceRange ?? null,
        menuNotes: venue.menuNotes ?? null,
        description: venue.description,
        photos: [],
      },
    });
  }

  const admin = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!admin) throw new Error("admin missing");

  await prisma.venue.updateMany({
    where: { ownerId: null },
    data: { ownerId: admin.id },
  });

  /** Soft-launch: cancel any leftover seeded demo COMMUNITY rows. */
  const allowDemoCommunity = process.env.SEED_DEMO_EVENTS === "1";
  if (!allowDemoCommunity) {
    const cancelled = await prisma.event.updateMany({
      where: {
        OR: [
          { externalKey: { startsWith: "community:" } },
          { externalKey: { startsWith: "past:community" } },
        ],
        status: "PUBLISHED",
      },
      data: { status: "CANCELLED" },
    });
    if (cancelled.count > 0) {
      console.log(`Cancelled ${cancelled.count} demo COMMUNITY event(s) (SEED_DEMO_EVENTS!=1).`);
    }
  }

  /** Drop low-signal city shows we no longer keep in seed. */
  await prisma.event.updateMany({
    where: {
      externalKey: {
        in: [
          "city:kpop-forever-2026-12-05",
          "city:mathame-2026-08-22",
          "city:sama-abdulhadi-2026-08-28",
          "city:anyma-2026-09-12",
        ],
      },
      status: "PUBLISHED",
    },
    data: { status: "CANCELLED" },
  });

  for (const ev of ISTANBUL_SEED_EVENTS) {
    await prisma.event.upsert({
      where: { externalKey: ev.externalKey },
      update: {
        title: ev.title,
        description: ev.description,
        venue: ev.venue,
        venueSlug: ev.venueSlug ?? null,
        address: ev.address ?? null,
        startsAt: new Date(ev.startsAt),
        endsAt: ev.endsAt ? new Date(ev.endsAt) : null,
        capacity: ev.capacity ?? null,
        priceTry: ev.priceTry ?? 0,
        status: ev.status,
        kind: ev.kind,
        externalTicketUrl: ev.externalTicketUrl ?? null,
        hostId: admin.id,
      },
      create: {
        externalKey: ev.externalKey,
        hostId: admin.id,
        title: ev.title,
        description: ev.description,
        city: "istanbul",
        venue: ev.venue,
        venueSlug: ev.venueSlug ?? null,
        address: ev.address ?? null,
        startsAt: new Date(ev.startsAt),
        endsAt: ev.endsAt ? new Date(ev.endsAt) : null,
        capacity: ev.capacity ?? null,
        priceTry: ev.priceTry ?? 0,
        status: ev.status,
        kind: ev.kind,
        externalTicketUrl: ev.externalTicketUrl ?? null,
        locale: "FA",
      },
    });
  }

  /** Hide keyboard-mash / too-short feed junk. */
  const published = await prisma.post.findMany({
    where: { city: "istanbul", status: "PUBLISHED" },
    select: { id: true, body: true },
  });
  let hidden = 0;
  for (const post of published) {
    if (isJunkFeedBody(post.body)) {
      await prisma.post.update({ where: { id: post.id }, data: { status: "HIDDEN" } });
      hidden += 1;
    }
  }
  if (hidden > 0) console.log(`Hidden ${hidden} junk feed post(s).`);

  /** Upsert editorial city notes (stable marker prefix). */
  for (const note of ISTANBUL_CITY_NOTES) {
    const existing = await prisma.post.findFirst({
      where: { authorId: admin.id, city: "istanbul", body: { startsWith: note.marker } },
      select: { id: true },
    });
    if (existing) {
      await prisma.post.update({
        where: { id: existing.id },
        data: { body: note.body, venueSlug: note.venueSlug ?? null, status: "PUBLISHED", eventId: null },
      });
    } else {
      await prisma.post.create({
        data: {
          authorId: admin.id,
          city: "istanbul",
          body: note.body,
          venueSlug: note.venueSlug ?? null,
          status: "PUBLISHED",
        },
      });
    }
  }
}

function isJunkFeedBody(body: string): boolean {
  const t = body.trim();
  if (t.length < 20) return true;
  if (t.startsWith("[دورهم ·")) return false;
  const letters = t.replace(/\s+/g, "");
  const unique = new Set([...letters]).size;
  if (letters.length >= 16 && unique / letters.length < 0.35) return true;
  // Repeated keyboard mash patterns (e.g. شسی شسی)
  if (/(.)\1{4,}/.test(letters)) return true;
  const tokens = t.split(/\s+/).filter(Boolean);
  if (tokens.length >= 4) {
    const freq = new Map<string, number>();
    for (const tok of tokens) freq.set(tok, (freq.get(tok) ?? 0) + 1);
    const max = Math.max(...freq.values());
    if (max >= 3 && max / tokens.length >= 0.5) return true;
  }
  return false;
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
