
import { API_BASE_URL } from './config';
import { apiFetch } from './authApi';

export async function listReminders() {
  const res = await apiFetch(`${API_BASE_URL}/reminders`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Lỗi tải lời nhắc');
  return data;
}

export async function createReminder(payload: {
  name: string;
  frequency: string;
  start_date: string;
  reminder_time?: string;
  note?: string | null;
}) {
  const res = await apiFetch(`${API_BASE_URL}/reminders`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Tạo thất bại');
  return data;
}

export async function updateReminder(id: number | string, payload: Partial<{
  name: string;
  frequency: string;
  start_date: string;
  reminder_time: string;
  note: string;
  is_enabled: boolean;
}>) {
  const res = await apiFetch(`${API_BASE_URL}/reminders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Sửa thất bại');
  return data;
}

export async function deleteReminder(id: number | string) {
  const res = await apiFetch(`${API_BASE_URL}/reminders/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail || 'Xóa thất bại');
  }
}

export async function generateNotifications() {
  const res = await apiFetch(`${API_BASE_URL}/notifications/generate`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Lỗi tạo thông báo');
  return data;
}

export async function listNotifications(opts: { displayType?: string; unreadOnly?: boolean } = {}) {
  const params = new URLSearchParams({ unread_only: String(opts.unreadOnly ?? false), skip: '0', limit: '50' });
  if (opts.displayType && opts.displayType !== 'all') params.append('display_type', opts.displayType);
  const res = await apiFetch(`${API_BASE_URL}/notifications?${params}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Lỗi tải thông báo');
  return data;
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiFetch(`${API_BASE_URL}/notifications/unread-count`);
  if (!res.ok) return 0;
  const data = await res.json().catch(() => ({}));
  return data.unread_count ?? 0;
}

export async function markRead(notificationId: number | string) {
  const res = await apiFetch(`${API_BASE_URL}/notifications/${notificationId}/read`, { method: 'PATCH' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Lỗi đánh dấu đã đọc');
  return data;
}

export async function markAllRead() {
  const res = await apiFetch(`${API_BASE_URL}/notifications/read-all`, { method: 'PATCH' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Thất bại');
  return data;
}

export async function deleteNotification(notificationId: number | string) {
  const res = await apiFetch(`${API_BASE_URL}/notifications/${notificationId}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail || 'Xóa thất bại');
  }
}
