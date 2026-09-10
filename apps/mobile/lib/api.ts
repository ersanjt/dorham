import { ERROR_FA } from "@dorham/shared";
import { resolveApiBase } from "./api-base";
import { clearSession, getAccessToken, getRefreshToken, setSession } from "./session";

export function apiBase() {
  return resolveApiBase();
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

type Init = RequestInit & { auth?: boolean };

function timeoutSignal(ms: number) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

async function refreshAccess() {
  const token = getRefreshToken();
  if (!token) return false;
  const res = await fetch(`${apiBase()}/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: token }),
  });
  if (!res.ok) {
    await clearSession();
    return false;
  }
  const json = (await res.json()) as { data: { accessToken: string; refreshToken: string } };
  await setSession(json.data.accessToken, json.data.refreshToken);
  return true;
}

export async function api<T>(path: string, init: Init = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> | undefined) };
  if (init.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const token = getAccessToken();
  if (init.auth !== false && token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${apiBase()}/v1${path}`, { ...init, headers, signal: timeoutSignal(20000) });
  } catch {
    throw new ApiError("NETWORK", `${ERROR_FA.NETWORK} (${apiBase()})`);
  }
  if (res.status === 401 && init.auth !== false && getRefreshToken()) {
    const ok = await refreshAccess();
    if (ok) {
      const retry: Record<string, string> = { ...(init.headers as Record<string, string> | undefined) };
      if (init.body && !retry["Content-Type"]) retry["Content-Type"] = "application/json";
      retry.Authorization = `Bearer ${getAccessToken()}`;
      try {
        res = await fetch(`${apiBase()}/v1${path}`, { ...init, headers: retry, signal: timeoutSignal(20000) });
      } catch {
        throw new ApiError("NETWORK", `${ERROR_FA.NETWORK} (${apiBase()})`);
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
