"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!email || !fullName || !phone || !password || !passwordConfirm) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Mật khẩu không trùng khớp');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await signUp({
        email,
        full_name: fullName,
        phone_number: phone,
        password,
      });
      if (!result.success) {
        setError(result.message || 'Đăng ký thất bại');
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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#075c09] to-[#0a3e05] items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-[#075c09] mb-2">💰</h1>
          <h2 className="text-2xl font-bold text-gray-800">Đăng ký</h2>
          <p className="text-gray-500 text-sm mt-1">Tạo tài khoản để bắt đầu</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Họ tên</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyen Van A"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#075c09] text-black"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#075c09] text-black"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Số điện thoại</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0123456789"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#075c09] text-black"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#075c09] text-black"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Xác nhận mật khẩu</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#075c09] text-black"
              onKeyPress={(e) => e.key === 'Enter' && handleSignup()}
            />
          </div>
        </div>

        <button
          onClick={handleSignup}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-[#075c09] hover:bg-[#064a08] active:scale-95'
          }`}
        >
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>

        <div className="mt-6 text-center text-sm text-gray-600">
          Đã có tài khoản?{' '}
          <Link href="/auth/login" className="font-bold text-[#075c09] hover:underline">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}

