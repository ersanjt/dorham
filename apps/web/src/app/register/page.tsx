"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { registerBodySchema } from "@dorham/shared";
import { SiteHeader } from "../../components/site-header";
import { PageIntro } from "../../components/page-intro";
import { useCopy, useUiLocale } from "../../components/locale-provider";
import { api, ApiError } from "../../lib/api";
import { setSession } from "../../lib/session";

export default function RegisterPage() {
  const copy = useCopy();
  const locale = useUiLocale();
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const parsed = registerBodySchema.safeParse({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      displayName: String(form.get("displayName") ?? ""),
      locale: locale === "en" ? "EN" : "FA",
    });
    if (!parsed.success) {
      setError(copy.auth.registerBad);
      return;
    }
    setPending(true);
    try {
      const data = await api<{ accessToken: string; refreshToken: string; verifyEmailToken?: string }>(
        "/auth/register",
        { method: "POST", auth: false, body: JSON.stringify(parsed.data) },
      );
      setSession(data.accessToken, data.refreshToken);
      if (data.verifyEmailToken) {
        router.push(`/verify-email?token=${encodeURIComponent(data.verifyEmailToken)}`);
      } else {
        router.push("/account?verify=1");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : copy.auth.registerFail);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker={copy.auth.registerKicker} title={copy.auth.registerTitle}>
        <p className="muted">{copy.auth.registerLead}</p>
      </PageIntro>
      <div className="form-card">
        <form className="form" onSubmit={onSubmit}>
          {error ? <div className="banner err">{error}</div> : null}
          <label>
            {copy.auth.displayName}
            <input name="displayName" minLength={2} maxLength={40} required />
          </label>
          <label>
            {copy.auth.email}
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            {copy.auth.password}
            <input name="password" type="password" autoComplete="new-password" minLength={10} required />
          </label>
          <label className="check">
            <input name="adult" type="checkbox" required />
            {copy.auth.adult}
          </label>
          <label className="check">
            <input name="terms" type="checkbox" required />
            <span>
              {copy.auth.termsPrefix}
              <Link href="/safety">{copy.auth.rules}</Link>
              {copy.auth.and}
              <Link href="/privacy">{copy.auth.privacy}</Link> {copy.auth.termsAccept}
            </span>
          </label>
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "..." : copy.auth.submitRegister}
          </button>
          <p className="muted">
            {copy.auth.haveAccount} <Link href="/login">{copy.auth.submitLogin}</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
