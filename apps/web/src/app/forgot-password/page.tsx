"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { forgotPasswordBodySchema } from "@dorham/shared";
import { PageIntro } from "../../components/page-intro";
import { SiteHeader } from "../../components/site-header";
import { api, ApiError } from "../../lib/api";

export default function ForgotPasswordPage() {
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
      setError("ایمیل را درست بنویس.");
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
      setError(err instanceof ApiError ? err.message : "درخواست نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="رمز" title="بازیابی رمز">
        <p className="muted">اگر حساب داشته باشی، لینک به ایمیلت می‌آید.</p>
      </PageIntro>
      <div className="form-card">
        {done ? (
          <div className="stack">
            <div className="banner ok">اگر حسابی با این ایمیل باشد، لینک بازیابی فرستاده شد.</div>
            {devToken ? (
              <p className="muted">
                حالت توسعه:{" "}
                <Link href={`/reset-password?token=${encodeURIComponent(devToken)}`}>باز کردن لینک</Link>
              </p>
            ) : null}
            <Link className="btn" href="/login">
              بازگشت به ورود
            </Link>
          </div>
        ) : (
          <form className="form" onSubmit={onSubmit}>
            {error ? <div className="banner err">{error}</div> : null}
            <label>
              ایمیل
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <button className="btn" type="submit" disabled={pending}>
              {pending ? "..." : "ارسال لینک"}
            </button>
            <p className="muted">
              <Link href="/login">ورود</Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
