"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import type { FeedComment, Me } from "@dorham/shared";
import { api, ApiError } from "../../../lib/api";
import { formatWhen } from "../../../lib/format";
import { isSignedIn } from "../../../lib/session";

export function PostActions({
  postId,
  authorId,
  comments: initial,
}: {
  postId: string;
  authorId: string;
  comments: FeedComment[];
}) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [comments, setComments] = useState(initial);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const ok = isSignedIn();
    setSignedIn(ok);
    if (!ok) return;
    api<Me>("/users/me")
      .then(setMe)
      .catch(() => undefined);
  }, []);

  async function onComment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = String(new FormData(form).get("body") ?? "").trim();
    setError("");
    try {
      const comment = await api<FeedComment>(`/feed/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      form.reset();
      setComments((rows) => [...rows, comment]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "نظر ثبت نشد. وارد شو.");
    }
  }

  async function onReport() {
    if (!confirm("این پست گزارش شود؟")) return;
    try {
      await api(`/feed/${postId}/report`, {
        method: "POST",
        body: JSON.stringify({ reason: "other" }),
      });
      setNotice("گزارش ثبت شد.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "گزارش نشد.");
    }
  }

  async function onHide() {
    if (!confirm("این پست از فید برداشته شود؟")) return;
    try {
      await api(`/feed/${postId}`, { method: "DELETE" });
      router.push("/feed");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "حذف نشد.");
    }
  }

  const canHide = me && (me.id === authorId || me.role === "MODERATOR" || me.role === "ADMIN");

  return (
    <section style={{ marginTop: 32 }}>
      {notice ? <div className="banner ok">{notice}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}
      <h2>نظرها</h2>
      {comments.length === 0 ? <p className="muted">هنوز نظری نیست.</p> : null}
      <div className="stack">
        {comments.map((comment) => (
          <article className="card" key={comment.id}>
            <p className="muted">
              {comment.author.displayName}
              {" · "}
              {formatWhen(comment.createdAt)}
            </p>
            <p className="post-body">{comment.body}</p>
          </article>
        ))}
      </div>
      {signedIn ? (
        <form className="form wide" onSubmit={onComment}>
          <label>
            نظر
            <textarea name="body" minLength={1} maxLength={500} rows={3} required />
          </label>
          <button className="btn" type="submit">
            ارسال نظر
          </button>
        </form>
      ) : (
        <p className="muted">
          برای نظر <a href={`/login?next=/feed/${postId}`}>وارد شو</a>.
        </p>
      )}
      <div className="row">
        {signedIn && me?.id !== authorId ? (
          <button className="btn ghost" type="button" onClick={onReport}>
            گزارش
          </button>
        ) : null}
        {canHide ? (
          <button className="btn danger" type="button" onClick={onHide}>
            برداشتن پست
          </button>
        ) : null}
      </div>
    </section>
  );
}
