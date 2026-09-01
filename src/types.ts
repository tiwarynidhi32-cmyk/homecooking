export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
  CHEF = 'CHEF',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  COOKING = 'COOKING',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export type OrderType = 'DAILY' | 'PARTY' | 'CUSTOM';

export interface UserAddress {
  id: string;
  label: string;
  address: string;
  location?: string;
  googleLocation?: string;
}

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLOCKED';

export interface UserDocument {
  id: string;
  name: string;
  type: 'AADHAAR' | 'FSSAI' | 'ADDRESS' | 'POLICE_VERIFICATION' | 'PROFILE_PHOTO' | 'BANK_PROOF' | 'OTHER';
  url: string;
  uploadedAt: string;
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  surname: string;
  email: string;
  phone: string;
  whatsapp?: string;
  customerCode?: string;
  address?: string;
  addresses?: UserAddress[];
  location?: {
    lat: number;
    lng: number;
  };
  googleLocation?: string;
  photo?: string;
  photoUrl?: string;
  documents?: string[];
  idProofDoc?: string;
  certDoc?: string;
  addressProofDoc?: string;
  userDocuments?: UserDocument[];
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    upiId?: string;
    upiPhoto?: string;
  };
  isVerified?: boolean;
  isOnline?: boolean;
  status?: UserStatus;
  statusReason?: string;
  statusUpdatedAt?: Date | string;
  lastLoginAt?: Date | string;
  lastActiveAt?: Date | string;
  password?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  type: OrderType;
  description?: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  bookingId?: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  chefId?: string;
  chefName?: string;
  chefPhone?: string;
  type: OrderType;
  items: MenuItem[];
  dishes?: (string | MenuItem | any)[];
  status: OrderStatus;
  otp: string;
  address?: string;
  googleLocation?: string;
  locationUrl?: string;
  plateCount?: number;
  startTime?: Date | string;
  endTime?: Date | string;
  durationSeconds?: number;
  durationMinutes?: number;
  ratePerMin?: number;
  totalAmount?: number;
  commissionChef?: number;
  commissionAdmin?: number;
  paymentMethod?: 'UPI_QR' | 'PHONEPE' | 'CASH' | 'ONLINE';
  paymentId?: string;
  paymentStatus?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'PAID' | 'REFUNDED';
  transactionId?: string;
  paymentGatewayResponse?: any;
  paidAt?: Date | string;
  rating?: number;
  review?: string;
  createdAt: Date | string;
  cancelledBy?: 'USER' | 'CHEF' | 'ADMIN';
  cancellationReason?: string;
  cancellationPenalty?: number;
  cancelledAt?: Date | string;
}

export interface WithdrawalRequest {
  id: string;
  chefId: string;
  chefName?: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  payoutMethod?: 'UPI' | 'BANK';
  bankDetails?: {
    upiId?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
  adminNotes?: string;
  transactionRef?: string;
  approvedAt?: Date | string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface BannerSlide {
  id: string;
  url: string;
  type?: 'image' | 'video' | 'gif';
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  active?: boolean;
}

export interface AppConfig {
  logo?: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  upiId: string;
  mission?: string;
  vision?: string;
  aboutUs?: string;
  directorMessage?: string;
  directorName?: string;
  directorPhoto?: string;
  termsAndConditions?: string;
  privacyPolicy?: string;
  refundPolicy?: string;
  homeBannerUrl?: string;
  homeBannerType?: 'image' | 'video' | 'gif';
  banners?: BannerSlide[];
  bannerAutoplayInterval?: number;
  partyMenuImageUrl?: string;
  dailyVegImageUrl?: string;
  cookingRatePerMin?: number;
  adminCommissionPercent?: number;
  chefCommissionPercent?: number;
}
