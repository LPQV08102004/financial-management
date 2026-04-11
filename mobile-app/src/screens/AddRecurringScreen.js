import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
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

  if (loadingData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#075c09" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
              onChangeText={setAmount}
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
            <TextInput
              style={[styles.input, isEdit && styles.inputDisabled]}
              placeholder="DD/MM/YYYY"
              value={startDate}
              onChangeText={isEdit ? undefined : setStartDate}
              keyboardType="numeric"
              maxLength={10}
              editable={!isEdit}
            />
          </Field>

          <Field label="Ngày kết thúc (tuỳ chọn)">
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY — để trống nếu không có hạn"
              value={endDate}
              onChangeText={setEndDate}
              keyboardType="numeric"
              maxLength={10}
            />
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
});
