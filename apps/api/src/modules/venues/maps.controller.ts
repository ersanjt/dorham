import { BadRequestException, Controller, Get, Query, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { loadEnv } from "../../config/env";
import { osmMapPreviewUrl, streetViewPhotoUrl } from "./map-preview";

/** Fastify reply — same shape as media controller binary responses. */
type BinaryReply = {
  header: (name: string, value: string) => BinaryReply;
  code: (status: number) => BinaryReply;
  send: (payload: Buffer | string) => void;
};

function parseCoord(raw: string | undefined, min: number, max: number): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

/**
 * Proxies Google Static / Street View so the API key never reaches the browser.
 * Always returns image bytes (no HTTP redirect) — redirects break Next/Cloudflare rewrites.
 */
@ApiTags("maps")
@Controller("maps")
export class MapsController {
  private readonly env = loadEnv();

  @Get("static")
  async staticMap(
    @Query("lat") latRaw: string | undefined,
    @Query("lng") lngRaw: string | undefined,
    @Res() reply: BinaryReply,
  ) {
    const lat = parseCoord(latRaw, -90, 90);
    const lng = parseCoord(lngRaw, -180, 180);
    if (lat == null || lng == null) throw new BadRequestException({ code: "MAP_COORDS", message: "bad coordinates" });

    const key = this.env.GOOGLE_MAPS_API_KEY?.trim();
    const marker = `${lat},${lng}`;
    const googleUrl = key
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${marker}&zoom=16&size=640x360&scale=2&maptype=roadmap&markers=color:0xB12E28%7C${marker}&key=${encodeURIComponent(key)}`
      : null;
    await this.sendImage(googleUrl, osmMapPreviewUrl(lat, lng, 15), reply);
  }

  @Get("streetview")
  async streetView(
    @Query("lat") latRaw: string | undefined,
    @Query("lng") lngRaw: string | undefined,
    @Query("heading") headingRaw: string | undefined,
    @Res() reply: BinaryReply,
  ) {
    const lat = parseCoord(latRaw, -90, 90);
    const lng = parseCoord(lngRaw, -180, 180);
    const heading = parseCoord(headingRaw ?? "20", 0, 360) ?? 20;
    if (lat == null || lng == null) throw new BadRequestException({ code: "MAP_COORDS", message: "bad coordinates" });

    const key = this.env.GOOGLE_MAPS_API_KEY?.trim();
    const googleUrl = key ? streetViewPhotoUrl(lat, lng, heading, key) : null;
    await this.sendImage(googleUrl, osmMapPreviewUrl(lat, lng, 15), reply);
  }

  private async sendImage(primary: string | null, fallback: string, reply: BinaryReply) {
    const urls = primary ? [primary, fallback] : [fallback];
    for (const url of urls) {
      try {
        const upstream = await fetch(url, {
          headers: { "User-Agent": "DorhamMaps/1.0 (https://www.dorham.app)" },
          signal: AbortSignal.timeout(12000),
        });
        if (!upstream.ok) continue;
        const buf = Buffer.from(await upstream.arrayBuffer());
        if (buf.length < 64) continue;
        const type = upstream.headers.get("content-type") || "image/jpeg";
        reply
          .header("content-type", type)
          .header("cache-control", "public, max-age=86400")
          .header("x-content-type-options", "nosniff")
          .send(buf);
        return;
      } catch {
        /* try next */
      }
    }
    reply.code(502).send("map unavailable");
  }
}
