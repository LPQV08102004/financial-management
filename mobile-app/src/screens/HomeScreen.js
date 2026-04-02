import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import SidebarDrawer from '../components/SidebarDrawer';
import HeaderIconButton from '../components/HeaderIconButton';
import DateTimeSelector from '../components/DateTimeSelector';
import { getBalance, getStatsByCategory } from '../api/analyticsApi';

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
  const [totalBalance, setTotalBalance] = useState(null);  // all-time, for header
  const [balance, setBalance] = useState(null);            // period-filtered, for pie centre
  const [categoryStats, setCategoryStats] = useState([]);

  const _toDateStr = (d) => {
    if (!d) return undefined;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Fetch all-time balance once for the header
  useEffect(() => {
    const today = _toDateStr(new Date());
    getBalance({ period: 'custom', from_date: '2000-01-01', to_date: today })
      .then(setTotalBalance)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = timePeriod === 'custom'
      ? { period: 'custom', from_date: _toDateStr(confirmedStartDate), to_date: _toDateStr(confirmedEndDate) }
      : { period: timePeriod, date: _toDateStr(selectedDate) };
    const fetchAnalytics = async () => {
      try {
        const [bal, stats] = await Promise.all([
          getBalance(params),
          getStatsByCategory({ ...params, type: activeTab }),
        ]);
        if (!cancelled) {
          setBalance(bal);
          setCategoryStats(stats);
        }
      } catch (_) { /* backend not available yet */ }
    };
    fetchAnalytics();
    return () => { cancelled = true; };
  }, [activeTab, timePeriod, selectedDate, confirmedStartDate, confirmedEndDate]);

  // Build pie segments from API category stats
  const CIRCUMFERENCE = 628.31;
  let _pieOffset = 0;
  const pieSegments = categoryStats.map((item) => {
    const arcLen = (Number(item.percentage) / 100) * CIRCUMFERENCE;
    const seg = { arcLen, offset: _pieOffset, color: item.color || '#999999', category: item.category, amount: Number(item.amount) };
    _pieOffset += arcLen;
    return seg;
  });

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
            <View style={styles.headerLabelContainer}>
              <Text style={styles.iconLabel}>💳</Text>
              <Text style={styles.headerText}>Tổng số dư</Text>
            </View>
            <Text style={styles.balanceText}>
              {totalBalance ? Number(totalBalance.balance).toLocaleString('vi-VN') + ' đ' : '—'}
            </Text>
          </View>
          <HeaderIconButton 
            icon="📋" 
            onPress={() => navigation.navigate('Transaction')}
          />
        </View>

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

      {/* Pie Chart */}
      <View style={styles.chartContainer}>
        <Svg width="320" height="320" viewBox="0 0 320 320">
          {pieSegments.length > 0 ? (
            <G rotation="-90" origin="160,160">
              {pieSegments.map((seg, i) => (
                <Circle
                  key={i}
                  cx="160"
                  cy="160"
                  r="100"
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
        {/* Center total */}
        <View style={styles.chartOverlay}>
          <Text style={styles.chartAmount}>
            {balance
              ? (activeTab === 'expense'
                  ? Number(balance.total_expense).toLocaleString('vi-VN')
                  : Number(balance.total_income).toLocaleString('vi-VN')) + ' đ'
              : '—'}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddTransaction')}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Category List */}
      <View style={styles.categoryContainer}>
        {categoryStats.length > 0 ? (
          categoryStats.map((item, i) => (
            <View
              key={i}
              style={[
                styles.categoryItem,
                { borderLeftColor: item.color || '#075c09', backgroundColor: item.color ? item.color + '22' : '#f8f9fa' },
              ]}
            >
              <Text style={styles.categoryName}>{item.category}</Text>
              <Text style={styles.categoryAmount}>
                {Number(item.amount).toLocaleString('vi-VN')} đ
              </Text>
            </View>
          ))
        ) : (
          <Text style={{ color: '#999', textAlign: 'center', padding: 10 }}>Không có dữ liệu</Text>
        )}
      </View>
     
      </ScrollView>

      <SidebarDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, position: 'relative' },
  container: { flex: 1, backgroundColor: '#f8f9fa' },
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
  content: { padding: 20 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#075c09', padding: 15, borderRadius: 10, marginTop: 20, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  chartContainer: { backgroundColor: '#fff', paddingVertical: 30, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ddd', position: 'relative', minHeight: 360 },
  chartOverlay: { position: 'absolute', width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center' },
  chartAmount: { fontSize: 28, fontWeight: 'bold', color: '#075c09', textAlign: 'center' },
  addButton: { position: 'absolute', bottom: 15, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  addButtonText: { fontSize: 36, color: '#333', fontWeight: 'bold' },
  categoryContainer: { backgroundColor: '#fff', paddingVertical: 20, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  categoryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 15, marginVertical: 5, backgroundColor: '#f8f9fa', borderRadius: 10, borderLeftWidth: 4, borderLeftColor: '#075c09' },
  categoryItemHealth: { backgroundColor: '#E8F5E9', borderLeftColor: '#4CAF50' },
  categoryItemCafe: { backgroundColor: '#FFF3E0', borderLeftColor: '#FF9800' },
  categoryItemExercise: { backgroundColor: '#F3E5F5', borderLeftColor: '#9C27B0' },
  categoryItemIncome: { backgroundColor: '#E3F2FD', borderLeftColor: '#2196F3' },
  categoryName: { fontSize: 16, fontWeight: '600', color: '#333' },
  categoryAmount: { fontSize: 16, fontWeight: 'bold', color: '#075c09' },
});