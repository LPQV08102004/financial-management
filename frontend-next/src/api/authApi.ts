// src/api/authApi.ts
import Cookies from 'js-cookie';
import { API_BASE_URL } from './config';
import { 
  LoginPayload, 
  RegisterPayload, 
  AuthResponse, 
  UserUpdatePayload, 
  UserProfile,
  ChangePasswordPayload 
} from '../types/auth';
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/** Lấy Token từ Cookie */
export const getSavedToken = (): string | undefined => {
  return Cookies.get(ACCESS_TOKEN_KEY);
};

/** Header chung cho các request yêu cầu đăng nhập */
async function getAuthHeaders(): Promise<HeadersInit> {
  const token = getSavedToken();
  if (!token) throw new Error('Bạn chưa đăng nhập');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Shared authenticated fetch — automatically attaches auth headers.
 * Redirects to /auth/login when there is no token or the server returns 401.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getSavedToken();

  if (!token) {
    if (typeof window !== 'undefined') {
      window.location.replace('/auth/login');
    }
    throw new Error('Bạn chưa đăng nhập');
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (res.status === 401) {
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
    if (typeof window !== 'undefined') {
      window.location.replace('/auth/login');
    }
    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
  }

  return res;
}

/** Đăng nhập */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await parseResponseBody(response);
  if (!response.ok) throw new Error(formatApiError(response, data, 'Đăng nhập thất bại'));

  if (data?.access_token) Cookies.set(ACCESS_TOKEN_KEY, data.access_token, { expires: 7 }); // Hết hạn sau 7 ngày
  if (data?.refresh_token) Cookies.set(REFRESH_TOKEN_KEY, data.refresh_token, { expires: 30 });

  return data;
}

/** Đăng ký */
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await parseResponseBody(response);
  if (!response.ok) throw new Error(formatApiError(response, data, 'Đăng ký thất bại'));

  if (data?.access_token) Cookies.set(ACCESS_TOKEN_KEY, data.access_token);
  if (data?.refresh_token) Cookies.set(REFRESH_TOKEN_KEY, data.refresh_token);

  return data;
}

/** Đăng xuất */
export async function logout(): Promise<void> {
  const refreshToken = Cookies.get(REFRESH_TOKEN_KEY);
  
  // Xóa token ở client trước
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);

  if (!refreshToken) return;

  try {
    await Promise.race([
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Logout timeout')), 4000)),
    ]);
  } catch (error) {
    console.warn('Logout revoke request failed:', error);
  }
}

/** Lấy thông tin cá nhân */
export async function getMyProfile(): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  const data = await parseResponseBody(response);
  if (!response.ok) throw new Error(formatApiError(response, data, 'Không lấy được hồ sơ'));
  return data;
}

/** Cập nhật thông tin cá nhân */
export async function updateMyProfile(payload: UserUpdatePayload): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseResponseBody(response);
  if (!response.ok) throw new Error(formatApiError(response, data, 'Không cập nhật được hồ sơ'));
  return data;
}

/** Đổi mật khẩu */
export async function changePassword(payload: ChangePasswordPayload): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/users/me/change-password`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseResponseBody(response);
  if (!response.ok) throw new Error(formatApiError(response, data, 'Đổi mật khẩu thất bại'));
  return data;
}

async function parseResponseBody(response: Response) {
  const text = await response.text().catch(() => '');
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

function formatApiError(response: Response, data: any, fallbackMessage: string) {
  const detail = data?.detail || data?.message || data?.error || '';
  const normalizedDetail = typeof detail === 'string' ? detail.trim() : '';

  if (normalizedDetail) {
    return normalizedDetail;
  }

  if (response.status) {
    return `${fallbackMessage} (HTTP ${response.status})`;
  }

  return fallbackMessage;
}