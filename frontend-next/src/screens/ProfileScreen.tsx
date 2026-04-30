"use client";

import React, { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

// Định nghĩa kiểu dữ liệu User dựa trên cấu trúc API của bạn
interface UserProfile {
  full_name: string;
  email: string;
  phone_number?: string;
}

export default function ProfileScreen() {
  const { refreshProfile, signOut, state } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const user = state.user;

  const loadProfile = async () => {
    try {
      setLoading(true);
      const result = await refreshProfile();
      if (!result.success) {
        throw new Error(result.message);
      }
    } catch (error: any) {
      alert(error.message || 'Không tải được hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  // Thay thế useFocusEffect bằng useEffect cho Web
  useEffect(() => {
    loadProfile();
  }, []);

  const performLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      const result = await signOut();
      if (!result.success) {
        alert(result.message || 'Đăng xuất thất bại');
      } else {
        // Next.js xử lý điều hướng sau đăng xuất thường qua Router hoặc window.location
        window.location.href = '/login'; 
      }
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FFF8F0] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#075c09]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#FFF8F0] relative font-sans">
      {/* Header */}
      <header className="bg-[#075c09] p-5 pt-8 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <button 
          onClick={() => window.history.back()} 
          className="text-white text-2xl font-bold p-2 hover:opacity-80 transition-opacity"
        >
          ←
        </button>
        <h1 className="text-white text-xl font-semibold">Hồ sơ cá nhân</h1>
        <div className="w-12"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-5 pb-24 overflow-y-auto">
        <div className="flex flex-col items-center my-8 relative">
          {/* Avatar Circle */}
          <div className="w-32 h-32 rounded-full bg-[#075c09]/10 flex items-center justify-center border-4 border-[#075c09] text-6xl">
            👤
          </div>
          {/* Edit Icon Overlay */}
          <button 
            onClick={() => console.log('Change avatar')}
            className="absolute bottom-0 right-[30%] w-10 h-10 bg-[#075c09] rounded-full flex items-center justify-center border-2 border-[#FFF8F0] text-lg shadow-lg hover:scale-110 transition-transform"
          >
            ✏️
          </button>
        </div>

        {/* User Info Section */}
        <div className="space-y-5">
          {/* Group: Name */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#075c09] block uppercase tracking-wider">Tên</label>
            <div className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-800 font-medium shadow-sm">
              {user?.full_name || 'N/A'}
            </div>
          </div>

          {/* Group: Email */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#075c09] block uppercase tracking-wider">Địa chỉ email</label>
            <div className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-800 font-medium shadow-sm">
              {user?.email || 'N/A'}
            </div>
          </div>

          {/* Group: Phone */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#075c09] block uppercase tracking-wider">Số điện thoại</label>
            <div className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-800 font-medium shadow-sm">
              {user?.phone_number || 'Chưa cập nhật'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 space-y-3">
            <button className="w-full py-4 bg-[#075c09] text-white font-bold rounded-lg shadow-md hover:bg-[#064a08] active:scale-[0.98] transition-all">
              Chỉnh sửa hồ sơ
            </button>
            
            <button 
              onClick={() => window.location.href = '/change-password'}
              className="w-full py-4 bg-white text-[#075c09] font-bold rounded-lg border-2 border-[#075c09] hover:bg-[#075c09]/5 active:scale-[0.98] transition-all"
            >
              Đổi mật khẩu
            </button>

            <button 
              onClick={() => setShowLogoutModal(true)}
              disabled={loggingOut}
              className={`w-full py-4 bg-[#e74c3c] text-white font-bold rounded-lg shadow-md active:scale-[0.98] transition-all ${loggingOut ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#c0392b]'}`}
            >
              {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </button>
          </div>
        </div>
      </main>

            {/* Logout Confirmation Modal Overlay */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Xác nhận đăng xuất</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này không?</p>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  setShowLogoutModal(false);
                  performLogout();
                }}
                disabled={loggingOut}
                className="px-5 py-2.5 bg-[#e74c3c] text-white font-bold rounded-lg shadow-sm hover:bg-[#c0392b] transition-colors"
              >
                {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
