import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  ChefHat, 
  Calendar, 
  IndianRupee, 
  Activity, 
  BarChart2, 
  ArrowUpRight, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Order, User, OrderStatus } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';

interface DailyPerformanceWidgetProps {
  orders: Order[];
  chefs?: User[];
  title?: string;
  subtitle?: string;
  className?: string;
}

type TimeRangeOption = '7d' | '14d' | '30d';
type MetricFilter = 'all' | 'revenue' | 'bookings' | 'chefs';

export default function DailyPerformanceWidget({
  orders,
  chefs = [],
  title = "Daily Performance Dashboard",
  subtitle = "Real-time track of Total Bookings, Active Chefs, and Daily Revenue",
  className
}: DailyPerformanceWidgetProps) {
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('7d');
  const [metricFilter, setMetricFilter] = useState<MetricFilter>('all');

  // Compute daily aggregated time series
  const { chartData, totals, todayStats, peakDay } = useMemo(() => {
    const daysCount = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    const now = new Date();
    
    // Generate dates map for the selected day range
    const daysMap: { [key: string]: { dateStr: string; label: string; fullDate: string; bookings: number; revenue: number; activeChefIds: Set<string> } } = {};
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      const fullDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      daysMap[key] = {
        dateStr: key,
        label,
        fullDate,
        bookings: 0,
        revenue: 0,
        activeChefIds: new Set<string>()
      };
    }

    // Populate data with orders
    orders.forEach((order) => {
      if (!order.createdAt) return;
      const orderDate = new Date(order.createdAt);
      if (isNaN(orderDate.getTime())) return;
      const key = orderDate.toISOString().split('T')[0];

      if (daysMap[key]) {
        daysMap[key].bookings += 1;
        
        // Sum revenue for completed, paid, or active missions
        const amount = Number(order.totalAmount) || 0;
        if (order.status === OrderStatus.PAID || order.status === OrderStatus.COMPLETED || order.status === OrderStatus.COOKING || order.status === OrderStatus.PAYMENT_PENDING) {
          daysMap[key].revenue += amount;
        }

        if (order.chefId) {
          daysMap[key].activeChefIds.add(order.chefId);
        }
      }
    });

    const dataList = Object.values(daysMap).map((day) => ({
      date: day.dateStr,
      label: day.label,
      fullDate: day.fullDate,
      bookings: day.bookings,
      revenue: Math.round(day.revenue),
      activeChefs: day.activeChefIds.size
    }));

    // Current online / actively registered chefs count fallback
    const currentlyOnlineChefsCount = chefs.filter(c => c.isOnline || c.status === 'ACTIVE').length || chefs.length;

    // Totals in range
    const totalBookings = dataList.reduce((acc, d) => acc + d.bookings, 0);
    const totalRevenue = dataList.reduce((acc, d) => acc + d.revenue, 0);
    const uniqueActiveChefs = new Set(
      Object.values(daysMap).flatMap(d => Array.from(d.activeChefIds))
    ).size;

    // Today's stats
    const todayKey = now.toISOString().split('T')[0];
    const todayEntry = daysMap[todayKey] || { bookings: 0, revenue: 0, activeChefIds: new Set() };
    const todayStats = {
      bookings: todayEntry.bookings,
      revenue: Math.round(todayEntry.revenue),
      activeChefs: todayEntry.activeChefIds.size || currentlyOnlineChefsCount
    };

    // Find peak day
    let peak = dataList[0];
    dataList.forEach(d => {
      if ((d.revenue + d.bookings * 100) > (peak ? peak.revenue + peak.bookings * 100 : 0)) {
        peak = d;
      }
    });

    return {
      chartData: dataList,
      totals: {
        totalBookings,
        totalRevenue,
        activeChefs: uniqueActiveChefs || currentlyOnlineChefsCount,
        avgDailyRevenue: Math.round(totalRevenue / daysCount),
        avgDailyBookings: (totalBookings / daysCount).toFixed(1)
      },
      todayStats,
      peakDay: peak
    };
  }, [orders, chefs, timeRange]);

  return (
    <div id="daily-performance-widget" className={cn("bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 md:p-8 space-y-6", className)}>
      {/* Header section with Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-red-50 text-red-600 font-black text-[10px] uppercase tracking-widest rounded-full flex items-center gap-1.5 border border-red-100">
              <Activity size={12} className="animate-pulse" /> Live Performance Analytics
            </span>
            <span className="text-xs text-gray-400 font-bold">• Recharts Engine</span>
          </div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight mt-1">{title}</h3>
          <p className="text-xs text-gray-400 font-bold tracking-wide mt-0.5">{subtitle}</p>
        </div>

        {/* View Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric focus */}
          <div className="bg-gray-100 p-1 rounded-2xl flex items-center text-[10px] font-black uppercase tracking-wider">
            <button
              onClick={() => setMetricFilter('all')}
              className={cn(
                "px-3 py-1.5 rounded-xl transition-all",
                metricFilter === 'all' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              )}
            >
              All Metrics
            </button>
            <button
              onClick={() => setMetricFilter('revenue')}
              className={cn(
                "px-3 py-1.5 rounded-xl transition-all",
                metricFilter === 'revenue' ? "bg-emerald-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
              )}
            >
              Revenue (₹)
            </button>
            <button
              onClick={() => setMetricFilter('bookings')}
              className={cn(
                "px-3 py-1.5 rounded-xl transition-all",
                metricFilter === 'bookings' ? "bg-red-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
              )}
            >
              Bookings
            </button>
            <button
              onClick={() => setMetricFilter('chefs')}
              className={cn(
                "px-3 py-1.5 rounded-xl transition-all",
                metricFilter === 'chefs' ? "bg-amber-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
              )}
            >
              Active Chefs
            </button>
          </div>

          {/* Time range */}
          <div className="bg-gray-100 p-1 rounded-2xl flex items-center text-[10px] font-black uppercase tracking-wider">
            {(['7d', '14d', '30d'] as TimeRangeOption[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={cn(
                  "px-3 py-1.5 rounded-xl transition-all",
                  timeRange === r ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
                )}
              >
                {r === '7d' ? '7 Days' : r === '14d' ? '14 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3 Core Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Total Bookings */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50/40 p-5 rounded-[2rem] border border-red-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Total Bookings</span>
            <div className="w-10 h-10 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-sm">
              <BarChart2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-gray-900 tracking-tight">{totals.totalBookings}</div>
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mt-1">
              <span>Today: <strong className="text-red-600">{todayStats.bookings}</strong></span>
              <span>Avg: <strong>{totals.avgDailyBookings}/day</strong></span>
            </div>
          </div>
        </div>

        {/* Metric 2: Active Chefs */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50/40 p-5 rounded-[2rem] border border-amber-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Active Chefs</span>
            <div className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-sm">
              <ChefHat size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-gray-900 tracking-tight">{totals.activeChefs}</div>
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mt-1">
              <span>Today On-Duty: <strong className="text-amber-700">{todayStats.activeChefs}</strong></span>
              <span>Registered: <strong>{chefs.length || totals.activeChefs}</strong></span>
            </div>
          </div>
        </div>

        {/* Metric 3: Revenue */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-5 rounded-[2rem] border border-emerald-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Revenue</span>
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-sm">
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-gray-900 tracking-tight">{formatCurrency(totals.totalRevenue)}</div>
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mt-1">
              <span>Today: <strong className="text-emerald-700">{formatCurrency(todayStats.revenue)}</strong></span>
              <span>Daily Avg: <strong>{formatCurrency(totals.avgDailyRevenue)}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Recharts Visualizer */}
      <div className="bg-[#FAF9F7] p-5 md:p-6 rounded-[2rem] border border-gray-100">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-gray-800">Daily Trend Chart</span>
            <span className="text-[10px] font-bold text-gray-400">({timeRange === '7d' ? 'Past 7 Days' : timeRange === '14d' ? 'Past 14 Days' : 'Past 30 Days'})</span>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500">
            {(metricFilter === 'all' || metricFilter === 'bookings') && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#E31E24] inline-block" /> Total Bookings
              </span>
            )}
            {(metricFilter === 'all' || metricFilter === 'chefs') && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#F59E0B] inline-block" /> Active Chefs
              </span>
            )}
            {(metricFilter === 'all' || metricFilter === 'revenue') && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#059669] inline-block" /> Revenue (₹)
              </span>
            )}
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E31E24" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#E31E24" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11, fontWeight: 700, fill: '#6B7280' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                yAxisId="left" 
                tick={{ fontSize: 11, fontWeight: 700, fill: '#6B7280' }} 
                axisLine={false} 
                tickLine={false} 
                allowDecimals={false}
              />
              {(metricFilter === 'all' || metricFilter === 'revenue') && (
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}`}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#059669' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
              )}
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-gray-950 text-white p-3.5 rounded-2xl shadow-xl border border-gray-800 text-xs space-y-1.5 min-w-[170px]">
                        <p className="font-black text-gray-300 text-[11px] pb-1 border-b border-gray-800">{data.fullDate}</p>
                        <div className="flex items-center justify-between text-red-400 font-bold">
                          <span>📦 Bookings:</span>
                          <span className="font-mono text-white">{data.bookings}</span>
                        </div>
                        <div className="flex items-center justify-between text-amber-400 font-bold">
                          <span>👨‍🍳 Active Chefs:</span>
                          <span className="font-mono text-white">{data.activeChefs}</span>
                        </div>
                        <div className="flex items-center justify-between text-emerald-400 font-bold">
                          <span>💰 Revenue:</span>
                          <span className="font-mono text-white">{formatCurrency(data.revenue)}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Revenue Area */}
              {(metricFilter === 'all' || metricFilter === 'revenue') && (
                <Area 
                  yAxisId={metricFilter === 'revenue' ? 'left' : 'right'}
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#059669" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#revenueGradient)" 
                  name="Revenue (₹)"
                />
              )}

              {/* Bookings Bar */}
              {(metricFilter === 'all' || metricFilter === 'bookings') && (
                <Bar 
                  yAxisId="left" 
                  dataKey="bookings" 
                  fill="url(#bookingsGradient)" 
                  radius={[8, 8, 0, 0]} 
                  barSize={timeRange === '7d' ? 26 : timeRange === '14d' ? 16 : 9}
                  name="Total Bookings"
                />
              )}

              {/* Active Chefs Line */}
              {(metricFilter === 'all' || metricFilter === 'chefs') && (
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="activeChefs" 
                  stroke="#F59E0B" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#FFFFFF' }}
                  activeDot={{ r: 6, fill: '#D97706' }}
                  name="Active Chefs"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Snapshot Footer Bar */}
      {peakDay && (
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-500" />
            <span>Peak Activity: <strong className="text-gray-900">{peakDay.fullDate}</strong> ({peakDay.bookings} bookings, {formatCurrency(peakDay.revenue)})</span>
          </div>
          <div className="text-[11px] text-gray-400 font-medium">
            Updated dynamically with real-time bookings
          </div>
        </div>
      )}
    </div>
  );
}
