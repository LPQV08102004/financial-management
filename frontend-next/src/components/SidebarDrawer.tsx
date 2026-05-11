"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { listAccounts } from '../api/accountsApi';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SidebarDrawer({ isOpen, onClose }: SidebarDrawerProps) {
  const { state, signOut } = useAuth();
  const pathname = usePathname();
  const user = state.user;

  const displayName = user?.full_name || 'Người dùng';

  const [totalBalance, setTotalBalance] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      listAccounts()
        .then((accounts) => {
          const total = (accounts || []).reduce(
            (sum: number, acc: any) => sum + parseFloat(acc.current_balance || 0),
            0
          );
          setTotalBalance(total);
        })
        .catch(() => setTotalBalance(null));
    }
  }, [isOpen]);

  const menuItems = [
    { name: '🏠 Trang chủ', path: '/home' },
    { name: '� Giao dịch', path: '/transactions' },
    { name: '📊 Biểu đồ', path: '/chart' },
    { name: '📑 Danh mục', path: '/categories' },
    { name: '🎯 Mục tiêu tiết kiệm', path: '/savings-goals' },
    { name: '🔁 Giao dịch định kỳ', path: '/recurring' },
    { name: '🤖 Trợ lý AI', path: '/chat' },
    { name: '🔔 Nhắc nhở', path: '/notifications' },
  ];

  return (
    <>
      {}
      <div
        className={`fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-[280px] bg-[#216b38] z-[70] transition-transform duration-300 ease-in-out shadow-2xl overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {}
        <Link
          href="/profile"
          onClick={onClose}
          className="flex items-center p-6 mb-4 border-b border-white/30 hover:bg-white/5 transition-colors"
        >
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mr-4 text-3xl overflow-hidden shrink-0">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>👤</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold truncate text-lg">
              {displayName}
            </h3>
            <p className="text-white/80 font-semibold text-sm">
              {totalBalance === null
                ? 'Đang tải...'
                : `Số dư: ${totalBalance.toLocaleString('vi-VN')} đ`}
            </p>
          </div>
        </Link>

        {}
        <nav className="flex flex-col px-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={onClose}
                className={`py-4 px-4 rounded-xl text-lg font-medium transition-all ${
                  isActive
                    ? 'bg-white/15 text-white shadow-inner'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {}
        <div className="px-4 mt-8 mb-4">
          <button
            onClick={async () => {
              if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                await signOut();
              }
            }}
            className="w-full py-3 px-4 rounded-xl text-lg font-medium text-[#ffcccc] hover:bg-white/10 hover:text-white flex items-center transition-all"
          >
            🚪 Đăng xuất
          </button>
        </div>
        <div className="mt-auto p-8 opacity-50 text-white text-xs">
          © 2026 Singitronic Agentic AI
        </div>
      </aside>
    </>
  );
}