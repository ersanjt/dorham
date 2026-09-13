/** Web-Mercator tile helpers for static venue map previews (no API key). */

export function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = 2 ** zoom;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y, zoom };
}

/**
 * Single OSM raster tile — last-resort fallback only (looks blurry when stretched).
 */
export function osmMapPreviewUrl(lat: number, lng: number, zoom = 15): string {
  const { x, y } = latLngToTile(lat, lng, zoom);
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

/** @deprecated Use osmMapPreviewUrl — Carto public basemaps now require a key. */
export function cartoMapPreviewUrl(lat: number, lng: number, zoom = 15): string {
  return osmMapPreviewUrl(lat, lng, zoom);
}

/** Google Street View stills — requires Maps Static / Street View API key + billing. */
export function streetViewPhotoUrl(lat: number, lng: number, heading: number, key: string): string {
  const params = new URLSearchParams({
    size: "800x500",
    location: `${lat},${lng}`,
    heading: String(heading),
    pitch: "8",
    fov: "80",
    key,
  });
  return `https://maps.googleapis.com/maps/api/streetview?${params}`;
}

/** Street View embed (no key) — exterior of the pin for gallery iframes only. */
export function streetViewEmbedUrl(lat: number, lng: number, heading: number): string {
  return `https://www.google.com/maps?layer=c&cbll=${lat},${lng}&cbp=12,${heading},0,0,5&hl=tr&output=svembed`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Crisp SVG cover when Google Maps billing/key fails.
 * Prefer this over a single stretched OSM tile (which looks like a blurry stain).
 */
export function venueCoverSvg(lat: number, lng: number, label = "استانبول"): Buffer {
  const title = escapeXml(label.slice(0, 42));
  const coords = `${lat.toFixed(4)}°N · ${Math.abs(lng).toFixed(4)}°E`;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" role="img">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f3e8d8"/>
      <stop offset="45%" stop-color="#e2d0bc"/>
      <stop offset="100%" stop-color="#c9a792"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(18,12,9,0.06)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="800" height="450" fill="url(#sky)"/>
  <rect width="800" height="450" fill="url(#grid)"/>
  <circle cx="400" cy="188" r="54" fill="rgba(177,46,40,0.12)"/>
  <path d="M400 150c-22 0-40 17-40 39 0 29 40 71 40 71s40-42 40-71c0-22-18-39-40-39z" fill="#b12e28"/>
  <circle cx="400" cy="186" r="14" fill="#fff8f0"/>
  <text x="400" y="292" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-size="28" font-weight="700" fill="#120c09">${title}</text>
  <text x="400" y="328" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-size="16" fill="#6a564c">${coords}</text>
  <text x="400" y="404" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-size="13" fill="#8a6a12">نقشهٔ مکان · دورهم</text>
</svg>`;
  return Buffer.from(svg);
}
