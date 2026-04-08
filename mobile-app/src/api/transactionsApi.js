import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const EXPO_HOST = Constants.expoConfig?.hostUri?.split(':')[0];
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }
  if (EXPO_HOST) {
    return `http://${EXPO_HOST}:8000/api/v1`;
  }
  return 'http://192.168.1.213:8000/api/v1';
};
const BASE_URL = getBaseUrl();

const ACCESS_TOKEN_KEY = 'access_token';

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) throw new Error('Bạn chưa đăng nhập');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

const _buildQuery = (params) =>
  new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
  ).toString();

/**
 * GET /transactions
 * params: { type?, account_id?, from_date?, to_date?, skip?, limit? }
 */
export async function listTransactions(params = {}) {
  const res = await fetch(
    `${BASE_URL}/transactions?${_buildQuery(params)}`,
    { headers: await getAuthHeaders() }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không lấy được giao dịch');
  return data;
}

/**
 * POST /transactions/income
 * payload: { account_id, amount, transaction_date, note?, category_id? }
 */
export async function createIncome(payload) {
  const res = await fetch(`${BASE_URL}/transactions/income`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không tạo được giao dịch');
  return data;
}

/**
 * POST /transactions/expense
 * payload: { account_id, category_id, amount, transaction_date, note? }
 */
export async function createExpense(payload) {
  const res = await fetch(`${BASE_URL}/transactions/expense`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không tạo được giao dịch');
  return data;
}

/**
 * DELETE /transactions/:id
 */
export async function deleteTransaction(txnId) {
  const res = await fetch(`${BASE_URL}/transactions/${txnId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail || 'Không xóa được giao dịch');
  }
}

/**
 * PATCH /transactions/:id
 * payload: { amount?, note?, transaction_date?, category_id? }
 */
export async function updateTransaction(txnId, payload) {
  const res = await fetch(`${BASE_URL}/transactions/${txnId}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không cập nhật được giao dịch');
  return data;
}
