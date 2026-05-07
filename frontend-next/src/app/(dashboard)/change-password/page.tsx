"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { changePassword } from '@/src/api/authApi';
import { useAuth } from '@/src/context/AuthContext';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }
    try {
      setLoading(true);
      await changePassword({ current_password: form.current_password, new_password: form.new_password, confirm_password: form.confirm_password });
      alert('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      await signOut();
    } catch (e: any) {
      alert(e.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#FFF8F0] min-h-screen">
      <header className="bg-[#075c09] p-5 pt-8 flex items-center gap-4 text-white sticky top-0 z-20">
        <button onClick={() => router.back()} className="text-2xl">←</button>
        <h1 className="text-xl font-medium">Đổi mật khẩu</h1>
      </header>
      <main className="flex-1 p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {(['current_password', 'new_password', 'confirm_password'] as const).map((field) => (
            <div key={field}>
              <label className="block text-[#075c09] font-semibold mb-1 text-sm">
                {field === 'current_password' ? 'Mật khẩu hiện tại' : field === 'new_password' ? 'Mật khẩu mới' : 'Xác nhận mật khẩu mới'}
              </label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#075c09]"
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                required
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#075c09] text-white py-4 rounded-lg font-bold disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </main>
    </div>
  );
}
