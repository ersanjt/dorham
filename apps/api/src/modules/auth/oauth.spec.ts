import { generateKeyPairSync, createSign, type JsonWebKey } from "node:crypto";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  allowedOAuthRedirect,
  appleClientSecret,
  appleProfile,
  facebookProfile,
  googleProfile,
  OAuthError,
  readOAuthState,
  resetAppleKeyCache,
  resolveOAuth,
  signOAuthState,
  startOAuth,
  verifyAppleIdToken,
  type OAuthConfig,
} from "./oauth";

const secret = "test-secret-test-secret-test-secret-1234";

function config(overrides: Partial<OAuthConfig> = {}): OAuthConfig {
  return {
    appUrl: "https://dorham.app",
    jwtSecret: secret,
    extraOrigins: [],
    googleClientId: "google-web",
    googleClientSecret: "google-secret",
    googleAudiences: ["google-web", "google-ios"],
    facebookAppId: "fb-app",
    facebookAppSecret: "fb-secret",
    appleClientId: "app.dorham.web",
    appleAudiences: ["app.dorham.web", "app.dorham.mobile"],
    appleTeamId: "TEAMID123",
    appleKeyId: "KEYID12345",
    applePrivateKey: undefined,
    ...overrides,
  };
}

describe("oauth state and redirects", () => {
  it("round-trips a signed state and rejects tampering or expiry", () => {
    const token = signOAuthState(
      {
        provider: "google",
        exp: Math.floor(Date.now() / 1000) + 60,
        adult: true,
        locale: "FA",
        nonce: "nonce-nonce",
        redirectUri: "https://dorham.app/auth/callback",
      },
      secret,
    );
    const read = readOAuthState(token, secret);
    assert.equal(read?.provider, "google");
    assert.equal(read?.adult, true);
    const [body, mac] = token.split(".");
    const flipped = `${body.slice(0, -1)}${body.endsWith("a") ? "b" : "a"}`;
    assert.equal(readOAuthState(`${flipped}.${mac}`, secret), null);
    assert.equal(readOAuthState(token, secret, Date.now() + 120_000), null);
  });

  it("allows the app origin, its www pair, and the three callback paths", () => {
    const cfg = config();
    assert.equal(allowedOAuthRedirect("https://dorham.app/auth/callback", cfg), true);
    assert.equal(allowedOAuthRedirect("https://www.dorham.app/auth/callback/app", cfg), true);
    assert.equal(allowedOAuthRedirect("https://dorham.app/auth/callback/apple", cfg), true);
    assert.equal(allowedOAuthRedirect("http://127.0.0.1:3000/auth/callback", config({ appUrl: "http://localhost:3000" })), true);
    assert.equal(allowedOAuthRedirect("https://dorham.app/auth/callback?next=/", cfg), false);
    assert.equal(allowedOAuthRedirect("https://evil.example/auth/callback", cfg), false);
    assert.equal(allowedOAuthRedirect("https://dorham.app/login", cfg), false);
  });

  it("refuses to start a provider that has no credentials", () => {
    assert.throws(
      () => startOAuth(config({ googleClientSecret: undefined }), {
        provider: "google",
        redirectUri: "https://dorham.app/auth/callback",
        locale: "FA",
        adult: true,
      }),
      (err: unknown) => err instanceof OAuthError && err.code === "AUTH_OAUTH_UNAVAILABLE",
    );
  });
});

describe("provider identity checks", () => {
  const now = 1_700_000_000_000;

  it("rejects a Google token with the wrong audience or an unverified email flag", () => {
    const good = googleProfile(
      {
        aud: "google-web",
        sub: "sub-1",
        email: "Person@Example.com",
        email_verified: "true",
        exp: now / 1000 + 60,
        nonce: "n",
        iss: "https://accounts.google.com",
        name: "Sara",
      },
      ["google-web"],
      "n",
      now,
    );
    assert.equal(good.email, "person@example.com");
    assert.equal(good.emailVerified, true);
    assert.throws(() =>
      googleProfile(
        { ...{ aud: "other-app", sub: "sub-1", exp: now / 1000 + 60, iss: "https://accounts.google.com", email_verified: true } },
        ["google-web"],
        undefined,
        now,
      ),
    );
    const unverified = googleProfile(
      {
        aud: "google-web",
        sub: "sub-1",
        email: "person@example.com",
        email_verified: false,
        exp: now / 1000 + 60,
        iss: "accounts.google.com",
      },
      ["google-web"],
      undefined,
      now,
    );
    assert.equal(unverified.emailVerified, false);
  });

  it("rejects a Facebook token issued to another app", () => {
    assert.throws(() => facebookProfile({ id: "1", email: "a@b.co" }, { is_valid: true, app_id: "other" }, "fb-app"));
    const profile = facebookProfile({ id: "1", email: "A@b.co", name: "Neda" }, { is_valid: true, app_id: "fb-app" }, "fb-app");
    assert.equal(profile.email, "a@b.co");
    assert.equal(profile.emailVerified, true);
  });

  it("verifies an Apple identity token and client secret with ES256", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
    const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    const jwk = publicKey.export({ format: "jwk" }) as JsonWebKey & { kid?: string };
    jwk.kid = "KEYID12345";
    const cfg = config({ applePrivateKey: pem });
    const clientSecret = appleClientSecret(cfg, 1_700_000_000);
    assert.equal(clientSecret.split(".").length, 3);

    const exp = Math.floor(Date.now() / 1000) + 120;
    const claims = {
      iss: "https://appleid.apple.com",
      aud: "app.dorham.mobile",
      sub: "apple-user",
      email: "relay@privaterelay.appleid.com",
      email_verified: true,
      exp,
      nonce: "nonce-1",
    };
    const header = Buffer.from(JSON.stringify({ alg: "ES256", kid: "KEYID12345" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
    const signature = createSign("SHA256")
      .update(`${header}.${payload}`)
      .sign({ key: privateKey, dsaEncoding: "ieee-p1363" });
    const idToken = `${header}.${payload}.${Buffer.from(signature).toString("base64url")}`;

    resetAppleKeyCache();
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ keys: [jwk] }), { status: 200, headers: { "Content-Type": "application/json" } })) as typeof fetch;
    const verified = await verifyAppleIdToken(idToken, fetchImpl);
    const profile = appleProfile(verified, cfg.appleAudiences, "nonce-1");
    assert.equal(profile.providerUserId, "apple-user");
    assert.equal(profile.emailVerified, true);
    assert.throws(() => appleProfile(verified, ["someone-else"], "nonce-1"));
  });

  it("exchanges a Google code only when the state matches the redirect", async () => {
    const cfg = config();
    const state = signOAuthState(
      {
        provider: "google",
        exp: Math.floor(Date.now() / 1000) + 60,
        adult: false,
        locale: "EN",
        nonce: "nonce-google",
        redirectUri: "https://dorham.app/auth/callback",
      },
      secret,
    );
    const calls: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url.includes("oauth2.googleapis.com/token") && !url.includes("tokeninfo")) {
        return new Response(JSON.stringify({ id_token: "header.payload.sig" }), { status: 200 });
      }
      return new Response(
        JSON.stringify({
          aud: "google-web",
          sub: "g-1",
          email: "sara@example.com",
          email_verified: true,
          exp: Math.floor(Date.now() / 1000) + 60,
          nonce: "nonce-google",
          iss: "https://accounts.google.com",
          name: "Sara",
        }),
        { status: 200 },
      );
    }) as typeof fetch;

    const resolved = await resolveOAuth(
      cfg,
      { code: "auth-code-value", state, redirectUri: "https://dorham.app/auth/callback" },
      fetchImpl,
    );
    assert.equal(resolved.adult, false);
    assert.equal(resolved.profile.email, "sara@example.com");
    assert.equal(calls.length, 2);
    await assert.rejects(
      resolveOAuth(
        cfg,
        { code: "auth-code-value", state, redirectUri: "https://dorham.app/auth/callback/app" },
        fetchImpl,
      ),
      (err: unknown) => err instanceof OAuthError && err.code === "AUTH_OAUTH_INVALID",
    );
  });
});
