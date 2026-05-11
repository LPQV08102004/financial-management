
import { API_BASE_URL } from './config';
import { Account, CreateAccountPayload } from '../types/account';
import { apiFetch } from './authApi';

export async function listAccounts(): Promise<Account[]> {
  const res = await apiFetch(`${API_BASE_URL}/accounts`);

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.detail || 'Không lấy được danh sách tài khoản');
  }

  return data;
}

export async function createAccount(payload: CreateAccountPayload): Promise<Account> {
  const res = await apiFetch(`${API_BASE_URL}/accounts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.detail || 'Không tạo được tài khoản');
  }

  return data;
}