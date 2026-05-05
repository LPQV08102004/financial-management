import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import SidebarDrawer from '../components/SidebarDrawer';
import Header from '../components/Header';
import HeaderIconButton from '../components/HeaderIconButton';
import Footer from '../components/Footer';
import DateTimeSelector from '../components/DateTimeSelector';
import { getBalance, getStatsByCategory } from '../api/analyticsApi';
import { listTransactions } from '../api/transactionsApi';

const _toDateStr = (d) => {
  if (!d) return undefined;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const _formatCompactVND = (num) => {
  const n = Number(num);
  if (n >= 1_000_000_000) {
    const result = (n / 1_000_000_000).toFixed(3).replace(/\.?0+$/, '');
    return result + 'B';
  }
  if (n >= 1_000_000) {
    const result = (n / 1_000_000).toFixed(3).replace(/\.?0+$/, '');
    return result + 'M';
  }
  if (n >= 1_000) {
    const result = (n / 1_000).toFixed(3).replace(/\.?0+$/, '');
    return result + 'K';
  }
  return n.toLocaleString('vi-VN');
};

export default function HomeScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('expense');
  const [timePeriod, setTimePeriod] = useState('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [selectingStartDate, setSelectingStartDate] = useState(true);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [confirmedStartDate, setConfirmedStartDate] = useState(null);
  const [confirmedEndDate, setConfirmedEndDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Analytics state ────────────────────────────────────────────────────────
  const [totalBalance, setTotalBalance] = useState(null);
  const [balance, setBalance] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  const _getPeriodParams = useCallback(() => {
    if (timePeriod === 'custom') {
      return { period: 'custom', from_date: _toDateStr(confirmedStartDate), to_date: _toDateStr(confirmedEndDate) };
    }
    return { period: timePeriod, date: _toDateStr(selectedDate) };
  }, [timePeriod, selectedDate, confirmedStartDate, confirmedEndDate]);

  const _getTransactionDateParams = useCallback(() => {
    const params = { type: activeTab, limit: 10 };
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
    return params;
  }, [activeTab, timePeriod, selectedDate, confirmedStartDate, confirmedEndDate]);

  const fetchAll = useCallback(async () => {
    const periodParams = _getPeriodParams();
    const today = _toDateStr(new Date());

    const [allTimeBalRes, balRes, statsRes, txnsRes] = await Promise.allSettled([
      getBalance({ period: 'custom', from_date: '2000-01-01', to_date: today }),
      getBalance(periodParams),
      getStatsByCategory({ ...periodParams, type: activeTab }),
      listTransactions(_getTransactionDateParams()),
    ]);

    setTotalBalance(allTimeBalRes.status === 'fulfilled' ? allTimeBalRes.value : null);
    setBalance(balRes.status === 'fulfilled' ? balRes.value : null);
    setCategoryStats(statsRes.status === 'fulfilled' ? statsRes.value : []);
    setRecentTransactions(txnsRes.status === 'fulfilled' ? txnsRes.value : []);
  }, [activeTab, _getPeriodParams, _getTransactionDateParams]);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  // Build pie segments
  const CIRCUMFERENCE = 628.31;
  let _pieOffset = 0;
  const pieSegments = categoryStats.map((item) => {
    const arcLen = (Number(item.percentage) / 100) * CIRCUMFERENCE;
    const seg = { arcLen, offset: _pieOffset, color: item.color || '#999999', category: item.category, amount: Number(item.amount) };
    _pieOffset += arcLen;
    return seg;
  });

  const renderTransactionItem = ({ item }) => {
    const date = new Date(item.transaction_date);
    const displayDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const title = item.category_name || (item.type === 'income' ? 'Thu nhập' : 'Chi phí');
    const note = item.note?.trim();
    const amount = parseFloat(item.amount);
    return (
      <View style={styles.txnItem}>
        <View style={styles.txnInfo}>
          <Text style={styles.txnName}>{title}</Text>
          <Text style={styles.txnDate}>{displayDate}</Text>
          {note ? <Text style={styles.txnNote}>{note}</Text> : null}
        </View>
        <Text style={[styles.txnAmount, item.type === 'income' ? styles.amountIncome : styles.amountExpense]}>
          {item.type === 'income' ? '+' : '-'}{_formatCompactVND(amount)} đ
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} scrollEnabled={true}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerMenu} onPress={() => setSidebarOpen(true)}>
            <View style={styles.hamburgerLine}></View>
            <View style={styles.hamburgerLine}></View>
            <View style={styles.hamburgerLine}></View>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerLabelContainer}>
              <Text style={styles.iconLabel}>💳</Text>
              <Text style={styles.headerText}>Tổng số dư</Text>
            </View>
            <Text style={styles.balanceText}>
              {totalBalance ? _formatCompactVND(totalBalance.balance) + ' đ' : '—'}
            </Text>
          </View>
          <HeaderIconButton icon="📋" onPress={() => navigation.navigate('Transaction')} />
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'expense' && styles.tabActive]} onPress={() => setActiveTab('expense')}>
            <Text style={[styles.tabText, activeTab === 'expense' && styles.tabTextActive]}>Chi phí</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'income' && styles.tabActive]} onPress={() => setActiveTab('income')}>
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

        {/* Pie Chart */}
        <View style={styles.chartContainer}>
          <Svg width="320" height="320" viewBox="0 0 320 320">
            {pieSegments.length > 0 ? (
              <G rotation="-90" origin="160,160">
                {pieSegments.map((seg, i) => (
                  <Circle
                    key={i}
                    cx="160" cy="160" r="100"
                    stroke={seg.color}
                    strokeWidth="35"
                    fill="none"
                    strokeDasharray={`${seg.arcLen.toFixed(2)} ${CIRCUMFERENCE}`}
                    strokeDashoffset={`${(-seg.offset).toFixed(2)}`}
                  />
                ))}
              </G>
            ) : (
              <Circle cx="160" cy="160" r="100" stroke="#e0e0e0" strokeWidth="35" fill="none" />
            )}
          </Svg>
          <View style={styles.chartOverlay}>
            <Text style={styles.chartAmount}>
              {balance
                ? (activeTab === 'expense'
                    ? _formatCompactVND(balance.total_expense)
                    : _formatCompactVND(balance.total_income)) + ' đ'
                : '—'}
            </Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddTransaction')}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Category breakdown */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Theo danh mục</Text>
          {categoryStats.length > 0 ? (
            categoryStats.map((item, i) => (
              <View key={i} style={[styles.categoryItem, { borderLeftColor: item.color || '#075c09', backgroundColor: item.color ? item.color + '22' : '#f8f9fa' }]}>
                <Text style={styles.categoryName}>{item.category}</Text>
                <View style={styles.categoryRight}>
                  <Text style={styles.categoryPct}>{item.percentage}%</Text>
                  <Text style={styles.categoryAmount}>{_formatCompactVND(item.amount)} đ</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Không có dữ liệu</Text>
          )}
        </View>

        {/* Recent transactions */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transaction')}>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          {recentTransactions.length > 0 ? (
            <FlatList
              data={recentTransactions}
              renderItem={renderTransactionItem}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>Không có giao dịch</Text>
          )}
        </View>
      </ScrollView>
      <Footer />

      <SidebarDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, position: 'relative' },
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { paddingBottom: 40 },
  header: { backgroundColor: '#075c09', padding: 20, paddingTop: 30, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerMenu: { paddingHorizontal: 10, paddingVertical: 10 },
  hamburgerLine: { width: 24, height: 3, backgroundColor: '#fff', marginVertical: 4, marginTop: 3, borderRadius: 2 },
  headerContent: { flex: 1, alignItems: 'center', paddingRight: 30 },
  headerLabelContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconLabel: { fontSize: 24, marginRight: 8, color: '#fff' },
  headerText: { color: '#fff', fontSize: 20 },
  balanceText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  tab: { flex: 1, paddingVertical: 15, paddingHorizontal: 20, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#075c09' },
  tabText: { fontSize: 16, color: '#999', fontWeight: '600' },
  tabTextActive: { color: '#075c09' },
  chartContainer: { backgroundColor: '#fff', paddingVertical: 30, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ddd', position: 'relative', minHeight: 360 },
  chartOverlay: { position: 'absolute', width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center' },
  chartAmount: { fontSize: 28, fontWeight: 'bold', color: '#075c09', textAlign: 'center' },
  addButton: { position: 'absolute', bottom: 15, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  addButtonText: { fontSize: 36, color: '#333', fontWeight: 'bold' },
  sectionContainer: { backgroundColor: '#fff', paddingVertical: 15, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#eee', marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 10 },
  seeAll: { fontSize: 14, color: '#075c09', fontWeight: '600' },
  categoryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, marginVertical: 4, borderRadius: 10, borderLeftWidth: 4 },
  categoryRight: { alignItems: 'flex-end' },
  categoryName: { fontSize: 15, fontWeight: '600', color: '#333' },
  categoryPct: { fontSize: 12, color: '#888', marginBottom: 2 },
  categoryAmount: { fontSize: 15, fontWeight: 'bold', color: '#075c09' },
  emptyText: { color: '#999', textAlign: 'center', padding: 10 },
  txnItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, marginVertical: 4, backgroundColor: '#f8f9fa', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#075c09' },
  txnInfo: { flex: 1 },
  txnName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 3 },
  txnDate: { fontSize: 13, color: '#999' },
  txnNote: { fontSize: 12, color: '#666', marginTop: 3 },
  txnAmount: { fontSize: 15, fontWeight: 'bold', marginLeft: 10 },
  amountExpense: { color: '#d9534f' },
  amountIncome: { color: '#5cb85c' },
});
