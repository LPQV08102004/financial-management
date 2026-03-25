import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import SidebarDrawer from '../components/SidebarDrawer';
import HeaderIconButton from '../components/HeaderIconButton';
import DateTimeSelector from '../components/DateTimeSelector';

export default function HomeScreen({ navigation }) {
  const [amount, setAmount] = useState('');
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
            <Text style={styles.balanceText}>5,000,000 đ</Text>
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

      {/* Gray Circle Chart - Pie Chart */}
      <View style={styles.chartContainer}>
        <Svg width="320" height="320" viewBox="0 0 320 320">
          {activeTab === 'expense' ? (
            // Multi-colored pie chart for expenses
            <G rotation="-90" origin="160,160">
              {/* Health - 50% (xanh lá) - 180 degrees */}
              <Circle
                cx="160"
                cy="160"
                r="100"
                stroke="#4CAF50"
                strokeWidth="35"
                fill="none"
                strokeDasharray="314.16 628.31"
              />
              {/* Cafe - 20% (cam) - 72 degrees */}
              <Circle
                cx="160"
                cy="160"
                r="100"
                stroke="#FF9800"
                strokeWidth="35"
                fill="none"
                strokeDasharray="125.66 628.31"
                strokeDashoffset="-314.16"
              />
              {/* Exercise - 30% (tím) - 108 degrees */}
              <Circle
                cx="160"
                cy="160"
                r="100"
                stroke="#9C27B0"
                strokeWidth="35"
                fill="none"
                strokeDasharray="188.50 628.31"
                strokeDashoffset="-439.82"
              />
            </G>
          ) : (
            // Solid blue circle for income
            <Circle
              cx="160"
              cy="160"
              r="100"
              stroke="#2196F3"
              strokeWidth="35"
              fill="none"
              strokeDasharray="628.31 628.31"
            />
          )}
        </Svg>
        {/* Center circle with amount */}
        <View style={styles.chartOverlay}>
          <Text style={styles.chartAmount}>
            {activeTab === 'expense' ? '100.000' : '200.000'} đ
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddTransaction')}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Category List */}
      <View style={styles.categoryContainer}>
        {activeTab === 'expense' ? (
          <>
            <View style={[styles.categoryItem, styles.categoryItemHealth]}>
              <Text style={styles.categoryName}>🏥 Sức khỏe</Text>
              <Text style={styles.categoryAmount}>50.000 đ</Text>
            </View>
            <View style={[styles.categoryItem, styles.categoryItemCafe]}>
              <Text style={styles.categoryName}>☕ Cafe</Text>
              <Text style={styles.categoryAmount}>20.000 đ</Text>
            </View>
            <View style={[styles.categoryItem, styles.categoryItemExercise]}>
              <Text style={styles.categoryName}>🏋️ Tập thể dục</Text>
              <Text style={styles.categoryAmount}>30.000 đ</Text>
            </View>
          </>
        ) : (
          <View style={[styles.categoryItem, styles.categoryItemIncome]}>
            <Text style={styles.categoryName}>💼 Lương tháng</Text>
            <Text style={styles.categoryAmount}>200.000 đ</Text>
          </View>
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