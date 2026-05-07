"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Wallet, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await signIn(email, password);
      if (!result.success) {
        setError(result.message || 'Đăng nhập thất bại');
      } else {
        router.push('/home');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Left panel - branding (desktop only) */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#075c09] to-[#054d07] flex-col items-center justify-center p-12 text-white">
        <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center mb-8">
          <Wallet size={40} className="text-white" />
        </div>
        <h1 className="text-4xl font-black mb-3">Singitronic</h1>
        <p className="text-white/70 text-center text-lg max-w-xs leading-relaxed">
          Quản lý tài chính thông minh tích hợp trợ lý AI
        </p>
        <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-xs">
          {[
            { emoji: '📊', label: 'Phân tích chi tiêu' },
            { emoji: '🤖', label: 'Trợ lý AI' },
            { emoji: '🎯', label: 'Mục tiêu tiết kiệm' },
            { emoji: '🔁', label: 'Giao dịch định kỳ' },
          ].map((f) => (
            <div key={f.label} className="bg-white/10 rounded-xl p-3 border border-white/10">
              <span className="text-2xl block mb-1">{f.emoji}</span>
              <span className="text-white/80 text-xs font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#075c09] flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Wallet size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-[#075c09]">Singitronic</h1>
            <p className="text-slate-500 text-sm mt-1">Quản lý tài chính thông minh</p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Đăng nhập</h2>
              <p className="text-slate-500 text-sm mt-1">Chào mừng trở lại!</p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#075c09]/30 focus:border-[#075c09] text-slate-800 bg-slate-50/50 placeholder:text-slate-400 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#075c09]/30 focus:border-[#075c09] text-slate-800 bg-slate-50/50 placeholder:text-slate-400 transition-colors text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-[#075c09] hover:bg-[#065308] active:scale-[0.98] shadow-sm shadow-[#075c09]/20'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Đang đăng nhập...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </button>

            <p className="mt-5 text-center text-sm text-slate-500">
              Chưa có tài khoản?{' '}
              <Link href="/auth/signup" className="font-bold text-[#075c09] hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
