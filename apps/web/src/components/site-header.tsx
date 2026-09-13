"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { NotificationsList } from "@dorham/shared";
import { api } from "../lib/api";
import { useSession } from "../lib/use-session";

export function SiteHeader() {
  const { signedIn, ready } = useSession();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!signedIn) {
      setUnread(0);
      return;
    }
    api<NotificationsList>("/users/me/notifications")
      .then((data) => setUnread(data.unreadCount))
      .catch(() => setUnread(0));
  }, [signedIn]);

  return (
    <nav className="nav">
      <Link className="brand" href="/">
        <span className="brand-latin">Dorham</span>
        <span className="brand-sep" aria-hidden>
          ·
        </span>
        <span className="brand-fa">دورهم</span>
      </Link>
      <div className="nav-links">
        <Link href="/events">رویدادها</Link>
        <Link href="/feed">فید شهر</Link>
        <Link href="/venues">مکان‌ها</Link>
        <Link href="/safety">امنیت</Link>
        {!ready ? null : signedIn ? (
          <>
            <Link className="btn ghost" href="/account?tab=inbox">
              اعلان‌ها{unread > 0 ? ` (${unread.toLocaleString("fa-IR")})` : ""}
            </Link>
            <Link className="btn ghost" href="/account">
              حساب من
            </Link>
          </>
        ) : (
          <Link className="btn ghost" href="/login">
            ورود
          </Link>
        )}
      </div>
    </nav>
  );
}
