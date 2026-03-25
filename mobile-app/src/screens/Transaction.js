import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import SidebarDrawer from '../components/SidebarDrawer';
import HeaderIconButton from '../components/HeaderIconButton';
import DateTimeSelector from '../components/DateTimeSelector';

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

  const allTransactions = [
    { id: '1', name: 'Sức khỏe', amount: 50000, date: new Date(2026, 2, 15), type: 'expense' },
    { id: '2', name: 'Cafe', amount: 20000, date: new Date(2026, 2, 14), type: 'expense' },
    { id: '3', name: 'Tập thể dục', amount: 30000, date: new Date(2026, 2, 13), type: 'expense' },
    { id: '4', name: 'Lương tháng', amount: 200000, date: new Date(2026, 2, 1), type: 'income' },
    { id: '5', name: 'Bonus', amount: 50000, date: new Date(2026, 1, 28), type: 'income' },
  ];

  const getFilteredTransactions = () => {
    let filtered = allTransactions.filter(t => t.type === activeTab);
    
    const today = new Date();
    let startDate, endDate;

    if (timePeriod === 'day') {
      startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1);
    } else if (timePeriod === 'week') {
      const weekStart = new Date(selectedDate);
      weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      startDate = weekStart;
      endDate = weekEnd;
    } else if (timePeriod === 'month') {
      startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
    } else if (timePeriod === 'year') {
      startDate = new Date(selectedDate.getFullYear(), 0, 1);
      endDate = new Date(selectedDate.getFullYear() + 1, 0, 1);
    } else if (timePeriod === 'custom' && confirmedStartDate && confirmedEndDate) {
      startDate = confirmedStartDate;
      endDate = new Date(confirmedEndDate);
      endDate.setDate(endDate.getDate() + 1);
    }

    if (startDate && endDate) {
      return filtered.filter(t => t.date >= startDate && t.date < endDate).reverse();
    }
    return filtered.reverse();
  };

  const transactions = getFilteredTransactions();

  const renderTransactionItem = ({ item }) => {
    const displayDate = `${item.date.getDate().toString().padStart(2, '0')}/${(item.date.getMonth() + 1).toString().padStart(2, '0')}/${item.date.getFullYear()}`;
    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionName}>{item.name}</Text>
          <Text style={styles.transactionDate}>{displayDate}</Text>
        </View>
        <Text style={[styles.transactionAmount, item.type === 'income' ? styles.amountIncome : styles.amountExpense]}>
          {item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString('vi-VN')} đ
        </Text>
      </View>
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

          <FlatList
            data={transactions}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyMessage={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không có giao dịch</Text>
              </View>
            }
          />
        </View>
      </ScrollView>

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
    marginBottom: 5,
  },
  transactionDate: {
    fontSize: 14,
    color: '#999',
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
});
