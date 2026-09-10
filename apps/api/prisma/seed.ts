import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/common/crypto";
import { ISTANBUL_VENUES } from "./venues-data";

const prisma = new PrismaClient();

/**
 * Seed = real venue directory + local admin only.
 * No fabricated events or feed posts (see docs/08-data-policy.md).
 */
async function main() {
  const email = "host@dorham.app";
  const passwordHash = await hashPassword("DorhamHost1");
  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", emailVerifiedAt: new Date() },
    create: {
      email,
      passwordHash,
      role: "ADMIN",
      locale: "FA",
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: "میزبان محلی (توسعه)",
          bio: "حساب فنی برای تست ورود — رویداد واقعی را از اپ بساز.",
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
      },
    });
  }

  // Drop any older demo gatherings / posts from previous seed versions.
  await prisma.post.deleteMany({
    where: {
      OR: [
        { body: { startsWith: "جمعه کادیکوی" } },
        { body: { startsWith: "وسط هفته اکسره" } },
      ],
    },
  });
  await prisma.event.deleteMany({
    where: {
      title: {
        in: [
          "جمعه دورهم — کافه در کادیکوی",
          "وسط‌هفته آکسارای — شام کوتاه",
          "جمعهٔ بعد — تکسیم دامو",
          "کافه کتاب چشمه — کادیکوی",
        ],
      },
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
