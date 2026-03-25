import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import SidebarDrawer from '../components/SidebarDrawer';
import HeaderIconButton from '../components/HeaderIconButton';
import DateTimeSelector from '../components/DateTimeSelector';

// Category color mapping
const categoryColors = {
  'Sức khỏe': '#e74c3c',
  'Cafe': '#f39c12',
  'Tập thể dục': '#3498db',
  'Lương tháng': '#27ae60',
  'Bonus': '#f1c40f',
  'Ăn cơm trưa': '#9b59b6',
  'Freelance': '#1abc9c',
};

export default function Chart({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [timePeriod, setTimePeriod] = useState('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [selectingStartDate, setSelectingStartDate] = useState(true);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [confirmedStartDate, setConfirmedStartDate] = useState(null);
  const [confirmedEndDate, setConfirmedEndDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);

  // Sample transaction data
  const allTransactions = [
    { id: '1', name: 'Sức khỏe', amount: 50000, date: new Date(2026, 2, 15), type: 'expense' },
    { id: '2', name: 'Cafe', amount: 20000, date: new Date(2026, 2, 15), type: 'expense' },
    { id: '3', name: 'Tập thể dục', amount: 30000, date: new Date(2026, 2, 14), type: 'expense' },
    { id: '4', name: 'Lương tháng', amount: 300000, date: new Date(2026, 2, 10), type: 'income' },
    { id: '5', name: 'Bonus', amount: 100000, date: new Date(2026, 2, 5), type: 'income' },
    { id: '6', name: 'Ăn cơm trưa', amount: 40000, date: new Date(2026, 2, 12), type: 'expense' },
    { id: '7', name: 'Freelance', amount: 200000, date: new Date(2026, 2, 8), type: 'income' },
  ];

  // Calculate chart data based on time period
  const getChartData = () => {
    let data = [];

    // For 'all' tab - original income vs expense
    if (activeTab === 'all') {
      if (timePeriod === 'day') {
        const dayData = {
          date: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()),
          label: `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}`,
          income: 0,
          expense: 0,
        };
        
        allTransactions.forEach(t => {
          if (t.date.toDateString() === dayData.date.toDateString()) {
            if (t.type === 'income') dayData.income += t.amount;
            if (t.type === 'expense') dayData.expense += t.amount;
          }
        });
        
        dayData.profit = dayData.income - dayData.expense;
        dayData.loss = dayData.expense - dayData.income > 0 ? dayData.expense - dayData.income : 0;
        data.push(dayData);
      } else if (timePeriod === 'week') {
        // Hiển thị tất cả 7 ngày trong tuần
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
        
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(startOfWeek);
          currentDate.setDate(startOfWeek.getDate() + i);
          currentDate.setHours(0, 0, 0, 0);
          
          const dayData = {
            date: new Date(currentDate),
            label: `${currentDate.getDate()}/${currentDate.getMonth() + 1}`,
            income: 0,
            expense: 0,
          };
          
          allTransactions.forEach(t => {
            const transDate = new Date(t.date);
            transDate.setHours(0, 0, 0, 0);
            
            if (transDate.getTime() === currentDate.getTime()) {
              if (t.type === 'income') dayData.income += t.amount;
              if (t.type === 'expense') dayData.expense += t.amount;
            }
          });
          
          dayData.profit = dayData.income - dayData.expense;
          dayData.loss = dayData.expense - dayData.income > 0 ? dayData.expense - dayData.income : 0;
          data.push(dayData);
        }
      } else if (timePeriod === 'month') {
        // Hiển thị 4 tuần trong tháng
        for (let week = 0; week < 4; week++) {
          const weekStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), week * 7 + 1);
          const weekLabel = `Tuần ${week + 1}`;
          
          const weekData = {
            date: weekStart,
            label: weekLabel,
            income: 0,
            expense: 0,
          };
          
          allTransactions.forEach(t => {
            if (t.date.getMonth() === selectedDate.getMonth() && t.date.getFullYear() === selectedDate.getFullYear()) {
              const day = t.date.getDate();
              if (day > week * 7 && day <= (week + 1) * 7) {
                if (t.type === 'income') weekData.income += t.amount;
                if (t.type === 'expense') weekData.expense += t.amount;
              }
            }
          });
          
          weekData.profit = weekData.income - weekData.expense;
          weekData.loss = weekData.expense - weekData.income > 0 ? weekData.expense - weekData.income : 0;
          data.push(weekData);
        }
      } else if (timePeriod === 'year') {
        // Hiển thị 12 tháng trong năm
        for (let month = 0; month < 12; month++) {
          const monthData = {
            date: new Date(selectedDate.getFullYear(), month, 1),
            label: `T${month + 1}`,
            income: 0,
            expense: 0,
          };
          
          allTransactions.forEach(t => {
            if (t.date.getMonth() === month && t.date.getFullYear() === selectedDate.getFullYear()) {
              if (t.type === 'income') monthData.income += t.amount;
              if (t.type === 'expense') monthData.expense += t.amount;
            }
          });
          
          monthData.profit = monthData.income - monthData.expense;
          monthData.loss = monthData.expense - monthData.income > 0 ? monthData.expense - monthData.income : 0;
          data.push(monthData);
        }
      } else if (timePeriod === 'custom' && confirmedStartDate && confirmedEndDate) {
        const current = new Date(confirmedStartDate);
        current.setHours(0, 0, 0, 0);
        const end = new Date(confirmedEndDate);
        end.setHours(23, 59, 59, 999);

        // Hiển thị từng ngày riêng lẻ trong khoảng thời gian
        while (current <= end) {
          const dayData = {
            date: new Date(current),
            label: `${current.getDate()}/${current.getMonth() + 1}`,
            income: 0,
            expense: 0,
          };

          allTransactions.forEach(t => {
            const transDate = new Date(t.date);
            transDate.setHours(0, 0, 0, 0);
            
            if (transDate.getTime() === current.getTime()) {
              if (t.type === 'income') dayData.income += t.amount;
              if (t.type === 'expense') dayData.expense += t.amount;
            }
          });

          dayData.profit = dayData.income - dayData.expense;
          dayData.loss = dayData.expense - dayData.income > 0 ? dayData.expense - dayData.income : 0;
          data.push(dayData);

          current.setDate(current.getDate() + 1);
        }
      }
    } else {
      // For 'expense' and 'income' tabs - breakdown by category
      const transactionType = activeTab === 'expense' ? 'expense' : 'income';
      
      if (timePeriod === 'day') {
        const dayData = {
          date: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()),
          label: `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}`,
          categories: {},
        };
        
        allTransactions.forEach(t => {
          if (t.type === transactionType && t.date.toDateString() === dayData.date.toDateString()) {
            dayData.categories[t.name] = (dayData.categories[t.name] || 0) + t.amount;
          }
        });
        
        data.push(dayData);
      } else if (timePeriod === 'week') {
        // Hiển thị tất cả 7 ngày trong tuần
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
        
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(startOfWeek);
          currentDate.setDate(startOfWeek.getDate() + i);
          currentDate.setHours(0, 0, 0, 0);
          
          const dayData = {
            date: new Date(currentDate),
            label: `${currentDate.getDate()}/${currentDate.getMonth() + 1}`,
            categories: {},
          };
          
          allTransactions.forEach(t => {
            const transDate = new Date(t.date);
            transDate.setHours(0, 0, 0, 0);
            
            if (t.type === transactionType && transDate.getTime() === currentDate.getTime()) {
              dayData.categories[t.name] = (dayData.categories[t.name] || 0) + t.amount;
            }
          });
          
          data.push(dayData);
        }
      } else if (timePeriod === 'month') {
        // Hiển thị 4 tuần trong tháng
        for (let week = 0; week < 4; week++) {
          const weekStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), week * 7 + 1);
          const weekLabel = `Tuần ${week + 1}`;
          
          const weekData = {
            date: weekStart,
            label: weekLabel,
            categories: {},
          };
          
          allTransactions.forEach(t => {
            if (t.type === transactionType && t.date.getMonth() === selectedDate.getMonth() && t.date.getFullYear() === selectedDate.getFullYear()) {
              const day = t.date.getDate();
              if (day > week * 7 && day <= (week + 1) * 7) {
                weekData.categories[t.name] = (weekData.categories[t.name] || 0) + t.amount;
              }
            }
          });
          
          data.push(weekData);
        }
      } else if (timePeriod === 'year') {
        // Hiển thị 12 tháng trong năm
        for (let month = 0; month < 12; month++) {
          const monthData = {
            date: new Date(selectedDate.getFullYear(), month, 1),
            label: `T${month + 1}`,
            categories: {},
          };
          
          allTransactions.forEach(t => {
            if (t.type === transactionType && t.date.getMonth() === month && t.date.getFullYear() === selectedDate.getFullYear()) {
              monthData.categories[t.name] = (monthData.categories[t.name] || 0) + t.amount;
            }
          });
          
          data.push(monthData);
        }
      } else if (timePeriod === 'custom' && confirmedStartDate && confirmedEndDate) {
        const current = new Date(confirmedStartDate);
        current.setHours(0, 0, 0, 0);
        const end = new Date(confirmedEndDate);
        end.setHours(23, 59, 59, 999);

        const customWeeks = {};
        let weekIndex = 0;
        
        while (current <= end) {
          const weekStart = new Date(current);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(current);
          weekEnd.setDate(weekEnd.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          
          if (weekEnd > end) {
            weekEnd.setTime(end.getTime());
          }

          const weekLabel = `Tuần ${weekIndex + 1}`;
          customWeeks[weekLabel] = {
            date: weekStart,
            label: weekLabel,
            categories: {},
          };

          allTransactions.forEach(t => {
            const transDate = new Date(t.date);
            transDate.setHours(0, 0, 0, 0);
            
            if (t.type === transactionType && transDate >= weekStart && transDate <= weekEnd) {
              customWeeks[weekLabel].categories[t.name] = (customWeeks[weekLabel].categories[t.name] || 0) + t.amount;
            }
          });

          data.push(customWeeks[weekLabel]);

          current.setDate(current.getDate() + 7);
          weekIndex++;
        }
      }
    }

    return data;
  };

  const chartData = getChartData();
  
  // Calculate maxValue based on active tab
  let maxValue = 100000;
  if (activeTab === 'all') {
    maxValue = Math.max(...chartData.map(d => Math.max(d.income || 0, d.expense || 0))) || 100000;
  } else {
    maxValue = Math.max(...chartData.map(d => {
      const categoryValues = Object.values(d.categories || {});
      return categoryValues.length > 0 ? categoryValues.reduce((a, b) => a + b, 0) : 0;
    })) || 100000;
  }
  
  const chartHeight = 300;
  // Tính barWidth dựa trên số lượng bars thực tế
  const getMaxBars = () => {
    if (timePeriod === 'week') return 7;
    if (timePeriod === 'month') return 4;
    if (timePeriod === 'year') return 12;
    if (timePeriod === 'custom') return Math.max(chartData.length, 1); // Dùng số lượng thực tế
    return 1; // day
  };
  const maxPossibleBars = getMaxBars();
  // Dynamic chartWidth: mỗi bar ~ 120px, +300px cho labels cuối
  const chartWidth = Math.max(400, maxPossibleBars * 120) + 300;
  const barSpacing = chartWidth / maxPossibleBars;
  const barWidth = Math.max(barSpacing * 0.25, 10); // Tối thiểu 10px

  // Get unique categories from all chart data for stacked charts
  const getAllCategories = () => {
    const categories = new Set();
    chartData.forEach(d => {
      if (d.categories) {
        Object.keys(d.categories).forEach(cat => categories.add(cat));
      }
    });
    return Array.from(categories);
  };

  // Check if there's any real data (not just zeros)
  const hasRealData = () => {
    if (activeTab === 'all') {
      return chartData.some(d => d.income > 0 || d.expense > 0);
    } else {
      return getAllCategories().length > 0;
    }
  };

  const renderBarChart = () => {
    const padding = 40;
    const graphHeight = chartHeight - padding * 2;
    const graphWidth = chartWidth - padding * 2;

    return (
      <View style={{ flexDirection: 'row' }}>
        {/* Y-axis labels - positioned to match grid lines */}
        <View style={{ width: 50, height: chartHeight, position: 'relative', paddingHorizontal: 5 }}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const value = Math.floor((maxValue * ratio) / 1000);
            const yPos = chartHeight - padding - graphHeight * ratio;
            // Tính margin để canh label với grid line (trừ đi nửa height của text)
            const marginTop = yPos - 6;
            return (
              <View 
                key={`y-label-${idx}`} 
                style={{ 
                  position: 'absolute',
                  top: marginTop,
                  right: 5,
                  height: 12,
                  justifyContent: 'center'
                }}
              >
                <Text style={{ fontSize: 11, color: '#666', fontWeight: '500', textAlign: 'right' }}>
                  {`${value}K`}
                </Text>
              </View>
            );
          })}
        </View>

        <ScrollView horizontal scrollEnabled={true} showsHorizontalScrollIndicator={true} contentContainerStyle={{ paddingRight: 200 }}>
          <Svg height={chartHeight + 30} width={chartWidth} style={{ marginVertical: 10 }}>
            {/* Y-axis */}
            <Line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="#075c09" strokeWidth="2" />
            {/* X-axis */}
            <Line x1={padding} y1={chartHeight - padding} x2={chartWidth - 20} y2={chartHeight - padding} stroke="#075c09" strokeWidth="2" />

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = chartHeight - padding - graphHeight * ratio;
              return (
                <Line key={`grid-${idx}`} x1={padding - 5} y1={y} x2={chartWidth - 20} y2={y} stroke="#e0e0e0" strokeWidth="1" strokeDasharray="4" />
              );
            })}

            {/* Bars */}
            {chartData.map((data, idx) => {
              const xPos = padding + idx * barSpacing + barSpacing / 2 - barWidth / 2;
              
              // Income bar (xanh)
              const incomeHeight = (data.income / maxValue) * graphHeight || 0;
              const incomeY = chartHeight - padding - incomeHeight;

              // Expense bar (đỏ)
              const expenseHeight = (data.expense / maxValue) * graphHeight || 0;
              const expenseY = chartHeight - padding - expenseHeight;

              return (
                <React.Fragment key={`bar-${idx}`}>
                  {/* Expense bar */}
                  <Rect x={xPos} y={expenseY} width={barWidth} height={expenseHeight} fill="#d9534f" />
                  {/* Income bar */}
                  <Rect x={xPos + barWidth} y={incomeY} width={barWidth} height={incomeHeight} fill="#5cb85c" />
                  
                  {/* X-axis label */}
                  <SvgText 
                    x={xPos + barWidth} 
                    y={chartHeight - padding + 20} 
                    fontSize="12" 
                    fill="#666" 
                    textAnchor="middle"
                  >
                    {data.label}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        </ScrollView>
      </View>
    );
  };

  const renderStackedBarChart = () => {
    const padding = 40;
    const graphHeight = chartHeight - padding * 2;
    const graphWidth = chartWidth - padding * 2;
    const categories = getAllCategories();

    return (
      <View style={{ flexDirection: 'row' }}>
        {/* Y-axis labels - positioned to match grid lines */}
        <View style={{ width: 50, height: chartHeight, position: 'relative', paddingHorizontal: 5 }}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const value = Math.floor((maxValue * ratio) / 1000);
            const yPos = chartHeight - padding - graphHeight * ratio;
            const marginTop = yPos - 6;
            return (
              <View 
                key={`y-label-${idx}`} 
                style={{ 
                  position: 'absolute',
                  top: marginTop,
                  right: 5,
                  height: 12,
                  justifyContent: 'center'
                }}
              >
                <Text style={{ fontSize: 11, color: '#666', fontWeight: '500', textAlign: 'right' }}>
                  {`${value}K`}
                </Text>
              </View>
            );
          })}
        </View>

        <ScrollView horizontal scrollEnabled={true} showsHorizontalScrollIndicator={true} contentContainerStyle={{ paddingRight: 200 }}>
          <Svg height={chartHeight + 30} width={chartWidth} style={{ marginVertical: 10 }}>
            {/* Y-axis */}
            <Line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="#075c09" strokeWidth="2" />
            {/* X-axis */}
            <Line x1={padding} y1={chartHeight - padding} x2={chartWidth - 20} y2={chartHeight - padding} stroke="#075c09" strokeWidth="2" />

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = chartHeight - padding - graphHeight * ratio;
              return (
                <Line key={`grid-${idx}`} x1={padding - 5} y1={y} x2={chartWidth - 20} y2={y} stroke="#e0e0e0" strokeWidth="1" strokeDasharray="4" />
              );
            })}

            {/* Stacked Bars */}
            {chartData.map((data, idx) => {
              const xPos = padding + idx * barSpacing + barSpacing / 2 - barWidth / 2;
              let currentY = chartHeight - padding;

              return (
                <React.Fragment key={`stacked-bar-${idx}`}>
                  {categories.map((category, catIdx) => {
                    const categoryAmount = data.categories?.[category] || 0;
                    const barHeight = (categoryAmount / maxValue) * graphHeight || 0;
                    const barY = currentY - barHeight;
                    const color = categoryColors[category] || '#999';

                    const element = (
                      <Rect
                        key={`${idx}-${category}`}
                        x={xPos}
                        y={barY}
                        width={barWidth}
                        height={barHeight}
                        fill={color}
                      />
                    );

                    currentY = barY;
                    return element;
                  })}

                  {/* X-axis label */}
                  <SvgText
                    x={xPos + barWidth / 2}
                    y={chartHeight - padding + 20}
                    fontSize="12"
                    fill="#666"
                    textAnchor="middle"
                  >
                    {data.label}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.container} scrollEnabled={true}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerMenu} onPress={() => setSidebarOpen(true)}>
            <View style={styles.hamburgerLine}></View>
            <View style={styles.hamburgerLine}></View>
            <View style={styles.hamburgerLine}></View>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerText}>Biểu đồ</Text>
          </View>
          <HeaderIconButton 
            icon="📋" 
            onPress={() => navigation.navigate('Transaction')}
          />
        </View>

        {/* Content Area */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>Chung</Text>
          </TouchableOpacity>
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

        {/* Chart Content */}
        {activeTab === 'all' && (
          <View style={styles.chartContainerWrapper}>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#d9534f' }]}></View>
                <Text style={styles.legendText}>Chi phí</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#5cb85c' }]}></View>
                <Text style={styles.legendText}>Thu nhập</Text>
              </View>
            </View>
            {renderBarChart()}
          </View>
        )}
        {activeTab === 'all' && chartData.length === 0 && (
          <View style={styles.contentContainer}>
            <Text style={styles.placeholderText}>Không có dữ liệu chi tiêu trong khoảng thời gian này</Text>
          </View>
        )}
        {activeTab !== 'all' && hasRealData() && (
          <View style={styles.chartContainerWrapper}>
            <View style={styles.chartLegend}>
              {getAllCategories().map((category) => (
                <View key={`legend-${category}`} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: categoryColors[category] || '#999' }]}></View>
                  <Text style={styles.legendText}>{category}</Text>
                </View>
              ))}
            </View>
            {renderStackedBarChart()}
          </View>
        )}
        {activeTab !== 'all' && !hasRealData() && (
          <View style={styles.contentContainer}>
            <Text style={styles.placeholderText}>Không có dữ liệu {activeTab === 'expense' ? 'chi tiêu' : 'thu nhập'} trong khoảng thời gian này</Text>
          </View>
        )}
      </ScrollView>

      {/* Sidebar */}
      <SidebarDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, position: 'relative' },
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
  headerContent: { flex: 1, alignItems: 'center', paddingRight: 30, justifyContent: 'center' },
  headerText: { color: '#fff', fontSize: 20 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  tab: { flex: 1, paddingVertical: 15, paddingHorizontal: 20, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#075c09' },
  tabText: { fontSize: 16, color: '#999', fontWeight: '600' },
  tabTextActive: { color: '#075c09' },
  chartContainerWrapper: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
    borderRadius: 8,
    marginHorizontal: 15,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 30,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  contentContainer: { 
    flex: 1, 
    padding: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  placeholderText: { 
    fontSize: 18, 
    color: '#999', 
    fontWeight: '500',
    textAlign: 'center'
  },
});
