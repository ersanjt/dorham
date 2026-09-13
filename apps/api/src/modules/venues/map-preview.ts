/** Web-Mercator tile helpers for static venue map previews (no API key). */

export function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = 2 ** zoom;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y, zoom };
}

/**
 * Single OSM raster tile as a cover preview when Google Maps key is missing.
 * CartoCDN basemaps now require an API key and render as broken "API KEY REQUIRED" images.
 * Marker pin is drawn in CSS on the client.
 */
export function osmMapPreviewUrl(lat: number, lng: number, zoom = 15): string {
  const { x, y } = latLngToTile(lat, lng, zoom);
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

/** @deprecated Use osmMapPreviewUrl — Carto public basemaps now require a key. */
export function cartoMapPreviewUrl(lat: number, lng: number, zoom = 15): string {
  return osmMapPreviewUrl(lat, lng, zoom);
}

/** Google Street View stills — requires Maps Static / Street View API key. */
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
