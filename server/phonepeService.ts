import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from '@phonepe-pg/pg-sdk-node';

// Fallback configuration provided by user for live production gateway
const DEFAULT_CLIENT_ID = 'M23GKNNMJOKT1_2603301607';
const DEFAULT_CLIENT_SECRET = 'ZWE0YjljYWMtZTRhNy00ZDliLTg2MzgtZWFmNDM4M2JkNGY2';
const DEFAULT_CLIENT_VERSION = 1;

let clientInstance: StandardCheckoutClient | null = null;

export function getPhonePeClient(): StandardCheckoutClient {
  if (!clientInstance) {
    const clientId = process.env.PHONEPE_CLIENT_ID || process.env.VITE_PHONEPE_CLIENT_ID || DEFAULT_CLIENT_ID;
    const clientSecret = process.env.PHONEPE_CLIENT_SECRET || process.env.VITE_PHONEPE_CLIENT_SECRET || DEFAULT_CLIENT_SECRET;
    const clientVersion = Number(process.env.PHONEPE_CLIENT_VERSION || process.env.VITE_PHONEPE_CLIENT_VERSION || DEFAULT_CLIENT_VERSION);
    
    // Auto-detect production mode if explicit or if using live credentials starting with M...
    const rawEnv = (process.env.PHONEPE_ENV || process.env.VITE_PHONEPE_ENV || '').toUpperCase();
    const isSandbox = rawEnv === 'SANDBOX' || rawEnv === 'TEST' || rawEnv === 'UAT' || clientId.includes('UAT') || clientId.includes('TEST') || clientId.includes('SIMULATOR');
    const env = isSandbox ? Env.SANDBOX : Env.PRODUCTION;

    clientInstance = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);
    console.log(`[PhonePe Service] Initialized with Client ID: ${clientId.slice(0, 8)}... Env: ${isSandbox ? 'SANDBOX' : 'PRODUCTION'}`);
  }
  return clientInstance;
}

export interface CreatePaymentParams {
  amount: number; // in paise
  redirectUrl: string;
  merchantOrderId?: string;
  orderId?: string;
  message?: string;
}

export const phonepeService = {
  // =====================================
  // CREATE PAYMENT
  // =====================================
  createPayment: async ({ amount, redirectUrl, merchantOrderId, orderId, message }: CreatePaymentParams) => {
    const client = getPhonePeClient();
    const resolvedMerchantOrderId = merchantOrderId || `HC_${orderId ? orderId.replace(/[^a-zA-Z0-9_-]/g, '') : 'ORD'}_${Date.now()}`;

    const requestBuilder = StandardCheckoutPayRequest.builder()
      .merchantOrderId(resolvedMerchantOrderId)
      .amount(amount)
      .redirectUrl(redirectUrl);

    if (message) {
      requestBuilder.message(message);
    }

    const request = requestBuilder.build();
    const response = await client.pay(request);

    return {
      merchantOrderId: resolvedMerchantOrderId,
      response: {
        orderId: (response as any).orderId,
        state: (response as any).state || 'PENDING',
        redirectUrl: (response as any).redirectUrl,
        expireAt: (response as any).expireAt,
      },
    };
  },

  // =====================================
  // GET ORDER STATUS
  // =====================================
  getOrderStatus: async (merchantOrderId: string) => {
    const client = getPhonePeClient();
    const response = await client.getOrderStatus(merchantOrderId);
    return response;
  },
};

export default phonepeService;
