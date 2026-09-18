/**
 * Istanbul city calendar (facts) for discovery / friend coordination.
 * CITY_SHOW only — Dorham does not invent COMMUNITY gathers in seed.
 * Tickets stay outbound; Dorham is RSVP/interest, not a box office.
 */
export type SeedEvent = {
  externalKey: string;
  kind: "CITY_SHOW";
  status: "PUBLISHED" | "ENDED";
  title: string;
  description: string;
  venue: string;
  venueSlug?: string;
  address?: string;
  startsAt: string;
  endsAt?: string;
  capacity?: number;
  priceTry?: number;
  externalTicketUrl?: string;
};

export const ISTANBUL_SEED_EVENTS: SeedEvent[] = [
  // —— Past (archive / past tab) ——
  {
    externalKey: "city:shadmehr-2026-09-01",
    kind: "CITY_SHOW",
    status: "ENDED",
    title: "کنسرت شادمهر عقیلی",
    description:
      "۱ سپتامبر ۲۰۲۶ — Ülker Sports Arena، آتاشهر. دورهم بلیط نمی‌فروشد؛ فقط برای هماهنگی دیدار قبل/بعد با دوستان ایرانی.",
    venue: "Ülker Sports Arena",
    address: "Barbaros, Ihlamur Bulvarı, Ataşehir/İstanbul",
    startsAt: "2026-09-01T17:00:00.000Z",
    externalTicketUrl:
      "https://irconcerts.com/%DA%A9%D9%86%D8%B3%D8%B1%D8%AA-%D9%87%D8%A7/%da%a9%d9%86%d8%b3%d8%b1%d8%aa-%d8%b4%d8%a7%d8%af%d9%85%d9%87%d8%b1-%d8%af%d8%b1-%d8%a7%d8%b3%d8%aa%d8%a7%d9%86%d8%a8%d9%88%d9%84/",
  },
  {
    externalKey: "city:moein-2026-09-03",
    kind: "CITY_SHOW",
    status: "ENDED",
    title: "کنسرت معین",
    description:
      "۳ سپتامبر ۲۰۲۶ — Ülker Sports Arena. بلیط از فروشندهٔ کنسرت؛ در دورهم فقط علاقه‌مندی برای هماهنگی دوستان.",
    venue: "Ülker Sports Arena",
    address: "Ataşehir, Istanbul",
    startsAt: "2026-09-03T17:00:00.000Z",
    externalTicketUrl:
      "https://irconcerts.com/%DA%A9%D9%86%D8%B3%D8%B1%D8%AA-%D9%87%D8%A7/%da%a9%d9%86%d8%b3%d8%b1%d8%aa-%d9%85%d8%b9%db%8c%d9%86-%d8%af%d8%b1-%d8%a7%d8%b3%d8%aa%d8%a7%d9%86%d8%a8%d9%88%d9%84/",
  },
  {
    externalKey: "city:ebi-2026-09-09",
    kind: "CITY_SHOW",
    status: "ENDED",
    title: "کنسرت ابی",
    description:
      "۹ سپتامبر ۲۰۲۶ — Ora Arena، بایرام‌پاشا. فرصت دیدار ایرانی‌ها قبل از سالن؛ بلیط جدا.",
    venue: "Ora Arena",
    address: "Bayrampaşa, Istanbul",
    startsAt: "2026-09-09T17:00:00.000Z",
    externalTicketUrl:
      "https://irconcerts.com/%DA%A9%D9%86%D8%B3%D8%B1%D8%AA-%D9%87%D8%A7/%da%a9%d9%86%d8%b3%d8%b1%d8%aa-%d8%a7%d8%a8%db%8c-%d8%af%d8%b1-%d8%a7%d8%b3%d8%aa%d8%a7%d9%86%d8%a8%d9%88%d9%84/",
  },

  // —— Upcoming city calendar ——
  {
    externalKey: "city:black-coffee-2026-09-25",
    kind: "CITY_SHOW",
    status: "PUBLISHED",
    title: "Black Coffee — Ataköy Marina",
    description:
      "۲۵ سپتامبر ۲۰۲۶، فضای باز آتاکوی مارینا. بلیط خارجی؛ در دورهم «علاقه‌مندم» بزن تا دوستانت برای هماهنگی ببینند.",
    venue: "Ataköy Marina Açık Hava",
    address: "Ataköy Marina, Bakırköy/İstanbul",
    startsAt: "2026-09-25T13:00:00.000Z",
    externalTicketUrl: "https://irconcerts.com/%D8%B4%D9%87%D8%B1%D9%87%D8%A7/%D8%A7%D8%B3%D8%AA%D8%A7%D9%86%D8%A8%D9%88%D9%84/",
  },
  {
    externalKey: "city:boris-brejcha-2026-09-26",
    kind: "CITY_SHOW",
    status: "PUBLISHED",
    title: "Boris Brejcha — Reflections",
    description:
      "۲۶ سپتامبر ۲۰۲۶ — KüçükÇiftlik Park. تقویم شهر برای هماهنگی؛ فروش بلیط اینجا نیست.",
    venue: "KüçükÇiftlik Park",
    address: "Harbiye, Şişli/İstanbul",
    startsAt: "2026-09-26T14:00:00.000Z",
    externalTicketUrl: "https://www.accesspointticket.com/",
  },
  {
    externalKey: "city:amr-diab-2026-10-03",
    kind: "CITY_SHOW",
    status: "PUBLISHED",
    title: "کنسرت عمرو دیاب",
    description:
      "۳ اکتبر ۲۰۲۶ — Istanbul Arena. هماهنگی دوستان ایرانی با علاقه‌مندی؛ بلیط از فروشندهٔ رسمی کنسرت.",
    venue: "Istanbul Arena",
    address: "Istanbul",
    startsAt: "2026-10-03T17:00:00.000Z",
    externalTicketUrl: "https://irconcerts.com/%D8%B4%D9%87%D8%B1%D9%87%D8%A7/%D8%A7%D8%B3%D8%AA%D8%A7%D9%86%D8%A8%D9%88%D9%84/",
  },
  {
    externalKey: "city:yann-tiersen-2026-10-10",
    kind: "CITY_SHOW",
    status: "PUBLISHED",
    title: "Yann Tiersen",
    description:
      "۱۰ اکتبر ۲۰۲۶ — اجرای زنده در استانبول. محل دقیق و بلیط را از فروشندهٔ کنسرت تأیید کن؛ دورهم فقط هماهنگی است.",
    venue: "Istanbul (venue TBC)",
    address: "Istanbul",
    startsAt: "2026-10-10T17:00:00.000Z",
    externalTicketUrl: "https://www.accesspointticket.com/",
  },
  {
    externalKey: "city:saint-levant-2026-12-10",
    kind: "CITY_SHOW",
    status: "PUBLISHED",
    title: "Saint Levant",
    description:
      "۱۰ دسامبر ۲۰۲۶ — اجرای زنده در استانبول. قبل از خرید بلیط، تاریخ و سالن را از منبع بلیط چک کن.",
    venue: "Istanbul (venue TBC)",
    address: "Istanbul",
    startsAt: "2026-12-10T17:00:00.000Z",
    externalTicketUrl: "https://www.accesspointticket.com/",
  },
  {
    externalKey: "city:nancy-ajram-2026-12-30",
    kind: "CITY_SHOW",
    status: "PUBLISHED",
    title: "کنسرت نانسی عجرم",
    description:
      "۳۰ دسامبر ۲۰۲۶ — استانبول. تاریخ و سالن را قبل خرید از فروشنده تأیید کن؛ دورهم محل فروش بلیط نیست.",
    venue: "Istanbul (venue TBC)",
    address: "Istanbul",
    startsAt: "2026-12-30T17:00:00.000Z",
    externalTicketUrl: "https://irconcerts.com/%D8%B4%D9%87%D8%B1%D9%87%D8%A7/%D8%A7%D8%B3%D8%AA%D8%A7%D9%86%D8%A8%D9%88%D9%84/",
  },
];
