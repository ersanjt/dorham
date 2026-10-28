import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import { oauthStartBodySchema } from "@dorham/shared";
import { api, ApiError } from "./api";
import { publicWebBase } from "./api-base";
import { safeNext } from "./paths";
import { setSession } from "./session";

WebBrowser.maybeCompleteAuthSession();

let pendingNext = "/";
const inflight = new Map<string, Promise<void>>();

export function mobileOAuthRedirect() {
  return `${publicWebBase()}/auth/callback/app`;
}

export async function startSocialLogin(input: {
  provider: "google" | "apple" | "facebook";
  next: string;
  adult?: boolean;
}) {
  const redirectUri = mobileOAuthRedirect();
  const parsed = oauthStartBodySchema.parse({
    provider: input.provider,
    redirectUri,
    locale: "FA",
    ...(input.adult ? { adult: true } : {}),
  });
  const data = await api<{ url: string }>("/auth/oauth/start", {
    method: "POST",
    auth: false,
    body: JSON.stringify(parsed),
  });
  pendingNext = safeNext(input.next);
  const result = await WebBrowser.openAuthSessionAsync(data.url, "dorham://auth/callback");
  if (result.type !== "success") return;
  const url = new URL(result.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    throw new ApiError("AUTH_OAUTH_INVALID", "ورود با این سرویس تأیید نشد. دوباره تلاش کن.");
  }
  await finishSocialLogin({
    code,
    state,
    redirectUri,
    displayName: url.searchParams.get("name") ?? undefined,
  });
}

export function finishSocialLogin(input: {
  code: string;
  state: string;
  redirectUri: string;
  displayName?: string;
}) {
  const existing = inflight.get(input.state);
  if (existing) return existing;
  const job = completeSocialLogin(input).finally(() => {
    inflight.delete(input.state);
  });
  inflight.set(input.state, job);
  return job;
}

async function completeSocialLogin(input: {
  code: string;
  state: string;
  redirectUri: string;
  displayName?: string;
}) {
  const name = input.displayName?.trim();
  const body: { code: string; state: string; redirectUri: string; displayName?: string } = {
    code: input.code,
    state: input.state,
    redirectUri: input.redirectUri,
  };
  if (name && name.length >= 2 && name.length <= 40) body.displayName = name;
  const data = await api<{ accessToken: string; refreshToken: string }>("/auth/oauth", {
    method: "POST",
    auth: false,
    body: JSON.stringify(body),
  });
  await setSession(data.accessToken, data.refreshToken);
  router.replace(pendingNext);
  pendingNext = "/";
}
