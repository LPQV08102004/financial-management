import { useEffect, useState, useCallback } from 'react'
import Modal from '../components/Modal'
import {
  listUsers, createUser, toggleUserStatus, setUserRole, resetPassword,
} from '../api/adminApi'

const EMPTY_FORM = { email: '', password: '', full_name: '' }

function Badge({ children, color }) {
  const cls = {
    green: 'bg-green-100 text-green-700',
    red:   'bg-red-100 text-red-600',
    blue:  'bg-blue-100 text-blue-700',
    gray:  'bg-slate-100 text-slate-500',
  }[color] || 'bg-slate-100 text-slate-500'
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{children}</span>
}

export default function UsersPage() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [createModal, setCreateModal] = useState(false)
  const [resetModal, setResetModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [resetPwd, setResetPwd] = useState('')
  const [formErr, setFormErr] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async (p = page) => {
    const params = { page: p, page_size: 15 }
    if (search) params.search = search
    if (filterActive !== '') params.is_active = filterActive
    const d = await listUsers(params)
    setData(d)
    setPage(p)
  }, [page, search, filterActive])

  useEffect(() => { load(1) }, [search, filterActive])
  useEffect(() => { load(page) }, [page])

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  async function handleToggle(id, name, active) {
    if (!confirm(`${active ? 'Khóa' : 'Mở khóa'} tài khoản "${name}"?`)) return
    try { await toggleUserStatus(id); load(page) }
    catch (e) { alert(e.message) }
  }

  async function handleSetRole(id, name, currentIsAdmin) {
    const action = currentIsAdmin ? 'Thu hồi quyền admin' : 'Cấp quyền admin'
    if (!confirm(`${action} cho "${name}"?`)) return
    try { await setUserRole(id, !currentIsAdmin); load(page) }
    catch (e) { alert(e.message) }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setFormErr('')
    setSubmitting(true)
    try {
      await createUser(form)
      setCreateModal(false)
      setForm(EMPTY_FORM)
      load(1)
    } catch (e) { setFormErr(e.message) }
    finally { setSubmitting(false) }
  }

  async function handleReset(e) {
    e.preventDefault()
    setFormErr('')
    setSubmitting(true)
    try {
      await resetPassword(resetModal.id, resetPwd)
      setResetModal(null)
      setResetPwd('')
    } catch (e) { setFormErr(e.message) }
    finally { setSubmitting(false) }
  }

  const totalPages = data ? Math.ceil(data.total / 15) : 1

  return (
    <div>
      <div className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-10">
        <h1 className="text-lg font-semibold">Quản lý người dùng</h1>
      </div>
      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-semibold text-sm">Danh sách tài khoản</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text" placeholder="Tìm email, tên..."
                value={searchInput} onChange={e => setSearchInput(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-400 w-48"
              />
              <select
                value={filterActive} onChange={e => setFilterActive(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none"
              >
                <option value="">Tất cả</option>
                <option value="true">Hoạt động</option>
                <option value="false">Đã khóa</option>
              </select>
              <button
                onClick={() => { setForm(EMPTY_FORM); setFormErr(''); setCreateModal(true) }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg transition-colors"
              >
                + Tạo người dùng
              </button>
            </div>
          </div>

          {}
          {!data ? (
            <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Họ tên</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Quyền</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                  <th className="px-4 py-3">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-400">#{u.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{u.full_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.is_active ? <Badge color="green">Hoạt động</Badge> : <Badge color="red">Đã khóa</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      {u.is_admin ? <Badge color="blue">Admin</Badge> : <Badge color="gray">User</Badge>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {}
                        {!u.is_admin && (
                          <button
                            onClick={() => handleToggle(u.id, u.full_name, u.is_active)}
                            className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                              u.is_active
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {u.is_active ? 'Khóa' : 'Mở khóa'}
                          </button>
                        )}
                        {}
                        <button
                          onClick={() => handleSetRole(u.id, u.full_name, u.is_admin)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          {u.is_admin ? 'Bỏ Admin' : 'Cấp Admin'}
                        </button>
                        {}
                        <button
                          onClick={() => { setResetPwd(''); setFormErr(''); setResetModal({ id: u.id, name: u.full_name }) }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors"
                        >
                          Reset MK
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {}
          {data && totalPages > 1 && (
            <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-100 text-sm text-slate-500">
              <span>Tổng: {data.total}</span>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">← Trước</button>
              <span>Trang {page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">Sau →</button>
            </div>
          )}
        </div>
      </div>

      {}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Tạo người dùng mới">
        <form onSubmit={handleCreate} className="space-y-3">
          {formErr && <div className="bg-red-50 text-red-600 text-xs rounded-lg px-3 py-2">{formErr}</div>}
          {[['email','Email','email','admin@example.com'],['password','Mật khẩu','password','••••••••'],['full_name','Họ và tên','text','Nguyễn Văn A']].map(([k,l,t,p]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-slate-600 mb-1">{l}</label>
              <input type={t} required placeholder={p} value={form[k]}
                onChange={e => setForm(f => ({...f, [k]: e.target.value}))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCreateModal(false)}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Hủy</button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
              {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </Modal>

      {}
      <Modal open={!!resetModal} onClose={() => setResetModal(null)}
        title={`Reset mật khẩu — ${resetModal?.name}`}>
        <form onSubmit={handleReset} className="space-y-3">
          {formErr && <div className="bg-red-50 text-red-600 text-xs rounded-lg px-3 py-2">{formErr}</div>}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Mật khẩu mới (ít nhất 8 ký tự)</label>
            <input type="password" required minLength={8} value={resetPwd}
              onChange={e => setResetPwd(e.target.value)} placeholder="••••••••"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setResetModal(null)}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Hủy</button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
              {submitting ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
