"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { VenueReview } from "@dorham/shared";
import { api, ApiError } from "../../../lib/api";
import { isSignedIn } from "../../../lib/session";

export function VenueReviews({ slug, initial }: { slug: string; initial: VenueReview[] }) {
  const [rows, setRows] = useState<VenueReview[]>(initial);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setSignedIn(isSignedIn());
    setRows(initial);
  }, [initial]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = String(new FormData(e.currentTarget).get("body") ?? "");
    setError("");
    setNotice("");
    try {
      const row = await api<VenueReview>(`/venues/${slug}/reviews`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setRows((current) => [row, ...current]);
      setNotice("تجربه‌ات ثبت شد.");
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "نظر ثبت نشد.");
    }
  }

  return (
    <section style={{ marginTop: 32 }}>
      <h2>تجربهٔ این مکان</h2>
      <p className="muted">غذا، شلوغی، برخورد. نه امتیاز ستاره‌ای برای مچ.</p>
      {notice ? <div className="banner ok">{notice}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}
      {signedIn ? (
        <form className="form wide" onSubmit={onSubmit}>
          <label>
            تجربه‌ات
            <textarea name="body" minLength={10} maxLength={800} rows={3} required />
          </label>
          <button className="btn" type="submit">
            ثبت نظر
          </button>
        </form>
      ) : (
        <p className="muted">
          برای نوشتن تجربه <Link href={`/login?next=/venues/${slug}`}>وارد شو</Link>.
        </p>
      )}
      <div className="stack">
        {rows.length === 0 ? <p className="muted">هنوز نظری نیست.</p> : null}
        {rows.map((row) => (
          <article className="card" key={row.id}>
            <p className="muted">
              <Link href={`/people/${row.author.id}`}>{row.author.displayName}</Link>
              {row.author.verificationStatus === "VERIFIED" ? (
                <>
                  {" "}
                  <span className="verify-badge">تأییدشده</span>
                </>
              ) : null}
            </p>
            <p>{row.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
