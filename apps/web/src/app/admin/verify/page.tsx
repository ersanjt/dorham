"use client";

import { useEffect, useState } from "react";
import type { VerificationQueueItem } from "@dorham/shared";
import { AuthImage } from "../../../components/auth-image";
import { SiteHeader } from "../../../components/site-header";
import { api, ApiError } from "../../../lib/api";
import { isSignedIn } from "../../../lib/session";

export default function AdminVerifyPage() {
  const [items, setItems] = useState<VerificationQueueItem[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const data = await api<VerificationQueueItem[]>("/admin/verifications?status=PENDING&limit=20");
    setItems(data);
  }

  useEffect(() => {
    if (!isSignedIn()) return;
    load().catch((err: unknown) => {
      setError(err instanceof ApiError ? err.message : "صف خوانده نشد.");
    });
  }, []);

  async function review(id: string, status: "VERIFIED" | "REJECTED") {
    await api(`/admin/verifications/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
    await load();
  }

  return (
    <main className="wrap">
      <SiteHeader />
      <h1>صف تأیید دست‌نویس</h1>
      <p className="muted">عکس‌ها فقط برای ناظر و ادمین. عمومی نمی‌شوند.</p>
      {error ? <div className="banner err">{error}</div> : null}
      {items.length === 0 ? (
        <p className="muted">درخواستی در انتظار نیست.</p>
      ) : (
        <div className="grid">
          {items.map((item) => (
            <article className="card" key={item.id}>
              <h3>{item.displayName}</h3>
              {item.photoUrl ? <AuthImage src={item.photoUrl} /> : <p className="muted">عکس نیست</p>}
              <div className="row">
                <button className="btn" type="button" onClick={() => review(item.id, "VERIFIED")}>
                  تأیید
                </button>
                <button className="btn danger" type="button" onClick={() => review(item.id, "REJECTED")}>
                  رد
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
