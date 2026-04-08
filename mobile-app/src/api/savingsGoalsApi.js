import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const EXPO_HOST = Constants.expoConfig?.hostUri?.split(':')[0];
const BASE_URL = EXPO_HOST
  ? `http://${EXPO_HOST}:8000/api/v1`
  : 'http://127.0.0.1:8000/api/v1';

const ACCESS_TOKEN_KEY = 'access_token';

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) throw new Error('Bạn chưa đăng nhập');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

/**
 * GET /savings-goals
 * Returns: { items: SavingsGoalOut[], total_locked: Decimal }
 */
export async function listGoals() {
  const res = await fetch(`${BASE_URL}/savings-goals`, {
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không lấy được mục tiêu tiết kiệm');
  return data;
}

/**
 * POST /savings-goals
 * payload: { name, target_amount, deadline (YYYY-MM-DD), note? }
 */
export async function createGoal(payload) {
  const res = await fetch(`${BASE_URL}/savings-goals`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không tạo được mục tiêu');
  return data;
}

/**
 * GET /savings-goals/:id
 */
export async function getGoal(goalId) {
  const res = await fetch(`${BASE_URL}/savings-goals/${goalId}`, {
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không tìm thấy mục tiêu');
  return data;
}

/**
 * PATCH /savings-goals/:id
 * payload: { name?, target_amount?, deadline?, note? }
 */
export async function updateGoal(goalId, payload) {
  const res = await fetch(`${BASE_URL}/savings-goals/${goalId}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không cập nhật được mục tiêu');
  return data;
}

/**
 * DELETE /savings-goals/:id
 */
export async function deleteGoal(goalId) {
  const res = await fetch(`${BASE_URL}/savings-goals/${goalId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail || 'Không xóa được mục tiêu');
  }
}

/**
 * POST /savings-goals/:id/deposit
 * payload: { amount, account_id, transaction_date (ISO string) }
 * Debits the account and increases saved_amount atomically.
 */
export async function depositToGoal(goalId, amount, accountId, transactionDate) {
  const res = await fetch(`${BASE_URL}/savings-goals/${goalId}/deposit`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ amount, account_id: accountId, transaction_date: transactionDate }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không nạp được tiền');
  return data;
}

/**
 * POST /savings-goals/:id/withdraw
 * payload: { amount, account_id, transaction_date (ISO string) }
 * Credits the account and decreases saved_amount atomically.
 */
export async function withdrawFromGoal(goalId, amount, accountId, transactionDate) {
  const res = await fetch(`${BASE_URL}/savings-goals/${goalId}/withdraw`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ amount, account_id: accountId, transaction_date: transactionDate }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không rút được tiền');
  return data;
}
