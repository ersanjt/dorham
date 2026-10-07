"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { NotificationsList } from "@dorham/shared";
import { LocaleToggle } from "./locale-toggle";
import { useCopy, useUiLocale } from "./locale-provider";
import { api } from "../lib/api";
import { useSession } from "../lib/use-session";

export function SiteHeader() {
  const copy = useCopy();
  const locale = useUiLocale();
  const { signedIn } = useSession();
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(() => {
    if (!signedIn) {
      setUnread(0);
      return;
    }
    api<NotificationsList>("/users/me/notifications")
      .then((data) => setUnread(data.unreadCount))
      .catch(() => setUnread(0));
  }, [signedIn]);

  useEffect(() => {
    refreshUnread();
    const onFocus = () => refreshUnread();
    const onCustom = () => refreshUnread();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("dorham:notifications", onCustom);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("dorham:notifications", onCustom);
    };
  }, [refreshUnread]);

  return (
    <nav className="nav">
      <Link className="brand" href="/">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="brand-mark" src="/brand/empty-events.png" alt="" width={40} height={40} />
        <span className="brand-wordmark">
          <span className="brand-latin">Dorham</span>
          <span className="brand-sep" aria-hidden>
            ·
          </span>
          <span className="brand-fa">دورهم</span>
        </span>
      </Link>
      <div className="nav-links">
        <Link href="/events">{copy.nav.events}</Link>
        <Link href="/feed">{copy.nav.feed}</Link>
        <Link href="/venues">{copy.nav.venues}</Link>
        <Link href="/safety">{copy.nav.safety}</Link>
        <LocaleToggle />
        {!signedIn ? (
          <Link className="btn ghost" href="/login">
            {copy.nav.login}
          </Link>
        ) : (
          <>
            <Link className="btn ghost" href="/account?tab=inbox">
              {copy.nav.inbox}
              {unread > 0 ? ` (${unread.toLocaleString(locale === "en" ? "en-GB" : "fa-IR")})` : ""}
            </Link>
            <Link className="btn ghost" href="/account">
              {copy.nav.account}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
