import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Download, 
  Printer, 
  Search, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChefHat, 
  User, 
  FileSpreadsheet, 
  FileText,
  CreditCard,
  Layers,
  ArrowUpRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { Order, User as UserType, AppConfig, OrderStatus } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { generateInvoicePDF, generateExecutiveReportPDF } from '../utils/pdfGenerator';

interface AdminTransactionReportsProps {
  orders: Order[];
  chefs: UserType[];
  allUsers: UserType[];
  config: AppConfig;
}

export function AdminTransactionReports({ orders, chefs, allUsers, config }: AdminTransactionReportsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [chefFilter, setChefFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PAID' && order.status !== OrderStatus.PAID && order.paymentStatus !== 'PAID') return false;
        if (statusFilter === 'PENDING' && order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PAYMENT_PENDING) return false;
        if (statusFilter === 'COOKING' && order.status !== OrderStatus.COOKING) return false;
        if (statusFilter === 'COMPLETED' && order.status !== OrderStatus.COMPLETED) return false;
      }

      // Method filter
      if (methodFilter !== 'ALL') {
        if (!order.paymentMethod || order.paymentMethod !== methodFilter) return false;
      }

      // Chef filter
      if (chefFilter !== 'ALL') {
        if (order.chefId !== chefFilter) return false;
      }

      // Type filter
      if (typeFilter !== 'ALL') {
        if (order.type !== typeFilter) return false;
      }

      // Date filter
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      if (dateRange === 'TODAY') {
        if (orderDate.toDateString() !== now.toDateString()) return false;
      } else if (dateRange === 'WEEK') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (orderDate < weekAgo) return false;
      } else if (dateRange === 'MONTH') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (orderDate < monthAgo) return false;
      } else if (dateRange === 'CUSTOM') {
        if (startDate && new Date(order.createdAt) < new Date(startDate)) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (new Date(order.createdAt) > end) return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const bId = (order.bookingId || order.id || '').toLowerCase();
        const txnId = (order.transactionId || order.paymentId || '').toLowerCase();
        const uEmail = (order.userEmail || '').toLowerCase();
        const uName = (order.userName || '').toLowerCase();
        const uPhone = (order.userPhone || '').toLowerCase();
        const cName = (order.chefName || '').toLowerCase();
        const addr = (order.address || '').toLowerCase();

        return bId.includes(q) || txnId.includes(q) || uEmail.includes(q) || uName.includes(q) || uPhone.includes(q) || cName.includes(q) || addr.includes(q);
      }

      return true;
    });
  }, [orders, statusFilter, methodFilter, chefFilter, typeFilter, dateRange, startDate, endDate, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalGross = 0;
    let totalAdminCommission = 0;
    let totalChefPayout = 0;
    let paidCount = 0;
    let pendingGross = 0;

    filteredOrders.forEach(o => {
      const isPaid = o.status === OrderStatus.PAID || o.status === OrderStatus.COMPLETED || o.paymentStatus === 'PAID';
      const amount = o.totalAmount || 0;
      const adminCut = o.commissionAdmin || Math.round(amount * ((config.adminCommissionPercent || 30) / 100));
      const chefCut = o.commissionChef || (amount - adminCut);

      if (isPaid) {
        totalGross += amount;
        totalAdminCommission += adminCut;
        totalChefPayout += chefCut;
        paidCount++;
      } else {
        pendingGross += amount;
      }
    });

    return {
      totalGross,
      totalAdminCommission,
      totalChefPayout,
      paidCount,
      pendingGross,
      totalOrders: filteredOrders.length
    };
  }, [filteredOrders, config.adminCommissionPercent]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Booking ID',
      'Transaction ID',
      'Date & Time',
      'Customer Name',
      'Customer Phone',
      'Assigned Chef',
      'Service Type',
      'Duration (Mins)',
      'Total Bill (INR)',
      'Admin Commission (INR)',
      'Chef Share (INR)',
      'Payment Status',
      'Payment Method',
      'Address'
    ];

    const rows = filteredOrders.map(o => {
      const isPaid = o.status === OrderStatus.PAID || o.status === OrderStatus.COMPLETED || o.paymentStatus === 'PAID';
      const amount = o.totalAmount || 0;
      const adminCut = o.commissionAdmin || Math.round(amount * ((config.adminCommissionPercent || 30) / 100));
      const chefCut = o.commissionChef || (amount - adminCut);

      return [
        o.bookingId || o.id,
        o.transactionId || o.paymentId || 'N/A',
        new Date(o.createdAt).toLocaleString(),
        o.userName || o.userEmail || 'Customer',
        o.userPhone || 'N/A',
        o.chefName || 'Unassigned',
        o.type,
        o.durationMinutes || 0,
        amount,
        adminCut,
        chefCut,
        isPaid ? 'PAID' : o.status,
        o.paymentMethod || 'ONLINE',
        `"${(o.address || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HC_Home_Cooking_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
              <DollarSign size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Per-Order Financial & Transaction Report</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                Itemized transaction ledger, commission splits, payment IDs & tax invoice generation
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <FileSpreadsheet size={15} /> Export CSV
          </button>

          <button
            onClick={() => {
              generateExecutiveReportPDF(orders, chefs, config, {
                totalGross: metrics.totalGross,
                adminCut: metrics.totalAdminCommission,
                chefEarnings: metrics.totalChefPayout,
                completedOrders: metrics.paidCount
              });
            }}
            className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Download size={15} /> PDF Summary
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            <Printer size={15} /> Print
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Total Gross Revenue</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block">{formatCurrency(metrics.totalGross)}</span>
            <span className="text-[10px] text-green-600 font-bold mt-0.5 flex items-center gap-1">
              <TrendingUp size={11} /> {metrics.paidCount} Paid Bookings
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
            <CreditCard size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-red-500 block">Admin Commission ({config.adminCommissionPercent || 30}%)</span>
            <span className="text-2xl font-black text-red-600 mt-1 block">{formatCurrency(metrics.totalAdminCommission)}</span>
            <span className="text-[10px] text-gray-400 font-bold mt-0.5 block">Net Business Revenue</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">Chef Payouts ({config.chefCommissionPercent || 70}%)</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">{formatCurrency(metrics.totalChefPayout)}</span>
            <span className="text-[10px] text-gray-400 font-bold mt-0.5 block">Direct Chef Earnings</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ChefHat size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block">Pending / In-Progress</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">{formatCurrency(metrics.pendingGross)}</span>
            <span className="text-[10px] text-gray-400 font-bold mt-0.5 block">{metrics.totalOrders - metrics.paidCount} Bookings Active</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Booking #, Txn ID, Customer, Phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 h-11 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-red-600 focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-red-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">💰 Paid</option>
              <option value="PENDING">⏱️ Payment Pending</option>
              <option value="COOKING">🔥 Live Cooking</option>
              <option value="COMPLETED">✅ Completed</option>
            </select>
          </div>

          {/* Payment Method */}
          <div className="md:col-span-2">
            <select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
              className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-red-600"
            >
              <option value="ALL">All Payment Modes</option>
              <option value="PHONEPE">PhonePe Gateway</option>
              <option value="UPI_QR">UPI / QR Code</option>
              <option value="CASH">Cash on Delivery</option>
              <option value="ONLINE">Online Payment</option>
            </select>
          </div>

          {/* Chef Filter */}
          <div className="md:col-span-2">
            <select
              value={chefFilter}
              onChange={e => setChefFilter(e.target.value)}
              className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-red-600"
            >
              <option value="ALL">All Chefs</option>
              {chefs.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.surname}</option>
              ))}
            </select>
          </div>

          {/* Date Filter Preset */}
          <div className="md:col-span-2">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as any)}
              className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-red-600"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">Last 7 Days</option>
              <option value="MONTH">Last 30 Days</option>
              <option value="CUSTOM">Custom Date Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {dateRange === 'CUSTOM' && (
          <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-gray-500">From Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold outline-none"
            />
            <span className="font-bold text-gray-500">To Date:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold outline-none"
            />
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-[10px] uppercase"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Itemized Transactions Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 bg-[#FAFAFA] border-b border-gray-100 flex justify-between items-center">
          <div>
            <h4 className="font-black text-sm uppercase tracking-widest text-gray-900">
              Transactions & Commission Split ({filteredOrders.length} Records)
            </h4>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">
              Live per-order revenue breakdown and settlement tracking
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                <th className="px-6 py-4">Booking / Date</th>
                <th className="px-6 py-4">Transaction / UTR</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Chef Name</th>
                <th className="px-6 py-4">Service Type</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4 text-red-600">Admin Cut (30%)</th>
                <th className="px-6 py-4 text-emerald-700">Chef Cut (70%)</th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4">Payment Mode</th>
                <th className="px-6 py-4 text-right">Tax Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-gray-400">
                    <AlertCircle size={36} className="mx-auto mb-2 opacity-30 text-red-500" />
                    <p className="font-bold text-sm">No transaction records match your filters.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('ALL');
                        setMethodFilter('ALL');
                        setChefFilter('ALL');
                        setDateRange('ALL');
                      }}
                      className="mt-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold"
                    >
                      Reset All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredOrders.slice().reverse().map(order => {
                  const isPaid = order.status === OrderStatus.PAID || order.status === OrderStatus.COMPLETED || order.paymentStatus === 'PAID';
                  const amount = order.totalAmount || 0;
                  const adminCut = order.commissionAdmin || Math.round(amount * ((config.adminCommissionPercent || 30) / 100));
                  const chefCut = order.commissionChef || (amount - adminCut);
                  const assignedChef = chefs.find(c => c.id === order.chefId);

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Booking ID & Date */}
                      <td className="px-6 py-4 font-bold">
                        <span className="font-mono font-black text-red-600 block">
                          #{order.bookingId || order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Transaction ID */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-[11px] font-bold text-gray-800 block truncate max-w-[140px]" title={order.transactionId || order.paymentId || 'Pending'}>
                          {order.transactionId || order.paymentId || (isPaid ? `TXN_${order.id.slice(-4)}` : '--')}
                        </span>
                        {order.paidAt && (
                          <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">
                            Paid on {new Date(order.paidAt).toLocaleDateString()}
                          </span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 block truncate max-w-[130px]" title={order.userName || order.userEmail}>
                          {order.userName || order.userEmail || 'Customer'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium block">
                          {order.userPhone || 'No Phone'}
                        </span>
                      </td>

                      {/* Chef */}
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 block truncate max-w-[130px]">
                          {order.chefName || (assignedChef ? `${assignedChef.name} ${assignedChef.surname}` : 'Unassigned')}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium block">
                          {order.chefPhone || assignedChef?.phone || ''}
                        </span>
                      </td>

                      {/* Service Type & Duration */}
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[9px] font-black uppercase inline-block">
                          {order.type}
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold block mt-0.5">
                          {order.durationMinutes ? `${order.durationMinutes} mins` : order.plateCount ? `${order.plateCount} plates` : '--'}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="px-6 py-4 font-black text-gray-900">
                        {formatCurrency(amount)}
                      </td>

                      {/* Admin Cut */}
                      <td className="px-6 py-4 font-black text-red-600">
                        +{formatCurrency(adminCut)}
                      </td>

                      {/* Chef Cut */}
                      <td className="px-6 py-4 font-black text-emerald-700">
                        {formatCurrency(chefCut)}
                      </td>

                      {/* Payment Status */}
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1",
                          isPaid ? "bg-green-100 text-green-800" :
                          order.status === OrderStatus.COOKING ? "bg-red-100 text-red-700 animate-pulse" :
                          order.status === OrderStatus.PAYMENT_PENDING ? "bg-orange-100 text-orange-800" :
                          "bg-gray-100 text-gray-700"
                        )}>
                          {isPaid ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                          {isPaid ? 'PAID' : order.status}
                        </span>
                      </td>

                      {/* Payment Mode */}
                      <td className="px-6 py-4">
                        <span className="font-bold text-[10px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded uppercase">
                          {order.paymentMethod || 'ONLINE'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => generateInvoicePDF(order, config)}
                          className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                          title="Generate and Download Tax Invoice"
                        >
                          <Download size={11} className="text-red-400" /> Invoice
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
