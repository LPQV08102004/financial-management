// src/api/accountsApi.ts
import Cookies from 'js-cookie'; // Bạn cần cài đặt: npm install js-cookie @types/js-cookie
import { API_BASE_URL } from './config';
import { Account, CreateAccountPayload } from '../types/account';
const ACCESS_TOKEN_KEY = 'access_token';

/**
 * Hàm lấy Header có kèm Token
 * Trong Next.js, chúng ta thường dùng Cookie để lưu Token 
 * nhằm hỗ trợ tốt hơn cho việc Server-Side Rendering (SSR)
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const token = Cookies.get(ACCESS_TOKEN_KEY);
  
  if (!token) {
    throw new Error('Bạn chưa đăng nhập');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

/** GET /accounts — Lấy danh sách tài khoản */
export async function listAccounts(): Promise<Account[]> {
  const res = await fetch(`${API_BASE_URL}/accounts`, {
    headers: await getAuthHeaders(),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.detail || 'Không lấy được danh sách tài khoản');
  }

  return data;
}

/**
 * POST /accounts — Tạo tài khoản mới
 */
export async function createAccount(payload: CreateAccountPayload): Promise<Account> {
  const res = await fetch(`${API_BASE_URL}/accounts`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.detail || 'Không tạo được tài khoản');
  }

  return data;
}