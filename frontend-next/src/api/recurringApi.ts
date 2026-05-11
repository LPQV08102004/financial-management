import { API_BASE_URL } from './config';
import {
  RecurringTemplate,
  CreateRecurringPayload,
  UpcomingListResponse,
  GenerateResult
} from '../types/recurring';
import { apiFetch } from './authApi';

export async function listTemplates(): Promise<RecurringTemplate[]> {
  const res = await apiFetch(`${API_BASE_URL}/recurring`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không lấy được danh sách giao dịch định kỳ');
  return data;
}

export async function createTemplate(payload: CreateRecurringPayload): Promise<RecurringTemplate> {
  const res = await apiFetch(`${API_BASE_URL}/recurring`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không tạo được giao dịch định kỳ');
  return data;
}

export async function getUpcoming(days: number = 30): Promise<UpcomingListResponse> {
  const res = await apiFetch(`${API_BASE_URL}/recurring/upcoming?days=${days}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không lấy được lịch sắp tới');
  return data;
}

export async function processAllDue(): Promise<GenerateResult> {
  const res = await apiFetch(`${API_BASE_URL}/recurring/process`, {
    method: 'POST',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Lỗi khi xử lý giao dịch định kỳ');
  return data;
}

export async function getTemplate(templateId: string | number): Promise<RecurringTemplate> {
  const res = await apiFetch(`${API_BASE_URL}/recurring/${templateId}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không tìm thấy giao dịch định kỳ');
  return data;
}

export async function updateTemplate(
  templateId: string | number,
  payload: Partial<CreateRecurringPayload>
): Promise<RecurringTemplate> {
  const res = await apiFetch(`${API_BASE_URL}/recurring/${templateId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không cập nhật được giao dịch định kỳ');
  return data;
}

export async function deleteTemplate(templateId: string | number): Promise<void> {
  const res = await apiFetch(`${API_BASE_URL}/recurring/${templateId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail || 'Không xóa được giao dịch định kỳ');
  }
}