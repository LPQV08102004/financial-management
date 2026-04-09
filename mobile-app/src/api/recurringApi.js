import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const EXPO_HOST = Constants.expoConfig?.hostUri?.split(':')[0];
const BASE_URL = EXPO_HOST
  ? `http://${EXPO_HOST}:8000/api/v1`
  : 'http://127.0.0.1:8000/api/v1';

const ACCESS_TOKEN_KEY = 'access_token';

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) throw new Error('Bạn chưa đăng nhập');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

/** GET /recurring — list all active templates */
export async function listTemplates() {
  const res = await fetch(`${BASE_URL}/recurring`, {
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không lấy được danh sách giao dịch định kỳ');
  return data; // RecurringTemplateOut[]
}

/** POST /recurring — create a template */
export async function createTemplate(payload) {
  const res = await fetch(`${BASE_URL}/recurring`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không tạo được giao dịch định kỳ');
  return data;
}

/** GET /recurring/upcoming?days=30 — projected occurrences */
export async function getUpcoming(days = 30) {
  const res = await fetch(`${BASE_URL}/recurring/upcoming?days=${days}`, {
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không lấy được lịch sắp tới');
  return data; // UpcomingListResponse
}

/** POST /recurring/process — generate all overdue transactions */
export async function processAllDue() {
  const res = await fetch(`${BASE_URL}/recurring/process`, {
    method: 'POST',
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Lỗi khi xử lý giao dịch định kỳ');
  return data; // GenerateResult
}

/** GET /recurring/:id */
export async function getTemplate(templateId) {
  const res = await fetch(`${BASE_URL}/recurring/${templateId}`, {
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không tìm thấy giao dịch định kỳ');
  return data;
}

/** PATCH /recurring/:id */
export async function updateTemplate(templateId, payload) {
  const res = await fetch(`${BASE_URL}/recurring/${templateId}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không cập nhật được giao dịch định kỳ');
  return data;
}

/** DELETE /recurring/:id */
export async function deleteTemplate(templateId) {
  const res = await fetch(`${BASE_URL}/recurring/${templateId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail || 'Không xóa được giao dịch định kỳ');
  }
}

/** POST /recurring/:id/generate — manually generate overdue txns for one template */
export async function generateDue(templateId) {
  const res = await fetch(`${BASE_URL}/recurring/${templateId}/generate`, {
    method: 'POST',
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không tạo được giao dịch');
  return data;
}
