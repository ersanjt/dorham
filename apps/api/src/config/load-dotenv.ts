import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Parse KEY=VALUE lines. Does not expand ${VAR}. Quotes are stripped. */
export function parseEnvText(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/** Fill missing keys only — process env and CI always win. */
export function applyEnvMap(map: Record<string, string>, env: NodeJS.ProcessEnv = process.env) {
  for (const [key, value] of Object.entries(map)) {
    if (env[key] === undefined) env[key] = value;
  }
}

/**
 * Nest does not load `.env` by itself. Production uses systemd EnvironmentFile.
 * Local `npm run dev:api` must still read `apps/api/.env` whether cwd is the
 * package or the monorepo root.
 */
export function loadDotenvFiles(cwd = process.cwd(), fromFile = __dirname) {
  const files = [
    resolve(cwd, ".env"),
    resolve(cwd, "apps/api/.env"),
    resolve(fromFile, "../../.env"),
    resolve(fromFile, "../../../.env"),
  ];
  const seen = new Set<string>();
  for (const file of files) {
    if (seen.has(file) || !existsSync(file)) continue;
    seen.add(file);
    applyEnvMap(parseEnvText(readFileSync(file, "utf8")));
  }
}
