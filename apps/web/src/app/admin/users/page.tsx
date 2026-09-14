"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { AdminUserRow, AdminUsersList, Me } from "@dorham/shared";
import { PageIntro } from "../../../components/page-intro";
import { SiteHeader } from "../../../components/site-header";
import { api, ApiError } from "../../../lib/api";
import { formatMemberSince, formatWhen, verifyFa } from "../../../lib/format";
import { isSignedIn } from "../../../lib/session";

const ROLE_FA: Record<AdminUserRow["role"], string> = {
  MEMBER: "عضو",
  HOST: "میزبان",
  MODERATOR: "ناظر",
  ADMIN: "مدیر",
};

const ROLE_OPTIONS: AdminUserRow["role"][] = ["MEMBER", "HOST", "MODERATOR", "ADMIN"];

export default function AdminUsersPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [items, setItems] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"" | AdminUserRow["role"]>("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draftRoles, setDraftRoles] = useState<Record<string, AdminUserRow["role"]>>({});

  const load = useCallback(
    async (cursor?: string | null, append = false) => {
      const params = new URLSearchParams({ limit: "40" });
      if (q.trim()) params.set("q", q.trim());
      if (role) params.set("role", role);
      if (cursor) params.set("cursor", cursor);
      const data = await api<AdminUsersList>(`/admin/users?${params}`);
      setTotal(data.total);
      setNextCursor(data.nextCursor);
      setItems((prev) => (append ? [...prev, ...data.items] : data.items));
      setDraftRoles((prev) => {
        const next = append ? { ...prev } : {};
        for (const row of data.items) next[row.id] = row.role;
        return next;
      });
    },
    [q, role],
  );

  useEffect(() => {
    if (!isSignedIn()) {
      setError("وارد شو.");
      setLoading(false);
      return;
    }
    setLoading(true);
    api<Me>("/users/me")
      .then(async (profile) => {
        setMe(profile);
        if (profile.role !== "ADMIN") {
          setError("فقط مدیر می‌تواند اعضا را ببیند.");
          return;
        }
        await load();
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "بارگذاری نشد."))
      .finally(() => setLoading(false));
  }, [load]);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "جستجو نشد.");
    } finally {
      setLoading(false);
    }
  }

  async function saveRole(user: AdminUserRow) {
    const nextRole = draftRoles[user.id] ?? user.role;
    if (nextRole === user.role) return;
    setSavingId(user.id);
    setError("");
    setMessage("");
    try {
      await api(`/admin/users/${user.id}/role`, {
        method: "POST",
        body: JSON.stringify({ role: nextRole }),
      });
      setItems((prev) => prev.map((row) => (row.id === user.id ? { ...row, role: nextRole } : row)));
      setMessage(`${user.displayName} → ${ROLE_FA[nextRole]}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "نقش عوض نشد.");
      setDraftRoles((prev) => ({ ...prev, [user.id]: user.role }));
    } finally {
      setSavingId(null);
    }
  }

  if (error && !me) {
    return (
      <main className="wrap">
        <SiteHeader />
        <div className="banner err">{error}</div>
        <Link href="/login?next=/admin/users">ورود</Link>
      </main>
    );
  }

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="مدیریت" title="اعضای دورهم">
        <p className="muted">همهٔ کسانی که عضو شده‌اند — ورود، تأیید، و سطح دسترسی.</p>
        <div className="row" style={{ marginTop: 12 }}>
          <Link className="btn ghost" href="/admin">
            صف بررسی
          </Link>
          <Link className="btn ghost" href="/admin/verify">
            تأیید دست‌نویس
          </Link>
        </div>
      </PageIntro>

      {me?.role !== "ADMIN" ? (
        <div className="banner err">{error || "فقط مدیر."}</div>
      ) : (
        <>
          {message ? <div className="banner ok">{message}</div> : null}
          {error ? <div className="banner err">{error}</div> : null}

          <form className="admin-users-filters" onSubmit={onSearch}>
            <label>
              جستجو
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="نام یا ایمیل"
                autoComplete="off"
              />
            </label>
            <label>
              نقش
              <select value={role} onChange={(e) => setRole(e.target.value as "" | AdminUserRow["role"])}>
                <option value="">همه</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_FA[r]}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "…" : "اعمال"}
            </button>
          </form>

          <p className="muted admin-users-count">
            {total.toLocaleString("fa-IR")} عضو
            {role ? ` · ${ROLE_FA[role]}` : ""}
            {q.trim() ? ` · «${q.trim()}»` : ""}
          </p>

          <div className="admin-users-list">
            {items.length === 0 && !loading ? <p className="muted">عضوی پیدا نشد.</p> : null}
            {items.map((user) => {
              const draft = draftRoles[user.id] ?? user.role;
              const dirty = draft !== user.role;
              return (
                <article className="admin-user-card" key={user.id}>
                  <div className="admin-user-main">
                    <div className="admin-user-avatar" aria-hidden>
                      {user.displayName.slice(0, 1)}
                    </div>
                    <div>
                      <div className="admin-user-name-row">
                        <Link href={`/people/${user.id}`}>
                          <strong>{user.displayName}</strong>
                        </Link>
                        <span className="admin-user-role-chip">{ROLE_FA[user.role]}</span>
                      </div>
                      <p className="muted admin-user-email">{user.email}</p>
                      <p className="muted admin-user-meta">
                        عضو از {formatMemberSince(user.createdAt)}
                        {user.lastLoginAt ? ` · آخرین ورود ${formatWhen(user.lastLoginAt)}` : " · هنوز ورود ثبت نشده"}
                        {" · "}
                        {user.emailVerified ? "ایمیل ✓" : "ایمیل ✗"}
                        {" · "}
                        {verifyFa[user.verificationStatus] ?? user.verificationStatus}
                      </p>
                    </div>
                  </div>
                  <div className="admin-user-actions">
                    <label>
                      نقش
                      <select
                        value={draft}
                        disabled={savingId === user.id || user.id === me.id}
                        onChange={(e) =>
                          setDraftRoles((prev) => ({
                            ...prev,
                            [user.id]: e.target.value as AdminUserRow["role"],
                          }))
                        }
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_FA[r]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="btn"
                      type="button"
                      disabled={!dirty || savingId === user.id || user.id === me.id}
                      onClick={() => void saveRole(user)}
                    >
                      {savingId === user.id ? "…" : "ذخیره"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {nextCursor ? (
            <button
              className="btn ghost"
              type="button"
              style={{ marginTop: 16 }}
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  await load(nextCursor, true);
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : "ادامه نشد.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              اعضای بیشتر
            </button>
          ) : null}
        </>
      )}
    </main>
  );
}
