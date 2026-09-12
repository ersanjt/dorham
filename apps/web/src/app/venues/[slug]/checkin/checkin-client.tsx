"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api, ApiError } from "../../../../lib/api";
import { isSignedIn } from "../../../../lib/session";

function CheckInBody({ slug }: { slug: string }) {
  const search = useSearchParams();
  const secret = search.get("s") ?? "";
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!secret || !isSignedIn()) return;
    api(`/venues/${slug}/checkin`, {
      method: "POST",
      body: JSON.stringify({ secret }),
    })
      .then(() => setMessage("حضور تو در این مکان تأیید شد و در پروفایلت می‌آید."))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "چک‌این نشد."));
  }, [slug, secret]);

  if (!isSignedIn()) {
    return (
      <div className="banner err">
        اول{" "}
        <Link href={`/login?next=${encodeURIComponent(`/venues/${slug}/checkin?s=${secret}`)}`}>وارد شو</Link>، بعد
        این لینک را دوباره باز کن.
      </div>
    );
  }
  if (!secret) return <div className="banner err">کد دم در ناقص است.</div>;
  if (error) return <div className="banner err">{error}</div>;
  if (message) {
    return (
      <div className="stack">
        <div className="banner ok">{message}</div>
        <Link className="btn" href="/account">
          برو به حساب من
        </Link>
      </div>
    );
  }
  return <p className="muted">در حال ثبت حضور...</p>;
}

export function VenueCheckInClient({ slug }: { slug: string }) {
  return (
    <Suspense fallback={<p className="muted">...</p>}>
      <CheckInBody slug={slug} />
    </Suspense>
  );
}
