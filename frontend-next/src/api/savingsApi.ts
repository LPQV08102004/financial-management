// src/api/savingsApi.ts
import Cookies from 'js-cookie';
import { API_BASE_URL } from './config';
import { 
  SavingsGoal, 
  SavingsListResponse, 
  CreateGoalPayload, 
  GoalTransactionPayload 
} from '../types/savings';

const ACCESS_TOKEN_KEY = 'access_token';

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = Cookies.get(ACCESS_TOKEN_KEY);
  if (!token) throw new Error('Bạn chưa đăng nhập');
  return { 
    'Content-Type': 'application/json', 
    'Authorization': `Bearer ${token}` 
  };
}

/** GET /savings-goals — Lấy danh sách mục tiêu */
export async function listGoals(): Promise<SavingsListResponse> {
  const res = await fetch(`${API_BASE_URL}/savings-goals`, {
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không lấy được mục tiêu tiết kiệm');
  return data;
}

/** POST /savings-goals — Tạo mục tiêu mới */
export async function createGoal(payload: CreateGoalPayload): Promise<SavingsGoal> {
  const res = await fetch(`${API_BASE_URL}/savings-goals`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không tạo được mục tiêu');
  return data;
}

/** GET /savings-goals/:id — Chi tiết mục tiêu */
export async function getGoal(goalId: string | number): Promise<SavingsGoal> {
  const res = await fetch(`${API_BASE_URL}/savings-goals/${goalId}`, {
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không tìm thấy mục tiêu');
  return data;
}

/** PATCH /savings-goals/:id — Cập nhật mục tiêu */
export async function updateGoal(
  goalId: string | number, 
  payload: Partial<CreateGoalPayload>
): Promise<SavingsGoal> {
  const res = await fetch(`${API_BASE_URL}/savings-goals/${goalId}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không cập nhật được mục tiêu');
  return data;
}

/** DELETE /savings-goals/:id — Xóa mục tiêu */
export async function deleteGoal(goalId: string | number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/savings-goals/${goalId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail || 'Không xóa được mục tiêu');
  }
}

/** POST /savings-goals/:id/deposit — Nạp tiền vào mục tiêu */
export async function depositToGoal(
  goalId: string | number, 
  payload: GoalTransactionPayload
): Promise<SavingsGoal> {
  const res = await fetch(`${API_BASE_URL}/savings-goals/${goalId}/deposit`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không nạp được tiền');
  return data;
}

/** POST /savings-goals/:id/withdraw — Rút tiền khỏi mục tiêu */
export async function withdrawFromGoal(
  goalId: string | number, 
  payload: GoalTransactionPayload
): Promise<SavingsGoal> {
  const res = await fetch(`${API_BASE_URL}/savings-goals/${goalId}/withdraw`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không rút được tiền');
  return data;
}