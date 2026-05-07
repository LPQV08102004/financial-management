import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { depositToGoal, withdrawFromGoal, getGoal } from '../api/savingsGoalsApi';
import { listAccounts } from '../api/accountsApi';
import { useFocusEffect } from '@react-navigation/native';

const _fmtVND = (n) => Number(n).toLocaleString('vi-VN') + ' đ';

export default function SavingsConfirmCard({ parsed, onConfirmed, onCancel }) {
  const [action, setAction] = useState(parsed.action || 'deposit');
  const [amount, setAmount] = useState(parsed.amount ? String(parsed.amount) : '');
  const [date, setDate] = useState(parsed.date || new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(parsed.note || '');
  const [selectedGoal, setSelectedGoal] = useState(parsed.goal_suggestions?.[0] || null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cappedInfo, setCappedInfo] = useState('');

  // Fetch full goal when AI suggestion only has id/name (no target_amount)
  useEffect(() => {
    if (selectedGoal?.id && selectedGoal.target_amount == null) {
      getGoal(selectedGoal.id)
        .then((full) => setSelectedGoal(full))
        .catch(() => {});
    }
  }, [selectedGoal?.id]);

  useFocusEffect(
    useCallback(() => {
      listAccounts().then((list) => {
        setAccounts(list);
        if (list.length > 0) setSelectedAccount(list[0]);
      }).catch(() => {});
    }, [])
  );

  const computeCap = () => {
    if (action === 'deposit' && selectedGoal?.target_amount != null) {
      const remaining = Number(selectedGoal.target_amount) - Number(selectedGoal.saved_amount ?? 0);
      const balance = selectedAccount ? Math.floor(Number(selectedAccount.current_balance)) : Infinity;
      return Math.min(remaining, isFinite(balance) ? balance : remaining);
    }
    if (action === 'withdraw' && selectedGoal?.saved_amount != null) {
      return Number(selectedGoal.saved_amount ?? 0);
    }
    return null;
  };

  // Auto-cap when goal/account/action changes
  useEffect(() => {
    if (!selectedGoal?.target_amount || !amount) return;
    const num = Number(amount);
    if (isNaN(num) || num <= 0) return;
    const cap = computeCap();
    if (cap !== null && num > cap) {
      setCappedInfo(`Tối đa ${cap.toLocaleString('vi-VN')} đ — đã điều chỉnh.`);
      setAmount(String(cap));
    } else {
      setCappedInfo('');
    }
  }, [selectedGoal, selectedAccount, action]);

  const handleAmountChange = (text) => {
    const raw = text.replace(/\D/g, '');
    if (!raw) { setAmount(''); setCappedInfo(''); return; }
    let num = parseInt(raw, 10);
    const cap = computeCap();
    if (cap !== null && num > cap) num = cap;
    setAmount(String(num));
    setCappedInfo('');
  };

  const missingFields = [];
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) missingFields.push('Số tiền');
  if (!date) missingFields.push('Ngày');
  if (!selectedGoal) missingFields.push('Mục tiêu tiết kiệm');
  if (!selectedAccount) missingFields.push('Tài khoản');

  const handleConfirm = async () => {
    if (missingFields.length > 0) return;
    setSaving(true);
    setError('');
    try {
      const isoDate = `${date}T00:00:00`;
      if (action === 'deposit') {
        await depositToGoal(selectedGoal.id, Number(amount), selectedAccount.id, isoDate);
      } else {
        await withdrawFromGoal(selectedGoal.id, Number(amount), selectedAccount.id, isoDate);
      }
      onConfirmed();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🏦 Xác nhận tiết kiệm</Text>

      {/* Action toggle */}
      <View style={styles.row}>
        <Text style={styles.label}>Thao tác</Text>
        <View style={styles.toggleRow}>
          {['deposit', 'withdraw'].map((a) => (
            <TouchableOpacity
              key={a}
              style={[
                styles.toggleBtn,
                action === a && (a === 'deposit' ? styles.toggleBtnActive : styles.toggleBtnRed),
              ]}
              onPress={() => setAction(a)}
            >
              <Text style={[
                styles.toggleText,
                action === a && (a === 'deposit' ? styles.toggleTextActive : styles.toggleTextRed),
              ]}>
                {a === 'deposit' ? '+ Nạp tiền' : '- Rút tiền'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Amount */}
      <View style={styles.row}>
        <Text style={styles.label}>Số tiền (VND)</Text>
        {action === 'deposit' && selectedGoal?.target_amount != null && (
          <Text style={styles.balanceHint}>
            Còn thiếu: {(Number(selectedGoal.target_amount) - Number(selectedGoal.saved_amount ?? 0)).toLocaleString('vi-VN')} đ
            {selectedAccount ? `  ·  Số dư TK: ${Math.floor(Number(selectedAccount.current_balance)).toLocaleString('vi-VN')} đ` : ''}
          </Text>
        )}
        {action === 'withdraw' && selectedGoal?.saved_amount != null && (
          <Text style={styles.balanceHint}>
            Đã tích lũy: {Number(selectedGoal.saved_amount ?? 0).toLocaleString('vi-VN')} đ
          </Text>
        )}
        {cappedInfo ? <Text style={styles.cappedHint}>ℹ️ {cappedInfo}</Text> : null}
        <TextInput
          style={styles.input}
          value={amount ? Number(amount).toLocaleString('vi-VN') : ''}
          onChangeText={handleAmountChange}
          keyboardType="numeric"
          placeholder={(() => { const c = computeCap(); return c !== null ? `Tối đa ${c.toLocaleString('vi-VN')} đ` : 'VD: 100000'; })()}
        />
      </View>

      {/* Date */}
      <View style={styles.row}>
        <Text style={styles.label}>Ngày</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />
      </View>

      {/* Note */}
      <View style={styles.row}>
        <Text style={styles.label}>Ghi chú</Text>
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="Mô tả (tuỳ chọn)"
        />
      </View>

      {/* Goal suggestions */}
      <View style={styles.section}>
        <Text style={styles.label}>Mục tiêu tiết kiệm</Text>
        {parsed.goal_suggestions?.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {parsed.goal_suggestions.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[styles.chip, selectedGoal?.id === goal.id && styles.chipSelected]}
                onPress={() => setSelectedGoal({ id: goal.id, name: goal.name, confidence: goal.confidence })}
              >
                <Text style={[
                  styles.chipText,
                  selectedGoal?.id === goal.id && styles.chipTextSelected,
                ]}>
                  {goal.name} {goal.confidence}%
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.hint}>Không tìm được mục tiêu — vui lòng chọn trong ứng dụng</Text>
        )}
      </View>

      {/* Account */}
      {accounts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.label}>Tài khoản</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {accounts.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                style={[styles.chip, selectedAccount?.id === acc.id && styles.chipSelected]}
                onPress={() => setSelectedAccount(acc)}
              >
                <Text style={[
                  styles.chipText,
                  selectedAccount?.id === acc.id && styles.chipTextSelected,
                ]}>
                  {acc.name}
                  {'\n'}
                  <Text style={styles.chipBalance}>{_fmtVND(acc.current_balance)}</Text>
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Missing fields warning */}
      {missingFields.length > 0 && (
        <Text style={styles.warning}>⚠ Cần bổ sung: {missingFields.join(', ')}</Text>
      )}

      {/* Error */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Huỷ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            action === 'withdraw' && styles.confirmBtnRed,
            (missingFields.length > 0 || saving) && styles.confirmBtnDisabled,
          ]}
          onPress={handleConfirm}
          disabled={missingFields.length > 0 || saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.confirmText}>
                {action === 'deposit' ? 'Nạp vào tiết kiệm' : 'Rút khỏi tiết kiệm'}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#075c09',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#075c09', marginBottom: 14 },
  row: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  toggleBtnActive: { borderColor: '#075c09', backgroundColor: '#e8f5e9' },
  toggleBtnRed: { borderColor: '#CC3300', backgroundColor: '#fff3f3' },
  toggleText: { fontSize: 13, color: '#888', fontWeight: '600' },
  toggleTextActive: { color: '#075c09' },
  toggleTextRed: { color: '#CC3300' },
  section: { marginBottom: 12 },
  chipRow: { marginTop: 6 },
  chip: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    alignItems: 'center',
  },
  chipSelected: { borderColor: '#075c09', backgroundColor: '#e8f5e9' },
  chipText: { fontSize: 13, color: '#555', fontWeight: '600' },
  chipTextSelected: { color: '#075c09' },
  chipBalance: { fontSize: 11, color: '#888', fontWeight: '400' },
  balanceHint: { fontSize: 11, color: '#075c09', fontWeight: '600', marginBottom: 4 },
  cappedHint: { fontSize: 11, color: '#e65100', marginBottom: 4 },
  hint: { fontSize: 12, color: '#999', fontStyle: 'italic', marginTop: 4 },
  warning: { fontSize: 12, color: '#e65100', marginBottom: 8 },
  errorText: { fontSize: 13, color: '#CC3300', marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, color: '#666', fontWeight: '600' },
  confirmBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#075c09',
    alignItems: 'center',
  },
  confirmBtnRed: { backgroundColor: '#CC3300' },
  confirmBtnDisabled: { opacity: 0.45 },
  confirmText: { fontSize: 14, color: '#fff', fontWeight: '700' },
});
