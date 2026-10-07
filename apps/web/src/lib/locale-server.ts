import { cookies } from "next/headers";
import { LOCALE_COOKIE, parseLocale, type UiLocale } from "./locale";

export async function getLocale(): Promise<UiLocale> {
  return parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}
