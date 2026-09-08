import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/common/crypto";
import { ISTANBUL_VENUES } from "./venues-data";

const prisma = new PrismaClient();

async function main() {
  const email = "host@dorham.app";
  const passwordHash = await hashPassword("DorhamHost1");
  const host = await prisma.user.upsert({
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
          displayName: "دورهم استانبول",
          bio: "جمعه‌ها دور هم.",
          city: "istanbul",
          country: "TR",
        },
      },
      verification: { create: { status: "VERIFIED" } },
    },
  });

  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + ((5 - startsAt.getDay() + 7) % 7 || 7));
  startsAt.setHours(19, 0, 0, 0);

  const existing = await prisma.event.findFirst({
    where: { hostId: host.id, title: "جمعه دورهم — کافه در کادیکوی" },
  });
  if (!existing) {
    await prisma.event.create({
      data: {
        hostId: host.id,
        title: "جمعه دورهم — کافه در کادیکوی",
        description:
          "اولین دورهم رسمی. چای، معرفی کوتاه، بدون سوایپ. فقط آدم‌های واقعی.",
        city: "istanbul",
        venue: "Kadıköy",
        address: "Kadıköy, Istanbul",
        startsAt,
        capacity: 24,
        priceTry: 200,
        status: "PUBLISHED",
        locale: "FA",
        checkInSecret: crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", ""),
      },
    });
  } else {
    await prisma.event.update({
      where: { id: existing.id },
      data: {
        priceTry: 200,
        checkInSecret: existing.checkInSecret
          ? undefined
          : crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", ""),
      },
    });
  }

  const friday = await prisma.event.findFirst({
    where: { hostId: host.id, title: "جمعه دورهم — کافه در کادیکوی" },
    select: { id: true },
  });

  const seedPosts = [
    {
      startsWith: "جمعه کادیکوی",
      body: "جمعه کادیکوی دور هم می‌شویم. چای، معرفی کوتاه، بدون سوایپ. اگر تازه‌وارد استانبولی، بیا — کارت لایک لازم نیست.",
      venueSlug: "shiraz-kadikoy",
      eventId: friday?.id,
    },
    {
      startsWith: "وسط هفته اکسره",
      body: "وسط هفته اکسره هنوز خیابان ایرانی این شهر است. اگر دلت هوای غذای خودمان را کرده، سفیر و اسومان همین دور و برند.",
      venueSlug: "safir-aksaray",
      eventId: undefined,
    },
  ];

  for (const post of seedPosts) {
    const existing = await prisma.post.findFirst({
      where: { authorId: host.id, body: { startsWith: post.startsWith } },
    });
    if (!existing) {
      await prisma.post.create({
        data: {
          authorId: host.id,
          city: "istanbul",
          body: post.body,
          eventId: post.eventId,
          venueSlug: post.venueSlug,
        },
      });
    } else if (existing.body !== post.body) {
      await prisma.post.update({ where: { id: existing.id }, data: { body: post.body } });
    }
  }

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
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
