"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { BlockDto, Me, ReportBody } from "@dorham/shared";
import { api, ApiError } from "../lib/api";
import { useCopy } from "./locale-provider";
import { useSession } from "../lib/use-session";

export function PersonSafety({ personId }: { personId: string }) {
  const copy = useCopy();
  const { signedIn, ready } = useSession();
  const [me, setMe] = useState<Me | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reason, setReason] = useState<ReportBody["reason"]>("other");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!signedIn) {
      setMe(null);
      setBlocked(false);
      return;
    }
    Promise.all([api<Me>("/users/me"), api<BlockDto[]>("/users/me/blocks")])
      .then(([profile, blocks]) => {
        setMe(profile);
        setBlocked(blocks.some((row) => row.blockedId === personId));
      })
      .catch(() => undefined);
  }, [personId, signedIn]);

  if (!ready) return null;
  if (me && me.id === personId) return null;

  if (!signedIn) {
    return (
      <div className="person-safety">
        <Link className="btn ghost" href={`/login?next=/people/${personId}`}>
          {copy.safety.loginToAct}
        </Link>
      </div>
    );
  }

  async function toggleBlock() {
    setError("");
    setMessage("");
    if (!blocked && !confirm(copy.safety.confirmBlock)) return;
    setBusy(true);
    try {
      if (blocked) {
        await api(`/users/${personId}/block`, { method: "DELETE" });
        setBlocked(false);
        setMessage(copy.safety.unblocked);
      } else {
        await api(`/users/${personId}/block`, { method: "POST" });
        setBlocked(true);
        setMessage(copy.safety.blocked);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : copy.safety.blockFail);
    } finally {
      setBusy(false);
    }
  }

  async function report(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await api("/reports", {
        method: "POST",
        body: JSON.stringify({ targetId: personId, reason, details: "public profile" }),
      });
      setMessage(copy.safety.reported);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : copy.safety.reportFail);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="person-safety">
      {message ? <div className="banner ok">{message}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}
      <div className="row">
        <button className="btn ghost" type="button" disabled={busy} onClick={() => void toggleBlock()}>
          {blocked ? copy.safety.unblock : copy.safety.block}
        </button>
      </div>
      <form className="person-report" onSubmit={(e) => void report(e)}>
        <label>
          {copy.safety.reason}
          <select value={reason} onChange={(e) => setReason(e.target.value as ReportBody["reason"])}>
            <option value="spam">{copy.safety.spam}</option>
            <option value="harassment">{copy.safety.harassment}</option>
            <option value="fake">{copy.safety.fake}</option>
            <option value="unsafe">{copy.safety.unsafe}</option>
            <option value="other">{copy.safety.other}</option>
          </select>
        </label>
        <button className="btn ghost" type="submit" disabled={busy}>
          {copy.safety.report}
        </button>
      </form>
    </div>
  );
}
