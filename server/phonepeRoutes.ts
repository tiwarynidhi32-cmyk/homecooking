import { Router } from 'express';
import {
  createPayment,
  checkPaymentStatus,
  handleWebhook,
  getPaymentHistory,
} from './phonepeController';

const router = Router();

// =====================================
// CREATE PAYMENT
// =====================================
router.post('/create', createPayment);

// =====================================
// CHECK PAYMENT STATUS
// =====================================
router.get('/status/:merchantOrderId', checkPaymentStatus);

// =====================================
// WEBHOOK CALLBACK
// =====================================
router.post('/webhook', handleWebhook);

// =====================================
// PAYMENT HISTORY / RECORDS
// =====================================
router.get('/history', getPaymentHistory);

export default router;
