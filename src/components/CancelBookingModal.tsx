import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  ChefHat,
  Ban,
  ArrowRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderStatus } from '../types';
import { api } from '../services/api';
import { formatCurrency, cn } from '../lib/utils';

interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  role: 'USER' | 'CHEF' | 'ADMIN';
  onCancelled: (updatedOrder: Order) => void;
}

const USER_CANCEL_REASONS = [
  'Change in plans / Schedule conflict',
  'Booked by mistake / wrong address',
  'Chef taking too long to arrive',
  'Need to change selected dishes',
  'Emergency / Unable to host chef',
  'Found alternative meal arrangement',
  'Other reason'
];

const CHEF_CANCEL_REASONS = [
  'Personal emergency / Health issue',
  'Vehicle breakdown / Heavy traffic delay',
  'Customer location not reachable',
  'Customer phone unreachable / Not answering',
  'Customer requested cancellation verbally',
  'Required cooking utensils / gas not available',
  'Other operational reason'
];

const ADMIN_CANCEL_REASONS = [
  'Cancelled per customer phone request',
  'Cancelled per chef emergency request',
  'Duplicate or test booking',
  'No available chef in customer zone',
  'Policy violation or invalid address',
  'Other administrative reason'
];

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  isOpen,
  onClose,
  order,
  role,
  onCancelled
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Live timer tick for user 1-minute window
  useEffect(() => {
    if (!isOpen || !order) return;
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, order]);

  // Set default reason when opening
  useEffect(() => {
    if (isOpen) {
      if (role === 'USER') {
        setSelectedReason(USER_CANCEL_REASONS[0]);
      } else if (role === 'CHEF') {
        setSelectedReason(CHEF_CANCEL_REASONS[0]);
      } else {
        setSelectedReason(ADMIN_CANCEL_REASONS[0]);
      }
      setCustomReason('');
      setIsSubmitting(false);
    }
  }, [isOpen, role]);

  if (!isOpen || !order) return null;

  // Calculate elapsed time from creation
  const createdTimestamp = new Date(order.createdAt).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((currentTime - createdTimestamp) / 1000));
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedSecondsRemaining = elapsedSeconds % 60;
  
  // Free 1-minute cancellation policy for user
  const isWithinFreeWindow = elapsedSeconds <= 60;
  const remainingFreeSeconds = Math.max(0, 60 - elapsedSeconds);
  
  // User penalty: ₹100 if cancelled after 1 minute (60 seconds)
  const penaltyAmount = role === 'USER' ? (isWithinFreeWindow ? 0 : 100) : 0;

  const handleConfirmCancel = async () => {
    const finalReason = selectedReason === 'Other reason' && customReason.trim() 
      ? customReason.trim() 
      : customReason.trim() 
        ? `${selectedReason}: ${customReason.trim()}` 
        : selectedReason || 'Booking cancelled';

    setIsSubmitting(true);
    try {
      const updated = await api.cancelOrder(order.id, {
        cancelledBy: role,
        reason: finalReason,
        penalty: penaltyAmount
      });
      onCancelled(updated);
      onClose();
    } catch (err: any) {
      alert(`Failed to cancel booking: ${err?.message || 'Please try again'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reasonsList = role === 'USER' 
    ? USER_CANCEL_REASONS 
    : role === 'CHEF' 
      ? CHEF_CANCEL_REASONS 
      : ADMIN_CANCEL_REASONS;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 md:p-7 bg-red-50/60 border-b border-red-100 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/20">
              <Ban size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-600">
                  {role === 'USER' ? 'Customer Cancellation' : role === 'CHEF' ? 'Chef Mission Cancellation' : 'Admin Cancellation'}
                </span>
              </div>
              <h3 className="text-xl font-black text-gray-900 leading-tight">
                Cancel Booking #{order.bookingId || order.id.slice(-6).toUpperCase()}
              </h3>
              <p className="text-[11px] text-gray-500 font-bold mt-0.5">
                {order.type === 'PARTY' ? 'Party Chef Special' : 'Daily Meal Cooking'} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white/80 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-7 overflow-y-auto space-y-5 text-left">
          
          {/* USER PENALTY / FREE CANCELLATION BANNER */}
          {role === 'USER' && (
            <div className="space-y-2">
              {isWithinFreeWindow ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                      <Clock size={11} /> Free 1-Min Grace Period Active
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-800 animate-pulse">
                      {remainingFreeSeconds}s left
                    </span>
                  </div>
                  <p className="text-xs text-emerald-950 font-bold leading-relaxed">
                    You placed this booking <span className="font-black">{elapsedSeconds} seconds ago</span> (within the 1-minute free window). 
                    Cancelling now is <span className="text-emerald-700 font-black uppercase">100% Free • ₹0 Penalty</span>.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                      <ShieldAlert size={12} /> Cancellation Penalty Applicable
                    </span>
                    <span className="text-xs font-mono font-black text-amber-900">
                      {elapsedMinutes > 0 ? `${elapsedMinutes}m ${elapsedSecondsRemaining}s` : `${elapsedSeconds}s`} ago
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <p className="text-xs text-amber-950 font-bold leading-relaxed pr-2">
                      Booking was placed more than 1 minute ago. As per policy, a standard cancellation fee applies:
                    </p>
                    <span className="text-xl font-black text-red-600 whitespace-nowrap">
                      + ₹100.00
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 font-medium pt-1 border-t border-amber-200/60">
                    This ₹100 fee compensates our registered chef dispatch and preparation schedule.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CHEF CANCELLATION NOTICE */}
          {role === 'CHEF' && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-purple-900">
                <ChefHat size={18} className="text-purple-700" />
                <h4 className="text-xs font-black uppercase tracking-wider">Chef Cancellation Protocol</h4>
              </div>
              <p className="text-xs text-purple-950 font-medium leading-relaxed">
                Cancelling will decline this active cooking mission. The booking will be marked as cancelled by Chef with <strong className="text-purple-900">₹0 fee to the customer</strong>, and admin will be notified.
              </p>
            </div>
          )}

          {/* ADMIN CANCELLATION NOTICE */}
          {role === 'ADMIN' && (
            <div className="p-4 bg-gray-100 border border-gray-200 rounded-2xl space-y-1">
              <p className="text-xs font-black uppercase tracking-wider text-gray-800">Admin Order Override</p>
              <p className="text-xs text-gray-600 font-medium">
                Admin cancellation will instantly update the order status and stop any active ringtones or dispatch timers.
              </p>
            </div>
          )}

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-600">
              Please select a reason for cancellation:
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {reasonsList.map((reason, idx) => (
                <label 
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                    selectedReason === reason 
                      ? 'bg-red-50/80 border-red-500 text-red-950 shadow-sm' 
                      : 'bg-gray-50/70 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="cancelReason" 
                    value={reason} 
                    checked={selectedReason === reason} 
                    onChange={() => setSelectedReason(reason)}
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-600">
              Additional Details / Comments (Optional):
            </label>
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter any additional context regarding this cancellation..."
              className="w-full text-xs font-bold text-gray-800 p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-red-500 resize-none"
            />
          </div>

          {/* Cancellation Summary Pill */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Penalty Fee</span>
              <p className="text-base font-black text-gray-900">
                {penaltyAmount > 0 ? formatCurrency(penaltyAmount) : '₹0.00 (Free)'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Cancellation Type</span>
              <p className="text-xs font-black text-red-600">
                {role === 'USER' ? (isWithinFreeWindow ? 'Free (< 1 min)' : 'Post-1 Min Penalty') : `${role} Direct Cancel`}
              </p>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 md:p-6 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-1/3 h-12 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
          >
            Keep Booking
          </button>

          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={isSubmitting}
            className="w-full sm:w-2/3 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Cancelling Booking...</span>
            ) : (
              <>
                <Ban size={16} />
                <span>
                  {role === 'USER' 
                    ? (isWithinFreeWindow ? 'Confirm Free Cancellation (₹0)' : 'Confirm Cancel (₹100 Penalty)')
                    : 'Confirm & Cancel Booking'}
                </span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
