import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import * as argon2 from "argon2";

export function hashPassword(password: string) {
  return argon2.hash(password, { type: argon2.argon2id });
}

export function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

export function newRefreshToken() {
  return randomBytes(48).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function accessTtlSeconds(ttl: string) {
  if (ttl.endsWith("m")) return Number(ttl.slice(0, -1)) * 60;
  if (ttl.endsWith("h")) return Number(ttl.slice(0, -1)) * 3600;
  if (ttl.endsWith("d")) return Number(ttl.slice(0, -1)) * 86400;
  return 900;
}

export function addDuration(ttl: string) {
  return new Date(Date.now() + accessTtlSeconds(ttl) * 1000);
}

export function newOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

export function signMediaQuery(id: string, exp: number, secret: string) {
  return createHmac("sha256", secret).update(`${id}.${exp}`).digest("hex");
}

export function verifyMediaQuery(id: string, exp: number, sig: string, secret: string) {
  if (!/^[0-9a-f]{64}$/i.test(sig)) return false;
  const expected = signMediaQuery(id, exp, secret);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(sig, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function secretsEqual(left: string, right: string) {
  const a = Buffer.from(hashToken(left), "hex");
  const b = Buffer.from(hashToken(right), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
