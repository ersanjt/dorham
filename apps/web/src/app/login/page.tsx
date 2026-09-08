"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { loginBodySchema } from "@dorham/shared";
import { SiteHeader } from "../../components/site-header";
import { PageIntro } from "../../components/page-intro";
import { api, ApiError } from "../../lib/api";
import { safeNext } from "../../lib/paths";
import { setSession } from "../../lib/session";

function LoginForm() {
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
      setError("ایمیل و رمز را درست بنویس.");
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
      setError(err instanceof ApiError ? err.message : "ورود نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="یک حساب" title="ورود">
        <p className="muted">وب و اپ همان حساب را دارند.</p>
      </PageIntro>
      <div className="form-card">
      <form className="form" onSubmit={onSubmit}>
        {error ? <div className="banner err">{error}</div> : null}
        <label>
          ایمیل
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          رمز
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "..." : "ورود"}
        </button>
        <p className="muted">
          حساب نداری؟ <Link href={`/register?next=${encodeURIComponent(next)}`}>ثبت‌نام</Link>
        </p>
      </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="wrap">در حال بارگذاری...</main>}>
      <LoginForm />
    </Suspense>
  );
}
