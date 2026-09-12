/**
 * Finalize venue maps links (Latin Google queries) + fix known bad pins.
 * npx tsx scripts/finalize-venue-maps.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ISTANBUL_VENUES } from "../apps/api/prisma/venues-data.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "../apps/api/prisma/venues-data.ts");

/** Latin/Turkish names Google Maps recognizes better than Persian UI titles. */
const GOOGLE_QUERY: Record<string, string> = {
  "aksaray-mahalle": "Aksaray Meydanı Fatih İstanbul",
  "safir-aksaray": "Safir İran Mutfağı Namık Kemal Caddesi 23 Aksaray Fatih",
  "safir-sisli": "Safir Iranian Restaurant Abide-i Hürriyet Caddesi 171 Şişli",
  "asuman-aksaray": "Asuman İran Restaurant Atatürk Bulvarı 158 Fatih",
  "nayeb-findikzade": "Nayeb Restaurant Millet Caddesi 79 Fındıkzade",
  "reyhun-taksim": "Reyhun Iranian Restaurant Yeni Çarşı Caddesi 26 Beyoğlu",
  "termeh-beyoglu": "Termeh Restaurant Yeni Çarşı Caddesi 8 Beyoğlu",
  "mojgan-taksim": "Mojgan Restaurant Abdülhak Hamit Caddesi 19 Beyoğlu",
  "shamse-istiklal": "Shamse Restaurant İstiklal Caddesi 179 Beyoğlu",
  "safran-gumussuyu": "Safran Iranian Restaurant Asker Ocağı Caddesi Gümüşsuyu",
  "daryakenar-sisli": "Daryakenar Restaurant Cumhuriyet Caddesi 151 Şişli",
  "gulistan-sisli": "Gulistan İran Restaurant Papa Roncalli Sokak 84 Şişli",
  "golab-atakoy": "Golab Restoran Ataköy Marina Bakırköy",
  "shiraz-kadikoy": "Shiraz Restaurant Sarraf Ali Sokak 7 Kadıköy",
  "cheshmeh-kadikoy": "Cheshmeh Bookstore Cafe Misak-ı Milli Sokak Kadıköy",
  "gilan-acibadem": "Gilan Cafe Restaurant Umut Sokak Acıbadem Kadıköy",
  "tehroon-maslak": "Tehroon Restaurant Maslak Dereboyu İstanbul",
  "lalezaar-maslak": "Café Lalezaar Maslak Dereboyu İstanbul",
  "zolfa-maslak": "Zolfa Iranian Vegan Restaurant Maslak",
  "arya-sariyer": "Arya Restaurant Ayazağa Sarıyer",
  "sudi-atasehir": "Sudi Restoran Trendist Ataşehir",
  "shandiz-maltepe": "Shandiz Restaurant Maltepe Turgut Özal",
  "sevenkhan-kagithane": "7Khan Iranian Restaurant Kağıthane",
  "shahrzad-ortakoy": "Shahrzad Iranian Restaurant Ortaköy",
  "kralice-ortakoy": "Kraliçe Restaurant Ortaköy Beşiktaş",
  "keyvan-esenyurt": "Keyvan Restaurant Kent Vizyon Esenyurt",
  "atabak-esenyurt": "Atabak Restaurant Esenyurt",
  "zaim-avcilar": "Zaim İran Restaurant Avcılar",
  "masihanim-beylikduzu": "Masihanim Restaurant Beylikdüzü",
  "iran-market-aksaray": "İran Market Atatürk Bulvarı 160 Aksaray Fatih",
  "iran-market-sisli": "Iran Market Kazım Orbay Caddesi 24 Şişli",
  "iran-market-maslak": "Iranian Market Dereboyu Maslak",
  "damo-taksim": "Damo Iranian Restaurant Hocazade Sokak Beyoğlu",
  "aydan-esenyurt": "Aydan Iranian Restaurant Hep İstanbul Esenyurt",
  "shah-kebab-basaksehir": "Şah Kebap Hill Park Başakşehir",
  "tehroon-kadikoy": "Tehroon Restaurant Özen Sokak Fikirtepe Kadıköy",
  "palmiye-esenyurt": "Palmiye İran Restaurant Nazım Hikmet Esenyurt",
};

const PIN_FIX: Record<string, { lat: number; lng: number; address?: string }> = {
  "gilan-acibadem": {
    address: "Acıbadem Mah., Umut Sok. No:3/D, 34718 Kadıköy/İstanbul",
    lat: 41.00115,
    lng: 29.05485,
  },
  "iran-market-aksaray": {
    lat: 41.01295,
    lng: 28.95425,
  },
  "arya-sariyer": {
    // Keep near Ayazağa / Kemerburgaz corridor, not random Sarıyer coast
    lat: 41.1184,
    lng: 28.9992,
  },
};

function esc(s: string) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function emitVenue(v: (typeof ISTANBUL_VENUES)[number]) {
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

const out = ISTANBUL_VENUES.map((v) => {
  const pin = PIN_FIX[v.slug];
  const lat = pin?.lat ?? v.lat!;
  const lng = pin?.lng ?? v.lng!;
  const address = pin?.address ?? v.address;
  const q = GOOGLE_QUERY[v.slug] ?? `${address}`;
  const mapsQuery = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  return { ...v, address, lat, lng, mapsQuery };
});

const header = `export type VenueSeed = {
  slug: string;
  name: string;
  kind: "RESTAURANT" | "CAFE" | "MARKET" | "CULTURAL";
  area: string;
  address: string;
  /** Full Google Maps search URL (Latin/Turkish business query). */
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

/** Real Istanbul Iranian places — Google Maps links + geocoded pins. */
export const ISTANBUL_VENUES: VenueSeed[] = [
`;

fs.writeFileSync(dataPath, `${header}${out.map(emitVenue).join("\n")}\n];\n`, "utf8");
console.log(`Finalized ${out.length} Google Maps links`);
