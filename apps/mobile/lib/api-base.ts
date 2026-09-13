import Constants from "expo-constants";

function metroHost() {
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (host && host !== "localhost" && host !== "127.0.0.1") return host;
  return null;
}

/** Prefer EXPO_PUBLIC_API_URL, then app.json extra.apiUrl, then Metro host, never phone-localhost in release. */
export function resolveApiBase() {
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  const configured = (
    process.env.EXPO_PUBLIC_API_URL ??
    extra?.apiUrl ??
    ""
  ).replace(/\/$/, "");

  const host = metroHost();
  if (configured) {
    if (host && /localhost|127\.0\.0\.1/.test(configured)) {
      return configured.replace(/localhost|127\.0\.0\.1/g, host);
    }
    return configured;
  }
  if (host) return `http://${host}:4000`;
  return "https://www.dorham.app";
}

/** Turn API-relative media/map paths into absolute URLs the native Image can load. */
export function publicMediaUrl(url: string | null | undefined) {
  if (!url) return null;
  const base = resolveApiBase();
  if (url.startsWith("/")) return `${base}${url}`;
  return url
    .replace(/https?:\/\/(localhost|127\.0\.0\.1):4000/g, base)
    .replace(/https?:\/\/192\.168\.\d+\.\d+:4000/g, base);
}

export function publicWebBase() {
  const extra = Constants.expoConfig?.extra as { webUrl?: string } | undefined;
  return (process.env.EXPO_PUBLIC_WEB_URL ?? extra?.webUrl ?? "https://www.dorham.app").replace(/\/$/, "");
}
