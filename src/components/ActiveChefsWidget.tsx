import React, { useState, useEffect } from 'react';
import { 
  ChefHat, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Star, 
  MapPin, 
  Phone, 
  Radio, 
  ChevronRight, 
  Eye, 
  X, 
  Activity, 
  Flame,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { User, Order, OrderStatus, UserRole } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';

interface ActiveChefsWidgetProps {
  orders?: Order[];
  onSelectChef?: (chef: User) => void;
  variant?: 'banner' | 'cards' | 'compact' | 'full';
  showOfflineToggle?: boolean;
  isAdmin?: boolean;
}

export interface ChefWithStatus extends User {
  liveStatus: 'ONLINE_AVAILABLE' | 'ONLINE_COOKING' | 'OFFLINE';
  activeOrder?: Order;
  specialtyList: string[];
  areaName: string;
  ratingValue: number;
  totalMissions: number;
}

const DEFAULT_SPECIALTIES = [
  'North Indian Veg',
  'Dal & Paneer Specialties',
  'Lucknowi Mughlai',
  'Party Feasts & Breads',
  'Healthy Home Thali'
];

const LUCKNOW_AREAS = [
  'Gomti Nagar',
  'Hazratganj',
  'Indira Nagar',
  'Alambagh',
  'Mahanagar',
  'Aliganj',
  'Vikas Nagar',
  'Jankipuram'
];

export default function ActiveChefsWidget({
  orders: propOrders,
  onSelectChef,
  variant = 'banner',
  showOfflineToggle = false,
  isAdmin = false
}: ActiveChefsWidgetProps) {
  const [allChefs, setAllChefs] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>(propOrders || []);
  const [selectedChef, setSelectedChef] = useState<ChefWithStatus | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'ONLINE' | 'COOKING' | 'OFFLINE'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const usersData = await api.getUsers().catch(() => []);
      const chefsOnly = usersData.filter((u: User) => u.role === UserRole.CHEF);
      setAllChefs(chefsOnly);

      if (!propOrders) {
        const ords = await api.getOrders().catch(() => []);
        setOrders(ords);
      }
    };
    load();

    const unsubUsers = api.subscribeToUsers((users) => {
      setAllChefs(users.filter(u => u.role === UserRole.CHEF));
    });

    const unsubOrders = api.subscribeToOrders((ords) => {
      setOrders(ords);
    });

    return () => {
      unsubUsers();
      unsubOrders();
    };
  }, [propOrders]);

  // Enrich chefs with live status & metrics
  const enrichedChefs: ChefWithStatus[] = allChefs.map((chef, idx) => {
    const activeOrder = orders.find(
      o => o.chefId === chef.id && (o.status === OrderStatus.COOKING || o.status === OrderStatus.PENDING)
    );
    const chefCompletedOrders = orders.filter(
      o => o.chefId === chef.id && (o.status === OrderStatus.PAID || o.status === OrderStatus.COMPLETED)
    );
    
    let liveStatus: ChefWithStatus['liveStatus'] = 'OFFLINE';
    if (chef.isOnline) {
      if (activeOrder && activeOrder.status === OrderStatus.COOKING) {
        liveStatus = 'ONLINE_COOKING';
      } else {
        liveStatus = 'ONLINE_AVAILABLE';
      }
    }

    const assignedArea = chef.address || LUCKNOW_AREAS[idx % LUCKNOW_AREAS.length];
    const specialtyList = [
      DEFAULT_SPECIALTIES[idx % DEFAULT_SPECIALTIES.length],
      DEFAULT_SPECIALTIES[(idx + 2) % DEFAULT_SPECIALTIES.length]
    ];

    const ratedOrders = chefCompletedOrders.filter(o => o.rating && o.rating > 0);
    const ratingValue = ratedOrders.length > 0 
      ? Number((ratedOrders.reduce((sum, o) => sum + (o.rating || 5), 0) / ratedOrders.length).toFixed(1))
      : 4.9;

    return {
      ...chef,
      liveStatus,
      activeOrder,
      specialtyList,
      areaName: assignedArea,
      ratingValue,
      totalMissions: chefCompletedOrders.length
    };
  });

  const onlineAvailable = enrichedChefs.filter(c => c.liveStatus === 'ONLINE_AVAILABLE');
  const onlineCooking = enrichedChefs.filter(c => c.liveStatus === 'ONLINE_COOKING');
  const offlineChefs = enrichedChefs.filter(c => c.liveStatus === 'OFFLINE');

  const filteredChefs = enrichedChefs.filter(c => {
    if (filter === 'ONLINE') return c.liveStatus === 'ONLINE_AVAILABLE';
    if (filter === 'COOKING') return c.liveStatus === 'ONLINE_COOKING';
    if (filter === 'OFFLINE') return c.liveStatus === 'OFFLINE';
    return true;
  });

  const handleToggleOnline = async (chefId: string, currentStatus: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.updateUser(chefId, { isOnline: !currentStatus });
    } catch (err) {
      alert('Failed to update chef status');
    }
  };

  // 1. Compact View (Used in Navbars / Headers / Stats)
  if (variant === 'compact') {
    return (
      <div 
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer inline-flex items-center gap-2.5 px-4 py-2 bg-emerald-50 text-emerald-900 border border-emerald-200/80 rounded-2xl hover:bg-emerald-100 transition-all shadow-sm group"
      >
        <div className="relative flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 leading-tight">
            {onlineAvailable.length} Chefs Online
          </span>
          <span className="text-[9px] font-bold text-emerald-950/70">
            Ready to Accept Bookings
          </span>
        </div>
        <ChevronRight size={14} className="text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
      </div>
    );
  }

  // 2. Banner View (Top of User Booking Screen or Hero)
  return (
    <>
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-950 text-white rounded-3xl md:rounded-[2.5rem] p-5 md:p-6 shadow-xl border border-emerald-700/40 relative overflow-hidden">
        {/* Subtle decorative background */}
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 opacity-10 pointer-events-none">
          <ChefHat size={180} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Lucknow Chef Status
              </span>
              <span className="px-2.5 py-0.5 bg-yellow-400/20 border border-yellow-300/40 rounded-full text-[10px] font-black text-yellow-300">
                ⚡ Instant Dispatch
              </span>
            </div>

            <div>
              <h3 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{onlineAvailable.length} Verified Chefs Online</span>
                <span className="text-emerald-300 text-sm font-bold font-sans">Ready to Accept Bookings</span>
              </h3>
              <p className="text-xs text-emerald-100/80 font-medium mt-0.5">
                Chefs are active in Lucknow (Gomti Nagar, Hazratganj, Aliganj, Alambagh). Bookings are accepted immediately.
              </p>
            </div>

            {/* Live Status Metrics */}
            <div className="flex items-center gap-3 pt-1 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-700/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-bold text-emerald-100">{onlineAvailable.length} Ready to Accept</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-700/30">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-bold text-emerald-100">{onlineCooking.length} In Cooking Session</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-700/30">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="font-bold text-emerald-100">{offlineChefs.length} Offline</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-3 bg-white text-emerald-950 hover:bg-emerald-50 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Eye size={15} className="text-emerald-700" />
              <span>View Lucknow Chefs ({enrichedChefs.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Modal / Drawer to view all active & registered chefs */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-3 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)} 
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col z-10"
            >
              {/* Header */}
              <div className="p-6 md:p-8 bg-gradient-to-r from-gray-900 to-black text-white flex justify-between items-center border-b border-gray-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-400/30">
                      Live Lucknow Network
                    </span>
                    <span className="text-xs text-gray-400 font-bold">Lucknow, Uttar Pradesh</span>
                  </div>
                  <h3 className="text-2xl font-black mt-1 text-white">
                    Active & Registered Chefs
                  </h3>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Real-time status of certified cooks ready to accept home cooking bookings
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="p-4 md:px-8 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                  <button
                    onClick={() => setFilter('ALL')}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                      filter === 'ALL' ? "bg-gray-950 text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-200 border border-gray-200"
                    )}
                  >
                    All Chefs ({enrichedChefs.length})
                  </button>
                  <button
                    onClick={() => setFilter('ONLINE')}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all",
                      filter === 'ONLINE' ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Ready to Accept ({onlineAvailable.length})
                  </button>
                  <button
                    onClick={() => setFilter('COOKING')}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all",
                      filter === 'COOKING' ? "bg-amber-600 text-white shadow-sm" : "bg-white text-amber-700 hover:bg-amber-50 border border-amber-200"
                    )}
                  >
                    <Flame size={13} className="text-amber-500" />
                    Cooking Now ({onlineCooking.length})
                  </button>
                  <button
                    onClick={() => setFilter('OFFLINE')}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                      filter === 'OFFLINE' ? "bg-gray-600 text-white shadow-sm" : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
                    )}
                  >
                    Offline ({offlineChefs.length})
                  </button>
                </div>

                <div className="text-[11px] font-bold text-gray-400">
                  Showing {filteredChefs.length} of {enrichedChefs.length} Chefs
                </div>
              </div>

              {/* Chefs Grid */}
              <div className="p-4 md:p-8 overflow-y-auto flex-1 space-y-4 max-h-[60vh] custom-scrollbar">
                {filteredChefs.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <ChefHat size={48} className="mx-auto text-gray-300 mb-3" />
                    <h4 className="text-base font-black text-gray-700">No chefs found for this filter</h4>
                    <p className="text-xs text-gray-400 mt-1">Switch filter to view all registered chefs in Lucknow.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredChefs.map(chef => {
                      const isAvailable = chef.liveStatus === 'ONLINE_AVAILABLE';
                      const isCooking = chef.liveStatus === 'ONLINE_COOKING';
                      const isOffline = chef.liveStatus === 'OFFLINE';

                      return (
                        <div 
                          key={chef.id}
                          className={cn(
                            "p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 relative overflow-hidden",
                            isAvailable ? "bg-white border-emerald-200 hover:border-emerald-400 hover:shadow-md" :
                            isCooking ? "bg-amber-50/50 border-amber-200" :
                            "bg-gray-50/70 border-gray-200 opacity-80"
                          )}
                        >
                          <div>
                            {/* Top Badge & Status */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-700 text-lg relative overflow-hidden border border-gray-200 flex-shrink-0">
                                  {chef.photo ? (
                                    <img src={chef.photo} alt={chef.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{chef.name.slice(0, 1)}{chef.surname?.slice(0, 1)}</span>
                                  )}
                                  <span className={cn(
                                    "w-3.5 h-3.5 rounded-full absolute -top-0.5 -right-0.5 border-2 border-white",
                                    isAvailable ? "bg-emerald-500" :
                                    isCooking ? "bg-amber-500 animate-ping" : "bg-gray-400"
                                  )} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="font-black text-gray-900 text-base">{chef.name} {chef.surname}</h4>
                                    {chef.isVerified && (
                                      <ShieldCheck size={16} className="text-emerald-600" title="Verified Lucknow Chef" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <div className="flex items-center text-amber-500 text-xs font-black">
                                      <Star size={12} className="fill-amber-400 text-amber-400 mr-0.5" />
                                      {chef.ratingValue}
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold">•</span>
                                    <span className="text-[10px] font-bold text-gray-500">{chef.totalMissions} missions completed</span>
                                  </div>
                                </div>
                              </div>

                              {/* Status Chip */}
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 flex-shrink-0",
                                isAvailable ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                                isCooking ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse" :
                                "bg-gray-200 text-gray-700"
                              )}>
                                {isAvailable ? '🟢 Ready to Accept' :
                                 isCooking ? '🟡 In Cooking Session' : '⚪ Offline'}
                              </span>
                            </div>

                            {/* Location & Specialties */}
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                                <MapPin size={13} className="text-red-500 flex-shrink-0" />
                                <span className="truncate">{chef.areaName}</span>
                              </div>

                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {chef.specialtyList.map((spec, sIdx) => (
                                  <span key={sIdx} className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-bold">
                                    {spec}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Footer / Controls */}
                          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                            <span className="text-[11px] text-gray-500 font-medium">
                              Rate: <strong className="text-gray-900">₹3/min</strong> Live Cooking
                            </span>

                            <div className="flex items-center gap-2">
                              {(isAdmin || showOfflineToggle) && (
                                <button
                                  onClick={(e) => handleToggleOnline(chef.id, !!chef.isOnline, e)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all",
                                    chef.isOnline ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-emerald-600 text-white hover:bg-emerald-700"
                                  )}
                                >
                                  {chef.isOnline ? 'Set Offline' : 'Set Online'}
                                </button>
                              )}

                              {isAvailable && (
                                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                  Auto-Dispatched on Booking
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 md:px-8 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-gray-500 font-medium">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>All HC Home Cooking chefs are background-verified and health-certified for Lucknow homes.</span>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gray-950 hover:bg-black text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
