"use client";

import Link from "next/link";
import { useCopy } from "./locale-provider";

export function SiteFooter() {
  const copy = useCopy();
  return (
    <footer>
      <p className="footer-line">{copy.footer.line}</p>
      <p>
        <Link href="/register">{copy.footer.join}</Link>
        {" · "}
        <Link href="/feed">{copy.footer.feed}</Link>
        {" · "}
        <Link href="/safety">{copy.footer.safety}</Link>
        {" · "}
        <Link href="/privacy">{copy.footer.privacy}</Link>
        {" · "}
        <Link href="/terms">{copy.footer.terms}</Link>
      </p>
    </footer>
  );
}
