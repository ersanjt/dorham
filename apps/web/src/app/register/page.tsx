"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { registerBodySchema } from "@dorham/shared";
import { SiteHeader } from "../../components/site-header";
import { PageIntro } from "../../components/page-intro";
import { api, ApiError } from "../../lib/api";
import { setSession } from "../../lib/session";

export default function RegisterPage() {
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
      locale: "FA",
    });
    if (!parsed.success) {
      setError("نام حداقل ۲ حرف، رمز حداقل ۱۰ کاراکتر با حرف و عدد.");
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
        router.push("/account");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ثبت‌نام نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="عضو شهر" title="ساخت حساب">
        <p className="muted">برای ایرانی‌های ساکن ترکیه. ۱۸ سال به بالا. یک حساب برای هر نفر.</p>
      </PageIntro>
      <div className="form-card">
      <form className="form" onSubmit={onSubmit}>
        {error ? <div className="banner err">{error}</div> : null}
        <label>
          نام نمایشی
          <input name="displayName" minLength={2} maxLength={40} required />
        </label>
        <label>
          ایمیل
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          رمز
          <input name="password" type="password" autoComplete="new-password" minLength={10} required />
        </label>
        <label className="check">
          <input name="adult" type="checkbox" required />
          ۱۸ سال یا بیشتر دارم.
        </label>
        <label className="check">
          <input name="terms" type="checkbox" required />
          <span>
            <Link href="/safety">قواعد</Link> و <Link href="/privacy">حریم خصوصی</Link> را می‌پذیرم.
          </span>
        </label>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "..." : "ادامه"}
        </button>
        <p className="muted">
          حساب داری؟ <Link href="/login">ورود</Link>
        </p>
      </form>
      </div>
    </main>
  );
}
