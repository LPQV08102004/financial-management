import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

export const BASE_URL = API_BASE_URL;

const ACCESS_TOKEN_KEY = 'access_token';

async function _headers() {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const _buildQuery = (params) =>
  new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
  ).toString();

export async function getBalance(params = {}) {
  const res = await fetch(
    `${BASE_URL}/analytics/dashboard/balance?${_buildQuery(params)}`,
    { headers: await _headers() }
  );
  if (!res.ok) throw new Error(`getBalance failed: ${res.status}`);
  return res.json();
}

export async function getStatsByCategory(params = {}) {
  const res = await fetch(
    `${BASE_URL}/analytics/reports/by-category?${_buildQuery(params)}`,
    { headers: await _headers() }
  );
  if (!res.ok) throw new Error(`getStatsByCategory failed: ${res.status}`);
  return res.json();
}

export async function getOverTime(params = {}) {
  const res = await fetch(
    `${BASE_URL}/analytics/reports/over-time?${_buildQuery(params)}`,
    { headers: await _headers() }
  );
  if (!res.ok) throw new Error(`getOverTime failed: ${res.status}`);
  return res.json();
}
