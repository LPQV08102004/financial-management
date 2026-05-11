import { createContext, useContext, useState, useEffect } from 'react'
import { login as loginApi } from '../api/authApi'
import { getStats } from '../api/adminApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('admin_token'))
  const [adminEmail, setAdminEmail] = useState(localStorage.getItem('admin_email') || '')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {

      getStats().catch(() => logout())
    }
    setLoading(false)
  }, [])

  async function login(email, password) {
    const data = await loginApi(email, password)
    localStorage.setItem('admin_token', data.access_token)
    localStorage.setItem('admin_email', email)
    setToken(data.access_token)
    setAdminEmail(email)

    try {
      await getStats()
    } catch {
      logout()
      throw new Error('Tài khoản này không có quyền admin')
    }
  }

  function logout() {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_email')
    setToken(null)
    setAdminEmail('')
  }

  return (
    <AuthContext.Provider value={{ token, adminEmail, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
