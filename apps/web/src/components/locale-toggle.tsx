"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCopy, useUiLocale } from "./locale-provider";
import { setLocaleAction } from "../lib/locale-actions";
import type { UiLocale } from "../lib/locale";

export function LocaleToggle() {
  const locale = useUiLocale();
  const copy = useCopy();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function switchTo(next: UiLocale) {
    if (next === locale || pending) return;
    setPending(true);
    try {
      await setLocaleAction(next);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="lang-toggle" role="group" aria-label={copy.nav.langLabel}>
      <button type="button" className={locale === "fa" ? "active" : ""} disabled={pending} onClick={() => void switchTo("fa")}>
        {copy.nav.langFa}
      </button>
      <span aria-hidden>·</span>
      <button type="button" className={locale === "en" ? "active" : ""} disabled={pending} onClick={() => void switchTo("en")}>
        {copy.nav.langEn}
      </button>
    </div>
  );
}
