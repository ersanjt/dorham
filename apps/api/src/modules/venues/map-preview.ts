/** Web-Mercator tile helpers for static venue map previews (no API key). */

export function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = 2 ** zoom;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y, zoom };
}

/**
 * Reliable basemap preview. CartoCDN serves OSM-derived tiles with CORS + CDN.
 * Marker is drawn in CSS on the client (tile itself has no pin).
 */
export function cartoMapPreviewUrl(lat: number, lng: number, zoom = 15): string {
  const { x, y } = latLngToTile(lat, lng, zoom);
  const host = ["a", "b", "c", "d"][(Math.abs(x) + Math.abs(y)) % 4];
  return `https://${host}.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${x}/${y}@2x.png`;
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

/** Street View embed (no key) — exterior of the pin for gallery. */
export function streetViewEmbedUrl(lat: number, lng: number, heading: number): string {
  return `https://www.google.com/maps?layer=c&cbll=${lat},${lng}&cbp=12,${heading},0,0,5&hl=tr&output=svembed`;
}
