"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '../components/Footer';
import { createCategory } from '../api/categoriesApi';

// Định nghĩa kiểu dữ liệu
interface CategoryIcon {
  id: string;
  name: string;
  icon: string;
  isDots?: boolean;
}

const categoryIcons: CategoryIcon[] = [
  { id: '1', name: 'Thức ăn', icon: '/assets/hot-coffee.png' },
  { id: '2', name: 'Quà tặng', icon: '/assets/gift.png' },
  { id: '3', name: 'Sức khỏe', icon: '/assets/cardiogram.png' },
  { id: '4', name: 'Giáo dục', icon: '/assets/graduation-cap.png' },
  { id: '5', name: 'Lương', icon: '/assets/wallet.png' },
  { id: '6', name: 'Ngân hàng', icon: '/assets/bank-building.png' },
  { id: 'dots', name: 'Xem thêm', icon: '/assets/dots.png', isDots: true },
];

const basicColors = [
  '#FF6B6B',
  '#FFD93D',
  '#6BCB77',
  '#4D96FF',
  '#9D84B7',
  '#FF8C42',
  '#075c09',
];

export default function AddCategories() {
  const router = useRouter();
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<'expense' | 'income'>('expense');
  const [selectedIcon, setSelectedIcon] = useState<CategoryIcon>(categoryIcons[0]);
  const [selectedColor, setSelectedColor] = useState(basicColors[0]);

  return (
    <div className="flex flex-col bg-[#f5f5f5] relative">
      {/* Header */}
      <header className="bg-[#075c09] flex items-center p-4 pt-12 text-white sticky top-0 z-10">
        <button onClick={() => window.history.back()} className="p-1 text-2xl">
          ←
        </button>
        <h1 className="flex-1 text-center text-lg font-bold">Tạo danh mục</h1>
        <div className="w-8" />
      </header>

      {/* Body Content */}
      <main className="flex-1 p-4 space-y-6 overflow-y-auto pb-24">
        {/* Category Name Input[cite: 10] */}
        <section>
          <label className="block text-[#075c09] text-sm font-bold mb-2">Tên danh mục</label>
          <input
            type="text"
            placeholder="VD: Ăn uống, Đi lại, Lương,..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#075c09] bg-white text-gray-800"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            maxLength={100}
          />
        </section>

        {/* Type Selector[cite: 10] */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex gap-3">
            <button
              onClick={() => setCategoryType('expense')}
              className={`flex-1 py-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                categoryType === 'expense' 
                ? 'border-[#075c09] bg-[#e8f5e9] text-[#075c09]' 
                : 'border-gray-200 text-gray-500 bg-white'
              }`}
            >
              Chi phí
            </button>
            <button
              onClick={() => setCategoryType('income')}
              className={`flex-1 py-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                categoryType === 'income' 
                ? 'border-[#075c09] bg-[#e8f5e9] text-[#075c09]' 
                : 'border-gray-200 text-gray-500 bg-white'
              }`}
            >
              Thu nhập
            </button>
          </div>
        </section>

        {/* Icon Grid[cite: 10] */}
        <section>
          <label className="block text-[#075c09] text-sm font-bold mb-2">Biểu tượng</label>
          <div className="grid grid-cols-3 gap-4 bg-gray-100 p-4 rounded-xl">
            {categoryIcons.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.isDots) {
                    console.log('Navigate to CategoriesList');
                  } else {
                    setSelectedIcon(item);
                  }
                }}
                className={`aspect-square rounded-full flex items-center justify-center relative transition-all ${
                  selectedIcon.id === item.id && !item.isDots
                  ? 'border-[3px] border-[#075c09] scale-105'
                  : 'border-none'
                }`}
                style={{ backgroundColor: '#888888' }}
              >
                <img src={item.icon} alt={item.name} className="w-10 h-10 object-contain" />
                {selectedIcon.id === item.id && !item.isDots && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#075c09] rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Color Grid[cite: 10] */}
        <section>
          <label className="block text-[#075c09] text-sm font-bold mb-2">Màu sắc</label>
          <div className="flex flex-wrap gap-3">
            {basicColors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-[22%] aspect-square rounded-full flex items-center justify-center border-4 transition-all ${
                  selectedColor === color ? 'border-[#075c09]' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              >
                {selectedColor === color && <span className="text-white font-bold text-lg">✓</span>}
              </button>
            ))}
            <button className="w-[22%] aspect-square rounded-full bg-[#FFD93D] flex items-center justify-center hover:bg-[#ffca28] transition-colors">
              <span className="text-2xl font-bold text-gray-600">+</span>
            </button>
          </div>
        </section>

        {/* Action Button[cite: 10] */}
        <button
          onClick={async () => {
            if (!categoryName.trim()) { alert('Vui lòng nhập tên danh mục'); return; }
            try {
              await createCategory({ name: categoryName.trim(), type: categoryType });
              router.back();
            } catch (e: any) {
              alert(e.message || 'Tạo danh mục thất bại');
            }
          }}
          className="w-full bg-[#075c09] hover:bg-[#064a08] text-white py-3.5 rounded-lg font-bold text-lg shadow-lg active:scale-95 transition-all mt-4">
          Thêm danh mục
        </button>
      </main>

          </div>
  );
}
