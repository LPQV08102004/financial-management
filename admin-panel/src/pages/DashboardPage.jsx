import { useEffect, useState } from 'react'
import { getStats } from '../api/adminApi'

function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    teal: 'bg-teal-50 text-teal-600',
  }
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
      <div className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${colors[color]}`}>
        {label}
      </div>
      <div className="text-3xl font-bold text-slate-800">{Number(value).toLocaleString('vi-VN')}</div>
      <div className="text-xs text-slate-400 mt-1">{sub}</div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getStats().then(setStats).catch(e => setError(e.message))
  }, [])

  return (
    <div>
      <div className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-10">
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </div>
      <div className="p-8">
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
        {!stats ? (
          <div className="text-slate-400 text-sm">Đang tải...</div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            <StatCard label="Tổng người dùng" value={stats.total_users}
              sub={`${stats.new_users_this_month} mới tháng này`} color="blue" />
            <StatCard label="Đang hoạt động" value={stats.active_users}
              sub={`${stats.total_users - stats.active_users} tài khoản bị khóa`} color="green" />
            <StatCard label="Tổng giao dịch" value={stats.total_transactions}
              sub={`${stats.transactions_this_month} giao dịch tháng này`} color="purple" />
            <StatCard label="Tổng tài khoản" value={stats.total_accounts}
              sub="ngân hàng, tiền mặt, ví điện tử" color="orange" />
            <StatCard label="Danh mục" value={stats.total_categories}
              sub="tổng số danh mục người dùng" color="teal" />
          </div>
        )}
      </div>
    </div>
  )
}
