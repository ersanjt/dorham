import type { VenueKind } from "@dorham/shared";

export const KIND_LABEL: Record<VenueKind, string> = {
  RESTAURANT: "رستوران",
  CAFE: "کافه",
  MARKET: "مارکت",
  CULTURAL: "فرهنگی / کلاب",
};

export const AREA_LABEL: Record<string, string> = {
  aksaray: "آکسارای",
  findikzade: "فندق‌زاده",
  taksim: "تکسیم / بیوغلو",
  sisli: "شیشلی",
  kadikoy: "کادیکوی",
  maslak: "ماسلاک",
  sariyer: "ساری‌یر",
  atakoy: "آتاکوی",
  atasehir: "آتاشهر",
  maltepe: "مالتپه",
  kagithane: "کاغیتخانه",
  besiktas: "بشیکتاش / اورتاکوی",
  esenyurt: "اسنیورت",
  avcilar: "آوجیلار",
  beylikduzu: "بیلیکدوزو",
};
