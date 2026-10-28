"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { forgotPasswordBodySchema } from "@dorham/shared";
import { PageIntro } from "../../components/page-intro";
import { SiteHeader } from "../../components/site-header";
import { useCopy } from "../../components/locale-provider";
import { api, ApiError } from "../../lib/api";

export default function ForgotPasswordPage() {
  const copy = useCopy();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [devToken, setDevToken] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const parsed = forgotPasswordBodySchema.safeParse({ email: String(form.get("email") ?? "") });
    if (!parsed.success) {
      setError(copy.auth.forgotBad);
      return;
    }
    setPending(true);
    try {
      const data = await api<{ ok: true; resetToken?: string }>("/auth/forgot-password", {
        method: "POST",
        auth: false,
        body: JSON.stringify(parsed.data),
      });
      setDone(true);
      if (data.resetToken) setDevToken(data.resetToken);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : copy.auth.forgotFail);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker={copy.auth.forgotKicker} title={copy.auth.forgotTitle}>
        <p className="muted">{copy.auth.forgotLead}</p>
      </PageIntro>
      <div className="form-card">
        {done ? (
          <div className="stack">
            <div className="banner ok">{copy.auth.forgotDone}</div>
            {devToken ? (
              <p className="muted">
                {copy.auth.forgotDev}{" "}
                <Link href={`/reset-password#token=${encodeURIComponent(devToken)}`}>{copy.auth.openLink}</Link>
              </p>
            ) : null}
            <Link className="btn" href="/login">
              {copy.auth.backLogin}
            </Link>
          </div>
        ) : (
          <form className="form" onSubmit={onSubmit}>
            {error ? <div className="banner err">{error}</div> : null}
            <label>
              {copy.auth.email}
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <button className="btn" type="submit" disabled={pending}>
              {pending ? "..." : copy.auth.sendLink}
            </button>
            <p className="muted">
              <Link href="/login">{copy.auth.submitLogin}</Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
