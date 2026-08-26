import { Request, Response } from 'express';
import paymentModel from './paymentModel';
import phonepeService from './phonepeService';

// =====================================
// CREATE PAYMENT
// =====================================
export const createPayment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { amount, orderId, bookingId, message } = req.body;

    // =====================================
    // VALIDATION
    // =====================================
    if (amount === undefined || amount === null || amount === '') {
      return res.status(400).json({
        success: false,
        message: 'Amount is required',
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero',
      });
    }

    // =====================================
    // RUPEES -> PAISE
    // =====================================
    const amountInPaise = Math.round(numericAmount * 100);

    // =====================================
    // REDIRECT URL
    // =====================================
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const defaultFrontendUrl = `${protocol}://${host}`;
    const frontendUrl = process.env.FRONTEND_URL || defaultFrontendUrl;
    
    // Support custom or standard redirect result page with query params
    const redirectUrl = req.body.redirectUrl || `${frontendUrl}/payment/result`;

    // =====================================
    // CREATE PHONEPE ORDER
    // =====================================
    const result = await phonepeService.createPayment({
      amount: amountInPaise,
      redirectUrl,
      orderId: orderId || bookingId,
      message: message || `HC Home Cooking - Booking ${bookingId || orderId || 'Order'}`,
    });

    const merchantOrderId = result.merchantOrderId;
    const phonePeResponse = result.response;

    // =====================================
    // SAVE PAYMENT IN MODEL
    // =====================================
    const payment = await paymentModel.createPayment({
      merchant_order_id: merchantOrderId,
      phonepe_order_id: phonePeResponse.orderId || null,
      order_id: orderId || null,
      amount: amountInPaise,
      status: 'PENDING',
      response_data: phonePeResponse,
    });

    // =====================================
    // RESPONSE
    // =====================================
    return res.status(200).json({
      success: true,
      message: 'PhonePe payment created successfully',
      merchantOrderId,
      amount: numericAmount,
      amountInPaise,
      paymentUrl: phonePeResponse.redirectUrl,
      payment,
    });
  } catch (error: any) {
    console.error('PhonePe create payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create PhonePe payment',
      error: error?.message || String(error),
    });
  }
};

// =====================================
// CHECK PAYMENT STATUS
// =====================================
export const checkPaymentStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantOrderId } = req.params;

    if (!merchantOrderId) {
      return res.status(400).json({
        success: false,
        message: 'Merchant order ID is required',
      });
    }

    const phonePeResponse: any = await phonepeService.getOrderStatus(merchantOrderId);
    const state = phonePeResponse?.state || 'PENDING';

    let databaseStatus: 'PENDING' | 'COMPLETED' | 'FAILED' = 'PENDING';

    if (state === 'COMPLETED') {
      databaseStatus = 'COMPLETED';
    } else if (state === 'FAILED') {
      databaseStatus = 'FAILED';
    }

    const updatedPayment = await paymentModel.updatePayment(merchantOrderId, {
      phonepe_order_id: phonePeResponse?.orderId || null,
      status: databaseStatus,
      response_data: phonePeResponse,
    });

    return res.status(200).json({
      success: true,
      merchantOrderId,
      state,
      status: databaseStatus,
      payment: phonePeResponse,
      record: updatedPayment,
    });
  } catch (error: any) {
    console.error('PhonePe status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error?.message || String(error),
    });
  }
};

// =====================================
// WEBHOOK CALLBACK HANDLER
// =====================================
export const handleWebhook = async (req: Request, res: Response): Promise<any> => {
  try {
    console.log('[PhonePe Webhook] Received callback:', req.body);
    const { merchantOrderId, state, orderId } = req.body || {};

    if (merchantOrderId) {
      const dbStatus = state === 'COMPLETED' ? 'COMPLETED' : state === 'FAILED' ? 'FAILED' : 'PENDING';
      await paymentModel.updatePayment(merchantOrderId, {
        phonepe_order_id: orderId || null,
        status: dbStatus,
        response_data: req.body,
      });
    }

    return res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('PhonePe webhook error:', error);
    return res.status(500).json({ success: false, error: error?.message });
  }
};

// =====================================
// GET PAYMENT HISTORY
// =====================================
export const getPaymentHistory = async (req: Request, res: Response): Promise<any> => {
  try {
    const payments = await paymentModel.getAllPayments();
    return res.status(200).json({ success: true, payments });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message });
  }
};

export default {
  createPayment,
  checkPaymentStatus,
  handleWebhook,
  getPaymentHistory,
};
