"use client";

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react'; // Sử dụng icon loading hiện đại
import { depositToGoal, withdrawFromGoal } from '../api/savingsApi';
import { listAccounts } from '../api/accountsApi';

// Helper định dạng tiền tệ
const fmtVND = (n: number | string) => Number(n).toLocaleString('vi-VN') + ' đ';

interface SavingsConfirmCardProps {
  parsed: any; // Thông tin từ AI Agent bóc tách được
  onConfirmed: () => void;
  onCancel: () => void;
}

export default function SavingsConfirmCard({ parsed, onConfirmed, onCancel }: SavingsConfirmCardProps) {
  const [action, setAction] = useState<'deposit' | 'withdraw'>(parsed.action || 'deposit');
  const [amount, setAmount] = useState(parsed.amount ? String(parsed.amount) : '');
  const [date, setDate] = useState(parsed.date || new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(parsed.note || '');
  const [selectedGoal, setSelectedGoal] = useState(parsed.goal_suggestions?.[0] || null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Thay thế useFocusEffect bằng useEffect của React[cite: 6]
  useEffect(() => {
    listAccounts()
      .then((list) => {
        setAccounts(list);
        if (list.length > 0) setSelectedAccount(list[0]);
      })
      .catch(() => {});
  }, []);

  // Logic kiểm tra các trường còn thiếu[cite: 6]
  const missingFields = [];
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) missingFields.push('Số tiền');
  if (!date) missingFields.push('Ngày');
  if (!selectedGoal) missingFields.push('Mục tiêu tiết kiệm');
  if (!selectedAccount) missingFields.push('Tài khoản');

  const handleConfirm = async () => {
    if (missingFields.length > 0) return;

    if (action === 'deposit' && selectedGoal) {
      const remaining = Number(selectedGoal.target_amount) - Number(selectedGoal.saved_amount ?? 0);
      if (Number(amount) > remaining) {
        setError(`Số tiền nạp vượt quá số còn thiếu (${remaining.toLocaleString('vi-VN')} đ)`);
        return;
      }
    }
    if (action === 'withdraw' && selectedGoal) {
      if (Number(amount) > Number(selectedGoal.saved_amount ?? 0)) {
        setError(`Số tiền rút vượt quá số đã tích lũy (${Number(selectedGoal.saved_amount).toLocaleString('vi-VN')} đ)`);
        return;
      }
    }

    setSaving(true);
    setError('');
    try {
      const isoDate = `${date}T00:00:00`;
      if (action === 'deposit') {
        await depositToGoal(selectedGoal.id, Number(amount), selectedAccount.id, isoDate);
      } else {
        await withdrawFromGoal(selectedGoal.id, Number(amount), selectedAccount.id, isoDate);
      }
      onConfirmed();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 my-2 border-l-4 border-l-[#075c09] shadow-md max-w-lg mx-auto">
      <h2 className="text-base font-bold text-[#075c09] mb-4 flex items-center gap-2">
        🏦 Xác nhận tiết kiệm
      </h2>

      {/* 1. Action Toggle[cite: 6] */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-gray-500 mb-2 block">Thao tác</label>
        <div className="flex gap-2">
          <button
            onClick={() => setAction('deposit')}
            className={`flex-1 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
              action === 'deposit' 
                ? 'border-[#075c09] bg-[#e8f5e9] text-[#075c09]' 
                : 'border-gray-200 text-gray-400 hover:bg-gray-50'
            }`}
          >
            + Nạp tiền
          </button>
          <button
            onClick={() => setAction('withdraw')}
            className={`flex-1 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
              action === 'withdraw' 
                ? 'border-[#CC3300] bg-[#fff3f3] text-[#CC3300]' 
                : 'border-gray-200 text-gray-400 hover:bg-gray-50'
            }`}
          >
            - Rút tiền
          </button>
        </div>
      </div>

      {/* 2. Amount, Date, Note[cite: 6] */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Số tiền (VND)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="VD: 100000"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#075c09] outline-none bg-gray-50"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Ngày</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#075c09] outline-none bg-gray-50"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Ghi chú</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Mô tả (tuỳ chọn)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#075c09] outline-none bg-gray-50"
          />
        </div>
      </div>

      {/* 3. Goal Suggestions (Chips)[cite: 6] */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-gray-500 mb-2 block">Mục tiêu tiết kiệm</label>
        {parsed.goal_suggestions?.length > 0 ? (
          <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
            {parsed.goal_suggestions.map((goal: any) => (
              <button
                key={goal.id}
                onClick={() => setSelectedGoal(goal)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full border-2 text-xs font-semibold transition-all ${
                  selectedGoal?.id === goal.id
                    ? 'border-[#075c09] bg-[#e8f5e9] text-[#075c09]'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {goal.name} <span className="opacity-60">{goal.confidence}%</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">Không tìm thấy mục tiêu gợi ý</p>
        )}
      </div>

      {/* 4. Accounts[cite: 6] */}
      {accounts.length > 0 && (
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Tài khoản thanh toán</label>
          <div className="flex overflow-x-auto pb-2 gap-2">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => setSelectedAccount(acc)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl border-2 text-left transition-all ${
                  selectedAccount?.id === acc.id
                    ? 'border-[#075c09] bg-[#e8f5e9]'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className={`text-xs font-bold ${selectedAccount?.id === acc.id ? 'text-[#075c09]' : 'text-gray-600'}`}>
                  {acc.name}
                </div>
                <div className="text-[10px] text-gray-400 font-medium">{fmtVND(acc.current_balance)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error & Warnings[cite: 6] */}
      {missingFields.length > 0 && (
        <p className="text-[11px] text-orange-600 font-medium mb-2">⚠ Cần bổ sung: {missingFields.join(', ')}</p>
      )}
      {error && <p className="text-[11px] text-[#CC3300] font-medium mb-2">{error}</p>}

      {/* 5. Actions[cite: 6] */}
      <div className="flex gap-3 mt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
        >
          Huỷ
        </button>
        <button
          disabled={missingFields.length > 0 || saving}
          onClick={handleConfirm}
          className={`flex-[2] py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            action === 'withdraw' ? 'bg-[#CC3300] hover:bg-[#a32900]' : 'bg-[#075c09] hover:bg-[#054006]'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            action === 'deposit' ? 'Nạp vào tiết kiệm' : 'Rút khỏi tiết kiệm'
          )}
        </button>
      </div>
    </div>
  );
}