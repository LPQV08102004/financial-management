"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Mail, Phone, Lock, LogOut, Edit3 } from 'lucide-react';

export default function ProfileScreen() {
  const { refreshProfile, signOut, state } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const user = state.user;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await refreshProfile();
      } catch (error: any) {
        alert(error.message || 'Không tải được hồ sơ');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const performLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const result = await signOut();
      if (!result.success) {
        alert(result.message || 'Đăng xuất thất bại');
      } else {
        window.location.href = '/auth/login';
      }
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#075c09] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-[#075c09] px-5 py-4 flex items-center gap-3 shadow-sm sticky top-0 z-30">
        <button
          onClick={() => window.history.back()}
          className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors flex-shrink-0"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h1 className="text-white text-lg font-semibold">Hồ sơ cá nhân</h1>
      </header>

      <div className="max-w-lg mx-auto p-5 space-y-4">
        {/* Avatar card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-[#075c09]/10 border-4 border-[#075c09]/20 flex items-center justify-center">
              <User size={40} className="text-[#075c09]" />
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#075c09] rounded-full flex items-center justify-center border-2 border-white shadow hover:scale-105 transition-transform">
              <Edit3 size={13} className="text-white" />
            </button>
          </div>
          <h2 className="text-xl font-bold text-slate-800">{user?.full_name || 'N/A'}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
        </div>

        {/* Info fields */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-9 h-9 rounded-xl bg-[#075c09]/10 flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-[#075c09]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Họ tên</p>
              <p className="text-slate-800 font-semibold text-sm mt-0.5">{user?.full_name || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Mail size={16} className="text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Email</p>
              <p className="text-slate-800 font-semibold text-sm mt-0.5 truncate">{user?.email || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Phone size={16} className="text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Số điện thoại</p>
              <p className="text-slate-800 font-semibold text-sm mt-0.5">{user?.phone_number || 'Chưa cập nhật'}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button className="w-full flex items-center gap-3 px-5 py-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-[#075c09]/10 flex items-center justify-center flex-shrink-0">
              <Edit3 size={16} className="text-[#075c09]" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">Chỉnh sửa hồ sơ</span>
          </button>

          <button
            onClick={() => (window.location.href = '/change-password')}
            className="w-full flex items-center gap-3 px-5 py-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Lock size={16} className="text-amber-500" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">Đổi mật khẩu</span>
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-5 py-4 bg-red-50 rounded-2xl border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-60"
          >
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <LogOut size={16} className="text-red-500" />
            </div>
            <span className="font-semibold text-red-600 text-sm">
              {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <LogOut size={22} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 text-center mb-2">Xác nhận đăng xuất</h2>
            <p className="text-slate-500 text-sm text-center mb-6">
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này không?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => { setShowLogoutModal(false); performLogout(); }}
                disabled={loggingOut}
                className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors"
              >
                {loggingOut ? 'Đang thoát...' : 'Đăng xuất'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
