"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SidebarDrawer from '../components/SidebarDrawer';
import HeaderIconButton from '../components/HeaderIconButton';
import DateTimeSelector from '../components/DateTimeSelector';
import { getBalance, getStatsByCategory } from '../api/analyticsApi';
import { listTransactions } from '../api/transactionApi';
import type { AnalyticsPeriod } from '../types/analytics';

const toDateStr = (d: Date | null) => {
  if (!d) return undefined;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatCompactVND = (num: number | string): string => {
  const n = Number(num);
  if (n >= 1_000_000_000) {
    const result = (n / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 3 });
    return result.replace(/,/g, '.') + 'B';
  }
  if (n >= 1_000_000) {
    const result = (n / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 3 });
    return result.replace(/,/g, '.') + 'M';
  }
  if (n >= 1_000) {
    const result = (n / 1_000).toLocaleString('vi-VN', { maximumFractionDigits: 3 });
    return result.replace(/,/g, '.') + 'K';
  }
  return n.toLocaleString('vi-VN');
};

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [timePeriod, setTimePeriod] = useState<AnalyticsPeriod>('day');
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

  const getPeriodParams = useCallback(() => {
    if (timePeriod === 'custom') {
      return { period: timePeriod, from_date: toDateStr(confirmedStartDate), to_date: toDateStr(confirmedEndDate) };
    }
    return { period: timePeriod, date: toDateStr(selectedDate) };
  }, [timePeriod, selectedDate, confirmedStartDate, confirmedEndDate]);

  const getTransactionDateParams = useCallback(() => {
    const params: any = { type: activeTab, limit: 10 };
    if (timePeriod === 'day') {
      params.from_date = toDateStr(selectedDate) + 'T00:00:00';
      params.to_date = toDateStr(selectedDate) + 'T23:59:59';
    }
    // ... các logic thời gian khác tương tự bản mobile
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
    if (txnsRes.status === 'fulfilled') setRecentTransactions(txnsRes.value.items);
  }, [getPeriodParams, getTransactionDateParams, activeTab]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const CIRCUMFERENCE = 628.31;
  let pieOffset = 0;

  return (
    <div className="bg-[#f8f9fa] flex flex-col relative">
      <SidebarDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="bg-[#075c09] p-6 pt-10 text-white rounded-b-[32px] shadow-lg">
        <div className="flex justify-between items-start">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-lg">
            <div className="w-6 h-0.5 bg-white mb-1.5"></div>
            <div className="w-6 h-0.5 bg-white mb-1.5"></div>
            <div className="w-4 h-0.5 bg-white"></div>
          </button>
          <div className="text-center">
            <p className="text-xs opacity-80 uppercase tracking-widest mb-1">Tổng số dư</p>
            <h1 className="text-3xl font-black">
              {totalBalance ? formatCompactVND(totalBalance.balance) : '0'} <span className="text-sm font-normal">đ</span>
            </h1>
          </div>
          <HeaderIconButton icon="📋" onPress={() => router.push('/transactions')} />
        </div>
      </div>

      <div className="flex bg-white mt-4 mx-4 rounded-2xl p-1 shadow-sm border border-gray-100">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === t ? 'bg-[#075c09] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t === 'expense' ? 'CHI PHÍ' : 'THU NHẬP'}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4">
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

      {/* Chart Section[cite: 5] */}
      <div className="bg-white m-4 rounded-3xl p-6 shadow-sm border border-gray-50 flex flex-col items-center relative">
        <svg width="220" height="220" viewBox="0 0 320 320" className="transform -rotate-90 transition-transform duration-700">
          {categoryStats.length > 0 ? (
            categoryStats.map((item, i) => {
              const arcLen = (Number(item.percentage) / 100) * CIRCUMFERENCE;
              const currentOffset = pieOffset;
              pieOffset += arcLen;
              return (
                <circle
                  key={i} cx="160" cy="160" r="100" fill="none"
                  stroke={item.color || '#999'} strokeWidth="35"
                  strokeDasharray={`${arcLen} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-currentOffset}
                  className="transition-all duration-1000 ease-out"
                />
              );
            })
          ) : (
            <circle cx="160" cy="160" r="100" stroke="#f3f4f6" strokeWidth="35" fill="none" />
          )}
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-2xl font-black text-[#075c09]">
            {balance ? (activeTab === 'expense' ? formatCompactVND(balance.total_expense) : formatCompactVND(balance.total_income)) : '0'}
          </p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Tổng {activeTab === 'expense' ? 'chi' : 'thu'}</p>
        </div>
      </div>

      {/* Recent Transactions[cite: 5] */}
      <div className="px-6 mb-4 flex justify-between items-center">
        <h3 className="font-black text-gray-800">Giao dịch gần đây</h3>
        <Link href="/transactions" className="text-xs font-bold text-[#075c09] bg-[#075c09]/10 px-3 py-1 rounded-full">Xem hết</Link>
      </div>

      <div className="px-4 space-y-3">
        {recentTransactions.map((txn) => (
          <div key={txn.id} className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg">
                {txn.type === 'income' ? '💰' : '💸'}
              </div>
              <div>
                <p className="font-bold text-sm text-gray-800">{txn.category_name || 'Khác'}</p>
                <p className="text-[10px] text-gray-400 font-medium">{new Date(txn.transaction_date).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
            <span className={`font-black text-sm ${txn.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
              {txn.type === 'income' ? '+' : '-'}{formatCompactVND(txn.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
