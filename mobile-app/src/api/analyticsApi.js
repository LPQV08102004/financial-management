import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const EXPO_HOST = Constants.expoConfig?.hostUri?.split(':')[0];
export const BASE_URL = EXPO_HOST
  ? `http://${EXPO_HOST}:8000/api/v1`
  : 'http://127.0.0.1:8000/api/v1';

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

/**
 * GET /analytics/dashboard/balance
 * params: { period, date?, from_date?, to_date? }
 */
export async function getBalance(params = {}) {
  const res = await fetch(
    `${BASE_URL}/analytics/dashboard/balance?${_buildQuery(params)}`,
    { headers: await _headers() }
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
    { headers: await _headers() }
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
    { headers: await _headers() }
  );
  if (!res.ok) throw new Error(`getOverTime failed: ${res.status}`);
  return res.json();
}
