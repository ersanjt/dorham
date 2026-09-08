import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const databaseDir = path.join(root, ".pgdata");

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "dorham",
  password: "dorham",
  port: 5432,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

if (!existsSync(path.join(databaseDir, "PG_VERSION"))) {
  await pg.initialise();
}
await pg.start();

try {
  await pg.createDatabase("dorham");
} catch (error) {
  const text = String(error);
  if (!text.includes("already exists") && !text.includes("duplicate")) {
    throw error;
  }
}

console.log("Dorham Postgres is ready: postgresql://dorham:dorham@localhost:5432/dorham");
console.log("Keep this window open. Ctrl+C stops the database.");

const stop = async () => {
  await pg.stop();
  process.exit(0);
};

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

await new Promise(() => {});
