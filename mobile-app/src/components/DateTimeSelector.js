import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';

export default function DateTimeSelector({
  timePeriod,
  selectedDate,
  customStartDate,
  customEndDate,
  showCalendar,
  currentCalendarMonth,
  selectingStartDate,
  
  // State setters
  setTimePeriod,
  setSelectedDate,
  setCustomStartDate,
  setCustomEndDate,
  setSelectingStartDate,
  setCurrentCalendarMonth,
  setConfirmedStartDate,
  setConfirmedEndDate,
  setShowCalendar,
}) {
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatCustomDate = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatCustomRange = () => {
    if (!customStartDate || !customEndDate) return '';
    return `${formatCustomDate(customStartDate)} đến ${formatCustomDate(customEndDate)}`;
  };

  const formatDate = (date) => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const months = ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6', 'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
    
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const dayName = isToday ? 'hôm nay' : days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName}, ngày ${day} ${month} năm ${year}`;
  };

  const formatMonth = (date) => {
    const months = ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6', 'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${month}/${year}`;
  };

  const formatYear = (date) => {
    return date.getFullYear().toString();
  };

  const getDateRangeText = () => {
    if (timePeriod === 'day') {
      return formatDate(selectedDate);
    } else if (timePeriod === 'week') {
      const weekStart = new Date(selectedDate);
      weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}/${weekEnd.getFullYear()}`;
    } else if (timePeriod === 'month') {
      return formatMonth(selectedDate);
    } else if (timePeriod === 'year') {
      return formatYear(selectedDate);
    } else if (timePeriod === 'custom' && customStartDate && customEndDate) {
      return `${formatCustomDate(customStartDate)} đến ${formatCustomDate(customEndDate)}`;
    }
  };

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const handlePreviousYear = () => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(newDate.getFullYear() - 1);
    setSelectedDate(newDate);
  };

  const handleNextYear = () => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(newDate.getFullYear() + 1);
    setSelectedDate(newDate);
  };

  const handlePreviousCalendarMonth = () => {
    const newDate = new Date(currentCalendarMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentCalendarMonth(newDate);
  };

  const handleNextCalendarMonth = () => {
    const newDate = new Date(currentCalendarMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentCalendarMonth(newDate);
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day);
    if (selectingStartDate) {
      setCustomStartDate(newDate);
      setSelectingStartDate(false);
    } else {
      if (newDate < customStartDate) {
        setCustomEndDate(customStartDate);
        setCustomStartDate(newDate);
      } else {
        setCustomEndDate(newDate);
      }
      setSelectingStartDate(true);
    }
  };

  const handleConfirmCustomRange = () => {
    if (customStartDate && customEndDate) {
      setConfirmedStartDate(customStartDate);
      setConfirmedEndDate(customEndDate);
      setShowCalendar(false);
    }
  };

  const handleCancelCustomRange = () => {
    setCustomStartDate(null);
    setCustomEndDate(null);
    setSelectingStartDate(true);
    setShowCalendar(false);
  };

  const selectDay = () => {
    setTimePeriod('day');
    setSelectedDate(new Date());
  };

  const selectWeek = () => {
    setTimePeriod('week');
    setSelectedDate(new Date());
  };

  const selectMonth = () => {
    setTimePeriod('month');
    setSelectedDate(new Date());
  };

  const selectYear = () => {
    setTimePeriod('year');
    setSelectedDate(new Date());
  };

  const selectCustomDateRange = () => {
    setTimePeriod('custom');
    setCurrentCalendarMonth(new Date());
    setCustomStartDate(null);
    setCustomEndDate(null);
    setSelectingStartDate(true);
    setShowCalendar(true);
  };

  const isCurrentWeek = () => {
    const today = new Date();
    const { start, end } = getWeekRange(selectedDate);
    return today >= start && today <= end;
  };

  const isCurrentMonth = () => {
    const today = new Date();
    return selectedDate.getMonth() === today.getMonth() && selectedDate.getFullYear() === today.getFullYear();
  };

  const isCurrentYear = () => {
    const today = new Date();
    return selectedDate.getFullYear() === today.getFullYear();
  };

  const getWeekRange = (date) => {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 6);
    return { start, end };
  };

  const getNavigationButtons = () => {
    const today = new Date();
    if (timePeriod === 'day') {
      return {
        showPrev: true,
        showNext: selectedDate.toDateString() !== today.toDateString(),
        handlePrev: handlePreviousDay,
        handleNext: handleNextDay,
      };
    } else if (timePeriod === 'week') {
      return {
        showPrev: true,
        showNext: !isCurrentWeek(),
        handlePrev: handlePreviousWeek,
        handleNext: handleNextWeek,
      };
    } else if (timePeriod === 'month') {
      return {
        showPrev: true,
        showNext: !isCurrentMonth(),
        handlePrev: handlePreviousMonth,
        handleNext: handleNextMonth,
      };
    } else if (timePeriod === 'year') {
      return {
        showPrev: true,
        showNext: !isCurrentYear(),
        handlePrev: handlePreviousYear,
        handleNext: handleNextYear,
      };
    }
  };

  const navButtons = getNavigationButtons();

  return (
    <>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true}
        style={styles.timePeriodScrollContainer}
      >
        <View style={styles.timePeriodContainer}>
          <TouchableOpacity 
            style={[styles.timePeriodButton, timePeriod === 'day' && styles.timePeriodButtonActive]}
            onPress={selectDay}
          >
            <Text style={[styles.timePeriodText, timePeriod === 'day' && styles.timePeriodTextActive]}>Ngày</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.timePeriodButton, timePeriod === 'week' && styles.timePeriodButtonActive]}
            onPress={selectWeek}
          >
            <Text style={[styles.timePeriodText, timePeriod === 'week' && styles.timePeriodTextActive]}>Tuần</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.timePeriodButton, timePeriod === 'month' && styles.timePeriodButtonActive]}
            onPress={selectMonth}
          >
            <Text style={[styles.timePeriodText, timePeriod === 'month' && styles.timePeriodTextActive]}>Tháng</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.timePeriodButton, timePeriod === 'year' && styles.timePeriodButtonActive]}
            onPress={selectYear}
          >
            <Text style={[styles.timePeriodText, timePeriod === 'year' && styles.timePeriodTextActive]}>Năm</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.timePeriodButton, timePeriod === 'custom' && styles.timePeriodButtonActive]}
            onPress={selectCustomDateRange}
          >
            <Text style={[styles.timePeriodText, timePeriod === 'custom' && styles.timePeriodTextActive]}>Tùy chọn</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.dateRangeContainer}>
        <View style={styles.arrowContainer}>
          {navButtons && navButtons.showPrev && (
            <TouchableOpacity onPress={navButtons.handlePrev}>
              <Text style={styles.arrowButton}>❮</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.dateDisplay}>
          <Text style={styles.dateRangeText}>{getDateRangeText()}</Text>
        </View>
        <View style={styles.arrowContainer}>
          {navButtons && navButtons.showNext && (
            <TouchableOpacity onPress={navButtons.handleNext}>
              <Text style={styles.arrowButton}>❯</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {timePeriod === 'custom' && showCalendar && (
        <View style={styles.customDateContainer}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={handlePreviousCalendarMonth}>
              <Text style={styles.calendarArrow}>❮</Text>
            </TouchableOpacity>
            <Text style={styles.calendarMonth}>
              {currentCalendarMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={handleNextCalendarMonth}>
              <Text style={styles.calendarArrow}>❯</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calendarDaysHeader}>
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
              <Text key={idx} style={styles.dayHeader}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarDays}>
            {Array(getFirstDayOfMonth(currentCalendarMonth)).fill(null).map((_, idx) => (
              <View key={`empty-${idx}`} style={styles.calendarDay}></View>
            ))}
            {Array(getDaysInMonth(currentCalendarMonth)).fill(null).map((_, idx) => {
              const day = idx + 1;
              const dateObj = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day);
              const isStartDate = customStartDate && dateObj.toDateString() === customStartDate.toDateString();
              const isEndDate = customEndDate && dateObj.toDateString() === customEndDate.toDateString();
              const isInRange = customStartDate && customEndDate && dateObj > customStartDate && dateObj < customEndDate;
              
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.calendarDay,
                    isStartDate && styles.calendarDaySelected,
                    isEndDate && styles.calendarDaySelected,
                    isInRange && styles.calendarDayInRange
                  ]}
                  onPress={() => handleDateSelect(day)}
                >
                  <Text style={[styles.calendarDayText, (isStartDate || isEndDate) && styles.calendarDaySelectedText]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {customStartDate && customEndDate && (
            <View style={styles.selectedRangeDisplay}>
              <Text style={styles.selectedRangeText}>{formatCustomRange()}</Text>
            </View>
          )}

          <View style={styles.calendarButtonContainer}>
            <TouchableOpacity 
              style={styles.calendarButton}
              onPress={handleCancelCustomRange}
            >
              <Text style={styles.calendarButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.calendarButton, styles.calendarButtonOK, !customStartDate || !customEndDate ? styles.calendarButtonDisabled : null]}
              onPress={handleConfirmCustomRange}
              disabled={!customStartDate || !customEndDate}
            >
              <Text style={[styles.calendarButtonText, styles.calendarButtonOKText]}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  timePeriodScrollContainer: { marginBottom: 15 },
  timePeriodContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, gap: 6 },
  timePeriodButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', minWidth: 70 },
  timePeriodButtonActive: { backgroundColor: '#075c09', borderColor: '#075c09' },
  timePeriodText: { fontSize: 14, color: '#666', fontWeight: '500' },
  timePeriodTextActive: { color: '#fff' },
  dateRangeContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 15, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 4, borderLeftColor: '#075c09', marginBottom: 15, borderRadius: 8 },
  arrowContainer: { width: 44, alignItems: 'center', justifyContent: 'center' },
  dateDisplay: { flex: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 10 },
  dateRangeText: { fontSize: 14, color: '#075c09', fontWeight: '600', textAlign: 'center' },
  arrowButton: { fontSize: 24, color: '#075c09', fontWeight: 'bold' },
  customDateContainer: { backgroundColor: '#fff', padding: 15, marginBottom: 15, borderRadius: 8 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  calendarArrow: { fontSize: 20, color: '#075c09', fontWeight: 'bold' },
  calendarMonth: { fontSize: 16, fontWeight: '600', color: '#075c09' },
  calendarDaysHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  dayHeader: { fontSize: 12, color: '#666', fontWeight: '600', width: '14.28%', textAlign: 'center' },
  calendarDays: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  calendarDay: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginVertical: 5 },
  calendarDayText: { fontSize: 14, color: '#333', fontWeight: '500' },
  calendarDaySelected: { backgroundColor: '#075c09' },
  calendarDaySelectedText: { color: '#fff' },
  calendarDayInRange: { backgroundColor: 'rgba(7, 92, 9, 0.2)' },
  selectedRangeDisplay: { paddingVertical: 10, paddingHorizontal: 15, backgroundColor: 'rgba(7, 92, 9, 0.1)', borderRadius: 8, marginBottom: 15 },
  selectedRangeText: { color: '#075c09', fontWeight: '600', fontSize: 14 },
  calendarButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  calendarButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#075c09', alignItems: 'center' },
  calendarButtonOK: { backgroundColor: '#075c09' },
  calendarButtonDisabled: { opacity: 0.5 },
  calendarButtonText: { fontSize: 16, fontWeight: '600', color: '#075c09' },
  calendarButtonOKText: { color: '#fff' },
});
