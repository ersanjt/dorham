"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SiteHeader } from "../../components/site-header";
import { api, ApiError } from "../../lib/api";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<"pending" | "ok" | "err">("pending");
  const [message, setMessage] = useState("در حال تأیید ایمیل...");

  useEffect(() => {
    if (!token) {
      setState("err");
      setMessage("لینک تأیید ناقص است.");
      return;
    }
    api<{ ok: boolean }>("/auth/verify-email", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ token }),
    })
      .then(() => {
        setState("ok");
        setMessage("ایمیل تأیید شد.");
      })
      .catch((err: unknown) => {
        setState("err");
        setMessage(err instanceof ApiError ? err.message : "تأیید نشد.");
      });
  }, [token]);

  return (
    <>
      <div className={`banner ${state === "ok" ? "ok" : state === "err" ? "err" : ""}`}>{message}</div>
      {state === "ok" ? (
        <div className="row" style={{ marginTop: 16 }}>
          <Link className="btn" href="/account">
            حساب من
          </Link>
          <Link className="btn ghost" href="/events">
            رویدادهای شهر
          </Link>
        </div>
      ) : null}
      {state === "err" ? (
        <div className="row" style={{ marginTop: 16 }}>
          <Link className="btn ghost" href="/account">
            حساب من
          </Link>
        </div>
      ) : null}
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="wrap">
      <SiteHeader />
      <h1>تأیید ایمیل</h1>
      <Suspense fallback={<p className="muted">...</p>}>
        <VerifyInner />
      </Suspense>
    </main>
  );
}
