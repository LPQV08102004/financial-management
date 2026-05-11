"use client";

import React from 'react';

interface DateTimeSelectorProps {
  timePeriod: 'day' | 'week' | 'month' | 'year' | 'custom';
  selectedDate: Date;
  customStartDate: Date | null;
  customEndDate: Date | null;
  showCalendar: boolean;
  currentCalendarMonth: Date;
  selectingStartDate: boolean;

  setTimePeriod: (period: 'day' | 'week' | 'month' | 'year' | 'custom') => void;
  setSelectedDate: (date: Date) => void;
  setCustomStartDate: (date: Date | null) => void;
  setCustomEndDate: (date: Date | null) => void;
  setSelectingStartDate: (val: boolean) => void;
  setCurrentCalendarMonth: (date: Date) => void;
  setConfirmedStartDate: (date: Date | null) => void;
  setConfirmedEndDate: (date: Date | null) => void;
  setShowCalendar: (val: boolean) => void;
}

export default function DateTimeSelector({
  timePeriod,
  selectedDate,
  customStartDate,
  customEndDate,
  showCalendar,
  currentCalendarMonth,
  selectingStartDate,
  setTimePeriod,
  setSelectedDate,
  setCustomStartDate,
  setCustomEndDate,
  setSelectingStartDate,
  setCurrentCalendarMonth,
  setConfirmedStartDate,
  setConfirmedEndDate,
  setShowCalendar,
}: DateTimeSelectorProps) {

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const formatCustomDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const formatted = date.toLocaleDateString('vi-VN', options);
    return isToday ? `Hôm nay, ${formatted.split(',')[1]}` : formatted;
  };

  const getDateRangeText = () => {
    if (timePeriod === 'day') return formatDate(selectedDate);
    if (timePeriod === 'week') {
      const start = new Date(selectedDate);
      start.setDate(selectedDate.getDate() - selectedDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
    }
    if (timePeriod === 'month') return selectedDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    if (timePeriod === 'year') return selectedDate.getFullYear().toString();
    if (timePeriod === 'custom' && customStartDate && customEndDate) {
      return `${formatCustomDate(customStartDate)} đến ${formatCustomDate(customEndDate)}`;
    }
    return "Chọn khoảng thời gian";
  };

  const handleNav = (offset: number, unit: 'day' | 'week' | 'month' | 'year') => {
    const newDate = new Date(selectedDate);
    if (unit === 'day') newDate.setDate(newDate.getDate() + offset);
    if (unit === 'week') newDate.setDate(newDate.getDate() + (offset * 7));
    if (unit === 'month') newDate.setMonth(newDate.getMonth() + offset);
    if (unit === 'year') newDate.setFullYear(newDate.getFullYear() + offset);
    setSelectedDate(newDate);
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day);
    if (selectingStartDate) {
      setCustomStartDate(newDate);
      setCustomEndDate(null);
      setSelectingStartDate(false);
    } else {
      if (customStartDate && newDate < customStartDate) {
        setCustomEndDate(customStartDate);
        setCustomStartDate(newDate);
      } else {
        setCustomEndDate(newDate);
      }
      setSelectingStartDate(true);
    }
  };

  const isNextDisabled = () => {
    const today = new Date();
    if (timePeriod === 'day') return selectedDate.toDateString() === today.toDateString();
    if (timePeriod === 'month') return selectedDate.getMonth() === today.getMonth() && selectedDate.getFullYear() === today.getFullYear();
    if (timePeriod === 'year') return selectedDate.getFullYear() === today.getFullYear();
    return false;
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {}
      <div className="flex bg-white p-2 rounded-xl shadow-sm border border-gray-100 justify-between gap-1">
        {['day', 'week', 'month', 'year', 'custom'].map((p) => (
          <button
            key={p}
            onClick={() => {
              if (p === 'custom') {
                setTimePeriod('custom');
                setShowCalendar(true);
              } else {
                setTimePeriod(p as any);
                setSelectedDate(new Date());
              }
            }}
            className={`flex-1 py-2 px-1 text-xs md:text-sm font-medium rounded-full transition-all ${
              timePeriod === p
                ? 'bg-[#075c09] text-white shadow-md'
                : 'bg-transparent text-gray-500 hover:bg-gray-50'
            }`}
          >
            {p === 'day' && 'Ngày'}
            {p === 'week' && 'Tuần'}
            {p === 'month' && 'Tháng'}
            {p === 'year' && 'Năm'}
            {p === 'custom' && 'Tùy chọn'}
          </button>
        ))}
      </div>

      {}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-[#075c09]">
        <button
          onClick={() => handleNav(-1, timePeriod as any)}
          className="w-10 h-10 flex items-center justify-center text-[#075c09] hover:bg-gray-100 rounded-full font-bold"
        >
          ❮
        </button>

        <span className="text-sm md:text-base font-semibold text-[#075c09] text-center px-2">
          {getDateRangeText()}
        </span>

        <button
          onClick={() => handleNav(1, timePeriod as any)}
          disabled={isNextDisabled()}
          className={`w-10 h-10 flex items-center justify-center text-[#075c09] rounded-full font-bold ${
            isNextDisabled() ? 'opacity-20 cursor-not-allowed' : 'hover:bg-gray-100'
          }`}
        >
          ❯
        </button>
      </div>

      {}
      {timePeriod === 'custom' && showCalendar && (
        <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setCurrentCalendarMonth(new Date(currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() - 1)))}
              className="p-2 text-[#075c09] hover:bg-green-50 rounded-lg"
            >
              ❮
            </button>
            <h3 className="font-bold text-[#075c09] capitalize">
              {currentCalendarMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => setCurrentCalendarMonth(new Date(currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + 1)))}
              className="p-2 text-[#075c09] hover:bg-green-50 rounded-lg"
            >
              ❯
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
              <div key={day} className="text-center text-[10px] font-bold text-gray-400 py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {}
            {Array.from({ length: getFirstDayOfMonth(currentCalendarMonth) }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {}
            {Array.from({ length: getDaysInMonth(currentCalendarMonth) }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day);
              const isSelected = (customStartDate?.toDateString() === dateObj.toDateString()) || (customEndDate?.toDateString() === dateObj.toDateString());
              const inRange = customStartDate && customEndDate && dateObj > customStartDate && dateObj < customEndDate;

              return (
                <button
                  key={day}
                  onClick={() => handleDateSelect(day)}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-colors ${
                    isSelected
                      ? 'bg-[#075c09] text-white font-bold'
                      : inRange
                        ? 'bg-green-100 text-[#075c09]'
                        : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowCalendar(false)}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              disabled={!customStartDate || !customEndDate}
              onClick={() => {
                setConfirmedStartDate(customStartDate);
                setConfirmedEndDate(customEndDate);
                setShowCalendar(false);
              }}
              className="flex-1 py-2.5 bg-[#075c09] text-white rounded-xl hover:bg-[#054006] font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Xác nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
}