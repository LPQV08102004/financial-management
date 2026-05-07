// src/api/notificationsApi.ts
import { API_BASE_URL } from './config';
import { getSavedToken } from './authApi';

async function authHeaders(): Promise<HeadersInit> {
  const token = getSavedToken();
  if (!token) throw new Error('Bạn chưa đăng nhập');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function listReminders() {
  const res = await fetch(`${API_BASE_URL}/reminders`, { headers: await authHeaders() });
  if (!res.ok) throw new Error('Lỗi tải lời nhắc');
  return res.json();
}

export async function createReminder(payload: {
  title: string;
  frequency: string;
  start_date: string;
  reminder_time?: string;
  notes?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/reminders`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Tạo thất bại');
  }
  return res.json();
}

export async function updateReminder(id: string, payload: Partial<{
  title: string;
  frequency: string;
  start_date: string;
  reminder_time: string;
  notes: string;
}>) {
  const res = await fetch(`${API_BASE_URL}/reminders/${id}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Sửa thất bại');
  }
  return res.json();
}

export async function deleteReminder(id: string) {
  const res = await fetch(`${API_BASE_URL}/reminders/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Xóa thất bại');
}

export async function listNotifications(type?: string) {
  const url = type ? `${API_BASE_URL}/notifications?display_type=${type}` : `${API_BASE_URL}/notifications`;
  const res = await fetch(url, { headers: await authHeaders() });
  if (!res.ok) throw new Error('Lỗi tải thông báo');
  return res.json();
}

export async function getUnreadCount(): Promise<number> {
  const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, { headers: await authHeaders() });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count ?? 0;
}

export async function markAllRead() {
  const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Thất bại');
}
