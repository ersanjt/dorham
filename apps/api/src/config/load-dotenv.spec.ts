import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyEnvMap, parseEnvText } from "./load-dotenv";

describe("load-dotenv", () => {
  it("parses KEY=VALUE and ignores comments", () => {
    const map = parseEnvText(`
# comment
DATABASE_URL=postgresql://dorham:dorham@localhost:5432/dorham
JWT_ACCESS_SECRET="change-me-access-secret-at-least-32-chars"
EMPTY=
not a line
`);
    assert.equal(map.DATABASE_URL, "postgresql://dorham:dorham@localhost:5432/dorham");
    assert.equal(map.JWT_ACCESS_SECRET, "change-me-access-secret-at-least-32-chars");
    assert.equal("EMPTY" in map, true);
  });

  it("does not overwrite existing process env", () => {
    const env: NodeJS.ProcessEnv = { DATABASE_URL: "from-ci" };
    applyEnvMap({ DATABASE_URL: "from-file", JWT_ACCESS_SECRET: "from-file-secret-32-chars-xx" }, env);
    assert.equal(env.DATABASE_URL, "from-ci");
    assert.equal(env.JWT_ACCESS_SECRET, "from-file-secret-32-chars-xx");
  });
});
