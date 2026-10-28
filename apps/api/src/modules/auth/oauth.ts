import {
  createHmac,
  createPrivateKey,
  createPublicKey,
  createSign,
  createVerify,
  randomBytes,
  timingSafeEqual,
  type JsonWebKey,
} from "node:crypto";
import type { OAuthBody, OAuthStartBody } from "@dorham/shared";
import type { Env } from "../../config/env";

export type OAuthProviderName = "google" | "apple" | "facebook";

export type OAuthProfile = {
  provider: OAuthProviderName;
  providerUserId: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
};

export type ResolvedOAuth = {
  profile: OAuthProfile;
  adult: boolean;
  locale: "FA" | "EN" | "TR";
  displayName: string | null;
};

export class OAuthError extends Error {
  constructor(
    readonly code: "AUTH_OAUTH_INVALID" | "AUTH_OAUTH_UNAVAILABLE" | "AUTH_OAUTH_EMAIL",
    message: string,
  ) {
    super(message);
  }
}

export type OAuthConfig = {
  appUrl: string;
  jwtSecret: string;
  extraOrigins: string[];
  googleClientId?: string;
  googleClientSecret?: string;
  googleAudiences: string[];
  facebookAppId?: string;
  facebookAppSecret?: string;
  appleClientId?: string;
  appleAudiences: string[];
  appleTeamId?: string;
  appleKeyId?: string;
  applePrivateKey?: string;
};

type OAuthState = {
  provider: OAuthProviderName;
  exp: number;
  adult: boolean;
  locale: "FA" | "EN" | "TR";
  nonce: string;
  redirectUri: string;
};

const STATE_TTL_SECONDS = 10 * 60;
const FETCH_TIMEOUT_MS = 10_000;

function blank(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function csv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function oauthConfigFromEnv(env: Env): OAuthConfig {
  const googleClientId = blank(env.GOOGLE_CLIENT_ID);
  const appleClientId = blank(env.APPLE_CLIENT_ID);
  const googleAudiences = [...new Set([googleClientId, ...csv(env.GOOGLE_CLIENT_IDS)].filter((id): id is string => Boolean(id)))];
  const appleAudiences = [...new Set([appleClientId, ...csv(env.APPLE_CLIENT_IDS)].filter((id): id is string => Boolean(id)))];
  return {
    appUrl: env.APP_URL,
    jwtSecret: env.JWT_ACCESS_SECRET,
    extraOrigins: csv(env.OAUTH_REDIRECT_ORIGINS),
    googleClientId,
    googleClientSecret: blank(env.GOOGLE_CLIENT_SECRET),
    googleAudiences,
    facebookAppId: blank(env.FACEBOOK_APP_ID),
    facebookAppSecret: blank(env.FACEBOOK_APP_SECRET),
    appleClientId,
    appleAudiences,
    appleTeamId: blank(env.APPLE_TEAM_ID),
    appleKeyId: blank(env.APPLE_KEY_ID),
    applePrivateKey: blank(env.APPLE_PRIVATE_KEY)?.replace(/\\n/g, "\n"),
  };
}

export function providerConfigured(config: OAuthConfig, provider: OAuthProviderName) {
  if (provider === "google") return Boolean(config.googleClientId && config.googleClientSecret);
  if (provider === "facebook") return Boolean(config.facebookAppId && config.facebookAppSecret);
  return Boolean(config.appleClientId && config.appleTeamId && config.appleKeyId && config.applePrivateKey);
}

function wwwPair(origin: string) {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return [];
  }
  const host = url.hostname;
  const port = url.port ? `:${url.port}` : "";
  if (host === "localhost") return [`${url.protocol}//127.0.0.1${port}`];
  if (host === "127.0.0.1") return [`${url.protocol}//localhost${port}`];
  const pair = host.startsWith("www.") ? host.slice(4) : `www.${host}`;
  return [`${url.protocol}//${pair}${port}`];
}

export function allowedOAuthRedirect(uri: string, config: Pick<OAuthConfig, "appUrl" | "extraOrigins">) {
  let url: URL;
  let app: URL;
  try {
    url = new URL(uri);
    app = new URL(config.appUrl);
  } catch {
    return false;
  }
  if (url.username || url.password || url.search || url.hash) return false;
  const origins = new Set([app.origin, ...wwwPair(app.origin), ...config.extraOrigins]);
  if (!origins.has(url.origin)) return false;
  return (
    url.pathname === "/auth/callback" ||
    url.pathname === "/auth/callback/app" ||
    url.pathname === "/auth/callback/apple"
  );
}

export function signOAuthState(payload: OAuthState, secret: string) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function readOAuthState(token: string, secret: string, now = Date.now()): OAuthState | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, mac] = parts;
  if (!body || !mac) return null;
  const expected = createHmac("sha256", secret).update(body).digest();
  const given = Buffer.from(mac, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!isState(parsed) || parsed.exp * 1000 < now) return null;
  return parsed;
}

function isState(value: unknown): value is OAuthState {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    (row.provider === "google" || row.provider === "apple" || row.provider === "facebook") &&
    typeof row.exp === "number" &&
    typeof row.adult === "boolean" &&
    (row.locale === "FA" || row.locale === "EN" || row.locale === "TR") &&
    typeof row.nonce === "string" &&
    row.nonce.length >= 8 &&
    typeof row.redirectUri === "string"
  );
}

export function sanitizeDisplayName(value: string | null | undefined) {
  const cleaned = (value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
  return cleaned.length >= 2 ? cleaned : null;
}

export function startOAuth(config: OAuthConfig, body: OAuthStartBody) {
  if (!providerConfigured(config, body.provider)) {
    throw new OAuthError("AUTH_OAUTH_UNAVAILABLE", "This sign-in method is not configured.");
  }
  if (!allowedOAuthRedirect(body.redirectUri, config)) {
    throw new OAuthError("AUTH_OAUTH_INVALID", "That return address is not allowed.");
  }
  const state = signOAuthState(
    {
      provider: body.provider,
      exp: Math.floor(Date.now() / 1000) + STATE_TTL_SECONDS,
      adult: body.adult === true,
      locale: body.locale,
      nonce: randomBytes(16).toString("base64url"),
      redirectUri: body.redirectUri,
    },
    config.jwtSecret,
  );
  const payload = readOAuthState(state, config.jwtSecret);
  if (!payload) throw new OAuthError("AUTH_OAUTH_INVALID", "Could not start sign-in.");
  return { url: authorizeUrl(config, payload, state) };
}

function authorizeUrl(config: OAuthConfig, payload: OAuthState, state: string) {
  if (payload.provider === "google") {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", config.googleClientId ?? "");
    url.searchParams.set("redirect_uri", payload.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("nonce", payload.nonce);
    url.searchParams.set("prompt", "select_account");
    return url.toString();
  }
  if (payload.provider === "facebook") {
    const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
    url.searchParams.set("client_id", config.facebookAppId ?? "");
    url.searchParams.set("redirect_uri", payload.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "email,public_profile");
    url.searchParams.set("state", state);
    return url.toString();
  }
  const url = new URL("https://appleid.apple.com/auth/authorize");
  url.searchParams.set("client_id", config.appleClientId ?? "");
  url.searchParams.set("redirect_uri", payload.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("response_mode", "form_post");
  url.searchParams.set("scope", "name email");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", payload.nonce);
  return url.toString();
}

export async function resolveOAuth(
  config: OAuthConfig,
  body: OAuthBody,
  fetchImpl: typeof fetch = fetch,
): Promise<ResolvedOAuth> {
  if ("code" in body) return resolveCode(config, body, fetchImpl);
  return resolveToken(config, body, fetchImpl);
}

async function resolveCode(
  config: OAuthConfig,
  body: Extract<OAuthBody, { code: string }>,
  fetchImpl: typeof fetch,
): Promise<ResolvedOAuth> {
  const state = readOAuthState(body.state, config.jwtSecret);
  if (!state || state.redirectUri !== body.redirectUri || !allowedOAuthRedirect(body.redirectUri, config)) {
    throw new OAuthError("AUTH_OAUTH_INVALID", "Sign-in could not be verified.");
  }
  if (!providerConfigured(config, state.provider)) {
    throw new OAuthError("AUTH_OAUTH_UNAVAILABLE", "This sign-in method is not configured.");
  }
  const profile =
    state.provider === "google"
      ? await googleFromCode(config, body.code, body.redirectUri, state.nonce, fetchImpl)
      : state.provider === "facebook"
        ? await facebookFromCode(config, body.code, body.redirectUri, fetchImpl)
        : await appleFromCode(config, body.code, body.redirectUri, state.nonce, fetchImpl);
  return {
    profile,
    adult: state.adult,
    locale: state.locale,
    displayName: sanitizeDisplayName(body.displayName),
  };
}

async function resolveToken(
  config: OAuthConfig,
  body: Exclude<OAuthBody, { code: string }>,
  fetchImpl: typeof fetch,
): Promise<ResolvedOAuth> {
  const profile = body.idToken
    ? body.provider === "apple"
      ? await appleFromIdToken(config, body.idToken, body.nonce, fetchImpl)
      : body.provider === "google"
        ? await googleFromIdToken(config, body.idToken, body.nonce, fetchImpl)
        : null
    : null;
  const resolved =
    profile ??
    (body.provider === "facebook" && body.accessToken
      ? await facebookFromAccessToken(config, body.accessToken, fetchImpl)
      : null);
  if (!resolved) throw new OAuthError("AUTH_OAUTH_INVALID", "Sign-in could not be verified.");
  return {
    profile: resolved,
    adult: body.adult === true,
    locale: body.locale,
    displayName: sanitizeDisplayName(body.displayName),
  };
}

type GoogleInfo = {
  aud?: string | string[];
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  exp?: string | number;
  nonce?: string;
  name?: string;
  iss?: string;
};

export function googleProfile(
  info: GoogleInfo,
  audiences: string[],
  expectedNonce?: string,
  now = Date.now(),
): OAuthProfile {
  const aud = Array.isArray(info.aud) ? info.aud : info.aud ? [info.aud] : [];
  const exp = Number(info.exp);
  const issOk = info.iss === "accounts.google.com" || info.iss === "https://accounts.google.com";
  if (!info.sub || !issOk || !Number.isFinite(exp) || exp * 1000 < now - 60_000 || !aud.some((item) => audiences.includes(item))) {
    throw new OAuthError("AUTH_OAUTH_INVALID", "Google did not confirm this sign-in.");
  }
  if (expectedNonce !== undefined || info.nonce !== undefined) {
    if (!expectedNonce || info.nonce !== expectedNonce) {
      throw new OAuthError("AUTH_OAUTH_INVALID", "Google did not confirm this sign-in.");
    }
  }
  const email = typeof info.email === "string" ? info.email.trim().toLowerCase() : "";
  return {
    provider: "google",
    providerUserId: info.sub,
    email: email.includes("@") ? email : null,
    emailVerified: info.email_verified === true || info.email_verified === "true",
    name: sanitizeDisplayName(info.name),
  };
}

export function appleProfile(
  claims: { sub?: string; email?: string; email_verified?: boolean | string; aud?: string | string[]; iss?: string; exp?: number; nonce?: string },
  audiences: string[],
  expectedNonce?: string,
  now = Date.now(),
): OAuthProfile {
  const aud = Array.isArray(claims.aud) ? claims.aud : claims.aud ? [claims.aud] : [];
  if (
    claims.iss !== "https://appleid.apple.com" ||
    !claims.sub ||
    typeof claims.exp !== "number" ||
    claims.exp * 1000 < now - 60_000 ||
    !aud.some((item) => audiences.includes(item))
  ) {
    throw new OAuthError("AUTH_OAUTH_INVALID", "Apple did not confirm this sign-in.");
  }
  if (expectedNonce !== undefined || claims.nonce !== undefined) {
    if (!expectedNonce || claims.nonce !== expectedNonce) {
      throw new OAuthError("AUTH_OAUTH_INVALID", "Apple did not confirm this sign-in.");
    }
  }
  const email = typeof claims.email === "string" ? claims.email.trim().toLowerCase() : "";
  const verified = claims.email_verified === true || claims.email_verified === "true" || claims.email_verified === undefined;
  return {
    provider: "apple",
    providerUserId: claims.sub,
    email: email.includes("@") ? email : null,
    emailVerified: Boolean(email) && verified,
    name: null,
  };
}

export function facebookProfile(
  me: { id?: string; email?: string; name?: string },
  debug: { is_valid?: boolean; app_id?: string },
  appId: string,
): OAuthProfile {
  if (debug.is_valid !== true || debug.app_id !== appId || !me.id) {
    throw new OAuthError("AUTH_OAUTH_INVALID", "Facebook did not confirm this sign-in.");
  }
  const email = typeof me.email === "string" ? me.email.trim().toLowerCase() : "";
  return {
    provider: "facebook",
    providerUserId: me.id,
    email: email.includes("@") ? email : null,
    emailVerified: email.includes("@"),
    name: sanitizeDisplayName(me.name),
  };
}

async function googleFromCode(
  config: OAuthConfig,
  code: string,
  redirectUri: string,
  nonce: string,
  fetchImpl: typeof fetch,
) {
  const token = await postForm(
    "https://oauth2.googleapis.com/token",
    {
      code,
      client_id: config.googleClientId ?? "",
      client_secret: config.googleClientSecret ?? "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    },
    fetchImpl,
  );
  const idToken = stringField(token, "id_token");
  if (!idToken) throw new OAuthError("AUTH_OAUTH_INVALID", "Google did not confirm this sign-in.");
  return googleFromIdToken(config, idToken, nonce, fetchImpl);
}

async function googleFromIdToken(config: OAuthConfig, idToken: string, nonce: string | undefined, fetchImpl: typeof fetch) {
  if (config.googleAudiences.length === 0) {
    throw new OAuthError("AUTH_OAUTH_UNAVAILABLE", "This sign-in method is not configured.");
  }
  const url = new URL("https://oauth2.googleapis.com/tokeninfo");
  url.searchParams.set("id_token", idToken);
  const info = (await getJson(url, fetchImpl)) as GoogleInfo;
  return googleProfile(info, config.googleAudiences, nonce);
}

async function facebookFromCode(config: OAuthConfig, code: string, redirectUri: string, fetchImpl: typeof fetch) {
  const url = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  url.searchParams.set("client_id", config.facebookAppId ?? "");
  url.searchParams.set("client_secret", config.facebookAppSecret ?? "");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);
  const token = await getJson(url, fetchImpl);
  const accessToken = stringField(token, "access_token");
  if (!accessToken) throw new OAuthError("AUTH_OAUTH_INVALID", "Facebook did not confirm this sign-in.");
  return facebookFromAccessToken(config, accessToken, fetchImpl);
}

async function facebookFromAccessToken(config: OAuthConfig, accessToken: string, fetchImpl: typeof fetch) {
  if (!config.facebookAppId || !config.facebookAppSecret) {
    throw new OAuthError("AUTH_OAUTH_UNAVAILABLE", "This sign-in method is not configured.");
  }
  const debugUrl = new URL("https://graph.facebook.com/debug_token");
  debugUrl.searchParams.set("input_token", accessToken);
  debugUrl.searchParams.set("access_token", `${config.facebookAppId}|${config.facebookAppSecret}`);
  const debugBody = await getJson(debugUrl, fetchImpl);
  const debug = (debugBody && typeof debugBody === "object" ? (debugBody as { data?: { is_valid?: boolean; app_id?: string } }).data : undefined) ?? {};
  const meUrl = new URL("https://graph.facebook.com/me");
  meUrl.searchParams.set("fields", "id,name,email");
  meUrl.searchParams.set("access_token", accessToken);
  const me = (await getJson(meUrl, fetchImpl)) as { id?: string; email?: string; name?: string };
  return facebookProfile(me, debug, config.facebookAppId);
}

let appleKeys: { keys: Array<JsonWebKey & { kid?: string }>; fetched: number } | null = null;

export function resetAppleKeyCache() {
  appleKeys = null;
}

async function appleFromCode(
  config: OAuthConfig,
  code: string,
  redirectUri: string,
  nonce: string,
  fetchImpl: typeof fetch,
) {
  const token = await postForm(
    "https://appleid.apple.com/auth/token",
    {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: config.appleClientId ?? "",
      client_secret: appleClientSecret(config),
    },
    fetchImpl,
  );
  const idToken = stringField(token, "id_token");
  if (!idToken) throw new OAuthError("AUTH_OAUTH_INVALID", "Apple did not confirm this sign-in.");
  return appleFromIdToken(config, idToken, nonce, fetchImpl);
}

async function appleFromIdToken(config: OAuthConfig, idToken: string, nonce: string | undefined, fetchImpl: typeof fetch) {
  if (config.appleAudiences.length === 0) {
    throw new OAuthError("AUTH_OAUTH_UNAVAILABLE", "This sign-in method is not configured.");
  }
  const claims = await verifyAppleIdToken(idToken, fetchImpl);
  return appleProfile(claims, config.appleAudiences, nonce);
}

export function appleClientSecret(config: OAuthConfig, now = Math.floor(Date.now() / 1000)) {
  if (!config.appleTeamId || !config.appleKeyId || !config.appleClientId || !config.applePrivateKey) {
    throw new OAuthError("AUTH_OAUTH_UNAVAILABLE", "This sign-in method is not configured.");
  }
  const header = Buffer.from(JSON.stringify({ alg: "ES256", kid: config.appleKeyId })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: config.appleTeamId,
      iat: now,
      exp: now + 600,
      aud: "https://appleid.apple.com",
      sub: config.appleClientId,
    }),
  ).toString("base64url");
  const signingInput = `${header}.${payload}`;
  const signature = createSign("SHA256")
    .update(signingInput)
    .sign({ key: createPrivateKey(config.applePrivateKey), dsaEncoding: "ieee-p1363" });
  return `${signingInput}.${Buffer.from(signature).toString("base64url")}`;
}

export async function verifyAppleIdToken(idToken: string, fetchImpl: typeof fetch, now = Date.now()) {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new OAuthError("AUTH_OAUTH_INVALID", "Apple did not confirm this sign-in.");
  const [headerPart, payloadPart, signaturePart] = parts;
  let header: { alg?: string; kid?: string };
  let payload: { sub?: string; email?: string; email_verified?: boolean | string; aud?: string | string[]; iss?: string; exp?: number; nonce?: string };
  try {
    header = JSON.parse(Buffer.from(headerPart, "base64url").toString("utf8"));
    payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
  } catch {
    throw new OAuthError("AUTH_OAUTH_INVALID", "Apple did not confirm this sign-in.");
  }
  if (header.alg !== "ES256" || !header.kid) {
    throw new OAuthError("AUTH_OAUTH_INVALID", "Apple did not confirm this sign-in.");
  }
  const jwk = await appleJwk(header.kid, fetchImpl, now);
  const signature = Buffer.from(signaturePart, "base64url");
  const verified = createVerify("SHA256")
    .update(`${headerPart}.${payloadPart}`)
    .verify({ key: createPublicKey({ key: jwk, format: "jwk" }), dsaEncoding: "ieee-p1363" }, signature);
  if (!verified) throw new OAuthError("AUTH_OAUTH_INVALID", "Apple did not confirm this sign-in.");
  return payload;
}

async function appleJwk(kid: string, fetchImpl: typeof fetch, now: number) {
  if (!appleKeys || now - appleKeys.fetched > 60 * 60_000) {
    const body = await getJson(new URL("https://appleid.apple.com/auth/keys"), fetchImpl);
    const keys = body && typeof body === "object" && Array.isArray((body as { keys?: unknown }).keys)
      ? ((body as { keys: Array<JsonWebKey & { kid?: string }> }).keys)
      : [];
    appleKeys = { keys, fetched: now };
  }
  const key = appleKeys.keys.find((item) => item.kid === kid);
  if (!key) throw new OAuthError("AUTH_OAUTH_INVALID", "Apple did not confirm this sign-in.");
  return key;
}

async function postForm(url: string, fields: Record<string, string>, fetchImpl: typeof fetch) {
  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams(fields),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new OAuthError("AUTH_OAUTH_INVALID", "Sign-in could not be verified.");
  }
  const json = await response.json().catch(() => null);
  if (!response.ok || !json || typeof json !== "object") {
    throw new OAuthError("AUTH_OAUTH_INVALID", "Sign-in could not be verified.");
  }
  return json as Record<string, unknown>;
}

async function getJson(url: URL, fetchImpl: typeof fetch) {
  let response: Response;
  try {
    response = await fetchImpl(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new OAuthError("AUTH_OAUTH_INVALID", "Sign-in could not be verified.");
  }
  const json = await response.json().catch(() => null);
  if (!response.ok || !json || typeof json !== "object") {
    throw new OAuthError("AUTH_OAUTH_INVALID", "Sign-in could not be verified.");
  }
  return json;
}

function stringField(body: unknown, key: string) {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}
