/**
 * Geocode venues from Turkish street addresses (Nominatim), write Google Maps URLs.
 * npx tsx scripts/geocode-venues.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ISTANBUL_VENUES } from "../apps/api/prisma/venues-data.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "../apps/api/prisma/venues-data.ts");
const UA = "DorhamVenueGeocoder/1.0 (https://dorham.app; hello@dorham.app)";

const OVERRIDES: Record<
  string,
  Partial<{
    address: string;
    phone: string;
    hours: string;
    website: string;
    lat: number;
    lng: number;
  }>
> = {
  "safir-aksaray": {
    address: "Aksaray Mahallesi, Namık Kemal Cad. No:23, 34096 Fatih/İstanbul",
    phone: "+90 553 591 24 14",
    hours: "۱۲:۰۰–۲۳:۰۰",
    website: "https://safiriranianrestaurant.com",
    lat: 41.005498,
    lng: 28.950193,
  },
  "safir-sisli": {
    address: "Merkez Mah., Abide-i Hürriyet Cd. No:171/A, 34371 Şişli/İstanbul",
    phone: "+90 212 234 10 10",
    hours: "۱۲:۰۰–۲۳:۰۰",
    website: "https://safiriranianrestaurant.com",
    lat: 41.062676,
    lng: 28.987479,
  },
  "asuman-aksaray": {
    address: "Kemalpaşa Mah., Atatürk Bulvarı No:158, 34134 Fatih/İstanbul",
    phone: "+90 212 511 27 37",
    hours: "۱۲:۰۰–۲۱:۰۰",
    website: "https://www.asumanrestaurant.com",
    // Street-level near Oruçgazi school / Aksaray Atatürk Bulvarı — not Unkapanı stretch
    lat: 41.01285,
    lng: 28.9541,
  },
  "aksaray-mahalle": {
    address: "Aksaray Meydanı, Fatih/İstanbul",
    lat: 41.010738,
    lng: 28.950078,
  },
  "golab-atakoy": {
    lat: 40.971128,
    lng: 28.876129,
  },
  "reyhun-taksim": {
    lat: 41.032637,
    lng: 28.977868,
  },
};

async function nominatim(q: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=tr&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) return null;
  const json = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!json?.[0]) return null;
  return {
    lat: Number(Number(json[0].lat).toFixed(6)),
    lng: Number(Number(json[0].lon).toFixed(6)),
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function googleMapsUrl(name: string, address: string, lat: number, lng: number) {
  // Name+address so Google pins the business; coords keep the pin in the right neighborhood.
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}`)}&query_place_id=`;
}

function googleMapsCoordUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}`;
}

function esc(s: string) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function emitVenue(v: (typeof ISTANBUL_VENUES)[number] & { mapsQuery: string; lat: number; lng: number }) {
  const lines = [
    "  {",
    `    slug: "${v.slug}",`,
    `    name: "${esc(v.name)}",`,
    `    kind: "${v.kind}",`,
    `    area: "${v.area}",`,
    `    address: "${esc(v.address)}",`,
    `    mapsQuery: "${esc(v.mapsQuery)}",`,
    `    lat: ${v.lat},`,
    `    lng: ${v.lng},`,
  ];
  if (v.phone) lines.push(`    phone: "${esc(v.phone)}",`);
  if (v.website) lines.push(`    website: "${esc(v.website)}",`);
  if (v.hours) lines.push(`    hours: "${esc(v.hours)}",`);
  if (v.priceRange) lines.push(`    priceRange: "${esc(v.priceRange)}",`);
  if (v.menuNotes) lines.push(`    menuNotes: "${esc(v.menuNotes)}",`);
  lines.push(`    description: "${esc(v.description)}",`);
  lines.push("  },");
  return lines.join("\n");
}

async function geocodeAddress(address: string) {
  await sleep(1100);
  let hit = await nominatim(address);
  if (hit) return hit;
  // Drop flat/suite noise
  const simplified = address
    .replace(/\bNo:\s*/gi, "")
    .replace(/\bD:\S+/gi, "")
    .replace(/\bİç Kapı[^\,]*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  await sleep(1100);
  hit = await nominatim(simplified);
  if (hit) return hit;
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    await sleep(1100);
    hit = await nominatim(`${parts[parts.length - 2]}, ${parts[parts.length - 1]}`);
  }
  return hit;
}

async function main() {
  console.log(`Loaded ${ISTANBUL_VENUES.length} venues`);
  const out = [];

  for (const v of ISTANBUL_VENUES) {
    const over = OVERRIDES[v.slug] ?? {};
    const address = over.address ?? v.address;
    process.stdout.write(`${v.slug}... `);

    let lat = over.lat;
    let lng = over.lng;
    if (lat == null || lng == null) {
      const hit = await geocodeAddress(address);
      if (hit) {
        lat = hit.lat;
        lng = hit.lng;
        console.log(`geo ${lat},${lng}`);
      } else if (v.lat != null && v.lng != null) {
        lat = v.lat;
        lng = v.lng;
        console.log(`keep ${lat},${lng}`);
      } else {
        throw new Error(`No coords for ${v.slug}`);
      }
    } else {
      console.log(`manual ${lat},${lng}`);
    }

    // Prefer business-name Google search; if name is neighborhood-only, use coords.
    const mapsQuery =
      v.kind === "CULTURAL" && v.slug === "aksaray-mahalle"
        ? googleMapsCoordUrl(lat!, lng!)
        : googleMapsUrl(v.name.replace(/ — .*$/, ""), address, lat!, lng!);

    out.push({
      ...v,
      address,
      phone: over.phone ?? v.phone,
      hours: over.hours ?? v.hours,
      website: over.website ?? v.website,
      lat: lat!,
      lng: lng!,
      mapsQuery: mapsQuery.replace(/&query_place_id=$/, ""),
    });
  }

  const header = `export type VenueSeed = {
  slug: string;
  name: string;
  kind: "RESTAURANT" | "CAFE" | "MARKET" | "CULTURAL";
  area: string;
  address: string;
  /** Full Google Maps URL. */
  mapsQuery: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  hours?: string;
  priceRange?: string;
  menuNotes?: string;
  description: string;
};

/** Real Istanbul Iranian places — verified addresses, Google Maps links, geocoded pins. */
export const ISTANBUL_VENUES: VenueSeed[] = [
`;

  fs.writeFileSync(dataPath, `${header}${out.map(emitVenue).join("\n")}\n];\n`, "utf8");
  console.log(`Wrote ${out.length} venues`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
