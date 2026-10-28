"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CheckInResult } from "@dorham/shared";
import { SiteHeader } from "../../../../components/site-header";
import { api, ApiError } from "../../../../lib/api";
import { clearDoorSecret, takeDoorSecret } from "../../../../lib/door-secret";
import { isSignedIn } from "../../../../lib/session";

function CheckInInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const started = useRef(false);
  const [state, setState] = useState<"pending" | "ok" | "err">("pending");
  const [message, setMessage] = useState("در حال ثبت ورود...");

  useEffect(() => {
    const secret = takeDoorSecret(params.id);
    const next = `/events/${params.id}/checkin`;
    if (!isSignedIn()) {
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (!secret) {
      setState("err");
      setMessage("کد ورودی ناقص است.");
      return;
    }
    if (started.current) return;
    started.current = true;
    api<CheckInResult>(`/events/${params.id}/checkin`, {
      method: "POST",
      body: JSON.stringify({ secret }),
    })
      .then((data) => {
        clearDoorSecret(params.id);
        setState("ok");
        if (data.already) {
          setMessage(`${data.displayName} قبلاً وارد شده.`);
        } else if (data.ticketStatus === "PAID_DOOR") {
          setMessage(`خوش آمدی ${data.displayName}. بلیت دم در گرفته شد.`);
        } else {
          setMessage(`خوش آمدی ${data.displayName}. ورود ثبت شد.`);
        }
      })
      .catch((err: unknown) => {
        setState("err");
        setMessage(err instanceof ApiError ? err.message : "ورود ثبت نشد. اول ثبت حضور کن.");
      });
  }, [params.id, router]);

  return (
    <>
      <div className={`banner ${state === "ok" ? "ok" : state === "err" ? "err" : ""}`}>{message}</div>
      <div className="row">
        <Link className="btn ghost" href={`/events/${params.id}`}>
          صفحهٔ رویداد
        </Link>
      </div>
    </>
  );
}

export default function CheckInPage() {
  return (
    <main className="wrap">
      <SiteHeader />
      <h1>ورود به دورهم</h1>
      <CheckInInner />
    </main>
  );
}
