import { apiRequest } from './client'

async function json(res) {
  if (res.status === 204) return null
  const d = await res.json()
  if (!res.ok) throw new Error(d.detail || 'Thao tác thất bại')
  return d
}

export const getStats = () => apiRequest('/admin/stats').then(json)

export const listUsers = (params) =>
  apiRequest('/admin/users?' + new URLSearchParams(params)).then(json)
export const createUser = (body) =>
  apiRequest('/admin/users', { method: 'POST', body: JSON.stringify(body) }).then(json)
export const getUserDetail = (id) => apiRequest(`/admin/users/${id}`).then(json)
export const toggleUserStatus = (id) =>
  apiRequest(`/admin/users/${id}/status`, { method: 'PATCH' }).then(json)
export const setUserRole = (id, is_admin) =>
  apiRequest(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ is_admin }) }).then(json)
export const resetPassword = (id, new_password) =>
  apiRequest(`/admin/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ new_password }) }).then(json)

export const listAuditLogs = (params) =>
  apiRequest('/admin/audit-logs?' + new URLSearchParams(params)).then(json)

export const listUserCategories = (params) =>
  apiRequest('/admin/user-categories?' + new URLSearchParams(params)).then(json)
export const deactivateUserCategory = (id) =>
  apiRequest(`/admin/user-categories/${id}`, { method: 'DELETE' }).then(json)

export const listDefaultTemplates = (params = {}) =>
  apiRequest('/admin/default-categories?' + new URLSearchParams(params)).then(json)
export const createDefaultTemplate = (body) =>
  apiRequest('/admin/default-categories', { method: 'POST', body: JSON.stringify(body) }).then(json)
export const updateDefaultTemplate = (id, body) =>
  apiRequest(`/admin/default-categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).then(json)
export const deleteDefaultTemplate = (id) =>
  apiRequest(`/admin/default-categories/${id}`, { method: 'DELETE' }).then(json)
