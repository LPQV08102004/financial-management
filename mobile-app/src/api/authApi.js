import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const EXPO_HOST = Constants.expoConfig?.hostUri?.split(':')[0];
// Android emulator: use 10.0.2.2 to reach host machine
// Physical device or iOS: use EXPO_HOST or fallback to 192.168.1.213
const getApiBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1'; // Android emulator special address
  }
  if (EXPO_HOST) {
    return `http://${EXPO_HOST}:8000/api/v1`;
  }
  return 'http://192.168.1.213:8000/api/v1'; // Change this to your host IP if different
};

const API_BASE_URL = getApiBaseUrl();
const ACCESS_TOKEN_KEY = 'access_token';

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

  return data;
}

export async function getSavedToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function logout() {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
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
