import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const BASE_URL = API_BASE_URL;

const ACCESS_TOKEN_KEY = 'access_token';

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) throw new Error('Bạn chưa đăng nhập');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function parseError(detail, fallback) {
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((e) => e.msg || String(e)).join('; ');
  return fallback;
}

export async function listGoals() {
  const res = await fetch(`${BASE_URL}/savings-goals`, {
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(parseError(data?.detail, 'Không lấy được mục tiêu tiết kiệm'));
  return data;
}

export async function createGoal(payload) {
  const res = await fetch(`${BASE_URL}/savings-goals`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(parseError(data?.detail, 'Không tạo được mục tiêu'));
  return data;
}

export async function getGoal(goalId) {
  const res = await fetch(`${BASE_URL}/savings-goals/${goalId}`, {
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(parseError(data?.detail, 'Không tìm thấy mục tiêu'));
  return data;
}

export async function updateGoal(goalId, payload) {
  const res = await fetch(`${BASE_URL}/savings-goals/${goalId}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(parseError(data?.detail, 'Không cập nhật được mục tiêu'));
  return data;
}

export async function deleteGoal(goalId) {
  const res = await fetch(`${BASE_URL}/savings-goals/${goalId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(parseError(data?.detail, 'Không xóa được mục tiêu'));
  }
}

export async function depositToGoal(goalId, amount, accountId, transactionDate) {
  const res = await fetch(`${BASE_URL}/savings-goals/${goalId}/deposit`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ amount, account_id: accountId, transaction_date: transactionDate }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(parseError(data?.detail, 'Không nạp được tiền'));
  return data;
}

export async function withdrawFromGoal(goalId, amount, accountId, transactionDate) {
  const res = await fetch(`${BASE_URL}/savings-goals/${goalId}/withdraw`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ amount, account_id: accountId, transaction_date: transactionDate }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(parseError(data?.detail, 'Không rút được tiền'));
  return data;
}
