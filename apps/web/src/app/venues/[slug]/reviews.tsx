"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { VenueReview } from "@dorham/shared";
import { useCopy } from "../../../components/locale-provider";
import { api, ApiError } from "../../../lib/api";
import { useSession } from "../../../lib/use-session";

export function VenueReviews({ slug, initial }: { slug: string; initial: VenueReview[] }) {
  const copy = useCopy();
  const { signedIn, ready } = useSession();
  const [rows, setRows] = useState<VenueReview[]>(initial);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setRows(initial);
  }, [initial]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = String(new FormData(e.currentTarget).get("body") ?? "");
    setError("");
    setNotice("");
    try {
      await api<VenueReview>(`/venues/${slug}/reviews`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setNotice(copy.venues.reviewSaved);
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : copy.venues.reviewFail);
    }
  }

  return (
    <section style={{ marginTop: 32 }}>
      <h2>{copy.venues.reviewTitle}</h2>
      <p className="muted">{copy.venues.reviewLead}</p>
      {notice ? <div className="banner ok">{notice}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}
      {!ready ? (
        <p className="muted">…</p>
      ) : signedIn ? (
        <form className="form wide" onSubmit={onSubmit}>
          <label>
            {copy.venues.reviewExperience}
            <textarea name="body" minLength={10} maxLength={800} rows={3} required />
          </label>
          <button className="btn" type="submit">
            {copy.venues.reviewSend}
          </button>
        </form>
      ) : (
        <p className="muted">
          <Link className="btn" href={`/login?next=/venues/${slug}`}>
            {copy.venues.reviewLogin}
          </Link>
        </p>
      )}
      <div className="stack">
        {rows.length === 0 ? <p className="muted">{copy.venues.reviewEmpty}</p> : null}
        {rows.map((row) => (
          <article className="card" key={row.id}>
            <p className="muted">
              <Link href={`/people/${row.author.id}`}>{row.author.displayName}</Link>
              {row.author.verificationStatus === "VERIFIED" ? (
                <>
                  {" "}
                  <span className="verify-badge">{copy.rsvp.verified}</span>
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
