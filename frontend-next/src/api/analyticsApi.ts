// src/api/analyticsApi.ts
import Cookies from 'js-cookie';
import { API_BASE_URL } from './config';
import { 
  AnalyticsParams, 
  BalanceResponse, 
  CategoryStat, 
  OverTimeStat 
} from '../types/analytics';
const ACCESS_TOKEN_KEY = 'access_token';

async function _headers(): Promise<HeadersInit> {
  const token = Cookies.get(ACCESS_TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const _buildQuery = (params: AnalyticsParams): string =>
  new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null) as [string, string][]
    )
  ).toString();

/**
 * GET /analytics/dashboard/balance
 */
export async function getBalance(params: AnalyticsParams = {}): Promise<BalanceResponse> {
  const query = _buildQuery(params);
  const res = await fetch(
    `${API_BASE_URL}/analytics/dashboard/balance${query ? `?${query}` : ''}`,
    { headers: await _headers() }
  );
  if (!res.ok) throw new Error(`getBalance failed: ${res.status}`);
  return res.json();
}

/**
 * GET /analytics/reports/by-category
 */
export async function getStatsByCategory(params: AnalyticsParams = {}): Promise<CategoryStat[]> {
  const query = _buildQuery(params);
  const res = await fetch(
    `${API_BASE_URL}/analytics/reports/by-category${query ? `?${query}` : ''}`,
    { headers: await _headers() }
  );
  if (!res.ok) throw new Error(`getStatsByCategory failed: ${res.status}`);
  return res.json();
}

/**
 * GET /analytics/reports/over-time
 */
export async function getOverTime(params: AnalyticsParams = {}): Promise<OverTimeStat[]> {
  const query = _buildQuery(params);
  const res = await fetch(
    `${API_BASE_URL}/analytics/reports/over-time${query ? `?${query}` : ''}`,
    { headers: await _headers() }
  );
  if (!res.ok) throw new Error(`getOverTime failed: ${res.status}`);
  return res.json();
}