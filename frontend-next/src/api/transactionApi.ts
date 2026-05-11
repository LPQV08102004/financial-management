
import { API_BASE_URL } from './config';
import {
  Transaction,
  TransactionListParams,
  TransactionListResponse,
  CreateTransactionPayload
} from '../types/transaction';
import { apiFetch } from './authApi';

const _buildQuery = (params: TransactionListParams): string =>
  new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
    )
  ).toString();

export async function listTransactions(params: TransactionListParams = {}): Promise<TransactionListResponse> {
  const query = _buildQuery(params);
  const res = await apiFetch(
    `${API_BASE_URL}/transactions${query ? `?${query}` : ''}`
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không lấy được danh sách giao dịch');
  return data;
}

export async function createIncome(payload: CreateTransactionPayload): Promise<Transaction> {
  const res = await apiFetch(`${API_BASE_URL}/transactions/income`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không tạo được giao dịch thu nhập');
  return data;
}

export async function createExpense(payload: CreateTransactionPayload): Promise<Transaction> {
  const res = await apiFetch(`${API_BASE_URL}/transactions/expense`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không tạo được giao dịch chi tiêu');
  return data;
}

export async function updateTransaction(
  txnId: string | number,
  payload: Partial<CreateTransactionPayload>
): Promise<Transaction> {
  const res = await apiFetch(`${API_BASE_URL}/transactions/${txnId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không cập nhật được giao dịch');
  return data;
}

export async function deleteTransaction(txnId: string | number): Promise<void> {
  const res = await apiFetch(`${API_BASE_URL}/transactions/${txnId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail || 'Không xóa được giao dịch');
  }
}