import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  X, 
  CheckCircle2, 
  Phone, 
  Mail, 
  Lock, 
  Building, 
  CreditCard, 
  ShieldCheck, 
  Radio, 
  FileText
} from 'lucide-react';
import { User, UserStatus } from '../types';
import { api } from '../services/api';

interface ChefEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  chef: User | null;
  onChefUpdated: (updatedChef: User) => void;
  onOpenDocuments: (chef: User) => void;
}

export default function ChefEditModal({
  isOpen,
  onClose,
  chef,
  onChefUpdated,
  onOpenDocuments
}: ChefEditModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [bankData, setBankData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (chef) {
      setFormData({
        name: chef.name || '',
        surname: chef.surname || '',
        email: chef.email || '',
        phone: chef.phone || '',
        whatsapp: chef.whatsapp || '',
        password: chef.password || '',
        isVerified: chef.isVerified ?? true,
        isOnline: chef.isOnline ?? false,
        status: chef.status || 'ACTIVE',
        statusReason: chef.statusReason || '',
        address: chef.address || '',
        googleLocation: chef.googleLocation || '',
      });
      setBankData({
        bankName: chef.bankDetails?.bankName || '',
        accountNumber: chef.bankDetails?.accountNumber || '',
        ifscCode: chef.bankDetails?.ifscCode || '',
        upiId: chef.bankDetails?.upiId || '',
        upiPhoto: chef.bankDetails?.upiPhoto || '',
      });
    }
  }, [chef]);

  if (!isOpen || !chef) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updates: Partial<User> = {
        ...formData,
        bankDetails: bankData,
      };
      const updated = await api.updateUser(chef.id, updates);
      onChefUpdated(updated);
      alert('Chef profile details updated successfully!');
      onClose();
    } catch (err) {
      alert('Failed to update chef details');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md" 
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col z-10 overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-gray-900 via-neutral-900 to-red-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-red-400">
              <UserIcon size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
                Edit Chef Profile & Credentials
              </span>
              <h3 className="text-xl md:text-2xl font-black text-white">
                {chef.name} {chef.surname} (Chef ID: #{chef.id})
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto max-h-[72vh] space-y-6">
          {/* Quick Shortcuts */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-red-50/40 rounded-2xl border border-red-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-red-600" size={18} />
              <span className="text-xs font-bold text-gray-800">Verification & Legal Compliance:</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDocuments(chef);
              }}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
            >
              <FileText size={13} /> View / Manage Documents & ID Proofs
            </button>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
              Personal Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">First Name *</label>
                <input 
                  required
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full h-11 bg-gray-50 rounded-xl px-4 text-xs font-bold border border-gray-200 focus:border-red-600 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Surname / Last Name</label>
                <input 
                  value={formData.surname || ''} 
                  onChange={e => setFormData({...formData, surname: e.target.value})}
                  className="w-full h-11 bg-gray-50 rounded-xl px-4 text-xs font-bold border border-gray-200 focus:border-red-600 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Email Address</label>
                <input 
                  type="email"
                  value={formData.email || ''} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full h-11 bg-gray-50 rounded-xl px-4 text-xs font-bold border border-gray-200 focus:border-red-600 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Phone Number *</label>
                <input 
                  required
                  value={formData.phone || ''} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full h-11 bg-gray-50 rounded-xl px-4 text-xs font-bold border border-gray-200 focus:border-red-600 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">WhatsApp Number</label>
                <input 
                  value={formData.whatsapp || ''} 
                  onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                  className="w-full h-11 bg-gray-50 rounded-xl px-4 text-xs font-bold border border-gray-200 focus:border-red-600 outline-none"
                  placeholder="+91..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Login Password</label>
                <input 
                  type="text"
                  value={formData.password || ''} 
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full h-11 bg-gray-50 rounded-xl px-4 text-xs font-bold border border-gray-200 focus:border-red-600 outline-none"
                  placeholder="Set or change password"
                />
              </div>
            </div>
          </div>

          {/* Account Status & Toggles */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
              Operational Status & Verification
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Account Status</label>
                <select 
                  value={formData.status || 'ACTIVE'} 
                  onChange={e => setFormData({...formData, status: e.target.value as UserStatus})}
                  className="w-full h-11 bg-gray-50 rounded-xl px-3 text-xs font-black border border-gray-200 focus:border-red-600 outline-none"
                >
                  <option value="ACTIVE">🟢 ACTIVE</option>
                  <option value="INACTIVE">⚪ INACTIVE / ON LEAVE</option>
                  <option value="SUSPENDED">🟠 SUSPENDED</option>
                  <option value="BLOCKED">🔴 BLOCKED / BANNED</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Verification Status</label>
                <select 
                  value={formData.isVerified ? 'true' : 'false'} 
                  onChange={e => setFormData({...formData, isVerified: e.target.value === 'true'})}
                  className="w-full h-11 bg-gray-50 rounded-xl px-3 text-xs font-bold border border-gray-200 focus:border-red-600 outline-none"
                >
                  <option value="true">✅ Verified Chef</option>
                  <option value="false">⏳ Pending Verification</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Live Online Switch</label>
                <select 
                  value={formData.isOnline ? 'true' : 'false'} 
                  onChange={e => setFormData({...formData, isOnline: e.target.value === 'true'})}
                  className="w-full h-11 bg-gray-50 rounded-xl px-3 text-xs font-bold border border-gray-200 focus:border-red-600 outline-none"
                >
                  <option value="true">🟢 Online (Receiving Orders)</option>
                  <option value="false">⚪ Offline</option>
                </select>
              </div>
            </div>

            {formData.status !== 'ACTIVE' && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-red-600">Status Reason / Administrative Note</label>
                <input 
                  value={formData.statusReason || ''} 
                  onChange={e => setFormData({...formData, statusReason: e.target.value})}
                  className="w-full h-10 bg-red-50/50 rounded-xl px-3 text-xs font-bold border border-red-200 outline-none"
                  placeholder="Reason for inactive/suspended/blocked status..."
                />
              </div>
            )}
          </div>

          {/* Bank & Payout Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
              Bank Account & Direct Payout Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Bank Name</label>
                <input 
                  value={bankData.bankName || ''} 
                  onChange={e => setBankData({...bankData, bankName: e.target.value})}
                  className="w-full h-11 bg-gray-50 rounded-xl px-4 text-xs font-bold border border-gray-200 focus:border-red-600 outline-none"
                  placeholder="e.g. State Bank of India, HDFC"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Account Number</label>
                <input 
                  value={bankData.accountNumber || ''} 
                  onChange={e => setBankData({...bankData, accountNumber: e.target.value})}
                  className="w-full h-11 bg-gray-50 rounded-xl px-4 text-xs font-bold border border-gray-200 focus:border-red-600 outline-none"
                  placeholder="e.g. 123456789012"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">IFSC Code</label>
                <input 
                  value={bankData.ifscCode || ''} 
                  onChange={e => setBankData({...bankData, ifscCode: e.target.value.toUpperCase()})}
                  className="w-full h-11 bg-gray-50 rounded-xl px-4 text-xs font-bold uppercase border border-gray-200 focus:border-red-600 outline-none"
                  placeholder="e.g. SBIN0001234"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">UPI ID for Direct Payouts</label>
                <input 
                  value={bankData.upiId || ''} 
                  onChange={e => setBankData({...bankData, upiId: e.target.value})}
                  className="w-full h-11 bg-gray-50 rounded-xl px-4 text-xs font-bold text-red-600 border border-gray-200 focus:border-red-600 outline-none"
                  placeholder="chefname@okhdfcbank"
                />
              </div>
            </div>
          </div>

          {/* Footer Save Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-2xl font-black text-xs uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              {isSaving ? 'Saving Changes...' : 'Save Chef Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
