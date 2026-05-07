import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_BASE_URL_CANDIDATES } from './config';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_PROFILE_KEY = 'user_profile';

export async function login(email, password) {
  const response = await fetchWithNetworkGuard(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = formatErrorDetail(data) || 'Đăng nhập thất bại';
    throw new Error(msg);
  }

  if (data?.access_token) {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  }
  if (data?.refresh_token) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  }
  if (data?.user) {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(data.user));
  }

  return data;
}

export async function register(fullName, email, password, phoneNumber) {
  const response = await fetchWithNetworkGuard(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: fullName,
      email,
      password,
      phone_number: phoneNumber || null,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = formatErrorDetail(data) || 'Đăng ký thất bại';
    throw new Error(msg);
  }

  if (data?.access_token) {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  }
  if (data?.refresh_token) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  }
  if (data?.user) {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(data.user));
  }

  return data;
}

export async function getSavedToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getSavedUserProfile() {
  const raw = await AsyncStorage.getItem(USER_PROFILE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function logout() {
  let refreshToken = null;
  try {
    refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.warn('Cannot read refresh token from storage:', error);
    refreshToken = null;
  }

  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  await AsyncStorage.removeItem(USER_PROFILE_KEY);

  if (!refreshToken) {
    return;
  }

  try {
    await Promise.race([
      fetchWithNetworkGuard(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Logout timeout')), 4000)),
    ]);
  } catch (error) {
    // best-effort server revoke
    console.warn('Logout revoke request failed:', error);
  }
}

export async function changePassword(currentPassword, newPassword, confirmPassword) {
  const response = await fetchWithNetworkGuard(`${API_BASE_URL}/users/me/change-password`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = formatErrorDetail(data) || 'Đổi mật khẩu thất bại';
    throw new Error(msg);
  }
  return data;
}

async function getAuthHeaders() {
  const token = await getSavedToken();
  if (!token) {
    throw new Error('Bạn chưa đăng nhập');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function getMyProfile() {
  const response = await fetchWithNetworkGuard(`${API_BASE_URL}/users/me`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = formatErrorDetail(data) || 'Không lấy được hồ sơ người dùng';
    throw new Error(msg);
  }

  if (data) {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(data));
  }

  return data;
}

export async function updateMyProfile(payload) {
  const response = await fetchWithNetworkGuard(`${API_BASE_URL}/users/me`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = formatErrorDetail(data) || 'Không cập nhật được hồ sơ người dùng';
    throw new Error(msg);
  }

  if (data) {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(data));
  }

  return data;
}

function formatErrorDetail(data) {
  if (!data) return '';
  const detail = data.detail ?? data.message ?? data.errors ?? null;
  if (!detail) return '';

  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        if (typeof d === 'string') return d;
        return d?.msg || d?.message || JSON.stringify(d);
      })
      .join(', ');
  }

  if (typeof detail === 'object') {
    return detail.message || Object.values(detail).map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join(', ');
  }

  return String(detail);
}

async function fetchWithNetworkGuard(url, options) {
  const candidateUrls = buildCandidateUrls(url);
  let lastError = null;

  for (const candidateUrl of candidateUrls) {
    try {
      return await fetch(candidateUrl, options);
    } catch (error) {
      lastError = error;
      const raw = String(error?.message || '');
      if (!/Network request failed|Failed to fetch/i.test(raw)) {
        throw error;
      }
    }
  }

  const attempted = candidateUrls.join(' | ');
  throw new Error(`Không kết nối được máy chủ. Đã thử: ${attempted}`);
}

function buildCandidateUrls(url) {
  if (!url.startsWith(API_BASE_URL)) {
    return [url];
  }

  const suffix = url.slice(API_BASE_URL.length);
  const baseCandidates = API_BASE_URL_CANDIDATES?.length ? API_BASE_URL_CANDIDATES : [API_BASE_URL];
  return [...new Set(baseCandidates.map((base) => `${base}${suffix}`))];
}
