import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const EXPO_HOST = Constants.expoConfig?.hostUri?.split(':')[0];
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }
  if (EXPO_HOST) {
    return `http://${EXPO_HOST}:8000/api/v1`;
  }
  return 'http://192.168.1.213:8000/api/v1';
};
const BASE_URL = getBaseUrl();

const ACCESS_TOKEN_KEY = 'access_token';

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) throw new Error('Bạn chưa đăng nhập');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

/**
 * GET /categories
 * type: 'income' | 'expense' | undefined (all)
 */
export async function listCategories(type) {
  const query = type ? `?type=${type}` : '';
  const res = await fetch(`${BASE_URL}/categories${query}`, {
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không lấy được danh mục');
  return data;
}
