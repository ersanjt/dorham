import { createWriteStream } from "node:fs";
import { mkdir, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { MediaKind, UserRole } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { loadEnv } from "../../config/env";
import { signMediaQuery, verifyMediaQuery } from "../../common/crypto";

const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const MAX_BYTES = 5 * 1024 * 1024;
const SIGN_SECONDS = 15 * 60;

@Injectable()
export class MediaService {
  private readonly env = loadEnv();

  constructor(private readonly prisma: PrismaService) {}

  rootDir() {
    return path.resolve(process.cwd(), this.env.MEDIA_DIR);
  }

  signedUrl(id: string, ttlSeconds = SIGN_SECONDS) {
    const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
    const sig = signMediaQuery(id, exp, this.env.JWT_ACCESS_SECRET);
    // Path-only so www.dorham.app Next rewrite + Expo publicMediaUrl both work.
    return `/v1/media/${id}?exp=${exp}&sig=${sig}`;
  }

  async photoUrl(photoId: string | null | undefined) {
    if (!photoId) return null;
    const exists = await this.prisma.mediaAsset.findUnique({ where: { id: photoId }, select: { id: true } });
    return exists ? this.signedUrl(photoId) : null;
  }

  async createFromUpload(input: {
    userId: string;
    kind: MediaKind;
    mime: string;
    stream: NodeJS.ReadableStream;
    knownBytes?: number;
  }) {
    if (!ALLOWED[input.mime]) {
      throw new BadRequestException({
        code: "MEDIA_INVALID",
        message: "Only JPEG, PNG, or WebP photos are accepted.",
      });
    }
    if (input.knownBytes && input.knownBytes > MAX_BYTES) {
      throw new BadRequestException({ code: "MEDIA_INVALID", message: "Photo is larger than 5MB." });
    }

    const asset = await this.prisma.mediaAsset.create({
      data: {
        userId: input.userId,
        kind: input.kind,
        mime: input.mime,
        bytes: 0,
        storageKey: "pending",
      },
    });

    const ext = ALLOWED[input.mime];
    const storageKey = `${input.userId}/${asset.id}${ext}`;
    const dest = path.join(this.rootDir(), storageKey);
    await mkdir(path.dirname(dest), { recursive: true });

    try {
      await pipeline(input.stream, createWriteStream(dest));
      const buf = await readFile(dest);
      if (buf.length === 0 || buf.length > MAX_BYTES || !looksLikeImage(input.mime, buf)) {
        await unlink(dest).catch(() => undefined);
        await this.prisma.mediaAsset.delete({ where: { id: asset.id } });
        throw new BadRequestException({
          code: "MEDIA_INVALID",
          message: "Photo is empty, larger than 5MB, or not a real JPEG, PNG, or WebP.",
        });
      }
      const updated = await this.prisma.mediaAsset.update({
        where: { id: asset.id },
        data: { storageKey, bytes: buf.length },
      });
      return {
        id: updated.id,
        kind: updated.kind,
        mime: updated.mime,
        bytes: updated.bytes,
        url: this.signedUrl(updated.id),
      };
    } catch (err) {
      await unlink(dest).catch(() => undefined);
      await this.prisma.mediaAsset.delete({ where: { id: asset.id } }).catch(() => undefined);
      throw err;
    }
  }

  async openSigned(
    id: string,
    expRaw: string | undefined,
    sig: string | undefined,
    viewer?: { id: string; role: UserRole },
  ) {
    const exp = Number(expRaw);
    if (!sig || !Number.isFinite(exp) || exp * 1000 < Date.now()) {
      throw new NotFoundException({ code: "MEDIA_NOT_FOUND", message: "Media not found." });
    }
    if (!verifyMediaQuery(id, exp, sig, this.env.JWT_ACCESS_SECRET)) {
      throw new NotFoundException({ code: "MEDIA_NOT_FOUND", message: "Media not found." });
    }
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException({ code: "MEDIA_NOT_FOUND", message: "Media not found." });
    }
    if (asset.kind === "VERIFICATION") {
      const owner = viewer?.id === asset.userId;
      const staff = viewer?.role === "MODERATOR" || viewer?.role === "ADMIN";
      if (!owner && !staff) {
        throw new NotFoundException({ code: "MEDIA_NOT_FOUND", message: "Media not found." });
      }
    }
    const filePath = containedPath(this.rootDir(), asset.storageKey);
    if (!filePath) {
      throw new NotFoundException({ code: "MEDIA_NOT_FOUND", message: "Media not found." });
    }
    const data = await readFile(filePath).catch(() => null);
    if (!data) {
      throw new NotFoundException({ code: "MEDIA_NOT_FOUND", message: "Media not found." });
    }
    return { data, mime: asset.mime };
  }

  async requireOwned(userId: string, mediaId: string, kind: MediaKind) {
    const asset = await this.prisma.mediaAsset.findFirst({ where: { id: mediaId, userId, kind } });
    if (!asset) {
      throw new BadRequestException({
        code: "MEDIA_INVALID",
        message: "Upload a photo first, then attach it.",
      });
    }
    return asset;
  }

  async deleteOwned(userId: string, mediaId: string) {
    const asset = await this.prisma.mediaAsset.findFirst({ where: { id: mediaId, userId } });
    if (!asset) return;
    const filePath = containedPath(this.rootDir(), asset.storageKey);
    if (filePath) await unlink(filePath).catch(() => undefined);
    await this.prisma.mediaAsset.delete({ where: { id: asset.id } });
  }
}

function looksLikeImage(mime: string, buf: Buffer) {
  if (mime === "image/jpeg") return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === "image/png") {
    return buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mime === "image/webp") {
    return buf.length >= 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP";
  }
  return false;
}

function containedPath(rootDir: string, storageKey: string) {
  const root = path.resolve(rootDir);
  const filePath = path.resolve(root, storageKey);
  const rel = path.relative(root, filePath);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return filePath;
}
