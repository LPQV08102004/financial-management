
import { API_BASE_URL } from './config';
import {
  SavingsGoal,
  SavingsListResponse,
  CreateGoalPayload,
  GoalTransactionPayload
} from '../types/savings';
import { apiFetch } from './authApi';

export async function listGoals(): Promise<SavingsListResponse> {
  const res = await apiFetch(`${API_BASE_URL}/savings-goals`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không lấy được mục tiêu tiết kiệm');
  return data;
}

export async function createGoal(payload: CreateGoalPayload): Promise<SavingsGoal> {
  const res = await apiFetch(`${API_BASE_URL}/savings-goals`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data?.detail;
    throw new Error(typeof d === 'string' ? d : Array.isArray(d) ? d.map((e: any) => e.msg ?? JSON.stringify(e)).join('; ') : 'Không tạo được mục tiêu');
  }
  return data;
}

export async function getGoal(goalId: string | number): Promise<SavingsGoal> {
  const res = await apiFetch(`${API_BASE_URL}/savings-goals/${goalId}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data?.detail;
    throw new Error(typeof d === 'string' ? d : Array.isArray(d) ? d.map((e: any) => e.msg ?? JSON.stringify(e)).join('; ') : 'Không tìm thấy mục tiêu');
  }
  return data;
}

export async function updateGoal(
  goalId: string | number,
  payload: Partial<CreateGoalPayload>
): Promise<SavingsGoal> {
  const res = await apiFetch(`${API_BASE_URL}/savings-goals/${goalId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data?.detail;
    throw new Error(typeof d === 'string' ? d : Array.isArray(d) ? d.map((e: any) => e.msg ?? JSON.stringify(e)).join('; ') : 'Không cập nhật được mục tiêu');
  }
  return data;
}

export async function deleteGoal(goalId: string | number): Promise<void> {
  const res = await apiFetch(`${API_BASE_URL}/savings-goals/${goalId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail || 'Không xóa được mục tiêu');
  }
}

export async function depositToGoal(
  goalId: string | number,
  amount: number,
  accountId: string | number,
  transactionDate: string
): Promise<SavingsGoal> {
  const payload: GoalTransactionPayload = { amount, account_id: accountId, transaction_date: transactionDate };
  const res = await apiFetch(`${API_BASE_URL}/savings-goals/${goalId}/deposit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.detail;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail) || 'Không nạp được tiền');
  }
  return data;
}

export async function withdrawFromGoal(
  goalId: string | number,
  amount: number,
  accountId: string | number,
  transactionDate: string
): Promise<SavingsGoal> {
  const payload: GoalTransactionPayload = { amount, account_id: accountId, transaction_date: transactionDate };
  const res = await apiFetch(`${API_BASE_URL}/savings-goals/${goalId}/withdraw`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.detail;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail) || 'Không rút được tiền');
  }
  return data;
}