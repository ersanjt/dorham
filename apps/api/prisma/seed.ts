import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/common/crypto";
import { ISTANBUL_VENUES } from "./venues-data";
import { ISTANBUL_SEED_EVENTS } from "./seed-events-data";

const prisma = new PrismaClient();

/**
 * Seed = real venues + admin + city calendar facts + a few Dorham community gathers.
 * CITY_SHOW is discovery (outbound tickets). COMMUNITY is Dorham RSVP/door.
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
            bio: "میزبان نمونهٔ دورهم در استانبول.",
            city: "istanbul",
            country: "TR",
          },
          update: {
            displayName: "سارا · میزبان استانبول",
            bio: "میزبان نمونهٔ دورهم در استانبول.",
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
          bio: "میزبان نمونهٔ دورهم در استانبول.",
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

  /** Soft-launch: never invent Dorham COMMUNITY gathers unless explicitly opted in. */
  const allowDemoCommunity = process.env.SEED_DEMO_EVENTS === "1";
  const communityDemo = ISTANBUL_SEED_EVENTS.filter((ev) => ev.kind === "COMMUNITY");
  const calendarShows = ISTANBUL_SEED_EVENTS.filter((ev) => ev.kind !== "COMMUNITY");

  if (!allowDemoCommunity) {
    const cancelled = await prisma.event.updateMany({
      where: {
        externalKey: { in: communityDemo.map((ev) => ev.externalKey) },
        status: "PUBLISHED",
      },
      data: { status: "CANCELLED" },
    });
    if (cancelled.count > 0) {
      console.log(`Cancelled ${cancelled.count} demo COMMUNITY event(s) (SEED_DEMO_EVENTS!=1).`);
    }
  }

  const toUpsert = allowDemoCommunity ? ISTANBUL_SEED_EVENTS : calendarShows;

  for (const ev of toUpsert) {
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
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
