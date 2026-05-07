import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const BASE_URL = API_BASE_URL;

const ACCESS_TOKEN_KEY = 'access_token';

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) throw new Error('Bạn chưa đăng nhập');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

const parseError = (detail, fallback) => {
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((e) => e.msg || String(e)).join('; ');
  return fallback;
};

/** GET /accounts — returns user's active accounts */
export async function listAccounts() {
  const res = await fetch(`${BASE_URL}/accounts`, {
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(parseError(data?.detail, 'Không lấy được tài khoản'));
  return data;
}

/**
 * POST /accounts
 * payload: { name, type, current_balance?, note? }
 * type: 'checking' | 'savings' | 'cash' | 'credit_card' | 'investment' | 'other'
 */
export async function createAccount(payload) {
  const res = await fetch(`${BASE_URL}/accounts`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(parseError(data?.detail, 'Không tạo được tài khoản'));
  return data;
}
