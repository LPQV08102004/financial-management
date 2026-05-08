"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { listReminders, updateReminder, deleteReminder as apiDeleteReminder } from '../api/notificationsApi';

function EditNotificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reminderId = searchParams.get('id') ?? '';

  const [reminderName, setReminderName] = useState('');
  const [frequency, setFrequency] = useState('weekly');
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedHour, setSelectedHour] = useState('08');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!reminderId) return;
    (async () => {
      try {
        const list = await listReminders();
        const r = list.find((x: any) => String(x.id) === String(reminderId));
        if (r) {
          setReminderName(r.name || '');
          setFrequency(r.frequency || 'weekly');
          if (r.start_date) setSelectedDate(new Date(r.start_date));
          if (r.reminder_time) {
            const [h, m] = r.reminder_time.split(':');
            setSelectedHour(h || '08');
            setSelectedMinute(m || '00');
          }
          setNotes(r.note || '');
        }
      } catch (e: any) {
        alert(e.message);
      } finally {
        setLoadingData(false);
      }
    })();
  }, [reminderId]);

  const frequencyOptions = [
    { label: 'Hàng ngày', value: 'daily' },
    { label: 'Hàng tuần', value: 'weekly' },
    { label: 'Hàng tháng', value: 'monthly' },
    { label: 'Một lần', value: 'once' },
  ];

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

    const days: (Date | null)[] = [];
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

  const getMonthYearDisplay = (date: Date) => {
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const handleEditReminder = async () => {
    if (!reminderName.trim()) return;
    const time = `${selectedHour}:${selectedMinute}`;
    const iso = selectedDate.toISOString().split('T')[0];
    try {
      await updateReminder(reminderId, {
        name: reminderName.trim(),
        frequency,
        start_date: iso,
        reminder_time: time,
        note: notes.trim() || undefined,
      });
      router.push('/notifications');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteReminder = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa lời nhắc "${reminderName}"?`)) return;
    try {
      await apiDeleteReminder(reminderId);
      router.push('/notifications');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="flex flex-col bg-[#FFF8F0] relative font-sans">
      {/* Header */}
      <header className="bg-[#075c09] p-5 pt-8 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => router.back()} className="text-white text-2xl font-bold p-2 hover:opacity-80">←</button>
        <h1 className="text-white text-xl font-medium">Sửa lời nhắc</h1>
        <div className="w-12"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-5 pb-24 overflow-y-auto space-y-5">
        {/* Tên lời nhắc */}
        <div className="flex flex-col gap-2">
          <label className="text-[#075c09] font-semibold text-base">Tên lời nhắc <span className="text-red-500">*</span></label>
          <input
            type="text"
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-800 outline-none focus:ring-2 focus:ring-[#075c09]/20"
            placeholder="Nhập tên lời nhắc"
            value={reminderName}
            onChange={(e) => setReminderName(e.target.value)}
          />
        </div>

        {/* Tần suất */}
        <div className="flex flex-col gap-2">
          <label className="text-[#075c09] font-semibold text-base">Tần suất nhắc nhở</label>
          <button 
            onClick={() => setShowFrequencyModal(true)}
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-left hover:bg-gray-50"
          >
            {frequencyOptions.find(opt => opt.value === frequency)?.label}
          </button>
        </div>

        {/* Ngày bắt đầu */}
        <div className="flex flex-col gap-2">
          <label className="text-[#075c09] font-semibold text-base">Ngày bắt đầu nhắc nhở</label>
          <button 
            onClick={() => setShowDateModal(true)}
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2"
          >
            <span>📅</span> {formatDate(selectedDate)}
          </button>
        </div>

        {/* Giờ nhắc */}
        <div className="flex flex-col gap-2">
          <label className="text-[#075c09] font-semibold text-base">Giờ</label>
          <button 
            onClick={() => setShowTimeModal(true)}
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-left font-bold hover:bg-gray-50"
          >
            {selectedHour}:{selectedMinute}
          </button>
        </div>

        {/* Ghi chú */}
        <div className="flex flex-col gap-2">
          <label className="text-[#075c09] font-semibold text-base">Ghi chú</label>
          <textarea
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-800 h-24 resize-none outline-none focus:ring-2 focus:ring-[#075c09]/20"
            placeholder="Nhập ghi chú (tùy chọn)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={handleEditReminder}
            disabled={!reminderName.trim()}
            className={`w-full py-4 rounded-lg font-bold text-white transition-all shadow-md ${reminderName.trim() ? 'bg-[#075c09] active:scale-[0.98]' : 'bg-gray-300'}`}
          >
            Sửa lời nhắc
          </button>
          <button
            onClick={handleDeleteReminder}
            className="w-full py-4 rounded-lg font-bold text-white bg-[#e74c3c] active:scale-[0.98] shadow-md"
          >
            Xóa lời nhắc
          </button>
        </div>
      </main>

            {/* Tần suất Modal Overlay */}
      {showFrequencyModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-5 pb-8 animate-in slide-in-from-bottom duration-300">
            <h3 className="text-center font-bold text-[#075c09] text-lg mb-4">Tần suất nhắc nhở</h3>
            <div className="flex flex-col">
              {frequencyOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => { setFrequency(option.value as any); setShowFrequencyModal(false); }}
                  className={`py-4 px-3 text-left border-b border-gray-100 transition-colors ${frequency === option.value ? 'bg-[#E5F5E5] text-[#075c09] font-bold' : 'text-gray-800'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowFrequencyModal(false)} className="w-full mt-4 py-3 bg-[#075c09] text-white rounded-lg font-bold">Đóng</button>
          </div>
        </div>
      )}

      {/* Lịch Modal Overlay */}
      {showDateModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-5 pb-8">
            <div className="flex justify-between items-center mb-6 px-2">
              <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))} className="bg-[#075c09] text-white px-4 py-1 rounded-md">←</button>
              <span className="font-bold text-[#075c09]">{getMonthYearDisplay(selectedDate)}</span>
              <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))} className="bg-[#075c09] text-white px-4 py-1 rounded-md">→</button>
            </div>
            
            <div className="grid grid-cols-7 mb-2">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                <div key={day} className="text-center text-sm font-bold text-[#075c09] py-2">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {getCalendarDaysForMonth(selectedDate).map((date, i) => {
                const isSelected = date && selectedDate.toDateString() === date.toDateString();
                const isDisabled = date && isPastDate(date);
                return (
                  <button
                    key={i}
                    disabled={!date || isDisabled || false}
                    onClick={() => { if (date) { setSelectedDate(date); setShowDateModal(false); } }}
                    className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-all
                      ${isSelected ? 'bg-[#075c09] text-white font-bold' : 'hover:bg-gray-100'}
                      ${isDisabled ? 'opacity-20 cursor-not-allowed' : 'text-gray-800'}
                      ${!date ? 'invisible' : 'visible'}`}
                  >
                    {date?.getDate()}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setShowDateModal(false)} className="w-full mt-6 py-3 bg-[#075c09] text-white rounded-lg font-bold">Đóng</button>
          </div>
        </div>
      )}

      {/* Chọn giờ Modal Overlay */}
      {showTimeModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-5 pb-8">
            <h3 className="text-center font-bold text-[#075c09] text-lg mb-6">Chọn giờ</h3>
            <div className="flex gap-4 h-48 overflow-hidden">
              <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar border rounded-lg">
                <span className="text-center text-xs font-bold text-gray-400 py-1 sticky top-0 bg-white">Giờ</span>
                {hours.map(h => (
                  <button key={h} onClick={() => setSelectedHour(h)} className={`py-2 ${selectedHour === h ? 'bg-[#E5F5E5] text-[#075c09] font-bold' : 'text-gray-500'}`}>{h}</button>
                ))}
              </div>
              <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar border rounded-lg">
                <span className="text-center text-xs font-bold text-gray-400 py-1 sticky top-0 bg-white">Phút</span>
                {minutes.map(m => (
                  <button key={m} onClick={() => setSelectedMinute(m)} className={`py-2 ${selectedMinute === m ? 'bg-[#E5F5E5] text-[#075c09] font-bold' : 'text-gray-500'}`}>{m}</button>
                ))}
              </div>
            </div>
            <button onClick={() => setShowTimeModal(false)} className="w-full mt-6 py-3 bg-[#075c09] text-white rounded-lg font-bold">Xác nhận</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditNotificationScreen() {
  return (
    <Suspense fallback={<div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#075c09]" /></div>}>
      <EditNotificationContent />
    </Suspense>
  );
}
