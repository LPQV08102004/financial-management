"use client";

import React, { useState, useEffect, useCallback } from 'react';
import SidebarDrawer from '../components/SidebarDrawer';
import HeaderIconButton from '../components/HeaderIconButton';
import Footer from '../components/Footer';
import DateTimeSelector from '../components/DateTimeSelector';
import { getOverTime, getStatsByCategory } from '../api/analyticsApi';
import type { AnalyticsPeriod } from '../types/analytics';

export default function ChartScreen() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'expense' | 'income'>('all');
  const [timePeriod, setTimePeriod] = useState<AnalyticsPeriod>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // State cho DateTimeSelector
  const [confirmedStartDate, setConfirmedStartDate] = useState<Date | null>(null);
  const [confirmedEndDate, setConfirmedEndDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [selectingStartDate, setSelectingStartDate] = useState(true);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  // API chart data
  const [apiChartData, setApiChartData] = useState<any[]>([]);
  const [apiCategoryColors, setApiCategoryColors] = useState<Record<string, string>>({});

  const _toDateStr = (d: Date | null) => {
    if (!d) return undefined;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const fetchData = useCallback(async () => {
    const params: any = timePeriod === 'custom'
      ? { period: 'custom', from_date: _toDateStr(confirmedStartDate), to_date: _toDateStr(confirmedEndDate) }
      : { period: timePeriod, date: _toDateStr(selectedDate) };

    try {
      if (activeTab === 'all') {
        const rows = await getOverTime({ ...params, type: 'all' });
        setApiChartData(rows.map((r: any) => ({
          label: r.label,
          income: Number(r.income),
          expense: Number(r.expense),
        })));
      } else {
        const rows = await getStatsByCategory({ ...params, type: activeTab });
        const colorMap: Record<string, string> = {};
        const data = rows.map((r: any) => {
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

  useEffect(() => { fetchData(); }, [fetchData]);

  // Cấu hình kích thước Chart
  const chartHeight = 300;
  const padding = 40;
  const BAR_WIDTH = 22;
  const GROUP_SPACING = 70;
  const chartWidth = Math.max(300, apiChartData.length * GROUP_SPACING + 60);
  const barSpacing = (chartWidth - 60) / Math.max(apiChartData.length, 1);

  // Tính giá trị lớn nhất để scale cột[cite: 5]
  const maxValue = Math.max(
    ...apiChartData.map(d => {
      if (activeTab === 'all') return Math.max(d.income || 0, d.expense || 0);
      const vals: number[] = Object.values(d.categories || {});
      return vals.reduce((a, b) => a + b, 0);
    }),
    100000 // Giá trị tối thiểu để biểu đồ không bị rỗng
  );

  const getAllCategories = () => {
    const categories = new Set<string>();
    apiChartData.forEach(d => {
      if (d.categories) Object.keys(d.categories).forEach(cat => categories.add(cat));
    });
    return Array.from(categories);
  };

  return (
    <div className="bg-[#f8f9fa] flex flex-col relative">
      <SidebarDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Header[cite: 5] */}
      <div className="bg-[#075c09] p-6 pt-10 flex justify-between items-center text-white">
        <button onClick={() => setSidebarOpen(true)} className="p-2 space-y-1">
          <div className="w-6 h-0.5 bg-white"></div>
          <div className="w-6 h-0.5 bg-white"></div>
          <div className="w-4 h-0.5 bg-white"></div>
        </button>
        <h1 className="text-xl font-bold">Biểu đồ</h1>
          <HeaderIconButton icon="📋" onPress={() => {}} />
      </div>

      {/* Tabs[cite: 5] */}
      <div className="flex bg-white border-b sticky top-0 z-10 shadow-sm">
        {['all', 'expense', 'income'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-4 text-sm font-bold transition-all border-b-4 ${
              activeTab === tab ? 'border-[#075c09] text-[#075c09]' : 'border-transparent text-gray-400'
            }`}
          >
            {tab === 'all' ? 'CHUNG' : tab === 'expense' ? 'CHI PHÍ' : 'THU NHẬP'}
          </button>
        ))}
      </div>

      <div className="p-4">
        <DateTimeSelector
          timePeriod={timePeriod}
          selectedDate={selectedDate}
          setTimePeriod={setTimePeriod}
          setSelectedDate={setSelectedDate}
          setConfirmedStartDate={setConfirmedStartDate}
          setConfirmedEndDate={setConfirmedEndDate}
          showCalendar={showCalendar}
          setShowCalendar={setShowCalendar}
          currentCalendarMonth={currentCalendarMonth}
          setCurrentCalendarMonth={setCurrentCalendarMonth}
          selectingStartDate={selectingStartDate}
          setSelectingStartDate={setSelectingStartDate}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
        />
      </div>

      {/* Legend & Chart Area[cite: 5] */}
      <div className="m-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Chú thích */}
        <div className="flex justify-center gap-6 mb-6">
          {activeTab === 'all' ? (
            <>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#d9534f] rounded-sm"></div><span className="text-xs font-bold text-gray-600">Chi phí</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#5cb85c] rounded-sm"></div><span className="text-xs font-bold text-gray-600">Thu nhập</span></div>
            </>
          ) : (
            getAllCategories().map(cat => (
              <div key={cat} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: apiCategoryColors[cat] }}></div>
                <span className="text-xs font-bold text-gray-600">{cat}</span>
              </div>
            ))
          )}
        </div>

        {/* Bar Chart SVG[cite: 5] */}
        <div className="flex overflow-x-auto pb-4 custom-scrollbar">
          {/* Y-Axis Labels */}
          <div className="flex flex-col justify-between pr-2 text-[10px] text-gray-400 font-bold h-[220px] mt-[40px]">
            {[1, 0.75, 0.5, 0.25, 0].map(ratio => (
              <span key={ratio}>{(maxValue * ratio / 1000).toFixed(0)}K</span>
            ))}
          </div>

          <svg width={chartWidth} height={chartHeight} className="flex-shrink-0">
            {/* Grid Lines[cite: 5] */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const y = chartHeight - padding - (chartHeight - padding * 2) * ratio;
              return <line key={ratio} x1={padding} y1={y} x2={chartWidth} y2={y} stroke="#f0f0f0" strokeDasharray="4" />;
            })}

            {/* Trục X & Y */}
            <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="#075c09" strokeWidth="2" />
            <line x1={padding} y1={chartHeight - padding} x2={chartWidth} y2={chartHeight - padding} stroke="#075c09" strokeWidth="2" />

            {/* Render Bars[cite: 5] */}
            {apiChartData.map((data, idx) => {
              const xBase = padding + idx * barSpacing + barSpacing / 2 - BAR_WIDTH / 2;
              const graphHeight = chartHeight - padding * 2;

              if (activeTab === 'all') {
                const incH = (data.income / maxValue) * graphHeight;
                const expH = (data.expense / maxValue) * graphHeight;
                return (
                  <g key={idx}>
                    <rect x={xBase} y={chartHeight - padding - expH} width={BAR_WIDTH} height={expH} fill="#d9534f" rx="2" />
                    <rect x={xBase + BAR_WIDTH + 2} y={chartHeight - padding - incH} width={BAR_WIDTH} height={incH} fill="#5cb85c" rx="2" />
                    <text x={xBase + BAR_WIDTH} y={chartHeight - 15} fontSize="10" fill="#999" textAnchor="middle">{data.label}</text>
                  </g>
                );
              } else {
                let currentY = chartHeight - padding;
                return (
                  <g key={idx}>
                    {getAllCategories().map(cat => {
                      const amt = data.categories?.[cat] || 0;
                      const h = (amt / maxValue) * graphHeight;
                      currentY -= h;
                      return <rect key={cat} x={xBase + BAR_WIDTH / 2} y={currentY} width={BAR_WIDTH} height={h} fill={apiCategoryColors[cat]} rx="2" />;
                    })}
                    <text x={xBase + BAR_WIDTH} y={chartHeight - 15} fontSize="10" fill="#999" textAnchor="middle">{data.label}</text>
                  </g>
                );
              }
            })}
          </svg>
        </div>
      </div>

      {apiChartData.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-10 opacity-40">
          <p className="text-center italic font-medium">Không có dữ liệu trong khoảng thời gian này</p>
        </div>
      )}

          </div>
  );
}
