"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, type UiLocale } from "./locale";

export async function setLocaleAction(locale: UiLocale) {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
