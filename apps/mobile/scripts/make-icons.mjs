import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "assets");
mkdirSync(out, { recursive: true });

const PAPER = [239, 227, 207, 255];
const CLAY = [177, 46, 40, 255];
const CREAM = [255, 248, 240, 255];

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, paint) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = paint(x, y, size);
      const o = row + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function dist(x, y, cx, cy) {
  return Math.hypot(x - cx, y - cy);
}

function mark(x, y, size, transparent) {
  const cx = size / 2;
  const cy = size / 2;
  const outer = size * 0.31;
  const seats = [
    [cx, cy - size * 0.07],
    [cx - size * 0.075, cy + size * 0.05],
    [cx + size * 0.075, cy + size * 0.05],
  ];
  if (seats.some(([sx, sy]) => dist(x, y, sx, sy) <= size * 0.048)) return CREAM;
  if (dist(x, y, cx, cy) <= outer) return CLAY;
  return transparent ? [0, 0, 0, 0] : PAPER;
}

writeFileSync(join(out, "icon.png"), png(1024, (x, y, size) => mark(x, y, size, false)));
writeFileSync(join(out, "adaptive-icon.png"), png(1024, (x, y, size) => mark(x, y, size, true)));
writeFileSync(join(out, "splash-icon.png"), png(512, (x, y, size) => mark(x, y, size, true)));
console.log("wrote apps/mobile/assets/{icon,adaptive-icon,splash-icon}.png");
