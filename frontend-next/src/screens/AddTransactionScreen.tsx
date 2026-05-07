"use client";

import React, { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import CategoryIcon from '../components/CategoryIcon';
import { listCategories } from '../api/categoriesApi';
import { listAccounts } from '../api/accountsApi';
import { createIncome, createExpense } from '../api/transactionApi';

// Kiểu dữ liệu cho TypeScript
interface Category {
  id: string;
  name: string;
  icon: string;
  color?: string;
}

interface Account {
  id: string;
  name: string;
  current_balance: number;
}

const _fmtVND = (v: string) => v.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const _formatDateLong = (date: Date) => {
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const months = ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6', 'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

export default function AddTransactionScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [images, setImages] = useState<string[]>([]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorDisplay, setCalculatorDisplay] = useState('0');
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listAccounts().then((list: any) => {
      setAccounts(list);
      setSelectedAccount(list[0] ?? null);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedCategory(null);
    listCategories(activeTab).then((data: any) => setCategories(data)).catch(() => {});
  }, [activeTab]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (!val) { setAmount(''); return; }
    let num = parseInt(val, 10);
    // Cap at account balance for expense and savings
    if (activeTab === 'expense' && selectedAccount) {
      const cap = Math.floor(selectedAccount.current_balance);
      if (num > cap) num = cap;
    }
    setAmount(String(num));
  };

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && images.length < 3) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages([...images, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCalculatorInput = (btn: string) => {
    if (btn === '=') {
      try {
        // Thay thế ký hiệu hiển thị sang ký hiệu toán học để eval
        const expression = calculatorDisplay.replace(/×/g, '*').replace(/÷/g, '/');
        const res = eval(expression);
        setCalculatorDisplay(String(res));
      } catch { setCalculatorDisplay('Lỗi'); }
    } else if (btn === 'C') setCalculatorDisplay('0');
    else if (btn === '←') setCalculatorDisplay(prev => prev.slice(0, -1) || '0');
    else {
      setCalculatorDisplay(prev => (prev === '0' && btn !== '.' ? btn : prev + btn));
    }
  };

  const handleAddTransaction = async () => {
    if (!amount || !selectedAccount) return alert("Vui lòng nhập số tiền và đảm bảo có tài khoản");
    if (activeTab === 'expense' && !selectedCategory) return alert("Vui lòng chọn danh mục");

    setSubmitting(true);
    try {
      const data = {
        account_id: selectedAccount.id,
        amount: parseFloat(amount),
        transaction_date: selectedDate.toISOString(),
        note: description || undefined,
        category_id: selectedCategory?.id || undefined,
      };
      activeTab === 'income' ? await createIncome(data) : await createExpense(data);
      window.history.back();
    } catch (e: any) {
      alert(e.message || "Lỗi hệ thống");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="flex flex-col bg-[#f8f9fa] relative font-sans">
      {/* Header */}
      <header className="bg-[#075c09] pt-10 pb-5 px-5 flex items-center justify-between text-white sticky top-0 z-50">
        <button onClick={() => window.history.back()} className="text-2xl font-bold">←</button>
        <h1 className="text-xl font-bold">Thêm giao dịch</h1>
        <div className="w-6"></div>
      </header>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200 sticky top-[84px] z-40">
        {(['expense', 'income'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 font-bold transition-all border-b-4 ${activeTab === tab ? 'border-[#075c09] text-[#075c09]' : 'border-transparent text-gray-400'}`}
          >
            {tab === 'expense' ? 'Chi phí' : 'Thu nhập'}
          </button>
        ))}
      </div>

      <main className="flex-1 p-5 pb-24 space-y-6 overflow-y-auto">
        {/* Số tiền */}
        <section>
          <label className="block text-sm font-bold text-gray-700 mb-2">Số tiền</label>
          {activeTab === 'expense' && selectedAccount && (
            <p className="text-xs text-gray-400 mb-1">
              Số dư: <span className="font-semibold text-[#075c09]">{Math.floor(selectedAccount.current_balance).toLocaleString('vi-VN')} đ</span>
            </p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={_fmtVND(amount)}
              onChange={handleAmountChange}
              placeholder="0"
              className="flex-1 bg-white border border-gray-300 rounded-xl p-4 text-2xl font-bold text-[#075c09] outline-none focus:ring-2 focus:ring-[#075c09]/20"
            />
            <button onClick={() => setShowCalculator(true)} className="p-4 bg-gray-100 rounded-xl text-2xl active:bg-gray-200">🧮</button>
          </div>
        </section>

        {/* Danh mục */}
        <section>
          <label className="block text-sm font-bold text-gray-700 mb-3">Danh mục</label>
          <div className="grid grid-cols-3 gap-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${selectedCategory?.id === cat.id ? 'border-[#075c09] bg-[#e8f5e9]' : 'border-gray-100 bg-white'}`}
              >
                <CategoryIcon icon={cat.icon} size={32} color={cat.color || '#075c09'} />
                <span className="text-[11px] font-bold mt-2 truncate w-full text-center">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Ngày */}
        <section>
          <label className="block text-sm font-bold text-gray-700 mb-2">Ngày</label>
          <button 
            onClick={() => setShowDatePicker(true)}
            className="w-full flex justify-between items-center bg-white border border-gray-200 p-4 rounded-xl active:bg-gray-50"
          >
            <span className="font-medium">{_formatDateLong(selectedDate)}</span>
            <span>📅</span>
          </button>
        </section>

        {/* Ghi chú */}
        <section>
          <label className="block text-sm font-bold text-gray-700 mb-2">Ghi chú</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nội dung giao dịch..."
            className="w-full bg-white border border-gray-200 rounded-xl p-4 h-24 resize-none outline-none focus:ring-2 focus:ring-[#075c09]/20"
          />
        </section>

        {/* Ảnh */}
        <section>
          <label className="block text-sm font-bold text-gray-700 mb-3">Ảnh (Tối đa 3)</label>
          <div className="flex gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                <img src={img} alt="upload" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 bg-black/50 text-white w-6 h-6 rounded-full text-sm"
                >×</button>
              </div>
            ))}
            {images.length < 3 && (
              <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50">
                <input type="file" accept="image/*" className="hidden" onChange={handlePickImage} />
                <span className="text-3xl text-gray-300">+</span>
              </label>
            )}
          </div>
        </section>

        <button
          onClick={handleAddTransaction}
          disabled={submitting}
          className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-[#075c09]/20 transition-all ${submitting ? 'bg-gray-400' : 'bg-[#075c09] active:scale-95'}`}
        >
          {submitting ? 'Đang xử lý...' : 'Thêm giao dịch'}
        </button>
      </main>

            {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-5">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-[#075c09]">Máy tính cầm tay</h2>
              <button onClick={() => setShowCalculator(false)} className="text-2xl text-gray-400">×</button>
            </div>
            <div className="bg-gray-100 p-5 rounded-2xl mb-4 text-right">
              <span className="text-3xl font-mono font-bold break-all">{calculatorDisplay}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '=', '+'].map(btn => (
                <button
                  key={btn}
                  onClick={() => handleCalculatorInput(btn)}
                  className={`p-4 rounded-xl font-bold text-xl ${['÷','×','-','+','='].includes(btn) ? 'bg-[#075c09] text-white' : 'bg-gray-100 text-gray-800 active:bg-gray-200'}`}
                >{btn}</button>
              ))}
              <button onClick={() => handleCalculatorInput('C')} className="col-span-2 p-4 bg-red-100 text-red-600 rounded-xl font-bold">C</button>
              <button onClick={() => handleCalculatorInput('←')} className="p-4 bg-orange-100 text-orange-600 rounded-xl font-bold">←</button>
              <button 
                onClick={() => {
                  setAmount(calculatorDisplay.replace(/\D/g, ''));
                  setShowCalculator(false);
                }}
                className="p-4 bg-blue-600 text-white rounded-xl font-bold"
              >✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
