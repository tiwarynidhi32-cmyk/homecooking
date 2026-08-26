import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Clock, 
  Users, 
  ChefHat, 
  TrendingUp, 
  ArrowUpRight,
  ClipboardList,
  MapPin,
  Phone,
  DollarSign,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { User, Order, OrderStatus, WithdrawalRequest, UserRole } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { api } from '../services/api';
import DailyPerformanceWidget from '../components/DailyPerformanceWidget';

export default function ManagerPanel({ user }: { user: User }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [chefs, setChefs] = useState<User[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, paymentPending: 0 });
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Keep a 1-second tick for live session timer calculations
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    const [ordersData, usersData, withdrawalsData] = await Promise.all([
      api.getOrders(),
      api.getUsers().catch(() => []),
      api.getWithdrawals()
    ]);

    setOrders(ordersData);
    setChefs(usersData.filter((u: User) => u.role === UserRole.CHEF));
    setStats({
      total: ordersData.length,
      pending: ordersData.filter(o => o.status === OrderStatus.PENDING).length,
      active: ordersData.filter(o => o.status === OrderStatus.COOKING).length,
      paymentPending: ordersData.filter(o => o.status === OrderStatus.PAYMENT_PENDING).length
    });
    
    setWithdrawals(withdrawalsData);
  };

  useEffect(() => {
    loadData();

    // Subscribe to reactive real-time order updates
    const unsubscribe = api.subscribeToOrders((allOrders) => {
      setOrders(allOrders);
      setStats({
        total: allOrders.length,
        pending: allOrders.filter(o => o.status === OrderStatus.PENDING).length,
        active: allOrders.filter(o => o.status === OrderStatus.COOKING).length,
        paymentPending: allOrders.filter(o => o.status === OrderStatus.PAYMENT_PENDING).length
      });
    });

    return () => unsubscribe();
  }, []);

  const approveWithdrawal = async (id: string) => {
    try {
      await api.updateWithdrawal(id, { status: 'APPROVED' });
      setWithdrawals(prev => prev.map(w => w.id === id ? {...w, status: 'APPROVED'} : w));
    } catch (err) {
      alert('Failed to approve withdrawal');
    }
  };

  const calculateLiveTimer = (startTime?: string | Date) => {
    if (!startTime) return '00:00';
    const startMs = new Date(startTime).getTime();
    if (isNaN(startMs)) return '00:00';
    const totalSecs = Math.max(0, Math.floor((currentTime - startMs) / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard label="Total Orders" value={stats.total.toString()} icon={<ClipboardList className="text-blue-500" />} />
        <StatsCard label="Active Cooking" value={stats.active.toString()} icon={<Clock className="text-red-500" />} />
        <StatsCard label="Payment Due" value={stats.paymentPending.toString()} icon={<DollarSign className="text-orange-500" />} />
        <StatsCard label="Pending Acceptance" value={stats.pending.toString()} icon={<Users className="text-green-500" />} />
      </div>

      {/* Daily Performance Recharts Dashboard */}
      <DailyPerformanceWidget 
        orders={orders} 
        chefs={chefs} 
        title="Operations Daily Performance" 
        subtitle="Live daily analytics for Bookings, Active On-Duty Chefs, and Revenue"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Active Cooking Sessions */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-fit">
           <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Active Cooking Missions</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Live timer & real-time status</p>
              </div>
              <span className="px-3 py-1 bg-red-50 text-red-600 font-black text-[10px] uppercase tracking-widest rounded-full">
                {stats.active} In Progress
              </span>
           </div>
           
           <div className="space-y-4">
              {orders.filter(o => o.status === OrderStatus.COOKING).length > 0 ? (
                orders.filter(o => o.status === OrderStatus.COOKING).map(o => {
                  const durationSecs = o.startTime ? Math.floor((currentTime - new Date(o.startTime).getTime()) / 1000) : 0;
                  const durationMins = Math.ceil(durationSecs / 60);
                  const currentEstAmount = durationMins * (o.ratePerMin || 3);

                  return (
                    <div key={o.id} className="p-6 bg-gray-950 text-white rounded-3xl border border-gray-800 space-y-4">
                       <div className="flex justify-between items-start">
                          <div className="space-y-1">
                             <div className="flex items-center gap-2">
                               <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
                                 #{o.bookingId || o.id.slice(-6).toUpperCase()}
                               </span>
                               <span className="text-xs font-bold text-gray-300">{o.type} Session</span>
                             </div>
                             <h4 className="font-bold text-white text-base">Chef: {o.chefName || o.chefId || 'Assigned Chef'}</h4>
                             <p className="text-xs text-gray-400">Customer: {o.userEmail || o.userId}</p>
                          </div>
                          
                          <div className="text-right">
                             <span className="text-xs font-mono font-black text-red-500 animate-pulse block">
                               ⏱️ {calculateLiveTimer(o.startTime)}
                             </span>
                             <span className="text-xs font-bold text-gray-300 mt-1 block">
                               Est. {formatCurrency(currentEstAmount)}
                             </span>
                          </div>
                       </div>

                       <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs text-gray-300 flex items-center gap-2">
                          <MapPin size={14} className="text-red-400 flex-shrink-0" />
                          <span className="truncate">{o.address || 'Lucknow Location'}</span>
                       </div>

                       <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: '20%' }} 
                            animate={{ width: '85%' }} 
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="bg-red-500 h-full rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
                          />
                       </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-400 font-medium bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <Clock size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="font-bold text-sm">No live cooking sessions currently active</p>
                  <p className="text-xs text-gray-400 mt-1">Sessions will display live running time here once started by Chef.</p>
                </div>
              )}
           </div>
        </div>

        {/* Withdrawal Approvals & Summary */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
           <div>
             <h3 className="text-2xl font-black tracking-tight">Pending Settlements</h3>
             <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Chef wallet withdrawal requests</p>
           </div>

           <div className="space-y-3">
              {withdrawals.filter(w => w.status === 'PENDING').map(w => (
                <div key={w.id} className="flex items-center justify-between p-5 bg-[#F9F8F7] rounded-3xl border border-gray-100">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-red-600">
                         <ChefHat size={20} />
                      </div>
                      <div>
                         <p className="font-black text-gray-900 text-base">{formatCurrency(w.amount)}</p>
                         <p className="text-[10px] text-gray-500 font-bold">Chef: {w.chefName || w.chefId}</p>
                         <p className="text-[9px] text-gray-400 font-mono">ID: {w.id.slice(-6).toUpperCase()}</p>
                      </div>
                   </div>
                   <button 
                    onClick={() => approveWithdrawal(w.id)}
                    className="bg-gray-950 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-600 transition-all active:scale-95 shadow-sm"
                   >
                     Approve
                   </button>
                </div>
              ))}
              {withdrawals.filter(w => w.status === 'PENDING').length === 0 && (
                <div className="text-center py-12 text-gray-400 font-medium bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                   <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2" />
                   <p className="font-bold text-sm">All Chef Settlements Clear</p>
                   <p className="text-xs text-gray-400 mt-1">No pending payouts waiting for approval.</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Orders Tracking Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-6 md:p-8">
         <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-black tracking-tight">Recent Orders & Billing Status</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Real-time synchronization across all roles</p>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
                     <th className="px-6 py-4">Booking ID</th>
                     <th className="px-6 py-4">Customer</th>
                     <th className="px-6 py-4">Assigned Chef</th>
                     <th className="px-6 py-4">Type</th>
                     <th className="px-6 py-4">Time Spent</th>
                     <th className="px-6 py-4">Amount</th>
                     <th className="px-6 py-4">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {orders.slice(0, 10).map(o => (
                     <tr key={o.id} className="hover:bg-gray-50/60 transition-colors text-xs">
                        <td className="px-6 py-4 font-mono font-black text-red-600">
                           #{o.bookingId || o.id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                           {o.userEmail || o.userId}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-700">
                           {o.chefName || o.chefId || <span className="text-gray-400 italic">Not Assigned</span>}
                        </td>
                        <td className="px-6 py-4 font-bold uppercase text-[10px] text-gray-500">
                           {o.type}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-700">
                           {o.status === OrderStatus.COOKING ? (
                              <span className="text-red-600 font-mono font-black">⏱️ {calculateLiveTimer(o.startTime)}</span>
                           ) : o.durationMinutes ? (
                              `${o.durationMinutes} mins`
                           ) : o.durationSeconds ? (
                              `${Math.ceil(o.durationSeconds / 60)} mins`
                           ) : (
                              '--'
                           )}
                        </td>
                        <td className="px-6 py-4 font-black text-gray-900">
                           {o.totalAmount ? formatCurrency(o.totalAmount) : (
                              o.status === OrderStatus.COOKING ? (
                                <span className="text-xs text-gray-400">Rs. {o.ratePerMin || 3}/min</span>
                              ) : '--'
                           )}
                        </td>
                        <td className="px-6 py-4">
                           <span className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                              o.status === OrderStatus.PAID || o.status === OrderStatus.COMPLETED ? "bg-green-100 text-green-700" :
                              o.status === OrderStatus.PAYMENT_PENDING ? "bg-orange-100 text-orange-700" :
                              o.status === OrderStatus.COOKING ? "bg-red-100 text-red-700 animate-pulse" :
                              "bg-gray-100 text-gray-700"
                           )}>
                              {o.status}
                           </span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
       <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center flex-shrink-0">
          {icon}
       </div>
       <div>
          <div className="text-3xl font-black tracking-tighter text-gray-900">{value}</div>
          <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{label}</div>
       </div>
    </div>
  );
}
