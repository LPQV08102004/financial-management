"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  listTemplates, 
  deleteTemplate, 
  processAllDue, 
  getUpcoming
} from '../api/recurringApi';
import { 
  RecurringTemplate,
  UpcomingOccurrence,
  UpcomingListResponse,
} from '../types/recurring';

const TABS = [
  { key: 'templates', label: 'Giao dịch định kỳ' },
  { key: 'upcoming',  label: 'Sắp tới (30 ngày)' },
];

const TYPE_COLOR: Record<string, string> = { income: '#075c09', expense: '#CC3300' };
const TYPE_LABEL: Record<string, string> = { income: 'Thu nhập', expense: 'Chi tiêu' };

const _fmtVND = (n: number) => Number(n).toLocaleString('vi-VN') + ' đ';

const _fmtDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = String(dateStr).split('-');
  return `${d}/${m}/${y}`;
};

// Component thẻ giao dịch định kỳ (Template)
function TemplateCard({ 
  item, 
  onEdit,
  onDelete, 
  onGenerate 
}: { 
  item: RecurringTemplate; 
  onEdit: (i: RecurringTemplate) => void;
  onDelete: (i: RecurringTemplate) => void; 
  onGenerate: (i: RecurringTemplate) => void;
}) {
  const color = TYPE_COLOR[item.type] || '#333';
  return (
    <div className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-50">
      <div className="flex items-center gap-2 mb-2">
        <span 
          className="text-[10px] font-bold text-white px-2 py-0.5 rounded-md uppercase"
          style={{ backgroundColor: color }}
        >
          {TYPE_LABEL[item.type]}
        </span>
        <h3 className="font-bold text-gray-800 flex-1 truncate">{item.name}</h3>
        <button onClick={() => onEdit(item)} className="text-gray-400 hover:text-[#075c09] text-sm px-1">✏️</button>
        <button onClick={() => onDelete(item)} className="text-gray-400 hover:text-red-500 text-sm px-1">🗑</button>
      </div>

      <div className="text-lg font-black mb-2" style={{ color }}>{_fmtVND(item.amount)}</div>

      <div className="space-y-1 mb-3">
        <p className="text-xs text-gray-500">🔁 {item.frequency_label}</p>
        <p className="text-xs text-gray-500 font-semibold">📅 Tiếp theo: {_fmtDate(item.next_run_date)}</p>
        {item.account_name && <p className="text-xs text-gray-400">🏦 {item.account_name}</p>}
        {item.category_name && <p className="text-xs text-gray-400">📂 {item.category_name}</p>}
        {item.end_date && <p className="text-xs text-gray-400">⏳ Hết hạn: {_fmtDate(item.end_date)}</p>}
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

// Component thẻ giao dịch sắp tới (Upcoming)
function UpcomingCard({ item }: { item: UpcomingOccurrence }) {
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
  const [upcoming, setUpcoming] = useState<{ items: UpcomingOccurrence[], total_expense: number, total_income: number } | null>(null);
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
      setTemplates(Array.isArray(tmpls) ? tmpls : []);
      setUpcoming({
        items: Array.isArray(upcomingData?.items) ? upcomingData.items : [],
        total_expense: upcomingData?.total_expense ?? 0,
        total_income: upcomingData?.total_income ?? 0,
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

  const handleEdit = (item: RecurringTemplate) => {
    sessionStorage.setItem('edit_recurring', JSON.stringify(item));
    router.push(`/add-recurring?id=${item.id}`);
  };

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
      {/* Header */}
      <header className="bg-[#075c09] text-white px-5 py-4 flex items-center gap-3 shadow-sm sticky top-0 z-30">
        <button
          onClick={() => window.history.back()}
          className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors text-xl"
        >
          ←
        </button>
        <h1 className="text-lg font-bold flex-1">Giao dịch định kỳ</h1>
        {activeTab === 'templates' && (
          <button
            onClick={() => router.push('/add-recurring')}
            className="w-9 h-9 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-xl"
          >
            +
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex bg-white border-b shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3.5 text-sm font-bold transition-all border-b-2 ${
              activeTab === tab.key
                ? 'border-[#075c09] text-[#075c09]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
            {tab.key === 'templates' && templates.length > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.key ? 'bg-[#075c09] text-white' : 'bg-slate-100 text-slate-500'
              }`}>{templates.length}</span>
            )}
            {tab.key === 'upcoming' && upcoming?.items?.length ? (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.key ? 'bg-[#075c09] text-white' : 'bg-slate-100 text-slate-500'
              }`}>{upcoming.items.length}</span>
            ) : null}
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
                onEdit={handleEdit}
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
                <UpcomingCard key={`${item.template_id}-${idx}`} item={item} />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
