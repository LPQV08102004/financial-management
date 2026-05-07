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

// Component thẻ mục tiêu[cite: 7]
function GoalCard({ goal, onDelete, onPress }: { goal: Goal; onDelete: (g: Goal) => void; onPress: () => void }) {
  const color = STATUS_COLOR[goal.status] || '#075c09';
  
  return (
    <div onClick={onPress} className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-50 active:scale-[0.98] transition-transform cursor-pointer">
      <div className="flex justify-between items-center mb-2.5">
        <h3 className="font-bold text-gray-800 truncate pr-4">{goal.name}</h3>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(goal); }}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
        >
          🗑
        </button>
      </div>

      <ProgressBar pct={goal.progress_pct} color={color} />

      <div className="flex items-baseline mb-2">
        <span className="font-bold text-gray-800 text-sm">{_fmtVND(goal.saved_amount)}</span>
        <span className="text-gray-400 text-xs ml-1">/ {_fmtVND(goal.target_amount)}</span>
        <span className="ml-auto font-bold text-sm" style={{ color }}>
          {goal.progress_pct.toFixed(0)}%
        </span>
      </div>

      <div className="border-top border-gray-50 pt-2 space-y-1">
        <p className="text-[11px] text-gray-400">
          Hạn: {_fmtDate(goal.deadline)}
          {goal.months_remaining > 0 ? `  ·  còn ${goal.months_remaining} tháng` : ''}
        </p>
        
        {goal.status === 'in_progress' && goal.amount_remaining > 0 && (
          <p className="text-[11px] text-[#CC3300]">
            Còn thiếu {_fmtVND(goal.amount_remaining)}
          </p>
        )}
        
        {goal.status === 'in_progress' && goal.monthly_needed > 0 && (
          <p className="text-[11px] text-[#075c09] font-semibold">
            Cần để dành {_fmtVND(goal.monthly_needed)}/tháng
          </p>
        )}

        {goal.status === 'completed' && (
          <span className="inline-block px-2 py-0.5 bg-[#0066CC] text-white text-[10px] font-bold rounded-lg uppercase">
            Hoàn thành
          </span>
        )}

        {goal.status === 'overdue' && (
          <span className="inline-block px-2 py-0.5 bg-[#CC3300] text-white text-[10px] font-bold rounded-lg uppercase">
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
      {/* Header[cite: 7] */}
      <div className="bg-[#075c09] text-white pt-12 pb-4 px-4">
        <div className="flex items-center justify-between mb-6">
          <button className="text-2xl" onClick={() => window.history.back()}>←</button>
          <h1 className="text-lg font-bold">Mục tiêu tiết kiệm</h1>
          <button
            onClick={() => router.push('/add-savings-goal')}
            className="w-9 h-9 flex items-center justify-center bg-white/20 rounded-full text-2xl font-light">
            +
          </button>
        </div>
        
        {/* Summary[cite: 7] */}
        <div className="text-center pb-4">
          <p className="text-white/70 text-xs uppercase tracking-wider font-medium">Tổng tiền đang tích lũy</p>
          <p className="text-3xl font-black mt-1 tracking-tight">{_fmtVND(totalLocked)}</p>
          <p className="text-white/60 text-[10px] mt-1 font-medium italic">
            ({allGoals.filter(g => g.status === 'in_progress').length} mục tiêu đang thực hiện)
          </p>
        </div>
      </div>

      {/* Tabs[cite: 7] */}
      <div className="flex bg-white border-b sticky top-0 z-10 shadow-sm">
        {STATUS_TABS.map((tab) => {
          const count = allGoals.filter((g) => g.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-4 text-[11px] font-black tracking-tight transition-all border-b-4 ${
                activeTab === tab.key ? 'border-[#075c09] text-[#075c09]' : 'border-transparent text-gray-400'
              }`}
            >
              {tab.label.toUpperCase()} {count > 0 ? `(${count})` : ''}
            </button>
          );
        })}
      </div>

      {/* List Content[cite: 7] */}
      <div className="flex-1 p-3 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center mt-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#075c09]"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-4 opacity-50">🎯</span>
            <p className="text-sm text-center font-medium leading-relaxed">
              {activeTab === 'in_progress' ? 'Chưa có mục tiêu nào\nNhấn + để tạo mục tiêu mới' :
               activeTab === 'completed' ? 'Chưa có mục tiêu nào hoàn thành' :
               'Không có mục tiêu quá hạn'}
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <GoalCard
              key={item.id}
              goal={item}
              onDelete={handleDelete}
              onPress={() => router.push(`/add-savings-goal?goalId=${item.id}`)}
            />
          ))
        )}
      </div>

          </div>
  );
}
