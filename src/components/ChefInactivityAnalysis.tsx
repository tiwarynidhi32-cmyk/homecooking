import React, { useState, useMemo } from 'react';
import { 
  ChefHat, 
  AlertTriangle, 
  UserX, 
  CheckCircle2, 
  Phone, 
  MessageCircle, 
  Search, 
  Clock, 
  ShieldAlert, 
  Calendar, 
  Filter, 
  TrendingDown, 
  Sparkles,
  Ban,
  PauseCircle,
  PlayCircle
} from 'lucide-react';
import { User, Order, OrderStatus } from '../types';
import { formatCurrency, cn } from '../lib/utils';

interface ChefInactivityAnalysisProps {
  chefs: User[];
  orders: Order[];
  onOpenStatusModal: (chef: User) => void;
  onOpenEditModal: (chef: User) => void;
  onOpenDocModal: (chef: User) => void;
}

interface ChefInactivityMetric {
  chef: User;
  completedOrdersCount: number;
  totalEarnings: number;
  firstOrderDate: Date | null;
  lastOrderDate: Date | null;
  daysSinceLastOrder: number | null;
  daysSinceLastLogin: number | null;
  isOneServiceDropOff: boolean;
  isZeroService: boolean;
  isActiveRetained: boolean;
}

export default function ChefInactivityAnalysis({
  chefs,
  orders,
  onOpenStatusModal,
  onOpenEditModal,
  onOpenDocModal
}: ChefInactivityAnalysisProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'ONE_SERVICE_DROPOFF' | 'ZERO_SERVICE' | 'RETAINED' | 'RESTRICTED'>('ONE_SERVICE_DROPOFF');

  const { metrics, summary } = useMemo(() => {
    const now = Date.now();
    const completedOrders = orders.filter(o => o.status === OrderStatus.PAID || o.status === OrderStatus.COMPLETED);

    const list: ChefInactivityMetric[] = chefs.map(chef => {
      const chefOrders = completedOrders.filter(o => o.chefId === chef.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const completedOrdersCount = chefOrders.length;
      const totalEarnings = chefOrders.reduce((sum, o) => sum + (o.commissionChef || 0), 0);

      const firstOrder = chefOrders[0];
      const lastOrder = chefOrders[chefOrders.length - 1];

      const firstOrderDate = firstOrder ? new Date(firstOrder.createdAt) : null;
      const lastOrderDate = lastOrder ? new Date(lastOrder.createdAt) : null;
      const daysSinceLastOrder = lastOrderDate ? Math.floor((now - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

      const lastLoginTime = chef.lastLoginAt ? new Date(chef.lastLoginAt).getTime() : (chef.lastActiveAt ? new Date(chef.lastActiveAt).getTime() : null);
      const daysSinceLastLogin = lastLoginTime ? Math.floor((now - lastLoginTime) / (1000 * 60 * 60 * 24)) : null;

      // 1-service drop-off definition: completed exactly 1 service and has not performed or been online in >= 7 days (or no recent login)
      const isOneServiceDropOff = completedOrdersCount === 1 && ((daysSinceLastOrder ?? 0) >= 3 || !chef.isOnline);
      const isZeroService = completedOrdersCount === 0;
      const isActiveRetained = completedOrdersCount >= 2;

      return {
        chef,
        completedOrdersCount,
        totalEarnings,
        firstOrderDate,
        lastOrderDate,
        daysSinceLastOrder,
        daysSinceLastLogin,
        isOneServiceDropOff,
        isZeroService,
        isActiveRetained
      };
    });

    // Default sort: 1-service drop-offs first, then by days inactive descending
    list.sort((a, b) => {
      if (a.isOneServiceDropOff && !b.isOneServiceDropOff) return -1;
      if (!a.isOneServiceDropOff && b.isOneServiceDropOff) return 1;
      return (b.daysSinceLastOrder ?? 999) - (a.daysSinceLastOrder ?? 999);
    });

    const totalChefs = chefs.length;
    const oneServiceDropOffCount = list.filter(m => m.isOneServiceDropOff).length;
    const zeroServiceCount = list.filter(m => m.isZeroService).length;
    const retainedCount = list.filter(m => m.isActiveRetained).length;
    const dropOffRate = (totalChefs - zeroServiceCount) > 0 
      ? Math.round((oneServiceDropOffCount / (totalChefs - zeroServiceCount)) * 100) 
      : 0;

    return {
      metrics: list,
      summary: {
        totalChefs,
        oneServiceDropOffCount,
        zeroServiceCount,
        retainedCount,
        dropOffRate
      }
    };
  }, [chefs, orders]);

  // Filter & Search
  const filteredMetrics = useMemo(() => {
    return metrics.filter(m => {
      const searchMatch = !searchTerm || 
        m.chef.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.chef.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.chef.phone.includes(searchTerm) ||
        m.chef.id.toLowerCase().includes(searchTerm.toLowerCase());

      if (!searchMatch) return false;

      if (filterType === 'ONE_SERVICE_DROPOFF') return m.isOneServiceDropOff;
      if (filterType === 'ZERO_SERVICE') return m.isZeroService;
      if (filterType === 'RETAINED') return m.isActiveRetained;
      if (filterType === 'RESTRICTED') return m.chef.status === 'SUSPENDED' || m.chef.status === 'BLOCKED' || m.chef.status === 'INACTIVE';

      return true;
    });
  }, [metrics, searchTerm, filterType]);

  const sendReengagementWhatsApp = (m: ChefInactivityMetric) => {
    const cleanPhone = m.chef.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    let text = `Hello Chef ${m.chef.name}, greetings from Home Chef Admin team! `;
    if (m.isOneServiceDropOff) {
      text += `We noticed you completed your 1st service with us recently. We have high customer demand for home chefs in your area! Please log in to your Chef App, toggle 'Online', and accept new high-paying bookings today. Let us know if you need any support.`;
    } else if (m.isZeroService) {
      text += `Your Home Chef partner account is ready! We have active booking requests waiting. Log in today to begin earning.`;
    } else {
      text += `We value your partnership with Home Chef. Check out today's upcoming booking missions in your partner dashboard!`;
    }
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-red-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-600">1-Service Drop-Offs</p>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <UserX size={18} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-red-600">
            {summary.oneServiceDropOffCount} Chefs
          </h3>
          <p className="text-[10px] text-red-400 font-bold">
            Served 1 mission and became inactive / stopped logging in
          </p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">1-Service Churn Rate</p>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingDown size={18} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-amber-600">
            {summary.dropOffRate}%
          </h3>
          <p className="text-[10px] text-gray-500 font-bold">
            Drop-off after initial booking
          </p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Retained & Active Chefs</p>
            <div className="p-2 bg-green-50 text-green-700 rounded-xl">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-green-700">
            {summary.retainedCount} Chefs
          </h3>
          <p className="text-[10px] text-green-600 font-bold">
            Completed ≥2 missions & active
          </p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Zero-Service Onboarded</p>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <Clock size={18} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-blue-700">
            {summary.zeroServiceCount} Chefs
          </h3>
          <p className="text-[10px] text-blue-500 font-bold">
            Onboarded, 0 missions yet
          </p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {/* Controls */}
        <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={20} /> Chef 1-Service Inactivity & Drop-off Monitor
            </h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              Track chefs who stopped logging in after 1 service • Deactivate, suspend, block, or re-engage
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search chef name, phone..."
                className="w-full h-11 bg-gray-50 rounded-2xl pl-10 pr-4 text-xs font-bold border border-gray-200 focus:border-red-600 outline-none transition-colors"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-gray-100 rounded-2xl">
              {[
                { id: 'ONE_SERVICE_DROPOFF', label: `1-Service Drop-Off (${summary.oneServiceDropOffCount})` },
                { id: 'ALL', label: `All Chefs (${metrics.length})` },
                { id: 'ZERO_SERVICE', label: `0 Services (${summary.zeroServiceCount})` },
                { id: 'RETAINED', label: `Retained (2+)` },
                { id: 'RESTRICTED', label: 'Suspended / Blocked' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                    filterType === f.id 
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                <th className="px-6 py-4">Chef Information</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Missions</th>
                <th className="px-6 py-4">Inactivity Alert / Category</th>
                <th className="px-6 py-4">Last Mission Date</th>
                <th className="px-6 py-4">Earnings</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredMetrics.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 font-bold text-sm">
                    No chef records match current filter.
                  </td>
                </tr>
              ) : (
                filteredMetrics.map((m) => {
                  const chefStatus = m.chef.status || 'ACTIVE';
                  const isRestricted = chefStatus === 'SUSPENDED' || chefStatus === 'BLOCKED' || chefStatus === 'INACTIVE';

                  return (
                    <tr key={m.chef.id} className="hover:bg-gray-50/60 transition-colors text-xs">
                      {/* Chef Info */}
                      <td className="px-6 py-4">
                        <div className="font-black text-gray-900 text-sm leading-tight">
                          {m.chef.name} {m.chef.surname}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          ID: #{m.chef.id}
                        </div>
                        {m.chef.isVerified ? (
                          <span className="inline-block mt-1 text-[8px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                            Verified
                          </span>
                        ) : (
                          <span className="inline-block mt-1 text-[8px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                            Unverified
                          </span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-700 flex items-center gap-1.5">
                          <Phone size={13} className="text-gray-400" /> {m.chef.phone || 'N/A'}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{m.chef.email}</div>
                      </td>

                      {/* Missions Count */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs",
                            m.isOneServiceDropOff ? "bg-red-50 text-red-600 border border-red-200" :
                            m.isActiveRetained ? "bg-green-50 text-green-700 border border-green-200" :
                            "bg-gray-100 text-gray-600"
                          )}>
                            {m.completedOrdersCount}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400">
                            {m.completedOrdersCount === 1 ? 'Service' : 'Services'}
                          </span>
                        </div>
                      </td>

                      {/* Inactivity Alert / Category */}
                      <td className="px-6 py-4">
                        {m.isOneServiceDropOff ? (
                          <div className="space-y-0.5">
                            <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                              <AlertTriangle size={11} /> 1-Service Drop-Off (Dormant)
                            </span>
                            <div className="text-[10px] text-red-600 font-bold">
                              {m.daysSinceLastOrder !== null ? `No mission in ${m.daysSinceLastOrder} days` : 'Inactive since 1st mission'}
                            </div>
                          </div>
                        ) : m.isZeroService ? (
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                            0 Missions Completed
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-lg text-[9px] font-black uppercase tracking-wider">
                            Retained Active Chef ({m.completedOrdersCount})
                          </span>
                        )}
                      </td>

                      {/* Last Mission Date */}
                      <td className="px-6 py-4 text-gray-600">
                        {m.lastOrderDate ? (
                          <div>
                            <div className="font-bold">{m.lastOrderDate.toLocaleDateString()}</div>
                            <div className="text-[10px] text-gray-400">
                              {m.daysSinceLastOrder === 0 ? 'Today' : `${m.daysSinceLastOrder} days ago`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No bookings yet</span>
                        )}
                      </td>

                      {/* Total Earnings */}
                      <td className="px-6 py-4 font-black text-gray-900">
                        {formatCurrency(m.totalEarnings)}
                      </td>

                      {/* Account Status Badge */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => onOpenStatusModal(m.chef)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-transform active:scale-95",
                            chefStatus === 'ACTIVE' ? "bg-green-100 text-green-800 hover:bg-green-200" :
                            chefStatus === 'INACTIVE' ? "bg-gray-200 text-gray-700 hover:bg-gray-300" :
                            chefStatus === 'SUSPENDED' ? "bg-amber-100 text-amber-800 hover:bg-amber-200" :
                            "bg-red-100 text-red-800 hover:bg-red-200"
                          )}
                        >
                          {chefStatus === 'ACTIVE' && <PlayCircle size={12} />}
                          {chefStatus === 'INACTIVE' && <PauseCircle size={12} />}
                          {chefStatus === 'SUSPENDED' && <AlertTriangle size={12} />}
                          {chefStatus === 'BLOCKED' && <Ban size={12} />}
                          {chefStatus}
                        </button>
                        {m.chef.statusReason && (
                          <div className="text-[9px] text-gray-400 italic mt-0.5 max-w-[120px] truncate" title={m.chef.statusReason}>
                            "{m.chef.statusReason}"
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp Re-engagement */}
                          <button
                            onClick={() => sendReengagementWhatsApp(m)}
                            title="Send WhatsApp Re-engagement message"
                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-sm transition-all active:scale-95"
                          >
                            <MessageCircle size={14} />
                          </button>

                          {/* Call */}
                          {m.chef.phone && (
                            <a
                              href={`tel:${m.chef.phone}`}
                              title="Call Chef"
                              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-all"
                            >
                              <Phone size={14} />
                            </a>
                          )}

                          {/* Quick Status Modal */}
                          <button
                            onClick={() => onOpenStatusModal(m.chef)}
                            title="Change Status (Deactivate / Suspend / Block / Activate)"
                            className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-all"
                          >
                            <ShieldAlert size={14} />
                          </button>

                          {/* Edit Chef */}
                          <button
                            onClick={() => onOpenEditModal(m.chef)}
                            className="px-2.5 py-1.5 bg-gray-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                          >
                            Edit
                          </button>
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
