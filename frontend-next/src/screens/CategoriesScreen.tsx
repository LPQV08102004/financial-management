"use client";

import React, { useState, useEffect, useCallback } from 'react';
import SidebarDrawer from '../components/SidebarDrawer';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CategoryIcon from '../components/CategoryIcon';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../api/categoriesApi';
import type { CategoryType } from '../types/category';
import {
  Plus, X, Trash2, Utensils, Coffee, Car, Plane, Home,
  Stethoscope, Dumbbell, Briefcase, CreditCard, Gift
} from 'lucide-react';

const PRESET_COLORS = [
  '#FF6B6B', '#FF8E53', '#FFC43D', '#06D6A0', '#118AB2',
  '#6A4C93', '#F72585', '#4CC9F0', '#7FB069', '#B5838D',
];

const ICON_MAP: Record<string, any> = {
  'fast-food': Utensils, 'cafe': Coffee, 'car': Car, 'airplane': Plane,
  'home': Home, 'medical': Stethoscope, 'fitness': Dumbbell,
  'briefcase': Briefcase, 'card': CreditCard, 'gift': Gift,
  'ellipsis-horizontal': Plus
};

const EMPTY_FORM = { name: '', type: 'expense', icon: 'ellipsis-horizontal', color: '#FF6B6B' };

export default function CategoriesScreen() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState({...EMPTY_FORM, type: 'expense' as CategoryType});
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listCategories();
      setCategories(data);
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const filtered = categories.filter(c => c.type === activeTab);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, type: activeTab });
    setModalVisible(true);
  };

  const openEdit = (cat: any) => {
    setEditTarget(cat);
    setForm({
      name: cat.name,
      type: cat.type,
      icon: cat.icon || 'ellipsis-horizontal',
      color: cat.color || '#FF6B6B',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return alert('Tên danh mục không được để trống');
    try {
      setSaving(true);
      if (editTarget) {
        await updateCategory(editTarget.id, { ...form, name: form.name.trim(), type: form.type as CategoryType });
      } else {
        await createCategory({ ...form, name: form.name.trim(), type: form.type as CategoryType });
      }
      setModalVisible(false);
      fetchCategories();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editTarget) return;
    if (confirm(`Xóa "${editTarget.name}"? Dữ liệu giao dịch cũ vẫn sẽ được giữ lại.`)) {
      try {
        await deleteCategory(editTarget.id);
        setModalVisible(false);
        fetchCategories();
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  return (
    <div className="bg-[#f8f9fa] flex flex-col relative">
      <SidebarDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <Header
        title="Danh mục"
        onMenuPress={() => setSidebarOpen(true)}
        rightIcon="📋"
      />

      {}
      <div className="flex bg-white border-b shadow-sm">
        {[['expense', 'Chi phí'], ['income', 'Thu nhập']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 py-3.5 text-sm font-bold transition-all border-b-2 ${
              activeTab === key
                ? 'border-[#075c09] text-[#075c09]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {}
      <div className="p-5 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-5 overflow-y-auto">
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => openEdit(item)}
            className="flex flex-col items-center gap-2 group"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
              style={{ backgroundColor: item.color }}
            >
              <CategoryIcon icon={item.icon} size={32} color="#fff" />
            </div>
            <span className="text-[11px] font-bold text-gray-700 text-center line-clamp-2 uppercase">
              {item.name}
            </span>
          </button>
        ))}

        {}
        <button
          onClick={openAdd}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#075c09] bg-[#e8f5e9] flex items-center justify-center text-[#075c09]">
            <Plus size={32} strokeWidth={1.5} />
          </div>
          <span className="text-[11px] font-bold text-[#075c09] uppercase">Thêm</span>
        </button>
      </div>

            {}
      {modalVisible && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalVisible(false)} />
          <div className="bg-white rounded-t-[32px] p-6 shadow-2xl relative animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-gray-800">
                {editTarget ? 'Sửa danh mục' : 'Thêm mới'}
              </h2>
              {editTarget && (
                <button onClick={handleDelete} className="text-red-500 p-2">
                  <Trash2 size={20} />
                </button>
              )}
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {}
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-inner"
                  style={{ backgroundColor: form.color }}
                >
                  <CategoryIcon icon={form.icon} size={28} color="#fff" />
                </div>
                <input
                  className="flex-1 bg-transparent text-lg font-bold outline-none border-b-2 border-transparent focus:border-[#075c09]"
                  value={form.name}
                  placeholder="Tên danh mục..."
                  onChange={(e) => setForm({...form, name: e.target.value})}
                />
              </div>

              {}
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Màu sắc</label>
                <div className="flex flex-wrap gap-3">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm({...form, color: c})}
                      className={`w-9 h-9 rounded-full transition-transform ${form.color === c ? 'scale-125 border-4 border-white shadow-lg' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {}
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Biểu tượng</label>
                <div className="grid grid-cols-6 gap-3">
                  {Object.keys(ICON_MAP).map(iconName => (
                    <button
                      key={iconName}
                      onClick={() => setForm({...form, icon: iconName})}
                      className={`p-3 rounded-xl flex items-center justify-center transition-colors ${form.icon === iconName ? 'bg-[#075c09] text-white' : 'bg-gray-100 text-gray-500'}`}
                    >
                      <CategoryIcon icon={iconName} size={20} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setModalVisible(false)}
                className="flex-1 py-4 font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] bg-[#075c09] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[#075c09]/30 active:scale-95 transition-all"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
