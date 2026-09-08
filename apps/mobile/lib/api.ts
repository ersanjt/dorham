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

const FA: Record<string, string> = {
  VALIDATION_FAILED: "ورودی ناقص است.",
  AUTH_INVALID_CREDENTIALS: "ایمیل یا رمز اشتباه است.",
  AUTH_EMAIL_TAKEN: "این ایمیل قبلاً ثبت شده.",
  AUTH_LOCKED: "حساب موقتاً قفل است.",
  AUTH_UNAUTHORIZED: "وارد شو.",
  AUTH_FORBIDDEN: "اجازه نداری.",
  AUTH_EMAIL_TOKEN_INVALID: "لینک تأیید منقضی یا نادرست است.",
  AUTH_ACCOUNT_PAUSED: "حساب متوقف است. از سر بگیر تا دوباره بنویسی.",
  AUTH_ACCOUNT_SUSPENDED: "حساب تعلیق شده.",
  RATE_LIMITED: "چند لحظه صبر کن و دوباره تلاش کن.",
  MEDIA_NOT_FOUND: "عکس پیدا نشد.",
  MEDIA_INVALID: "عکس پذیرفته نشد.",
  EVENT_NOT_FOUND: "رویداد پیدا نشد.",
  EVENT_FULL: "ظرفیت پر است؛ در لیست انتظار هستی.",
  VENUE_NOT_FOUND: "مکان پیدا نشد.",
  VENUE_MAPS_INVALID: "لینک گوگل‌مپ لازم است.",
  REVIEW_DUPLICATE: "برای این مکان قبلاً نظر داده‌ای.",
  POST_NOT_FOUND: "پست پیدا نشد.",
  FEED_FORBIDDEN: "فقط میزبان و عضو تأییدشده می‌نویسند.",
  USER_SELF_ACTION: "این کار روی خودت ممکن نیست.",
  NETWORK: "اتصال برقرار نشد. اینترنت را چک کن.",
};

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
    throw new ApiError("NETWORK", FA.NETWORK);
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
        throw new ApiError("NETWORK", FA.NETWORK);
      }
    }
  }

  const json = (await res.json().catch(() => ({}))) as {
    data?: T;
    error?: { code?: string; message?: string };
  };
  if (!res.ok) {
    const code = json.error?.code ?? "INTERNAL";
    throw new ApiError(code, FA[code] ?? json.error?.message ?? "درخواست انجام نشد.");
  }
  return (json.data ?? json) as T;
}
