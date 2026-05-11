"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
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

  const [confirmedStartDate, setConfirmedStartDate] = useState<Date | null>(null);
  const [confirmedEndDate, setConfirmedEndDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [selectingStartDate, setSelectingStartDate] = useState(true);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  const [apiChartData, setApiChartData] = useState<any[]>([]);
  const [apiCategoryColors, setApiCategoryColors] = useState<Record<string, string>>({});
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string[] } | null>(null);

  const niceMax = (value: number): number => {
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

  const formatAmount = (value: number): string => {
    if (value === 0) return '0';
    if (value >= 1_000_000_000) return `${+(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}tỷ`;
    if (value >= 1_000_000)    return `${+(value / 1_000_000).toFixed(0)}tr`;
    if (value >= 1_000)        return `${+(value / 1_000).toFixed(0)}K`;
    return value.toFixed(0);
  };

  const formatExact = (value: number): string =>
    new Intl.NumberFormat('vi-VN').format(value) + ' đ';

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

  const chartHeight = 300;
  const padding = 40;
  const BAR_WIDTH = 22;
  const GROUP_SPACING = 70;
  const chartWidth = Math.max(300, apiChartData.length * GROUP_SPACING + 60);
  const barSpacing = (chartWidth - 60) / Math.max(apiChartData.length, 1);

  const rawMax = Math.max(
    ...apiChartData.map(d => {
      if (activeTab === 'all') return Math.max(d.income || 0, d.expense || 0);
      const vals: number[] = Object.values(d.categories || {});
      return vals.reduce((a, b) => a + b, 0);
    }),
    100000
  );
  const maxValue = niceMax(rawMax);

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

      {}
      <header className="bg-[#075c09] px-5 py-4 flex justify-between items-center text-white shadow-sm sticky top-0 z-30">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 space-y-1.5 hover:bg-white/10 rounded-xl transition-colors"
        >
          <div className="w-6 h-0.5 bg-white rounded" />
          <div className="w-6 h-0.5 bg-white rounded" />
          <div className="w-4 h-0.5 bg-white rounded" />
        </button>
        <h1 className="text-lg font-bold">Biểu đồ phân tích</h1>
        <div className="w-10" />
      </header>

      {}
      <div className="flex bg-white border-b shadow-sm">
        {['all', 'expense', 'income'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-3.5 text-sm font-bold transition-all border-b-2 ${
              activeTab === tab
                ? 'border-[#075c09] text-[#075c09]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab === 'all' ? 'Tổng quan' : tab === 'expense' ? 'Chi phí' : 'Thu nhập'}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        {}
        <div className="mb-4 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
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

        {}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm">
              {activeTab === 'all' ? 'Thu - Chi theo thời gian' : activeTab === 'expense' ? 'Chi phí theo danh mục' : 'Thu nhập theo danh mục'}
            </h3>
            {}
            <div className="flex items-center gap-4">
              {activeTab === 'all' ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-[#ef4444] rounded-sm" />
                    <span className="text-xs text-slate-500 font-medium">Chi phí</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-[#22c55e] rounded-sm" />
                    <span className="text-xs text-slate-500 font-medium">Thu nhập</span>
                  </div>
                </>
              ) : (
                getAllCategories().slice(0, 4).map((cat) => (
                  <div key={cat} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: apiCategoryColors[cat] }} />
                    <span className="text-xs text-slate-500 font-medium">{cat}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {apiChartData.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <p className="text-sm italic">Không có dữ liệu trong khoảng thời gian này</p>
            </div>
          ) : (
            <div className="relative">
              <div className="flex overflow-x-auto pb-2">
              <div className="flex flex-col justify-between pr-3 text-[10px] text-slate-400 font-medium h-[220px] mt-10">
                {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
                  <span key={ratio}>{formatAmount(maxValue * ratio)}</span>
                ))}
              </div>
              <div className="relative flex-shrink-0 overflow-visible">
                {}
                {tooltip && (
                  <div
                    className="absolute z-20 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl pointer-events-none whitespace-nowrap"
                    style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, calc(-100% - 8px))' }}
                  >
                    {tooltip.content.map((line, i) => <div key={i}>{line}</div>)}
                  </div>
                )}
                <svg width={chartWidth} height={chartHeight} className="flex-shrink-0">
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = chartHeight - padding - (chartHeight - padding * 2) * ratio;
                    return (
                      <line key={ratio} x1={padding} y1={y} x2={chartWidth} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 2" />
                    );
                  })}
                  <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="#e2e8f0" strokeWidth="1.5" />
                  <line x1={padding} y1={chartHeight - padding} x2={chartWidth} y2={chartHeight - padding} stroke="#e2e8f0" strokeWidth="1.5" />
                  {apiChartData.map((data, idx) => {
                    const xBase = padding + idx * barSpacing + barSpacing / 2 - BAR_WIDTH / 2;
                    const graphHeight = chartHeight - padding * 2;
                    if (activeTab === 'all') {
                      const incH = (data.income / maxValue) * graphHeight;
                      const expH = (data.expense / maxValue) * graphHeight;
                      return (
                        <g key={idx}>
                          <rect
                            x={xBase} y={chartHeight - padding - expH} width={BAR_WIDTH} height={expH}
                            fill="#ef4444" rx="3" className="cursor-pointer hover:opacity-80 transition-opacity"
                            onMouseEnter={(e) => {
                              const svg = (e.target as SVGElement).closest('svg')!.getBoundingClientRect();
                              const r = (e.target as SVGElement).getBoundingClientRect();
                              setTooltip({ x: r.left - svg.left + BAR_WIDTH / 2, y: r.top - svg.top, content: [`📅 ${data.label}`, `Chi phí: ${formatExact(data.expense)}`] });
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          />
                          <rect
                            x={xBase + BAR_WIDTH + 3} y={chartHeight - padding - incH} width={BAR_WIDTH} height={incH}
                            fill="#22c55e" rx="3" className="cursor-pointer hover:opacity-80 transition-opacity"
                            onMouseEnter={(e) => {
                              const svg = (e.target as SVGElement).closest('svg')!.getBoundingClientRect();
                              const r = (e.target as SVGElement).getBoundingClientRect();
                              setTooltip({ x: r.left - svg.left + BAR_WIDTH / 2, y: r.top - svg.top, content: [`📅 ${data.label}`, `Thu nhập: ${formatExact(data.income)}`] });
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          />
                          <text x={xBase + BAR_WIDTH} y={chartHeight - 12} fontSize="9" fill="#94a3b8" textAnchor="middle">{data.label}</text>
                        </g>
                      );
                    } else {
                      let currentY = chartHeight - padding;
                      const totalAmt: number = Object.values(data.categories || {}).reduce((a: number, b) => a + (b as number), 0);
                      return (
                        <g key={idx}>
                          {getAllCategories().map((cat) => {
                            const amt = data.categories?.[cat] || 0;
                            const h = (amt / maxValue) * graphHeight;
                            currentY -= h;
                            const barY = currentY;
                            return (
                              <rect
                                key={cat} x={xBase + BAR_WIDTH / 2} y={barY} width={BAR_WIDTH} height={h}
                                fill={apiCategoryColors[cat]} rx="2"
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                onMouseEnter={(e) => {
                                  const svg = (e.target as SVGElement).closest('svg')!.getBoundingClientRect();
                                  const r = (e.target as SVGElement).getBoundingClientRect();
                                  setTooltip({ x: r.left - svg.left + BAR_WIDTH / 2, y: r.top - svg.top, content: [`${cat}`, `${formatExact(amt)}`] });
                                }}
                                onMouseLeave={() => setTooltip(null)}
                              />
                            );
                          })}
                          <text x={xBase + BAR_WIDTH} y={chartHeight - 12} fontSize="9" fill="#94a3b8" textAnchor="middle">{data.label}</text>
                        </g>
                      );
                    }
                  })}
                </svg>
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
