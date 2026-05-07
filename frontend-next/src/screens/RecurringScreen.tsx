"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  listTemplates, 
  deleteTemplate, 
  processAllDue, 
  getUpcoming
} from '../api/recurringApi';

// Kiểu dữ liệu cho giao dịch định kỳ
interface RecurringTemplate {
  id: number;
  name: string;
  type: 'income' | 'expense';
  amount: number;
  frequency_label: string;
  next_run_date: string;
  account_name?: string;
  category_name?: string;
  end_date?: string;
  note?: string;
}

interface UpcomingItem extends RecurringTemplate {
  scheduled_date: string;
}

const TABS = [
  { key: 'templates', label: 'Giao dịch định kỳ' },
  { key: 'upcoming',  label: 'Sắp tới (30 ngày)' },
];

const TYPE_COLOR = { income: '#075c09', expense: '#CC3300' };
const TYPE_LABEL = { income: 'Thu nhập', expense: 'Chi tiêu' };

const _fmtVND = (n: number) => Number(n).toLocaleString('vi-VN') + ' đ';

const _fmtDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = String(dateStr).split('-');
  return `${d}/${m}/${y}`;
};

// Component thẻ giao dịch định kỳ (Template)
function TemplateCard({ 
  item, 
  onDelete, 
  onGenerate 
}: { 
  item: RecurringTemplate; 
  onDelete: (i: RecurringTemplate) => void; 
  onGenerate: (i: RecurringTemplate) => void;
}) {
  const color = TYPE_COLOR[item.type] || '#333';
  return (
    <div className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-50 active:scale-[0.99] transition-transform">
      <div className="flex items-center gap-2 mb-2">
        <span 
          className="text-[10px] font-bold text-white px-2 py-0.5 rounded-md uppercase"
          style={{ backgroundColor: color }}
        >
          {TYPE_LABEL[item.type]}
        </span>
        <h3 className="font-bold text-gray-800 flex-1 truncate">{item.name}</h3>
        <button onClick={() => onDelete(item)} className="text-gray-400 hover:text-red-500">🗑</button>
      </div>

      <div className="text-lg font-black mb-2" style={{ color }}>{_fmtVND(item.amount)}</div>

      <div className="space-y-1 mb-3">
        <p className="text-xs text-gray-500 flex items-center gap-1">🔁 {item.frequency_label}</p>
        <p className="text-xs text-gray-500 flex items-center gap-1 font-semibold">📅 Tiếp theo: {_fmtDate(item.next_run_date)}</p>
        {item.account_name && <p className="text-xs text-gray-400">🏦 {item.account_name}</p>}
        {item.category_name && <p className="text-xs text-gray-400">📂 {item.category_name}</p>}
        {item.note && <p className="text-xs text-gray-400 italic">💬 {item.note}</p>}
      </div>

      <button 
        onClick={() => onGenerate(item)}
        className="w-full py-2 rounded-lg border border-[#075c09] text-[#075c09] text-xs font-bold bg-[#f0f8f0] hover:bg-[#075c09] hover:text-white transition-colors"
      >
        Tạo giao dịch ngay
      </button>
    </div>
  );
}

// Component thẻ giao dịch sắp tới (Upcoming)[cite: 8]
function UpcomingCard({ item }: { item: UpcomingItem }) {
  const color = TYPE_COLOR[item.type] || '#333';
  return (
    <div className="bg-white rounded-xl p-4 mb-3 shadow-sm border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-gray-800">{item.name}</h3>
          <p className="text-[11px] font-bold text-gray-800 mt-1">📅 {_fmtDate(item.scheduled_date)}</p>
        </div>
        <div className="text-right">
          <p className="font-black text-sm" style={{ color }}>{_fmtVND(item.amount)}</p>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
            {item.frequency_label}
          </span>
        </div>
      </div>
      <div className="flex gap-3 mt-1">
        {item.account_name && <span className="text-[10px] text-gray-400">🏦 {item.account_name}</span>}
        {item.category_name && <span className="text-[10px] text-gray-400">📂 {item.category_name}</span>}
      </div>
    </div>
  );
}

export default function RecurringScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('templates');
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [upcoming, setUpcoming] = useState<{ items: UpcomingItem[], total_expense: number, total_income: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Tự động xử lý các giao dịch quá hạn trong im lặng[cite: 8]
      processAllDue().catch(() => {});
      const [tmpls, upcomingData] = await Promise.all([
        listTemplates(),
        getUpcoming(30),
      ]);
      setTemplates((tmpls as any) || []);
      setUpcoming({
        items: (upcomingData as any) || [],
        total_expense: 0,
        total_income: 0,
      });
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (item: RecurringTemplate) => {
    if (confirm(`Bạn có chắc muốn dừng "${item.name}"? Giao dịch đã tạo sẽ không bị xóa.`)) {
      try {
        await deleteTemplate(item.id);
        fetchData(true);
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const handleGenerate = async (item: RecurringTemplate) => {
    try {
      const result = await processAllDue();
      alert('Đã xử lý ' + result.generated_count + ' giao dịch');
      fetchData(true);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 relative">
      {/* Header[cite: 8] */}
      <div className="bg-[#075c09] text-white pt-12 pb-4 px-4 flex items-center gap-4">
        <button onClick={() => window.history.back()} className="text-2xl">←</button>
        <h1 className="text-lg font-bold flex-1">Giao dịch định kỳ</h1>
        {activeTab === 'templates' && (
          <button
            onClick={() => router.push('/add-recurring')}
            className="w-9 h-9 flex items-center justify-center bg-white/20 rounded-full text-2xl font-light">+</button>
        )}
      </div>

      {/* Tabs[cite: 8] */}
      <div className="flex bg-white border-b sticky top-0 z-10 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-4 text-[11px] font-black tracking-tight transition-all border-b-4 ${
              activeTab === tab.key ? 'border-[#075c09] text-[#075c09]' : 'border-transparent text-gray-400'
            }`}
          >
            {tab.label.toUpperCase()}
            {tab.key === 'templates' && templates.length > 0 ? ` (${templates.length})` : ''}
            {tab.key === 'upcoming' && upcoming && upcoming.items && upcoming.items.length > 0 ? ` (${upcoming.items.length})` : ''}
          </button>
        ))}
      </div>

      <div className="flex-1 p-3 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center mt-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#075c09]"></div>
          </div>
        ) : activeTab === 'templates' ? (
          /* Danh sách Templates[cite: 8] */
          templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-5xl mb-4 opacity-50">🔁</span>
              <p className="text-sm text-center">Chưa có giao dịch định kỳ nào<br/>Nhấn + để tạo mới</p>
            </div>
          ) : (
            templates.map(item => (
              <TemplateCard 
                key={item.id} 
                item={item} 
                onDelete={handleDelete} 
                onGenerate={handleGenerate} 
              />
            ))
          )
        ) : (
          /* Danh sách Upcoming[cite: 8] */
          <>
            {upcoming && upcoming.items.length > 0 && (
              <div className="flex gap-2 mb-4">
                <div className="flex-1 bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                  <p className="text-[10px] text-green-600 font-bold uppercase mb-1">Thu dự kiến</p>
                  <p className="text-sm font-black text-green-800">{_fmtVND(upcoming.total_income)}</p>
                </div>
                <div className="flex-1 bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                  <p className="text-[10px] text-red-600 font-bold uppercase mb-1">Chi dự kiến</p>
                  <p className="text-sm font-black text-red-800">{_fmtVND(upcoming.total_expense)}</p>
                </div>
              </div>
            )}
            
            {(!upcoming || upcoming.items.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <span className="text-5xl mb-4 opacity-50">📅</span>
                <p className="text-sm text-center">Không có giao dịch nào trong 30 ngày tới</p>
              </div>
            ) : (
              upcoming.items.map((item, idx) => (
                <UpcomingCard key={`${item.id}-${idx}`} item={item} />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
