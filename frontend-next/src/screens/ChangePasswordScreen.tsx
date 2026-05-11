"use client";

import React, { useState } from 'react';
import { changePassword } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export default function ChangePasswordScreen() {
  const { signOut } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ tất cả các trường');
      return;
    }

    const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
      setError('Mật khẩu mới phải từ 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      alert('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      await signOut();
    } catch (err: any) {
      setError(err.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF8F0] font-sans">
      <header className="bg-[#075c09] p-5 pt-8 flex items-center justify-between shadow-md">
        <button
          onClick={() => window.history.back()}
          className="text-white text-2xl font-bold p-2 hover:opacity-80 transition-opacity"
        >
          ←
        </button>
        <h1 className="text-white text-xl font-semibold">Đổi mật khẩu</h1>
        <div className="w-12"></div>
      </header>

      <main className="flex-1 p-6">
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
          Sau khi đổi mật khẩu, bạn sẽ được đăng xuất khỏi tất cả thiết bị.
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#075c09]">Mật khẩu hiện tại</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:border-[#075c09] focus:ring-1 focus:ring-[#075c09]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#075c09]">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự, có chữ hoa, chữ thường..."
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:border-[#075c09] focus:ring-1 focus:ring-[#075c09]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#075c09]">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:border-[#075c09] focus:ring-1 focus:ring-[#075c09]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-8 py-4 font-bold text-white rounded-lg shadow-md transition-all ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#075c09] hover:bg-[#064a08] active:scale-[0.98]'
            }`}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
          </button>
        </form>
      </main>
    </div>
  );
}
