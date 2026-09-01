import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ChefHat, 
  Calendar, 
  UtensilsCrossed, 
  MapPin, 
  Navigation,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  QrCode,
  Star,
  MessageSquare,
  MessageCircle,
  Send,
  XCircle,
  AlertCircle,
  Plus,
  LocateFixed,
  CreditCard,
  Phone,
  DollarSign,
  Edit3,
  Share2,
  Sparkles
} from 'lucide-react';
import { User, Order, AppConfig, MenuItem, OrderStatus, OrderType, UserAddress } from '../types';
import { formatCurrency, cn, generateOTP } from '../lib/utils';
import { PARTY_CATEGORIES } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import PhonePeCheckoutModal from '../components/PhonePeCheckoutModal';
import { CancelBookingModal } from '../components/CancelBookingModal';
import ActiveChefsWidget from '../components/ActiveChefsWidget';
import { 
  COMPANY_WHATSAPP_NUMBER, 
  getCustomerToChefWhatsAppUrl, 
  getWhatsAppLocationShareUrl,
  getGoogleMapsQueryUrl,
  sanitizeWhatsAppPhone 
} from '../utils/whatsappHelper';

const LUCKNOW_AREAS = [
  'Gomti Nagar',
  'Hazratganj',
  'Alambagh',
  'Indira Nagar',
  'Mahanagar',
  'Ashiyana',
  'Aliganj',
  'Vikas Nagar',
  'Jankipuram',
  'Charbagh',
  'Rajajipuram',
  'Chinhat'
];

export default function UserPanel({ user, config }: { user: User, config: AppConfig | null }) {
  const [activeTab, setActiveTab] = useState<'book' | 'orders' | 'profile'>('book');
  const [orderType, setOrderType] = useState<OrderType>('DAILY');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<MenuItem[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [newAddress, setNewAddress] = useState({ label: '', address: '', location: '' });
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(() => {
    if (user?.addresses && user.addresses.length > 0) return user.addresses[0];
    if (user?.googleLocation) {
      return { id: 'default', label: 'Home', address: user.googleLocation, location: user.googleLocation, googleLocation: user.googleLocation };
    }
    return null;
  });
  const [plateCount, setPlateCount] = useState<number>(10);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [bookingSuccessModal, setBookingSuccessModal] = useState<Order | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<Order | null>(null);

  const pendingPaymentOrders = myOrders.filter(o => o.status === OrderStatus.PAYMENT_PENDING);

  const detectLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation is not supported by your browser');
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setNewAddress(prev => ({ ...prev, location: googleMapsUrl }));
        setDetectingLocation(false);
      },
      (error) => {
        console.error(error);
        alert('Could not detect location. Please enter manually.');
        setDetectingLocation(false);
      }
    );
  };

  useEffect(() => {
    const loadData = async () => {
      const menuData = await api.getMenu();
      setMenu(menuData);
      
      const ordersData = await api.getOrders();
      const currentUserId = user.id || currentUser.id;
      setMyOrders(ordersData.filter((o: Order) => o.userId === currentUserId || o.userEmail === user.email).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      
      const userData = await api.getUsers();
      const u = userData.find((u: any) => u.id === currentUserId || (user.email && u.email === user.email));
      if (u) {
        setCurrentUser(u);
        if (!selectedAddress) {
          if (u.addresses && u.addresses.length > 0) {
            setSelectedAddress(u.addresses[0]);
          } else if (u.googleLocation) {
            setSelectedAddress({ id: 'default', label: 'Home', address: u.googleLocation, location: u.googleLocation, googleLocation: u.googleLocation });
          }
        }
      }
    };
    
    loadData();

    // Subscribe to reactive updates from chef and admin
    const unsubscribe = api.subscribeToOrders((allOrders) => {
      const currentUserId = user.id || currentUser.id;
      setMyOrders(allOrders.filter((o: Order) => o.userId === currentUserId || o.userEmail === user.email).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });

    return () => unsubscribe();
  }, [user.id, user.email]);

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const updated = await api.updateUser(currentUser.id, updates);
      setCurrentUser(updated);
      return updated;
    } catch (err) {
      alert('Failed to update profile');
      return null;
    }
  };

  const handleSaveAddress = async () => {
    if (!newAddress.address.trim()) {
      return alert('Please enter full address details');
    }
    const label = newAddress.label.trim() || 'Home';
    const addr: UserAddress = { 
      id: editingAddressId || Date.now().toString(), 
      label, 
      address: newAddress.address.trim(),
      location: newAddress.location.trim(),
      googleLocation: newAddress.location.trim()
    };
    
    const existingAddresses = currentUser.addresses || [];
    const updatedAddresses = editingAddressId 
      ? existingAddresses.map(a => a.id === editingAddressId ? addr : a)
      : [...existingAddresses, addr];

    const res = await updateProfile({ addresses: updatedAddresses });
    if (res) {
      setSelectedAddress(addr);
      setIsAddingAddress(false);
      setEditingAddressId(null);
      setNewAddress({ label: '', address: '', location: '' });
      setBookingError(null);
    }
  };

  const handleBook = async () => {
    setBookingError(null);
    let activeAddress = selectedAddress;

    // Check if user was typing in the new address input but didn't click save
    if (!activeAddress && newAddress.address.trim()) {
      const label = newAddress.label.trim() || 'Home';
      const addr: UserAddress = {
        id: Date.now().toString(),
        label,
        address: newAddress.address.trim(),
        location: newAddress.location.trim(),
        googleLocation: newAddress.location.trim()
      };
      activeAddress = addr;
      setSelectedAddress(addr);
      const existingAddresses = currentUser.addresses || [];
      updateProfile({ addresses: [...existingAddresses, addr] });
    }

    // Fallback to first saved address on profile
    if (!activeAddress && currentUser.addresses && currentUser.addresses.length > 0) {
      activeAddress = currentUser.addresses[0];
      setSelectedAddress(activeAddress);
    }

    // Fallback to google location on profile
    if (!activeAddress && currentUser.googleLocation) {
      activeAddress = {
        id: 'default',
        label: 'Home',
        address: currentUser.googleLocation,
        location: currentUser.googleLocation,
        googleLocation: currentUser.googleLocation
      };
      setSelectedAddress(activeAddress);
    }

    // If still no address, prompt user and open address input
    if (!activeAddress || !activeAddress.address.trim()) {
      setIsAddingAddress(true);
      setBookingError('Please enter your delivery address in Lucknow below to confirm booking.');
      const addrEl = document.getElementById('address-section');
      if (addrEl) addrEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    let itemsToBook = [...selectedItems];

    if (orderType === 'DAILY') {
      itemsToBook = [{
        id: 'daily_package_' + Date.now(),
        name: 'Daily Veg Cooking Session (Package)',
        price: 0,
        type: 'DAILY',
        category: 'Package'
      }];
    } else if (orderType === 'PARTY') {
      if (itemsToBook.length === 0) {
        setBookingError('Please select at least 1 dish from the Party Menu (Starters, Main Course, Breads, Dessert).');
        const partyEl = document.getElementById('party-menu-section');
        if (partyEl) partyEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    
    setIsBooking(true);
    const resolvedUserId = user.id || currentUser.id || 'user';
    const resolvedUserName = `${currentUser.name || user.name || 'Customer'} ${currentUser.surname || user.surname || ''}`.trim();
    const resolvedUserPhone = currentUser.phone || currentUser.whatsapp || user.phone || user.whatsapp || '';

    const newOrder: Partial<Order> = {
      userId: resolvedUserId,
      userName: resolvedUserName,
      userEmail: currentUser.email || user.email || '',
      userPhone: resolvedUserPhone,
      type: orderType,
      items: itemsToBook,
      status: OrderStatus.PENDING,
      otp: generateOTP(),
      address: activeAddress.address,
      locationUrl: activeAddress.googleLocation || activeAddress.location || '',
      plateCount: orderType === 'PARTY' ? (plateCount || 10) : 1,
      totalAmount: orderType === 'PARTY' ? (555 * (plateCount || 10)) : itemsToBook.reduce((acc, curr) => acc + (curr.price || 0), 0)
    };

    try {
      const saved = await api.createOrder(newOrder);
      setMyOrders(prev => [saved, ...prev.filter(o => o.id !== saved.id)]);
      setBookingSuccessModal(saved);
      setSelectedItems([]);
      setBookingError(null);
      setIsAddingAddress(false);
      setActiveTab('orders');
    } catch (err: any) {
      console.error("Booking failed", err);
      const errMsg = err?.message || 'Failed to place order. Please try again.';
      setBookingError(errMsg);
      alert(errMsg);
    } finally {
      setIsBooking(false);
    }
  };

  const toggleItem = (item: MenuItem) => {
    setSelectedItems(prev => 
      prev.find(i => i.id === item.id) 
        ? prev.filter(i => i.id !== item.id) 
        : [...prev, item]
    );
    if (bookingError) setBookingError(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-10 pb-20 px-1 md:px-0">
      {/* Booking Success Dialog */}
      <AnimatePresence>
        {bookingSuccessModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white max-w-md w-full rounded-[2.5rem] p-8 text-center space-y-4 shadow-2xl border border-gray-100">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-2xl font-black text-gray-900">Booking Confirmed!</h3>
              <p className="text-xs font-bold text-gray-500">
                Booking ID <span className="text-red-600 font-black">#{bookingSuccessModal.bookingId || bookingSuccessModal.id}</span> has been dispatched to available chefs.
              </p>
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-left space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Cooking Start OTP</span>
                  <span className="text-xl font-mono font-black text-red-600 tracking-widest">{bookingSuccessModal.otp}</span>
                </div>
                <p className="text-[9px] font-bold text-gray-500">Provide this 4-digit OTP to the chef when they arrive to start the cooking timer.</p>
              </div>

              {/* Share Location to Company WhatsApp */}
              <a
                href={getWhatsAppLocationShareUrl({
                  bookingId: bookingSuccessModal.bookingId || bookingSuccessModal.id.slice(-6).toUpperCase(),
                  customerName: `${currentUser.name} ${currentUser.surname}`.trim(),
                  customerPhone: currentUser.phone || currentUser.whatsapp,
                  address: bookingSuccessModal.address,
                  locationUrl: bookingSuccessModal.locationUrl,
                  companyPhone: config?.contactPhone
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <MessageCircle size={16} />
                Share Location on WhatsApp (+91 85438 98295)
              </a>

              <button 
                onClick={() => setBookingSuccessModal(null)}
                className="w-full h-12 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-black transition-all"
              >
                View in My Bookings
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pending Payment Alert Banner if any order is due */}
      {pendingPaymentOrders.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#5f259f] via-[#7b1fa2] to-[#4a148c] text-white p-5 md:p-6 rounded-3xl shadow-xl border border-purple-400/30 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-2xl text-[#5f259f] shadow-md flex-shrink-0">
              पे
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-yellow-400 text-yellow-950 font-black text-[10px] uppercase tracking-widest rounded-full animate-pulse">
                  Payment Due
                </span>
                <span className="text-xs text-white/80 font-mono">#{pendingPaymentOrders[0].bookingId || pendingPaymentOrders[0].id.slice(-6).toUpperCase()}</span>
              </div>
              <h4 className="text-lg md:text-xl font-black mt-1">Cooking Session Complete — Bill {formatCurrency(pendingPaymentOrders[0].totalAmount || 0)}</h4>
              <p className="text-white/80 text-xs font-medium">Chef has stopped the cooking timer. Please complete payment via PhonePe.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedPaymentOrder(pendingPaymentOrders[0])}
              className="w-full sm:w-auto px-6 py-3.5 bg-white text-[#5f259f] hover:bg-gray-100 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <CreditCard size={16} /> Pay via PhonePe
            </button>
          </div>
        </motion.div>
      )}

      {/* Header Promo */}
      <section className="bg-gradient-to-br from-gray-900 to-black rounded-3xl md:rounded-[3rem] p-6 md:p-10 text-white relative overflow-hidden shadow-2xl">
         <div className="relative z-10 max-w-lg">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="px-3 py-1 bg-red-600 text-[10px] font-black uppercase tracking-widest rounded-full">Elite Indian Service</span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter mt-4 leading-tight">Authentic Taste, <br/>Cooked in Your Kitchen.</h2>
              <p className="text-gray-400 mt-4 md:mt-6 text-sm md:text-lg font-medium leading-relaxed">Book a professional chef for daily meals or special party celebrations. Only Rs. 3 per minute.</p>
              <button 
                onClick={() => setActiveTab('book')}
                className="mt-6 md:mt-8 bg-white text-black px-6 md:px-10 h-12 md:h-16 rounded-2xl font-bold flex items-center gap-3 hover:scale-105 transition-all shadow-xl text-xs md:text-base"
              >
                Start Booking <ArrowRight size={20} />
              </button>
            </motion.div>
         </div>
         <div className="absolute right-0 top-0 h-full w-1/2 bg-[url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center brightness-75 hide-on-mobile opacity-50" />
      </section>

      {/* Registered User Profile Info Bar */}
      <div className="bg-white rounded-3xl p-4 md:p-5 border border-red-100/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-red-600/20 flex-shrink-0">
            {currentUser.name?.slice(0, 1) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-gray-900 text-sm md:text-base">
                {currentUser.name} {currentUser.surname}
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase rounded-full flex items-center gap-1">
                <CheckCircle2 size={11} /> Registered User
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
              <span>Code: <strong className="text-red-600 font-mono">#{currentUser.customerCode || currentUser.id.slice(-6).toUpperCase()}</strong></span>
              <span>•</span>
              <span>Phone: <strong className="text-gray-800">{currentUser.phone || currentUser.whatsapp || 'Registered'}</strong></span>
              <span>•</span>
              <span className="text-gray-400">📍 Lucknow Resident</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <ActiveChefsWidget variant="compact" />
        </div>
      </div>

      {/* Main Nav */}
      <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-none">
         {[
           { id: 'book', label: 'Book Chef', icon: <ChefHat size={18} /> },
           { id: 'orders', label: 'My Bookings', icon: <Calendar size={18} /> },
           { id: 'profile', label: 'Profile & Address', icon: <Users size={18} /> }
         ].map((t) => (
           <button
             key={t.id}
             onClick={() => setActiveTab(t.id as any)}
             className={cn(
               "px-4 md:px-8 py-4 md:py-5 font-bold text-xs md:text-sm tracking-tight flex items-center gap-2 transition-all relative font-black uppercase tracking-widest flex-shrink-0",
               activeTab === t.id ? "text-red-600" : "text-gray-400 hover:text-gray-600"
             )}
           >
             {t.icon} {t.label}
             {activeTab === t.id && (
               <motion.div layoutId="user-tab" className="absolute bottom-0 left-0 w-full h-1 bg-red-600" />
             )}
           </button>
         ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'book' ? (
          <motion.div key="book-tab" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 md:space-y-8">
             {/* Live Active Chefs Banner */}
             <ActiveChefsWidget />

             <div className="flex flex-col md:flex-row gap-4">
                <button 
                  onClick={() => { setOrderType('DAILY'); setSelectedItems([]); }}
                  className={cn(
                    "flex-1 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] border-2 transition-all text-left group",
                    orderType === 'DAILY' ? "border-emerald-600 bg-emerald-50/60 shadow-lg shadow-emerald-600/10" : "border-gray-100 bg-white hover:border-emerald-200"
                  )}
                >
                   <div className={cn("w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-4 transition-all", orderType === 'DAILY' ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100")}>
                      <Clock size={24} />
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">100% Pure Veg</span>
                   </div>
                   <h3 className="text-lg md:text-xl font-black text-gray-900 mt-1">Daily Home Meals</h3>
                   <p className="text-xs md:text-sm font-medium text-gray-500 mt-1.5">Home cooked veg meals for daily needs. ₹3 per minute.</p>
                </button>
                <button 
                  onClick={() => { setOrderType('PARTY'); setSelectedItems([]); }}
                  className={cn(
                    "flex-1 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] border-2 transition-all text-left group",
                    orderType === 'PARTY' ? "border-red-600 bg-red-50/60 shadow-lg shadow-red-600/10" : "border-gray-100 bg-white hover:border-red-200"
                  )}
                >
                   <div className={cn("w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-4 transition-all", orderType === 'PARTY' ? "bg-red-600 text-white" : "bg-red-50 text-red-600 group-hover:bg-red-100")}>
                      <TrendingUp size={24} />
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-red-500" />
                     <span className="text-[10px] font-black uppercase tracking-wider text-red-700">Grand Feast</span>
                   </div>
                   <h3 className="text-lg md:text-xl font-black text-gray-900 mt-1">Party Special Menu</h3>
                   <p className="text-xs md:text-sm font-medium text-gray-500 mt-1.5">Starters + Main Course + Dessert • ₹555 Per Plate</p>
                   {orderType === 'PARTY' && (
                     <div className="mt-4 p-4 bg-white rounded-2xl border border-red-200 flex items-center justify-between shadow-sm">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Plates (Min 10)</span>
                        <div className="flex items-center gap-3">
                           <button 
                             onClick={(e) => { e.stopPropagation(); setPlateCount(Math.max(10, plateCount - 1)); }}
                             className="w-8 h-8 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center font-black transition-colors"
                           >-</button>
                           <span className="text-base md:text-lg font-black w-8 text-center text-gray-900">{plateCount}</span>
                           <button 
                             onClick={(e) => { e.stopPropagation(); setPlateCount(plateCount + 1); }}
                             className="w-8 h-8 rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center justify-center font-black transition-colors"
                           >+</button>
                        </div>
                     </div>
                   )}
                   <p className="text-[9px] font-bold text-red-700 mt-4 leading-relaxed uppercase tracking-widest italic bg-red-100/70 p-3 rounded-xl border border-red-200/80">
                      50% advance payment is required at the time of booking, and the full payment must be cleared one day before the event.
                   </p>
                </button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                    {/* Daily Vegetable List Image Reference */}
                    {orderType === 'DAILY' && config?.dailyVegImageUrl && (
                      <div className="bg-white p-4 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-emerald-100 shadow-sm mb-6 md:mb-8">
                        <div className="flex items-center justify-between mb-4 gap-2">
                            <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-emerald-700 italic truncate flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Chef's Daily Vegetable Reference
                            </h4>
                            <a href={config.dailyVegImageUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 text-[10px] font-black uppercase tracking-widest hover:underline flex-shrink-0">Full Image</a>
                        </div>
                        <div className="w-full h-48 md:h-80 rounded-2xl md:rounded-[2.5rem] overflow-hidden border-2 md:border-4 border-emerald-50 shadow-xl">
                            <img src={config.dailyVegImageUrl} className="w-full h-full object-contain bg-gray-50" alt="Daily Veg Reference" />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                       <h3 className="text-xl md:text-2xl font-black tracking-tight">{orderType === 'DAILY' ? 'Session Package' : 'Select Menu'}</h3>
                       <div className="flex gap-1 flex-shrink-0">
                          <span className={cn(
                            "px-2.5 md:px-3.5 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider",
                            orderType === 'PARTY' ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          )}>
                             {orderType === 'PARTY' ? `${selectedItems.length} Selected` : 'Unlimited Daily Choice'}
                          </span>
                       </div>
                    </div>

                   {orderType === 'PARTY' ? (
                     <div className="space-y-6 md:space-y-10">
                        {config?.partyMenuImageUrl && (
                          <div className="bg-white p-4 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-red-100 shadow-sm mt-4 md:mt-8 mb-6 md:mb-8 group">
                            <div className="flex items-center justify-between mb-4 gap-2">
                                <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-red-700 italic truncate flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-red-500" /> Reference Party Menu
                                </h4>
                                <a href={config.partyMenuImageUrl} target="_blank" rel="noopener noreferrer" className="text-red-600 text-[10px] font-black uppercase tracking-widest hover:underline flex-shrink-0">Full Image</a>
                            </div>
                            <div className="w-full h-48 md:h-80 rounded-2xl md:rounded-[2.5rem] overflow-hidden border-2 md:border-4 border-red-50 shadow-xl">
                                <img src={config.partyMenuImageUrl} className="w-full h-full object-contain bg-gray-50" alt="Party Menu Reference" />
                            </div>
                          </div>
                        )}
                        
                        {/* Render Party Menu by categories */}
                        {PARTY_CATEGORIES.map(cat => {
                          const categoryItems = menu.filter(m => m.type === 'PARTY' && m.category === cat.name);
                          if (categoryItems.length === 0) return null;
                          return (
                            <div key={cat.name} className="space-y-4">
                               <div className="flex justify-between items-end">
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-red-600 flex items-center gap-2">
                                     <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> {cat.name}
                                  </h4>
                                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Select Items</span>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {categoryItems.map(item => {
                                     const isSelected = selectedItems.some(i => i.id === item.id);
                                     
                                     return (
                                        <button 
                                          key={item.id}
                                          type="button"
                                          onClick={() => toggleItem(item)}
                                          className={cn(
                                            "p-5 rounded-3xl border-2 text-left transition-all relative overflow-hidden",
                                            isSelected ? "border-red-600 bg-red-50/50 shadow-sm" : "border-gray-50 bg-[#FBFBFB] hover:border-red-200"
                                          )}
                                        >
                                           <div className="text-sm font-bold text-gray-900">{item.name}</div>
                                           <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">{item.category}</div>
                                           {isSelected && (
                                             <div className="absolute right-0 top-0 bg-red-600 text-white p-2 rounded-bl-2xl">
                                                <CheckCircle2 size={16} />
                                             </div>
                                           )}
                                        </button>
                                     );
                                  })}
                               </div>
                            </div>
                          );
                        })}

                        {/* Any additional party items not strictly in standard category */}
                        {menu.filter(m => m.type === 'PARTY' && !PARTY_CATEGORIES.some(c => c.name === m.category)).length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-red-600">Other Specials</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {menu.filter(m => m.type === 'PARTY' && !PARTY_CATEGORIES.some(c => c.name === m.category)).map(item => {
                                const isSelected = selectedItems.some(i => i.id === item.id);
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => toggleItem(item)}
                                    className={cn(
                                      "p-5 rounded-3xl border-2 text-left transition-all relative overflow-hidden",
                                      isSelected ? "border-red-600 bg-red-50/50 shadow-sm" : "border-gray-50 bg-[#FBFBFB] hover:border-red-200"
                                    )}
                                  >
                                    <div className="text-sm font-bold text-gray-900">{item.name}</div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">{item.category}</div>
                                    {isSelected && (
                                      <div className="absolute right-0 top-0 bg-red-600 text-white p-2 rounded-bl-2xl">
                                        <CheckCircle2 size={16} />
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                     </div>
                   ) : (
                     <div className="p-10 bg-emerald-50/80 rounded-[2.5rem] border border-emerald-200 flex flex-col items-center text-center space-y-4 shadow-sm">
                        <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-600/20">
                           <CheckCircle2 size={32} />
                        </div>
                        <h4 className="text-2xl font-black text-gray-900">Daily Package Activated</h4>
                        <p className="text-sm font-medium text-emerald-900/80 max-w-sm">No individual item selection required. Our certified Lucknow chef will prepare healthy, delicious home-cooked meals for you at ₹3 per minute.</p>
                     </div>
                   )}
                </div>

                <div className="lg:col-span-1 space-y-6">
                   <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white sticky top-10 shadow-2xl shadow-red-100">
                      <h3 className="text-xl font-black mb-2">Order Summary</h3>
                      {selectedAddress && (
                        <div className="flex items-center gap-2 mb-6">
                          <MapPin size={12} className="text-red-500 flex-shrink-0" />
                          <span className="text-[10px] font-bold text-gray-400 line-clamp-1">Delivering to: {selectedAddress.label} • {currentUser.phone || currentUser.whatsapp}</span>
                        </div>
                      )}
                      
                      <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                         {selectedItems.length === 0 && orderType !== 'DAILY' ? (
                           <div className="space-y-2">
                             <p className="text-gray-500 text-xs italic font-medium">Select dishes from the menu</p>
                           </div>
                         ) : orderType === 'DAILY' ? (
                           <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-1">Standard Package</p>
                              <p className="text-xs font-bold text-white">Daily Veg Cooking Session (Package)</p>
                              <p className="text-[10px] text-gray-400 mt-1">₹3 / Minute Live Cooking</p>
                           </div>
                         ) : (
                           selectedItems.map(item => (
                             <div key={item.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                                <div className="flex flex-col">
                                   <span className="text-xs font-bold leading-tight">{item.name}</span>
                                   <span className="text-[9px] text-gray-400">{item.category}</span>
                                </div>
                                <span className="text-[10px] font-black text-purple-400">
                                   Included
                                </span>
                             </div>
                           ))
                         )}
                      </div>

                      {/* Pick Delivery Address Section */}
                      <div id="address-section" className="space-y-4 py-6 border-y border-white/10">
                         <div className="space-y-2">
                             <div className="flex justify-between items-center">
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pick Delivery Address</h4>
                               <button 
                                 type="button"
                                 onClick={() => { setIsAddingAddress(true); setEditingAddressId(null); setNewAddress({ label: 'Home', address: '', location: '' }); }}
                                 className="text-red-400 hover:text-red-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                               >
                                 <Plus size={12} /> Add New
                               </button>
                             </div>

                             {isAddingAddress && (
                               <div className="p-4 bg-white/10 rounded-2xl border border-white/20 space-y-3">
                                 <div className="flex gap-2">
                                   <input 
                                     placeholder="Label (e.g. Home, Office)"
                                     className="w-1/2 h-10 bg-white/10 border border-white/20 rounded-xl px-3 text-xs font-bold text-white placeholder-gray-400 outline-none"
                                     value={newAddress.label}
                                     onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}
                                   />
                                   <button 
                                     type="button" 
                                     onClick={detectLocation}
                                     className="w-1/2 h-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-2 text-[10px] font-bold text-gray-200 flex items-center justify-center gap-1"
                                   >
                                     <LocateFixed size={12} className={detectingLocation ? "text-red-400 animate-pulse" : ""} />
                                     <span>Auto GPS</span>
                                   </button>
                                 </div>

                                 <div className="space-y-1.5">
                                   <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">Quick Area Selector (Lucknow):</span>
                                   <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                     {LUCKNOW_AREAS.map(area => (
                                       <button
                                         key={area}
                                         type="button"
                                         onClick={() => {
                                           const current = newAddress.address.trim();
                                           if (!current.includes(area)) {
                                             const updated = current ? `${current}, ${area}, Lucknow` : `${area}, Lucknow`;
                                             setNewAddress({ ...newAddress, address: updated });
                                           }
                                         }}
                                         className="text-[10px] bg-white/10 hover:bg-red-600/60 border border-white/15 px-2 py-0.5 rounded-lg text-gray-200 hover:text-white font-bold transition-all"
                                       >
                                         + {area}
                                       </button>
                                     ))}
                                   </div>
                                 </div>

                                 <textarea 
                                   placeholder="Enter full delivery address in Lucknow (Flat No, Street, Landmark, Area)..."
                                   rows={2}
                                   className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white placeholder-gray-400 outline-none resize-none leading-relaxed"
                                   value={newAddress.address}
                                   onChange={e => setNewAddress({ ...newAddress, address: e.target.value })}
                                 />
                                 <div className="flex gap-2">
                                   <button 
                                     type="button" 
                                     onClick={handleSaveAddress}
                                     className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                   >
                                     Save & Select
                                   </button>
                                   <button 
                                     type="button" 
                                     onClick={() => setIsAddingAddress(false)}
                                     className="px-3 h-9 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl text-[10px] font-bold"
                                   >
                                     Cancel
                                   </button>
                                 </div>
                               </div>
                             )}

                             <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {currentUser.addresses?.map(addr => (
                                   <button 
                                      key={addr.id}
                                      type="button"
                                      onClick={() => { setSelectedAddress(addr); setBookingError(null); }}
                                      className={cn(
                                        "w-full p-3.5 rounded-2xl text-left text-[11px] font-bold border-2 transition-all block",
                                        selectedAddress?.id === addr.id ? "border-red-500 bg-red-500/10 text-white" : "border-white/5 bg-white/5 text-gray-400 hover:border-white/20"
                                      )}
                                   >
                                      <div className="flex justify-between items-center">
                                         <span className="font-black text-xs text-white">{addr.label}</span>
                                         {selectedAddress?.id === addr.id && <CheckCircle2 size={14} className="text-red-500" />}
                                      </div>
                                      <p className="text-[10px] text-gray-400 font-medium line-clamp-1 mt-0.5">{addr.address}</p>
                                   </button>
                                ))}
                                {(!currentUser.addresses || currentUser.addresses.length === 0) && !isAddingAddress && (
                                   <button 
                                     type="button"
                                     onClick={() => { setIsAddingAddress(true); setNewAddress({ label: 'Home', address: '', location: '' }); }}
                                     className="w-full p-4 border border-dashed border-red-500/50 bg-red-500/10 rounded-2xl text-center text-red-400 text-xs font-black uppercase tracking-wider hover:bg-red-500/20"
                                   >
                                     + Enter Delivery Address
                                   </button>
                                )}
                             </div>

                             {selectedAddress && (
                               <a
                                 href={getWhatsAppLocationShareUrl({
                                   customerName: `${currentUser.name} ${currentUser.surname}`.trim(),
                                   customerPhone: currentUser.phone || currentUser.whatsapp,
                                   address: selectedAddress.address,
                                   locationUrl: selectedAddress.googleLocation || selectedAddress.location,
                                   companyPhone: config?.contactPhone
                                 })}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="w-full py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 rounded-xl text-[10px] font-black uppercase text-emerald-400 flex items-center justify-center gap-1.5 transition-all mt-2"
                                 title="Share selected address directly to HC Home Cooking WhatsApp"
                               >
                                 <MessageCircle size={14} className="text-emerald-400" />
                                 <span>Share Location to WhatsApp (+91 85438 98295)</span>
                                </a>
                             )}
                         </div>
                      </div>

                      {bookingError && (
                        <div className="p-3.5 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-300 text-xs font-bold leading-relaxed flex items-start gap-2 animate-shake">
                          <span className="text-red-400 font-black">!</span>
                          <span>{bookingError}</span>
                        </div>
                      )}

                      <div className="mt-8 space-y-6">
                         <div className="flex justify-between items-end">
                            <span className="text-xs font-black uppercase text-gray-400 tracking-widest">Total Amount</span>
                            <span className="text-3xl font-black text-red-600">
                               {orderType === 'PARTY' ? formatCurrency(555 * plateCount) : '₹3 / min'}
                            </span>
                         </div>
                         <button 
                           type="button"
                           onClick={handleBook}
                           disabled={isBooking}
                           className="w-full h-16 bg-[#E31E24] text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-red-500/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                         >
                            {isBooking ? 'Processing Booking...' : 'Confirm Booking'}
                         </button>
                      </div>
                   </div>
                </div>
             </div>

             {/* Mobile Sticky Booking Bar */}
             <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-gray-900/95 backdrop-blur-md border-t border-white/10 z-40 flex items-center justify-between gap-4 shadow-2xl">
                <div>
                  <span className="text-[9px] font-black uppercase text-gray-400 block tracking-widest">
                    {orderType === 'PARTY' ? `${selectedItems.length} Dishes • ${plateCount} Plates` : 'Daily Cooking'}
                  </span>
                  <span className="text-lg font-black text-white">
                    {orderType === 'PARTY' ? formatCurrency(555 * plateCount) : '₹3 / min'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleBook}
                  disabled={isBooking}
                  className="px-6 h-12 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
                >
                  {isBooking ? 'Booking...' : 'Book Now'}
                  <ArrowRight size={14} />
                </button>
             </div>
          </motion.div>
        ) : activeTab === 'orders' ? (
          <motion.div key="orders-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
             {myOrders.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 space-y-4">
                 <Clock size={48} className="mx-auto text-gray-200" />
                 <p className="font-bold text-gray-400">You haven't made any bookings yet.</p>
                 <button 
                   onClick={() => setActiveTab('book')}
                   className="px-6 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all"
                 >
                   Book Your First Chef
                 </button>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myOrders.map(order => (
                    <div key={order.id}>
                      <OrderCard 
                        order={order} 
                        config={config} 
                        onPayPhonePe={(ord) => setSelectedPaymentOrder(ord)} 
                        onCancelClick={(ord) => setCancellingOrder(ord)}
                      />
                    </div>
                  ))}
               </div>
             )}
          </motion.div>
        ) : (
          <motion.div key="profile-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 space-y-6">
                   <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
                      <div className="w-24 h-24 bg-red-50 rounded-full mx-auto flex items-center justify-center text-red-600 mb-4">
                         <Users size={40} />
                      </div>
                      <h3 className="text-xl font-black">{currentUser.name} {currentUser.surname}</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Code: {currentUser.customerCode || 'CUST-LKO'}</p>
                   </div>

                   <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Contact Details</h4>
                      <div className="space-y-3">
                         <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
                            <Phone size={16} className="text-red-600" />
                            <div className="flex-1">
                               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phone</p>
                               <p className="text-sm font-bold text-gray-700">{currentUser.phone || currentUser.whatsapp || 'Not set'}</p>
                            </div>
                         </div>
                         <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
                            <UtensilsCrossed size={16} className="text-red-600" />
                            <div className="flex-1">
                               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">WhatsApp</p>
                               <p className="text-sm font-bold text-gray-700">{currentUser.whatsapp || currentUser.phone || 'Not set'}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                   <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                         <h3 className="text-2xl font-black tracking-tight">Saved Addresses</h3>
                         <button 
                           onClick={() => { setIsAddingAddress(true); setEditingAddressId(null); setNewAddress({ label: 'Home', address: '', location: '' }); }}
                           className="px-6 h-12 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1.5"
                         >
                           <Plus size={14} /> Add New Address
                         </button>
                      </div>

                      {isAddingAddress && (
                        <div className="mb-10 p-8 bg-gray-50 rounded-3xl space-y-4 border border-gray-100">
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <input 
                                placeholder="Label (Home, Office, Villa, etc.)"
                                className="h-12 bg-white rounded-xl px-4 text-sm font-bold outline-red-500 border border-gray-200"
                                value={newAddress.label}
                                onChange={e => setNewAddress({...newAddress, label: e.target.value})}
                              />
                              <div className="relative group">
                                <input 
                                  placeholder="Google Maps Location URL (Optional)"
                                  className="w-full h-12 bg-white rounded-xl pl-4 pr-10 text-sm font-bold outline-red-500 border border-gray-200"
                                  value={newAddress.location}
                                  onChange={e => setNewAddress({...newAddress, location: e.target.value})}
                                />
                                <button 
                                  type="button"
                                  onClick={detectLocation}
                                  className={cn(
                                    "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors",
                                    detectingLocation ? "text-red-600 animate-pulse" : "text-gray-400 hover:text-red-600"
                                  )}
                                  title="Detect Current Location"
                                >
                                  <LocateFixed size={16} />
                                </button>
                              </div>
                           </div>
                           <textarea 
                              placeholder="Full Delivery Address in Lucknow (Flat, Building, Landmark, Area, Pincode)..."
                              className="w-full p-4 bg-white rounded-xl text-sm font-bold h-28 outline-red-600 border border-gray-200 resize-none"
                              value={newAddress.address}
                              onChange={e => setNewAddress({...newAddress, address: e.target.value})}
                           />
                           <div className="flex gap-2">
                              <button 
                                type="button"
                                onClick={handleSaveAddress}
                                className="flex-1 h-12 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-black"
                              >
                                {editingAddressId ? 'Update Address' : 'Save Address'}
                              </button>
                              <button 
                                type="button" 
                                onClick={() => { setIsAddingAddress(false); setEditingAddressId(null); }} 
                                className="px-6 h-12 text-gray-400 font-bold hover:text-gray-600"
                              >
                                Cancel
                              </button>
                           </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {(!currentUser.addresses || currentUser.addresses.length === 0) && (
                           <p className="text-gray-400 font-medium italic col-span-2 text-center py-10 border-2 border-dashed border-gray-100 rounded-3xl">No addresses saved yet. Click Add New Address above.</p>
                         )}
                         {currentUser.addresses?.map(addr => (
                           <div key={addr.id} className="p-6 rounded-[2rem] border-2 border-gray-50 bg-[#F9F8F7] space-y-3 relative group">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2 text-red-600">
                                    <MapPin size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{addr.label}</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <a
                                      href={getWhatsAppLocationShareUrl({
                                        customerName: `${currentUser.name} ${currentUser.surname}`.trim(),
                                        customerPhone: currentUser.phone || currentUser.whatsapp,
                                        address: addr.address,
                                        locationUrl: addr.googleLocation || addr.location,
                                        companyPhone: config?.contactPhone
                                      })}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                                      title="Share address to Company WhatsApp"
                                    >
                                      <MessageCircle size={12} /> WhatsApp
                                    </a>
                                    <button 
                                      onClick={() => {
                                        setEditingAddressId(addr.id);
                                        setNewAddress({ label: addr.label, address: addr.address, location: addr.location || '' });
                                        setIsAddingAddress(true);
                                      }}
                                      className="text-[10px] font-black uppercase text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1"
                                    >
                                      <Edit3 size={12} /> Edit
                                    </button>
                                 </div>
                              </div>
                              <p className="text-xs font-bold text-gray-600 leading-relaxed">{addr.address}</p>
                              {(addr.googleLocation || addr.location) && (
                                <a href={addr.googleLocation || addr.location} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-500 hover:underline block">View on Map</a>
                              )}
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PhonePe Checkout Gateway Modal */}
      {selectedPaymentOrder && (
        <PhonePeCheckoutModal
          order={selectedPaymentOrder}
          isOpen={!!selectedPaymentOrder}
          onClose={() => setSelectedPaymentOrder(null)}
          onPaymentSuccess={(updated) => {
            setSelectedPaymentOrder(null);
            api.getOrders().then(ords => {
              setMyOrders(ords.filter(o => o.userId === user.id || o.userEmail === user.email));
            });
          }}
          upiId={config?.upiId}
        />
      )}

      {/* Cancel Booking Confirmation Modal */}
      {cancellingOrder && (
        <CancelBookingModal
          isOpen={!!cancellingOrder}
          onClose={() => setCancellingOrder(null)}
          order={cancellingOrder}
          role="USER"
          onCancelled={(updated) => {
            setCancellingOrder(null);
            setMyOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
          }}
        />
      )}
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  config: AppConfig | null;
  onPayPhonePe?: (order: Order) => void;
  onCancelClick?: (order: Order) => void;
}

function OrderCard({ order, config, onPayPhonePe, onCancelClick }: OrderCardProps) {
  const [showQR, setShowQR] = useState(false);
  const [rating, setRating] = useState(order.rating || 0);
  const [review, setReview] = useState(order.review || '');
  const [isPaying, setIsPaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editedAddress, setEditedAddress] = useState(order.address || '');
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);

  // Live timer tick for active cooking session or 1-minute cancellation window
  useEffect(() => {
    if (order.status === OrderStatus.COOKING || order.status === OrderStatus.PENDING) {
      const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
      return () => clearInterval(timer);
    }
  }, [order.status]);

  const elapsedSecs = order.startTime ? Math.max(0, Math.floor((currentTime - new Date(order.startTime).getTime()) / 1000)) : 0;
  const elapsedMins = Math.floor(elapsedSecs / 60);
  const elapsedSecRemaining = elapsedSecs % 60;
  const liveTimerString = `${elapsedMins.toString().padStart(2, '0')}:${elapsedSecRemaining.toString().padStart(2, '0')}`;

  // Time elapsed since booking creation
  const createdTimestamp = new Date(order.createdAt).getTime();
  const orderElapsedSeconds = Math.max(0, Math.floor((currentTime - createdTimestamp) / 1000));
  const isWithinFreeWindow = orderElapsedSeconds <= 60;
  const freeSecondsRemaining = Math.max(0, 60 - orderElapsedSeconds);

  const handlePhonePePay = async () => {
    if (onPayPhonePe) {
      onPayPhonePe(order);
    } else {
      setIsPaying(true);
      try {
        await api.processPayment(order.totalAmount || 0, order.id, undefined, 'PHONEPE');
        alert('Payment recorded successfully via PhonePe! Thank you.');
      } catch (err) {
        alert('Failed to process payment');
      } finally {
        setIsPaying(false);
      }
    }
  };

  const handleCashPay = async () => {
    setIsPaying(true);
    try {
      await api.processPayment(order.totalAmount || 0, order.id, undefined, 'CASH');
      alert('Cash payment confirmed! Thank you.');
    } catch (err) {
      alert('Failed to confirm cash payment');
    } finally {
      setIsPaying(false);
    }
  };

  const handleSaveUpdatedAddress = async () => {
    if (!editedAddress.trim()) return alert('Please enter an address');
    setIsUpdatingAddress(true);
    try {
      await api.updateOrder(order.id, { address: editedAddress.trim() });
      order.address = editedAddress.trim();
      setIsEditingAddress(false);
      alert('Delivery address updated successfully!');
    } catch (err) {
      alert('Failed to update address');
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  const submitReview = async () => {
    if (rating === 0) return alert('Please select a star rating');
    try {
      await api.updateOrder(order.id, { rating, review });
      alert('Thank you for your review!');
    } catch (err) {
      alert('Failed to submit review');
    }
  };

  const isChefAccepted = Boolean(order.chefName || order.status === OrderStatus.COOKING);
  const isCancelled = order.status === OrderStatus.CANCELLED;

  return (
    <div className={`bg-white rounded-3xl md:rounded-[2.5rem] border shadow-sm p-6 md:p-8 space-y-6 ${
      isCancelled ? 'border-red-200 bg-red-50/20' : 'border-gray-100'
    }`}>
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Booking #{order.bookingId || order.id.slice(-6).toUpperCase()}</span>
          <h4 className="text-xl font-black text-gray-900 mt-1">{order.type === 'PARTY' ? 'Party Special Booking' : 'Daily Meal Session'}</h4>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <span className={cn(
          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
          order.status === OrderStatus.PAID ? "bg-green-100 text-green-700" :
          order.status === OrderStatus.COMPLETED ? "bg-blue-100 text-blue-700" :
          order.status === OrderStatus.COOKING ? "bg-red-100 text-red-700 animate-pulse" :
          order.status === OrderStatus.PAYMENT_PENDING ? "bg-orange-100 text-orange-700" :
          order.status === OrderStatus.CANCELLED ? "bg-rose-100 text-rose-800" :
          "bg-gray-100 text-gray-700"
        )}>
          {order.status}
        </span>
      </div>

      {/* CANCELLED ORDER SPECIAL BANNER */}
      {isCancelled && (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-800">
              <XCircle size={20} className="text-rose-600" />
              <span className="text-xs font-black uppercase tracking-wider">
                Booking Cancelled {order.cancelledBy ? `by ${order.cancelledBy}` : ''}
              </span>
            </div>
            {order.cancelledAt && (
              <span className="text-[10px] font-bold text-gray-500">
                {new Date(order.cancelledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {order.cancellationReason && (
            <p className="text-xs text-rose-950 font-medium italic bg-white/70 p-2.5 rounded-xl border border-rose-100">
              "{order.cancellationReason}"
            </p>
          )}

          {/* Cancellation Penalty Breakdown */}
          {order.cancellationPenalty && order.cancellationPenalty > 0 ? (
            <div className="pt-2 border-t border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-800">Cancellation Penalty</span>
                <p className="text-xl font-black text-rose-700">₹{order.cancellationPenalty}.00</p>
                <p className="text-[10px] text-gray-500 font-medium">Applied for cancellation after 1-minute window</p>
              </div>

              {order.paymentStatus === 'PAID' ? (
                <span className="px-3.5 py-2 bg-green-100 text-green-700 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 size={15} /> Penalty Paid
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handlePhonePePay}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#5f259f] to-[#7b1fa2] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span className="w-4 h-4 rounded bg-white/20 flex items-center justify-center text-[9px]">पे</span>
                  <span>Pay ₹{order.cancellationPenalty} with PhonePe</span>
                </button>
              )}
            </div>
          ) : (
            <div className="pt-2 border-t border-rose-200/60">
              <span className="text-[11px] font-black text-emerald-700">
                {order.cancelledBy === 'CHEF' ? '✓ Cancelled by Chef • ₹0 Free (No penalty charged)' : '✓ Free Cancellation within 1-min grace period (₹0 Penalty)'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Chef Accepted & Assigned Notification Banner */}
      {isChefAccepted && !isCancelled && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                <ChefHat size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">🎉 Booking Accepted by Chef</p>
                <p className="text-xs font-black text-gray-900">{order.chefName}</p>
                <p className="text-[10px] text-gray-500 font-medium">{order.chefPhone || 'Professional HC Chef'}</p>
              </div>
            </div>
            {order.chefPhone && (
              <a 
                href={`tel:${order.chefPhone}`} 
                className="p-2.5 bg-white rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-sm"
                title="Call Chef"
              >
                <Phone size={16} />
              </a>
            )}
          </div>

          <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap gap-2">
            <a
              href={getCustomerToChefWhatsAppUrl({
                order,
                chefPhone: order.chefPhone,
                companyPhone: config?.contactPhone
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[200px] h-10 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <MessageCircle size={15} />
              <span>Share Address to Chef on WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {/* Live Cooking Status / OTP Banner */}
      {order.status === OrderStatus.PENDING && !isCancelled && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Chef Arrival OTP</p>
            <p className="text-xs font-bold text-gray-600">Give this OTP to chef upon arrival:</p>
          </div>
          <span className="text-2xl font-mono font-black text-amber-800 tracking-widest">{order.otp}</span>
        </div>
      )}

      {order.status === OrderStatus.COOKING && !isCancelled && (
        <div className="p-4 bg-red-50 rounded-2xl border border-red-200 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-red-600">🍳 Cooking Live</p>
            <p className="text-xs font-bold text-gray-600">Rate: ₹{order.ratePerMin || 3}/min</p>
          </div>
          <span className="text-2xl font-mono font-black text-red-600 tracking-widest animate-pulse">{liveTimerString}</span>
        </div>
      )}

      {/* Address & WhatsApp Location Sharing */}
      <div className="space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2 text-xs font-medium text-gray-700 flex-1">
            <MapPin size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{order.address}</span>
          </div>
          {!isCancelled && (
            <button 
              type="button"
              onClick={() => setIsEditingAddress(!isEditingAddress)}
              className="text-[10px] font-bold text-red-600 hover:text-red-700 underline flex-shrink-0 ml-2"
            >
              {isEditingAddress ? 'Cancel' : 'Edit / Add Landmark'}
            </button>
          )}
        </div>

        {isEditingAddress && !isCancelled && (
          <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
            <textarea
              rows={2}
              value={editedAddress}
              onChange={e => setEditedAddress(e.target.value)}
              placeholder="Update flat/house, landmark or area..."
              className="w-full text-xs font-bold text-gray-800 p-2.5 bg-gray-50 rounded-lg border border-gray-200 outline-none resize-none"
            />
            <button
              type="button"
              disabled={isUpdatingAddress}
              onClick={handleSaveUpdatedAddress}
              className="w-full py-2 bg-gray-950 hover:bg-black text-white text-[10px] font-black uppercase rounded-lg"
            >
              {isUpdatingAddress ? 'Saving...' : 'Save & Update Location'}
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-200/60">
          <a
            href={getWhatsAppLocationShareUrl({
              bookingId: order.bookingId || order.id.slice(-6).toUpperCase(),
              customerName: order.userName || 'Valued Customer',
              customerPhone: order.userPhone || '',
              address: order.address,
              locationUrl: order.locationUrl,
              companyPhone: config?.contactPhone
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider shadow-sm transition-all"
            title="Share this booking's location to company WhatsApp"
          >
            <MessageCircle size={13} />
            <span>Share to Company WhatsApp (+91 85438 98295)</span>
          </a>

          {order.locationUrl && (
            <a
              href={order.locationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-[10px] font-bold transition-all"
            >
              <Navigation size={12} className="text-blue-500" />
              <span>View Map</span>
            </a>
          )}
        </div>
      </div>

      {/* Items list */}
      {order.items && order.items.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Items / Package</p>
          <div className="flex flex-wrap gap-1.5">
            {order.items.map((it, idx) => (
              <span key={idx} className="px-2.5 py-1 bg-gray-50 text-gray-700 rounded-lg text-xs font-bold">
                {it.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Total Amount & Payment Options */}
      {!isCancelled && (
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Amount</p>
              <p className="text-2xl font-black text-gray-900">
                {order.totalAmount ? formatCurrency(order.totalAmount) : (order.status === OrderStatus.COOKING ? 'Calculating...' : '₹0')}
              </p>
            </div>

            {order.status === OrderStatus.COOKING && (
              <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                Timer Active
              </span>
            )}
          </div>

          {order.status === OrderStatus.PAYMENT_PENDING && (
            <div className="space-y-2 pt-2">
              <button
                onClick={handlePhonePePay}
                className="w-full h-12 bg-gradient-to-r from-[#5f259f] to-[#7b1fa2] hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <span className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center text-[10px]">पे</span>
                <span>Pay {formatCurrency(order.totalAmount || 0)} with PhonePe</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="h-10 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                >
                  <QrCode size={14} /> Scan UPI QR
                </button>
                <button
                  onClick={handleCashPay}
                  disabled={isPaying}
                  className="h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                >
                  Pay Cash
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* UPI QR Modal / Inset */}
      {showQR && (
        <div className="p-6 bg-gray-50 rounded-2xl text-center space-y-4 border border-gray-200">
          <p className="text-xs font-black uppercase tracking-wider text-gray-700">Scan UPI QR to Pay {formatCurrency(order.totalAmount || 0)}</p>
          <div className="w-48 h-48 bg-white p-3 rounded-2xl mx-auto border shadow-sm flex items-center justify-center">
            <QRCodeSVG 
              value={`upi://pay?pa=${config?.upiId || 'hchomecookingservices@gmail.com'}&pn=HC%20Home%20Cooking&am=${order.totalAmount || 0}&cu=INR&tn=Booking%20${order.bookingId || order.id}`} 
              size={170} 
            />
          </div>
          <p className="text-[10px] text-gray-500 font-mono">UPI ID: {config?.upiId || 'hc@upi'}</p>
          <button 
            onClick={handlePhonePePay}
            disabled={isPaying}
            className="w-full h-11 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-green-700"
          >
            {isPaying ? 'Confirming...' : 'I have completed the payment'}
          </button>
        </div>
      )}

      {/* USER CANCELLATION BUTTON FOR ACTIVE / PENDING BOOKINGS */}
      {(order.status === OrderStatus.PENDING || order.status === OrderStatus.COOKING) && !isCancelled && (
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-left">
            {isWithinFreeWindow ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  <Clock size={11} /> Free Cancellation ({freeSecondsRemaining}s left)
                </span>
                <span className="text-[10px] text-emerald-700 font-bold hidden sm:inline">₹0 penalty</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                  <AlertCircle size={11} /> ₹100 Cancellation Fee (After 1 min)
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onCancelClick && onCancelClick(order)}
            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 border border-red-200/60"
          >
            <XCircle size={15} /> Cancel Booking
          </button>
        </div>
      )}

      {/* Review Section if Completed/Paid */}
      {(order.status === OrderStatus.PAID || order.status === OrderStatus.COMPLETED) && (
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rate your experience</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((st) => (
              <button key={st} onClick={() => setRating(st)} className={cn("p-1.5 transition-colors", rating >= st ? "text-amber-400" : "text-gray-200")}>
                <Star size={20} fill={rating >= st ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          {rating > 0 && !order.review && (
            <div className="flex gap-2">
              <input 
                placeholder="Write a quick review..."
                value={review}
                onChange={e => setReview(e.target.value)}
                className="flex-1 h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs font-medium outline-none"
              />
              <button onClick={submitReview} className="px-4 bg-red-600 text-white rounded-xl text-xs font-bold">Submit</button>
            </div>
          )}
          {order.review && <p className="text-xs italic text-gray-500">"{order.review}"</p>}
        </div>
      )}
    </div>
  );
}
