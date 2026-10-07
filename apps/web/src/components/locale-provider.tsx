"use client";

import { createContext, useContext, type ReactNode } from "react";
import { t } from "../lib/copy";
import type { UiLocale } from "../lib/locale";

const LocaleContext = createContext<UiLocale>("fa");

export function LocaleProvider({ locale, children }: { locale: UiLocale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useUiLocale(): UiLocale {
  return useContext(LocaleContext);
}

export function useCopy() {
  return t(useUiLocale());
}
