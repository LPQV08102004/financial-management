import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/users', label: 'Người dùng', icon: '👥' },
  { to: '/categories', label: 'Danh mục', icon: '🏷️' },
  { to: '/audit', label: 'Audit Logs', icon: '📋' },
]

export default function Layout({ children }) {
  const { adminEmail, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar — fixed, luôn cố định bên trái */}
      <aside className="fixed top-0 left-0 h-screen w-56 bg-slate-800 text-white flex flex-col z-20">
        <div className="px-5 py-5 border-b border-slate-700">
          <h2 className="font-bold text-base">Finance Admin</h2>
          <p className="text-xs text-slate-400 mt-1 break-all">{adminEmail}</p>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <span>{n.icon}</span> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-700 hover:text-red-400 transition-colors w-full"
          >
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content — offset sang phải đúng bằng width sidebar */}
      <main className="ml-56 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  )
}
