import { Order } from '../types';

export const COMPANY_WHATSAPP_NUMBER = '918543898295';

export interface WhatsAppAddressShareOptions {
  bookingId?: string;
  customerName?: string;
  customerPhone?: string;
  chefName?: string;
  chefPhone?: string;
  address: string;
  landmark?: string;
  locationUrl?: string;
  targetPhone?: string;
  companyPhone?: string;
  otp?: string;
  itemsSummary?: string;
}

/**
 * Normalizes phone numbers to international WhatsApp format (e.g., 91XXXXXXXXXX)
 */
export function sanitizeWhatsAppPhone(phone?: string): string {
  if (!phone) return COMPANY_WHATSAPP_NUMBER;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `91${digits.slice(1)}`;
  return digits;
}

/**
 * Formats a clean, readable Google Maps search query link from manual address
 */
export function getGoogleMapsQueryUrl(address: string, locationUrl?: string): string {
  if (locationUrl && locationUrl.startsWith('http')) {
    return locationUrl;
  }
  const fullQuery = address.toLowerCase().includes('lucknow') ? address : `${address}, Lucknow, Uttar Pradesh`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullQuery)}`;
}

/**
 * Generates WhatsApp URL for Customer to share manual address & location with assigned Chef or Company
 */
export function getCustomerToChefWhatsAppUrl(options: {
  order: Order;
  chefPhone?: string;
  companyPhone?: string;
}): string {
  const { order } = options;
  const chefPhone = options.chefPhone || order.chefPhone;
  const targetPhone = sanitizeWhatsAppPhone(chefPhone || options.companyPhone || COMPANY_WHATSAPP_NUMBER);
  
  const mapsLink = getGoogleMapsQueryUrl(order.address, order.locationUrl);
  const bookingCode = order.bookingId || order.id.slice(-6).toUpperCase();

  let message = `*📍 Delivery Location & Booking Details - HC Home Cooking*\n\n`;
  message += `*Booking ID:* #${bookingCode}\n`;
  message += `*Customer:* ${order.userName || 'Valued Customer'} (${order.userPhone || 'N/A'})\n`;
  if (order.chefName) {
    message += `*Assigned Chef:* ${order.chefName}\n`;
  }
  message += `*Delivery Address:*\n${order.address}\n\n`;
  message += `*🗺️ Google Maps Directions:* ${mapsLink}\n`;
  if (order.otp) {
    message += `*🔐 Arrival Verification OTP:* ${order.otp}\n`;
  }
  message += `\nPlease follow this address to arrive. Looking forward to your visit!`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates WhatsApp URL for Chef to confirm arrival & route to Customer
 */
export function getChefToCustomerWhatsAppUrl(options: {
  order: Order;
  chefName: string;
  chefPhone?: string;
}): string {
  const { order, chefName } = options;
  const targetPhone = sanitizeWhatsAppPhone(order.userPhone);
  const mapsLink = getGoogleMapsQueryUrl(order.address, order.locationUrl);
  const bookingCode = order.bookingId || order.id.slice(-6).toUpperCase();

  let message = `*👨‍🍳 HC Home Cooking - Chef Accepted Your Booking!*\n\n`;
  message += `Namaste! I am your chef *${chefName}*. I have accepted your booking *#${bookingCode}* and am on my way to your location.\n\n`;
  message += `*📍 Destination Address:*\n${order.address}\n\n`;
  message += `*🗺️ Route Link:* ${mapsLink}\n\n`;
  message += `Please keep your ingredients ready and share the 4-digit arrival OTP upon my visit. See you soon!`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates WhatsApp URL for Admin/Manager to dispatch full manual address to Chef
 */
export function getDispatchOrderToChefWhatsAppUrl(options: {
  order: Order;
  chefPhone: string;
  chefName?: string;
}): string {
  const { order, chefPhone, chefName } = options;
  const targetPhone = sanitizeWhatsAppPhone(chefPhone);
  const mapsLink = getGoogleMapsQueryUrl(order.address, order.locationUrl);
  const bookingCode = order.bookingId || order.id.slice(-6).toUpperCase();

  let message = `*🚨 New Mission Dispatched - HC Home Cooking*\n\n`;
  if (chefName) {
    message += `*Chef:* ${chefName}\n`;
  }
  message += `*Booking ID:* #${bookingCode}\n`;
  message += `*Customer:* ${order.userName || 'Customer'} (${order.userPhone || 'N/A'})\n`;
  message += `*📍 Complete Address:*\n${order.address}\n\n`;
  message += `*🗺️ Google Maps Navigation:* ${mapsLink}\n\n`;
  message += `Please reach the customer on time and collect the verification OTP upon arrival.`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Universal manual address share URL
 */
export function getWhatsAppLocationShareUrl({
  bookingId,
  customerName,
  customerPhone,
  address,
  landmark,
  locationUrl,
  companyPhone,
  targetPhone,
}: WhatsAppAddressShareOptions): string {
  const phone = sanitizeWhatsAppPhone(targetPhone || companyPhone || COMPANY_WHATSAPP_NUMBER);
  const mapsLink = getGoogleMapsQueryUrl(address, locationUrl);

  let msg = `*📍 Location & Address Shared - HC Home Cooking (Lucknow)*\n\n`;
  if (bookingId) msg += `*Booking ID:* #${bookingId}\n`;
  if (customerName) msg += `*Customer Name:* ${customerName}\n`;
  if (customerPhone) msg += `*Customer Phone:* ${customerPhone}\n`;
  msg += `*Delivery Address:* ${address}\n`;
  if (landmark) msg += `*Landmark:* ${landmark}\n`;
  msg += `*🗺️ Google Maps Link:* ${mapsLink}\n\n`;
  msg += `Please use this address for dispatching and guiding the chef. Thank you!`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
