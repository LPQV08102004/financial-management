"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  listReminders, updateReminder, deleteReminder,
  generateNotifications, listNotifications, markRead, markAllRead, deleteNotification,
} from '../api/notificationsApi';

interface Reminder {
  id: number;
  name: string;
  frequency: string;
  start_date: string;
  reminder_time?: string;
  note?: string;
  is_enabled: boolean;
  next_trigger_date?: string;
}

interface SystemNotification {
  id: number;
  type: string;
  display_type: string;
  title: string;
  content?: string;
  is_read: boolean;
  created_at: string;
}

const FREQ_LABEL: Record<string, string> = {
  daily: 'Hàng ngày',
  weekly: 'Hàng tuần',
  monthly: 'Hàng tháng',
  once: 'Một lần',
};

const TABS = [
  { key: 'reminders', label: 'Lời nhắc' },
  { key: 'system', label: 'Thông báo hệ thống' },
];

export default function NotificationScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('reminders');

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(true);

  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const fetchReminders = useCallback(async (silent = false) => {
    if (!silent) setLoadingReminders(true);
    try {
      const data = await listReminders();
      setReminders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingReminders(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      generateNotifications().catch(() => {});
      const data = await listNotifications();
      setNotifications(data?.items ?? []);
      setUnreadCount(data?.unread_count ?? 0);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);
  useEffect(() => {
    if (activeTab === 'system') fetchNotifications();
  }, [activeTab, fetchNotifications]);

  const toggleReminder = async (item: Reminder) => {
    try {
      const updated = await updateReminder(item.id, { is_enabled: !item.is_enabled });
      setReminders(prev => prev.map(r => r.id === item.id ? updated : r));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteReminder = async (item: Reminder) => {
    if (!confirm(`Bạn có chắc muốn xóa "${item.name}"?`)) return;
    try {
      await deleteReminder(item.id);
      setReminders(prev => prev.filter(r => r.id !== item.id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleMarkRead = async (notif: SystemNotification) => {
    if (notif.is_read) return;
    try {
      const updated = await markRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? updated : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {  }
  };

  const handleDeleteNotif = async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const fmtDate = (s: string) => {
    if (!s) return '';
    const d = new Date(s);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const fmtDateTime = (s: string) => {
    if (!s) return '';
    const d = new Date(s);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col bg-[#f5f5f5] min-h-screen">
      <header className="bg-[#075c09] text-white px-5 py-4 flex items-center gap-3 shadow-sm sticky top-0 z-30">
        <button
          onClick={() => window.history.back()}
          className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors text-xl"
        >
          &#8592;
        </button>
        <h1 className="text-lg font-bold flex-1">Nhắc nhở &amp; Thông báo</h1>
        {activeTab === 'reminders' && (
          <button
            onClick={() => router.push('/add-notification')}
            className="w-9 h-9 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-xl font-bold"
          >
            +
          </button>
        )}
        {activeTab === 'system' && unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-semibold transition-colors"
          >
            Đọc tất cả
          </button>
        )}
      </header>

      <div className="flex bg-white border-b shadow-sm">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3.5 text-sm font-bold transition-all border-b-2 ${
              activeTab === tab.key
                ? 'border-[#075c09] text-[#075c09]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
            {tab.key === 'system' && unreadCount > 0 && (
              <span
                className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.key ? 'bg-[#075c09] text-white' : 'bg-red-100 text-red-600'
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 p-3 overflow-y-auto">
        {activeTab === 'reminders' && (
          loadingReminders ? (
            <div className="flex justify-center mt-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#075c09]" />
            </div>
          ) : reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-5xl mb-4 opacity-40">&#128276;</span>
              <p className="text-sm text-center">Không có lời nhắc nào<br />Nhấn + để thêm mới</p>
            </div>
          ) : (
            reminders.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-50 cursor-pointer"
                onClick={() => router.push(`/edit-notification?id=${item.id}`)}
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className={`font-semibold text-sm truncate ${item.is_enabled ? 'text-[#075c09]' : 'text-gray-400 line-through'}`}>
                    {item.name}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {FREQ_LABEL[item.frequency] ?? item.frequency}
                    {item.reminder_time && ` · ${item.reminder_time}`}
                    {item.next_trigger_date && ` · ${fmtDate(item.next_trigger_date)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => toggleReminder(item)}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${
                      item.is_enabled ? 'bg-[#075c09]' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                        item.is_enabled ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleDeleteReminder(item)}
                    className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors flex-shrink-0"
                  >
                    &#10005;
                  </button>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'system' && (
          loadingNotifs ? (
            <div className="flex justify-center mt-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#075c09]" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-5xl mb-4 opacity-40">&#128235;</span>
              <p className="text-sm text-center">Không có thông báo nào</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 bg-white rounded-xl p-4 mb-3 shadow-sm border-l-4 cursor-pointer transition-colors ${
                  notif.is_read ? 'border-gray-200 opacity-70' : 'border-[#075c09]'
                }`}
                onClick={() => handleMarkRead(notif)}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${notif.is_read ? 'text-gray-500' : 'text-gray-800'}`}>
                    {notif.title}
                    {!notif.is_read && (
                      <span className="ml-2 inline-block w-2 h-2 rounded-full bg-[#075c09] align-middle" />
                    )}
                  </p>
                  {notif.content && (
                    <p className="text-xs text-gray-500 mt-1">{notif.content}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">{fmtDateTime(notif.created_at)}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteNotif(notif.id); }}
                  className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-400 transition-colors flex-shrink-0 text-xs"
                >
                  &#10005;
                </button>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
