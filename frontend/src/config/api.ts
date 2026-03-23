/**
 * Backend API base URL.
 *
 * - Production / explicit remote: set REACT_APP_API_URL (e.g. https://cosplay-collabs.onrender.com).
 * - Local dev: leave REACT_APP_API_URL unset → requests use relative `/api/...` and the CRA
 *   dev server proxies to `package.json` "proxy" (http://localhost:3000). Works on port 3000
 *   or 3001 without CORS issues.
 */

function trimTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, "");
}

const raw = process.env.REACT_APP_API_URL?.trim();
const useRemoteApi = Boolean(raw);

/** Empty in local dev when using proxy; otherwise the configured base URL. */
export const API_BASE_URL = useRemoteApi
  ? trimTrailingSlashes(raw!)
  : process.env.NODE_ENV === "development"
    ? ""
    : trimTrailingSlashes(raw || "http://localhost:3000");

/** Build URL for API calls. */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;

  // Local dev + no REACT_APP_API_URL → same-origin; webpack dev server proxies to backend
  if (process.env.NODE_ENV === "development" && !useRemoteApi) {
    return normalized;
  }

  const base = useRemoteApi ? trimTrailingSlashes(raw!) : "http://localhost:3000";
  return `${base}${normalized}`;
}
