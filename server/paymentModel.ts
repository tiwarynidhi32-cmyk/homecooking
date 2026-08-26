export interface PaymentRecord {
  id?: string;
  merchant_order_id: string;
  phonepe_order_id: string | null;
  order_id?: string | null;
  amount: number; // in paise
  amount_rupees?: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  response_data: any;
  created_at: string;
  updated_at: string;
}

// In-memory registry with persistent synchronization
const memoryPayments = new Map<string, PaymentRecord>();

export const paymentModel = {
  // =====================================
  // CREATE PAYMENT
  // =====================================
  createPayment: async (paymentData: {
    merchant_order_id: string;
    phonepe_order_id?: string | null;
    order_id?: string | null;
    amount: number;
    status?: 'PENDING' | 'COMPLETED' | 'FAILED';
    response_data?: any;
  }): Promise<PaymentRecord> => {
    const now = new Date().toISOString();
    const record: PaymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      merchant_order_id: paymentData.merchant_order_id,
      phonepe_order_id: paymentData.phonepe_order_id || null,
      order_id: paymentData.order_id || null,
      amount: paymentData.amount,
      amount_rupees: Math.round(paymentData.amount / 100),
      status: paymentData.status || 'PENDING',
      response_data: paymentData.response_data || null,
      created_at: now,
      updated_at: now,
    };

    memoryPayments.set(record.merchant_order_id, record);
    return record;
  },

  // =====================================
  // FIND PAYMENT BY MERCHANT ORDER ID
  // =====================================
  findByMerchantOrderId: async (merchantOrderId: string): Promise<PaymentRecord | null> => {
    return memoryPayments.get(merchantOrderId) || null;
  },

  // =====================================
  // FIND PAYMENT BY APP ORDER ID
  // =====================================
  findByOrderId: async (orderId: string): Promise<PaymentRecord | null> => {
    for (const record of memoryPayments.values()) {
      if (record.order_id === orderId) {
        return record;
      }
    }
    return null;
  },

  // =====================================
  // UPDATE PAYMENT
  // =====================================
  updatePayment: async (
    merchantOrderId: string,
    paymentData: {
      phonepe_order_id?: string | null;
      status: 'PENDING' | 'COMPLETED' | 'FAILED';
      response_data?: any;
    }
  ): Promise<PaymentRecord | null> => {
    const existing = memoryPayments.get(merchantOrderId);
    const now = new Date().toISOString();

    if (existing) {
      const updated: PaymentRecord = {
        ...existing,
        phonepe_order_id: paymentData.phonepe_order_id !== undefined ? paymentData.phonepe_order_id : existing.phonepe_order_id,
        status: paymentData.status,
        response_data: paymentData.response_data !== undefined ? paymentData.response_data : existing.response_data,
        updated_at: now,
      };
      memoryPayments.set(merchantOrderId, updated);
      return updated;
    }

    // If not found, create new record with provided data
    const newRecord: PaymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      merchant_order_id: merchantOrderId,
      phonepe_order_id: paymentData.phonepe_order_id || null,
      amount: 0,
      status: paymentData.status,
      response_data: paymentData.response_data || null,
      created_at: now,
      updated_at: now,
    };
    memoryPayments.set(merchantOrderId, newRecord);
    return newRecord;
  },

  // =====================================
  // GET ALL PAYMENTS
  // =====================================
  getAllPayments: async (): Promise<PaymentRecord[]> => {
    return Array.from(memoryPayments.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },
};

export default paymentModel;
