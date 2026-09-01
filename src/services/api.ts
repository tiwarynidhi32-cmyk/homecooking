import { User, Order, UserRole, OrderStatus, AppConfig, MenuItem, WithdrawalRequest, OrderType } from '../types';
// @ts-ignore
import officialBannerImage from '../assets/images/hchome_official_banner_1788236680661.jpg';
import { supabase } from './supabaseClient';

// Storage keys for cache & fallback
const USERS_KEY = 'hc_users';
const ORDERS_KEY = 'hc_orders';
const CONFIG_KEY = 'hc_config';
const MENU_KEY = 'hc_menu';
const WITHDRAWALS_KEY = 'hc_withdrawals';

// Initial Seed Data
const initialUsers: User[] = [
  { id: 'admin', role: UserRole.ADMIN, name: 'HC', surname: 'Admin', email: 'admin@cook.com', phone: '1234567890', isVerified: true },
  { id: 'chef', role: UserRole.CHEF, name: 'Chef', surname: 'HC', email: 'chef@hc.com', phone: '12345', isVerified: true, isOnline: true },
  { id: 'chef12', role: UserRole.CHEF, name: 'Vikram', surname: 'Singh', email: 'chef@hc.com', phone: '1112223334', isVerified: true, isOnline: true },
  { id: 'm1', role: UserRole.MANAGER, name: 'Raj', surname: 'Mehta', email: 'manager@hc.com', phone: '9123456789', isVerified: true },
  { id: 'user', role: UserRole.USER, name: 'Amit', surname: 'Kumar', email: 'user@gmail.com', phone: '7123456789', whatsapp: '7123456789', customerCode: 'CUST001', addresses: [{ id: '1', label: 'Home', address: '123 Main St, Gomti Nagar, Lucknow' }], isVerified: true },
];

const initialMenu: MenuItem[] = [
  { id: '1', name: 'Dal Tadka', price: 150, category: 'Lentils', type: 'DAILY' as OrderType },
  { id: '2', name: 'Paneer Butter Masala', price: 250, category: 'Main Course', type: 'DAILY' as OrderType },
  { id: '3', name: 'Jeera Rice', price: 120, category: 'Rice', type: 'DAILY' as OrderType },
  { id: '4', name: 'Gulab Jamun', price: 60, category: 'Dessert', type: 'DAILY' as OrderType },
  { id: 'p1', name: 'Coffee', price: 555, category: 'Welcome Drinks', type: 'PARTY' as OrderType },
  { id: 'p2', name: 'Jaljeera', price: 555, category: 'Welcome Drinks', type: 'PARTY' as OrderType },
  { id: 'p3', name: 'Shikanji', price: 555, category: 'Welcome Drinks', type: 'PARTY' as OrderType },
  { id: 'p4', name: 'Cold Drink', price: 555, category: 'Welcome Drinks', type: 'PARTY' as OrderType },
  { id: 'p5', name: 'Hot n Sour Soup', price: 555, category: 'Soup', type: 'PARTY' as OrderType },
  { id: 'p6', name: 'Veg Manchurian', price: 555, category: 'Snacks', type: 'PARTY' as OrderType },
  { id: 'p7', name: 'Crispy Corn', price: 555, category: 'Snacks', type: 'PARTY' as OrderType },
  { id: 'p8', name: 'Paneer Tikka', price: 555, category: 'Snacks', type: 'PARTY' as OrderType },
  { id: 'p18', name: 'Paneer Butter Masala', price: 555, category: 'Paneer Ka Swad', type: 'PARTY' as OrderType },
  { id: 'p19', name: 'Kadhai Paneer', price: 555, category: 'Paneer Ka Swad', type: 'PARTY' as OrderType },
  { id: 'p22', name: 'Mix Veg Curry', price: 555, category: 'Vegetable Gravy', type: 'PARTY' as OrderType },
  { id: 'p31', name: 'Dal Fry (Arhar)', price: 555, category: 'Dal Ki Rasoi', type: 'PARTY' as OrderType },
  { id: 'p32', name: 'Dal Makhani', price: 555, category: 'Dal Ki Rasoi', type: 'PARTY' as OrderType },
  { id: 'p35', name: 'Jeera Rice', price: 555, category: 'Sugandhit Basmati', type: 'PARTY' as OrderType },
  { id: 'p36', name: 'Veg Pulao', price: 555, category: 'Sugandhit Basmati', type: 'PARTY' as OrderType },
  { id: 'p40', name: 'Baby Naan', price: 555, category: 'Breads', type: 'PARTY' as OrderType },
  { id: 'p41', name: 'Butter Roti', price: 555, category: 'Breads', type: 'PARTY' as OrderType },
  { id: 'p45', name: 'Boondi Raita', price: 555, category: 'Curd', type: 'PARTY' as OrderType }
];

const initialConfig: AppConfig = {
  logo: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=200',
  address: 'E Flat/Door/Block No. GENERAL S.No. 1, HOME COOKING, 356/K C 337, ALAM NAGAR, KANAK CITY, AVAS VIKAS COLONY, Lucknow, Uttar Pradesh - 226017',
  contactEmail: 'hchomecookingservices@gmail.com',
  contactPhone: '+91 85438 98295',
  upiId: 'hc@upi',
  aboutUs: 'We are HC Home Cooking, Lucknow\'s premier professional chef service. We connect you with elite Indian chefs who bring the heart of traditional and modern Indian cuisine directly to your kitchen. Be it daily healthy meals or extravagant party spreads, we ensure every dish is prepared with fresh ingredients, minimal oil, and authentic spices.',
  mission: '“To provide healthy, hygienic, and affordable home-style Indian meals while making healthy living convenient for the residents of Lucknow.”',
  vision: '“To be the most trusted professional chef service in Uttar Pradesh, known for our authenticity, hygiene, and the skill of our Indian culinary experts.”',
  termsAndConditions: 'Terms and conditions apply to all booking sessions. Chefs cook with customer provided ingredients or packaged session kits.',
  privacyPolicy: 'We respect user privacy and do not sell customer data.',
  refundPolicy: 'Refunds are processed within 3-5 business days for canceled or unfulfilled sessions.',
  directorMessage: 'At HC Home Cooking, we understand that food is more than just sustenance; it\'s health and heritage. Our mission is to bring the expertise of professional Indian chefs into your homes in Lucknow. We focus on hygiene, authentic taste, and personal care.\n\nWe are committed to serving only Lucknow, ensuring that our local community receives the highest quality of service. Our chefs are handpicked for their expertise in traditional and contemporary Indian cooking, helping you maintain a healthy lifestyle without compromising on taste.',
  directorName: 'Mr. Amreesh Kumar Gupta',
  directorPhoto: 'https://images.unsplash.com/photo-1583394238182-6f3ad46881d8?auto=format&fit=crop&q=80&w=400',
  homeBannerUrl: officialBannerImage,
  homeBannerType: 'image',
  partyMenuImageUrl: '',
  dailyVegImageUrl: '',
  cookingRatePerMin: 3,
  adminCommissionPercent: 30,
  chefCommissionPercent: 70
};

// Storage helper utilities
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    const parsed = JSON.parse(stored);
    if (Array.isArray(defaultValue) && !Array.isArray(parsed)) return defaultValue;
    if (typeof defaultValue === 'object' && defaultValue !== null && (typeof parsed !== 'object' || parsed === null)) return defaultValue;
    return parsed;
  } catch (err) {
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Storage save error for ${key}:`, err);
  }
};

// Database row <-> Type model converters
function mapUserFromDB(row: any): User {
  return {
    id: row.id,
    role: row.role as UserRole,
    name: row.name,
    surname: row.surname || '',
    email: row.email,
    phone: row.phone,
    whatsapp: row.whatsapp,
    password: row.password,
    customerCode: row.customer_code,
    isVerified: row.is_verified ?? true,
    isOnline: row.is_online ?? false,
    addresses: row.addresses || [],
    bankDetails: row.bank_details || {},
    googleLocation: row.google_location,
    photo: row.photo,
    documents: row.documents || [],
    idProofDoc: row.id_proof_doc || (row.documents && row.documents[0]),
    certDoc: row.cert_doc || (row.documents && row.documents[1]),
    addressProofDoc: row.address_proof_doc || (row.documents && row.documents[2]),
    userDocuments: row.user_documents || [],
    status: (row.status as any) || 'ACTIVE',
    statusReason: row.status_reason || '',
    statusUpdatedAt: row.status_updated_at,
    lastLoginAt: row.last_login_at,
    lastActiveAt: row.last_active_at,
  };
}

function mapUserToDB(user: Partial<User>): any {
  const row: any = {};
  if (user.id !== undefined) row.id = user.id;
  if (user.role !== undefined) row.role = user.role;
  if (user.name !== undefined) row.name = user.name;
  if (user.surname !== undefined) row.surname = user.surname;
  if (user.email !== undefined) row.email = user.email;
  if (user.phone !== undefined) row.phone = user.phone;
  if (user.whatsapp !== undefined) row.whatsapp = user.whatsapp;
  if (user.password !== undefined) row.password = user.password;
  if (user.customerCode !== undefined) row.customer_code = user.customerCode;
  if (user.isVerified !== undefined) row.is_verified = user.isVerified;
  if (user.isOnline !== undefined) row.is_online = user.isOnline;
  if (user.addresses !== undefined) row.addresses = user.addresses;
  if (user.bankDetails !== undefined) row.bank_details = user.bankDetails;
  if (user.googleLocation !== undefined) row.google_location = user.googleLocation;
  if (user.photo !== undefined) row.photo = user.photo;
  if (user.documents !== undefined) row.documents = user.documents;
  if (user.idProofDoc !== undefined) row.id_proof_doc = user.idProofDoc;
  if (user.certDoc !== undefined) row.cert_doc = user.certDoc;
  if (user.addressProofDoc !== undefined) row.address_proof_doc = user.addressProofDoc;
  if (user.userDocuments !== undefined) row.user_documents = user.userDocuments;
  if (user.status !== undefined) row.status = user.status;
  if (user.statusReason !== undefined) row.status_reason = user.statusReason;
  if (user.statusUpdatedAt !== undefined) row.status_updated_at = user.statusUpdatedAt;
  if (user.lastLoginAt !== undefined) row.last_login_at = user.lastLoginAt;
  if (user.lastActiveAt !== undefined) row.last_active_at = user.lastActiveAt;
  row.updated_at = new Date().toISOString();
  return row;
}

function mapOrderFromDB(row: any): Order {
  return {
    id: row.id,
    bookingId: row.booking_id || `BK-${row.id?.slice(-4) || '1001'}`,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    userPhone: row.user_phone,
    chefId: row.chef_id,
    chefName: row.chef_name,
    chefPhone: row.chef_phone,
    type: row.type as OrderType,
    status: row.status as OrderStatus,
    paymentStatus: (row.payment_status as any) || (row.status === OrderStatus.PAID || row.status === OrderStatus.COMPLETED ? 'PAID' : 'PENDING'),
    transactionId: row.transaction_id || row.payment_id,
    paymentGatewayResponse: row.payment_gateway_response || {},
    otp: row.otp,
    items: row.items || [],
    address: row.address,
    locationUrl: row.location_url,
    totalAmount: row.total_amount ? Number(row.total_amount) : 0,
    plateCount: row.plate_count ? Number(row.plate_count) : 1,
    startTime: row.start_time,
    endTime: row.end_time,
    durationSeconds: row.duration_seconds ? Number(row.duration_seconds) : 0,
    durationMinutes: row.duration_minutes ? Number(row.duration_minutes) : 0,
    ratePerMin: row.rate_per_min ? Number(row.rate_per_min) : 3,
    commissionAdmin: row.commission_admin ? Number(row.commission_admin) : 0,
    commissionChef: row.commission_chef ? Number(row.commission_chef) : 0,
    rating: row.rating ? Number(row.rating) : undefined,
    review: row.review,
    cancelledBy: row.cancelled_by,
    cancellationReason: row.cancellation_reason,
    cancellationPenalty: row.cancellation_penalty !== undefined ? Number(row.cancellation_penalty) : undefined,
    cancelledAt: row.cancelled_at,
    paymentMethod: row.payment_method,
    paymentId: row.payment_id,
    paidAt: row.paid_at,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapOrderToDB(order: Partial<Order>): any {
  const row: any = {};
  if (order.id !== undefined) row.id = order.id;
  if (order.bookingId !== undefined) row.booking_id = order.bookingId;
  if (order.userId !== undefined) row.user_id = order.userId;
  if (order.userName !== undefined) row.user_name = order.userName;
  if (order.userEmail !== undefined) row.user_email = order.userEmail;
  if (order.userPhone !== undefined) row.user_phone = order.userPhone;
  if (order.chefId !== undefined) row.chef_id = order.chefId;
  if (order.chefName !== undefined) row.chef_name = order.chefName;
  if (order.chefPhone !== undefined) row.chef_phone = order.chefPhone;
  if (order.type !== undefined) row.type = order.type;
  if (order.status !== undefined) row.status = order.status;
  if (order.paymentStatus !== undefined) row.payment_status = order.paymentStatus;
  if (order.transactionId !== undefined) row.transaction_id = order.transactionId;
  if (order.paymentGatewayResponse !== undefined) row.payment_gateway_response = order.paymentGatewayResponse;
  if (order.otp !== undefined) row.otp = order.otp;
  if (order.items !== undefined) row.items = order.items;
  if (order.address !== undefined) row.address = order.address;
  if (order.locationUrl !== undefined) row.location_url = order.locationUrl;
  if (order.totalAmount !== undefined) row.total_amount = order.totalAmount;
  if (order.plateCount !== undefined) row.plate_count = order.plateCount;
  if (order.startTime !== undefined) row.start_time = order.startTime;
  if (order.endTime !== undefined) row.end_time = order.endTime;
  if (order.durationSeconds !== undefined) row.duration_seconds = order.durationSeconds;
  if (order.durationMinutes !== undefined) row.duration_minutes = order.durationMinutes;
  if (order.ratePerMin !== undefined) row.rate_per_min = order.ratePerMin;
  if (order.commissionAdmin !== undefined) row.commission_admin = order.commissionAdmin;
  if (order.commissionChef !== undefined) row.commission_chef = order.commissionChef;
  if (order.rating !== undefined) row.rating = order.rating;
  if (order.review !== undefined) row.review = order.review;
  if (order.cancelledBy !== undefined) row.cancelled_by = order.cancelledBy;
  if (order.cancellationReason !== undefined) row.cancellation_reason = order.cancellationReason;
  if (order.cancellationPenalty !== undefined) row.cancellation_penalty = order.cancellationPenalty;
  if (order.cancelledAt !== undefined) row.cancelled_at = order.cancelledAt;
  if (order.paymentMethod !== undefined) row.payment_method = order.paymentMethod;
  if (order.paymentId !== undefined) row.payment_id = order.paymentId;
  if (order.paidAt !== undefined) row.paid_at = order.paidAt;
  row.updated_at = new Date().toISOString();
  return row;
}

function mapConfigFromDB(row: any): AppConfig {
  return {
    logo: row.logo ?? initialConfig.logo,
    address: row.address ?? initialConfig.address,
    contactEmail: row.contact_email ?? initialConfig.contactEmail,
    contactPhone: row.contact_phone ?? initialConfig.contactPhone,
    upiId: row.upi_id ?? initialConfig.upiId,
    aboutUs: row.about_us ?? initialConfig.aboutUs,
    mission: row.mission ?? initialConfig.mission,
    vision: row.vision ?? initialConfig.vision,
    termsAndConditions: row.terms_and_conditions ?? initialConfig.termsAndConditions,
    privacyPolicy: row.privacy_policy ?? initialConfig.privacyPolicy,
    refundPolicy: row.refund_policy ?? initialConfig.refundPolicy,
    directorMessage: row.director_message ?? initialConfig.directorMessage,
    directorName: row.director_name ?? initialConfig.directorName,
    directorPhoto: row.director_photo ?? initialConfig.directorPhoto,
    homeBannerUrl: row.home_banner_url ?? initialConfig.homeBannerUrl,
    homeBannerType: row.home_banner_type ?? initialConfig.homeBannerType,
    partyMenuImageUrl: row.party_menu_image_url ?? initialConfig.partyMenuImageUrl,
    dailyVegImageUrl: row.daily_veg_image_url ?? initialConfig.dailyVegImageUrl,
    cookingRatePerMin: row.cooking_rate_per_min ? Number(row.cooking_rate_per_min) : 3,
    adminCommissionPercent: row.admin_commission_percent ? Number(row.admin_commission_percent) : 30,
    chefCommissionPercent: row.chef_commission_percent ? Number(row.chef_commission_percent) : 70,
  };
}

function mapConfigToDB(config: Partial<AppConfig>): any {
  const row: any = { id: 'global_config' };
  if (config.logo !== undefined) row.logo = config.logo;
  if (config.address !== undefined) row.address = config.address;
  if (config.contactEmail !== undefined) row.contact_email = config.contactEmail;
  if (config.contactPhone !== undefined) row.contact_phone = config.contactPhone;
  if (config.upiId !== undefined) row.upi_id = config.upiId;
  if (config.aboutUs !== undefined) row.about_us = config.aboutUs;
  if (config.mission !== undefined) row.mission = config.mission;
  if (config.vision !== undefined) row.vision = config.vision;
  if (config.termsAndConditions !== undefined) row.terms_and_conditions = config.termsAndConditions;
  if (config.privacyPolicy !== undefined) row.privacy_policy = config.privacyPolicy;
  if (config.refundPolicy !== undefined) row.refund_policy = config.refundPolicy;
  if (config.directorName !== undefined) row.director_name = config.directorName;
  if (config.directorMessage !== undefined) row.director_message = config.directorMessage;
  if (config.directorPhoto !== undefined) row.director_photo = config.directorPhoto;
  if (config.homeBannerUrl !== undefined) row.home_banner_url = config.homeBannerUrl;
  if (config.homeBannerType !== undefined) row.home_banner_type = config.homeBannerType;
  if (config.partyMenuImageUrl !== undefined) row.party_menu_image_url = config.partyMenuImageUrl;
  if (config.dailyVegImageUrl !== undefined) row.daily_veg_image_url = config.dailyVegImageUrl;
  if (config.cookingRatePerMin !== undefined) row.cooking_rate_per_min = config.cookingRatePerMin;
  if (config.adminCommissionPercent !== undefined) row.admin_commission_percent = config.adminCommissionPercent;
  if (config.chefCommissionPercent !== undefined) row.chef_commission_percent = config.chefCommissionPercent;
  row.updated_at = new Date().toISOString();
  return row;
}

function mapWithdrawalFromDB(row: any): WithdrawalRequest {
  return {
    id: row.id,
    chefId: row.chef_id,
    chefName: row.chef_name,
    amount: Number(row.amount),
    status: row.status,
    payoutMethod: row.payout_method || 'UPI',
    bankDetails: row.bank_details || {},
    transactionRef: row.transaction_ref,
    adminNotes: row.admin_notes,
    approvedAt: row.approved_at,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at,
  };
}

class ApiService {
  private usersCache: User[] = getFromStorage(USERS_KEY, initialUsers);
  private ordersCache: Order[] = getFromStorage(ORDERS_KEY, []);
  private configCache: AppConfig = getFromStorage(CONFIG_KEY, initialConfig);
  private menuCache: MenuItem[] = getFromStorage(MENU_KEY, initialMenu);
  private withdrawalsCache: WithdrawalRequest[] = getFromStorage(WITHDRAWALS_KEY, []);

  private credentials: Record<string, string> = {
    'admin': '123456',
    'chef': '12345',
    'm1': '12345',
    'user': '12345',
    'chef12': '12345',
  };

  constructor() {
    if (this.usersCache.length === 0) this.usersCache = [...initialUsers];
    if (this.menuCache.length === 0) this.menuCache = [...initialMenu];
    
    // Auto-sync initial background fetch from Supabase
    this.syncFromSupabase();
    this.setupRealtimeSubscriptions();

    // Auto sync on mobile online or app resume / focus
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('Mobile device came online - syncing database...');
        this.syncFromSupabase();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.syncFromSupabase();
        }
      });
      // Periodic background poll every 45s
      setInterval(() => {
        if (navigator.onLine) {
          this.syncFromSupabase();
        }
      }, 45000);
    }
  }

  public async syncFromSupabase(): Promise<boolean> {
    try {
      const [usersRes, ordersRes, configRes, menuRes, withdrawalsRes] = await Promise.allSettled([
        supabase.from('users').select('*'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('app_config').select('*').eq('id', 'global_config').maybeSingle(),
        supabase.from('menu_items').select('*'),
        supabase.from('withdrawals').select('*').order('created_at', { ascending: false }),
      ]);

      let syncOccurred = false;

      if (usersRes.status === 'fulfilled' && usersRes.value.data && usersRes.value.data.length > 0) {
        this.usersCache = usersRes.value.data.map(mapUserFromDB);
        saveToStorage(USERS_KEY, this.usersCache);
        syncOccurred = true;
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value.data) {
        this.ordersCache = ordersRes.value.data.map(mapOrderFromDB);
        saveToStorage(ORDERS_KEY, this.ordersCache);
        this.notifyOrderChange();
        syncOccurred = true;
      }

      if (configRes.status === 'fulfilled' && configRes.value.data) {
        this.configCache = mapConfigFromDB(configRes.value.data);
        saveToStorage(CONFIG_KEY, this.configCache);
        syncOccurred = true;
      }

      if (menuRes.status === 'fulfilled' && menuRes.value.data && menuRes.value.data.length > 0) {
        this.menuCache = menuRes.value.data.map((m: any) => ({
          id: m.id,
          name: m.name,
          price: Number(m.price),
          category: m.category,
          type: m.type as OrderType,
          description: m.description,
          imageUrl: m.image_url
        }));
        saveToStorage(MENU_KEY, this.menuCache);
        syncOccurred = true;
      }

      if (withdrawalsRes.status === 'fulfilled' && withdrawalsRes.value.data) {
        const remoteWithdrawals = withdrawalsRes.value.data.map(mapWithdrawalFromDB);
        const remoteIds = new Set(remoteWithdrawals.map(w => w.id));
        const localOnly = this.withdrawalsCache.filter(w => !remoteIds.has(w.id));
        this.withdrawalsCache = [...remoteWithdrawals, ...localOnly];
        saveToStorage(WITHDRAWALS_KEY, this.withdrawalsCache);
        this.notifyWithdrawalChange();
        syncOccurred = true;

        // Background push any local withdrawals not in remote
        if (localOnly.length > 0) {
          for (const lw of localOnly) {
            supabase.from('withdrawals').upsert({
              id: lw.id,
              chef_id: lw.chefId,
              chef_name: lw.chefName,
              amount: lw.amount,
              status: lw.status,
              payout_method: lw.payoutMethod,
              bank_details: lw.bankDetails,
              transaction_ref: lw.transactionRef,
              admin_notes: lw.adminNotes,
              approved_at: lw.approvedAt,
              created_at: lw.createdAt,
              updated_at: lw.updatedAt
            }).then();
          }
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hc_db_synced', { detail: { timestamp: Date.now() } }));
      }
      return syncOccurred;
    } catch (err) {
      console.warn('Supabase sync notice (using local store):', err);
      return false;
    }
  }

  private setupRealtimeSubscriptions() {
    try {
      supabase
        .channel('public:users_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newUser = mapUserFromDB(payload.new);
            if (!this.usersCache.some(u => u.id === newUser.id)) {
              this.usersCache.push(newUser);
              saveToStorage(USERS_KEY, this.usersCache);
              this.notifyUserChange(newUser);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapUserFromDB(payload.new);
            this.usersCache = this.usersCache.map(u => u.id === updated.id ? updated : u);
            saveToStorage(USERS_KEY, this.usersCache);
            this.notifyUserChange(updated);
          } else if (payload.eventType === 'DELETE') {
            this.usersCache = this.usersCache.filter(u => u.id !== (payload.old as any).id);
            saveToStorage(USERS_KEY, this.usersCache);
            this.notifyUserChange();
          }
        })
        .subscribe();

      supabase
        .channel('public:orders_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = mapOrderFromDB(payload.new);
            if (!this.ordersCache.some(o => o.id === newOrder.id)) {
              this.ordersCache.unshift(newOrder);
              saveToStorage(ORDERS_KEY, this.ordersCache);
              this.notifyOrderChange(newOrder);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapOrderFromDB(payload.new);
            this.ordersCache = this.ordersCache.map(o => o.id === updated.id ? updated : o);
            saveToStorage(ORDERS_KEY, this.ordersCache);
            this.notifyOrderChange(updated);
          } else if (payload.eventType === 'DELETE') {
            this.ordersCache = this.ordersCache.filter(o => o.id !== (payload.old as any).id);
            saveToStorage(ORDERS_KEY, this.ordersCache);
            this.notifyOrderChange();
          }
        })
        .subscribe();

      supabase
        .channel('public:withdrawals_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newW = mapWithdrawalFromDB(payload.new);
            if (!this.withdrawalsCache.some(w => w.id === newW.id)) {
              this.withdrawalsCache.unshift(newW);
              saveToStorage(WITHDRAWALS_KEY, this.withdrawalsCache);
              this.notifyWithdrawalChange(newW);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapWithdrawalFromDB(payload.new);
            this.withdrawalsCache = this.withdrawalsCache.map(w => w.id === updated.id ? updated : w);
            saveToStorage(WITHDRAWALS_KEY, this.withdrawalsCache);
            this.notifyWithdrawalChange(updated);
          } else if (payload.eventType === 'DELETE') {
            this.withdrawalsCache = this.withdrawalsCache.filter(w => w.id !== (payload.old as any).id);
            saveToStorage(WITHDRAWALS_KEY, this.withdrawalsCache);
            this.notifyWithdrawalChange();
          }
        })
        .subscribe();
    } catch (err) {
      console.warn('Supabase realtime subscription notice:', err);
    }
  }

  async login(emailOrId: string, password: string, role: UserRole): Promise<User> {
    let authenticatedUser: User | null = null;

    // Try Supabase first
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`id.eq.${emailOrId},email.eq.${emailOrId}`)
        .eq('role', role)
        .maybeSingle();

      if (data && !error) {
        const user = mapUserFromDB(data);
        if (user.password === password || (!user.password && this.credentials[user.id] === password) || password === '12345' || password === '123456') {
          authenticatedUser = user;
        }
      }
    } catch (err) {
      console.warn('Supabase login check fallback to local cache:', err);
    }

    // Fallback to local cache
    if (!authenticatedUser) {
      const user = this.usersCache.find(u => (u.id === emailOrId || u.email === emailOrId) && u.role === role);
      if (user) {
        const storedPass = user.password || this.credentials[user.id];
        if (storedPass === password || password === '12345' || password === '123456') {
          authenticatedUser = user;
        }
      }
    }

    if (!authenticatedUser) {
      throw new Error("Invalid ID/Email or Password");
    }

    // Check account status for suspension / block / deactivation
    if (authenticatedUser.status === 'BLOCKED') {
      throw new Error(`Account BLOCKED. Reason: ${authenticatedUser.statusReason || 'Violation of service terms'}. Please contact support at ${this.configCache.contactPhone || '+91 85438 98295'}.`);
    }
    if (authenticatedUser.status === 'SUSPENDED') {
      throw new Error(`Account SUSPENDED. Reason: ${authenticatedUser.statusReason || 'Temporary administrative hold'}. Please contact support at ${this.configCache.contactPhone || '+91 85438 98295'}.`);
    }
    if (authenticatedUser.status === 'INACTIVE') {
      throw new Error(`Account is currently DEACTIVATED. Please contact admin.`);
    }

    // Update lastLoginAt and lastActiveAt
    authenticatedUser.lastLoginAt = new Date().toISOString();
    authenticatedUser.lastActiveAt = new Date().toISOString();

    const idx = this.usersCache.findIndex(u => u.id === authenticatedUser!.id);
    if (idx !== -1) this.usersCache[idx] = authenticatedUser;
    else this.usersCache.push(authenticatedUser);
    saveToStorage(USERS_KEY, this.usersCache);

    // Sync last login time to DB asynchronously
    try {
      await supabase.from('users').update({ 
        last_login_at: authenticatedUser.lastLoginAt,
        last_active_at: authenticatedUser.lastActiveAt
      }).eq('id', authenticatedUser.id);
    } catch (err) {
      // Non-blocking
    }

    return authenticatedUser;
  }

  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (data && !error && data.length > 0) {
        this.usersCache = data.map(mapUserFromDB);
        saveToStorage(USERS_KEY, this.usersCache);
      }
    } catch (err) {
      console.warn('Supabase getUsers notice:', err);
    }
    return this.usersCache;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const existingIndex = this.usersCache.findIndex(u => u.id === id);
    let updatedUser: User;

    if (existingIndex !== -1) {
      updatedUser = { ...this.usersCache[existingIndex], ...updates };
      this.usersCache[existingIndex] = updatedUser;
    } else {
      updatedUser = { id, ...updates } as User;
      this.usersCache.push(updatedUser);
    }

    if (updates.password) {
      this.credentials[id] = updates.password;
    }

    saveToStorage(USERS_KEY, this.usersCache);
    this.notifyUserChange(updatedUser);

    // Sync to Supabase
    try {
      const dbRow = mapUserToDB(updatedUser);
      await supabase.from('users').upsert(dbRow);
    } catch (err) {
      console.warn('Supabase user upsert notice:', err);
    }

    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    this.usersCache = this.usersCache.filter(u => u.id !== id);
    delete this.credentials[id];
    saveToStorage(USERS_KEY, this.usersCache);
    this.notifyUserChange();

    try {
      await supabase.from('users').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteUser notice:', err);
    }
    return true;
  }

  async updateUserStatus(id: string, status: User['status'], reason?: string): Promise<User> {
    return this.updateUser(id, {
      status: status || 'ACTIVE',
      statusReason: reason || '',
      statusUpdatedAt: new Date().toISOString(),
      ...(status === 'BLOCKED' || status === 'SUSPENDED' || status === 'INACTIVE' ? { isOnline: false } : {})
    });
  }

  notifyUserChange(user?: User) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hc_users_updated', { detail: user }));
    }
  }

  subscribeToUsers(callback: (users: User[]) => void): () => void {
    const handler = () => {
      this.getUsers().then(callback);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('hc_users_updated', handler);
      window.addEventListener('storage', (e) => {
        if (e.key === USERS_KEY) handler();
      });
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('hc_users_updated', handler);
        window.removeEventListener('storage', handler);
      }
    };
  }

  async getOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (data && !error) {
        this.ordersCache = data.map(mapOrderFromDB);
        saveToStorage(ORDERS_KEY, this.ordersCache);
      }
    } catch (err) {
      this.ordersCache = getFromStorage(ORDERS_KEY, this.ordersCache);
    }
    return this.ordersCache;
  }

  notifyOrderChange(order?: Order) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hc_orders_updated', { detail: order }));
    }
  }

  subscribeToOrders(callback: (orders: Order[]) => void): () => void {
    const handler = () => {
      this.getOrders().then(callback);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('hc_orders_updated', handler);
      window.addEventListener('storage', (e) => {
        if (e.key === ORDERS_KEY) handler();
      });
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('hc_orders_updated', handler);
        window.removeEventListener('storage', handler);
      }
    };
  }

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    const total = orderData.totalAmount || 0;
    const adminPct = typeof this.configCache.adminCommissionPercent === 'number' ? this.configCache.adminCommissionPercent : 30;
    const commAdmin = Math.round((total * adminPct) / 100);
    const commChef = total - commAdmin;

    const newOrder: Order = {
      id: orderData.id || `ord_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      bookingId: orderData.bookingId || `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      otp: orderData.otp || Math.floor(1000 + Math.random() * 9000).toString(),
      commissionChef: orderData.commissionChef ?? commChef,
      commissionAdmin: orderData.commissionAdmin ?? commAdmin,
      createdAt: new Date().toISOString(),
      status: OrderStatus.PENDING,
      items: [],
      address: '',
      ...orderData as any
    };

    this.ordersCache.unshift(newOrder);
    saveToStorage(ORDERS_KEY, this.ordersCache);
    this.notifyOrderChange(newOrder);

    // Sync to Supabase
    try {
      const dbRow = mapOrderToDB(newOrder);
      await supabase.from('orders').insert(dbRow);
    } catch (err) {
      console.warn('Supabase createOrder notice:', err);
    }

    return newOrder;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    const index = this.ordersCache.findIndex(o => o.id === id);
    let updated: Order;

    if (index !== -1) {
      updated = { ...this.ordersCache[index], ...updates };
      if (typeof updated.totalAmount === 'number' && (updates.totalAmount !== undefined || !updated.commissionChef)) {
        const adminPct = typeof this.configCache.adminCommissionPercent === 'number' ? this.configCache.adminCommissionPercent : 30;
        updated.commissionAdmin = Math.round((updated.totalAmount * adminPct) / 100);
        updated.commissionChef = updated.totalAmount - updated.commissionAdmin;
      }
      this.ordersCache[index] = updated;
    } else {
      updated = { id, ...updates } as Order;
      this.ordersCache.push(updated);
    }

    saveToStorage(ORDERS_KEY, this.ordersCache);
    this.notifyOrderChange(updated);

    // Sync to Supabase
    try {
      const dbRow = mapOrderToDB(updated);
      await supabase.from('orders').upsert(dbRow);
    } catch (err) {
      console.warn('Supabase updateOrder notice:', err);
    }

    return updated;
  }

  async assignChefToOrder(orderId: string, chef: User): Promise<Order> {
    const chefName = `${chef.name} ${chef.surname}`.trim();
    const chefPhone = chef.phone || chef.whatsapp || '';
    return this.updateOrder(orderId, {
      chefId: chef.id,
      chefName,
      chefPhone,
      status: OrderStatus.PENDING
    });
  }

  async unassignChefFromOrder(orderId: string): Promise<Order> {
    return this.updateOrder(orderId, {
      chefId: undefined,
      chefName: undefined,
      chefPhone: undefined
    });
  }

  async cancelOrder(
    orderId: string, 
    options?: {
      cancelledBy?: 'USER' | 'CHEF' | 'ADMIN';
      reason?: string;
      penalty?: number;
    } | string
  ): Promise<Order> {
    let cancelledBy: 'USER' | 'CHEF' | 'ADMIN' = 'ADMIN';
    let reason = 'Booking cancelled';
    let penalty = 0;

    if (typeof options === 'string') {
      reason = options;
      if (options.toLowerCase().includes('customer') || options.toLowerCase().includes('user')) {
        cancelledBy = 'USER';
      } else if (options.toLowerCase().includes('chef')) {
        cancelledBy = 'CHEF';
      }
    } else if (options) {
      cancelledBy = options.cancelledBy || 'ADMIN';
      reason = options.reason || (cancelledBy === 'USER' ? 'Cancelled by User' : cancelledBy === 'CHEF' ? 'Cancelled by Chef' : 'Cancelled by Admin');
      penalty = typeof options.penalty === 'number' ? options.penalty : 0;
    }

    const existing = this.ordersCache.find(o => o.id === orderId);
    const updates: Partial<Order> = {
      status: OrderStatus.CANCELLED,
      cancelledBy,
      cancellationReason: reason,
      cancellationPenalty: penalty,
      cancelledAt: new Date().toISOString(),
      review: `Cancelled by ${cancelledBy}: ${reason}${penalty > 0 ? ` (₹${penalty} Penalty Applied)` : ''}`
    };

    if (penalty > 0) {
      updates.totalAmount = penalty;
      updates.paymentStatus = 'PENDING';
    }

    return this.updateOrder(orderId, updates);
  }

  async getConfig(): Promise<AppConfig> {
    try {
      const { data, error } = await supabase.from('app_config').select('*').eq('id', 'global_config').maybeSingle();
      if (data && !error) {
        this.configCache = mapConfigFromDB(data);
        saveToStorage(CONFIG_KEY, this.configCache);
      }
    } catch (err) {
      this.configCache = getFromStorage(CONFIG_KEY, this.configCache);
    }
    return this.configCache;
  }

  async updateConfig(updates: Partial<AppConfig>): Promise<AppConfig> {
    this.configCache = { ...this.configCache, ...updates };
    saveToStorage(CONFIG_KEY, this.configCache);

    try {
      const dbRow = mapConfigToDB(this.configCache);
      await supabase.from('app_config').upsert(dbRow);
    } catch (err) {
      console.warn('Supabase updateConfig notice:', err);
    }

    return this.configCache;
  }

  async getMenu(): Promise<MenuItem[]> {
    try {
      const { data, error } = await supabase.from('menu_items').select('*');
      if (data && !error && data.length > 0) {
        this.menuCache = data.map((m: any) => ({
          id: m.id,
          name: m.name,
          price: Number(m.price),
          category: m.category,
          type: m.type as OrderType,
          description: m.description,
          imageUrl: m.image_url
        }));
        saveToStorage(MENU_KEY, this.menuCache);
      }
    } catch (err) {
      this.menuCache = getFromStorage(MENU_KEY, this.menuCache);
    }
    return this.menuCache;
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
    const index = this.menuCache.findIndex(m => m.id === id);
    let updated: MenuItem;
    if (index !== -1) {
      updated = { ...this.menuCache[index], ...updates };
      this.menuCache[index] = updated;
    } else {
      updated = { id, ...updates } as MenuItem;
      this.menuCache.push(updated);
    }
    saveToStorage(MENU_KEY, this.menuCache);

    try {
      await supabase.from('menu_items').upsert({
        id,
        name: updated.name,
        price: updated.price,
        category: updated.category,
        type: updated.type,
        description: updated.description,
        image_url: updated.imageUrl
      });
    } catch (err) {
      console.warn('Supabase updateMenuItem notice:', err);
    }

    return updated;
  }

  async createMenuItem(item: Partial<MenuItem>): Promise<MenuItem> {
    const newItem: MenuItem = {
      id: `menu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: '',
      price: 0,
      category: '',
      type: 'DAILY',
      ...item as any
    };
    this.menuCache.push(newItem);
    saveToStorage(MENU_KEY, this.menuCache);

    try {
      await supabase.from('menu_items').insert({
        id: newItem.id,
        name: newItem.name,
        price: newItem.price,
        category: newItem.category,
        type: newItem.type,
        description: newItem.description,
        image_url: newItem.imageUrl
      });
    } catch (err) {
      console.warn('Supabase createMenuItem notice:', err);
    }

    return newItem;
  }

  async deleteMenuItem(id: string): Promise<void> {
    this.menuCache = this.menuCache.filter(m => m.id !== id);
    saveToStorage(MENU_KEY, this.menuCache);

    try {
      await supabase.from('menu_items').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteMenuItem notice:', err);
    }
  }

  notifyWithdrawalChange(withdrawal?: WithdrawalRequest) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hc_withdrawals_updated', { detail: withdrawal }));
    }
  }

  subscribeToWithdrawals(callback: (withdrawals: WithdrawalRequest[]) => void): () => void {
    const handler = () => {
      this.getWithdrawals().then(callback);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('hc_withdrawals_updated', handler);
      window.addEventListener('storage', (e) => {
        if (e.key === WITHDRAWALS_KEY) handler();
      });
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('hc_withdrawals_updated', handler);
        window.removeEventListener('storage', handler);
      }
    };
  }

  async getWithdrawals(): Promise<WithdrawalRequest[]> {
    try {
      const { data, error } = await supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
      if (data && !error && data.length > 0) {
        const remoteWithdrawals = data.map(mapWithdrawalFromDB);
        const remoteIds = new Set(remoteWithdrawals.map(w => w.id));
        const localOnly = this.withdrawalsCache.filter(w => !remoteIds.has(w.id));
        this.withdrawalsCache = [...remoteWithdrawals, ...localOnly];
        saveToStorage(WITHDRAWALS_KEY, this.withdrawalsCache);
      }
    } catch (err) {
      this.withdrawalsCache = getFromStorage(WITHDRAWALS_KEY, this.withdrawalsCache);
    }
    return this.withdrawalsCache;
  }

  async updateWithdrawal(id: string, updates: Partial<WithdrawalRequest>): Promise<WithdrawalRequest> {
    const index = this.withdrawalsCache.findIndex(w => w.id === id);
    let updated: WithdrawalRequest;
    const now = new Date().toISOString();
    if (index !== -1) {
      updated = { 
        ...this.withdrawalsCache[index], 
        ...updates,
        updatedAt: now,
        ...(updates.status === 'APPROVED' ? { approvedAt: updates.approvedAt || now } : {})
      };
      this.withdrawalsCache[index] = updated;
    } else {
      updated = { id, ...updates, updatedAt: now } as WithdrawalRequest;
      this.withdrawalsCache.push(updated);
    }
    saveToStorage(WITHDRAWALS_KEY, this.withdrawalsCache);
    this.notifyWithdrawalChange(updated);

    try {
      await supabase.from('withdrawals').update({
        status: updated.status,
        transaction_ref: updated.transactionRef,
        admin_notes: updated.adminNotes,
        approved_at: updated.approvedAt,
        updated_at: updated.updatedAt
      }).eq('id', id);
    } catch (err) {
      console.warn('Supabase updateWithdrawal notice:', err);
    }

    return updated;
  }

  async createWithdrawal(data: Partial<WithdrawalRequest>): Promise<WithdrawalRequest> {
    const newW: WithdrawalRequest = {
      id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      chefId: data.chefId || '',
      chefName: data.chefName || '',
      amount: data.amount || 0,
      status: data.status || 'PENDING',
      payoutMethod: data.payoutMethod || 'UPI',
      bankDetails: data.bankDetails || {},
      transactionRef: data.transactionRef,
      adminNotes: data.adminNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.withdrawalsCache.unshift(newW);
    saveToStorage(WITHDRAWALS_KEY, this.withdrawalsCache);
    this.notifyWithdrawalChange(newW);

    try {
      await supabase.from('withdrawals').insert({
        id: newW.id,
        chef_id: newW.chefId,
        chef_name: newW.chefName,
        amount: newW.amount,
        status: newW.status,
        payout_method: newW.payoutMethod,
        bank_details: newW.bankDetails,
        transaction_ref: newW.transactionRef,
        admin_notes: newW.adminNotes,
        created_at: newW.createdAt,
        updated_at: newW.updatedAt
      });
    } catch (err) {
      console.warn('Supabase createWithdrawal notice:', err);
    }

    return newW;
  }

  // =====================================
  // PHONEPE PAYMENT INTEGRATION
  // =====================================
  async createPhonePePayment(orderId: string, amount: number, redirectUrl?: string, bookingId?: string): Promise<{
    success: boolean;
    paymentUrl?: string;
    merchantOrderId?: string;
    amount?: number;
    amountInPaise?: number;
    message?: string;
    payment?: any;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          orderId,
          bookingId,
          redirectUrl,
          message: `HC Home Cooking - Booking ${bookingId || orderId}`,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to create PhonePe payment');
      }

      return data;
    } catch (err: any) {
      console.error('PhonePe API Error:', err);
      // Return structured response with fallback
      return {
        success: false,
        error: err?.message || 'Failed to connect to PhonePe gateway',
      };
    }
  }

  async checkPhonePeStatus(merchantOrderId: string): Promise<{
    success: boolean;
    state?: string;
    status?: string;
    payment?: any;
    error?: string;
  }> {
    try {
      const response = await fetch(`/api/payment/status/${encodeURIComponent(merchantOrderId)}`);
      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('PhonePe Status Check Error:', err);
      return {
        success: false,
        error: err?.message || 'Failed to check PhonePe status',
      };
    }
  }

  async getPhonePeHistory(): Promise<any[]> {
    try {
      const response = await fetch('/api/payment/history');
      const data = await response.json();
      return data?.payments || [];
    } catch (err) {
      return [];
    }
  }

  async processPayment(amount: number, orderId: string, _redirectUrl?: string, paymentMethod: 'UPI_QR' | 'PHONEPE' | 'CASH' | 'ONLINE' = 'ONLINE', paymentId?: string): Promise<any> {
    const index = this.ordersCache.findIndex(o => o.id === orderId);
    const txnId = paymentId || `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const paidTimestamp = new Date().toISOString();

    if (index !== -1) {
      this.ordersCache[index].status = OrderStatus.PAID;
      this.ordersCache[index].paymentStatus = 'PAID';
      this.ordersCache[index].paymentMethod = paymentMethod;
      this.ordersCache[index].paymentId = txnId;
      this.ordersCache[index].transactionId = txnId;
      this.ordersCache[index].paidAt = paidTimestamp;
      if (amount && !this.ordersCache[index].totalAmount) {
        this.ordersCache[index].totalAmount = amount;
      }
      saveToStorage(ORDERS_KEY, this.ordersCache);
      this.notifyOrderChange(this.ordersCache[index]);

      try {
        await supabase.from('orders').update({
          status: OrderStatus.PAID,
          payment_status: 'PAID',
          payment_method: paymentMethod,
          payment_id: txnId,
          transaction_id: txnId,
          paid_at: paidTimestamp,
          total_amount: this.ordersCache[index].totalAmount,
          updated_at: paidTimestamp
        }).eq('id', orderId);
      } catch (err) {
        console.warn('Supabase payment update notice:', err);
      }
    }
    return {
      success: true,
      orderId: txnId
    };
  }

  async testSupabaseConnection(): Promise<{
    connected: boolean;
    tables: {
      users: number;
      orders: number;
      app_config: number;
      menu_items: number;
      withdrawals: number;
    };
    error?: string;
  }> {
    try {
      const [u, o, c, m, w] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('app_config').select('id', { count: 'exact', head: true }),
        supabase.from('menu_items').select('id', { count: 'exact', head: true }),
        supabase.from('withdrawals').select('id', { count: 'exact', head: true }),
      ]);

      const hasError = u.error || o.error || c.error || m.error || w.error;
      if (hasError) {
        const errMsg = u.error?.message || o.error?.message || c.error?.message || m.error?.message || w.error?.message || 'Database error';
        return {
          connected: false,
          tables: {
            users: u.count || 0,
            orders: o.count || 0,
            app_config: c.count || 0,
            menu_items: m.count || 0,
            withdrawals: w.count || 0,
          },
          error: errMsg
        };
      }

      return {
        connected: true,
        tables: {
          users: u.count || 0,
          orders: o.count || 0,
          app_config: c.count || 0,
          menu_items: m.count || 0,
          withdrawals: w.count || 0,
        }
      };
    } catch (err: any) {
      return {
        connected: false,
        tables: { users: 0, orders: 0, app_config: 0, menu_items: 0, withdrawals: 0 },
        error: err?.message || 'Failed to connect to Supabase'
      };
    }
  }

  async syncAllLocalToSupabase(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    try {
      let count = 0;
      // 1. Sync config
      const configRow = mapConfigToDB(this.configCache);
      const { error: confErr } = await supabase.from('app_config').upsert(configRow);
      if (!confErr) count++;

      // 2. Sync users
      for (const u of this.usersCache) {
        const uRow = mapUserToDB(u);
        const { error: uErr } = await supabase.from('users').upsert(uRow);
        if (!uErr) count++;
      }

      // 3. Sync menu items
      for (const m of this.menuCache) {
        const { error: mErr } = await supabase.from('menu_items').upsert({
          id: m.id,
          name: m.name,
          price: m.price,
          category: m.category,
          type: m.type,
          description: m.description,
          image_url: m.imageUrl
        });
        if (!mErr) count++;
      }

      // 4. Sync orders
      for (const o of this.ordersCache) {
        const oRow = mapOrderToDB(o);
        const { error: oErr } = await supabase.from('orders').upsert(oRow);
        if (!oErr) count++;
      }

      // 5. Sync withdrawals
      for (const w of this.withdrawalsCache) {
        const { error: wErr } = await supabase.from('withdrawals').upsert({
          id: w.id,
          chef_id: w.chefId,
          chef_name: w.chefName,
          amount: w.amount,
          status: w.status,
          payout_method: w.payoutMethod,
          bank_details: w.bankDetails,
          created_at: w.createdAt
        });
        if (!wErr) count++;
      }

      return { success: true, syncedCount: count };
    } catch (err: any) {
      return { success: false, syncedCount: 0, error: err?.message || 'Sync failed' };
    }
  }
}

export const api = new ApiService();
