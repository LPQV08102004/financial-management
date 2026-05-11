import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const BASE_URL = API_BASE_URL;
const ACCESS_TOKEN_KEY = 'access_token';

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) throw new Error('Bạn chưa đăng nhập');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function generateNotifications() {
  const res = await fetch(`${BASE_URL}/notifications/generate`, {
    method: 'POST',
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Lỗi tạo thông báo');
  return data;
}

export async function listNotifications({ displayType, unreadOnly = false, skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({ unread_only: unreadOnly, skip, limit });
  if (displayType && displayType !== 'all') params.append('display_type', displayType);
  const res = await fetch(`${BASE_URL}/notifications?${params}`, {
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Lỗi lấy thông báo');
  return data;
}

export async function getUnreadCount() {
  const res = await fetch(`${BASE_URL}/notifications/unread-count`, {
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Lỗi lấy số thông báo chưa đọc');
  return data.unread_count;
}

export async function markAllRead() {
  const res = await fetch(`${BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Lỗi đánh dấu tất cả đã đọc');
  return data;
}

export async function markRead(notificationId) {
  const res = await fetch(`${BASE_URL}/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Lỗi đánh dấu đã đọc');
  return data;
}

export async function deleteNotification(notificationId) {
  const res = await fetch(`${BASE_URL}/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail || 'Lỗi xóa thông báo');
  }
}

export async function listReminders() {
  const res = await fetch(`${BASE_URL}/reminders`, {
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Lỗi lấy danh sách lời nhắc');
  return data;
}

export async function createReminder(payload) {
  const res = await fetch(`${BASE_URL}/reminders`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Lỗi tạo lời nhắc');
  return data;
}

export async function updateReminder(reminderId, payload) {
  const res = await fetch(`${BASE_URL}/reminders/${reminderId}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Lỗi cập nhật lời nhắc');
  return data;
}

export async function deleteReminder(reminderId) {
  const res = await fetch(`${BASE_URL}/reminders/${reminderId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail || 'Lỗi xóa lời nhắc');
  }
}
