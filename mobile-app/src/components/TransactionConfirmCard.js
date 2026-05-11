import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { createExpense, createIncome } from '../api/transactionsApi';
import { listAccounts } from '../api/accountsApi';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const FIELD_LABELS = {
  amount: 'Số tiền',
  type: 'Loại',
  date: 'Ngày',
  category: 'Danh mục',
};

export default function TransactionConfirmCard({ parsed, onConfirmed, onCancel }) {
  const [type, setType] = useState(parsed.type || 'expense');
  const [amount, setAmount] = useState(parsed.amount ? String(parsed.amount) : '');
  const [date, setDate] = useState(parsed.date || new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(parsed.note || '');
  const [selectedCategory, setSelectedCategory] = useState(
    parsed.category_suggestions?.[0] || null
  );
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      listAccounts().then((list) => {
        setAccounts(list);
        if (list.length > 0) setSelectedAccount(list[0]);
      }).catch(() => {});
    }, [])
  );

  useEffect(() => {
    if (type !== 'expense' || !selectedAccount || !amount) return;
    const num = Number(amount);
    if (isNaN(num) || num <= 0) return;
    const cap = Math.floor(Number(selectedAccount.current_balance));
    if (num > cap) setAmount(String(cap));
  }, [selectedAccount, type]);

  const handleAmountChange = (text) => {
    const raw = text.replace(/\D/g, '');
    if (!raw) { setAmount(''); return; }
    let num = parseInt(raw, 10);
    if (type === 'expense' && selectedAccount) {
      const cap = Math.floor(Number(selectedAccount.current_balance));
      if (num > cap) num = cap;
    }
    setAmount(String(num));
  };

  const missingFields = [];
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) missingFields.push('Số tiền');
  if (!date) missingFields.push('Ngày');
  if (type === 'expense' && !selectedCategory) missingFields.push('Danh mục');
  if (!selectedAccount) missingFields.push('Tài khoản');

  const handleConfirm = async () => {
    if (missingFields.length > 0) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        account_id: selectedAccount.id,
        amount: Number(amount),
        transaction_date: `${date}T00:00:00`,
        note: note || undefined,
      };
      if (type === 'expense') {
        payload.category_id = selectedCategory.id;
        await createExpense(payload);
      } else {
        if (selectedCategory) payload.category_id = selectedCategory.id;
        await createIncome(payload);
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
      <Text style={styles.cardTitle}>📋 Xác nhận giao dịch</Text>

      {}
      <View style={styles.row}>
        <Text style={styles.label}>Loại</Text>
        <View style={styles.toggleRow}>
          {['expense', 'income'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.toggleBtn, type === t && styles.toggleBtnActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.toggleText, type === t && styles.toggleTextActive]}>
                {t === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {}
      <View style={styles.row}>
        <Text style={styles.label}>Số tiền (VND)</Text>
        {type === 'expense' && selectedAccount && (
          <Text style={styles.balanceHint}>
            Số dư: {Math.floor(Number(selectedAccount.current_balance)).toLocaleString('vi-VN')} đ
          </Text>
        )}
        <TextInput
          style={styles.input}
          value={amount ? Number(amount).toLocaleString('vi-VN') : ''}
          onChangeText={handleAmountChange}
          keyboardType="numeric"
          placeholder={type === 'expense' && selectedAccount
            ? `Tối đa ${Math.floor(Number(selectedAccount.current_balance)).toLocaleString('vi-VN')} đ`
            : 'VD: 220000'}
        />
      </View>

      {}
      <View style={styles.row}>
        <Text style={styles.label}>Ngày</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />
      </View>

      {}
      <View style={styles.row}>
        <Text style={styles.label}>Ghi chú</Text>
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="Mô tả giao dịch"
        />
      </View>

      {}
      {type === 'expense' && (
        <View style={styles.section}>
          <Text style={styles.label}>Danh mục</Text>
          {parsed.category_suggestions?.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {parsed.category_suggestions.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.chip,
                    selectedCategory?.id === cat.id && styles.chipSelected,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[
                    styles.chipText,
                    selectedCategory?.id === cat.id && styles.chipTextSelected,
                  ]}>
                    {cat.name} {cat.confidence}%
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.hint}>Không tìm được danh mục phù hợp — vui lòng chọn thủ công</Text>
          )}
        </View>
      )}

      {}
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
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {}
      {missingFields.length > 0 && (
        <Text style={styles.warning}>⚠ Cần bổ sung: {missingFields.join(', ')}</Text>
      )}

      {}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Huỷ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmBtn, (missingFields.length > 0 || saving) && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={missingFields.length > 0 || saving}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.confirmText}>✓ Xác nhận</Text>
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
    margin: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#075c09',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#075c09', marginBottom: 12 },
  row: { marginBottom: 10 },
  section: { marginBottom: 10 },
  label: { fontSize: 12, color: '#666', marginBottom: 4, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#fafafa',
  },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: '#075c09', borderColor: '#075c09' },
  toggleText: { fontSize: 14, color: '#666' },
  toggleTextActive: { color: '#fff', fontWeight: '700' },
  chipRow: { flexDirection: 'row' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  chipSelected: { backgroundColor: '#075c09', borderColor: '#075c09' },
  chipText: { fontSize: 13, color: '#444' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  hint: { fontSize: 12, color: '#e6a800', fontStyle: 'italic' },
  warning: { fontSize: 12, color: '#e6a800', marginBottom: 8 },
  errorText: { fontSize: 12, color: '#d9534f', marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelText: { color: '#666', fontSize: 15 },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#075c09',
    alignItems: 'center',
  },
  confirmBtnDisabled: { backgroundColor: '#ccc' },
  confirmText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  balanceHint: { fontSize: 11, color: '#075c09', fontWeight: '600', marginBottom: 4 },
});
