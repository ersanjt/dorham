const ACCESS = "dorham.accessToken";
const REFRESH = "dorham.refreshToken";

function emitAuthChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("dorham-auth"));
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH);
}

export function setSession(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS, accessToken);
  localStorage.setItem(REFRESH, refreshToken);
  emitAuthChange();
}

export function clearSession() {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
  emitAuthChange();
}

export function isSignedIn() {
  return Boolean(getAccessToken());
}
