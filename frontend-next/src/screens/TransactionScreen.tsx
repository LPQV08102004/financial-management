"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SidebarDrawer from '../components/SidebarDrawer';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DateTimeSelector from '../components/DateTimeSelector';
import { listTransactions, updateTransaction } from '../api/transactionApi';
import { listCategories } from '../api/categoriesApi';

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
  const router = useRouter();
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

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterCategories, setFilterCategories] = useState<any[]>([]);
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null);
  const [filterCategoryName, setFilterCategoryName] = useState('');

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(text), 400);
  };

  const fetchTransactions = useCallback(async () => {
    const params: any = { type: activeTab, limit: 100 };

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
      {}
      <header className="bg-[#075c09] px-5 py-4 flex items-center justify-between text-white sticky top-0 z-40 shadow-sm">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden flex flex-col gap-1.5 p-2 hover:bg-white/10 rounded-xl transition-colors"
        >
          <div className="w-6 h-0.5 bg-white rounded" />
          <div className="w-6 h-0.5 bg-white rounded" />
          <div className="w-6 h-0.5 bg-white rounded" />
        </button>
        <h1 className="text-lg font-bold lg:ml-0">Lịch sử giao dịch</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilterModal(true)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10 ${filterCategoryId ? 'bg-white/20' : ''}`}
          >
            {filterCategoryId ? '🔽' : '⚙️'}
          </button>
          <button
            onClick={() => router.push('/add-transaction')}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-xl"
          >
            ➕
          </button>
        </div>
      </header>

      <main className="p-4 pb-8 max-w-4xl mx-auto">
        {}
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100 mb-4">
          {['expense', 'income'].map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type as any)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === type
                  ? 'bg-[#075c09] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {type === 'expense' ? 'Chi phí' : 'Thu nhập'}
            </button>
          ))}
        </div>

        {}
        <div className="relative mb-4">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-10 focus:ring-2 focus:ring-[#075c09]/20 focus:border-[#075c09] outline-none text-sm shadow-sm"
            placeholder="Tìm theo ghi chú..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {}
        <div className="mb-4 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
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
        <div className="flex justify-between items-center bg-white rounded-2xl px-5 py-3.5 mb-4 shadow-sm border border-slate-100">
          <span className="text-sm text-slate-500 font-medium">{totalCount} giao dịch</span>
          <span className={`text-base font-bold ${activeTab === 'income' ? 'text-green-600' : 'text-red-500'}`}>
            {activeTab === 'income' ? '+' : '-'}{_formatVND(totalAmount)} đ
          </span>
        </div>

        {}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#075c09] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {transactions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => openEditModal(item)}
                  className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                    item.reconcile_status === 'reconciled' ? 'opacity-70' : ''
                  }`}
                >
                  <div className={`w-1 h-10 rounded-full flex-shrink-0 ${
                    item.reconcile_status === 'reconciled' ? 'bg-slate-300' : 'bg-[#075c09]'
                  }`} />
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg flex-shrink-0">
                    {item.type === 'income' ? '💰' : item.type === 'transfer' ? '🔄' : '💸'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-800 truncate">
                        {item.category_name || 'Giao dịch'}
                      </span>
                      {item.reconcile_status === 'reconciled' && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                          Đối soát
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {_dateToInput(item.transaction_date)}
                      {item.note && <span className="ml-2 italic text-slate-500">· {item.note}</span>}
                    </div>
                  </div>
                  <span className={`font-bold text-sm flex-shrink-0 ${item.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {item.type === 'income' ? '+' : '-'}{_formatVND(item.amount)} đ
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-slate-400 text-sm font-medium">Không có giao dịch</p>
            </div>
          )}
        </div>
      </main>

      {}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-slate-800">Chỉnh sửa giao dịch</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[65vh] overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Số tiền</label>
                <input
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-[#075c09] focus:ring-2 focus:ring-[#075c09]/20 transition-colors"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Ngày (DD/MM/YYYY)</label>
                <input
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-[#075c09] focus:ring-2 focus:ring-[#075c09]/20 transition-colors"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Ghi chú</label>
                <textarea
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-[#075c09] focus:ring-2 focus:ring-[#075c09]/20 transition-colors min-h-[80px] resize-none"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 bg-slate-100 font-semibold rounded-xl text-slate-600 hover:bg-slate-200 transition-colors text-sm"
                >
                  Hủy
                </button>
                <button className="flex-1 py-3 bg-[#075c09] font-semibold rounded-xl text-white hover:bg-[#065308] transition-colors text-sm shadow-sm">
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SidebarDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
}
