
import { API_BASE_URL } from './config';
import {
  AnalyticsParams,
  BalanceResponse,
  CategoryStat,
  OverTimeStat
} from '../types/analytics';
import { apiFetch } from './authApi';

const _buildQuery = (params: AnalyticsParams): string =>
  new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null) as [string, string][]
    )
  ).toString();

export async function getBalance(params: AnalyticsParams = {}): Promise<BalanceResponse> {
  const query = _buildQuery(params);
  const res = await apiFetch(
    `${API_BASE_URL}/analytics/dashboard/balance${query ? `?${query}` : ''}`
  );
  if (!res.ok) throw new Error(`getBalance failed: ${res.status}`);
  return res.json();
}

export async function getStatsByCategory(params: AnalyticsParams = {}): Promise<CategoryStat[]> {
  const query = _buildQuery(params);
  const res = await apiFetch(
    `${API_BASE_URL}/analytics/reports/by-category${query ? `?${query}` : ''}`
  );
  if (!res.ok) throw new Error(`getStatsByCategory failed: ${res.status}`);
  return res.json();
}

export async function getOverTime(params: AnalyticsParams = {}): Promise<OverTimeStat[]> {
  const query = _buildQuery(params);
  const res = await apiFetch(
    `${API_BASE_URL}/analytics/reports/over-time${query ? `?${query}` : ''}`
  );
  if (!res.ok) throw new Error(`getOverTime failed: ${res.status}`);
  return res.json();
}