"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '../components/Footer';
import { listGoals, deleteGoal } from '../api/savingsApi';

// Khai báo kiểu dữ liệu cho Goal
interface Goal {
  id: number;
  name: string;
  status: 'in_progress' | 'completed' | 'overdue';
  progress_pct: number;
  saved_amount: number;
  target_amount: number;
  deadline: string;
  months_remaining: number;
  amount_remaining: number;
  monthly_needed: number;
}

const STATUS_TABS = [
  { key: 'in_progress', label: 'Đang thực hiện' },
  { key: 'completed',   label: 'Hoàn thành' },
  { key: 'overdue',     label: 'Quá hạn' },
];

const STATUS_COLOR: Record<string, string> = {
  in_progress: '#075c09',
  completed:   '#0066CC',
  overdue:     '#CC3300',
};

const _fmtVND = (n: number) => Number(n).toLocaleString('vi-VN') + ' đ';

const _fmtDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

// Component thanh tiến trình
function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 w-full bg-gray-100 rounded-full mb-2 overflow-hidden">
      <div 
        className="h-full rounded-full transition-all duration-500" 
        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

function GoalCard({ goal, onDelete, onPress }: { goal: Goal; onDelete: (g: Goal) => void; onPress: () => void }) {
  const color = STATUS_COLOR[goal.status] || '#075c09';

  return (
    <div
      onClick={onPress}
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-slate-800 truncate pr-3 text-sm">{goal.name}</h3>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(goal); }}
          className="text-slate-300 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50 flex-shrink-0"
        >
          🗑
        </button>
      </div>

      <ProgressBar pct={goal.progress_pct} color={color} />

      <div className="flex items-baseline justify-between mb-3">
        <div>
          <span className="font-bold text-slate-800 text-sm">{_fmtVND(goal.saved_amount)}</span>
          <span className="text-slate-400 text-xs ml-1">/ {_fmtVND(goal.target_amount)}</span>
        </div>
        <span className="font-black text-sm" style={{ color }}>
          {goal.progress_pct.toFixed(0)}%
        </span>
      </div>

      <div className="space-y-1 pt-2 border-t border-slate-50">
        <p className="text-xs text-slate-400">
          Hạn: {_fmtDate(goal.deadline)}
          {goal.months_remaining > 0 && (
            <span className="ml-2 text-slate-500">· còn {goal.months_remaining} tháng</span>
          )}
        </p>
        {goal.status === 'in_progress' && goal.amount_remaining > 0 && (
          <p className="text-xs text-red-500 font-medium">Còn thiếu {_fmtVND(goal.amount_remaining)}</p>
        )}
        {goal.status === 'in_progress' && goal.monthly_needed > 0 && (
          <p className="text-xs text-[#075c09] font-semibold">
            Cần để dành {_fmtVND(goal.monthly_needed)}/tháng
          </p>
        )}
        {goal.status === 'completed' && (
          <span className="inline-block px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full">
            Hoàn thành ✓
          </span>
        )}
        {goal.status === 'overdue' && (
          <span className="inline-block px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
            Quá hạn
          </span>
        )}
      </div>
    </div>
  );
}

export default function SavingsGoalsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('in_progress');
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [totalLocked, setTotalLocked] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await listGoals();
      setAllGoals((data.items as any) || []);
      setTotalLocked(data.total_locked || 0);
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleDelete = async (goal: Goal) => {
    if (confirm(`Bạn có chắc muốn xóa mục tiêu "${goal.name}"?`)) {
      try {
        await deleteGoal(goal.id);
        fetchGoals(true);
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const filtered = allGoals.filter((g) => g.status === activeTab);

  return (
    <div className="flex flex-col bg-gray-50 relative">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#075c09] to-[#054d07] text-white px-5 pt-5 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors text-xl"
            onClick={() => window.history.back()}
          >
            ←
          </button>
          <h1 className="text-lg font-bold">Mục tiêu tiết kiệm</h1>
          <button
            onClick={() => router.push('/add-savings-goal')}
            className="w-9 h-9 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl text-xl font-light transition-colors"
          >
            +
          </button>
        </div>
        <div className="text-center">
          <p className="text-white/60 text-xs uppercase tracking-wider font-medium">Tổng tiền đang tích lũy</p>
          <p className="text-3xl font-black mt-1 tracking-tight">{_fmtVND(totalLocked)}</p>
          <p className="text-white/50 text-[11px] mt-1">
            {allGoals.filter(g => g.status === 'in_progress').length} mục tiêu đang thực hiện
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b sticky top-0 z-10 shadow-sm">
        {STATUS_TABS.map((tab) => {
          const count = allGoals.filter((g) => g.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3.5 text-xs font-bold tracking-wide transition-all border-b-2 ${
                activeTab === tab.key
                  ? 'border-[#075c09] text-[#075c09]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.key
                    ? 'bg-[#075c09] text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex justify-center mt-16">
            <div className="w-8 h-8 border-2 border-[#075c09] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <span className="text-5xl mb-4 opacity-40">🎯</span>
            <p className="text-sm text-center font-medium">
              {activeTab === 'in_progress'
                ? 'Chưa có mục tiêu nào — nhấn + để tạo mới'
                : activeTab === 'completed'
                ? 'Chưa có mục tiêu nào hoàn thành'
                : 'Không có mục tiêu quá hạn'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <GoalCard
                key={item.id}
                goal={item}
                onDelete={handleDelete}
                onPress={() => router.push(`/add-savings-goal?goalId=${item.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
