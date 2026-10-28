/** Secrets stay in the URL fragment, never in a query the server logs. */

function storageKey(scope: string) {
  return `dorham.door.${scope}`;
}

/** Read `name` from `#name=` or `?name=`, then drop it from the address bar. */
export function takeLinkToken(name: string) {
  if (typeof window === "undefined") return "";
  const prefix = `#${name}=`;
  const fromHash = window.location.hash.startsWith(prefix)
    ? decodePart(window.location.hash.slice(prefix.length))
    : "";
  const fromQuery = new URLSearchParams(window.location.search).get(name) ?? "";
  const value = fromHash || fromQuery;
  if (fromHash || fromQuery) {
    const url = new URL(window.location.href);
    url.searchParams.delete(name);
    url.hash = "";
    const search = url.searchParams.toString();
    window.history.replaceState(null, "", `${url.pathname}${search ? `?${search}` : ""}`);
  }
  return value;
}

function decodePart(raw: string) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function takeDoorSecret(scope: string) {
  const secret = takeLinkToken("s");
  if (typeof window === "undefined") return "";
  if (secret) sessionStorage.setItem(storageKey(scope), secret);
  return secret || sessionStorage.getItem(storageKey(scope)) || "";
}

export function clearDoorSecret(scope: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(storageKey(scope));
}
