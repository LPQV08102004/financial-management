// src/api/transactionApi.ts
import Cookies from 'js-cookie';
import { API_BASE_URL } from './config';
import { 
  Transaction, 
  TransactionListParams, 
  TransactionListResponse, 
  CreateTransactionPayload 
} from '../types/transaction';

const ACCESS_TOKEN_KEY = 'access_token';

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = Cookies.get(ACCESS_TOKEN_KEY);
  if (!token) throw new Error('Bạn chưa đăng nhập');
  return { 
    'Content-Type': 'application/json', 
    'Authorization': `Bearer ${token}` 
  };
}

const _buildQuery = (params: TransactionListParams): string =>
  new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
    )
  ).toString();

/** GET /transactions — Lấy danh sách giao dịch có bộ lọc */
export async function listTransactions(params: TransactionListParams = {}): Promise<TransactionListResponse> {
  const query = _buildQuery(params);
  const res = await fetch(
    `${API_BASE_URL}/transactions${query ? `?${query}` : ''}`,
    { headers: await getAuthHeaders() }
  );
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không lấy được danh sách giao dịch');
  return data;
}

/** POST /transactions/income — Tạo giao dịch thu nhập */
export async function createIncome(payload: CreateTransactionPayload): Promise<Transaction> {
  const res = await fetch(`${API_BASE_URL}/transactions/income`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không tạo được giao dịch thu nhập');
  return data;
}

/** POST /transactions/expense — Tạo giao dịch chi tiêu */
export async function createExpense(payload: CreateTransactionPayload): Promise<Transaction> {
  const res = await fetch(`${API_BASE_URL}/transactions/expense`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không tạo được giao dịch chi tiêu');
  return data;
}

/** PATCH /transactions/:id — Cập nhật giao dịch */
export async function updateTransaction(
  txnId: string | number, 
  payload: Partial<CreateTransactionPayload>
): Promise<Transaction> {
  const res = await fetch(`${API_BASE_URL}/transactions/${txnId}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không cập nhật được giao dịch');
  return data;
}

/** DELETE /transactions/:id — Xóa giao dịch */
export async function deleteTransaction(txnId: string | number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/transactions/${txnId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail || 'Không xóa được giao dịch');
  }
}