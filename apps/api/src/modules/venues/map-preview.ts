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
