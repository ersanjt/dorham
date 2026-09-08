"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isSignedIn } from "../lib/session";

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setSignedIn(isSignedIn());
  }, []);

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
        <Link href="/get-app">اپ</Link>
        <Link href="/safety">امنیت</Link>
        {signedIn ? (
          <Link className="btn ghost" href="/account">
            حساب من
          </Link>
        ) : (
          <Link className="btn ghost" href="/login">
            ورود
          </Link>
        )}
      </div>
    </nav>
  );
}
