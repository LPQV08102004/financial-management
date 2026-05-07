import { useEffect, useState, useCallback } from 'react'
import { listAuditLogs } from '../api/adminApi'

const ACTION_LABELS = {
  create_transaction: 'Tạo giao dịch', update_transaction: 'Cập nhật GD',
  delete_transaction: 'Xóa giao dịch', assign_budget: 'Phân bổ NS',
  move_money: 'Chuyển tiền', admin_toggle_user_status: 'Admin: Khóa/mở TK',
  admin_reset_password: 'Admin: Reset MK',
}

function Badge({ children, color }) {
  const cls = { blue:'bg-blue-100 text-blue-700', gray:'bg-slate-100 text-slate-500',
    purple:'bg-purple-100 text-purple-700' }[color] || 'bg-slate-100 text-slate-500'
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{children}</span>
}

export default function AuditPage() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const [uidInput, setUidInput] = useState('')
  const [uid, setUid] = useState('')
  const [action, setAction] = useState('')

  const load = useCallback(async (p = 1) => {
    const params = { page: p, page_size: 20 }
    if (uid) params.user_id = uid
    if (action) params.action = action
    const d = await listAuditLogs(params)
    setData(d); setPage(p)
  }, [uid, action])

  useEffect(() => { load(1) }, [uid, action])

  useEffect(() => {
    const t = setTimeout(() => setUid(uidInput), 400)
    return () => clearTimeout(t)
  }, [uidInput])

  const totalPages = data ? Math.ceil(data.total / 20) : 1

  return (
    <div>
      <div className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-10">
        <h1 className="text-lg font-semibold">Audit Logs</h1>
      </div>
      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-semibold text-sm">Lịch sử hoạt động hệ thống</h3>
            <div className="flex items-center gap-2">
              <input type="text" placeholder="User ID" value={uidInput} onChange={e => setUidInput(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-24 outline-none focus:border-blue-400"/>
              <select value={action} onChange={e => setAction(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none">
                <option value="">Tất cả hành động</option>
                {Object.entries(ACTION_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          {!data ? <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div> : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3">ID</th><th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Hành động</th><th className="px-4 py-3">Đối tượng</th>
                  <th className="px-4 py-3">Thời gian</th><th className="px-4 py-3">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map(l => (
                  <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-400">#{l.id}</td>
                    <td className="px-4 py-3 text-sm">#{l.user_id}</td>
                    <td className="px-4 py-3">
                      <Badge color={l.action.startsWith('admin_') ? 'purple' : 'gray'}>
                        {ACTION_LABELS[l.action] || l.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{l.entity_type} #{l.entity_id}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(l.created_at).toLocaleDateString('vi-VN')} {new Date(l.created_at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {(l.before_data || l.after_data) ? (
                        <details className="cursor-pointer">
                          <summary className="text-slate-400">Xem diff</summary>
                          <pre className="text-xs mt-1 bg-slate-50 p-2 rounded max-w-xs overflow-auto whitespace-pre-wrap">
                            {JSON.stringify({before: tryParse(l.before_data), after: tryParse(l.after_data)}, null, 2)}
                          </pre>
                        </details>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {data && totalPages > 1 && (
            <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-100 text-sm text-slate-500">
              <span>Tổng: {data.total}</span>
              <button disabled={page<=1} onClick={() => load(page-1)}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">← Trước</button>
              <span>Trang {page}/{totalPages}</span>
              <button disabled={page>=totalPages} onClick={() => load(page+1)}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">Sau →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function tryParse(s) { try { return s ? JSON.parse(s) : null } catch { return s } }
