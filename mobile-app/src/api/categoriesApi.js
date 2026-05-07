import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const ACCESS_TOKEN_KEY = 'access_token';

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) throw new Error('Bạn chưa đăng nhập');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

const parseError = (detail, fallback) => {
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((e) => e.msg || String(e)).join('; ');
  return fallback;
};

export async function listCategories(type) {
  const query = type ? `?type=${type}` : '';
  const res = await fetch(`${API_BASE_URL}/categories${query}`, {
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(parseError(data?.detail, 'Không lấy được danh mục'));
  return data;
}

export async function createCategory(payload) {
  const res = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(parseError(data?.detail, 'Không tạo được danh mục'));
  return data;
}

export async function updateCategory(id, payload) {
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(parseError(data?.detail, 'Không cập nhật được danh mục'));
  return data;
}

export async function deleteCategory(id) {
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(parseError(data?.detail, 'Không xóa được danh mục'));
  }
}
