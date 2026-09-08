import Constants from "expo-constants";

function metroHost() {
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (host && host !== "localhost" && host !== "127.0.0.1") return host;
  return null;
}

export function resolveApiBase() {
  const configured = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
  const host = metroHost();
  if (host && /localhost|127\.0\.0\.1/.test(configured)) {
    return configured.replace(/localhost|127\.0\.0\.1/g, host);
  }
  return configured;
}

export function publicMediaUrl(url: string | null | undefined) {
  if (!url) return null;
  const base = resolveApiBase();
  return url.replace(/https?:\/\/(localhost|127\.0\.0\.1):4000/g, base);
}
