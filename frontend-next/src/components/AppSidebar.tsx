"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { listAccounts } from '../api/accountsApi';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart2,
  Tag,
  Target,
  RefreshCw,
  Bot,
  Bell,
  User,
  LogOut,
  Wallet,
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Trang chủ', path: '/home' },
  { icon: ArrowLeftRight, label: 'Giao dịch', path: '/transactions' },
  { icon: BarChart2, label: 'Biểu đồ', path: '/chart' },
  { icon: Tag, label: 'Danh mục', path: '/categories' },
  { icon: Target, label: 'Mục tiêu tiết kiệm', path: '/savings-goals' },
  { icon: RefreshCw, label: 'Giao dịch định kỳ', path: '/recurring' },
  { icon: Bot, label: 'Trợ lý AI', path: '/chat' },
  { icon: Bell, label: 'Nhắc nhở', path: '/notifications' },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { state, signOut } = useAuth();
  const user = state.user;
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    listAccounts()
      .then((accounts) => {
        const total = (accounts || []).reduce(
          (sum: number, acc: any) => sum + parseFloat(acc.current_balance || 0),
          0
        );
        setBalance(total);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/auth/login';
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#075c09] h-full flex-shrink-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">Singitronic</h1>
            <p className="text-white/50 text-[11px]">Finance Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path !== '/home' && pathname.startsWith(item.path + '/'));
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon
                className={`w-4.5 h-4.5 flex-shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'
                }`}
                size={18}
              />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile + Logout */}
      <div className="border-t border-white/10 p-3 space-y-1">
        <Link
          href="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-xs truncate">
              {user?.full_name || 'Người dùng'}
            </p>
            <p className="text-white/50 text-[11px] truncate">
              {balance !== null
                ? `${balance.toLocaleString('vi-VN')} đ`
                : 'Đang tải...'}
            </p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white text-sm transition-colors"
        >
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
