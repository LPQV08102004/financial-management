"use client";

import React, { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import { createTemplate, updateTemplate } from '../api/recurringApi';
import { listAccounts } from '../api/accountsApi';
import { listCategories } from '../api/categoriesApi';

// Các hằng số và hàm tiện ích giữ nguyên logic nhưng gán kiểu dữ liệu TypeScript
const FREQUENCIES = [
  { key: 'daily', label: 'Hàng ngày' },
  { key: 'weekly', label: 'Hàng tuần' },
  { key: 'monthly', label: 'Hàng tháng' },
  { key: 'yearly', label: 'Hàng năm' },
];

const TYPES = [
  { key: 'income', label: 'Thu nhập', color: '#075c09' },
  { key: 'expense', label: 'Chi tiêu', color: '#CC3300' },
];

const _parseDate = (str: string) => {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length !== 3 || parts[2].length !== 4) return null;
  const iso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  if (isNaN(Date.parse(iso))) return null;
  return iso;
};

const _isoToDisplay = (iso: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const _getCalendarDaysForMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
  return days;
};

// Component con phụ trợ (Sub-components)
const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
    <h3 className="text-xs font-bold text-[#075c09] uppercase tracking-wider mb-3">{title}</h3>
    {children}
  </div>
);

const Field = ({ label, required, children }: { label: string, required?: boolean, children: React.ReactNode }) => (
  <div className="mb-4">
    <label className="block text-sm text-gray-600 font-semibold mb-1.5">
      {label}{required && <span className="text-red-500"> *</span>}
    </label>
    {children}
  </div>
);

interface AddRecurringProps {
  existing?: any; // Kiểu dữ liệu tùy thuộc vào template của bạn
}

export default function AddRecurringScreen({ existing }: AddRecurringProps) {
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState(existing?.type ?? 'expense');
  const [amount, setAmount] = useState(existing ? Number(existing.amount).toLocaleString('vi-VN') : '');
  const [frequency, setFrequency] = useState(existing?.frequency ?? 'monthly');
  const [startDate, setStartDate] = useState(existing ? _isoToDisplay(existing.start_date) : '');
  const [endDate, setEndDate] = useState(existing?.end_date ? _isoToDisplay(existing.end_date) : '');
  const [note, setNote] = useState(existing?.note ?? '');

  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accs, cats] = await Promise.all([listAccounts(), listCategories(type)]);
        setAccounts(accs || []);
        setCategories(cats || []);
        if (existing) {
          setSelectedAccount(accs.find((a: any) => a.id === existing.account_id));
          setSelectedCategory(cats.find((c: any) => c.id === existing.category_id));
        }
      } catch (err) {
        alert("Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type]);

  const handleAmountChange = (val: string) => {
    const numeric = val.replace(/\D/g, '');
    setAmount(numeric ? Number(numeric).toLocaleString('vi-VN') : '');
  };

  const handleSave = async () => {
    const rawAmount = parseFloat(amount.replace(/\./g, ''));
    const isoStart = _parseDate(startDate);
    
    if (!name || !rawAmount || !isoStart) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { 
        name, type, amount: rawAmount, frequency, 
        account_id: selectedAccount?.id, category_id: selectedCategory?.id,
        start_date: isoStart, end_date: _parseDate(endDate), note 
      };

      if (isEdit) {
        await updateTemplate(existing.id, payload);
      } else {
        await createTemplate(payload);
      }
      window.history.back();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-[#075c09]">Đang tải...</div>;

  return (
    <div className="flex flex-col bg-[#f5f5f5] relative font-sans">
      {/* Header */}
      <header className="bg-[#075c09] p-5 pt-10 flex items-center justify-between text-white sticky top-0 z-30">
        <button onClick={() => window.history.back()} className="text-2xl font-bold px-2">←</button>
        <h1 className="text-lg font-bold">{isEdit ? 'Chỉnh sửa định kỳ' : 'Tạo giao dịch định kỳ'}</h1>
        <div className="w-8"></div>
      </header>

      {/* Body Content[cite: 11] */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto space-y-4">
        
        <Section title="Thông tin giao dịch">
          <Field label="Tên giao dịch" required>
            <input 
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="VD: Tiền thuê nhà..."
              className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-sm focus:ring-2 focus:ring-[#075c09] outline-none"
            />
          </Field>

          <Field label="Loại giao dịch" required>
            <div className="flex gap-2">
              {TYPES.map(t => (
                <button
                  key={t.key}
                  disabled={isEdit}
                  onClick={() => setType(t.key)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold border-2 transition-all ${
                    type === t.key 
                    ? `bg-opacity-10 border-[${t.color}] text-[${t.color}]` 
                    : 'bg-white border-gray-100 text-gray-500'
                  }`}
                  style={type === t.key ? { borderColor: t.color, backgroundColor: t.color + '18', color: t.color } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {isEdit && <p className="text-[10px] text-gray-400 italic mt-1">Không thể đổi loại khi chỉnh sửa</p>}
          </Field>

          <Field label="Số tiền (đ)" required>
            <input 
              type="text" value={amount} onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="VD: 3.000.000"
              className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-sm font-bold"
            />
          </Field>
        </Section>

        <Section title="Tài khoản & Danh mục">
          <Field label="Tài khoản" required>
            <div className="flex flex-wrap gap-2">
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccount(acc)}
                  className={`px-3 py-2 rounded-xl border-2 text-left transition-all ${
                    selectedAccount?.id === acc.id ? 'border-[#075c09] bg-[#e8f5e9]' : 'border-gray-100'
                  }`}
                >
                  <p className={`text-xs font-bold ${selectedAccount?.id === acc.id ? 'text-[#075c09]' : 'text-gray-600'}`}>{acc.name}</p>
                  <p className="text-[10px] text-gray-400">{Number(acc.current_balance).toLocaleString('vi-VN')} đ</p>
                </button>
              ))}
            </div>
          </Field>
        </Section>

        <Section title="Lịch lặp lại">
          <Field label="Chu kỳ" required>
            <div className="flex flex-wrap gap-2">
              {FREQUENCIES.map(f => (
                <button
                  key={f.key}
                  disabled={isEdit}
                  onClick={() => setFrequency(f.key)}
                  className={`px-3 py-2 rounded-lg border-2 text-xs font-bold transition-all ${
                    frequency === f.key ? 'border-[#075c09] bg-[#e8f5e9] text-[#075c09]' : 'border-gray-50 text-gray-500'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Ngày bắt đầu" required>
            <div className="flex border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
              <input 
                type="text" readOnly value={startDate} placeholder="DD/MM/YYYY"
                className="flex-1 p-2.5 text-sm bg-transparent outline-none"
              />
              <button 
                onClick={() => !isEdit && setShowStartCalendar(true)}
                className="px-3 bg-gray-100 border-l border-gray-200"
              >📅</button>
            </div>
          </Field>
        </Section>

        <Section title="Ghi chú">
          <textarea 
            value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú thêm..."
            className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-sm h-20 resize-none outline-none focus:ring-2 focus:ring-[#075c09]"
          />
        </Section>

        <button 
          onClick={handleSave}
          disabled={submitting}
          className="w-full bg-[#075c09] text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-transform disabled:bg-gray-400"
        >
          {submitting ? "Đang xử lý..." : (isEdit ? "Lưu thay đổi" : "Tạo giao dịch định kỳ")}
        </button>
      </main>

      {/* Date Picker Overlay (Modal thay thế)[cite: 11] */}
      {showStartCalendar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-5 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}>←</button>
              <h4 className="font-bold text-[#075c09]">Tháng {viewDate.getMonth() + 1} {viewDate.getFullYear()}</h4>
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}>→</button>
            </div>
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 mb-2">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {_getCalendarDaysForMonth(viewDate).map((day, i) => (
                <button
                  key={i}
                  disabled={!day}
                  onClick={() => {
                    if(day) {
                      setStartDate(_isoToDisplay(day.toISOString().split('T')[0]));
                      setShowStartCalendar(false);
                    }
                  }}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm ${
                    !day ? '' : 'hover:bg-[#e8f5e9] text-gray-700 font-medium'
                  }`}
                >
                  {day?.getDate()}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowStartCalendar(false)}
              className="w-full mt-6 py-3 bg-gray-100 rounded-xl font-bold text-gray-600"
            >Đóng</button>
          </div>
        </div>
      )}

          </div>
  );
}
