"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SidebarDrawer from '../components/SidebarDrawer';
import DateTimeSelector from '../components/DateTimeSelector';
import { getBalance, getStatsByCategory } from '../api/analyticsApi';
import { listTransactions } from '../api/transactionApi';
import type { AnalyticsPeriod } from '../types/analytics';
import { Plus, List, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

const toDateStr = (d: Date | null) => {
  if (!d) return undefined;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatVND = (num: number | string): string => {
  return Number(num).toLocaleString('vi-VN') + ' đ';
};

const formatCompact = (num: number | string): string => {
  const n = Number(num);
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toLocaleString('vi-VN');
};

const PIE_R = 100;
const CIRCUMFERENCE = 2 * Math.PI * PIE_R;

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  valueColor,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  valueColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconColor + '18' }}
      >
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide truncate">
          {label}
        </p>
        <p className="font-bold text-sm truncate" style={{ color: valueColor }}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [timePeriod, setTimePeriod] = useState<AnalyticsPeriod>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [confirmedStartDate, setConfirmedStartDate] = useState<Date | null>(null);
  const [confirmedEndDate, setConfirmedEndDate] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [selectingStartDate, setSelectingStartDate] = useState(true);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  const [totalBalance, setTotalBalance] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getPeriodParams = useCallback(() => {
    if (timePeriod === 'custom') {
      return { period: timePeriod, from_date: toDateStr(confirmedStartDate), to_date: toDateStr(confirmedEndDate) };
    }
    return { period: timePeriod, date: toDateStr(selectedDate) };
  }, [timePeriod, selectedDate, confirmedStartDate, confirmedEndDate]);

  const getTransactionDateParams = useCallback(() => {
    const params: any = { type: activeTab, limit: 15 };
    if (timePeriod === 'day') {
      params.from_date = toDateStr(selectedDate) + 'T00:00:00';
      params.to_date = toDateStr(selectedDate) + 'T23:59:59';
    }
    return params;
  }, [activeTab, timePeriod, selectedDate]);

  const fetchAll = useCallback(async () => {
    const periodParams = getPeriodParams();
    const today = toDateStr(new Date());

    const [allTimeBalRes, balRes, statsRes, txnsRes] = await Promise.allSettled([
      getBalance({ period: 'custom', from_date: '2000-01-01', to_date: today }),
      getBalance(periodParams),
      getStatsByCategory({ ...periodParams, type: activeTab }),
      listTransactions(getTransactionDateParams()),
    ]);

    if (allTimeBalRes.status === 'fulfilled') setTotalBalance(allTimeBalRes.value);
    if (balRes.status === 'fulfilled') setBalance(balRes.value);
    if (statsRes.status === 'fulfilled') setCategoryStats(statsRes.value);
    if (txnsRes.status === 'fulfilled') setRecentTransactions(txnsRes.value.items ?? []);
  }, [getPeriodParams, getTransactionDateParams, activeTab]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  let pieOffset = 0;
  const hasData = categoryStats.length > 0;
  const totalAmount = balance
    ? Number(activeTab === 'expense' ? balance.total_expense : balance.total_income)
    : 0;

  return (
    <div className="min-h-screen bg-slate-100">
      <SidebarDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {}
      <div className="bg-gradient-to-br from-[#075c09] to-[#054d07] text-white">
        {}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            aria-label="Mở menu"
          >
            <div className="space-y-1.5">
              <div className="w-6 h-0.5 bg-white rounded" />
              <div className="w-6 h-0.5 bg-white rounded" />
              <div className="w-4 h-0.5 bg-white rounded" />
            </div>
          </button>
          <p className="text-white/70 text-sm font-medium">Tổng quan</p>
          <button
            onClick={() => router.push('/transactions')}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <List size={20} className="text-white" />
          </button>
        </div>

        {}
        <div className="hidden lg:block px-8 pt-8 pb-2">
          <p className="text-white/50 text-sm">{today}</p>
          <h1 className="text-2xl font-bold text-white mt-0.5">Tổng quan tài chính</h1>
        </div>

        {}
        <div className="px-5 pb-6 lg:px-8">
          {}
          <div className="text-center py-4 lg:hidden">
            <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Tổng số dư</p>
            <p className="text-4xl font-black tracking-tight">
              {totalBalance ? formatCompact(totalBalance.balance) : '0'}
              <span className="text-lg font-normal ml-1">đ</span>
            </p>
          </div>

          {}
          <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4 mt-4">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={14} className="text-white/60" />
                <p className="text-white/60 text-xs uppercase tracking-wide">Tổng số dư</p>
              </div>
              <p className="text-2xl font-black text-white">
                {totalBalance ? formatCompact(totalBalance.balance) : '0'} đ
              </p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-green-300" />
                <p className="text-green-300 text-xs uppercase tracking-wide">Thu nhập kỳ này</p>
              </div>
              <p className="text-2xl font-bold text-white">
                +{balance ? formatCompact(balance.total_income) : '0'} đ
              </p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown size={14} className="text-red-300" />
                <p className="text-red-300 text-xs uppercase tracking-wide">Chi tiêu kỳ này</p>
              </div>
              <p className="text-2xl font-bold text-white">
                -{balance ? formatCompact(balance.total_expense) : '0'} đ
              </p>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="p-4 lg:p-6 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6 lg:items-start">

        {}
        <div className="space-y-4">
          {}
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            <StatCard
              label="Thu nhập"
              value={balance ? '+' + formatCompact(balance.total_income) + ' đ' : '0 đ'}
              icon={TrendingUp}
              iconColor="#16a34a"
              valueColor="#16a34a"
            />
            <StatCard
              label="Chi tiêu"
              value={balance ? '-' + formatCompact(balance.total_expense) + ' đ' : '0 đ'}
              icon={TrendingDown}
              iconColor="#dc2626"
              valueColor="#dc2626"
            />
          </div>

          {}
          <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === t
                    ? 'bg-[#075c09] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {t === 'expense' ? 'Chi phí' : 'Thu nhập'}
              </button>
            ))}
          </div>

          {}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <DateTimeSelector
              timePeriod={timePeriod}
              selectedDate={selectedDate}
              setTimePeriod={setTimePeriod}
              setSelectedDate={setSelectedDate}
              setConfirmedStartDate={setConfirmedStartDate}
              setConfirmedEndDate={setConfirmedEndDate}
              showCalendar={showCalendar}
              setShowCalendar={setShowCalendar}
              currentCalendarMonth={currentCalendarMonth}
              setCurrentCalendarMonth={setCurrentCalendarMonth}
              selectingStartDate={selectingStartDate}
              setSelectingStartDate={setSelectingStartDate}
              customStartDate={customStartDate}
              setCustomStartDate={setCustomStartDate}
              customEndDate={customEndDate}
              setCustomEndDate={setCustomEndDate}
            />
          </div>

          {}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">
                {activeTab === 'expense' ? 'Phân bổ chi tiêu' : 'Nguồn thu nhập'}
              </h3>
              <span className="text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                Tổng: {formatCompact(totalAmount)} đ
              </span>
            </div>

            <div className="flex items-center gap-6">
              {}
              <div className="relative flex-shrink-0">
                <svg width="160" height="160" viewBox="0 0 320 320" className="-rotate-90">
                  {hasData ? (
                    categoryStats.map((item, i) => {
                      const arcLen = (Number(item.percentage) / 100) * CIRCUMFERENCE;
                      const currentOffset = pieOffset;
                      pieOffset += arcLen;
                      return (
                        <circle
                          key={i}
                          cx="160" cy="160" r={PIE_R}
                          fill="none"
                          stroke={item.color || '#94a3b8'}
                          strokeWidth="40"
                          strokeDasharray={`${arcLen} ${CIRCUMFERENCE}`}
                          strokeDashoffset={-currentOffset}
                          className="transition-all duration-700 ease-out"
                        />
                      );
                    })
                  ) : (
                    <circle cx="160" cy="160" r={PIE_R} stroke="#e2e8f0" strokeWidth="40" fill="none" />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[#075c09] font-black text-base">
                    {formatCompact(totalAmount)}
                  </p>
                  <p className="text-slate-400 text-[10px] uppercase tracking-tight">đ</p>
                </div>
              </div>

              {}
              <div className="flex-1 space-y-2 min-w-0">
                {hasData ? (
                  categoryStats.slice(0, 6).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color || '#94a3b8' }}
                      />
                      <span className="text-xs text-slate-600 truncate flex-1">{item.category}</span>
                      <span className="text-xs font-bold text-slate-700 flex-shrink-0">
                        {Number(item.percentage).toFixed(0)}%
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm text-center">Không có dữ liệu</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="mt-4 lg:mt-0 space-y-4">
          {}
          <button
            onClick={() => router.push('/add-transaction')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#075c09] text-white font-bold rounded-2xl shadow-sm hover:bg-[#065308] active:scale-[0.98] transition-all"
          >
            <Plus size={18} />
            Thêm giao dịch
          </button>

          {}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">Giao dịch gần đây</h3>
              <Link
                href="/transactions"
                className="text-xs font-semibold text-[#075c09] hover:underline"
              >
                Xem tất cả →
              </Link>
            </div>

            <div className="divide-y divide-slate-50">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => router.push('/transactions')}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-base flex-shrink-0">
                      {txn.type === 'income' ? '💰' : txn.type === 'transfer' ? '🔄' : '💸'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800 truncate">
                        {txn.category_name || 'Giao dịch'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(txn.transaction_date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <span
                      className={`font-bold text-sm flex-shrink-0 ${
                        txn.type === 'income' ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {txn.type === 'income' ? '+' : '-'}
                      {formatCompact(txn.amount)} đ
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-slate-400 text-sm">Chưa có giao dịch</p>
                  <button
                    onClick={() => router.push('/add-transaction')}
                    className="mt-3 text-xs font-semibold text-[#075c09] hover:underline"
                  >
                    Thêm giao dịch đầu tiên →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
