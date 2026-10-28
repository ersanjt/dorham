"use client";

import { useState } from "react";
import { oauthStartBodySchema } from "@dorham/shared";
import { api, ApiError } from "../lib/api";
import { safeNext } from "../lib/paths";
import { useCopy, useUiLocale } from "./locale-provider";

const NEXT_KEY = "dorham.oauth.next";

export function rememberOAuthNext(next: string) {
  sessionStorage.setItem(NEXT_KEY, safeNext(next));
}

export function takeOAuthNext(fallback: string) {
  const value = sessionStorage.getItem(NEXT_KEY);
  sessionStorage.removeItem(NEXT_KEY);
  return safeNext(value, fallback);
}

export function SocialAuth({
  next,
  adult = false,
  requireAdult = false,
  termsAccepted = true,
}: {
  next: string;
  adult?: boolean;
  requireAdult?: boolean;
  termsAccepted?: boolean;
}) {
  const copy = useCopy();
  const locale = useUiLocale();
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");

  async function start(provider: "google" | "apple" | "facebook") {
    if (requireAdult && !adult) {
      setError(copy.auth.adultRequired);
      return;
    }
    if (requireAdult && !termsAccepted) {
      setError(copy.auth.termsRequired);
      return;
    }
    setError("");
    setPending(provider);
    const redirectUri = `${location.origin}/auth/callback${provider === "apple" ? "/apple" : ""}`;
    const parsed = oauthStartBodySchema.safeParse({
      provider,
      redirectUri,
      locale: locale === "en" ? "EN" : "FA",
      ...(requireAdult ? { adult: true } : {}),
    });
    if (!parsed.success) {
      setError(copy.auth.oauthFail);
      setPending("");
      return;
    }
    try {
      const data = await api<{ url: string }>("/auth/oauth/start", {
        method: "POST",
        auth: false,
        body: JSON.stringify(parsed.data),
      });
      rememberOAuthNext(next);
      location.assign(data.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : copy.auth.oauthFail);
      setPending("");
    }
  }

  return (
    <div className="social-auth">
      {error ? <div className="banner err">{error}</div> : null}
      <button className="btn ghost" type="button" disabled={Boolean(pending)} onClick={() => start("google")}>
        {pending === "google" ? "..." : copy.auth.google}
      </button>
      <button className="btn ghost" type="button" disabled={Boolean(pending)} onClick={() => start("apple")}>
        {pending === "apple" ? "..." : copy.auth.apple}
      </button>
      <button className="btn ghost" type="button" disabled={Boolean(pending)} onClick={() => start("facebook")}>
        {pending === "facebook" ? "..." : copy.auth.facebook}
      </button>
      <p className="muted social-or">{copy.auth.orEmail}</p>
    </div>
  );
}
