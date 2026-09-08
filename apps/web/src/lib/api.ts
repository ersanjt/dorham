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
  EVENT_NOT_FOUND: "رویداد پیدا نشد.",
  EVENT_FULL: "ظرفیت پر است؛ در لیست انتظار هستی.",
  VENUE_NOT_FOUND: "مکان پیدا نشد.",
  VENUE_MAPS_INVALID: "لینک گوگل‌مپ لازم است.",
  REVIEW_DUPLICATE: "برای این مکان قبلاً نظر داده‌ای.",
  POST_NOT_FOUND: "پست پیدا نشد.",
  FEED_FORBIDDEN: "فقط میزبان و عضو تأییدشده می‌نویسند.",
  USER_SELF_ACTION: "این کار روی خودت ممکن نیست.",
  MEDIA_NOT_FOUND: "عکس پیدا نشد.",
  MEDIA_INVALID: "عکس پذیرفته نشد.",
  RATE_LIMITED: "چند لحظه صبر کن و دوباره تلاش کن.",
};

type ApiInit = RequestInit & { auth?: boolean };

async function refreshAccess() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  const res = await fetch(`${API_BASE}/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    clearSession();
    return false;
  }
  const json = (await res.json()) as { data: { accessToken: string; refreshToken: string } };
  setSession(json.data.accessToken, json.data.refreshToken);
  return true;
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

  let res = await fetch(`${API_BASE}/v1${path}`, { ...init, headers });
  if (res.status === 401 && init.auth !== false && getRefreshToken()) {
    const ok = await refreshAccess();
    if (ok) {
      const retry = new Headers(init.headers);
      if (init.body && !(init.body instanceof FormData) && !retry.has("Content-Type")) {
        retry.set("Content-Type", "application/json");
      }
      retry.set("Authorization", `Bearer ${getAccessToken()}`);
      res = await fetch(`${API_BASE}/v1${path}`, { ...init, headers: retry });
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
