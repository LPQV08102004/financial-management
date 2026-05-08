import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Modal,
} from 'react-native';
import Footer from '../components/Footer';
import { createTemplate, updateTemplate } from '../api/recurringApi';
import { listAccounts } from '../api/accountsApi';
import { listCategories } from '../api/categoriesApi';

const FREQUENCIES = [
  { key: 'daily',   label: 'Hàng ngày' },
  { key: 'weekly',  label: 'Hàng tuần' },
  { key: 'monthly', label: 'Hàng tháng' },
  { key: 'yearly',  label: 'Hàng năm' },
];

const TYPES = [
  { key: 'income',  label: 'Thu nhập', color: '#075c09' },
  { key: 'expense', label: 'Chi tiêu', color: '#CC3300' },
];

// "DD/MM/YYYY" → "YYYY-MM-DD" or null
const _parseDate = (str) => {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length !== 3 || parts[2].length !== 4) return null;
  const iso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  if (isNaN(Date.parse(iso))) return null;
  return iso;
};

// "YYYY-MM-DD" → "DD/MM/YYYY"
const _isoToDisplay = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const _todayDisplay = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const _todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Get calendar days for a specific month
const _getCalendarDaysForMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  return days;
};

// Check if date is in the past
const _isPastDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
};

// Get month and year display
const _getMonthYearDisplay = (date) => {
  const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, required, children }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}{required ? ' *' : ''}</Text>
      {children}
    </View>
  );
}

function ChipRow({ options, selected, onSelect, colorMap }) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const isActive = selected === opt.key;
        const activeColor = colorMap?.[opt.key] || '#075c09';
        return (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.chip,
              isActive && { borderColor: activeColor, backgroundColor: activeColor + '18' },
            ]}
            onPress={() => onSelect(opt.key)}
          >
            <Text style={[styles.chipText, isActive && { color: activeColor, fontWeight: '700' }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function AddRecurringScreen({ navigation, route }) {
  const existing = route.params?.template ?? null;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState(existing?.type ?? 'expense');
  const [amount, setAmount] = useState(existing ? String(Number(existing.amount).toLocaleString('vi-VN')) : '');
  const [frequency, setFrequency] = useState(existing?.frequency ?? 'monthly');
  const [startDate, setStartDate] = useState(existing ? _isoToDisplay(existing.start_date) : _todayDisplay());
  const [endDate, setEndDate] = useState(existing?.end_date ? _isoToDisplay(existing.end_date) : '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showEndDateModal, setShowEndDateModal] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(
    existing && existing.start_date ? new Date(existing.start_date) : new Date()
  );
  const [selectedEndDate, setSelectedEndDate] = useState(
    existing && existing.end_date ? new Date(existing.end_date) : new Date()
  );

  useEffect(() => {
    Promise.all([
      listAccounts(),
      listCategories(type),
    ]).then(([accs, cats]) => {
      const accList = Array.isArray(accs) ? accs : (accs.items ?? []);
      setAccounts(accList);
      setCategories(cats || []);

      // Pre-select from existing template
      if (existing) {
        setSelectedAccount(accList.find((a) => a.id === existing.account_id) ?? null);
        setSelectedCategory(cats.find((c) => c.id === existing.category_id) ?? null);
      } else {
        setSelectedAccount(accList[0] ?? null);
      }
    }).catch((e) => Alert.alert('Lỗi', e.message))
      .finally(() => setLoadingData(false));
  }, []);

  // Re-fetch categories when type changes
  const handleTypeChange = async (newType) => {
    setType(newType);
    setSelectedCategory(null);
    try {
      const cats = await listCategories(newType);
      setCategories(cats || []);
    } catch (_) {}
  };

  // Format amount with thousand separators (Vietnamese locale)
  const handleAmountChange = (text) => {
    // Remove all non-numeric characters
    const numericOnly = text.replace(/\D/g, '');
    
    if (numericOnly === '') {
      setAmount('');
      return;
    }
    
    // Format with thousand separators using Vietnamese locale
    const formatted = Number(numericOnly).toLocaleString('vi-VN');
    setAmount(formatted);
  };

  const validate = () => {
    if (!name.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập tên giao dịch'); return null; }
    const rawAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    if (!rawAmount || rawAmount <= 0) { Alert.alert('Lỗi', 'Số tiền không hợp lệ'); return null; }
    if (!selectedAccount) { Alert.alert('Lỗi', 'Vui lòng chọn tài khoản'); return null; }
    const isoStart = _parseDate(startDate);
    if (!isoStart) { Alert.alert('Lỗi', 'Ngày bắt đầu không hợp lệ (DD/MM/YYYY)'); return null; }
    let isoEnd = null;
    if (endDate.trim()) {
      isoEnd = _parseDate(endDate);
      if (!isoEnd) { Alert.alert('Lỗi', 'Ngày kết thúc không hợp lệ (DD/MM/YYYY)'); return null; }
      if (isoEnd < isoStart) { Alert.alert('Lỗi', 'Ngày kết thúc phải sau ngày bắt đầu'); return null; }
    }
    return {
      name: name.trim(),
      type,
      amount: rawAmount,
      frequency,
      account_id: selectedAccount.id,
      category_id: selectedCategory?.id ?? null,
      start_date: isoStart,
      end_date: isoEnd,
      note: note.trim() || null,
    };
  };

  const handleSave = async () => {
    const payload = validate();
    if (!payload) return;
    setSubmitting(true);
    try {
      if (isEdit) {
        // Only send editable fields
        const { name: n, amount: a, account_id, category_id, end_date, note: nt } = payload;
        await updateTemplate(existing.id, { name: n, amount: a, account_id, category_id, end_date, note: nt });
        Alert.alert('Thành công', 'Đã cập nhật giao dịch định kỳ', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await createTemplate(payload);
        Alert.alert('Thành công', 'Đã tạo giao dịch định kỳ', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const _localISO = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const handleStartDateChange = (date) => {
    setSelectedStartDate(date);
    setStartDate(_isoToDisplay(_localISO(date)));
    setShowStartDateModal(false);
  };

  const handleEndDateChange = (date) => {
    setSelectedEndDate(date);
    setEndDate(_isoToDisplay(_localISO(date)));
    setShowEndDateModal(false);
  };

  if (loadingData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#075c09" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Start Date Picker Modal */}
      <Modal visible={showStartDateModal} transparent animationType="fade" onRequestClose={() => setShowStartDateModal(false)}>
        <TouchableOpacity style={styles.dateModalOverlay} activeOpacity={1} onPress={() => setShowStartDateModal(false)} />
        <View style={styles.dateModalContent}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={() => setSelectedStartDate(new Date(selectedStartDate.getFullYear(), selectedStartDate.getMonth() - 1))}
            >
              <Text style={styles.monthNavButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.monthYearText}>{_getMonthYearDisplay(selectedStartDate)}</Text>
            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={() => setSelectedStartDate(new Date(selectedStartDate.getFullYear(), selectedStartDate.getMonth() + 1))}
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
            {_getCalendarDaysForMonth(selectedStartDate).map((date, index) => {
              const isSelected = date && selectedStartDate.toDateString() === date.toDateString();
              const isDisabled = date && _isPastDate(date);
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
                      handleStartDateChange(date);
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

          <TouchableOpacity style={styles.datePickerCloseBtn} onPress={() => setShowStartDateModal(false)}>
            <Text style={styles.datePickerCloseBtnText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* End Date Picker Modal */}
      <Modal visible={showEndDateModal} transparent animationType="fade" onRequestClose={() => setShowEndDateModal(false)}>
        <TouchableOpacity style={styles.dateModalOverlay} activeOpacity={1} onPress={() => setShowEndDateModal(false)} />
        <View style={styles.dateModalContent}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={() => setSelectedEndDate(new Date(selectedEndDate.getFullYear(), selectedEndDate.getMonth() - 1))}
            >
              <Text style={styles.monthNavButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.monthYearText}>{_getMonthYearDisplay(selectedEndDate)}</Text>
            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={() => setSelectedEndDate(new Date(selectedEndDate.getFullYear(), selectedEndDate.getMonth() + 1))}
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
            {_getCalendarDaysForMonth(selectedEndDate).map((date, index) => {
              const isSelected = date && selectedEndDate.toDateString() === date.toDateString();
              const isDisabled = date && _isPastDate(date);
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
                      handleEndDateChange(date);
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

          <TouchableOpacity style={styles.datePickerCloseBtn} onPress={() => setShowEndDateModal(false)}>
            <Text style={styles.datePickerCloseBtnText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? 'Chỉnh sửa định kỳ' : 'Tạo giao dịch định kỳ'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

        <Section title="Thông tin giao dịch">
          <Field label="Tên giao dịch" required>
            <TextInput
              style={styles.input}
              placeholder="VD: Tiền thuê nhà, Lương tháng, Spotify..."
              value={name}
              onChangeText={setName}
              maxLength={150}
            />
          </Field>

          <Field label="Loại giao dịch" required>
            <ChipRow
              options={TYPES}
              selected={type}
              onSelect={isEdit ? undefined : handleTypeChange}
              colorMap={{ income: '#075c09', expense: '#CC3300' }}
            />
            {isEdit && (
              <Text style={styles.lockedNote}>Không thể đổi loại khi chỉnh sửa</Text>
            )}
          </Field>

          <Field label="Số tiền (đ)" required>
            <TextInput
              style={styles.input}
              placeholder="VD: 3000000"
              keyboardType="numeric"
              value={amount}
              onChangeText={handleAmountChange}
            />
          </Field>
        </Section>

        <Section title="Tài khoản & Danh mục">
          <Field label="Tài khoản" required>
            <View style={styles.chipRow}>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  style={[styles.chip, selectedAccount?.id === acc.id && styles.chipActive]}
                  onPress={() => setSelectedAccount(acc)}
                >
                  <Text style={[styles.chipText, selectedAccount?.id === acc.id && styles.chipTextActive]}>
                    {acc.name}
                  </Text>
                  <Text style={styles.chipSub}>
                    {Number(acc.current_balance).toLocaleString('vi-VN')} đ
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="Danh mục (tuỳ chọn)">
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.chip, !selectedCategory && styles.chipActive]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>
                  Không chọn
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, selectedCategory?.id === cat.id && styles.chipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.chipText, selectedCategory?.id === cat.id && styles.chipTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>
        </Section>

        <Section title="Lịch lặp lại">
          <Field label="Chu kỳ" required>
            <ChipRow
              options={FREQUENCIES}
              selected={frequency}
              onSelect={isEdit ? undefined : setFrequency}
            />
            {isEdit && (
              <Text style={styles.lockedNote}>Không thể đổi chu kỳ khi chỉnh sửa</Text>
            )}
          </Field>

          <Field label="Ngày bắt đầu" required>
            <View style={styles.dateInputContainer}>
              <TextInput
                style={[styles.dateInput, isEdit && styles.inputDisabled]}
                placeholder="DD/MM/YYYY"
                value={startDate}
                editable={!isEdit}
                maxLength={10}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => !isEdit && setShowStartDateModal(true)}
                disabled={isEdit}
              >
                <Text style={styles.datePickerBtnText}>📅</Text>
              </TouchableOpacity>
            </View>
          </Field>

          <Field label="Ngày kết thúc (tuỳ chọn)">
            <View style={styles.dateInputContainer}>
              <TextInput
                style={styles.dateInput}
                placeholder="DD/MM/YYYY — để trống nếu không có hạn"
                value={endDate}
                onChangeText={setEndDate}
                maxLength={10}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => setShowEndDateModal(true)}
              >
                <Text style={styles.datePickerBtnText}>📅</Text>
              </TouchableOpacity>
            </View>
          </Field>
        </Section>

        <Section title="Ghi chú">
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Ghi chú thêm (tuỳ chọn)"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />
        </Section>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={submitting}>
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>
                {isEdit ? 'Lưu thay đổi' : 'Tạo giao dịch định kỳ'}
              </Text>
          }
        </TouchableOpacity>

      </ScrollView>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  header: {
    backgroundColor: '#075c09',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { padding: 4, marginRight: 8 },
  backText: { color: '#fff', fontSize: 22 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },

  body: { padding: 16, paddingBottom: 40 },

  section: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, elevation: 1,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#075c09', marginBottom: 12,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  fieldRow: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, color: '#555', marginBottom: 6, fontWeight: '600' },
  lockedNote: { fontSize: 11, color: '#999', marginTop: 4, fontStyle: 'italic' },

  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, backgroundColor: '#fafafa', color: '#333',
  },
  inputDisabled: { backgroundColor: '#f0f0f0', color: '#aaa' },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7, alignItems: 'center',
  },
  chipActive: { borderColor: '#075c09', backgroundColor: '#e8f5e9' },
  chipText: { fontSize: 13, color: '#666', fontWeight: '500' },
  chipTextActive: { color: '#075c09', fontWeight: '700' },
  chipSub: { fontSize: 10, color: '#999', marginTop: 2 },

  saveBtn: {
    backgroundColor: '#075c09', borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Date Picker Styles
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  dateInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333',
  },
  datePickerBtn: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
  },
  datePickerBtnText: {
    fontSize: 20,
  },
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dateModalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingVertical: 20,
    paddingHorizontal: 15,
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
  datePickerCloseBtn: {
    marginTop: 15,
    backgroundColor: '#075c09',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  datePickerCloseBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
