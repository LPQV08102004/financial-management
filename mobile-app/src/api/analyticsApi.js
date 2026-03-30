// ── Base URL ──────────────────────────────────────────────────────────────────
// Android emulator  → 10.0.2.2  (maps to localhost on your PC)
// Physical device   → replace with your machine's local IP, e.g. 192.168.1.x
// iOS simulator     → localhost
export const BASE_URL = 'http://10.0.2.2:8000/api/v1';

// ── Auth token ────────────────────────────────────────────────────────────────
// Call setAuthToken(token) right after the user logs in (auth handled by Toản).
let _token = '';
export const setAuthToken = (token) => { _token = token; };

const _headers = () => ({
  'Content-Type': 'application/json',
  ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
});

// Remove null/undefined params before building query string
const _buildQuery = (params) =>
  new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
  ).toString();

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * GET /analytics/dashboard/balance
 * params: { period, date?, from_date?, to_date? }
 */
export async function getBalance(params = {}) {
  const res = await fetch(
    `${BASE_URL}/analytics/dashboard/balance?${_buildQuery(params)}`,
    { headers: _headers() }
  );
  if (!res.ok) throw new Error(`getBalance failed: ${res.status}`);
  return res.json();
}

/**
 * GET /analytics/reports/by-category
 * params: { type?, period, date?, from_date?, to_date? }
 */
export async function getStatsByCategory(params = {}) {
  const res = await fetch(
    `${BASE_URL}/analytics/reports/by-category?${_buildQuery(params)}`,
    { headers: _headers() }
  );
  if (!res.ok) throw new Error(`getStatsByCategory failed: ${res.status}`);
  return res.json();
}

/**
 * GET /analytics/reports/over-time
 * params: { type?, period, date?, from_date?, to_date? }
 */
export async function getOverTime(params = {}) {
  const res = await fetch(
    `${BASE_URL}/analytics/reports/over-time?${_buildQuery(params)}`,
    { headers: _headers() }
  );
  if (!res.ok) throw new Error(`getOverTime failed: ${res.status}`);
  return res.json();
}
