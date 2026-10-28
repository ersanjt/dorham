"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { resetPasswordBodySchema } from "@dorham/shared";
import { PageIntro } from "../../components/page-intro";
import { SiteHeader } from "../../components/site-header";
import { useCopy } from "../../components/locale-provider";
import { api, ApiError } from "../../lib/api";
import { takeLinkToken } from "../../lib/door-secret";

function ResetForm() {
  const copy = useCopy();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setToken(takeLinkToken("token"));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const parsed = resetPasswordBodySchema.safeParse({
      token,
      password: String(form.get("password") ?? ""),
    });
    if (!parsed.success) {
      setError(copy.auth.resetBad);
      return;
    }
    setPending(true);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        auth: false,
        body: JSON.stringify(parsed.data),
      });
      router.push("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : copy.auth.resetFail);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker={copy.auth.resetKicker} title={copy.auth.resetTitle}>
        <p className="muted">{copy.auth.resetLead}</p>
      </PageIntro>
      <div className="form-card">
        <form className="form" onSubmit={onSubmit}>
          {error ? <div className="banner err">{error}</div> : null}
          {!token ? <div className="banner err">{copy.auth.resetMissing}</div> : null}
          <label>
            {copy.auth.newPassword}
            <input name="password" type="password" autoComplete="new-password" minLength={10} required />
          </label>
          <button className="btn" type="submit" disabled={pending || !token}>
            {pending ? "..." : copy.auth.savePassword}
          </button>
          <p className="muted">
            <Link href="/login">{copy.auth.submitLogin}</Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <ResetForm />;
}
