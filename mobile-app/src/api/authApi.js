import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const EXPO_HOST = Constants.expoConfig?.hostUri?.split(':')[0];
const API_BASE_URL = EXPO_HOST
  ? `http://${EXPO_HOST}:8000/api/v1`
  : 'http://127.0.0.1:8000/api/v1';
const ACCESS_TOKEN_KEY = 'access_token';

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.detail || 'Đăng nhập thất bại');
  }

  if (data?.access_token) {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  }

  return data;
}

export async function register(fullName, email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: fullName,
      email,
      password,
    }),
  });

  const data = await response.json();
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
