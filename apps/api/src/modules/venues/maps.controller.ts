import { BadRequestException, Controller, Get, Header, Query, ServiceUnavailableException, StreamableFile } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { loadEnv } from "../../config/env";
import { osmMapPreviewUrl, streetViewPhotoUrl } from "./map-preview";

function parseCoord(raw: string | undefined, min: number, max: number): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

async function fetchImageBytes(url: string): Promise<{ buf: Buffer; type: string } | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "DorhamMaps/1.0 (https://www.dorham.app)" },
      signal: ctrl.signal,
    });
    if (!upstream.ok) return null;
    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.length < 64) return null;
    return { buf, type: upstream.headers.get("content-type") || "image/jpeg" };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Proxies Google Static / Street View so the API key never reaches the browser.
 * Returns image bytes via StreamableFile (no @Res / redirect — those 502 under Cloudflare).
 */
@ApiTags("maps")
@Controller("maps")
export class MapsController {
  private readonly env = loadEnv();

  @Get("static")
  @Header("Cache-Control", "public, max-age=86400")
  @Header("X-Content-Type-Options", "nosniff")
  async staticMap(
    @Query("lat") latRaw: string | undefined,
    @Query("lng") lngRaw: string | undefined,
  ): Promise<StreamableFile> {
    const lat = parseCoord(latRaw, -90, 90);
    const lng = parseCoord(lngRaw, -180, 180);
    if (lat == null || lng == null) {
      throw new BadRequestException({ code: "MAP_COORDS", message: "bad coordinates" });
    }

    const key = this.env.GOOGLE_MAPS_API_KEY?.trim();
    const marker = `${lat},${lng}`;
    const googleUrl = key
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${marker}&zoom=16&size=640x360&scale=2&maptype=roadmap&markers=color:0xB12E28%7C${marker}&key=${encodeURIComponent(key)}`
      : null;
    return this.imageResponse(googleUrl, osmMapPreviewUrl(lat, lng, 15));
  }

  @Get("streetview")
  @Header("Cache-Control", "public, max-age=86400")
  @Header("X-Content-Type-Options", "nosniff")
  async streetView(
    @Query("lat") latRaw: string | undefined,
    @Query("lng") lngRaw: string | undefined,
    @Query("heading") headingRaw: string | undefined,
  ): Promise<StreamableFile> {
    const lat = parseCoord(latRaw, -90, 90);
    const lng = parseCoord(lngRaw, -180, 180);
    const heading = parseCoord(headingRaw ?? "20", 0, 360) ?? 20;
    if (lat == null || lng == null) {
      throw new BadRequestException({ code: "MAP_COORDS", message: "bad coordinates" });
    }

    const key = this.env.GOOGLE_MAPS_API_KEY?.trim();
    const googleUrl = key ? streetViewPhotoUrl(lat, lng, heading, key) : null;
    return this.imageResponse(googleUrl, osmMapPreviewUrl(lat, lng, 15));
  }

  private async imageResponse(primary: string | null, fallback: string): Promise<StreamableFile> {
    const urls = primary ? [primary, fallback] : [fallback];
    for (const url of urls) {
      const hit = await fetchImageBytes(url);
      if (hit) return new StreamableFile(hit.buf, { type: hit.type, disposition: "inline" });
    }
    throw new ServiceUnavailableException({ code: "MAP_UNAVAILABLE", message: "map unavailable" });
  }
}
