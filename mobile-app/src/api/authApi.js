import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const EXPO_HOST = Constants.expoConfig?.hostUri?.split(':')[0];
const API_BASE_URL = EXPO_HOST
  ? `http://${EXPO_HOST}:8000/api/v1`
  : 'http://127.0.0.1:8000/api/v1';
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail || 'Đăng nhập thất bại');
  }

  if (data?.access_token) {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  }
  if (data?.refresh_token) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  }

  return data;
}

export async function register(fullName, email, password, phoneNumber) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
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
    throw new Error(data?.detail || 'Đăng ký thất bại');
  }

  if (data?.access_token) {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  }
  if (data?.refresh_token) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  }

  return data;
}

export async function getSavedToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function logout() {
  let refreshToken = null;
  try {
    refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (_) {
    refreshToken = null;
  }

  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);

  if (!refreshToken) {
    return;
  }

  try {
    await Promise.race([
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Logout timeout')), 4000)),
    ]);
  } catch (_) {
    // best-effort server revoke
  }
}

export async function changePassword(currentPassword, newPassword, confirmPassword) {
  const response = await fetch(`${API_BASE_URL}/users/me/change-password`, {
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
    throw new Error(data?.detail || 'Đổi mật khẩu thất bại');
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
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail || 'Không lấy được hồ sơ người dùng');
  }
  return data;
}

export async function updateMyProfile(payload) {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail || 'Không cập nhật được hồ sơ người dùng');
  }
  return data;
}
