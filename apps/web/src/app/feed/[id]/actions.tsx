"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import type { FeedComment, Me } from "@dorham/shared";
import { useCopy, useUiLocale } from "../../../components/locale-provider";
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
  const copy = useCopy().feed;
  const locale = useUiLocale();
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
      setError(err instanceof ApiError ? err.message : copy.commentFail);
    }
  }

  async function onReport() {
    if (!confirm(copy.reportAsk)) return;
    try {
      await api(`/feed/${postId}/report`, {
        method: "POST",
        body: JSON.stringify({ reason: "other" }),
      });
      setNotice(copy.reported);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : copy.reportFail);
    }
  }

  async function onHide() {
    if (!confirm(copy.hideAsk)) return;
    try {
      await api(`/feed/${postId}`, { method: "DELETE" });
      router.push("/feed");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : copy.hideFail);
    }
  }

  const canHide = me && (me.id === authorId || me.role === "MODERATOR" || me.role === "ADMIN");

  return (
    <section style={{ marginTop: 32 }}>
      {notice ? <div className="banner ok">{notice}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}
      <h2>{copy.commentsTitle}</h2>
      {comments.length === 0 ? <p className="muted">{copy.noComments}</p> : null}
      <div className="stack">
        {comments.map((comment) => (
          <article className="card" key={comment.id}>
            <p className="muted">
              {comment.author.displayName}
              {" · "}
              {formatWhen(comment.createdAt, locale)}
            </p>
            <p className="post-body">{comment.body}</p>
          </article>
        ))}
      </div>
      {signedIn ? (
        <form className="form wide" onSubmit={onComment}>
          <label>
            {copy.commentLabel}
            <textarea name="body" minLength={1} maxLength={500} rows={3} required />
          </label>
          <button className="btn" type="submit">
            {copy.sendComment}
          </button>
        </form>
      ) : (
        <p className="muted">
          {copy.loginToComment}
          <a href={`/login?next=/feed/${postId}`}>{copy.loginToCommentAfter}</a>
          {copy.loginToCommentEnd}
        </p>
      )}
      <div className="row">
        {signedIn && me?.id !== authorId ? (
          <button className="btn ghost" type="button" onClick={onReport}>
            {copy.report}
          </button>
        ) : null}
        {canHide ? (
          <button className="btn danger" type="button" onClick={onHide}>
            {copy.hide}
          </button>
        ) : null}
      </div>
    </section>
  );
}
