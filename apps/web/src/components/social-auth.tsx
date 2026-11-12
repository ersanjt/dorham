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
  const locked = requireAdult && (!adult || !termsAccepted);

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
      <button className="btn brand-google" type="button" disabled={Boolean(pending) || locked} onClick={() => start("google")}>
        <GoogleMark />
        {pending === "google" ? "..." : copy.auth.google}
      </button>
      <button className="btn brand-apple" type="button" disabled={Boolean(pending) || locked} onClick={() => start("apple")}>
        <AppleMark />
        {pending === "apple" ? "..." : copy.auth.apple}
      </button>
      <button className="btn brand-facebook" type="button" disabled={Boolean(pending) || locked} onClick={() => start("facebook")}>
        <FacebookMark />
        {pending === "facebook" ? "..." : copy.auth.facebook}
      </button>
      <p className="muted social-or">{copy.auth.orEmail}</p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="provider-mark" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg className="provider-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
      />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg className="provider-mark" viewBox="0 0 320 512" aria-hidden="true">
      <path
        fill="currentColor"
        d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"
      />
    </svg>
  );
}
