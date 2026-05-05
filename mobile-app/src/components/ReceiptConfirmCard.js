import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { createExpense, createIncome } from '../api/transactionsApi';
import { listAccounts } from '../api/accountsApi';

const CONFIDENCE_CONFIG = {
  high:   { color: '#2e7d32', bg: '#e8f5e9', icon: '✅', label: 'Trích xuất chính xác' },
  medium: { color: '#e65100', bg: '#fff3e0', icon: '⚠️', label: 'Vui lòng kiểm tra lại' },
  low:    { color: '#c62828', bg: '#ffebee', icon: '⚠️', label: 'Độ chính xác thấp' },
};

export default function ReceiptConfirmCard({ parsed, imageUri, onConfirmed, onCancel }) {
  const [type, setType] = useState(parsed.type || 'expense');
  const [amount, setAmount] = useState(parsed.amount ? String(Math.round(parsed.amount)) : '');
  const [date, setDate] = useState(parsed.date || new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(parsed.note || parsed.merchant_name || '');
  const [selectedCategory, setSelectedCategory] = useState(
    parsed.category_suggestions?.[0] || null
  );
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showRaw, setShowRaw] = useState(false);
  const [showItems, setShowItems] = useState(true);
  const [itemsAppended, setItemsAppended] = useState(false);

  const [zoomVisible, setZoomVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      listAccounts().then((list) => {
        setAccounts(list);
        if (list.length > 0) setSelectedAccount(list[0]);
      }).catch(() => {});
    }, [])
  );

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

  const conf = CONFIDENCE_CONFIG[parsed.confidence_level] || CONFIDENCE_CONFIG.low;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📸 Xác nhận từ hóa đơn</Text>

        {/* Receipt image preview — tap to zoom */}
        {imageUri ? (
          <>
            <TouchableOpacity onPress={() => setZoomVisible(true)} activeOpacity={0.85}>
              <Image source={{ uri: imageUri }} style={styles.receiptImage} resizeMode="contain" />
              <Text style={styles.zoomHint}>🔍 Nhấn để phóng to</Text>
            </TouchableOpacity>
            <Modal visible={zoomVisible} transparent animationType="fade">
              <TouchableOpacity style={styles.zoomOverlay} activeOpacity={1} onPress={() => setZoomVisible(false)}>
                <Image source={{ uri: imageUri }} style={styles.zoomImage} resizeMode="contain" />
                <Text style={styles.zoomClose}>✕ Đóng</Text>
              </TouchableOpacity>
            </Modal>
          </>
        ) : null}

        {/* Confidence badge */}
        <View style={[styles.confidenceBadge, { backgroundColor: conf.bg }]}>
          <Text style={[styles.confidenceText, { color: conf.color }]}>
            {conf.icon} {conf.label}
          </Text>
        </View>

        {/* Warnings */}
        {parsed.warnings?.length > 0 && (
          <View style={styles.warningsBox}>
            {parsed.warnings.map((w, i) => (
              <Text key={i} style={styles.warningText}>⚠ {w}</Text>
            ))}
          </View>
        )}

        {/* Type toggle */}
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

        {/* Amount */}
        <View style={styles.row}>
          <Text style={styles.label}>Số tiền (VND)</Text>
          <TextInput
            style={[styles.input, !amount && styles.inputMissing]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="VD: 220000"
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

        {/* Note / Merchant */}
        <View style={styles.row}>
          <Text style={styles.label}>Cửa hàng / Ghi chú</Text>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="Tên cửa hàng hoặc mô tả"
          />
        </View>

        {/* Product items from receipt */}
        {parsed.items?.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.itemsToggleRow}
              onPress={() => setShowItems((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.label}>Sản phẩm ({parsed.items.length})</Text>
              <Text style={styles.itemsToggleIcon}>{showItems ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showItems && (
              <>
                <View style={styles.itemsTable}>
                  <View style={styles.itemsHeader}>
                    <Text style={[styles.itemsCell, styles.itemsCellName, styles.itemsHeaderText]}>Tên</Text>
                    <Text style={[styles.itemsCell, styles.itemsCellQty, styles.itemsHeaderText]}>Số lượng</Text>
                    <Text style={[styles.itemsCell, styles.itemsCellPrice, styles.itemsHeaderText]}>Giá</Text>
                  </View>
                  {parsed.items.map((item, idx) => (
                    <View
                      key={idx}
                      style={[styles.itemsRow, idx % 2 === 0 && styles.itemsRowEven]}
                    >
                      <Text style={[styles.itemsCell, styles.itemsCellName]} numberOfLines={2}>{item.name}</Text>
                      <Text style={[styles.itemsCell, styles.itemsCellQty]}>
                        {item.qty != null ? item.qty : '—'}
                      </Text>
                      <Text style={[styles.itemsCell, styles.itemsCellPrice]}>
                        {item.price != null
                          ? Number(item.price).toLocaleString('vi-VN')
                          : '—'}
                      </Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.appendItemsBtn, itemsAppended && styles.appendItemsBtnDone]}
                  onPress={() => {
                    if (itemsAppended) return;
                    const lines = parsed.items
                      .map((it) => {
                        let line = it.name;
                        if (it.qty != null) line += ` x${it.qty}`;
                        if (it.price != null) line += ` (${Number(it.price).toLocaleString('vi-VN')})`;
                        return line;
                      })
                      .join('; ');
                    setNote((prev) => (prev ? `${prev} | ${lines}` : lines));
                    setItemsAppended(true);
                  }}
                  disabled={itemsAppended}
                >
                  <Text style={[styles.appendItemsBtnText, itemsAppended && styles.appendItemsBtnTextDone]}>
                    {itemsAppended ? '✓ Đã thêm vào ghi chú' : '⬇️ Thêm vào ghi chú'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Category suggestions */}
        {type === 'expense' && (
          <View style={styles.section}>
            <Text style={styles.label}>Danh mục</Text>
            {parsed.category_suggestions?.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {parsed.category_suggestions.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.chip, selectedCategory?.id === cat.id && styles.chipSelected]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.chipText, selectedCategory?.id === cat.id && styles.chipTextSelected]}>
                      {cat.name} {cat.confidence}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.hint}>Không tìm được danh mục — vui lòng chọn thủ công</Text>
            )}
          </View>
        )}

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
                  <Text style={[styles.chipText, selectedAccount?.id === acc.id && styles.chipTextSelected]}>
                    {acc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Raw OCR text (collapsible) */}
        {parsed.raw_text ? (
          <View style={styles.section}>
            <TouchableOpacity onPress={() => setShowRaw((v) => !v)} style={styles.rawToggle}>
              <Text style={styles.rawToggleText}>{showRaw ? '▲' : '▼'} Văn bản gốc từ ảnh</Text>
            </TouchableOpacity>
            {showRaw && (
              <Text style={styles.rawText}>{parsed.raw_text}</Text>
            )}
          </View>
        ) : null}

        {/* Missing fields warning */}
        {missingFields.length > 0 && (
          <Text style={styles.missingWarning}>⚠ Cần bổ sung: {missingFields.join(', ')}</Text>
        )}

        {/* Error */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Actions */}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
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
    borderLeftColor: '#1565c0',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1565c0', marginBottom: 12 },
  receiptImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
  },
  confidenceBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  confidenceText: { fontSize: 13, fontWeight: '600' },
  warningsBox: {
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#ffa000',
  },
  warningText: { fontSize: 12, color: '#e65100', marginBottom: 2 },
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
  inputMissing: { borderColor: '#ffa000' },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: '#1565c0', borderColor: '#1565c0' },
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
  chipSelected: { backgroundColor: '#1565c0', borderColor: '#1565c0' },
  chipText: { fontSize: 13, color: '#444' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  hint: { fontSize: 12, color: '#e6a800', fontStyle: 'italic' },
  itemsToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemsToggleIcon: { fontSize: 11, color: '#888' },
  itemsTable: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, overflow: 'hidden', marginBottom: 8 },
  itemsHeader: { flexDirection: 'row', backgroundColor: '#e8eaf6', paddingVertical: 6, paddingHorizontal: 4 },
  itemsHeaderText: { fontWeight: '700', color: '#3949ab', fontSize: 11 },
  itemsRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 4 },
  itemsRowEven: { backgroundColor: '#f9f9ff' },
  itemsCell: { fontSize: 12, color: '#333', textAlignVertical: 'center' },
  itemsCellName: { flex: 3, paddingRight: 4 },
  itemsCellQty: { flex: 1, textAlign: 'center' },
  itemsCellPrice: { flex: 2, textAlign: 'right', paddingRight: 4 },
  appendItemsBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e8eaf6',
    borderRadius: 8,
  },
  appendItemsBtnText: { fontSize: 12, color: '#3949ab', fontWeight: '600' },
  appendItemsBtnDone: { backgroundColor: '#e8f5e9' },
  appendItemsBtnTextDone: { color: '#2e7d32' },
  rawToggle: { paddingVertical: 4 },
  rawToggleText: { fontSize: 12, color: '#888', fontWeight: '600' },
  rawText: {
    fontSize: 11,
    color: '#555',
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  zoomHint: { fontSize: 11, color: '#888', textAlign: 'center', marginBottom: 10, marginTop: -6 },
  zoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomImage: { width: '100%', height: '80%' },
  zoomClose: { color: '#fff', fontSize: 16, marginTop: 16, fontWeight: '600' },
  missingWarning: { fontSize: 12, color: '#e6a800', marginBottom: 8 },
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
    backgroundColor: '#1565c0',
    alignItems: 'center',
  },
  confirmBtnDisabled: { backgroundColor: '#ccc' },
  confirmText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
