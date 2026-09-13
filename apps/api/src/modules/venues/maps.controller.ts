import { BadRequestException, Controller, Get, Header, Query, StreamableFile } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { loadEnv } from "../../config/env";
import { streetViewPhotoUrl, venueCoverSvg } from "./map-preview";

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
    const type = upstream.headers.get("content-type") || "";
    // Google returns text/plain JSON errors with 200 sometimes; reject non-images.
    if (type.includes("text/") || type.includes("json")) return null;
    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.length < 256) return null;
    return { buf, type: type || "image/jpeg" };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

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
    @Query("label") label: string | undefined,
  ): Promise<StreamableFile> {
    const lat = parseCoord(latRaw, -90, 90);
    const lng = parseCoord(lngRaw, -180, 180);
    if (lat == null || lng == null) {
      throw new BadRequestException({ code: "MAP_COORDS", message: "bad coordinates" });
    }

    const key = this.env.GOOGLE_MAPS_API_KEY?.trim();
    const marker = `${lat},${lng}`;
    if (key) {
      const googleUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${marker}&zoom=16&size=640x360&scale=2&maptype=roadmap&markers=color:0xB12E28%7C${marker}&key=${encodeURIComponent(key)}`;
      const hit = await fetchImageBytes(googleUrl);
      if (hit) return new StreamableFile(hit.buf, { type: hit.type, disposition: "inline" });
    }

    return new StreamableFile(venueCoverSvg(lat, lng, label?.trim() || "استانبول"), {
      type: "image/svg+xml",
      disposition: "inline",
    });
  }

  @Get("streetview")
  @Header("Cache-Control", "public, max-age=86400")
  @Header("X-Content-Type-Options", "nosniff")
  async streetView(
    @Query("lat") latRaw: string | undefined,
    @Query("lng") lngRaw: string | undefined,
    @Query("heading") headingRaw: string | undefined,
    @Query("label") label: string | undefined,
  ): Promise<StreamableFile> {
    const lat = parseCoord(latRaw, -90, 90);
    const lng = parseCoord(lngRaw, -180, 180);
    const heading = parseCoord(headingRaw ?? "20", 0, 360) ?? 20;
    if (lat == null || lng == null) {
      throw new BadRequestException({ code: "MAP_COORDS", message: "bad coordinates" });
    }

    const key = this.env.GOOGLE_MAPS_API_KEY?.trim();
    if (key) {
      const hit = await fetchImageBytes(streetViewPhotoUrl(lat, lng, heading, key));
      if (hit) return new StreamableFile(hit.buf, { type: hit.type, disposition: "inline" });
    }

    // Google 403 / missing key → crisp SVG, not a stretched 256px OSM tile.
    return new StreamableFile(venueCoverSvg(lat, lng, label?.trim() || "استانبول"), {
      type: "image/svg+xml",
      disposition: "inline",
    });
  }
}
