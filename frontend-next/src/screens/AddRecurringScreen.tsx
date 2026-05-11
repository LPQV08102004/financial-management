"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createTemplate, updateTemplate, getTemplate } from '../api/recurringApi';
import { listAccounts } from '../api/accountsApi';
import { listCategories } from '../api/categoriesApi';
import { RecurringTemplate } from '../types/recurring';

const FREQUENCIES = [
  { key: 'daily',   label: 'Hàng ngày' },
  { key: 'weekly',  label: 'Hàng tuần' },
  { key: 'monthly', label: 'Hàng tháng' },
  { key: 'yearly',  label: 'Hàng năm' },
];

const TYPES = [
  { key: 'income',  label: 'Thu nhập',  color: '#075c09' },
  { key: 'expense', label: 'Chi tiêu',  color: '#CC3300' },
];

const _parseDate = (str: string) => {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length !== 3 || parts[2].length !== 4) return null;
  const iso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  return isNaN(Date.parse(iso)) ? null : iso;
};

const _isoToDisplay = (iso: string | null | undefined) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

const _todayDisplay = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const _getCalDays = (date: Date) => {
  const y = date.getFullYear(), m = date.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(y, m, i));
  return days;
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
    <h3 className="text-xs font-bold text-[#075c09] uppercase tracking-wider mb-3">{title}</h3>
    {children}
  </div>
);

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="mb-4">
    <label className="block text-sm text-gray-600 font-semibold mb-1.5">
      {label}{required && <span className="text-red-500"> *</span>}
    </label>
    {children}
  </div>
);

function CalendarModal({
  show, viewDate, setViewDate, onSelect, onClose, allowPast = true,
}: {
  show: boolean; viewDate: Date; setViewDate: (d: Date) => void;
  onSelect: (d: Date) => void; onClose: () => void; allowPast?: boolean;
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-5 pb-8">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
            className="bg-[#075c09] text-white px-4 py-1.5 rounded-lg font-bold"
          >←</button>
          <span className="font-bold text-[#075c09]">
            Tháng {viewDate.getMonth() + 1} {viewDate.getFullYear()}
          </span>
          <button
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
            className="bg-[#075c09] text-white px-4 py-1.5 rounded-lg font-bold"
          >→</button>
        </div>
        <div className="grid grid-cols-7 text-center mb-2">
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
            <div key={d} className="text-[11px] font-bold text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {_getCalDays(viewDate).map((day, i) => {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const disabled = !day || (!allowPast && day < today);
            return (
              <button
                key={i}
                disabled={disabled}
                onClick={() => { if (day) onSelect(day); }}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-colors ${
                  !day ? '' : disabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'hover:bg-[#e8f5e9] text-gray-700 font-medium'
                }`}
              >{day?.getDate()}</button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-5 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold"
        >Đóng</button>
      </div>
    </div>
  );
}

function AddRecurringContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEdit = !!editId;

  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [startDate, setStartDate] = useState(_todayDisplay());
  const [endDate, setEndDate] = useState('');
  const [note, setNote] = useState('');

  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showStartCal, setShowStartCal] = useState(false);
  const [showEndCal, setShowEndCal] = useState(false);
  const [startCalView, setStartCalView] = useState(new Date());
  const [endCalView, setEndCalView] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      try {
        let existing: RecurringTemplate | null = null;

        if (editId) {
          const cached = sessionStorage.getItem('edit_recurring');
          if (cached) {
            try { existing = JSON.parse(cached); } catch {  }
            sessionStorage.removeItem('edit_recurring');
          }
          if (!existing) {
            existing = await getTemplate(Number(editId));
          }
        }

        const initialType = existing?.type ?? 'expense';
        const [accs, cats] = await Promise.all([
          listAccounts(),
          listCategories(initialType),
        ]);
        setAccounts(accs || []);
        setCategories(cats || []);

        if (existing) {
          setName(existing.name);
          setType(existing.type);
          setAmount(Number(existing.amount).toLocaleString('vi-VN'));
          setFrequency(existing.frequency);
          setStartDate(_isoToDisplay(existing.start_date));
          setEndDate(_isoToDisplay(existing.end_date ?? ''));
          setNote(existing.note ?? '');
          setSelectedAccount(accs?.find((a: any) => a.id === existing!.account_id) ?? null);
          setSelectedCategory(cats?.find((c: any) => c.id === existing!.category_id) ?? null);
        } else {
          setSelectedAccount(accs?.[0] ?? null);
        }
      } catch {
        alert('Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [editId]);

  const handleTypeChange = async (newType: 'income' | 'expense') => {
    setType(newType);
    setSelectedCategory(null);
    try {
      const cats = await listCategories(newType);
      setCategories(cats || []);
    } catch {  }
  };

  const handleAmountChange = (val: string) => {
    const num = val.replace(/\D/g, '');
    setAmount(num ? Number(num).toLocaleString('vi-VN') : '');
  };

  const handleSave = async () => {
    const rawAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    const isoStart = _parseDate(startDate);
    if (!name.trim()) return alert('Vui lòng nhập tên giao dịch');
    if (!rawAmount || rawAmount <= 0) return alert('Số tiền không hợp lệ');
    if (!selectedAccount) return alert('Vui lòng chọn tài khoản');
    if (!isoStart) return alert('Ngày bắt đầu không hợp lệ (DD/MM/YYYY)');
    let isoEnd: string | null = null;
    if (endDate.trim()) {
      isoEnd = _parseDate(endDate);
      if (!isoEnd) return alert('Ngày kết thúc không hợp lệ (DD/MM/YYYY)');
      if (isoEnd < isoStart) return alert('Ngày kết thúc phải sau ngày bắt đầu');
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateTemplate(Number(editId), {
          name: name.trim(),
          amount: rawAmount,
          account_id: selectedAccount.id,
          category_id: selectedCategory?.id ?? null,
          end_date: isoEnd,
          note: note.trim() || null,
        });
      } else {
        await createTemplate({
          name: name.trim(),
          type,
          amount: rawAmount,
          frequency: frequency as any,
          account_id: selectedAccount.id,
          category_id: selectedCategory?.id ?? null,
          start_date: isoStart,
          end_date: isoEnd,
          note: note.trim() || null,
        });
      }
      router.push('/recurring');
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message
        : typeof e?.detail === 'string' ? e.detail
        : JSON.stringify(e?.detail ?? e);
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#075c09]" />
    </div>
  );

  return (
    <div className="flex flex-col bg-[#f5f5f5] font-sans min-h-screen">
      <header className="bg-[#075c09] p-5 pt-10 flex items-center justify-between text-white sticky top-0 z-30">
        <button onClick={() => router.push('/recurring')} className="text-2xl font-bold px-2">←</button>
        <h1 className="text-lg font-bold">
          {isEdit ? 'Chỉnh sửa định kỳ' : 'Tạo giao dịch định kỳ'}
        </h1>
        <div className="w-8" />
      </header>

      <main className="flex-1 p-4 pb-24 space-y-4 overflow-y-auto">
        <Section title="Thông tin giao dịch">
          <Field label="Tên giao dịch" required>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
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
                  onClick={() => handleTypeChange(t.key as 'income' | 'expense')}
                  className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold border-2 transition-all"
                  style={
                    type === t.key
                      ? { borderColor: t.color, backgroundColor: t.color + '18', color: t.color }
                      : { borderColor: '#e5e7eb', color: '#6b7280' }
                  }
                >{t.label}</button>
              ))}
            </div>
            {isEdit && (
              <p className="text-[10px] text-gray-400 italic mt-1">
                Không thể đổi loại khi chỉnh sửa
              </p>
            )}
          </Field>

          <Field label="Số tiền (đ)" required>
            <input
              type="text"
              value={amount}
              onChange={e => handleAmountChange(e.target.value)}
              placeholder="VD: 3.000.000"
              className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-sm font-bold focus:ring-2 focus:ring-[#075c09] outline-none"
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
                    selectedAccount?.id === acc.id
                      ? 'border-[#075c09] bg-[#e8f5e9]'
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  <p className={`text-xs font-bold ${selectedAccount?.id === acc.id ? 'text-[#075c09]' : 'text-gray-600'}`}>
                    {acc.name}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {Number(acc.current_balance).toLocaleString('vi-VN')} đ
                  </p>
                </button>
              ))}
            </div>
          </Field>

          {categories.length > 0 && (
            <Field label="Danh mục">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(selectedCategory?.id === cat.id ? null : cat)}
                    className={`px-3 py-2 rounded-xl border-2 text-left transition-all ${
                      selectedCategory?.id === cat.id
                        ? 'border-[#075c09] bg-[#e8f5e9]'
                        : 'border-gray-100 bg-white'
                    }`}
                  >
                    <p className={`text-xs font-bold ${selectedCategory?.id === cat.id ? 'text-[#075c09]' : 'text-gray-600'}`}>
                      {cat.name}
                    </p>
                  </button>
                ))}
              </div>
            </Field>
          )}
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
                    frequency === f.key
                      ? 'border-[#075c09] bg-[#e8f5e9] text-[#075c09]'
                      : 'border-gray-100 text-gray-500'
                  }`}
                >{f.label}</button>
              ))}
            </div>
            {isEdit && (
              <p className="text-[10px] text-gray-400 italic mt-1">
                Không thể đổi chu kỳ khi chỉnh sửa
              </p>
            )}
          </Field>

          <Field label="Ngày bắt đầu" required>
            <div className="flex border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
              <input
                type="text"
                readOnly={isEdit}
                value={startDate}
                onChange={e => {
                  let v = e.target.value.replace(/\D/g, '');
                  if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                  if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5, 9);
                  setStartDate(v);
                }}
                placeholder="DD/MM/YYYY"
                maxLength={10}
                className="flex-1 p-2.5 text-sm bg-transparent outline-none"
              />
              <button
                disabled={isEdit}
                onClick={() => !isEdit && setShowStartCal(true)}
                className="px-3 bg-gray-100 border-l border-gray-200 hover:bg-[#e8f5e9] transition-colors disabled:opacity-40"
              >📅</button>
            </div>
          </Field>

          <Field label="Ngày kết thúc (tuỳ chọn)">
            <div className="flex border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
              <input
                type="text"
                value={endDate}
                onChange={e => {
                  let v = e.target.value.replace(/\D/g, '');
                  if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                  if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5, 9);
                  setEndDate(v);
                }}
                placeholder="DD/MM/YYYY (bỏ trống = không hết hạn)"
                maxLength={10}
                className="flex-1 p-2.5 text-sm bg-transparent outline-none"
              />
              <button
                onClick={() => setShowEndCal(true)}
                className="px-3 bg-gray-100 border-l border-gray-200 hover:bg-[#e8f5e9] transition-colors"
              >📅</button>
            </div>
          </Field>
        </Section>

        <Section title="Ghi chú">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Ghi chú thêm..."
            className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-sm h-20 resize-none outline-none focus:ring-2 focus:ring-[#075c09]"
          />
        </Section>

        <button
          onClick={handleSave}
          disabled={submitting}
          className="w-full bg-[#075c09] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all disabled:bg-gray-400 active:scale-[0.98]"
        >
          {submitting ? 'Đang xử lý...' : isEdit ? 'Lưu thay đổi' : 'Tạo giao dịch định kỳ'}
        </button>
      </main>

      <CalendarModal
        show={showStartCal}
        viewDate={startCalView}
        setViewDate={setStartCalView}
        onSelect={d => { setStartDate(_isoToDisplay(d.toISOString().split('T')[0])); setShowStartCal(false); }}
        onClose={() => setShowStartCal(false)}
        allowPast={true}
      />
      <CalendarModal
        show={showEndCal}
        viewDate={endCalView}
        setViewDate={setEndCalView}
        onSelect={d => { setEndDate(_isoToDisplay(d.toISOString().split('T')[0])); setShowEndCal(false); }}
        onClose={() => setShowEndCal(false)}
        allowPast={false}
      />
    </div>
  );
}

export default function AddRecurringScreen() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#075c09]" />
        </div>
      }
    >
      <AddRecurringContent />
    </Suspense>
  );
}
