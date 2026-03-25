import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Modal, FlatList } from 'react-native';

export default function AddNotification({ navigation }) {
  const [reminderName, setReminderName] = useState('');
  const [frequency, setFrequency] = useState('weekly');
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedHour, setSelectedHour] = useState('08');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [notes, setNotes] = useState('');

  const frequencyOptions = [
    { label: 'Hàng ngày', value: 'daily' },
    { label: 'Hàng tuần', value: 'weekly' },
    { label: 'Hàng tháng', value: 'monthly' },
    { label: 'Một lần', value: 'once' },
  ];

  // Format date for display
  const formatDate = (date) => {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Get calendar days for a specific month
  const getCalendarDaysForMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days = [];
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days in the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  // Check if date is in the past
  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  // Get month and year display
  const getMonthYearDisplay = (date) => {
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Generate time options
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const handleCreateReminder = () => {
    if (reminderName.trim()) {
      const time = `${selectedHour}:${selectedMinute}`;
      console.log('Tạo lời nhắc:', { reminderName, frequency, startDate: formatDate(selectedDate), time, notes });
      navigation.goBack();
    }
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.container} scrollEnabled={true}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerMenu} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerText}>Thêm lời nhắc</Text>
          </View>
          <View style={styles.headerSpacer}></View>
        </View>

        {/* Form Content */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên lời nhắc <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên lời nhắc"
              placeholderTextColor="#ccc"
              value={reminderName}
              onChangeText={setReminderName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tần suất nhắc nhở</Text>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => setShowFrequencyModal(true)}
            >
              <Text style={styles.selectButtonText}>
                {frequencyOptions.find(opt => opt.value === frequency)?.label}
              </Text>
            </TouchableOpacity>

            <Modal
              visible={showFrequencyModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowFrequencyModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Tần suất nhắc nhở</Text>
                  {frequencyOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.modalOption,
                        frequency === option.value && styles.modalOptionSelected,
                      ]}
                      onPress={() => {
                        setFrequency(option.value);
                        setShowFrequencyModal(false);
                      }}
                    >
                      <Text style={[
                        styles.modalOptionText,
                        frequency === option.value && styles.modalOptionTextSelected,
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={() => setShowFrequencyModal(false)}
                  >
                    <Text style={styles.modalCloseButtonText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ngày bắt đầu nhắc nhở</Text>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => setShowDateModal(true)}
            >
              <Text style={styles.selectButtonText}>📅 {formatDate(selectedDate)}</Text>
            </TouchableOpacity>

            <Modal
              visible={showDateModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowDateModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.dateModalContent}>
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity 
                      style={styles.monthNavButton}
                      onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                    >
                      <Text style={styles.monthNavButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.monthYearText}>{getMonthYearDisplay(selectedDate)}</Text>
                    <TouchableOpacity 
                      style={styles.monthNavButton}
                      onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                    >
                      <Text style={styles.monthNavButtonText}>→</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.calendarDaysHeader}>
                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                      <Text key={day} style={styles.dayNameText}>{day}</Text>
                    ))}
                  </View>

                  <View style={styles.calendarGrid}>
                    {getCalendarDaysForMonth(selectedDate).map((date, index) => {
                      const isSelected = date && selectedDate.toDateString() === date.toDateString();
                      const isDisabled = date && isPastDate(date);
                      
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.calendarDayCell,
                            isSelected && styles.calendarDayCellSelected,
                            isDisabled && styles.calendarDayCellDisabled,
                          ]}
                          onPress={() => {
                            if (date && !isDisabled) {
                              setSelectedDate(date);
                              setShowDateModal(false);
                            }
                          }}
                          disabled={isDisabled}
                        >
                          {date && (
                            <Text style={[
                              styles.calendarDayText,
                              isSelected && styles.calendarDayTextSelected,
                              isDisabled && styles.calendarDayTextDisabled,
                            ]}>
                              {date.getDate()}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={() => setShowDateModal(false)}
                  >
                    <Text style={styles.modalCloseButtonText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Giờ</Text>
            <View style={styles.timePickerContainer}>
              <TouchableOpacity 
                style={styles.timeSelectButton}
                onPress={() => setShowTimeModal(true)}
              >
                <Text style={styles.timeSelectButtonText}>{selectedHour}:{selectedMinute}</Text>
              </TouchableOpacity>
            </View>

            <Modal
              visible={showTimeModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowTimeModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.timeModalContent}>
                  <Text style={styles.modalTitle}>Chọn giờ</Text>
                  <View style={styles.timePickerWrapper}>
                    <View style={styles.timeColumn}>
                      <Text style={styles.timeColumnLabel}>Giờ</Text>
                      <ScrollView style={styles.timeScrollView}>
                        {hours.map((hour) => (
                          <TouchableOpacity
                            key={hour}
                            style={[
                              styles.timeOption,
                              selectedHour === hour && styles.timeOptionSelected,
                            ]}
                            onPress={() => setSelectedHour(hour)}
                          >
                            <Text style={[
                              styles.timeOptionText,
                              selectedHour === hour && styles.timeOptionTextSelected,
                            ]}>
                              {hour}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                    <View style={styles.timeColumn}>
                      <Text style={styles.timeColumnLabel}>Phút</Text>
                      <ScrollView style={styles.timeScrollView}>
                        {minutes.map((minute) => (
                          <TouchableOpacity
                            key={minute}
                            style={[
                              styles.timeOption,
                              selectedMinute === minute && styles.timeOptionSelected,
                            ]}
                            onPress={() => setSelectedMinute(minute)}
                          >
                            <Text style={[
                              styles.timeOptionText,
                              selectedMinute === minute && styles.timeOptionTextSelected,
                            ]}>
                              {minute}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={() => setShowTimeModal(false)}
                  >
                    <Text style={styles.modalCloseButtonText}>Xác nhận</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Nhập ghi chú (tùy chọn)"
              placeholderTextColor="#ccc"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, !reminderName.trim() && styles.submitButtonDisabled]}
            onPress={handleCreateReminder}
            disabled={!reminderName.trim()}
          >
            <Text style={styles.submitButtonText}>Tạo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: { 
    backgroundColor: '#075c09', 
    padding: 20, 
    paddingTop: 30, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  headerMenu: { paddingHorizontal: 10, paddingVertical: 10 },
  backArrow: { 
    fontSize: 28, 
    color: '#fff',
    fontWeight: 'bold',
  },
  headerContent: { flex: 1, alignItems: 'center', paddingRight: 30, justifyContent: 'center' },
  headerText: { color: '#fff', fontSize: 20 },
  headerSpacer: { width: 50 },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#075c09',
    marginBottom: 8,
  },
  required: {
    color: '#e74c3c',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  selectButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#333',
  },
  timePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  timeSelectButton: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  timeSelectButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  dateModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  timeModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#075c09',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionSelected: {
    backgroundColor: '#E5F5E5',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOptionTextSelected: {
    color: '#075c09',
    fontWeight: '600',
  },
  dateScrollView: {
    maxHeight: 300,
    marginBottom: 15,
  },
  dateOption: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateOptionSelected: {
    backgroundColor: '#E5F5E5',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#333',
  },
  dateOptionTextSelected: {
    color: '#075c09',
    fontWeight: '600',
  },
  timePickerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  timeColumnLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#075c09',
    textAlign: 'center',
    marginBottom: 8,
  },
  timeScrollView: {
    height: 200,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  timeOption: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeOptionSelected: {
    backgroundColor: '#E5F5E5',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#333',
  },
  timeOptionTextSelected: {
    color: '#075c09',
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 15,
    backgroundColor: '#075c09',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textarea: {
    paddingVertical: 12,
    height: 80,
  },
  submitButton: {
    backgroundColor: '#075c09',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  monthNavButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#075c09',
    borderRadius: 6,
  },
  monthNavButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#075c09',
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  dayNameText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#075c09',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  calendarDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 5,
  },
  calendarDayCellSelected: {
    backgroundColor: '#075c09',
  },
  calendarDayCellDisabled: {
    opacity: 0.4,
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  calendarDayTextDisabled: {
    color: '#999',
  },
});
