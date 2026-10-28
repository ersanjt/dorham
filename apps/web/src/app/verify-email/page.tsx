"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { SiteHeader } from "../../components/site-header";
import { useCopy } from "../../components/locale-provider";
import { api, ApiError } from "../../lib/api";
import { takeLinkToken } from "../../lib/door-secret";
import { safeNext } from "../../lib/paths";

function VerifyInner() {
  const copy = useCopy();
  const params = useSearchParams();
  const next = safeNext(params.get("next"), "/start");
  const started = useRef(false);
  const [state, setState] = useState<"pending" | "ok" | "err">("pending");
  const [message, setMessage] = useState(copy.auth.verifyPending);

  useEffect(() => {
    const token = takeLinkToken("token");
    if (started.current) return;
    started.current = true;
    if (!token) {
      setState("err");
      setMessage(copy.auth.verifyBad);
      return;
    }
    api<{ ok: boolean }>("/auth/verify-email", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ token }),
    })
      .then(() => {
        setState("ok");
        setMessage(copy.auth.verifyOk);
      })
      .catch((err: unknown) => {
        setState("err");
        setMessage(err instanceof ApiError ? err.message : copy.auth.verifyFail);
      });
  }, [copy.auth.verifyBad, copy.auth.verifyFail, copy.auth.verifyOk]);

  return (
    <>
      <div className={`banner ${state === "ok" ? "ok" : state === "err" ? "err" : ""}`}>{message}</div>
      {state === "ok" ? (
        <div className="row" style={{ marginTop: 16 }}>
          <Link className="btn" href={next}>
            {copy.auth.verifyContinue}
          </Link>
          <Link className="btn ghost" href="/events">
            {copy.nav.events}
          </Link>
        </div>
      ) : null}
      {state === "err" ? (
        <div className="row" style={{ marginTop: 16 }}>
          <Link className="btn ghost" href="/account?tab=trust">
            {copy.nav.account}
          </Link>
        </div>
      ) : null}
    </>
  );
}

export default function VerifyEmailPage() {
  const copy = useCopy();
  return (
    <main className="wrap">
      <SiteHeader />
      <h1>{copy.auth.verifyTitle}</h1>
      <Suspense fallback={<p className="muted">...</p>}>
        <VerifyInner />
      </Suspense>
    </main>
  );
}
