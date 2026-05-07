// src/api/categoriesApi.ts
import { API_BASE_URL } from './config';
import { Category, CategoryPayload, CategoryType } from '../types/category';
import { apiFetch } from './authApi';

/** GET /categories — Lấy danh sách danh mục */
export async function listCategories(type?: CategoryType): Promise<Category[]> {
  const query = type ? `?type=${type}` : '';
  const res = await apiFetch(`${API_BASE_URL}/categories${query}`);
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không lấy được danh mục');
  return data;
}

/** POST /categories — Tạo danh mục mới */
export async function createCategory(payload: CategoryPayload): Promise<Category> {
  const res = await apiFetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không tạo được danh mục');
  return data;
}

/** PATCH /categories/{id} — Cập nhật danh mục */
export async function updateCategory(id: string | number, payload: Partial<CategoryPayload>): Promise<Category> {
  const res = await apiFetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Không cập nhật được danh mục');
  return data;
}

/** DELETE /categories/{id} — Xóa danh mục */
export async function deleteCategory(id: string | number): Promise<void> {
  const res = await apiFetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'DELETE',
  });
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail || 'Không xóa được danh mục');
  }
}