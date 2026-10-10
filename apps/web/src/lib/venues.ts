import { ISTANBUL_AREAS, istanbulArea, type IstanbulRegion, type VenueKind } from "@dorham/shared";
import { t } from "./copy";
import type { UiLocale } from "./locale";

export const KIND_LABEL: Record<VenueKind, string> = {
  RESTAURANT: "رستوران",
  CAFE: "کافه",
  MARKET: "مارکت",
  CULTURAL: "فرهنگی / کلاب",
};

export const AREA_LABEL: Record<string, string> = Object.fromEntries(ISTANBUL_AREAS.map((a) => [a.slug, a.fa]));

export function venueKindLabel(kind: VenueKind, locale: UiLocale = "fa") {
  return t(locale).venues.kind[kind];
}

export function venueAreaLabel(area: string, locale: UiLocale = "fa") {
  const known = istanbulArea(area);
  return known ? known[locale] : area;
}

export function venueRegionLabel(region: IstanbulRegion, locale: UiLocale = "fa") {
  return t(locale).venues.region[region];
}
