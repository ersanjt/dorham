import { ERROR_FA } from "@dorham/shared";
import { clearSession, getAccessToken, getRefreshToken, setSession } from "./session";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

type ApiInit = RequestInit & { auth?: boolean };

function timeoutSignal(ms: number) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

async function refreshAccess() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      signal: timeoutSignal(20000),
    });
    if (!res.ok) {
      clearSession();
      return false;
    }
    const json = (await res.json()) as { data: { accessToken: string; refreshToken: string } };
    setSession(json.data.accessToken, json.data.refreshToken);
    return true;
  } catch {
    clearSession();
    return false;
  }
}

export async function api<T>(path: string, init: ApiInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAccessToken();
  if (init.auth !== false && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/v1${path}`, { ...init, headers, signal: timeoutSignal(20000) });
  } catch {
    throw new ApiError("NETWORK", ERROR_FA.NETWORK);
  }

  if (res.status === 401 && init.auth !== false && getRefreshToken()) {
    const ok = await refreshAccess();
    if (ok) {
      const retry = new Headers(init.headers);
      if (init.body && !(init.body instanceof FormData) && !retry.has("Content-Type")) {
        retry.set("Content-Type", "application/json");
      }
      retry.set("Authorization", `Bearer ${getAccessToken()}`);
      try {
        res = await fetch(`${API_BASE}/v1${path}`, { ...init, headers: retry, signal: timeoutSignal(20000) });
      } catch {
        throw new ApiError("NETWORK", ERROR_FA.NETWORK);
      }
    }
  }

  const json = (await res.json().catch(() => ({}))) as {
    data?: T;
    error?: { code?: string; message?: string };
  };
  if (!res.ok) {
    const code = json.error?.code ?? "INTERNAL";
    throw new ApiError(code, ERROR_FA[code] ?? json.error?.message ?? ERROR_FA.INTERNAL);
  }
  return (json.data ?? json) as T;
}
