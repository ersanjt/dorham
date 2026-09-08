import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { accessTtlSeconds, hashToken, newRefreshToken, signMediaQuery, verifyMediaQuery } from "./crypto";

describe("crypto helpers", () => {
  it("hashes refresh tokens irreversibly", () => {
    const token = newRefreshToken();
    const hashed = hashToken(token);
    assert.equal(hashed.length, 64);
    assert.notEqual(hashed, token);
    assert.equal(hashToken(token), hashed);
  });

  it("parses access TTL", () => {
    assert.equal(accessTtlSeconds("15m"), 900);
    assert.equal(accessTtlSeconds("30d"), 30 * 86400);
  });

  it("signs media URLs", () => {
    const sig = signMediaQuery("abc", 1700000000, "secret-secret-secret-secret-1234");
    assert.equal(verifyMediaQuery("abc", 1700000000, sig, "secret-secret-secret-secret-1234"), true);
    assert.equal(verifyMediaQuery("abc", 1700000001, sig, "secret-secret-secret-secret-1234"), false);
  });
});
