import React, { useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import SidebarDrawer from '../components/SidebarDrawer';
import HeaderIconButton from '../components/HeaderIconButton';
import DateTimeSelector from '../components/DateTimeSelector';
import { listTransactions, updateTransaction } from '../api/transactionsApi';

const _toDateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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
  const [transactions, setTransactions] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState(null);
  const [editAmount, setEditAmount] = React.useState('');
  const [editNote, setEditNote] = React.useState('');
  const [savingEdit, setSavingEdit] = React.useState(false);

  const fetchTransactions = useCallback(async () => {
    const params = { type: activeTab, limit: 100 };

    if (timePeriod === 'day') {
      params.from_date = _toDateStr(selectedDate) + 'T00:00:00';
      params.to_date = _toDateStr(selectedDate) + 'T23:59:59';
    } else if (timePeriod === 'week') {
      const start = new Date(selectedDate);
      start.setDate(selectedDate.getDate() - selectedDate.getDay() + 1); // Monday
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

    try {
      setLoading(true);
      const data = await listTransactions(params);
      setTransactions(data);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, timePeriod, selectedDate, confirmedStartDate, confirmedEndDate]);

  useFocusEffect(useCallback(() => { fetchTransactions(); }, [fetchTransactions]));

  const openEditModal = (item) => {
    if (item.reconcile_status === 'reconciled') {
      Alert.alert('Không thể sửa', 'Giao dịch đã đối soát nên không thể chỉnh sửa.');
      return;
    }
    setEditingTransaction(item);
    setEditAmount(String(item.amount ?? ''));
    setEditNote(item.note || '');
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingTransaction(null);
    setEditAmount('');
    setEditNote('');
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;

    const normalizedAmount = String(editAmount).replace(',', '.').trim();
    const amountValue = Number(normalizedAmount);
    if (!normalizedAmount || Number.isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Lỗi', 'Số tiền không hợp lệ.');
      return;
    }

    try {
      setSavingEdit(true);
      await updateTransaction(editingTransaction.id, {
        amount: amountValue,
        note: editNote.trim() || null,
      });
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
    const displayDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    const title = item.category_name || (item.type === 'income' ? 'Thu nhập' : 'Chi phí');
    const note = item.note?.trim();
    const amount = parseFloat(item.amount);
    return (
      <TouchableOpacity style={styles.transactionItem} activeOpacity={0.8} onPress={() => openEditModal(item)}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionName}>{title}</Text>
          <Text style={styles.transactionDate}>{displayDate}</Text>
          {note ? <Text style={styles.transactionNote}>{note}</Text> : null}
        </View>
        <Text style={[styles.transactionAmount, item.type === 'income' ? styles.amountIncome : styles.amountExpense]}>
          {item.type === 'income' ? '+' : '-'}{amount.toLocaleString('vi-VN')} đ
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.container} scrollEnabled={true}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerMenu} onPress={() => setSidebarOpen(true)}>
            <View style={styles.hamburgerLine}></View>
            <View style={styles.hamburgerLine}></View>
            <View style={styles.hamburgerLine}></View>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Lịch sử giao dịch</Text>
          </View>
          <HeaderIconButton 
            icon="➕" 
            onPress={() => navigation.navigate('AddTransaction')}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'expense' && styles.tabActive]}
              onPress={() => setActiveTab('expense')}
            >
              <Text style={[styles.tabText, activeTab === 'expense' && styles.tabTextActive]}>Chi phí</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'income' && styles.tabActive]}
              onPress={() => setActiveTab('income')}
            >
              <Text style={[styles.tabText, activeTab === 'income' && styles.tabTextActive]}>Thu nhập</Text>
            </TouchableOpacity>
          </View>

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
                  <Text style={styles.emptyText}>Không có giao dịch</Text>
                </View>
              }
            />
          )}
        </View>
      </ScrollView>

      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={closeEditModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chỉnh sửa giao dịch</Text>

            <Text style={styles.modalLabel}>Số tiền</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={editAmount}
              onChangeText={setEditAmount}
              placeholder="Nhập số tiền"
              placeholderTextColor="#999"
            />

            <Text style={styles.modalLabel}>Ghi chú</Text>
            <TextInput
              style={[styles.modalInput, styles.modalNoteInput]}
              value={editNote}
              onChangeText={setEditNote}
              placeholder="Nhập ghi chú"
              placeholderTextColor="#999"
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={closeEditModal} disabled={savingEdit}>
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtnSave, savingEdit && { opacity: 0.7 }]} onPress={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnSaveText}>Lưu</Text>}
              </TouchableOpacity>
            </View>
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
  header: { 
    backgroundColor: '#075c09', 
    padding: 20, 
    paddingTop: 30, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  headerMenu: { paddingHorizontal: 10, paddingVertical: 10 },
  hamburgerLine: { width: 24, height: 3, backgroundColor: '#fff', marginVertical: 4, marginTop: 3, borderRadius: 2 },
  headerContent: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 15 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd', marginBottom: 15, borderRadius: 8, overflow: 'hidden' },
  tab: { flex: 1, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#075c09', backgroundColor: 'rgba(7, 92, 9, 0.05)' },
  tabText: { fontSize: 16, color: '#999', fontWeight: '600' },
  tabTextActive: { color: '#075c09' },
  editHint: { fontSize: 12, color: '#666', marginBottom: 8, marginTop: -4, marginLeft: 4 },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#075c09',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionInfo: { flex: 1 },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#999',
  },
  transactionNote: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  amountExpense: {
    color: '#d9534f',
  },
  amountIncome: {
    color: '#5cb85c',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#222',
    marginBottom: 12,
  },
  modalNoteInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBtnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
  },
  modalBtnCancelText: {
    color: '#444',
    fontWeight: '600',
  },
  modalBtnSave: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#075c09',
    borderRadius: 8,
    minWidth: 72,
    alignItems: 'center',
    marginLeft: 8,
  },
  modalBtnSaveText: {
    color: '#fff',
    fontWeight: '700',
  },
});
