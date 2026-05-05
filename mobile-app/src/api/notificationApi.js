import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const BASE_URL = API_BASE_URL;
const ACCESS_TOKEN_KEY = 'access_token';

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) throw new Error('Bạn chưa đăng nhập');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// ── System Notifications ──────────────────────────────────────────────────────

/** POST /notifications/generate — quét dữ liệu và sinh thông báo mới */
export async function generateNotifications() {
  const res = await fetch(`${BASE_URL}/notifications/generate`, {
    method: 'POST',
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Lỗi tạo thông báo');
  return data; // { generated: number }
}

/**
 * GET /notifications
 * @param {object} opts
 * @param {string} [opts.displayType] - 'savings' | 'recurring' | 'reminder'
 * @param {boolean} [opts.unreadOnly]
 * @param {number} [opts.skip]
 * @param {number} [opts.limit]
 * @returns {{ items: Notification[], unread_count: number }}
 */
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

/** GET /notifications/unread-count */
export async function getUnreadCount() {
  const res = await fetch(`${BASE_URL}/notifications/unread-count`, {
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Lỗi lấy số thông báo chưa đọc');
  return data.unread_count;
}

/** PATCH /notifications/read-all */
export async function markAllRead() {
  const res = await fetch(`${BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Lỗi đánh dấu tất cả đã đọc');
  return data;
}

/** PATCH /notifications/:id/read */
export async function markRead(notificationId) {
  const res = await fetch(`${BASE_URL}/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Lỗi đánh dấu đã đọc');
  return data;
}

/** DELETE /notifications/:id */
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

// ── Custom Reminders ──────────────────────────────────────────────────────────

/** GET /reminders */
export async function listReminders() {
  const res = await fetch(`${BASE_URL}/reminders`, {
    headers: await getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Lỗi lấy danh sách lời nhắc');
  return data;
}

/**
 * POST /reminders
 * @param {{ name, frequency, start_date, reminder_time?, note? }} payload
 */
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

/** PATCH /reminders/:id */
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

/** DELETE /reminders/:id */
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
