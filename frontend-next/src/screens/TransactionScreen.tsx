"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import SidebarDrawer from '../components/SidebarDrawer';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DateTimeSelector from '../components/DateTimeSelector';
import { listTransactions, updateTransaction } from '../api/transactionApi';
import { listCategories } from '../api/categoriesApi';

// Helper functions
const _toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const _formatVND = (n: number) => Number(n).toLocaleString('vi-VN');

const _dateToInput = (dt: string | Date) => {
  const d = new Date(dt);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const _inputToISO = (str: string) => {
  const [day, month, year] = str.split('/');
  if (!day || !month || !year) return null;
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  if (isNaN(d.getTime())) return null;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00`;
};

interface TransactionItem {
  id: number | string;
  amount: number;
  note?: string;
  transaction_date: string;
  type: 'expense' | 'income' | 'transfer';
  category_id?: number | string;
  category_name?: string;
  reconcile_status?: 'reconciled' | 'pending';
}

export default function TransactionScreen() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [timePeriod, setTimePeriod] = useState<'day' | 'month' | 'year' | 'week' | 'custom'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [confirmedStartDate, setConfirmedStartDate] = useState<Date | null>(null);
  const [confirmedEndDate, setConfirmedEndDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [selectingStartDate, setSelectingStartDate] = useState(true);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  
  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterCategories, setFilterCategories] = useState<any[]>([]);
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null);
  const [filterCategoryName, setFilterCategoryName] = useState('');

  // Results state
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Edit Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTxn, setEditingTxn] = useState<TransactionItem | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [editCategories, setEditCategories] = useState<any[]>([]);

  // Search Debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(text), 400);
  };

  const fetchTransactions = useCallback(async () => {
    const params: any = { type: activeTab, limit: 100 };
    // Logic xử lý timePeriod tương tự code gốc...
    if (timePeriod === 'day') {
        params.from_date = _toDateStr(selectedDate) + 'T00:00:00';
        params.to_date = _toDateStr(selectedDate) + 'T23:59:59';
    }

    if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
    if (filterCategoryId) params.category_id = filterCategoryId;

    try {
      setLoading(true);
      const data = await listTransactions(params);
      setTransactions(data.items ?? []);
      setTotalCount(data.total_count ?? 0);
      setTotalAmount(data.total_amount ?? 0);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, timePeriod, selectedDate, debouncedQuery, filterCategoryId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const openEditModal = async (item: TransactionItem) => {
    if (item.reconcile_status === 'reconciled') {
      alert('Giao dịch đã đối soát không thể chỉnh sửa.');
      return;
    }
    setEditingTxn(item);
    setEditAmount(String(item.amount));
    setEditNote(item.note || '');
    setEditDate(_dateToInput(item.transaction_date));
    setEditCategoryId(typeof item.category_id === 'string' ? parseInt(item.category_id) : (item.category_id ?? null));
    setEditCategoryName(item.category_name || '');
    
    if (item.type !== 'transfer') {
      const cats = await listCategories(item.type);
      setEditCategories(cats);
    }
    setShowEditModal(true);
  };

  return (
    <div className="flex flex-col bg-gray-50 relative font-sans">
      {/* Header */}
      <header className="bg-[#075c09] p-5 pt-8 flex items-center justify-between text-white sticky top-0 z-40">
        <button onClick={() => setSidebarOpen(true)} className="flex flex-col gap-1.5 p-2">
          <div className="w-6 h-0.5 bg-white rounded"></div>
          <div className="w-6 h-0.5 bg-white rounded"></div>
          <div className="w-6 h-0.5 bg-white rounded"></div>
        </button>
        <h1 className="text-xl font-bold">Lịch sử giao dịch</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowFilterModal(true)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${filterCategoryId ? 'bg-white/20' : ''}`}
          >
            {filterCategoryId ? '🔽' : '⚙️'}
          </button>
          <button className="text-xl" onClick={() => window.location.href = '/transactions/add'}>➕</button>
        </div>
      </header>

      <main className="p-4 pb-24 flex-1 overflow-y-auto">
        {/* Type Tabs */}
        <div className="flex bg-white rounded-lg border shadow-sm mb-4 overflow-hidden">
          {['expense', 'income'].map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type as any)}
              className={`flex-1 py-3 font-semibold transition-all border-b-4 ${activeTab === type ? 'border-[#075c09] bg-green-50 text-[#075c09]' : 'border-transparent text-gray-400'}`}
            >
              {type === 'expense' ? 'Chi phí' : 'Thu nhập'}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            className="w-full bg-white border border-gray-300 rounded-xl py-2.5 pl-10 pr-10 focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="Tìm theo ghi chú..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">✕</button>
          )}
        </div>

        {/* Date Time Selector */}
        <div className="mb-4">
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

        {/* Summary Bar */}
        <div className="flex justify-between items-center bg-white border rounded-lg p-3 mb-4 shadow-sm">
          <span className="text-sm text-gray-500 font-medium">{totalCount} giao dịch</span>
          <span className="text-base font-bold text-[#075c09]">
            {activeTab === 'income' ? '+' : '-'}{_formatVND(totalAmount)} đ
          </span>
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#075c09]"></div></div>
          ) : transactions.length > 0 ? (
            transactions.map((item) => (
              <div
                key={item.id}
                onClick={() => openEditModal(item)}
                className={`flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${item.reconcile_status === 'reconciled' ? 'border-gray-400 opacity-80' : 'border-[#075c09]'}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800">{item.category_name || 'Giao dịch'}</span>
                    {item.reconcile_status === 'reconciled' && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Đối soát</span>}
                  </div>
                  <div className="text-xs text-gray-400">{_dateToInput(item.transaction_date)}</div>
                  {item.note && <div className="text-xs text-gray-600 mt-1 italic">"{item.note}"</div>}
                </div>
                <div className={`font-bold ${item.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                  {item.type === 'income' ? '+' : '-'}{_formatVND(item.amount)} đ
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-gray-400 font-medium">Không có giao dịch</div>
          )}
        </div>
      </main>

      {/* Edit Modal Overlay */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h2 className="text-lg font-bold text-gray-800">Chỉnh sửa giao dịch</h2>
              <button onClick={() => setShowEditModal(false)} className="text-xl text-gray-400">✕</button>
            </div>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-bold text-[#075c09] block mb-1">SỐ TIỀN</label>
                <input 
                  className="w-full border rounded-lg p-3 outline-none focus:border-green-600" 
                  value={editAmount} 
                  onChange={(e) => setEditAmount(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#075c09] block mb-1">NGÀY (DD/MM/YYYY)</label>
                <input 
                  className="w-full border rounded-lg p-3 outline-none focus:border-green-600" 
                  value={editDate} 
                  onChange={(e) => setEditDate(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#075c09] block mb-1">GHI CHÚ</label>
                <textarea 
                  className="w-full border rounded-lg p-3 outline-none focus:border-green-600 min-h-[100px]" 
                  value={editNote} 
                  onChange={(e) => setEditNote(e.target.value)} 
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 bg-gray-100 font-bold rounded-xl text-gray-600"
                >Hủy</button>
                <button 
                  className="flex-1 py-3 bg-[#075c09] font-bold rounded-xl text-white shadow-lg shadow-green-900/20"
                >Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SidebarDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
}
