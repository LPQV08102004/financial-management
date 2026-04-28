import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Modal,
} from 'react-native';
import Footer from '../components/Footer';
import { createGoal, updateGoal, depositToGoal, withdrawFromGoal, getGoal } from '../api/savingsGoalsApi';
import { listAccounts } from '../api/accountsApi';

const _fmtVND = (n) => Number(n).toLocaleString('vi-VN');
const _formatMoneyInput = (str) => {
  if (!str) return '';
  const cleaned = str.replace(/\D/g, '');
  if (!cleaned) return '';
  return Number(cleaned).toLocaleString('vi-VN');
};
const _fmtDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = String(dateStr).split('-');
  return `${d}/${m}/${y}`;
};

// Parse DD/MM/YYYY → YYYY-MM-DD or null
const _parseDate = (str) => {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  if (!d || !m || !y || y.length !== 4) return null;
  const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  if (isNaN(Date.parse(iso))) return null;
  return iso;
};

// Format date input DDMMYYYY → DD/MM/YYYY
const _formatDateInput = (str) => {
  if (!str) return '';
  const cleaned = str.replace(/\D/g, '');
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
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

function Field({ label, children }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

// Build today's date as YYYY-MM-DD
const _todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// "DD/MM/YYYY" → "YYYY-MM-DDTHH:00:00" or null
const _dateInputToISO = (str) => {
  if (!str || str.length < 10) return null;
  const parts = str.split('/');
  if (parts.length !== 3 || parts[2].length !== 4) return null;
  const iso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  if (isNaN(Date.parse(iso))) return null;
  return `${iso}T00:00:00`;
};

// "YYYY-MM-DD" → "DD/MM/YYYY"
const _isoToDisplay = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

function ActionModal({ visible, onClose, goal, onDone }) {
  const [mode, setMode] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [dateInput, setDateInput] = useState(_isoToDisplay(_todayISO()));
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load accounts and reset form whenever modal opens
  useEffect(() => {
    if (!visible) return;
    setAmount('');
    setMode('deposit');
    setDateInput(_isoToDisplay(_todayISO()));
    setLoadingAccounts(true);
    listAccounts()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.items ?? []);
        setAccounts(list);
        setSelectedAccount(list[0] ?? null);
      })
      .catch(() => {})
      .finally(() => setLoadingAccounts(false));
  }, [visible]);

  const handleSubmit = async () => {
    const num = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    if (!num || num <= 0) { Alert.alert('Lỗi', 'Nhập số tiền hợp lệ'); return; }
    if (!selectedAccount) { Alert.alert('Lỗi', 'Vui lòng chọn tài khoản'); return; }
    const isoDate = _dateInputToISO(dateInput);
    if (!isoDate) { Alert.alert('Lỗi', 'Ngày không hợp lệ. Dùng định dạng DD/MM/YYYY'); return; }

    setSubmitting(true);
    try {
      if (mode === 'deposit') {
        await depositToGoal(goal.id, num, selectedAccount.id, isoDate);
      } else {
        await withdrawFromGoal(goal.id, num, selectedAccount.id, isoDate);
      }
      onDone();
      onClose();
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!goal) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.modalSheet}>
        <Text style={styles.modalTitle}>Cập nhật số tiền tích lũy</Text>
        <Text style={styles.modalGoalName}>{goal.name}</Text>
        <Text style={styles.modalProgress}>
          Hiện tại: {_fmtVND(goal.saved_amount)} đ / {_fmtVND(goal.target_amount)} đ
        </Text>

        {/* Deposit / Withdraw toggle */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'deposit' && styles.modeBtnActive]}
            onPress={() => setMode('deposit')}
          >
            <Text style={[styles.modeBtnText, mode === 'deposit' && styles.modeBtnTextActive]}>Nạp tiền</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'withdraw' && styles.modeBtnActiveRed]}
            onPress={() => setMode('withdraw')}
          >
            <Text style={[styles.modeBtnText, mode === 'withdraw' && styles.modeBtnTextRed]}>Rút tiền</Text>
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <Text style={styles.modalFieldLabel}>Số tiền (đ)</Text>
        <TextInput
          style={styles.modalInput}
          placeholder="Nhập số tiền"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        {/* Date */}
        <Text style={styles.modalFieldLabel}>Ngày giao dịch</Text>
        <TextInput
          style={styles.modalInput}
          placeholder="DD/MM/YYYY"
          value={dateInput}
          onChangeText={setDateInput}
          maxLength={10}
          keyboardType="numeric"
        />

        {/* Account picker */}
        <Text style={styles.modalFieldLabel}>Tài khoản</Text>
        {loadingAccounts ? (
          <ActivityIndicator color="#075c09" style={{ marginBottom: 12 }} />
        ) : (
          <View style={styles.accountRow}>
            {accounts.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                style={[
                  styles.accountChip,
                  selectedAccount?.id === acc.id && styles.accountChipActive,
                ]}
                onPress={() => setSelectedAccount(acc)}
              >
                <Text style={[
                  styles.accountChipText,
                  selectedAccount?.id === acc.id && styles.accountChipTextActive,
                ]}>
                  {acc.name}
                </Text>
                <Text style={[
                  styles.accountChipBalance,
                  selectedAccount?.id === acc.id && styles.accountChipTextActive,
                ]}>
                  {_fmtVND(acc.current_balance)} đ
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, mode === 'withdraw' && styles.submitBtnRed]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>
                {mode === 'deposit' ? 'Nạp tiền vào mục tiêu' : 'Rút tiền khỏi mục tiêu'}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function AddSavingsGoalScreen({ navigation, route }) {
  const existingGoal = route.params?.goal ?? null;
  const isEdit = !!existingGoal;

  const [name, setName] = useState(existingGoal?.name ?? '');
  const [targetAmount, setTargetAmount] = useState(
    existingGoal ? String(_fmtVND(existingGoal.target_amount)) : ''
  );
  const [deadline, setDeadline] = useState(
    existingGoal ? _fmtDate(existingGoal.deadline) : ''
  );
  const [note, setNote] = useState(existingGoal?.note ?? '');
  const [loading, setLoading] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(existingGoal);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDeadlineDate, setSelectedDeadlineDate] = useState(
    existingGoal && existingGoal.deadline ? new Date(existingGoal.deadline) : new Date()
  );

  // Live-compute monthly_needed when target/deadline change
  const [monthlyPreview, setMonthlyPreview] = useState(null);

  useEffect(() => {
    const raw = parseFloat(targetAmount.replace(/\./g, '').replace(',', '.'));
    const isoDate = _parseDate(deadline);
    if (!raw || !isoDate) { setMonthlyPreview(null); return; }
    const today = new Date();
    const dl = new Date(isoDate);
    const months = (dl.getFullYear() - today.getFullYear()) * 12 + (dl.getMonth() - today.getMonth());
    if (months <= 0) { setMonthlyPreview(null); return; }
    const saved = isEdit ? Number(currentGoal?.saved_amount ?? 0) : 0;
    const remaining = Math.max(raw - saved, 0);
    setMonthlyPreview(remaining / months);
  }, [targetAmount, deadline]);

  const validate = () => {
    if (!name.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập tên mục tiêu'); return false; }
    const raw = parseFloat(targetAmount.replace(/\./g, '').replace(',', '.'));
    if (!raw || raw <= 0) { Alert.alert('Lỗi', 'Số tiền mục tiêu không hợp lệ'); return false; }
    const isoDate = _parseDate(deadline);
    if (!isoDate) { Alert.alert('Lỗi', 'Ngày không hợp lệ. Dùng định dạng DD/MM/YYYY'); return false; }
    const dl = new Date(isoDate);
    if (dl <= new Date()) { Alert.alert('Lỗi', 'Ngày mục tiêu phải ở tương lai'); return false; }
    return { name: name.trim(), target_amount: raw, deadline: isoDate, note: note.trim() || null };
  };

  const handleSave = async () => {
    const payload = validate();
    if (!payload) return;
    setLoading(true);
    try {
      if (isEdit) {
        await updateGoal(currentGoal.id, payload);
        Alert.alert('Thành công', 'Đã cập nhật mục tiêu', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await createGoal(payload);
        Alert.alert('Thành công', 'Đã tạo mục tiêu tiết kiệm', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDeadlineDate(date);
    setDeadline(_fmtDate(date.toISOString().split('T')[0]));
    setShowDateModal(false);
  };

  return (
    <View style={styles.container}>
      {/* Date Picker Modal */}
      <Modal visible={showDateModal} transparent animationType="fade" onRequestClose={() => setShowDateModal(false)}>
        <TouchableOpacity style={styles.dateModalOverlay} activeOpacity={1} onPress={() => setShowDateModal(false)} />
        <View style={styles.dateModalContent}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={() => setSelectedDeadlineDate(new Date(selectedDeadlineDate.getFullYear(), selectedDeadlineDate.getMonth() - 1))}
            >
              <Text style={styles.monthNavButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.monthYearText}>{_getMonthYearDisplay(selectedDeadlineDate)}</Text>
            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={() => setSelectedDeadlineDate(new Date(selectedDeadlineDate.getFullYear(), selectedDeadlineDate.getMonth() + 1))}
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
            {_getCalendarDaysForMonth(selectedDeadlineDate).map((date, index) => {
              const isSelected = date && selectedDeadlineDate.toDateString() === date.toDateString();
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
                      handleDateChange(date);
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

          <TouchableOpacity style={styles.datePickerCloseBtn} onPress={() => setShowDateModal(false)}>
            <Text style={styles.datePickerCloseBtnText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Chỉnh sửa mục tiêu' : 'Tạo mục tiêu mới'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

        {/* Progress summary (edit mode) */}
        {isEdit && currentGoal && (
          <View style={styles.progressBox}>
            <View style={styles.progressTrack}>
              <View style={[
                styles.progressFill,
                { width: `${Math.min(currentGoal.progress_pct, 100)}%` }
              ]} />
            </View>
            <View style={styles.progressRow}>
              <Text style={styles.progressSaved}>{_fmtVND(currentGoal.saved_amount)} đ</Text>
              <Text style={styles.progressPct}>{Number(currentGoal.progress_pct).toFixed(0)}%</Text>
              <Text style={styles.progressTarget}>{_fmtVND(currentGoal.target_amount)} đ</Text>
            </View>
            <TouchableOpacity
              style={styles.depositBtn}
              onPress={() => setActionModalVisible(true)}
            >
              <Text style={styles.depositBtnText}>Nạp / Rút tiền</Text>
            </TouchableOpacity>
          </View>
        )}

        <Section title="Thông tin mục tiêu">
          <Field label="Tên mục tiêu *">
            <TextInput
              style={styles.input}
              placeholder="VD: Mua MacBook, Du lịch Nhật..."
              value={name}
              onChangeText={setName}
              maxLength={150}
            />
          </Field>

          <Field label="Số tiền cần đạt *">
            <TextInput
              style={styles.input}
              placeholder="VD: 30000000"
              keyboardType="numeric"
              value={targetAmount}
              onChangeText={(val) => setTargetAmount(_formatMoneyInput(val))}
            />
          </Field>

          <Field label="Ngày mục tiêu *">
            <View style={styles.dateInputContainer}>
              <TextInput
                style={styles.dateInput}
                placeholder="Nhập: DDMMYYYY"
                value={deadline}
                onChangeText={(val) => setDeadline(_formatDateInput(val))}
                maxLength={10}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => setShowDateModal(true)}
              >
                <Text style={styles.datePickerBtnText}>📅</Text>
              </TouchableOpacity>
            </View>
          </Field>

          <Field label="Ghi chú">
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Ghi chú thêm (tuỳ chọn)"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
          </Field>
        </Section>

        {/* Monthly plan preview */}
        {monthlyPreview != null && (
          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>Cần để dành mỗi tháng</Text>
            <Text style={styles.previewAmount}>{_fmtVND(monthlyPreview)} đ</Text>
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>{isEdit ? 'Lưu thay đổi' : 'Tạo mục tiêu'}</Text>
          }
        </TouchableOpacity>

      </ScrollView>
      <Footer />

      <ActionModal
        visible={actionModalVisible}
        onClose={() => setActionModalVisible(false)}
        goal={currentGoal}
        onDone={async () => {
          try {
            const updated = await getGoal(currentGoal.id);
            setCurrentGoal(updated);
          } catch (_) {}
        }}
      />
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

  progressBox: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, elevation: 2,
  },
  progressTrack: { height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, marginBottom: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#075c09', borderRadius: 5 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressSaved: { fontSize: 13, fontWeight: '700', color: '#075c09' },
  progressPct: { fontSize: 13, fontWeight: '700', color: '#333' },
  progressTarget: { fontSize: 13, color: '#888' },
  depositBtn: {
    backgroundColor: '#075c09', borderRadius: 8, paddingVertical: 10, alignItems: 'center',
  },
  depositBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  section: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, elevation: 1,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#075c09', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

  fieldRow: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, color: '#555', marginBottom: 6, fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#fafafa', color: '#333',
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },

  previewBox: {
    backgroundColor: '#e8f5e9', borderRadius: 12, padding: 16,
    alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: '#c8e6c9',
  },
  previewLabel: { fontSize: 13, color: '#388e3c', fontWeight: '600' },
  previewAmount: { fontSize: 22, fontWeight: '800', color: '#075c09', marginTop: 4 },

  saveBtn: {
    backgroundColor: '#075c09', borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Action Modal
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 4 },
  modalGoalName: { fontSize: 15, color: '#075c09', fontWeight: '600', marginBottom: 2 },
  modalProgress: { fontSize: 13, color: '#888', marginBottom: 16 },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  modeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5,
    borderColor: '#ddd', alignItems: 'center',
  },
  modeBtnActive: { borderColor: '#075c09', backgroundColor: '#e8f5e9' },
  modeBtnActiveRed: { borderColor: '#CC3300', backgroundColor: '#fff3f3' },
  modeBtnText: { fontSize: 14, color: '#888', fontWeight: '600' },
  modeBtnTextActive: { color: '#075c09' },
  modeBtnTextRed: { color: '#CC3300' },
  modalFieldLabel: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 6 },
  modalInput: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15,
    marginBottom: 12, color: '#333',
  },
  accountRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  accountChip: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center',
  },
  accountChipActive: { borderColor: '#075c09', backgroundColor: '#e8f5e9' },
  accountChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  accountChipTextActive: { color: '#075c09' },
  accountChipBalance: { fontSize: 11, color: '#888', marginTop: 2 },
  submitBtn: {
    backgroundColor: '#075c09', borderRadius: 10, paddingVertical: 13, alignItems: 'center',
  },
  submitBtnRed: { backgroundColor: '#CC3300' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Date Picker Styles
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  dateInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#333',
  },
  datePickerBtn: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
  },
  datePickerBtnText: {
    fontSize: 22,
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
