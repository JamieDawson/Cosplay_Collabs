/**
 * Backend API base URL.
 * Set REACT_APP_API_URL in .env (e.g. https://cosplay-collabs.onrender.com).
 * Falls back to local backend when unset (npm start on port 3000).
 */
function trimTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, "");
}

export const API_BASE_URL = trimTrailingSlashes(
  process.env.REACT_APP_API_URL || "http://localhost:3000",
);

/** Build a full URL to the API. Path should start with /api/... */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}
