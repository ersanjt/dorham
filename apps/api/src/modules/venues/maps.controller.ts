import { Controller, Get, Query, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { loadEnv } from "../../config/env";
import { osmMapPreviewUrl, streetViewPhotoUrl } from "./map-preview";

/** Fastify reply used for binary image / redirect responses. */
type ImageReply = {
  code: (status: number) => ImageReply;
  header: (name: string, value: string) => ImageReply;
  redirect: (url: string, code?: number) => void;
  send: (payload: Buffer | string) => void;
};

function parseCoord(raw: string | undefined, min: number, max: number): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

/**
 * Proxies Google Static / Street View images so the API key stays on the server.
 * Browser &lt;img&gt; tags must not call maps.googleapis.com with our key.
 */
@ApiTags("maps")
@Controller("maps")
export class MapsController {
  private readonly env = loadEnv();

  @Get("static")
  async staticMap(
    @Query("lat") latRaw: string | undefined,
    @Query("lng") lngRaw: string | undefined,
    @Res() reply: ImageReply,
  ) {
    const lat = parseCoord(latRaw, -90, 90);
    const lng = parseCoord(lngRaw, -180, 180);
    if (lat == null || lng == null) {
      reply.code(400).send("bad coordinates");
      return;
    }

    const key = this.env.GOOGLE_MAPS_API_KEY?.trim();
    if (!key) {
      reply.redirect(osmMapPreviewUrl(lat, lng, 15), 302);
      return;
    }

    const marker = `${lat},${lng}`;
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${marker}&zoom=16&size=640x360&scale=2&maptype=roadmap&markers=color:0xB12E28%7C${marker}&key=${encodeURIComponent(key)}`;
    await this.proxyImage(url, lat, lng, reply);
  }

  @Get("streetview")
  async streetView(
    @Query("lat") latRaw: string | undefined,
    @Query("lng") lngRaw: string | undefined,
    @Query("heading") headingRaw: string | undefined,
    @Res() reply: ImageReply,
  ) {
    const lat = parseCoord(latRaw, -90, 90);
    const lng = parseCoord(lngRaw, -180, 180);
    const heading = parseCoord(headingRaw ?? "20", 0, 360) ?? 20;
    if (lat == null || lng == null) {
      reply.code(400).send("bad coordinates");
      return;
    }

    const key = this.env.GOOGLE_MAPS_API_KEY?.trim();
    if (!key) {
      reply.redirect(osmMapPreviewUrl(lat, lng, 15), 302);
      return;
    }

    await this.proxyImage(streetViewPhotoUrl(lat, lng, heading, key), lat, lng, reply);
  }

  private async proxyImage(url: string, lat: number, lng: number, reply: ImageReply) {
    try {
      const upstream = await fetch(url);
      if (!upstream.ok) {
        reply.redirect(osmMapPreviewUrl(lat, lng, 15), 302);
        return;
      }
      const buf = Buffer.from(await upstream.arrayBuffer());
      const type = upstream.headers.get("content-type") || "image/jpeg";
      reply
        .header("content-type", type)
        .header("cache-control", "public, max-age=86400")
        .header("x-content-type-options", "nosniff")
        .send(buf);
    } catch {
      reply.redirect(osmMapPreviewUrl(lat, lng, 15), 302);
    }
  }
}
