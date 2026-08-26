import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Repeat, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Search, 
  Phone, 
  MessageCircle, 
  Award, 
  ArrowUpRight, 
  Filter,
  Flame,
  Clock,
  Sparkles
} from 'lucide-react';
import { User, Order, OrderStatus } from '../types';
import { formatCurrency, cn } from '../lib/utils';

interface CustomerRetentionAnalysisProps {
  users: User[];
  orders: Order[];
  onOpenUserModal?: (user: User) => void;
}

interface CustomerMetric {
  userId: string;
  name: string;
  phone: string;
  email: string;
  customerCode?: string;
  orderCount: number;
  totalSpent: number;
  firstOrderDate: Date | null;
  lastOrderDate: Date | null;
  daysSinceLastOrder: number | null;
  tier: 'VIP_CHAMPION' | 'LOYAL' | 'REPEAT' | 'SINGLE';
  userObj?: User;
}

export default function CustomerRetentionAnalysis({
  users,
  orders,
  onOpenUserModal
}: CustomerRetentionAnalysisProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'REPEAT' | 'SINGLE' | 'TOP_SPENDERS' | 'DORMANT'>('ALL');

  // Compute analytics
  const { customerMetrics, summary } = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== OrderStatus.CANCELLED);
    
    // Group orders by customer (using userId or userPhone or userEmail)
    const userMap: Record<string, { orders: Order[]; userObj?: User }> = {};

    validOrders.forEach(o => {
      const key = o.userId || o.userPhone || o.userEmail || 'unknown';
      if (!userMap[key]) {
        const foundUser = users.find(u => u.id === o.userId || u.phone === o.userPhone || u.email === o.userEmail);
        userMap[key] = { orders: [], userObj: foundUser };
      }
      userMap[key].orders.push(o);
    });

    const now = Date.now();
    const metricsList: CustomerMetric[] = Object.entries(userMap).map(([key, data]) => {
      const uOrders = data.orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const firstOrder = uOrders[0];
      const lastOrder = uOrders[uOrders.length - 1];

      const firstOrderDate = firstOrder ? new Date(firstOrder.createdAt) : null;
      const lastOrderDate = lastOrder ? new Date(lastOrder.createdAt) : null;
      const daysSinceLastOrder = lastOrderDate ? Math.floor((now - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

      const orderCount = uOrders.length;
      const totalSpent = uOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      let tier: CustomerMetric['tier'] = 'SINGLE';
      if (orderCount >= 5) tier = 'VIP_CHAMPION';
      else if (orderCount >= 3) tier = 'LOYAL';
      else if (orderCount >= 2) tier = 'REPEAT';

      const userObj = data.userObj;
      const name = userObj?.name ? `${userObj.name} ${userObj.surname || ''}` : (firstOrder?.userName || 'Guest Customer');
      const phone = userObj?.phone || firstOrder?.userPhone || 'N/A';
      const email = userObj?.email || firstOrder?.userEmail || '';
      const customerCode = userObj?.customerCode;

      return {
        userId: userObj?.id || key,
        name,
        phone,
        email,
        customerCode,
        orderCount,
        totalSpent,
        firstOrderDate,
        lastOrderDate,
        daysSinceLastOrder,
        tier,
        userObj
      };
    });

    // Sort by order count descending by default
    metricsList.sort((a, b) => b.orderCount - a.orderCount || b.totalSpent - a.totalSpent);

    const totalCustomers = metricsList.length;
    const repeatCustomers = metricsList.filter(m => m.orderCount >= 2).length;
    const singleCustomers = metricsList.filter(m => m.orderCount === 1).length;
    const reorderRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
    const totalRevenue = metricsList.reduce((sum, m) => sum + m.totalSpent, 0);
    const avgLTV = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;
    const repeatRevenue = metricsList.filter(m => m.orderCount >= 2).reduce((sum, m) => sum + m.totalSpent, 0);

    return {
      customerMetrics: metricsList,
      summary: {
        totalCustomers,
        repeatCustomers,
        singleCustomers,
        reorderRate,
        totalRevenue,
        avgLTV,
        repeatRevenue
      }
    };
  }, [users, orders]);

  // Filter and search
  const filteredMetrics = useMemo(() => {
    return customerMetrics.filter(c => {
      // Search
      const searchMatch = !searchTerm || 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.customerCode && c.customerCode.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!searchMatch) return false;

      // Filter
      if (selectedFilter === 'REPEAT') return c.orderCount >= 2;
      if (selectedFilter === 'SINGLE') return c.orderCount === 1;
      if (selectedFilter === 'TOP_SPENDERS') return c.totalSpent >= 1500;
      if (selectedFilter === 'DORMANT') return (c.daysSinceLastOrder ?? 0) > 30;

      return true;
    });
  }, [customerMetrics, searchTerm, selectedFilter]);

  const sendWhatsApp = (c: CustomerMetric) => {
    const cleanPhone = c.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    let text = `Hello ${c.name}, greetings from Home Chef! Thank you for ordering with us. `;
    if (c.orderCount >= 2) {
      text += `As one of our valued repeat customers (${c.orderCount} bookings completed), we have special chef offers for your next meal! Would you like to book a chef today?`;
    } else {
      text += `We noticed you enjoyed our chef service recently. Book your next private chef session today and enjoy special home dining!`;
    }
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Header Cards / KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reorder Rate</p>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <Repeat size={18} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-red-600">
            {summary.reorderRate}%
          </h3>
          <p className="text-[10px] text-gray-500 font-bold">
            {summary.repeatCustomers} of {summary.totalCustomers} customers reordered
          </p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Repeat Customers</p>
            <div className="p-2 bg-green-50 text-green-700 rounded-xl">
              <Users size={18} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-green-700">
            {summary.repeatCustomers}
          </h3>
          <p className="text-[10px] text-green-600 font-bold">
            {summary.singleCustomers} single-order customers
          </p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Repeat Revenue</p>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-gray-900">
            {formatCurrency(summary.repeatRevenue)}
          </h3>
          <p className="text-[10px] text-gray-500 font-bold">
            {summary.totalRevenue > 0 ? Math.round((summary.repeatRevenue / summary.totalRevenue) * 100) : 0}% of gross revenue
          </p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Avg Customer LTV</p>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
              <DollarSign size={18} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-purple-700">
            {formatCurrency(summary.avgLTV)}
          </h3>
          <p className="text-[10px] text-purple-500 font-bold">
            Lifetime spend per customer
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Sparkles className="text-red-600" size={20} /> Customer Repeat-Order & Retention Analysis
            </h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              Identify loyal repeat bookers, track order frequency, and re-engage dormant customers
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search name, phone, code..."
                className="w-full h-11 bg-gray-50 rounded-2xl pl-10 pr-4 text-xs font-bold border border-gray-200 focus:border-red-600 outline-none transition-colors"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-gray-100 rounded-2xl">
              {[
                { id: 'ALL', label: `All (${customerMetrics.length})` },
                { id: 'REPEAT', label: `Repeat (${summary.repeatCustomers})` },
                { id: 'SINGLE', label: `1-Time (${summary.singleCustomers})` },
                { id: 'TOP_SPENDERS', label: 'Top Spenders' },
                { id: 'DORMANT', label: 'Dormant (>30d)' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                    selectedFilter === f.id 
                      ? "bg-white text-gray-900 shadow-sm" 
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Total Orders</th>
                <th className="px-6 py-4">Customer Tier</th>
                <th className="px-6 py-4">Total Lifetime Value</th>
                <th className="px-6 py-4">Last Booking Date</th>
                <th className="px-6 py-4">Recency / Activity</th>
                <th className="px-6 py-4 text-right">Quick Engagement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredMetrics.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 font-bold text-sm">
                    No customer data matches current filter.
                  </td>
                </tr>
              ) : (
                filteredMetrics.map((c) => {
                  const isDormant = (c.daysSinceLastOrder ?? 0) > 30;
                  const isRepeat = c.orderCount >= 2;

                  return (
                    <tr key={c.userId} className="hover:bg-gray-50/60 transition-colors text-xs">
                      {/* Customer Name */}
                      <td className="px-6 py-4">
                        <div className="font-black text-gray-900 text-sm leading-tight flex items-center gap-1.5">
                          {c.name}
                          {c.tier === 'VIP_CHAMPION' && <Flame size={14} className="text-amber-500 fill-amber-500" />}
                        </div>
                        {c.customerCode && (
                          <div className="text-[10px] font-mono font-bold text-red-600 mt-0.5">
                            Code: {c.customerCode}
                          </div>
                        )}
                        <div className="text-[10px] text-gray-400 mt-0.5">{c.email || 'No email registered'}</div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-700 flex items-center gap-1.5">
                          <Phone size={13} className="text-gray-400" /> {c.phone}
                        </div>
                      </td>

                      {/* Total Orders */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs",
                            isRepeat ? "bg-red-50 text-red-600 border border-red-100" : "bg-gray-100 text-gray-600"
                          )}>
                            {c.orderCount}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400">
                            {c.orderCount === 1 ? 'Booking' : 'Bookings'}
                          </span>
                        </div>
                      </td>

                      {/* Customer Tier */}
                      <td className="px-6 py-4">
                        {c.tier === 'VIP_CHAMPION' ? (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                            <Award size={11} /> VIP Champion (5+)
                          </span>
                        ) : c.tier === 'LOYAL' ? (
                          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg text-[9px] font-black uppercase tracking-wider">
                            Loyal Customer (3-4)
                          </span>
                        ) : c.tier === 'REPEAT' ? (
                          <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-lg text-[9px] font-black uppercase tracking-wider">
                            Repeat (2 Orders)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                            First-Time (1 Order)
                          </span>
                        )}
                      </td>

                      {/* LTV */}
                      <td className="px-6 py-4 font-black text-gray-900 text-sm">
                        {formatCurrency(c.totalSpent)}
                      </td>

                      {/* Last Booking Date */}
                      <td className="px-6 py-4 text-gray-600">
                        {c.lastOrderDate ? (
                          <div>
                            <div className="font-bold">{c.lastOrderDate.toLocaleDateString()}</div>
                            <div className="text-[10px] text-gray-400">
                              First: {c.firstOrderDate?.toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>

                      {/* Recency */}
                      <td className="px-6 py-4">
                        {c.daysSinceLastOrder !== null ? (
                          <div>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider inline-block",
                              c.daysSinceLastOrder <= 7 ? "bg-green-50 text-green-700" :
                              c.daysSinceLastOrder <= 30 ? "bg-blue-50 text-blue-700" :
                              "bg-red-50 text-red-700"
                            )}>
                              {c.daysSinceLastOrder === 0 ? 'Today' : `${c.daysSinceLastOrder} days ago`}
                            </span>
                            {isDormant && (
                              <div className="text-[9px] text-red-500 font-bold uppercase tracking-tight mt-0.5">
                                Dormant Customer
                              </div>
                            )}
                          </div>
                        ) : 'N/A'}
                      </td>

                      {/* Quick Engagement Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => sendWhatsApp(c)}
                            title="Send WhatsApp Loyalty / Re-engagement Offer"
                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1 text-[10px] font-black uppercase"
                          >
                            <MessageCircle size={14} />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>
                          
                          {c.phone && c.phone !== 'N/A' && (
                            <a
                              href={`tel:${c.phone}`}
                              title="Call Customer"
                              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-all"
                            >
                              <Phone size={14} />
                            </a>
                          )}

                          {c.userObj && onOpenUserModal && (
                            <button
                              onClick={() => onOpenUserModal(c.userObj!)}
                              className="px-2.5 py-1.5 bg-gray-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              Edit Profile
                            </button>
                          )}
                        </div>
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
