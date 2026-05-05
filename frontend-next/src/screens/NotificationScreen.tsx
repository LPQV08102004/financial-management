"use client";

import React, { useState } from 'react';
import SidebarDrawer from '../components/SidebarDrawer';
import HeaderIconButton from '../components/HeaderIconButton';
import Footer from '../components/Footer';

// Định nghĩa kiểu dữ liệu cho lời nhắc
interface Reminder {
  id: string;
  title: string;
  enabled: boolean;
}

export default function NotificationScreen() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Quản lý trạng thái lời nhắc
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: '1',
      title: 'Đóng tiền quỹ',
      enabled: true,
    },
    {
      id: '2',
      title: 'Lời nhắc đóng tiền điện',
      enabled: true,
    },
  ]);

  const toggleReminder = (id: string) => {
    setReminders(reminders.map(reminder =>
      reminder.id === id ? { ...reminder, enabled: !reminder.enabled } : reminder
    ));
  };

  const deleteReminder = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa lời nhắc này?")) {
      setReminders(reminders.filter(reminder => reminder.id !== id));
    }
  };

  return (
    <div className="flex flex-col bg-[#FFF8F0] relative overflow-x-hidden">
      {/* Sidebar Drawer */}
      <SidebarDrawer 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Header[cite: 10] */}
      <header className="bg-[#075c09] p-5 pt-8 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <button 
          className="flex flex-col gap-1 px-2 py-2 group" 
          onClick={() => setSidebarOpen(true)}
        >
          <div className="w-6 h-[3px] bg-white rounded-full group-hover:opacity-80"></div>
          <div className="w-6 h-[3px] bg-white rounded-full group-hover:opacity-80"></div>
          <div className="w-6 h-[3px] bg-white rounded-full group-hover:opacity-80"></div>
        </button>
        
        <div className="flex-1 flex justify-center translate-x-2">
          <h1 className="text-white text-xl font-medium tracking-wide">Nhắc nhở</h1>
        </div>

        <HeaderIconButton 
          icon="+" 
          onPress={() => console.log('Navigate to AddNotification')}
        />
      </header>

      {/* Content[cite: 10] */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        <div className="space-y-3">
          {reminders.length > 0 ? (
            reminders.map((item) => (
              <div 
                key={item.id}
                className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border border-gray-50 transition-all active:scale-[0.98]"
              >
                {/* Reminder Title[cite: 10] */}
                <div className="flex-1 cursor-pointer" onClick={() => console.log('Edit', item.id)}>
                  <span className={`text-base font-semibold transition-colors ${
                    item.enabled ? 'text-[#075c09]' : 'text-gray-400 line-through'
                  }`}>
                    {item.title}
                  </span>
                </div>

                {/* Actions[cite: 10] */}
                <div className="flex items-center gap-3">
                  {/* Custom Toggle Switch */}
                  <button 
                    onClick={() => toggleReminder(item.id)}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out ${
                      item.enabled ? 'bg-[#075c09]' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                      item.enabled ? 'left-6' : 'left-1'
                    }`}></div>
                  </button>

                  {/* Delete Button[cite: 10] */}
                  <button 
                    onClick={() => deleteReminder(item.id)}
                    className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#e74c3c] hover:bg-red-100 transition-colors"
                  >
                    <span className="text-xl font-bold">✕</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            /* Empty State[cite: 10] */
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-4xl mb-4 grayscale opacity-30">🔔</div>
              <p className="text-gray-400 text-base">Không có lời nhắc nào</p>
            </div>
          )}
        </div>
      </main>

          </div>
  );
}
