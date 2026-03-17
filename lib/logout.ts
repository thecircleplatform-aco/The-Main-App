/**
 * Client-side logout: call API, clear storage, redirect once to /login.
 * Use this everywhere logout is triggered to avoid refresh loops and ensure consistent redirect.
 * If the API returns signoutUrl (NextAuth signout), use it so OAuth is cleared and callbackUrl sends user to /login.
 */

const LOGIN_PATH = "/login";

export async function performLogout(): Promise<never> {
  let signoutUrl: string | null = null;
  try {
    const res = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (data.signoutUrl && typeof data.signoutUrl === "string") {
      signoutUrl = data.signoutUrl;
    }
  } finally {
    if (typeof localStorage !== "undefined") localStorage.removeItem("token");
    if (typeof sessionStorage !== "undefined") sessionStorage.clear();
  }
  if (signoutUrl) {
    try {
      const u = new URL(signoutUrl);
      if (u.origin === window.location.origin) {
        window.location.href = signoutUrl;
        return new Promise(() => {});
      }
    } catch {
      // fall through to /login
    }
  }
  window.location.href = LOGIN_PATH;
  return new Promise(() => {});
}

/**
 * Clear session cookie (via logout API) then redirect to /login.
 * Use when the client detects unauthenticated state (401 or null session) so that
 * middleware won't see the cookie and redirect back to /, which would cause a refresh loop.
 */
export async function clearSessionAndRedirectToLogin(from?: string): Promise<never> {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } finally {
    if (typeof localStorage !== "undefined") localStorage.removeItem("token");
    if (typeof sessionStorage !== "undefined") sessionStorage.clear();
  }
  const q = from ? "?from=" + encodeURIComponent(from) : "";
  window.location.href = LOGIN_PATH + q;
  return new Promise(() => {});
}

/**
 * After logout API returns (e.g. from "revoke all sessions"), redirect to login.
 * Use when the backend returns signoutUrl for OAuth signout; we still end at /login.
 */
export function redirectToLoginAfterLogout(signoutUrl?: string | null): never {
  if (typeof localStorage !== "undefined") localStorage.removeItem("token");
  if (typeof sessionStorage !== "undefined") sessionStorage.clear();
  if (signoutUrl && signoutUrl.startsWith("/")) {
    // Same-origin signout URL (e.g. /api/auth/signout?callbackUrl=.../login)
    window.location.href = signoutUrl;
  } else {
    window.location.href = LOGIN_PATH;
  }
  return new Promise(() => {}) as never;
}
