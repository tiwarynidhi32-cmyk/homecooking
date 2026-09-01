import React, { useState, useEffect } from 'react';
import { 
  Timer, 
  MapPin, 
  CheckCircle, 
  Play, 
  Square, 
  MessageCircle, 
  Bell, 
  Wallet, 
  Phone, 
  Navigation, 
  Clock, 
  DollarSign, 
  AlertCircle,
  FileText,
  Star,
  Download,
  Building,
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  TrendingUp,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  QrCode,
  Copy,
  Share2,
  ExternalLink,
  XCircle,
  Volume2,
  VolumeX,
  BellRing,
  Sparkles
} from 'lucide-react';
import { User, Order, OrderStatus, AppConfig, WithdrawalRequest } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { soundService } from '../services/soundService';
import { CancelBookingModal } from '../components/CancelBookingModal';
import { 
  getChefToCustomerWhatsAppUrl, 
  getGoogleMapsQueryUrl, 
  COMPANY_WHATSAPP_NUMBER, 
  sanitizeWhatsAppPhone 
} from '../utils/whatsappHelper';

export default function ChefPanel({ user, config }: { user: User, config: AppConfig | null }) {
  const [activeTab, setActiveTab] = useState<'missions' | 'wallet' | 'reports'>('missions');
  const [orders, setOrders] = useState<Order[]>([]);
  const [allChefOrders, setAllChefOrders] = useState<Order[]>([]);
  const [isOnline, setIsOnline] = useState(user.isOnline || false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [justAcceptedOrder, setJustAcceptedOrder] = useState<Order | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [otpInput, setOtpInput] = useState('');
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  
  // Sound Notification states
  const [isMuted, setIsMuted] = useState<boolean>(soundService.getIsMuted());
  const [isRinging, setIsRinging] = useState<boolean>(soundService.isRinging());
  
  // Wallet & Withdrawal states
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalLifetimeEarnings, setTotalLifetimeEarnings] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [payoutMethod, setPayoutMethod] = useState<'UPI' | 'BANK'>('UPI');
  const [upiId, setUpiId] = useState(user.bankDetails?.upiId || '');
  const [bankName, setBankName] = useState(user.bankDetails?.bankName || '');
  const [accNumber, setAccNumber] = useState(user.bankDetails?.accountNumber || '');
  const [ifsc, setIfsc] = useState(user.bankDetails?.ifscCode || '');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  // Report filters
  const [reportSearch, setReportSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Function to calculate exact elapsed seconds from startTime timestamp
  const calculateElapsedSeconds = (startTime?: string | Date) => {
    if (!startTime) return 0;
    const startMs = new Date(startTime).getTime();
    if (isNaN(startMs)) return 0;
    return Math.max(0, Math.floor((Date.now() - startMs) / 1000));
  };

  const loadData = async () => {
    await fetchOrders();
    
    const withdrawalsData = await api.getWithdrawals();
    const myWithdrawals = withdrawalsData.filter((w: any) => w.chefId === user.id);
    setWithdrawals(myWithdrawals);
    
    const allOrders = await api.getOrders();
    const myPaidOrders = allOrders.filter((o: Order) => o.chefId === user.id && (o.status === OrderStatus.PAID || o.status === OrderStatus.COMPLETED));
    setAllChefOrders(allOrders.filter((o: Order) => o.chefId === user.id));
    
    const myEarnings = myPaidOrders.reduce((acc: number, o: Order) => acc + (o.commissionChef || 0), 0);
    setTotalLifetimeEarnings(myEarnings);
    
    const withdrawnSum = myWithdrawals
      .filter((w: any) => w.status !== 'REJECTED')
      .reduce((acc: number, w: any) => acc + w.amount, 0);
    setTotalWithdrawn(withdrawnSum);
    
    setWalletBalance(Math.max(0, myEarnings - withdrawnSum));
  };

  useEffect(() => {
    loadData();

    const unsubscribeSound = soundService.subscribe((ringing) => {
      setIsRinging(ringing);
    });

    // Subscribe to reactive real-time order updates across all tabs & events
    const unsubscribeOrders = api.subscribeToOrders((allOrders) => {
      const pendingUnassigned = allOrders.filter((o: Order) => o.status === OrderStatus.PENDING && !o.chefId);
      const myAssignedPending = allOrders.filter((o: Order) => o.chefId === user.id && o.status === OrderStatus.PENDING);

      setOrders(pendingUnassigned);
      setAllChefOrders(allOrders.filter((o: Order) => o.chefId === user.id));
      
      const myActive = allOrders.find((o: Order) => 
        o.chefId === user.id && 
        (o.status === OrderStatus.COOKING || o.status === OrderStatus.PENDING || o.status === OrderStatus.PAYMENT_PENDING)
      );
      setActiveOrder(myActive || null);

      // Audible Alert Logic for Chef:
      // If chef is online and there are bookings waiting (or assigned to chef) and chef is not actively cooking:
      const shouldRing = isOnline && (pendingUnassigned.length > 0 || myAssignedPending.length > 0) && (!myActive || myActive.status === OrderStatus.PENDING);
      if (shouldRing) {
        soundService.startOrderRingtone();
      } else {
        soundService.stopOrderRingtone();
      }

      // Recalculate earnings
      const myPaid = allOrders.filter((o: Order) => o.chefId === user.id && (o.status === OrderStatus.PAID || o.status === OrderStatus.COMPLETED));
      const earnings = myPaid.reduce((acc: number, o: Order) => acc + (o.commissionChef || 0), 0);
      setTotalLifetimeEarnings(earnings);
    });

    const unsubscribeWithdrawals = api.subscribeToWithdrawals((allWithdrawals) => {
      const myW = allWithdrawals.filter((w: any) => w.chefId === user.id);
      setWithdrawals(myW);
      const withdrawnSum = myW
        .filter((w: any) => w.status !== 'REJECTED')
        .reduce((acc: number, w: any) => acc + w.amount, 0);
      setTotalWithdrawn(withdrawnSum);
      setWalletBalance(Math.max(0, totalLifetimeEarnings - withdrawnSum));
    });

    return () => {
      unsubscribeOrders();
      unsubscribeWithdrawals();
      unsubscribeSound();
      soundService.stopOrderRingtone();
    };
  }, [user.id, isOnline, totalLifetimeEarnings]);

  // Robust timer effect: relies purely on start timestamp so switching tabs, phone calls, or refreshes never reset or pause the timer
  useEffect(() => {
    if (activeOrder && activeOrder.status === OrderStatus.COOKING && activeOrder.startTime) {
      setElapsedTime(calculateElapsedSeconds(activeOrder.startTime));

      const interval = setInterval(() => {
        setElapsedTime(calculateElapsedSeconds(activeOrder.startTime));
      }, 1000);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          setElapsedTime(calculateElapsedSeconds(activeOrder.startTime));
        }
      };

      const handleFocus = () => {
        setElapsedTime(calculateElapsedSeconds(activeOrder.startTime));
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
      };
    } else if (activeOrder && activeOrder.durationSeconds) {
      setElapsedTime(activeOrder.durationSeconds);
    } else {
      setElapsedTime(0);
    }
  }, [activeOrder?.status, activeOrder?.startTime, activeOrder?.durationSeconds, activeOrder?.id]);

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders();
      const pendingUnassigned = data.filter((o: Order) => o.status === OrderStatus.PENDING && !o.chefId);
      setOrders(pendingUnassigned);
      const active = data.find((o: Order) => 
        o.chefId === user.id && 
        (o.status === OrderStatus.COOKING || o.status === OrderStatus.PENDING || o.status === OrderStatus.PAYMENT_PENDING)
      );
      setActiveOrder(active || null);

      if (isOnline && pendingUnassigned.length > 0 && (!active || active.status === OrderStatus.PENDING)) {
        soundService.startOrderRingtone();
      }
    } catch (err) {
      console.warn("Failed to fetch orders", err);
    }
  };

  const toggleOnline = async () => {
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);
    if (!nextStatus) {
      soundService.stopOrderRingtone();
    } else {
      if (orders.length > 0) {
        soundService.startOrderRingtone();
      }
    }
    try {
      await api.updateUser(user.id, { isOnline: nextStatus });
    } catch (err) {
      console.warn("Failed to persist online status", err);
    }
  };

  const toggleSoundMute = () => {
    const newMute = soundService.toggleMute();
    setIsMuted(newMute);
  };

  const handleTestRingtone = () => {
    soundService.testRingtone();
  };

  const acceptOrder = async (order: Order) => {
    try {
      const updated = await api.updateOrder(order.id, { 
        chefId: user.id,
        chefName: `${user.name} ${user.surname}`.trim(),
        chefPhone: user.phone || user.whatsapp
      });
      soundService.playAcceptSound();
      setActiveOrder(updated);
      setJustAcceptedOrder(updated);
      const remainingOrders = orders.filter(o => o.id !== order.id);
      setOrders(remainingOrders);
      if (remainingOrders.length === 0) {
        soundService.stopOrderRingtone();
      }
      setActiveTab('missions');
    } catch (err) {
      alert('Failed to accept order');
    }
  };

  const startCooking = async () => {
    if (!activeOrder) return;
    if (otpInput.trim() === activeOrder.otp.trim()) {
      try {
        const now = new Date().toISOString();
        const updated = await api.updateOrder(activeOrder.id, { 
          status: OrderStatus.COOKING, 
          startTime: now,
          ratePerMin: config?.cookingRatePerMin || 3
        });
        setActiveOrder(updated);
        setElapsedTime(0);
        setOtpInput('');
      } catch (err) {
        alert('Failed to start cooking session');
      }
    } else {
      alert('Invalid OTP. Please ask the customer for the correct 4-digit OTP shown in their app.');
    }
  };

  const endCooking = async () => {
    if (!activeOrder) return;
    
    // Calculate total exact duration
    const currentSeconds = calculateElapsedSeconds(activeOrder.startTime);
    const totalMin = Math.max(1, Math.ceil(currentSeconds / 60));
    const rate = activeOrder.ratePerMin || config?.cookingRatePerMin || 3;
    
    // For party orders with fixed total, keep base price if higher or calculate duration price
    let amount = totalMin * rate;
    if (activeOrder.type === 'PARTY' && activeOrder.totalAmount && activeOrder.totalAmount > amount) {
      amount = activeOrder.totalAmount;
    }
    
    // Split commission according to admin configured rates
    const adminPct = typeof config?.adminCommissionPercent === 'number' ? config.adminCommissionPercent : 30;
    const commAdmin = Math.round((amount * adminPct) / 100);
    const commChef = amount - commAdmin;

    try {
      const updated = await api.updateOrder(activeOrder.id, { 
        status: OrderStatus.PAYMENT_PENDING, 
        endTime: new Date().toISOString(),
        durationSeconds: currentSeconds,
        durationMinutes: totalMin,
        totalAmount: amount,
        commissionAdmin: commAdmin,
        commissionChef: commChef
      });
      setActiveOrder(updated);
    } catch (err) {
      alert('Failed to end cooking session');
    }
  };

  const collectCash = async () => {
    if (!activeOrder) return;
    try {
      await api.processPayment(activeOrder.totalAmount || 0, activeOrder.id, undefined, 'CASH');
      alert('Cash payment recorded successfully! Commission credited to your wallet.');
      setActiveOrder(null);
      setElapsedTime(0);
      setOtpInput('');
      loadData();
    } catch (err) {
      alert('Failed to record cash payment');
    }
  };

  const finishSession = async () => {
    setActiveOrder(null);
    setElapsedTime(0);
    setOtpInput('');
    loadData();
  };

  const openInGoogleMaps = (targetOrder?: Order | null) => {
    const ord = targetOrder || activeOrder;
    if (!ord) return;
    const url = getGoogleMapsQueryUrl(ord.address, ord.locationUrl);
    window.open(url, '_blank');
  };

  const callUser = () => {
    const phone = activeOrder?.userPhone || '';
    if (phone) {
      window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
    } else {
      alert('User phone number is not available');
    }
  };

  const shareAddressOnWhatsApp = (targetOrder?: Order | null) => {
    const ord = targetOrder || activeOrder;
    if (!ord) return;
    const url = getChefToCustomerWhatsAppUrl({
      order: ord,
      chefName: `${user.name} ${user.surname}`.trim(),
      chefPhone: user.phone || user.whatsapp
    });
    window.open(url, '_blank');
  };

  const copyAddressToClipboard = (addressText: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(addressText);
      alert('Address copied to clipboard!');
    }
  };

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountToWithdraw = Number(withdrawAmount || walletBalance);
    
    if (isNaN(amountToWithdraw) || amountToWithdraw <= 0) {
      return alert('Please enter a valid withdrawal amount (minimum ₹1)');
    }
    if (amountToWithdraw > walletBalance) {
      return alert(`Requested amount ₹${amountToWithdraw} exceeds available wallet balance ₹${walletBalance}`);
    }

    if (payoutMethod === 'UPI' && !upiId.trim()) {
      return alert('Please enter a valid UPI ID (e.g. mobile@upi)');
    }

    if (payoutMethod === 'BANK' && (!bankName.trim() || !accNumber.trim() || !ifsc.trim())) {
      return alert('Please enter all bank account details (Bank Name, Account No, IFSC)');
    }

    setIsWithdrawing(true);
    try {
      const bankDetailsObj = {
        upiId: upiId.trim(),
        bankName: bankName.trim(),
        accountNumber: accNumber.trim(),
        ifscCode: ifsc.trim()
      };

      // Save bank details to user profile
      await api.updateUser(user.id, { bankDetails: bankDetailsObj });

      await api.createWithdrawal({ 
        chefId: user.id, 
        chefName: `${user.name} ${user.surname}`.trim(),
        amount: amountToWithdraw, 
        status: 'PENDING',
        payoutMethod,
        bankDetails: bankDetailsObj,
        createdAt: new Date().toISOString()
      });

      alert(`₹${amountToWithdraw} Withdrawal Request submitted successfully to Admin! It will be reviewed and processed to your ${payoutMethod === 'UPI' ? 'UPI ID' : 'Bank Account'}.`);
      setWithdrawAmount('');
      loadData();
    } catch (err: any) {
      alert(`Withdrawal request failed: ${err?.message || 'Please try again'}`);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filtered reports
  const completedTransactions = allChefOrders
    .filter(o => o.status === OrderStatus.PAID || o.status === OrderStatus.COMPLETED)
    .filter(o => {
      if (filterType !== 'ALL' && o.type !== filterType) return false;
      if (reportSearch.trim()) {
        const q = reportSearch.toLowerCase();
        const matchId = (o.bookingId || o.id).toLowerCase().includes(q);
        const matchUser = (o.userName || o.userEmail || '').toLowerCase().includes(q);
        const matchAddress = (o.address || '').toLowerCase().includes(q);
        return matchId || matchUser || matchAddress;
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const averageRating = (() => {
    const rated = allChefOrders.filter(o => o.rating && o.rating > 0);
    if (rated.length === 0) return 5.0;
    const sum = rated.reduce((acc, o) => acc + (o.rating || 0), 0);
    return (sum / rated.length).toFixed(1);
  })();

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-16 px-1 md:px-0">
      {/* Post-Acceptance WhatsApp & Route Prompt Modal */}
      <AnimatePresence>
        {justAcceptedOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className="bg-gray-900 text-white rounded-3xl p-6 max-w-md w-full border border-white/10 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                    ✓ Booking Accepted
                  </span>
                  <h3 className="text-xl font-black text-white mt-1">Share Route & Arrival</h3>
                  <p className="text-xs text-gray-300">Share your arrival route with the customer on WhatsApp so they can prepare for your arrival.</p>
                </div>
                <button 
                  onClick={() => setJustAcceptedOrder(null)}
                  className="text-gray-400 hover:text-white text-xs font-bold px-2.5 py-1 bg-white/10 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Customer Delivery Address</p>
                <p className="text-xs font-bold text-gray-200 leading-relaxed">{justAcceptedOrder.address || 'Lucknow, UP'}</p>
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-xs text-gray-300 font-medium">Customer: <strong className="text-white">{justAcceptedOrder.userName || 'Client'}</strong></span>
                  <span className="text-xs text-amber-400 font-mono font-bold">{justAcceptedOrder.userPhone || ''}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    shareAddressOnWhatsApp(justAcceptedOrder);
                    setJustAcceptedOrder(null);
                  }}
                  className="w-full h-12 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-green-500/20 active:scale-95"
                >
                  <MessageCircle size={18} />
                  <span>Send Route on WhatsApp to Customer</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      openInGoogleMaps(justAcceptedOrder);
                    }}
                    className="h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    <Navigation size={14} /> Open Maps
                  </button>
                  <button
                    onClick={() => {
                      copyAddressToClipboard(justAcceptedOrder.address || '');
                    }}
                    className="h-11 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-all active:scale-95"
                  >
                    <Copy size={14} /> Copy Address
                  </button>
                </div>

                <button
                  onClick={() => setJustAcceptedOrder(null)}
                  className="w-full py-2 text-center text-xs font-bold text-gray-400 hover:text-white transition-colors"
                >
                  Continue to Mission Dashboard →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Ringing Notification Alert for Chefs */}
      <AnimatePresence>
        {isRinging && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white p-4 md:p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-white/20 animate-pulse"
          >
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-white text-red-600 flex items-center justify-center font-black flex-shrink-0 shadow-lg animate-bounce">
                <BellRing size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/25 px-2.5 py-0.5 rounded-full">
                    🔊 Audible Ringing Alert Active
                  </span>
                </div>
                <h4 className="text-base md:text-lg font-black tracking-tight mt-0.5">
                  New Booking Request Waiting in Lucknow!
                </h4>
                <p className="text-xs text-white/90 font-medium">
                  Audible sound notification is ringing. Accept now to claim this mission.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('missions');
                  if (orders.length > 0) {
                    acceptOrder(orders[0]);
                  }
                }}
                className="flex-1 sm:flex-initial h-11 px-5 bg-white text-red-700 hover:bg-white/90 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 whitespace-nowrap cursor-pointer"
              >
                Accept 1st Booking
              </button>
              <button
                type="button"
                onClick={() => soundService.stopOrderRingtone()}
                className="h-11 px-4 bg-black/30 hover:bg-black/40 text-white rounded-xl font-bold text-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
              >
                Silence Ringtone
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header & Navigation Tabs */}
      <div className="bg-white p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
               "w-4 h-4 rounded-full flex-shrink-0 transition-all",
               isOnline ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse" : "bg-gray-300"
            )} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg text-gray-900 tracking-tight">
                  Chef {user.name} {user.surname}
                </h2>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                  isOnline ? "bg-green-50 text-green-600 border border-green-200" : "bg-gray-100 text-gray-500"
                )}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                {isOnline ? 'Active & Ready for cooking requests' : 'Switch online to receive new missions'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Sound Notification Control Pill */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/80 p-1 rounded-2xl">
              <button 
                type="button"
                onClick={toggleSoundMute}
                title={isMuted ? "Sound is Muted - Click to Unmute" : "Audible Notification Sound is ON"}
                className={cn(
                  "px-3 py-2 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer",
                  isMuted ? "bg-amber-100 text-amber-900 hover:bg-amber-200" : "bg-emerald-600 text-white hover:bg-emerald-700"
                )}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} className={isRinging ? "animate-bounce" : ""} />}
                <span>{isMuted ? 'Muted' : 'Sound ON'}</span>
              </button>
              <button
                type="button"
                onClick={handleTestRingtone}
                title="Test notification alert ringtone"
                className="px-2.5 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-200 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={12} className="text-amber-500" />
                <span>Test</span>
              </button>
            </div>

            <button 
              onClick={toggleOnline}
              className={cn(
                "px-5 py-2.5 rounded-xl font-black text-xs tracking-wide transition-all text-center shadow-sm active:scale-95 cursor-pointer",
                isOnline ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" : "bg-green-600 text-white hover:bg-green-700 shadow-green-500/20"
              )}
            >
              {isOnline ? 'Go Offline' : 'Go Online Now'}
            </button>
          </div>
        </div>

        {/* Panel View Tabs */}
        <div className="flex border-t border-gray-100 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('missions')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap",
              activeTab === 'missions' ? "bg-red-600 text-white shadow-md shadow-red-500/20" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            )}
          >
            <Clock size={16} /> Live Missions {activeOrder && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap",
              activeTab === 'wallet' ? "bg-red-600 text-white shadow-md shadow-red-500/20" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            )}
          >
            <Wallet size={16} /> Wallet & Withdraw (₹{walletBalance})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap",
              activeTab === 'reports' ? "bg-red-600 text-white shadow-md shadow-red-500/20" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            )}
          >
            <FileText size={16} /> Transaction Reports ({completedTransactions.length})
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: LIVE MISSIONS */}
        {activeTab === 'missions' && (
          <motion.div key="missions-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {activeOrder ? (
              <div className="bg-gray-950 text-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-gray-800 space-y-6 md:space-y-8">
                 {/* Header of Active Order */}
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-6">
                   <div>
                     <div className="flex items-center gap-2 flex-wrap">
                       <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                          {activeOrder.status === OrderStatus.PENDING ? '🚗 On The Way' : 
                           activeOrder.status === OrderStatus.COOKING ? '🍳 Cooking in Progress' : 
                           activeOrder.status === OrderStatus.PAYMENT_PENDING ? '💳 Payment Due' : '✅ Completed'}
                       </span>
                       <span className="text-xs font-mono font-black text-gray-400">#{activeOrder.bookingId || activeOrder.id.slice(-6).toUpperCase()}</span>
                     </div>
                     <h2 className="text-2xl md:text-3xl font-black mt-2 tracking-tight">
                       {activeOrder.type} Cooking Mission
                     </h2>
                     <p className="text-gray-400 font-medium text-xs md:text-sm">
                       Customer: <span className="text-white font-bold">{activeOrder.userName || activeOrder.userEmail || activeOrder.userId}</span>
                     </p>
                   </div>

                   {/* Timer or Total Due */}
                   <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 text-left sm:text-right w-full sm:w-auto">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                        {activeOrder.status === OrderStatus.COOKING ? '⏱️ Live Cooking Time' : 
                         activeOrder.status === OrderStatus.PAYMENT_PENDING || activeOrder.status === OrderStatus.PAID ? '💵 Generated Amount' : '⏳ Awaiting Start OTP'}
                      </div>
                      <div className="text-3xl md:text-4xl font-mono text-red-500 tabular-nums font-black">
                         {activeOrder.status === OrderStatus.COOKING 
                            ? formatTimer(elapsedTime)
                            : (activeOrder.status === OrderStatus.PAYMENT_PENDING || activeOrder.status === OrderStatus.PAID)
                            ? formatCurrency(activeOrder.totalAmount || 0)
                            : '00:00'}
                      </div>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">
                         {activeOrder.status === OrderStatus.COOKING 
                           ? `Rate: Rs. ${activeOrder.ratePerMin || config?.cookingRatePerMin || 3}.00 / min` 
                           : activeOrder.status === OrderStatus.PAYMENT_PENDING 
                           ? `Time Spent: ${activeOrder.durationMinutes || Math.ceil(elapsedTime / 60)} mins`
                           : 'Timer starts after OTP'}
                      </p>
                   </div>
                 </div>

               {/* Customer Location & Contact Details */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
                     <h3 className="text-xs font-black uppercase tracking-widest text-red-400 flex items-center gap-2">
                       <MapPin size={16} /> Destination & Navigation
                     </h3>

                     {/* Full Address */}
                     <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Customer Address</p>
                        <p className="text-sm font-bold text-gray-100 leading-relaxed">{activeOrder.address || 'Address not specified'}</p>
                     </div>

                     {/* Customer Phone & Quick Actions */}
                     <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Customer Phone</p>
                            <p className="text-sm font-black text-white">{activeOrder.userPhone || 'Not provided'}</p>
                          </div>
                          {activeOrder.userPhone && (
                            <button 
                              onClick={callUser}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                            >
                              <Phone size={14} /> Call
                            </button>
                          )}
                        </div>
                     </div>

                     {/* Google Maps & WhatsApp Navigation Buttons */}
                     <div className="space-y-2 pt-1">
                        <button 
                          onClick={() => shareAddressOnWhatsApp(activeOrder)}
                          className="w-full h-12 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl flex items-center justify-center gap-2 font-black text-xs transition-all shadow-lg shadow-green-500/20 active:scale-95 uppercase tracking-wider"
                        >
                          <MessageCircle size={17} /> WhatsApp Route & Address to Customer
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => openInGoogleMaps(activeOrder)}
                            className="h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 font-black text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                          >
                            <Navigation size={15} /> Google Maps
                          </button>
                          <a
                            href={`https://wa.me/${COMPANY_WHATSAPP_NUMBER}?text=${encodeURIComponent(`*Chef Dispatch Update - HC Home Cooking*\nChef: ${user.name} ${user.surname}\nBooking ID: #${activeOrder.bookingId || activeOrder.id}\nCustomer: ${activeOrder.userName}\nAddress: ${activeOrder.address}\nStatus: Accepted and en route.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-11 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-all"
                          >
                            <Share2 size={14} className="text-gray-300" /> WhatsApp Support
                          </a>
                        </div>
                     </div>

                     {/* Selected Menu Items */}
                     <div className="pt-2 border-t border-white/10">
                       <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Items to Cook ({activeOrder.items?.length || 0})</p>
                       <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                          {activeOrder.items?.map((item, idx) => (
                            <div key={idx} className="text-xs text-gray-300 font-medium flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-lg">
                              <span>• {item.name}</span>
                              <span className="text-[10px] text-gray-400 font-bold">{item.category}</span>
                            </div>
                          ))}
                       </div>
                     </div>
                  </div>

                  {/* Session Lifecycle & Verification Controls */}
                  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col justify-between space-y-4">
                     <div>
                       <h3 className="text-xs font-black uppercase tracking-widest text-red-400 mb-4 flex items-center gap-2">
                         <Clock size={16} /> Session Verification & Timer
                       </h3>

                       {/* Status 1: PENDING - Enter OTP */}
                       {activeOrder.status === OrderStatus.PENDING && (
                         <div className="space-y-4 bg-black/40 p-5 rounded-2xl border border-white/5">
                            <div className="flex items-start gap-3 text-yellow-400">
                               <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                               <div>
                                 <h4 className="text-xs font-black uppercase tracking-wider">Step 1: Verify Arrival with OTP</h4>
                                 <p className="text-xs text-gray-300 mt-1">
                                   Ask the user for the 4-digit verification OTP visible on their app screen, then enter it below to start the continuous timer.
                                 </p>
                               </div>
                            </div>

                            <div className="space-y-2 pt-2">
                              <input 
                                type="text" 
                                maxLength={6}
                                placeholder="Enter 4-Digit OTP" 
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value)}
                                className="w-full h-14 bg-white/10 border-2 border-white/20 focus:border-red-500 rounded-xl px-4 text-center text-2xl font-black outline-none tracking-[0.4em] text-white"
                              />
                              <button 
                                onClick={startCooking}
                                className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black flex items-center justify-center gap-2 text-sm shadow-xl shadow-red-600/30 transition-all active:scale-95"
                              >
                                 <Play size={18} fill="currentColor" /> Verify OTP & Start Timer
                              </button>

                              <button
                                type="button"
                                onClick={() => setIsCancelModalOpen(true)}
                                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer mt-2"
                              >
                                <XCircle size={15} /> Decline / Cancel Mission
                              </button>
                            </div>
                         </div>
                       )}

                       {/* Status 2: COOKING - Active Non-Resetting Timer */}
                       {activeOrder.status === OrderStatus.COOKING && (
                         <div className="space-y-4 bg-black/40 p-5 rounded-2xl border border-red-500/30">
                            <div className="flex items-center gap-3 text-green-400">
                               <div className="w-3 h-3 rounded-full bg-green-500 animate-ping" />
                               <div>
                                 <h4 className="text-xs font-black uppercase tracking-wider text-green-400">Cooking Session Active</h4>
                                 <p className="text-xs text-gray-400 mt-0.5">
                                   Timer is running continuously based on start timestamp. Taking calls or switching apps will not pause or reset the timer.
                                 </p>
                               </div>
                            </div>

                            <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Elapsed Session Time</p>
                              <p className="text-3xl font-mono font-black text-white mt-1">{formatTimer(elapsedTime)}</p>
                              <p className="text-xs font-bold text-red-400 mt-1">Approx. {Math.ceil(elapsedTime / 60)} mins • {formatCurrency(Math.ceil(elapsedTime / 60) * (activeOrder.ratePerMin || 3))}</p>
                            </div>

                            <div className="space-y-2">
                              <button 
                                onClick={endCooking} 
                                className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black flex items-center justify-center gap-2 text-sm shadow-xl shadow-red-600/30 transition-all active:scale-95"
                              >
                                 <Square size={18} fill="currentColor" /> Stop Cooking & Generate Final Bill
                              </button>

                              <button
                                type="button"
                                onClick={() => setIsCancelModalOpen(true)}
                                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                              >
                                <XCircle size={15} /> Cancel Mission (Emergency)
                              </button>
                            </div>
                         </div>
                       )}

                       {/* Status 3: PAYMENT_PENDING - Bill Generated */}
                       {activeOrder.status === OrderStatus.PAYMENT_PENDING && (
                         <div className="space-y-4 bg-black/40 p-5 rounded-2xl border border-orange-500/30">
                            <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 text-center space-y-2">
                               <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest">Cooking Finished • Bill Generated</p>
                               <p className="text-3xl font-black text-white">{formatCurrency(activeOrder.totalAmount || 0)}</p>
                               <div className="flex justify-center gap-4 text-xs font-bold text-gray-300">
                                 <span>Time: {activeOrder.durationMinutes || Math.ceil(elapsedTime / 60)} mins</span>
                                 <span>•</span>
                                 <span>Your Share: {formatCurrency(activeOrder.commissionChef || Math.round((activeOrder.totalAmount || 0) * 0.7))}</span>
                               </div>
                               <p className="text-[10px] text-gray-400">User received prompt on their app to pay via PhonePe / UPI, or pay in Cash.</p>
                            </div>

                            {showPaymentQR && (
                              <div className="p-4 bg-white rounded-2xl text-center space-y-3 text-gray-900 animate-in fade-in">
                                <p className="text-xs font-black uppercase tracking-wider text-purple-900">
                                  Customer Scan & Pay with PhonePe / UPI
                                </p>
                                <div className="p-2 bg-white rounded-xl inline-block border-2 border-purple-100 shadow-sm">
                                  <QRCodeSVG 
                                    value={`upi://pay?pa=${config?.upiId || 'hchomecookingservices@gmail.com'}&pn=HC%20Home%20Cooking&am=${activeOrder.totalAmount || 0}&cu=INR&tn=Booking%20${activeOrder.bookingId || activeOrder.id}`} 
                                    size={160} 
                                  />
                                </div>
                                <p className="text-[10px] font-mono text-gray-500 font-bold">UPI: {config?.upiId || 'hchomecookingservices@gmail.com'}</p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                              <button 
                                onClick={() => setShowPaymentQR(!showPaymentQR)}
                                className="h-12 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-black flex items-center justify-center gap-1.5 text-xs transition-all active:scale-95"
                              >
                                 <QrCode size={16} /> {showPaymentQR ? 'Hide QR' : 'Show PhonePe QR'}
                              </button>

                              <button 
                                onClick={async () => {
                                  try {
                                    const orders = await api.getOrders();
                                    const found = orders.find(o => o.id === activeOrder.id);
                                    if (found && found.status === OrderStatus.PAID) {
                                      setActiveOrder(found);
                                      loadData();
                                    } else {
                                      alert('Online payment not yet received from customer. Ask them to pay or collect cash.');
                                    }
                                  } catch (e) {
                                    loadData();
                                  }
                                }}
                                className="h-12 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-black flex items-center justify-center gap-1.5 text-xs transition-all active:scale-95"
                              >
                                 <TrendingUp size={16} /> Check Status
                              </button>
                            </div>

                            <button 
                              onClick={collectCash}
                              className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black flex items-center justify-center gap-2 text-sm shadow-xl shadow-green-600/30 transition-all active:scale-95"
                            >
                               <CheckCircle size={18} /> Collected Cash from Customer
                            </button>
                         </div>
                       )}

                       {/* Status 4: PAID - Completed */}
                       {activeOrder.status === OrderStatus.PAID && (
                         <div className="space-y-4 bg-black/40 p-5 rounded-2xl border border-green-500/30 text-center">
                            <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto">
                              <CheckCircle size={28} />
                            </div>
                            <div>
                              <h4 className="text-lg font-black text-green-400">Payment Received!</h4>
                              <p className="text-xs text-gray-300 mt-1">Total {formatCurrency(activeOrder.totalAmount || 0)} settled successfully.</p>
                              <p className="text-xs font-bold text-white mt-1">Your Commission: +{formatCurrency(activeOrder.commissionChef || 0)} Credited to Wallet</p>
                            </div>
                            <button 
                              onClick={finishSession}
                              className="w-full h-12 bg-white text-black hover:bg-gray-200 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                            >
                              Finish & Return to Mission List
                            </button>
                         </div>
                       )}
                     </div>
                  </div>
               </div>
            </div>
            ) : (
              <div className="space-y-6">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                       <h3 className="font-black text-2xl tracking-tight text-gray-900">Available Bookings in Lucknow</h3>
                       <p className="text-xs text-gray-500 font-medium">New customer requests matching your area</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="bg-red-50 border border-red-100 px-4 py-2 rounded-2xl flex items-center gap-2">
                          <Wallet size={16} className="text-red-600" />
                          <span className="text-xs font-black text-gray-900">Wallet: {formatCurrency(walletBalance)}</span>
                       </div>
                    </div>
                 </div>
                 
                 {orders.length === 0 ? (
                   <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 p-16 text-center space-y-4">
                      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                        <Bell size={28} />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-800 text-lg">No Pending Bookings Waiting</h4>
                        <p className="text-gray-400 text-xs mt-1">Keep your status Online to immediately receive new meal and party booking alerts.</p>
                      </div>
                   </div>
                 ) : (
                   <div className="grid gap-4">
                     {orders.map(order => (
                       <motion.div 
                         layout
                         key={order.id} 
                         className={cn(
                           "bg-white p-5 md:p-6 rounded-3xl border shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 transition-all group",
                           isRinging 
                             ? "border-red-500/80 shadow-lg shadow-red-500/10 ring-2 ring-red-500/20 bg-gradient-to-r from-red-50/40 via-white to-white" 
                             : "border-gray-100 hover:border-red-200 hover:shadow-md"
                         )}
                       >
                          <div className="flex items-start sm:items-center gap-4">
                             <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center font-black text-2xl group-hover:scale-110 transition-transform flex-shrink-0 relative">
                                 {order.type === 'PARTY' ? '🎉' : '🍱'}
                                 {isRinging && (
                                   <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 rounded-full border-2 border-white animate-ping" />
                                 )}
                             </div>
                             <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-0.5 rounded-md">
                                    {order.type} BOOKING
                                  </span>
                                  {isRinging && (
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md animate-pulse flex items-center gap-1">
                                      <Volume2 size={10} /> Audible Alert Ringing
                                    </span>
                                  )}
                                  <span className="text-[10px] font-black text-gray-400">#{order.bookingId || order.id.slice(-6).toUpperCase()}</span>
                                </div>
                                <h4 className="font-bold text-base md:text-lg text-gray-900 leading-tight">
                                  {order.items?.length || 0} Menu Items Selected
                                </h4>
                                <p className="text-xs font-bold text-gray-500 flex items-center gap-1.5 line-clamp-1">
                                   <MapPin size={12} className="text-red-500 flex-shrink-0" /> 
                                   {order.address || 'Lucknow, UP'}
                                </p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                   Rate: Rs. {config?.cookingRatePerMin || 3}/min • {100 - (config?.adminCommissionPercent || 30)}% Chef Share
                                </p>
                             </div>
                          </div>
                          <button 
                            onClick={() => acceptOrder(order)}
                            className="w-full sm:w-auto bg-gray-950 text-white px-8 h-12 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-red-600 transition-all active:scale-95 text-xs uppercase tracking-widest shadow-md flex-shrink-0 cursor-pointer"
                          >
                             Accept Mission
                          </button>
                       </motion.div>
                     ))}
                   </div>
                 )}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: WALLET & WITHDRAWALS */}
        {activeTab === 'wallet' && (
          <motion.div key="wallet-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
             {/* Wallet Overview KPI Cards */}
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-red-600 to-red-700 text-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-xl shadow-red-600/20 space-y-3 relative overflow-hidden">
                   <div className="flex justify-between items-center">
                     <p className="text-xs font-black uppercase tracking-widest text-red-200">Withdrawable Balance</p>
                     <div className="p-2.5 bg-white/10 rounded-2xl">
                        <Wallet size={22} className="text-white" />
                     </div>
                   </div>
                   <h3 className="text-4xl font-black tracking-tight">{formatCurrency(walletBalance)}</h3>
                   <p className="text-[10px] text-red-100 font-bold uppercase tracking-widest">Commission available for instant payout</p>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-sm space-y-3">
                   <div className="flex justify-between items-center">
                     <p className="text-xs font-black uppercase tracking-widest text-gray-400">Total Lifetime Earnings</p>
                     <div className="p-2.5 bg-green-50 rounded-2xl text-green-600">
                        <TrendingUp size={22} />
                     </div>
                   </div>
                   <h3 className="text-4xl font-black text-gray-900 tracking-tight">{formatCurrency(totalLifetimeEarnings)}</h3>
                   <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Gross Chef Share from completed orders</p>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-sm space-y-3">
                   <div className="flex justify-between items-center">
                     <p className="text-xs font-black uppercase tracking-widest text-gray-400">Total Withdrawn</p>
                     <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-600">
                        <ArrowUpRight size={22} />
                     </div>
                   </div>
                   <h3 className="text-4xl font-black text-gray-900 tracking-tight">{formatCurrency(totalWithdrawn)}</h3>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Transferred to Bank / UPI</p>
                </div>
             </div>

             {/* Withdrawal Request Form & Bank Details */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                   <div>
                     <h3 className="text-xl font-black text-gray-900">Request Withdrawal</h3>
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Payout to Bank Account or UPI ID</p>
                   </div>

                   <form onSubmit={handleRequestWithdrawal} className="space-y-4">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Withdrawal Amount (₹)</label>
                         <div className="relative">
                            <input 
                              type="number"
                              min="100"
                              max={walletBalance}
                              placeholder={`Max: ${walletBalance}`}
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              className="w-full h-12 bg-gray-50 border border-gray-200 focus:border-red-500 rounded-2xl px-4 text-base font-black outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setWithdrawAmount(walletBalance.toString())}
                              className="absolute right-2 top-2 h-8 px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[10px] font-black uppercase tracking-wider"
                            >
                              Withdraw All
                            </button>
                         </div>
                         <p className="text-[10px] text-gray-400">Min. ₹100 required per withdrawal request</p>
                      </div>

                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Payout Method</label>
                         <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setPayoutMethod('UPI')}
                              className={cn(
                                "h-11 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
                                payoutMethod === 'UPI' ? "bg-gray-900 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              )}
                            >
                              <CreditCard size={14} /> UPI ID
                            </button>
                            <button
                              type="button"
                              onClick={() => setPayoutMethod('BANK')}
                              className={cn(
                                "h-11 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
                                payoutMethod === 'BANK' ? "bg-gray-900 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              )}
                            >
                              <Building size={14} /> Bank Account
                            </button>
                         </div>
                      </div>

                      {payoutMethod === 'UPI' ? (
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">UPI ID / VPA</label>
                           <input 
                             type="text"
                             placeholder="e.g. mobile@upi or username@okicici"
                             value={upiId}
                             onChange={(e) => setUpiId(e.target.value)}
                             required
                             className="w-full h-12 bg-gray-50 border border-gray-200 focus:border-red-500 rounded-2xl px-4 text-sm font-bold outline-none"
                           />
                        </div>
                      ) : (
                        <div className="space-y-3">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Bank Name</label>
                              <input 
                                type="text"
                                placeholder="e.g. State Bank of India"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                required
                                className="w-full h-12 bg-gray-50 border border-gray-200 focus:border-red-500 rounded-2xl px-4 text-sm font-bold outline-none"
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Account Number</label>
                              <input 
                                type="text"
                                placeholder="Bank Account Number"
                                value={accNumber}
                                onChange={(e) => setAccNumber(e.target.value)}
                                required
                                className="w-full h-12 bg-gray-50 border border-gray-200 focus:border-red-500 rounded-2xl px-4 text-sm font-bold outline-none font-mono"
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">IFSC Code</label>
                              <input 
                                type="text"
                                placeholder="e.g. SBIN0001234"
                                value={ifsc}
                                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                                required
                                className="w-full h-12 bg-gray-50 border border-gray-200 focus:border-red-500 rounded-2xl px-4 text-sm font-bold outline-none font-mono uppercase"
                              />
                           </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isWithdrawing || walletBalance < 100}
                        className="w-full h-14 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/20 transition-all active:scale-95"
                      >
                         {isWithdrawing ? 'Submitting Request...' : 'Submit Withdrawal Request'}
                      </button>
                   </form>
                </div>

                {/* Withdrawal History Table */}
                <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                   <div className="flex justify-between items-center">
                     <div>
                       <h3 className="text-xl font-black text-gray-900">Withdrawal History & Status</h3>
                       <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Tracking your payout requests</p>
                     </div>
                     <span className="text-xs font-black text-gray-500 bg-gray-50 px-3 py-1 rounded-full">{withdrawals.length} Requests</span>
                   </div>

                   {withdrawals.length === 0 ? (
                     <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-3xl space-y-2">
                        <Wallet size={32} className="mx-auto text-gray-300" />
                        <p className="text-sm font-bold text-gray-500">No withdrawal requests yet</p>
                        <p className="text-xs text-gray-400">When you withdraw your commission earnings, the status will show here.</p>
                     </div>
                   ) : (
                     <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto pr-1">
                        {withdrawals.slice().reverse().map((w: any) => (
                           <div key={w.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex items-start gap-3.5">
                                 <div className={cn(
                                   "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5",
                                   w.status === 'APPROVED' ? "bg-green-50 text-green-600" :
                                   w.status === 'REJECTED' ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
                                 )}>
                                    <Receipt size={18} />
                                 </div>
                                 <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                       <span className="text-base font-black text-gray-900">{formatCurrency(w.amount)}</span>
                                       <span className={cn(
                                         "px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md",
                                         w.status === 'APPROVED' ? "bg-green-100 text-green-700" :
                                         w.status === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                                       )}>
                                         {w.status === 'APPROVED' ? 'APPROVED & PAID' : w.status}
                                       </span>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium">
                                       {w.payoutMethod === 'BANK' 
                                         ? `Bank: ${w.bankDetails?.bankName || 'Direct'} (${w.bankDetails?.accountNumber || ''}) • IFSC: ${w.bankDetails?.ifscCode || ''}`
                                         : `UPI: ${w.bankDetails?.upiId || 'N/A'}`}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                       Requested: {new Date(w.createdAt).toLocaleString()}
                                    </p>

                                    {w.status === 'APPROVED' && w.transactionRef && (
                                      <div className="mt-1 p-2 bg-green-50 rounded-xl border border-green-100 text-xs text-green-900">
                                        <p className="font-bold text-[10px] uppercase tracking-wider text-green-700">UTR / Ref: <span className="font-mono font-black">{w.transactionRef}</span></p>
                                        {w.adminNotes && <p className="text-[11px] text-green-800 mt-0.5">{w.adminNotes}</p>}
                                      </div>
                                    )}

                                    {w.status === 'REJECTED' && w.adminNotes && (
                                      <div className="mt-1 p-2 bg-red-50 rounded-xl border border-red-100 text-xs text-red-900">
                                        <p className="font-bold text-[10px] uppercase tracking-wider text-red-700">Reason: {w.adminNotes}</p>
                                      </div>
                                    )}
                                 </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                 {w.status === 'APPROVED' && (
                                   <div>
                                     <span className="text-xs font-bold text-green-600 flex items-center gap-1 sm:justify-end">
                                        <CheckCircle2 size={14} /> Payout Completed
                                     </span>
                                     {w.approvedAt && (
                                       <p className="text-[10px] text-gray-400 mt-0.5">Paid on {new Date(w.approvedAt).toLocaleDateString()}</p>
                                     )}
                                   </div>
                                 )}
                                 {w.status === 'PENDING' && (
                                   <span className="text-xs font-bold text-orange-600 flex items-center gap-1 sm:justify-end">
                                      <Clock size={14} /> Under Admin Approval
                                   </span>
                                 )}
                                 {w.status === 'REJECTED' && (
                                   <span className="text-xs font-bold text-red-600 flex items-center gap-1 sm:justify-end">
                                      <AlertCircle size={14} /> Request Rejected
                                   </span>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                   )}
                </div>
             </div>
          </motion.div>
        )}

        {/* TAB 3: TRANSACTION REPORTS & COMMISSION LEDGER */}
        {activeTab === 'reports' && (
          <motion.div key="reports-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
             {/* Report Header & Quick Financial Summary */}
             <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
                   <div>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight">Per-Transaction Earnings Report</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Detailed commission ledger and customer feedback per order</p>
                   </div>
                   <button
                     onClick={handlePrintReport}
                     className="bg-gray-900 hover:bg-black text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-md active:scale-95"
                   >
                     <Download size={16} /> Print / Export Statement
                   </button>
                </div>

                {/* KPI Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                   <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Completed Sessions</p>
                      <p className="text-2xl font-black text-gray-900">{completedTransactions.length}</p>
                   </div>
                   <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Customer Billed</p>
                      <p className="text-2xl font-black text-gray-900">
                        {formatCurrency(completedTransactions.reduce((acc, o) => acc + (o.totalAmount || 0), 0))}
                      </p>
                   </div>
                   <div className="bg-green-50 p-4 rounded-2xl space-y-1 border border-green-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-green-700">Chef Net Earnings</p>
                      <p className="text-2xl font-black text-green-800">
                        {formatCurrency(completedTransactions.reduce((acc, o) => acc + (o.commissionChef || 0), 0))}
                      </p>
                   </div>
                   <div className="bg-yellow-50 p-4 rounded-2xl space-y-1 border border-yellow-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-yellow-700">Average Chef Rating</p>
                      <p className="text-2xl font-black text-yellow-800 flex items-center gap-1">
                        ⭐ {averageRating} <span className="text-xs text-yellow-600 font-bold">/ 5.0</span>
                      </p>
                   </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                   <div className="relative flex-1">
                      <Search size={16} className="absolute left-4 top-3.5 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Search by Booking ID, customer name, or location..."
                        value={reportSearch}
                        onChange={(e) => setReportSearch(e.target.value)}
                        className="w-full h-11 bg-gray-50 border border-gray-200 focus:border-red-500 rounded-xl pl-10 pr-4 text-xs font-bold outline-none"
                      />
                   </div>
                   <div className="flex items-center gap-2">
                      {['ALL', 'DAILY', 'PARTY', 'CUSTOM'].map(type => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={cn(
                            "px-3.5 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            filterType === type ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                   </div>
                </div>
             </div>

             {/* Detailed Transaction Table */}
             <div className="bg-white rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                   <h4 className="font-black text-xs uppercase tracking-widest text-gray-900">Per-Transaction Commission Breakdown</h4>
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                     Admin Split: {config?.adminCommissionPercent || 30}% • Chef Share: {100 - (config?.adminCommissionPercent || 30)}%
                   </span>
                </div>

                {completedTransactions.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                     <FileText size={36} className="mx-auto text-gray-300" />
                     <h4 className="font-black text-gray-800">No Completed Transactions Found</h4>
                     <p className="text-xs text-gray-400">Complete cooking missions to populate your financial transaction reports.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                              <th className="px-6 py-4">Transaction / Date</th>
                              <th className="px-6 py-4">Customer & Service</th>
                              <th className="px-6 py-4">Time & Rate</th>
                              <th className="px-6 py-4">Total Bill</th>
                              <th className="px-6 py-4">Admin Split</th>
                              <th className="px-6 py-4 text-green-600 font-black">Chef Earned</th>
                              <th className="px-6 py-4">Mode</th>
                              <th className="px-6 py-4">Customer Rating</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {completedTransactions.map(o => (
                              <tr key={o.id} className="text-xs hover:bg-gray-50/60 transition-colors">
                                 <td className="px-6 py-4">
                                    <div className="font-mono font-black text-gray-900">#{o.bookingId || o.id.slice(-6).toUpperCase()}</div>
                                    <div className="text-[10px] text-gray-400 font-bold mt-0.5">
                                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{o.userName || o.userEmail || 'Customer'}</div>
                                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-black uppercase mt-1">
                                      {o.type}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="font-bold text-gray-800">{o.durationMinutes || Math.ceil((o.durationSeconds || 0) / 60) || 1} mins</div>
                                    <div className="text-[10px] text-gray-400 font-bold">@ Rs. {o.ratePerMin || 3}/min</div>
                                 </td>
                                 <td className="px-6 py-4 font-black text-gray-900">
                                    {formatCurrency(o.totalAmount || 0)}
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className="text-red-500 font-bold">
                                      -{formatCurrency(o.commissionAdmin || Math.round((o.totalAmount || 0) * 0.3))}
                                    </span>
                                    <span className="text-[9px] text-gray-400 block">
                                      ({config?.adminCommissionPercent || 30}%)
                                    </span>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className="font-black text-green-700 text-sm bg-green-50 px-2.5 py-1 rounded-xl border border-green-200">
                                      +{formatCurrency(o.commissionChef || Math.round((o.totalAmount || 0) * 0.7))}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[9px] font-black uppercase">
                                      {o.paymentMethod || 'ONLINE'}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4">
                                    {o.rating ? (
                                       <div>
                                          <div className="flex items-center text-yellow-500 font-black text-xs">
                                             {'★'.repeat(o.rating)}
                                             {'☆'.repeat(5 - o.rating)}
                                          </div>
                                          {o.review && (
                                            <p className="text-[10px] text-gray-500 italic max-w-xs truncate mt-0.5">"{o.review}"</p>
                                          )}
                                       </div>
                                    ) : (
                                       <span className="text-[10px] text-gray-400 italic">Pending rating</span>
                                    )}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Mission Modal for Chef */}
      {activeOrder && (
        <CancelBookingModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          order={activeOrder}
          role="CHEF"
          onCancelled={(updated) => {
            setIsCancelModalOpen(false);
            setActiveOrder(null);
            setElapsedTime(0);
            setOtpInput('');
            loadData();
          }}
        />
      )}
    </div>
  );
}
