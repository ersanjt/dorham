"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { resetPasswordBodySchema } from "@dorham/shared";
import { PageIntro } from "../../components/page-intro";
import { SiteHeader } from "../../components/site-header";
import { api, ApiError } from "../../lib/api";

function ResetForm() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") ?? "";
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const parsed = resetPasswordBodySchema.safeParse({
      token,
      password: String(form.get("password") ?? ""),
    });
    if (!parsed.success) {
      setError("رمز حداقل ۱۰ کاراکتر با حرف و عدد. لینک را از ایمیل باز کن.");
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
      setError(err instanceof ApiError ? err.message : "تغییر رمز نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="رمز" title="رمز تازه">
        <p className="muted">بعد از تغییر، دوباره وارد شو.</p>
      </PageIntro>
      <div className="form-card">
        <form className="form" onSubmit={onSubmit}>
          {error ? <div className="banner err">{error}</div> : null}
          {!token ? <div className="banner err">لینک ناقص است. از ایمیل بازیابی باز کن.</div> : null}
          <label>
            رمز تازه
            <input name="password" type="password" autoComplete="new-password" minLength={10} required />
          </label>
          <button className="btn" type="submit" disabled={pending || !token}>
            {pending ? "..." : "ذخیره رمز"}
          </button>
          <p className="muted">
            <Link href="/login">ورود</Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="wrap">در حال بارگذاری...</main>}>
      <ResetForm />
    </Suspense>
  );
}
