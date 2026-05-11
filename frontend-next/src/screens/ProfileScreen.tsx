"use client";

import React, { useState, useEffect, useRef } from 'react';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { refreshProfile, signOut, state } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = state.user;

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const result = await refreshProfile();
      if (!result.success) throw new Error(result.message);
    } catch (error: any) {
      alert(error.message || 'Không tải được hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (user) {
      setEditName(user.full_name || '');
      setEditPhone(user.phone_number || '');
    }
  }, [user]);

  const handleStartEdit = () => {
    setEditName(user?.full_name || '');
    setEditPhone(user?.phone_number || '');
    setEditMode(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) { showToast('Vui lòng nhập tên', false); return; }
    setSaving(true);
    try {
      const { updateMyProfile } = await import('../api/authApi');
      await updateMyProfile({ full_name: editName.trim(), phone_number: editPhone.trim() || null });
      await refreshProfile();
      setEditMode(false);
      showToast('Cập nhật hồ sơ thành công');
    } catch (error: any) {
      showToast(error.message || 'Cập nhật thất bại', false);
    } finally {
      setSaving(false);
    }
  };

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

  const compressImage = (file: File, maxSize = 400, quality = 0.6): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target!.result as string;
      };
      reader.readAsDataURL(file);
    });

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 16 * 1024 * 1024) {
      alert('Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 16MB.');
      return;
    }

    try {
      setUpdatingAvatar(true);

      const base64String = await compressImage(file);
      const { updateMyProfile } = await import('../api/authApi');
      await updateMyProfile({ avatar_url: base64String });
      await refreshProfile();
      showToast('Cập nhật ảnh đại diện thành công');
    } catch (error: any) {
      showToast(error.message || 'Cập nhật ảnh đại diện thất bại', false);
    } finally {
      setUpdatingAvatar(false);

      event.target.value = '';
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
      {}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl shadow-xl text-white font-semibold text-sm transition-all ${toast.ok ? 'bg-[#075c09]' : 'bg-[#e74c3c]'}`}>
          {toast.msg}
        </div>
      )}

      {}
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

      {}
      <main className="flex-1 p-5 pb-24 overflow-y-auto">
        <div className="flex flex-col items-center my-8 relative">
          {}
          <div className="w-32 h-32 rounded-full bg-[#075c09]/10 flex items-center justify-center border-4 border-[#075c09] text-6xl overflow-hidden relative">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>👤</span>
            )}
            {updatingAvatar && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
              </div>
            )}
          </div>
          {}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={updatingAvatar}
            className="absolute bottom-0 right-[30%] w-10 h-10 bg-[#075c09] rounded-full flex items-center justify-center border-2 border-[#FFF8F0] text-lg shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
            title="Thay đổi ảnh đại diện"
          >
            ✏️
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleAvatarChange}
          />
        </div>

        {}
        <div className="space-y-5">
          {}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#075c09] block uppercase tracking-wider">Tên</label>
            {editMode ? (
              <input
                className="w-full bg-white border-2 border-[#075c09] rounded-lg px-4 py-3 text-gray-800 font-medium shadow-sm focus:outline-none"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                disabled={saving}
              />
            ) : (
              <div className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-800 font-medium shadow-sm">
                {user?.full_name || 'N/A'}
              </div>
            )}
          </div>

          {}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#075c09] block uppercase tracking-wider">Địa chỉ email</label>
            <div className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-500 font-medium shadow-sm">
              {user?.email || 'N/A'}
            </div>
          </div>

          {}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#075c09] block uppercase tracking-wider">Số điện thoại</label>
            {editMode ? (
              <input
                className="w-full bg-white border-2 border-[#075c09] rounded-lg px-4 py-3 text-gray-800 font-medium shadow-sm focus:outline-none"
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                type="tel"
                placeholder="Nhập số điện thoại"
                disabled={saving}
              />
            ) : (
              <div className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-800 font-medium shadow-sm">
                {user?.phone_number || 'Chưa cập nhật'}
              </div>
            )}
          </div>

          {}
          <div className="pt-6 space-y-3">
            {editMode ? (
              <>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full py-4 bg-[#075c09] text-white font-bold rounded-lg shadow-md hover:bg-[#064a08] active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  disabled={saving}
                  className="w-full py-4 bg-white text-gray-600 font-bold rounded-lg border-2 border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all"
                >
                  Hủy
                </button>
              </>
            ) : (
              <button
                onClick={handleStartEdit}
                className="w-full py-4 bg-[#075c09] text-white font-bold rounded-lg shadow-md hover:bg-[#064a08] active:scale-[0.98] transition-all"
              >
                Chỉnh sửa hồ sơ
              </button>
            )}

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

            {}
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
