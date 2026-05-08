"use client";

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { createExpense, createIncome } from '../api/transactionApi';
import { listAccounts } from '../api/accountsApi';

interface TransactionConfirmCardProps {
  parsed: any; // Dữ liệu từ AI Agent bóc tách được
  onConfirmed: () => void;
  onCancel: () => void;
}

export default function TransactionConfirmCard({ 
  parsed, 
  onConfirmed, 
  onCancel 
}: TransactionConfirmCardProps) {
  const [type, setType] = useState<'expense' | 'income'>(parsed.type || 'expense');
  const [amount, setAmount] = useState(parsed.amount ? String(parsed.amount) : '');
  const [date, setDate] = useState(parsed.date || new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(parsed.note || '');
  const [selectedCategory, setSelectedCategory] = useState(
    parsed.category_suggestions?.[0] || null
  );
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Lấy danh sách tài khoản khi component mount
  useEffect(() => {
    listAccounts()
      .then((list) => {
        setAccounts(list);
        if (list.length > 0) setSelectedAccount(list[0]);
      })
      .catch(() => {});
  }, []);

  // Auto-cap amount when account changes or type switches to expense
  useEffect(() => {
    if (type !== 'expense' || !selectedAccount || !amount) return;
    const num = Number(amount);
    if (isNaN(num) || num <= 0) return;
    const cap = Math.floor(Number(selectedAccount.current_balance));
    if (num > cap) setAmount(String(cap));
  }, [selectedAccount, type]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) { setAmount(''); return; }
    let num = parseInt(raw, 10);
    if (type === 'expense' && selectedAccount) {
      const cap = Math.floor(Number(selectedAccount.current_balance));
      if (num > cap) num = cap;
    }
    setAmount(String(num));
  };

  // Kiểm tra các trường thông tin bắt buộc[cite: 6]
  const missingFields: string[] = [];
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) missingFields.push('Số tiền');
  if (!date) missingFields.push('Ngày');
  if (type === 'expense' && !selectedCategory) missingFields.push('Danh mục');
  if (!selectedAccount) missingFields.push('Tài khoản');

  const handleConfirm = async () => {
    if (missingFields.length > 0) return;
    setSaving(true);
    setError('');
    try {
      const payload: any = {
        account_id: selectedAccount.id,
        amount: Number(amount),
        transaction_date: `${date}T00:00:00`,
        note: note || undefined,
      };

      if (type === 'expense') {
        payload.category_id = selectedCategory.id;
        await createExpense(payload);
      } else {
        if (selectedCategory) payload.category_id = selectedCategory.id;
        await createIncome(payload);
      }
      onConfirmed();
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message
        : typeof e?.detail === 'string' ? e.detail
        : JSON.stringify(e?.detail ?? e) ;
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 m-3 shadow-lg border-l-4 border-l-[#075c09] max-w-md mx-auto">
      <h2 className="text-lg font-bold text-[#075c09] mb-3">📋 Xác nhận giao dịch</h2>

      {/* Loại giao dịch (Toggle)[cite: 6] */}
      <div className="mb-3">
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Loại</label>
        <div className="flex gap-2">
          <button
            onClick={() => setType('expense')}
            className={`flex-1 py-2 rounded-lg border transition-all font-medium text-sm ${
              type === 'expense' 
                ? 'bg-[#075c09] border-[#075c09] text-white' 
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            Chi tiêu
          </button>
          <button
            onClick={() => setType('income')}
            className={`flex-1 py-2 rounded-lg border transition-all font-medium text-sm ${
              type === 'income' 
                ? 'bg-[#075c09] border-[#075c09] text-white' 
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            Thu nhập
          </button>
        </div>
      </div>

      {/* Thông tin nhập liệu[cite: 6] */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Số tiền (VND)</label>
          {type === 'expense' && selectedAccount && (
            <p className="text-[11px] text-[#075c09] font-medium mb-1">
              Số dư: {Math.floor(Number(selectedAccount.current_balance)).toLocaleString('vi-VN')} đ
            </p>
          )}
          <input
            type="text"
            value={amount ? Number(amount).toLocaleString('vi-VN') : ''}
            onChange={handleAmountChange}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#075c09] outline-none bg-gray-50"
            placeholder={type === 'expense' && selectedAccount
              ? `Tối đa ${Math.floor(Number(selectedAccount.current_balance)).toLocaleString('vi-VN')} đ`
              : 'VD: 220000'}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Ngày</label>
          <input
            type="date"
            value={date}
            min="1900-01-01"
            max="2099-12-31"
            onChange={(e) => {
              const val = e.target.value;
              if (!val) { setDate(''); return; }
              const year = parseInt(val.split('-')[0], 10);
              if (year < 1900 || year > 2099) return;
              setDate(val);
            }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#075c09] outline-none bg-gray-50"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Ghi chú</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#075c09] outline-none bg-gray-50"
            placeholder="Mô tả giao dịch"
          />
        </div>
      </div>

      {/* Danh mục (Chips)[cite: 6] */}
      {type === 'expense' && (
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Danh mục</label>
          {parsed.category_suggestions?.length > 0 ? (
            <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
              {parsed.category_suggestions.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full border text-xs transition-all ${
                    selectedCategory?.id === cat.id
                      ? 'bg-[#075c09] border-[#075c09] text-white font-semibold'
                      : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name} {cat.confidence}%
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-orange-500 italic">Cần chọn danh mục thủ công</p>
          )}
        </div>
      )}

      {/* Tài khoản (Chips)[cite: 6] */}
      {accounts.length > 0 && (
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Tài khoản</label>
          <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => setSelectedAccount(acc)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full border text-xs transition-all ${
                  selectedAccount?.id === acc.id
                    ? 'bg-[#075c09] border-[#075c09] text-white font-semibold'
                    : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {acc.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cảnh báo & Lỗi[cite: 6] */}
      {missingFields.length > 0 && (
        <p className="text-xs text-orange-500 mb-2">⚠ Cần bổ sung: {missingFields.join(', ')}</p>
      )}
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      {/* Nút hành động[cite: 6] */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-medium hover:bg-gray-50 transition-colors"
        >
          Huỷ
        </button>
        <button
          onClick={handleConfirm}
          disabled={missingFields.length > 0 || saving}
          className="flex-1 py-3 rounded-xl bg-[#075c09] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#064a08] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : '✓ Xác nhận'}
        </button>
      </div>
    </div>
  );
}