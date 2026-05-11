"use client";

import React, { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import {
  createGoal,
  updateGoal,
  depositToGoal,
  withdrawFromGoal,
  getGoal
} from '../api/savingsApi';
import { listAccounts } from '../api/accountsApi';

const _fmtVND = (n: number | string) => Number(n).toLocaleString('vi-VN');

const _fmtDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = String(dateStr).split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

const _parseDate = (str: string) => {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  return isNaN(Date.parse(iso)) ? null : iso;
};

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
    <h3 className="text-xs font-bold text-[#075c09] uppercase tracking-widest mb-4">{title}</h3>
    {children}
  </div>
);

const Field = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold text-gray-600 mb-1.5">{label}</label>
    {children}
  </div>
);

function ActionModal({ visible, onClose, goal, onDone }: any) {
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      listAccounts().then(data => {
        const list = data || [];
        setAccounts(list);
        setSelectedAccount(list[0] ?? null);
      });
    }
  }, [visible]);

  if (!visible || !goal) return null;

  const handleSubmit = async () => {
    const num = parseFloat(amount.replace(/\./g, ''));
    if (!num || !selectedAccount) return alert("Vui lòng nhập đủ thông tin");

    if (mode === 'deposit') {
      const remaining = Number(goal.target_amount) - Number(goal.saved_amount);
      if (num > remaining) {
        return alert(`Số tiền nạp vượt quá số còn thiếu (${remaining.toLocaleString('vi-VN')} đ)`);
      }
    }
    if (mode === 'withdraw') {
      if (num > Number(goal.saved_amount)) {
        return alert(`Số tiền rút vượt quá số đã tích lũy (${Number(goal.saved_amount).toLocaleString('vi-VN')} đ)`);
      }
    }

    setSubmitting(true);
    try {
      const isoDate = new Date().toISOString();
      if (mode === 'deposit') {
        await depositToGoal(goal.id, num, selectedAccount.id, isoDate);
      } else {
        await withdrawFromGoal(goal.id, num, selectedAccount.id, isoDate);
      }
      onDone();
      onClose();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = Number(goal.target_amount) - Number(goal.saved_amount);
  const accountBalance = Math.floor(selectedAccount?.current_balance ?? Infinity);
  const maxDeposit = Math.min(remaining, isFinite(accountBalance) ? accountBalance : remaining);
  const maxWithdraw = Number(goal.saved_amount);
  const cap = mode === 'deposit' ? maxDeposit : maxWithdraw;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (!val) { setAmount(''); return; }
    let num = Number(val);
    if (num > cap) num = cap;
    setAmount(num.toLocaleString('vi-VN'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl mx-4">
        <h4 className="text-lg font-bold text-gray-800 mb-1">Cập nhật tích lũy</h4>
        <p className="text-sm text-gray-500 mb-4">{goal.name}</p>

        <div className="flex gap-3 mb-4">
          <button
            onClick={() => { setMode('deposit'); setAmount(''); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${mode === 'deposit' ? 'border-[#075c09] bg-[#e8f5e9] text-[#075c09]' : 'border-gray-100 text-gray-400'}`}
          >Nạp tiền</button>
          <button
            onClick={() => { setMode('withdraw'); setAmount(''); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${mode === 'withdraw' ? 'border-red-600 bg-red-50 text-red-600' : 'border-gray-100 text-gray-400'}`}
          >Rút tiền</button>
        </div>

        <p className="text-xs text-gray-400 mb-3">
          {mode === 'deposit'
            ? <>Còn thiếu: <strong>{remaining.toLocaleString('vi-VN')} đ</strong> · Số dư TK: <strong>{(selectedAccount?.current_balance ?? 0).toLocaleString('vi-VN')} đ</strong></>
            : <>Đã tích lũy: <strong>{maxWithdraw.toLocaleString('vi-VN')} đ</strong></>}
        </p>

        <Field label="Số tiền (đ)">
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder={`Tối đa ${cap.toLocaleString('vi-VN')} đ`}
            className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-[#075c09] outline-none font-bold"
          />
        </Field>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full py-4 rounded-xl text-white font-bold shadow-lg active:scale-95 transition-all ${mode === 'deposit' ? 'bg-[#075c09]' : 'bg-red-600'}`}
        >
          {submitting ? "Đang xử lý..." : (mode === 'deposit' ? "Xác nhận nạp" : "Xác nhận rút")}
        </button>
        <button onClick={onClose} className="w-full py-3 text-gray-400 text-sm font-medium mt-2">Hủy bỏ</button>
      </div>
    </div>
  );
}

export default function AddSavingsGoalScreen({ existingGoal }: { existingGoal?: any }) {
  const isEdit = !!existingGoal;
  const [currentGoal, setCurrentGoal] = useState(existingGoal);
  const [name, setName] = useState(existingGoal?.name ?? '');
  const [targetAmount, setTargetAmount] = useState(existingGoal ? _fmtVND(existingGoal.target_amount) : '');
  const [deadline, setDeadline] = useState(existingGoal ? _fmtDate(existingGoal.deadline) : '');
  const [note, setNote] = useState(existingGoal?.note ?? '');
  const [loading, setLoading] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [showDeadlineCalendar, setShowDeadlineCalendar] = useState(false);
  const [calendarView, setCalendarView] = useState(() => {
    if (existingGoal?.deadline) {
      const d = new Date(existingGoal.deadline);
      return isNaN(d.getTime()) ? new Date() : d;
    }
    return new Date();
  });

  const _getCalDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const handleSave = async () => {
    const raw = parseFloat(targetAmount.replace(/\./g, ''));
    const isoDate = _parseDate(deadline);
    if (!name || !raw) return alert("Vui lòng điền đủ các trường có dấu *");
    if (!isoDate) return alert("Định dạng ngày không hợp lệ. Vui lòng nhập theo định dạng dd/mm/yyyy");
    if (isoDate <= new Date().toISOString().split('T')[0]) return alert("Ngày mục tiêu phải ở tương lai");

    setLoading(true);
    try {
      const payload = { name, target_amount: raw, deadline: isoDate, note };
      if (isEdit) {
        await updateGoal(currentGoal.id, payload);
      } else {
        await createGoal(payload);
      }
      window.history.back();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#f8f9fa] relative font-sans text-gray-800">
      {}
      <header className="bg-[#075c09] pt-12 pb-5 px-5 flex items-center justify-between text-white sticky top-0 z-40">
        <button onClick={() => window.history.back()} className="text-2xl font-light">←</button>
        <h1 className="text-lg font-bold tracking-tight">{isEdit ? 'Chỉnh sửa mục tiêu' : 'Tạo mục tiêu mới'}</h1>
        <div className="w-6"></div>
      </header>

      <main className="flex-1 p-5 pb-28 space-y-5 overflow-y-auto">
        {}
        {isEdit && currentGoal && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="h-2.5 w-full bg-gray-100 rounded-full mb-3 overflow-hidden">
              <div
                className="h-full bg-[#075c09] transition-all duration-500"
                style={{ width: `${Math.min(currentGoal.progress_pct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-end mb-5">
              <span className="text-sm font-bold text-[#075c09]">{_fmtVND(currentGoal.saved_amount)} đ</span>
              <span className="text-xs font-medium text-gray-400">{_fmtVND(currentGoal.target_amount)} đ</span>
            </div>
            <button
              onClick={() => setActionModalVisible(true)}
              className="w-full py-3 bg-[#075c09]/10 text-[#075c09] rounded-xl font-bold text-sm active:bg-[#075c09]/20 transition-colors"
            >
              Nạp / Rút tiền tiết kiệm
            </button>
          </div>
        )}

        <Section title="Thông tin mục tiêu">
          <Field label="Tên mục tiêu *">
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="VD: Mua MacBook, Du lịch..."
              className="w-full border border-gray-200 rounded-xl p-3.5 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-[#075c09]/20 outline-none transition-all"
            />
          </Field>

          <Field label="Số tiền cần đạt *">
            <input
              type="text" value={targetAmount}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setTargetAmount(val ? Number(val).toLocaleString('vi-VN') : '');
              }}
              placeholder="VD: 30.000.000"
              className="w-full border border-gray-200 rounded-xl p-3.5 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-[#075c09]/20 outline-none font-bold"
            />
          </Field>

          <Field label="Ngày mục tiêu *">
            <div className="flex border border-gray-200 rounded-xl bg-gray-50/50 overflow-hidden focus-within:ring-2 focus-within:ring-[#075c09]/20">
              <input
                type="text" value={deadline}
                onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
                    if (val.length > 5) val = val.slice(0, 5) + '/' + val.slice(5, 9);
                    setDeadline(val);
                }}
                placeholder="DD/MM/YYYY"
                maxLength={10}
                className="flex-1 p-3.5 bg-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => setShowDeadlineCalendar(true)}
                className="px-4 bg-gray-100 border-l border-gray-200 text-xl hover:bg-[#e8f5e9] transition-colors"
              >📅</button>
            </div>
          </Field>
        </Section>

        <Section title="Ghi chú">
          <textarea
            value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Kế hoạch tiết kiệm của bạn..."
            className="w-full border border-gray-200 rounded-xl p-3.5 bg-gray-50/50 h-28 resize-none outline-none focus:ring-2 focus:ring-[#075c09]/20"
          />
        </Section>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-[#075c09] text-white py-4 rounded-2xl font-bold shadow-xl shadow-[#075c09]/20 active:scale-[0.98] transition-all disabled:bg-gray-300"
        >
          {loading ? "Đang lưu..." : (isEdit ? "Cập nhật mục tiêu" : "Bắt đầu tiết kiệm")}
        </button>
      </main>

            <ActionModal
        visible={actionModalVisible}
        onClose={() => setActionModalVisible(false)}
        goal={currentGoal}
        onDone={async () => {
          const updated = await getGoal(currentGoal.id);
          setCurrentGoal(updated);
        }}
      />

      {}
      {showDeadlineCalendar && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-5 pb-8">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setCalendarView(new Date(calendarView.getFullYear(), calendarView.getMonth() - 1))}
                className="bg-[#075c09] text-white px-4 py-1.5 rounded-lg font-bold"
              >←</button>
              <span className="font-bold text-[#075c09]">
                Tháng {calendarView.getMonth() + 1} {calendarView.getFullYear()}
              </span>
              <button
                onClick={() => setCalendarView(new Date(calendarView.getFullYear(), calendarView.getMonth() + 1))}
                className="bg-[#075c09] text-white px-4 py-1.5 rounded-lg font-bold"
              >→</button>
            </div>
            <div className="grid grid-cols-7 text-center mb-2">
              {['CN','T2','T3','T4','T5','T6','T7'].map(d => (
                <div key={d} className="text-[11px] font-bold text-gray-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {_getCalDays(calendarView).map((day, i) => {
                const today = new Date(); today.setHours(0,0,0,0);
                const isPast = day && day <= today;
                const currentDeadline = _parseDate(deadline);
                const isSelected = day && currentDeadline === day.toISOString().split('T')[0];
                return (
                  <button
                    key={i}
                    disabled={!day || !!isPast}
                    onClick={() => {
                      if (day) {
                        const d = day.getDate().toString().padStart(2,'0');
                        const m = (day.getMonth()+1).toString().padStart(2,'0');
                        const y = day.getFullYear();
                        setDeadline(`${d}/${m}/${y}`);
                        setShowDeadlineCalendar(false);
                      }
                    }}
                    className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-colors ${
                      !day ? '' :
                      isSelected ? 'bg-[#075c09] text-white font-bold' :
                      isPast ? 'text-gray-300 cursor-not-allowed' :
                      'hover:bg-[#e8f5e9] text-gray-700 font-medium'
                    }`}
                  >{day?.getDate()}</button>
                );
              })}
            </div>
            <button
              onClick={() => setShowDeadlineCalendar(false)}
              className="w-full mt-5 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold"
            >Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}
