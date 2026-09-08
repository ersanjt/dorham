import * as SecureStore from "expo-secure-store";

const ACCESS = "dorham.accessToken";
const REFRESH = "dorham.refreshToken";

let accessToken = "";
let refreshToken = "";

export async function hydrateSession() {
  try {
    const [access, refresh] = await Promise.all([
      SecureStore.getItemAsync(ACCESS),
      SecureStore.getItemAsync(REFRESH),
    ]);
    accessToken = access ?? "";
    refreshToken = refresh ?? "";
  } catch {
    accessToken = "";
    refreshToken = "";
  }
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export async function setSession(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  try {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS, access),
      SecureStore.setItemAsync(REFRESH, refresh),
    ]);
  } catch {
    /* web / unsupported store — tokens stay in memory for this session */
  }
}

export async function clearSession() {
  accessToken = "";
  refreshToken = "";
  try {
    await Promise.all([SecureStore.deleteItemAsync(ACCESS), SecureStore.deleteItemAsync(REFRESH)]);
  } catch {
    /* ignore */
  }
}

export function isSignedIn() {
  return Boolean(accessToken);
}
