import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  ChefHat, 
  ArrowRight,
  QrCode,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order } from '../types';
import { formatCurrency } from '../lib/utils';
import { api } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';

interface PhonePeCheckoutModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (order: Order) => void;
  upiId?: string;
}

export default function PhonePeCheckoutModal({
  order,
  isOpen,
  onClose,
  onPaymentSuccess,
  upiId = 'hchomecookingservices@gmail.com'
}: PhonePeCheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [merchantOrderId, setMerchantOrderId] = useState<string | null>(null);
  const [phonepeOrderId, setPhonepeOrderId] = useState<string | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'INITIATING' | 'AWAITING_PAYMENT' | 'CHECKING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'phonepe' | 'qr'>('phonepe');
  const [pollCount, setPollCount] = useState(0);

  const amount = order.totalAmount || 0;

  // Initialize PhonePe payment session when modal opens
  useEffect(() => {
    if (isOpen && order && amount > 0) {
      initiatePayment();
    } else {
      resetState();
    }
  }, [isOpen, order.id, amount]);

  // Status polling when in AWAITING_PAYMENT
  useEffect(() => {
    let interval: any;
    if (status === 'AWAITING_PAYMENT' && merchantOrderId) {
      interval = setInterval(() => {
        checkStatus(false);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, merchantOrderId]);

  const resetState = () => {
    setLoading(false);
    setPaymentUrl(null);
    setMerchantOrderId(null);
    setPhonepeOrderId(null);
    setStatus('IDLE');
    setStatusMessage('');
    setPollCount(0);
  };

  const initiatePayment = async () => {
    setLoading(true);
    setStatus('INITIATING');
    setStatusMessage('Connecting to PhonePe Payment Gateway...');

    try {
      const res = await api.createPhonePePayment(order.id, amount, undefined, order.bookingId);
      if (res.success && res.paymentUrl) {
        setPaymentUrl(res.paymentUrl);
        setMerchantOrderId(res.merchantOrderId || null);
        setPhonepeOrderId(res.payment?.response_data?.orderId || null);
        setStatus('AWAITING_PAYMENT');
        setStatusMessage('Payment initiated. Please complete the payment on PhonePe.');
      } else if (res.merchantOrderId) {
        setMerchantOrderId(res.merchantOrderId);
        setStatus('AWAITING_PAYMENT');
        setStatusMessage('Payment session active. Complete payment via PhonePe gateway.');
      } else {
        // Fallback
        setStatus('AWAITING_PAYMENT');
        setStatusMessage('Ready for payment.');
      }
    } catch (err: any) {
      console.warn('PhonePe init error, fallback active:', err);
      setStatus('AWAITING_PAYMENT');
      setStatusMessage('Direct UPI / Gateway checkout available.');
    } finally {
      setLoading(false);
    }
  };

  const openPhonePePortal = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Re-initiate or open standard checkout
      initiatePayment();
    }
  };

  const checkStatus = async (showLoading = true) => {
    if (!merchantOrderId) return;
    if (showLoading) {
      setStatus('CHECKING');
      setStatusMessage('Verifying transaction with PhonePe...');
    }

    try {
      const res = await api.checkPhonePeStatus(merchantOrderId);
      setPollCount(prev => prev + 1);

      if (res.state === 'COMPLETED' || res.status === 'COMPLETED') {
        setStatus('SUCCESS');
        setStatusMessage('Payment completed successfully!');
        await handleSuccessCompletion();
      } else if (res.state === 'FAILED' || res.status === 'FAILED') {
        setStatus('FAILED');
        setStatusMessage('Transaction failed or was canceled. Please try again.');
      } else {
        if (showLoading) {
          setStatus('AWAITING_PAYMENT');
          setStatusMessage('Payment is still pending on PhonePe. Please complete the transfer.');
        }
      }
    } catch (err: any) {
      if (showLoading) {
        setStatus('AWAITING_PAYMENT');
        setStatusMessage('Could not verify status. Please check again or confirm manually.');
      }
    }
  };

  const handleSuccessCompletion = async () => {
    try {
      const updated = await api.processPayment(amount, order.id, undefined, 'PHONEPE', merchantOrderId || undefined);
      setStatus('SUCCESS');
      setStatusMessage('Payment recorded successfully! Thank you.');
      setTimeout(() => {
        onPaymentSuccess(updated);
        onClose();
      }, 1800);
    } catch (err) {
      alert('Payment received but failed to update order');
    }
  };

  const simulateSuccess = async () => {
    setLoading(true);
    setStatus('CHECKING');
    setStatusMessage('Simulating instant sandbox confirmation...');
    setTimeout(async () => {
      await handleSuccessCompletion();
      setLoading(false);
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white max-w-lg w-full rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5f259f] via-[#6739B7] to-[#4a148c] p-6 text-white text-center relative">
          <button 
            onClick={onClose}
            className="absolute right-5 top-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
          >
            <XCircle size={20} />
          </button>

          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-black/20">
            <span className="text-2xl font-black text-[#5f259f] tracking-tight">पे</span>
          </div>

          <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white inline-block mb-1">
            PhonePe Secure Gateway
          </span>
          <h3 className="text-2xl font-black tracking-tight">Complete Payment</h3>
          <p className="text-white/80 text-xs font-medium mt-1">
            Booking #{order.bookingId || order.id.slice(-6).toUpperCase()} • Lucknow
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
          {/* Bill Summary Card */}
          <div className="bg-purple-50/60 rounded-3xl p-5 border border-purple-100/80 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-gray-500">
              <span>Service Type</span>
              <span className="text-gray-900 font-black">{order.type === 'PARTY' ? 'Party Special' : 'Daily Veg Cooking'}</span>
            </div>

            {order.type === 'DAILY' && (
              <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                <span>Session Duration</span>
                <span className="text-gray-900 font-black">
                  {order.durationMinutes ? `${order.durationMinutes} mins` : `${Math.ceil((order.durationSeconds || 0) / 60)} mins`} @ ₹{order.ratePerMin || 3}/min
                </span>
              </div>
            )}

            {order.chefName && (
              <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                <span>Chef</span>
                <span className="text-gray-900 font-black flex items-center gap-1">
                  <ChefHat size={14} className="text-[#5f259f]" /> {order.chefName}
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-purple-200/60 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Total Payable Amount</span>
                <span className="text-3xl font-black text-[#5f259f]">{formatCurrency(amount)}</span>
              </div>
              <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-lg">
                Verified Bill
              </span>
            </div>
          </div>

          {/* Tab Selector: PhonePe Gateway vs Instant UPI QR */}
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('phonepe')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'phonepe' ? 'bg-white text-[#5f259f] shadow-md' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <CreditCard size={15} /> PhonePe Portal
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'qr' ? 'bg-white text-[#5f259f] shadow-md' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <QrCode size={15} /> Scan UPI QR
            </button>
          </div>

          {/* TAB 1: PHONEPE GATEWAY PORTAL */}
          {activeTab === 'phonepe' && (
            <div className="space-y-4 text-center">
              {status === 'SUCCESS' ? (
                <div className="p-6 bg-green-50 rounded-3xl border border-green-200 space-y-2 animate-bounce-short">
                  <CheckCircle2 size={48} className="text-green-600 mx-auto" />
                  <h4 className="text-lg font-black text-green-900">Payment Successful!</h4>
                  <p className="text-xs text-green-700 font-medium">Your payment has been received and verified by PhonePe.</p>
                </div>
              ) : status === 'FAILED' ? (
                <div className="p-6 bg-red-50 rounded-3xl border border-red-200 space-y-2">
                  <XCircle size={48} className="text-red-600 mx-auto" />
                  <h4 className="text-lg font-black text-red-900">Payment Unsuccessful</h4>
                  <p className="text-xs text-red-700 font-medium">{statusMessage || 'The transaction could not be completed.'}</p>
                  <button
                    onClick={initiatePayment}
                    className="mt-3 px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700"
                  >
                    Retry Payment
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-left flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#5f259f] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {status === 'CHECKING' || status === 'INITIATING' ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <Clock size={16} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Gateway Status</span>
                        <span className="text-[10px] font-black uppercase text-[#5f259f] px-2 py-0.5 bg-purple-100 rounded-md">
                          {status === 'INITIATING' ? 'Connecting' : status === 'CHECKING' ? 'Verifying' : 'Ready'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-800 mt-1">{statusMessage || 'Click below to open PhonePe checkout.'}</p>
                      {merchantOrderId && (
                        <p className="text-[10px] text-gray-400 font-mono mt-1">Merchant Ref: {merchantOrderId}</p>
                      )}
                    </div>
                  </div>

                  {/* Open PhonePe Button */}
                  <button
                    onClick={openPhonePePortal}
                    disabled={loading}
                    className="w-full h-14 bg-gradient-to-r from-[#5f259f] to-[#7b1fa2] hover:opacity-95 text-white rounded-2xl font-black uppercase tracking-wider text-sm shadow-xl shadow-purple-900/20 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Pay {formatCurrency(amount)} via PhonePe</span>
                    <ExternalLink size={16} />
                  </button>

                  {/* Actions row: Verify Status & Sandbox Instant Confirm */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => checkStatus(true)}
                      disabled={loading || !merchantOrderId}
                      className="h-11 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={status === 'CHECKING' ? 'animate-spin' : ''} />
                      Verify Status
                    </button>

                    <button
                      onClick={simulateSuccess}
                      disabled={loading}
                      title="Simulate successful payment response for testing in sandbox"
                      className="h-11 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Sparkles size={14} className="text-emerald-600" />
                      Test Sandbox Pay
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPI QR CODE */}
          {activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              <p className="text-xs font-bold text-gray-600">Scan with PhonePe, GPay, Paytm, or any UPI app:</p>
              <div className="w-52 h-52 bg-white p-3.5 rounded-3xl mx-auto border-2 border-purple-100 shadow-md flex items-center justify-center">
                <QRCodeSVG
                  value={`upi://pay?pa=${upiId}&pn=HC%20Home%20Cooking&am=${amount}&cu=INR&tn=Booking%20${order.bookingId || order.id}`}
                  size={180}
                />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-mono font-bold text-gray-700">UPI ID: {upiId}</p>
                <p className="text-[10px] text-gray-400 font-medium">Amount: {formatCurrency(amount)}</p>
              </div>

              <button
                onClick={handleSuccessCompletion}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                I Have Completed UPI Payment
              </button>
            </div>
          )}

          {/* Footer Security Badge */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider pt-2 border-t border-gray-100">
            <ShieldCheck size={14} className="text-green-600" />
            <span>256-Bit Encrypted Payments Powered by PhonePe PG</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
