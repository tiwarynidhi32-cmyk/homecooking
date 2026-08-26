import React, { useState, useMemo } from 'react';
import { 
  ChefHat, 
  X, 
  Download, 
  Calendar, 
  Clock, 
  DollarSign, 
  Star, 
  TrendingUp, 
  FileText, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Mail, 
  Search, 
  Filter, 
  CreditCard,
  User as UserIcon,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Order, OrderStatus, AppConfig } from '../types';
import { formatCurrency } from '../lib/utils';
import { generateChefStatementPDF, generateInvoicePDF } from '../utils/pdfGenerator';

interface ChefHistoryModalProps {
  chef: User;
  orders: Order[];
  isOpen: boolean;
  onClose: () => void;
  config?: AppConfig | null;
}

export default function ChefHistoryModal({
  chef,
  orders,
  isOpen,
  onClose,
  config
}: ChefHistoryModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);

  // Filter orders for this chef
  const chefOrders = useMemo(() => {
    return orders.filter(o => o.chefId === chef.id || (o.chefName && o.chefName.toLowerCase().includes(chef.name.toLowerCase())));
  }, [orders, chef.id, chef.name]);

  // Apply search and filter
  const filteredOrders = useMemo(() => {
    return chefOrders.filter(o => {
      // Search
      const matchesSearch = searchTerm === '' || 
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.bookingId && o.bookingId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (o.userName && o.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (o.userPhone && o.userPhone.includes(searchTerm));

      // Status
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;

      // Date Range
      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && new Date(o.createdAt) >= new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59);
        matchesDate = matchesDate && new Date(o.createdAt) <= end;
      }

      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [chefOrders, searchTerm, statusFilter, startDate, endDate]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const completed = chefOrders.filter(o => o.status === OrderStatus.PAID || o.status === OrderStatus.COMPLETED);
    const totalGross = completed.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalChefNet = completed.reduce((sum, o) => sum + (o.commissionChef || Math.round((o.totalAmount || 0) * 0.7)), 0);
    const totalPlatformCut = completed.reduce((sum, o) => sum + (o.commissionAdmin || Math.round((o.totalAmount || 0) * 0.3)), 0);
    const totalMinutes = completed.reduce((sum, o) => sum + (o.durationMinutes || Math.ceil((o.durationSeconds || 0) / 60) || 0), 0);
    
    const ratedOrders = completed.filter(o => o.rating);
    const avgRating = ratedOrders.length > 0
      ? (ratedOrders.reduce((sum, o) => sum + (o.rating || 0), 0) / ratedOrders.length).toFixed(1)
      : '5.0';

    return {
      totalMissions: chefOrders.length,
      completedMissions: completed.length,
      totalGross,
      totalChefNet,
      totalPlatformCut,
      totalMinutes,
      avgRating,
      ratedCount: ratedOrders.length
    };
  }, [chefOrders]);

  const handleDownloadStatement = () => {
    generateChefStatementPDF(
      chef, 
      filteredOrders, 
      config, 
      startDate || endDate ? { start: startDate, end: endDate } : undefined
    );
  };

  const handleDownloadInvoice = (order: Order) => {
    generateInvoicePDF(order, config);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[150] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white max-w-6xl w-full rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-black p-6 sm:p-8 text-white relative">
          <button 
            onClick={onClose}
            className="absolute right-5 top-5 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-red-600 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-red-600/30 flex-shrink-0">
                {chef.photoUrl ? (
                  <img src={chef.photoUrl} alt={chef.name} className="w-full h-full object-cover rounded-3xl" />
                ) : (
                  <ChefHat size={32} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{chef.name} {chef.surname}</h2>
                  <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-green-500/30">
                    <ShieldCheck size={12} /> {chef.status || 'ACTIVE'}
                  </span>
                  <span className="px-2.5 py-1 bg-white/10 text-gray-300 rounded-full text-[10px] font-mono">
                    ID: #{chef.id}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 font-medium mt-1 flex-wrap">
                  <span className="flex items-center gap-1"><Phone size={13} /> {chef.phone || chef.whatsapp || 'N/A'}</span>
                  <span className="flex items-center gap-1"><Mail size={13} /> {chef.email}</span>
                  {chef.address && <span className="flex items-center gap-1">📍 {chef.address}</span>}
                </div>
              </div>
            </div>

            {/* Quick Action Button: Download Statement PDF */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleDownloadStatement}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#E31E24] hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
              >
                <Download size={16} /> Download Statement PDF
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Missions</span>
              <span className="text-2xl font-black text-gray-900 mt-1 block">{metrics.completedMissions}</span>
              <span className="text-[9px] text-gray-400 font-bold">{metrics.totalMissions} Total Assigned</span>
            </div>

            <div className="bg-emerald-50/60 p-4 rounded-3xl border border-emerald-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 block">Chef Net (70%)</span>
              <span className="text-2xl font-black text-emerald-800 mt-1 block">{formatCurrency(metrics.totalChefNet)}</span>
              <span className="text-[9px] text-emerald-600 font-bold">Earned Payout</span>
            </div>

            <div className="bg-purple-50/60 p-4 rounded-3xl border border-purple-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 block">Gross Billed</span>
              <span className="text-2xl font-black text-purple-900 mt-1 block">{formatCurrency(metrics.totalGross)}</span>
              <span className="text-[9px] text-purple-500 font-bold">100% Turnover</span>
            </div>

            <div className="bg-red-50/60 p-4 rounded-3xl border border-red-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-red-600 block">Platform Cut</span>
              <span className="text-2xl font-black text-red-700 mt-1 block">{formatCurrency(metrics.totalPlatformCut)}</span>
              <span className="text-[9px] text-red-400 font-bold">30% Commission</span>
            </div>

            <div className="bg-amber-50/60 p-4 rounded-3xl border border-amber-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 block">Avg Rating</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-2xl font-black text-amber-900">{metrics.avgRating}</span>
                <Star size={16} className="text-amber-500 fill-amber-500" />
              </div>
              <span className="text-[9px] text-amber-600 font-bold">{metrics.ratedCount} Reviews</span>
            </div>

            <div className="bg-blue-50/60 p-4 rounded-3xl border border-blue-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 block">Cooking Time</span>
              <span className="text-2xl font-black text-blue-900 mt-1 block">
                {Math.floor(metrics.totalMinutes / 60)}h {metrics.totalMinutes % 60}m
              </span>
              <span className="text-[9px] text-blue-500 font-bold">Service Logged</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-gray-50/80 p-4 rounded-3xl border border-gray-200/80 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search Booking ID, Customer, Phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 h-10 pl-9 pr-4 rounded-xl text-xs font-bold focus:outline-none focus:border-red-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-200 h-10 px-3 rounded-xl text-xs font-bold focus:outline-none"
              >
                <option value="ALL">All Statuses ({chefOrders.length})</option>
                <option value={OrderStatus.PAID}>Paid / Settled</option>
                <option value={OrderStatus.COMPLETED}>Completed</option>
                <option value={OrderStatus.PAYMENT_PENDING}>Payment Pending</option>
                <option value={OrderStatus.COOKING}>Cooking Active</option>
                <option value={OrderStatus.CANCELLED}>Cancelled</option>
              </select>

              <div className="flex items-center gap-1 bg-white border border-gray-200 h-10 px-2 rounded-xl text-xs font-bold">
                <Calendar size={14} className="text-gray-400" />
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-none text-xs font-bold focus:outline-none text-gray-700" 
                />
                <span className="text-gray-300">to</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-none text-xs font-bold focus:outline-none text-gray-700" 
                />
              </div>

              {(searchTerm || statusFilter !== 'ALL' || startDate || endDate) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('ALL');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-xs font-black text-red-600 px-2 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Orders History Table */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h4 className="font-black text-xs uppercase tracking-widest text-gray-700">
                Completed & Assigned Missions ({filteredOrders.length})
              </h4>
              <span className="text-[10px] text-gray-400 font-bold">Showing chronological history</span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-gray-400 space-y-2">
                <ChefHat size={40} className="mx-auto text-gray-300" />
                <p className="font-bold text-sm">No missions found matching criteria</p>
                <p className="text-xs">Try adjusting your filters or date range</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-[9px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                      <th className="px-5 py-4">Booking Ref</th>
                      <th className="px-5 py-4">Date & Time</th>
                      <th className="px-5 py-4">Customer</th>
                      <th className="px-5 py-4">Type & Duration</th>
                      <th className="px-5 py-4">Gross Bill</th>
                      <th className="px-5 py-4 text-emerald-700">Chef Net (70%)</th>
                      <th className="px-5 py-4 text-red-600">Platform Cut</th>
                      <th className="px-5 py-4">Status & Mode</th>
                      <th className="px-5 py-4">Rating</th>
                      <th className="px-5 py-4 text-right">PDF Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredOrders.map(order => {
                      const duration = order.durationMinutes || Math.ceil((order.durationSeconds || 0) / 60) || 0;
                      const chefShare = order.commissionChef || Math.round((order.totalAmount || 0) * 0.7);
                      const adminShare = order.commissionAdmin || Math.round((order.totalAmount || 0) * 0.3);

                      return (
                        <tr key={order.id} className="text-xs hover:bg-red-50/20 transition-colors">
                          {/* Booking Ref */}
                          <td className="px-5 py-4">
                            <div className="font-mono font-black text-gray-900">
                              #{order.bookingId || order.id.slice(-6).toUpperCase()}
                            </div>
                            <span className="text-[9px] text-gray-400 font-mono">ID: {order.id.slice(0, 8)}</span>
                          </td>

                          {/* Date & Time */}
                          <td className="px-5 py-4">
                            <div className="font-bold text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</div>
                            <div className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>

                          {/* Customer */}
                          <td className="px-5 py-4">
                            <div className="font-bold text-gray-900">{order.userName || order.userEmail?.split('@')[0] || 'Customer'}</div>
                            <div className="text-[10px] text-gray-400">{order.userPhone || 'N/A'}</div>
                            {order.address && (
                              <div className="text-[9px] text-gray-400 truncate max-w-[140px]" title={order.address}>
                                📍 {order.address}
                              </div>
                            )}
                          </td>

                          {/* Type & Duration */}
                          <td className="px-5 py-4">
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-[9px] font-black uppercase text-gray-700 inline-block mb-1">
                              {order.type || 'DAILY'}
                            </span>
                            <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                              <Clock size={11} /> {duration} mins
                            </div>
                          </td>

                          {/* Gross Bill */}
                          <td className="px-5 py-4 font-black text-gray-900">
                            {formatCurrency(order.totalAmount || 0)}
                          </td>

                          {/* Chef Net */}
                          <td className="px-5 py-4 font-black text-emerald-700">
                            {formatCurrency(chefShare)}
                          </td>

                          {/* Platform Cut */}
                          <td className="px-5 py-4 font-black text-red-600">
                            {formatCurrency(adminShare)}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              order.status === OrderStatus.PAID ? 'bg-green-100 text-green-700' :
                              order.status === OrderStatus.COOKING ? 'bg-red-100 text-red-700 animate-pulse' :
                              order.status === OrderStatus.PAYMENT_PENDING ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {order.status}
                            </span>
                            {order.paymentMethod && (
                              <div className="text-[9px] text-gray-400 font-bold mt-0.5">{order.paymentMethod}</div>
                            )}
                          </td>

                          {/* Rating */}
                          <td className="px-5 py-4">
                            {order.rating ? (
                              <div>
                                <div className="flex items-center text-amber-500 font-black text-xs">
                                  {'★'.repeat(order.rating)}
                                  <span className="ml-1 text-[10px] text-gray-400">({order.rating})</span>
                                </div>
                                {order.review && (
                                  <p className="text-[9px] text-gray-500 italic max-w-[120px] truncate mt-0.5" title={order.review}>
                                    "{order.review}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-300 italic">No review</span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleDownloadInvoice(order)}
                              title="Download Tax / Service Invoice PDF"
                              className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ml-auto shadow-sm active:scale-95 transition-all"
                            >
                              <FileText size={12} className="text-red-400" />
                              <span>Invoice</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-400 font-bold">
            HC Home Cooking Services Partner Ledger • All payouts calculated at 70% of gross cooking bill
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadStatement}
              className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Download size={14} /> Export Statement PDF
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-xl font-bold text-xs uppercase transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
