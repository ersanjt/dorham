export type UiLocale = "fa" | "en";

export const LOCALE_COOKIE = "dorham_locale";

export function parseLocale(value: string | undefined | null): UiLocale {
  return value === "en" ? "en" : "fa";
}

export function dateTag(locale: UiLocale = "fa") {
  return locale === "en" ? "en-GB-u-ca-gregory" : "fa-IR-u-ca-gregory";
}
