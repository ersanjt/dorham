"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { loginBodySchema } from "@dorham/shared";
import { SiteHeader } from "../../components/site-header";
import { PageIntro } from "../../components/page-intro";
import { useCopy } from "../../components/locale-provider";
import { api, ApiError } from "../../lib/api";
import { safeNext } from "../../lib/paths";
import { setSession } from "../../lib/session";

function LoginForm() {
  const copy = useCopy();
  const router = useRouter();
  const search = useSearchParams();
  const next = safeNext(search.get("next"));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const parsed = loginBodySchema.safeParse({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    if (!parsed.success) {
      setError(copy.auth.badLogin);
      return;
    }
    setPending(true);
    try {
      const data = await api<{ accessToken: string; refreshToken: string }>("/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify(parsed.data),
      });
      setSession(data.accessToken, data.refreshToken);
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : copy.auth.loginFail);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker={copy.auth.loginKicker} title={copy.auth.loginTitle}>
        <p className="muted">{copy.auth.loginLead}</p>
      </PageIntro>
      <div className="form-card">
        <form className="form" onSubmit={onSubmit}>
          {error ? <div className="banner err">{error}</div> : null}
          <label>
            {copy.auth.email}
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            {copy.auth.password}
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "..." : copy.auth.submitLogin}
          </button>
          <p className="muted">
            {copy.auth.noAccount} <Link href={`/register?next=${encodeURIComponent(next)}`}>{copy.auth.register}</Link>
            {" · "}
            <Link href="/forgot-password">{copy.auth.forgot}</Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="wrap">…</main>}>
      <LoginForm />
    </Suspense>
  );
}
