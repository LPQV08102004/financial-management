import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import Svg, { Line, Rect, Text as SvgText, G } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import SidebarDrawer from '../components/SidebarDrawer';
import Header from '../components/Header';
import HeaderIconButton from '../components/HeaderIconButton';
import Footer from '../components/Footer';
import DateTimeSelector from '../components/DateTimeSelector';
import { getOverTime, getStatsByCategory } from '../api/analyticsApi';

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

  // ── API chart data ────────────────────────────────────────────────────────────
  const [apiChartData, setApiChartData] = useState([]);
  // Colors keyed by category name, populated when activeTab is expense/income
  const [apiCategoryColors, setApiCategoryColors] = useState({});
  // Tap tooltip
  const [tooltip, setTooltip] = useState(null); // { lines: string[] }

  /** Round up to a clean 'nice' ceiling so Y-axis ticks are whole round numbers */
  const niceMax = (value) => {
    if (value <= 0) return 100_000;
    const exp = Math.floor(Math.log10(value));
    const mag = Math.pow(10, exp);
    const norm = value / mag;
    if (norm <= 1)   return 1   * mag;
    if (norm <= 2)   return 2   * mag;
    if (norm <= 2.5) return 2.5 * mag;
    if (norm <= 5)   return 5   * mag;
    return 10 * mag;
  };

  /** Format large VND amounts to short readable form */
  const formatAmount = (value) => {
    if (value === 0) return '0';
    if (value >= 1_000_000_000) return `${+(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}tỷ`;
    if (value >= 1_000_000)    return `${+(value / 1_000_000).toFixed(0)}tr`;
    if (value >= 1_000)        return `${+(value / 1_000).toFixed(0)}K`;
    return String(value);
  };

  /** Format exact amount with thousand separators */
  const formatExact = (value) =>
    new Intl.NumberFormat('vi-VN').format(value) + ' đ';

  const _toDateStr = (d) => {
    if (!d) return undefined;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const fetchData = useCallback(async () => {
    const params = timePeriod === 'custom'
      ? { period: 'custom', from_date: _toDateStr(confirmedStartDate), to_date: _toDateStr(confirmedEndDate) }
      : { period: timePeriod, date: _toDateStr(selectedDate) };

    try {
      if (activeTab === 'all') {
        const rows = await getOverTime({ ...params, type: 'all' });
        setApiChartData(rows.map(r => ({
          label: r.label,
          income: Number(r.income),
          expense: Number(r.expense),
        })));
      } else {
        const rows = await getStatsByCategory({ ...params, type: activeTab });
        const colorMap = {};
        const data = rows.map(r => {
          colorMap[r.category] = r.color || '#999999';
          return { label: r.category, categories: { [r.category]: Number(r.amount) } };
        });
        setApiCategoryColors(colorMap);
        setApiChartData(data);
      }
    } catch (_) {
      setApiChartData([]);
    }
  }, [activeTab, timePeriod, selectedDate, confirmedStartDate, confirmedEndDate]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));


  // Calculate chart data based on time period
  const chartData = apiChartData;

  // Calculate maxValue based on active tab
  let rawMax = 100000;
  if (activeTab === 'all') {
    rawMax = Math.max(...chartData.map(d => Math.max(d.income || 0, d.expense || 0)), 100000);
  } else {
    rawMax = Math.max(...chartData.map(d => {
      const vals = Object.values(d.categories || {});
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) : 0;
    }), 100000);
  }
  const maxValue = niceMax(rawMax);

  const chartHeight = 300;
  const maxPossibleBars = Math.max(chartData.length, 1);
  const BAR_WIDTH = 22;
  const GROUP_SPACING = 70;
  const CHART_SIDE_PADDING = 60; // left axis (40) + right margin (20)
  const chartWidth = Math.max(300, maxPossibleBars * GROUP_SPACING + CHART_SIDE_PADDING);
  const barSpacing = (chartWidth - CHART_SIDE_PADDING) / maxPossibleBars;
  const barWidth = BAR_WIDTH;

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

    return (
      <View style={{ flexDirection: 'row' }}>
        {/* Y-axis labels */}
        <View style={{ width: 50, height: chartHeight, position: 'relative', paddingHorizontal: 5 }}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const yPos = chartHeight - padding - graphHeight * ratio;
            return (
              <View
                key={`y-label-${idx}`}
                style={{ position: 'absolute', top: yPos - 6, right: 5, height: 12, justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 10, color: '#666', fontWeight: '500', textAlign: 'right' }}>
                  {formatAmount(maxValue * ratio)}
                </Text>
              </View>
            );
          })}
        </View>

        <ScrollView horizontal scrollEnabled={true} showsHorizontalScrollIndicator={true} contentContainerStyle={{ paddingRight: 20 }}>
          <Svg height={chartHeight + 30} width={chartWidth} style={{ marginVertical: 10 }}>
            <Line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="#075c09" strokeWidth="2" />
            <Line x1={padding} y1={chartHeight - padding} x2={chartWidth - 20} y2={chartHeight - padding} stroke="#075c09" strokeWidth="2" />
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = chartHeight - padding - graphHeight * ratio;
              return <Line key={`grid-${idx}`} x1={padding - 5} y1={y} x2={chartWidth - 20} y2={y} stroke="#e0e0e0" strokeWidth="1" strokeDasharray="4" />;
            })}
            {chartData.map((data, idx) => {
              const xPos = padding + idx * barSpacing + barSpacing / 2 - barWidth / 2;
              const incomeHeight = (data.income / maxValue) * graphHeight || 0;
              const incomeY = chartHeight - padding - incomeHeight;
              const expenseHeight = (data.expense / maxValue) * graphHeight || 0;
              const expenseY = chartHeight - padding - expenseHeight;
              return (
                <G key={`bar-${idx}`}>
                  <Rect
                    x={xPos} y={expenseY} width={barWidth} height={expenseHeight} fill="#d9534f"
                    onPress={() => setTooltip({ lines: [`\uD83D\uDCC5 ${data.label}`, `Chi ph\u00ED: ${formatExact(data.expense)}`] })}
                  />
                  <Rect
                    x={xPos + barWidth} y={incomeY} width={barWidth} height={incomeHeight} fill="#5cb85c"
                    onPress={() => setTooltip({ lines: [`\uD83D\uDCC5 ${data.label}`, `Thu nh\u1EADp: ${formatExact(data.income)}`] })}
                  />
                  <SvgText x={xPos + barWidth} y={chartHeight - padding + 20} fontSize="12" fill="#666" textAnchor="middle">
                    {data.label}
                  </SvgText>
                </G>
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
    const categories = getAllCategories();

    return (
      <View style={{ flexDirection: 'row' }}>
        {/* Y-axis labels */}
        <View style={{ width: 50, height: chartHeight, position: 'relative', paddingHorizontal: 5 }}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const yPos = chartHeight - padding - graphHeight * ratio;
            return (
              <View
                key={`y-label-${idx}`}
                style={{ position: 'absolute', top: yPos - 6, right: 5, height: 12, justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 10, color: '#666', fontWeight: '500', textAlign: 'right' }}>
                  {formatAmount(maxValue * ratio)}
                </Text>
              </View>
            );
          })}
        </View>

        <ScrollView horizontal scrollEnabled={true} showsHorizontalScrollIndicator={true} contentContainerStyle={{ paddingRight: 20 }}>
          <Svg height={chartHeight + 30} width={chartWidth} style={{ marginVertical: 10 }}>
            <Line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="#075c09" strokeWidth="2" />
            <Line x1={padding} y1={chartHeight - padding} x2={chartWidth - 20} y2={chartHeight - padding} stroke="#075c09" strokeWidth="2" />
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
                <G key={`stacked-bar-${idx}`}>
                  {categories.map((category) => {
                    const categoryAmount = data.categories?.[category] || 0;
                    const barHeight = (categoryAmount / maxValue) * graphHeight || 0;
                    const barY = currentY - barHeight;
                    const color = apiCategoryColors[category] || '#999';
                    currentY = barY;
                    return (
                      <Rect
                        key={`${idx}-${category}`}
                        x={xPos} y={barY} width={barWidth} height={barHeight} fill={color}
                        onPress={() => setTooltip({ lines: [category, formatExact(categoryAmount)] })}
                      />
                    );
                  })}
                  <SvgText x={xPos + barWidth / 2} y={chartHeight - padding + 20} fontSize="12" fill="#666" textAnchor="middle">
                    {data.label}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      {/* Tap tooltip modal */}
      <Modal transparent visible={!!tooltip} animationType="fade" onRequestClose={() => setTooltip(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setTooltip(null)}>
          <View style={{ backgroundColor: '#1f2937', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 14, minWidth: 180, alignItems: 'center' }}>
            {tooltip?.lines.map((line, i) => (
              <Text key={i} style={{ color: '#fff', fontSize: i === 0 ? 13 : 15, fontWeight: i === 0 ? '400' : '700', marginTop: i > 0 ? 4 : 0 }}>
                {line}
              </Text>
            ))}
            <Text style={{ color: '#9ca3af', fontSize: 11, marginTop: 8 }}>Chạm để đóng</Text>
          </View>
        </Pressable>
      </Modal>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} scrollEnabled={true}>
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
                  <View style={[styles.legendColor, { backgroundColor: apiCategoryColors[category] || '#999' }]}></View>
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
      <Footer />

      {/* Sidebar */}
      <SidebarDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, position: 'relative' },
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { paddingBottom: 40 },
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
