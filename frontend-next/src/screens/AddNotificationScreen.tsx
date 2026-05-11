"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '../components/Footer';
import { createReminder } from '../api/notificationsApi';

type Frequency = 'daily' | 'weekly' | 'monthly' | 'once';

const frequencyOptions: { label: string; value: Frequency }[] = [
  { label: 'Hàng ngày', value: 'daily' },
  { label: 'Hàng tuần', value: 'weekly' },
  { label: 'Hàng tháng', value: 'monthly' },
  { label: 'Một lần', value: 'once' },
];

export default function AddNotificationScreen() {
  const router = useRouter();
  const [reminderName, setReminderName] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('weekly');
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedHour, setSelectedHour] = useState('08');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [notes, setNotes] = useState('');

  const formatDate = (date: Date) => {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const getCalendarDaysForMonth = (date: Date) => {
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

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const handleCreateReminder = async () => {
    if (!reminderName.trim()) return;
    const time = `${selectedHour}:${selectedMinute}`;
    const iso = selectedDate.toISOString().split('T')[0];
    try {
      await createReminder({
        name: reminderName.trim(),
        frequency,
        start_date: iso,
        reminder_time: time,
        note: notes.trim() || null,
      });
      router.push('/notifications');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="flex flex-col bg-[#FFF8F0] relative">
      {}
      <header className="bg-[#075c09] p-5 pt-8 flex items-center justify-between text-white sticky top-0 z-20">
        <button onClick={() => window.history.back()} className="text-2xl font-bold px-2">←</button>
        <h1 className="text-xl font-medium">Thêm lời nhắc</h1>
        <div className="w-10"></div>
      </header>

      {}
      <main className="flex-1 p-5 space-y-5 pb-24 overflow-y-auto">
        <section>
          <label className="block text-[#075c09] font-semibold mb-2">
            Tên lời nhắc <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full bg-white border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#075c09]"
            placeholder="Nhập tên lời nhắc"
            value={reminderName}
            onChange={(e) => setReminderName(e.target.value)}
          />
        </section>

        {}
        <section>
          <label className="block text-[#075c09] font-semibold mb-2">Tần suất nhắc nhở</label>
          <button
            onClick={() => setShowFrequencyModal(true)}
            className="w-full bg-white border border-gray-300 rounded-lg p-3 text-left flex justify-between items-center"
          >
            {frequencyOptions.find(opt => opt.value === frequency)?.label}
            <span className="text-gray-400">▼</span>
          </button>
        </section>

        {}
        <section>
          <label className="block text-[#075c09] font-semibold mb-2">Ngày bắt đầu nhắc nhở</label>
          <button
            onClick={() => setShowDateModal(true)}
            className="w-full bg-white border border-gray-300 rounded-lg p-3 text-left"
          >
            📅 {formatDate(selectedDate)}
          </button>
        </section>

        {}
        <section>
          <label className="block text-[#075c09] font-semibold mb-2">Giờ</label>
          <button
            onClick={() => setShowTimeModal(true)}
            className="w-full bg-white border border-gray-300 rounded-lg p-3 text-left font-semibold"
          >
            {selectedHour}:{selectedMinute}
          </button>
        </section>

        <section>
          <label className="block text-[#075c09] font-semibold mb-2">Ghi chú</label>
          <textarea
            className="w-full bg-white border border-gray-300 rounded-lg p-3 h-24 resize-none outline-none focus:ring-2 focus:ring-[#075c09]"
            placeholder="Nhập ghi chú (tùy chọn)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </section>

        <button
          onClick={handleCreateReminder}
          disabled={!reminderName.trim()}
          className={`w-full py-4 rounded-lg font-bold text-white shadow-lg transition-all active:scale-95 ${
            reminderName.trim() ? 'bg-[#075c09]' : 'bg-gray-300'
          }`}
        >
          Tạo
        </button>
      </main>

      {}
      {showFrequencyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-5 animate-slide-up">
            <h3 className="text-center font-bold text-[#075c09] mb-4">Tần suất nhắc nhở</h3>
            <div className="space-y-1">
              {frequencyOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setFrequency(opt.value); setShowFrequencyModal(false); }}
                  className={`w-full p-4 text-left rounded-lg transition-colors ${
                    frequency === opt.value ? 'bg-[#E5F5E5] text-[#075c09] font-bold' : 'hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowFrequencyModal(false)} className="w-full mt-4 py-3 bg-[#075c09] text-white rounded-lg font-bold">Đóng</button>
          </div>
        </div>
      )}

      {}
      {showTimeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-2xl p-5">
            <h3 className="text-center font-bold text-[#075c09] mb-4">Chọn giờ</h3>
            <div className="flex gap-4 h-48 overflow-hidden">
              <div className="flex-1 overflow-y-auto no-scrollbar border-r">
                {hours.map(h => (
                  <button
                    key={h}
                    onClick={() => setSelectedHour(h)}
                    className={`w-full py-2 text-center ${selectedHour === h ? 'bg-[#E5F5E5] font-bold' : ''}`}
                  >
                    {h}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {minutes.map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedMinute(m)}
                    className={`w-full py-2 text-center ${selectedMinute === m ? 'bg-[#E5F5E5] font-bold' : ''}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setShowTimeModal(false)} className="w-full mt-4 py-3 bg-[#075c09] text-white rounded-lg font-bold">Xác nhận</button>
          </div>
        </div>
      )}

          </div>
  );
}
