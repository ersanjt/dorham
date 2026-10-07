import type { VenueKind } from "@dorham/shared";
import { t } from "./copy";
import type { UiLocale } from "./locale";

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
  basaksehir: "باشاک‌شهر",
};

export function venueKindLabel(kind: VenueKind, locale: UiLocale = "fa") {
  return t(locale).venues.kind[kind];
}

export function venueAreaLabel(area: string, locale: UiLocale = "fa") {
  const labels = t(locale).venues.area as Record<string, string>;
  return labels[area] ?? area;
}
