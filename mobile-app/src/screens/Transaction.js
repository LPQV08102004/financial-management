import React, { useCallback, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  FlatList, ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import SidebarDrawer from '../components/SidebarDrawer';
import Header from '../components/Header';
import HeaderIconButton from '../components/HeaderIconButton';
import Footer from '../components/Footer';
import DateTimeSelector from '../components/DateTimeSelector';
import { listTransactions, updateTransaction } from '../api/transactionsApi';
import { listCategories } from '../api/categoriesApi';

const _toDateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const _formatVND = (n) => Number(n).toLocaleString('vi-VN');

const _dateToInput = (dt) => {
  const d = new Date(dt);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const _inputToISO = (str) => {
  const [day, month, year] = str.split('/');
  if (!day || !month || !year) return null;
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  if (isNaN(d.getTime())) return null;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00`;
};

export default function Transaction({ navigation }) {

  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const [activeTab, setActiveTab] = React.useState('expense');
  const [timePeriod, setTimePeriod] = React.useState('day');
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [customStartDate, setCustomStartDate] = React.useState(null);
  const [customEndDate, setCustomEndDate] = React.useState(null);
  const [selectingStartDate, setSelectingStartDate] = React.useState(true);
  const [currentCalendarMonth, setCurrentCalendarMonth] = React.useState(new Date());
  const [confirmedStartDate, setConfirmedStartDate] = React.useState(null);
  const [confirmedEndDate, setConfirmedEndDate] = React.useState(null);
  const [showCalendar, setShowCalendar] = React.useState(false);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const debounceTimer = useRef(null);
  const [showFilterModal, setShowFilterModal] = React.useState(false);
  const [filterCategories, setFilterCategories] = React.useState([]);
  const [filterCategoryId, setFilterCategoryId] = React.useState(null);
  const [filterCategoryName, setFilterCategoryName] = React.useState('');

  const [transactions, setTransactions] = React.useState([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [totalAmount, setTotalAmount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editingTxn, setEditingTxn] = React.useState(null);
  const [editAmount, setEditAmount] = React.useState('');
  const [editNote, setEditNote] = React.useState('');
  const [editDate, setEditDate] = React.useState('');
  const [editCategoryId, setEditCategoryId] = React.useState(null);
  const [editCategoryName, setEditCategoryName] = React.useState('');
  const [savingEdit, setSavingEdit] = React.useState(false);

  const [showCatPicker, setShowCatPicker] = React.useState(false);
  const [editCategories, setEditCategories] = React.useState([]);

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(text), 400);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
  };

  const fetchTransactions = useCallback(async () => {
    const params = { type: activeTab, limit: 100 };

    if (timePeriod === 'day') {
      params.from_date = _toDateStr(selectedDate) + 'T00:00:00';
      params.to_date = _toDateStr(selectedDate) + 'T23:59:59';
    } else if (timePeriod === 'week') {
      const start = new Date(selectedDate);
      start.setDate(selectedDate.getDate() - selectedDate.getDay() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      params.from_date = _toDateStr(start) + 'T00:00:00';
      params.to_date = _toDateStr(end) + 'T23:59:59';
    } else if (timePeriod === 'month') {
      const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      params.from_date = _toDateStr(start) + 'T00:00:00';
      params.to_date = _toDateStr(end) + 'T23:59:59';
    } else if (timePeriod === 'year') {
      params.from_date = `${selectedDate.getFullYear()}-01-01T00:00:00`;
      params.to_date = `${selectedDate.getFullYear()}-12-31T23:59:59`;
    } else if (timePeriod === 'custom' && confirmedStartDate && confirmedEndDate) {
      params.from_date = _toDateStr(confirmedStartDate) + 'T00:00:00';
      params.to_date = _toDateStr(confirmedEndDate) + 'T23:59:59';
    }

    if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
    if (filterCategoryId) params.category_id = filterCategoryId;

    try {
      setLoading(true);
      const data = await listTransactions(params);
      setTransactions(data.items ?? []);
      setTotalCount(data.total_count ?? 0);
      setTotalAmount(data.total_amount ?? 0);
    } catch {
      setTransactions([]);
      setTotalCount(0);
      setTotalAmount(0);
    } finally {
      setLoading(false);
    }
  }, [activeTab, timePeriod, selectedDate, confirmedStartDate, confirmedEndDate, debouncedQuery, filterCategoryId]);

  useFocusEffect(useCallback(() => { fetchTransactions(); }, [fetchTransactions]));

  React.useEffect(() => {
    setFilterCategoryId(null);
    setFilterCategoryName('');
  }, [activeTab]);

  const openFilterModal = async () => {
    try {
      const cats = await listCategories(activeTab);
      setFilterCategories(cats);
    } catch {
      setFilterCategories([]);
    }
    setShowFilterModal(true);
  };

  const applyFilter = (catId, catName) => {
    setFilterCategoryId(catId);
    setFilterCategoryName(catName);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setFilterCategoryId(null);
    setFilterCategoryName('');
    setShowFilterModal(false);
  };

  const hasActiveFilters = !!filterCategoryId || !!debouncedQuery.trim();

  const openEditModal = async (item) => {
    if (item.reconcile_status === 'reconciled') {
      Alert.alert('Không thể sửa', 'Giao dịch đã đối soát không thể chỉnh sửa.');
      return;
    }
    setEditingTxn(item);
    setEditAmount(String(item.amount ?? ''));
    setEditNote(item.note || '');
    setEditDate(_dateToInput(item.transaction_date));
    setEditCategoryId(item.category_id ?? null);
    setEditCategoryName(item.category_name || '');

    if (item.type !== 'transfer') {
      try {
        const cats = await listCategories(item.type);
        setEditCategories(cats);
      } catch {
        setEditCategories([]);
      }
    }
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingTxn(null);
    setShowCatPicker(false);
  };

  const handleSaveEdit = async () => {
    if (!editingTxn) return;

    const normalizedAmount = String(editAmount).replace(',', '.').trim();
    const amountValue = Number(normalizedAmount);
    if (!normalizedAmount || Number.isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Lỗi', 'Số tiền không hợp lệ.');
      return;
    }

    const isoDate = _inputToISO(editDate);
    if (!isoDate) {
      Alert.alert('Lỗi', 'Ngày không hợp lệ. Định dạng: DD/MM/YYYY');
      return;
    }

    const payload = {
      amount: amountValue,
      note: editNote.trim() || null,
      transaction_date: isoDate,
    };
    if (editCategoryId && editingTxn.type !== 'transfer') {
      payload.category_id = editCategoryId;
    }

    try {
      setSavingEdit(true);
      await updateTransaction(editingTxn.id, payload);
      closeEditModal();
      await fetchTransactions();
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Không cập nhật được giao dịch');
    } finally {
      setSavingEdit(false);
    }
  };

  const renderTransactionItem = ({ item }) => {
    const date = new Date(item.transaction_date);
    const displayDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    const title = item.category_name || (item.type === 'income' ? 'Thu nhập' : item.type === 'transfer' ? 'Chuyển khoản' : 'Chi phí');
    const note = item.note?.trim();
    const amount = parseFloat(item.amount);
    const isReconciled = item.reconcile_status === 'reconciled';

    return (
      <TouchableOpacity
        style={[styles.transactionItem, isReconciled && styles.transactionItemReconciled]}
        activeOpacity={0.8}
        onPress={() => openEditModal(item)}
      >
        <View style={styles.transactionInfo}>
          <View style={styles.transactionTitleRow}>
            <Text style={styles.transactionName}>{title}</Text>
            {isReconciled && <Text style={styles.reconciledBadge}>Đối soát</Text>}
          </View>
          <Text style={styles.transactionDate}>{displayDate}</Text>
          {note ? <Text style={styles.transactionNote}>{note}</Text> : null}
        </View>
        <Text style={[styles.transactionAmount, item.type === 'income' ? styles.amountIncome : styles.amountExpense]}>
          {item.type === 'income' ? '+' : '-'}{_formatVND(amount)} đ
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} scrollEnabled keyboardShouldPersistTaps="handled">
        {}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerMenu} onPress={() => setSidebarOpen(true)}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Lịch sử giao dịch</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.filterIconBtn, hasActiveFilters && styles.filterIconBtnActive]}
              onPress={openFilterModal}
            >
              <Text style={styles.filterIconText}>{hasActiveFilters ? '🔽' : '⚙️'}</Text>
            </TouchableOpacity>
            <HeaderIconButton icon="➕" onPress={() => navigation.navigate('AddTransaction')} />
          </View>
        </View>

        <View style={styles.content}>
          {}
          <View style={styles.tabContainer}>
            {[['expense', 'Chi phí'], ['income', 'Thu nhập']].map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={[styles.tab, activeTab === val && styles.tabActive]}
                onPress={() => setActiveTab(val)}
              >
                <Text style={[styles.tabText, activeTab === val && styles.tabTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {}
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm theo ghi chú..."
                placeholderTextColor="#aaa"
                value={searchQuery}
                onChangeText={handleSearchChange}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.searchClearBtn}>
                  <Text style={styles.searchClearText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {}
          {(filterCategoryId) && (
            <View style={styles.chipsRow}>
              {filterCategoryId && (
                <TouchableOpacity style={styles.filterChip} onPress={() => { setFilterCategoryId(null); setFilterCategoryName(''); }}>
                  <Text style={styles.filterChipText}>📂 {filterCategoryName}  ✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <DateTimeSelector
            timePeriod={timePeriod}
            selectedDate={selectedDate}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            showCalendar={showCalendar}
            currentCalendarMonth={currentCalendarMonth}
            selectingStartDate={selectingStartDate}
            setTimePeriod={setTimePeriod}
            setSelectedDate={setSelectedDate}
            setCustomStartDate={setCustomStartDate}
            setCustomEndDate={setCustomEndDate}
            setSelectingStartDate={setSelectingStartDate}
            setCurrentCalendarMonth={setCurrentCalendarMonth}
            setConfirmedStartDate={setConfirmedStartDate}
            setConfirmedEndDate={setConfirmedEndDate}
            setShowCalendar={setShowCalendar}
          />

          {}
          {!loading && (
            <View style={styles.summaryBar}>
              <Text style={styles.summaryText}>
                {totalCount} giao dịch
              </Text>
              <Text style={styles.summaryAmount}>
                {activeTab === 'income' ? '+' : '-'}{_formatVND(totalAmount)} đ
              </Text>
            </View>
          )}

          <Text style={styles.editHint}>Chạm vào giao dịch để chỉnh sửa</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#075c09" style={{ marginTop: 30 }} />
          ) : (
            <FlatList
              data={transactions}
              renderItem={renderTransactionItem}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {hasActiveFilters ? 'Không tìm thấy kết quả' : 'Không có giao dịch'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </ScrollView>
      <Footer />

      {}
      <Modal visible={showFilterModal} transparent animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalSheet}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Lọc giao dịch</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Text style={styles.filterModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionLabel}>Danh mục</Text>
            <ScrollView style={styles.filterCatList} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filterCatItem, !filterCategoryId && styles.filterCatItemActive]}
                onPress={() => applyFilter(null, '')}
              >
                <Text style={[styles.filterCatItemText, !filterCategoryId && styles.filterCatItemTextActive]}>
                  Tất cả danh mục
                </Text>
              </TouchableOpacity>
              {filterCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.filterCatItem, filterCategoryId === cat.id && styles.filterCatItemActive]}
                  onPress={() => applyFilter(cat.id, cat.name)}
                >
                  <Text style={[styles.filterCatItemText, filterCategoryId === cat.id && styles.filterCatItemTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.clearFiltersBtn} onPress={clearFilters}>
              <Text style={styles.clearFiltersBtnText}>Xóa bộ lọc</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={closeEditModal}>
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalSheet}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Chỉnh sửa giao dịch</Text>
              <TouchableOpacity onPress={closeEditModal} disabled={savingEdit}>
                <Text style={styles.editModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {}
              <Text style={styles.editLabel}>Số tiền</Text>
              <TextInput
                style={styles.editInput}
                keyboardType="numeric"
                value={editAmount}
                onChangeText={setEditAmount}
                placeholder="Nhập số tiền"
                placeholderTextColor="#999"
              />

              {}
              <Text style={styles.editLabel}>Ngày (DD/MM/YYYY)</Text>
              <TextInput
                style={styles.editInput}
                value={editDate}
                onChangeText={setEditDate}
                placeholder="VD: 15/04/2026"
                placeholderTextColor="#999"
                keyboardType="numbers-and-punctuation"
              />

              {}
              {editingTxn?.type !== 'transfer' && (
                <>
                  <Text style={styles.editLabel}>Danh mục</Text>
                  <TouchableOpacity
                    style={styles.editCategoryBtn}
                    onPress={() => setShowCatPicker(true)}
                  >
                    <Text style={editCategoryName ? styles.editCategoryBtnText : styles.editCategoryBtnPlaceholder}>
                      {editCategoryName || 'Chọn danh mục'}
                    </Text>
                    <Text style={styles.editCategoryArrow}>›</Text>
                  </TouchableOpacity>
                </>
              )}

              {}
              <Text style={styles.editLabel}>Ghi chú</Text>
              <TextInput
                style={[styles.editInput, styles.editNoteInput]}
                value={editNote}
                onChangeText={setEditNote}
                placeholder="Nhập ghi chú"
                placeholderTextColor="#999"
                multiline
              />

              {}
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.editBtnCancel} onPress={closeEditModal} disabled={savingEdit}>
                  <Text style={styles.editBtnCancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editBtnSave, savingEdit && { opacity: 0.7 }]}
                  onPress={handleSaveEdit}
                  disabled={savingEdit}
                >
                  {savingEdit
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.editBtnSaveText}>Lưu</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {}
      <Modal visible={showCatPicker} transparent animationType="slide" onRequestClose={() => setShowCatPicker(false)}>
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalSheet}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Chọn danh mục</Text>
              <TouchableOpacity onPress={() => setShowCatPicker(false)}>
                <Text style={styles.filterModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.filterCatList} showsVerticalScrollIndicator={false}>
              {editCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.filterCatItem, editCategoryId === cat.id && styles.filterCatItemActive]}
                  onPress={() => {
                    setEditCategoryId(cat.id);
                    setEditCategoryName(cat.name);
                    setShowCatPicker(false);
                  }}
                >
                  <Text style={[styles.filterCatItemText, editCategoryId === cat.id && styles.filterCatItemTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SidebarDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { paddingBottom: 40 },

  header: {
    backgroundColor: '#075c09',
    padding: 20,
    paddingTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerMenu: { paddingHorizontal: 10, paddingVertical: 10 },
  hamburgerLine: { width: 24, height: 3, backgroundColor: '#fff', marginVertical: 3, borderRadius: 2 },
  headerContent: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  filterIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  filterIconBtnActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterIconText: { fontSize: 18 },

  content: { padding: 15 },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#075c09', backgroundColor: 'rgba(7,92,9,0.05)' },
  tabText: { fontSize: 16, color: '#999', fontWeight: '600' },
  tabTextActive: { color: '#075c09' },

  searchRow: { marginBottom: 10 },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  searchIcon: { fontSize: 16, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, color: '#333', paddingVertical: 8 },
  searchClearBtn: { padding: 6 },
  searchClearText: { fontSize: 14, color: '#999' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  filterChip: {
    backgroundColor: 'rgba(7,92,9,0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipText: { fontSize: 13, color: '#075c09', fontWeight: '600' },

  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  summaryText: { fontSize: 13, color: '#666', fontWeight: '500' },
  summaryAmount: { fontSize: 14, fontWeight: '700', color: '#075c09' },

  editHint: { fontSize: 12, color: '#666', marginBottom: 8, marginLeft: 4 },

  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 15,
    marginVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#075c09',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  transactionItemReconciled: { borderLeftColor: '#aaa', opacity: 0.85 },
  transactionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  transactionInfo: { flex: 1 },
  transactionName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 3 },
  transactionDate: { fontSize: 13, color: '#999' },
  transactionNote: { fontSize: 12, color: '#666', marginTop: 3 },
  transactionAmount: { fontSize: 15, fontWeight: 'bold', marginLeft: 10 },
  amountExpense: { color: '#d9534f' },
  amountIncome: { color: '#5cb85c' },
  reconciledBadge: {
    fontSize: 10,
    color: '#888',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: 15, color: '#999', fontWeight: '500' },

  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  filterModalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '70%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterModalTitle: { fontSize: 17, fontWeight: '700', color: '#222' },
  filterModalClose: { fontSize: 20, color: '#555', padding: 4 },
  filterSectionLabel: { fontSize: 13, fontWeight: '600', color: '#888', marginTop: 14, marginBottom: 8 },
  filterCatList: { maxHeight: 320 },
  filterCatItem: {
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  filterCatItemActive: { backgroundColor: 'rgba(7,92,9,0.12)' },
  filterCatItemText: { fontSize: 15, color: '#333' },
  filterCatItemTextActive: { color: '#075c09', fontWeight: '700' },
  clearFiltersBtn: {
    marginTop: 14,
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  clearFiltersBtnText: { fontSize: 15, color: '#d9534f', fontWeight: '600' },

  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  editModalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '85%',
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  editModalTitle: { fontSize: 17, fontWeight: '700', color: '#222' },
  editModalClose: { fontSize: 20, color: '#555', padding: 4 },
  editLabel: { fontSize: 13, fontWeight: '600', color: '#075c09', marginBottom: 6, marginTop: 12 },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#222',
  },
  editNoteInput: { minHeight: 70, textAlignVertical: 'top' },
  editCategoryBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  editCategoryBtnText: { fontSize: 15, color: '#222' },
  editCategoryBtnPlaceholder: { fontSize: 15, color: '#aaa' },
  editCategoryArrow: { fontSize: 20, color: '#aaa' },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, marginBottom: 4 },
  editBtnCancel: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
  },
  editBtnCancelText: { color: '#444', fontWeight: '600', fontSize: 15 },
  editBtnSave: {
    paddingVertical: 11,
    paddingHorizontal: 22,
    backgroundColor: '#075c09',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    marginLeft: 10,
  },
  editBtnSaveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
