"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteHeader } from "../../../components/site-header";
import { takeOAuthNext } from "../../../components/social-auth";
import { useCopy } from "../../../components/locale-provider";
import { api, ApiError } from "../../../lib/api";
import { setSession } from "../../../lib/session";

type CallbackPayload = {
  code: string | null;
  state: string | null;
  via: string | null;
  name: string | null;
  providerError: string | null;
  next: string;
};

let heldCallback: CallbackPayload | null = null;
let exchangeInFlight: Promise<void> | null = null;

function readCallback(): CallbackPayload | null {
  if (typeof window === "undefined") return heldCallback;
  const params = new URLSearchParams(window.location.search);
  if (params.has("code") || params.has("state") || params.has("error")) {
    heldCallback = {
      code: params.get("code"),
      state: params.get("state"),
      via: params.get("via"),
      name: params.get("name"),
      providerError: params.get("error"),
      next: takeOAuthNext("/account"),
    };
    window.history.replaceState(null, "", "/auth/callback");
  }
  return heldCallback;
}

export default function OAuthCallbackPage() {
  const copy = useCopy();
  const router = useRouter();
  const [error, setError] = useState("");
  const [ageRequired, setAgeRequired] = useState(false);

  useEffect(() => {
    const payload = readCallback();
    if (!payload || payload.providerError || !payload.code || !payload.state) {
      setError(copy.auth.oauthMissing);
      return;
    }
    const redirectUri = `${window.location.origin}/auth/callback${payload.via === "apple" ? "/apple" : ""}`;
    const body: { code: string; state: string; redirectUri: string; displayName?: string } = {
      code: payload.code,
      state: payload.state,
      redirectUri,
    };
    const name = payload.name?.trim();
    if (name && name.length >= 2 && name.length <= 40) body.displayName = name;
    let active = true;
    exchangeInFlight ??= api<{ accessToken: string; refreshToken: string }>("/auth/oauth", {
      method: "POST",
      auth: false,
      body: JSON.stringify(body),
    }).then((data) => {
      setSession(data.accessToken, data.refreshToken);
    });
    exchangeInFlight
      .then(() => {
        if (!active) return;
        heldCallback = null;
        exchangeInFlight = null;
        router.replace(payload.next);
        router.refresh();
      })
      .catch((err: unknown) => {
        exchangeInFlight = null;
        if (!active) return;
        if (err instanceof ApiError && err.code === "AUTH_AGE_REQUIRED") setAgeRequired(true);
        setError(err instanceof ApiError ? err.message : copy.auth.oauthFail);
      });
    return () => {
      active = false;
    };
  }, [copy.auth.oauthFail, copy.auth.oauthMissing, router]);

  return (
    <main className="wrap">
      <SiteHeader />
      <div className="form-card">
        {error ? <div className="banner err">{error}</div> : <p>{copy.auth.oauthReturn}</p>}
        {ageRequired ? (
          <p>
            <Link href="/register">{copy.auth.register}</Link>
          </p>
        ) : null}
      </div>
    </main>
  );
}
