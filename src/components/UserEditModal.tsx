import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  X, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  FileText,
  KeyRound
} from 'lucide-react';
import { User, UserRole, UserStatus } from '../types';
import { api } from '../services/api';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: (updatedUser: User) => void;
  onOpenDocuments: (user: User) => void;
}

export default function UserEditModal({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  onOpenDocuments
}: UserEditModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        surname: user.surname || '',
        email: user.email || '',
        phone: user.phone || '',
        whatsapp: user.whatsapp || '',
        customerCode: user.customerCode || '',
        password: user.password || '',
        role: user.role || UserRole.USER,
        status: user.status || 'ACTIVE',
        statusReason: user.statusReason || '',
        address: user.address || '',
        googleLocation: user.googleLocation || '',
        isVerified: user.isVerified ?? true,
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.updateUser(user.id, formData);
      onUserUpdated(updated);
      alert('User profile updated successfully!');
      onClose();
    } catch (err) {
      alert('Failed to update user details');
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
        className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col z-10 overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-gray-900 via-neutral-900 to-red-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-red-400">
              <UserIcon size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
                Edit User & Customer Account
              </span>
              <h3 className="text-xl md:text-2xl font-black text-white">
                {user.name} {user.surname} (#{user.id})
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
          {/* Document Button Shortcut */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-2">
              <FileText className="text-red-600" size={18} />
              <span className="text-xs font-bold text-gray-800">Verification & ID Documents:</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDocuments(user);
              }}
              className="px-3.5 py-1.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
            >
              <ShieldCheck size={13} /> View / Manage Documents
            </button>
          </div>

          {/* Basic Fields */}
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
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Email Address *</label>
              <input 
                type="email"
                required
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
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">WhatsApp Contact</label>
              <input 
                value={formData.whatsapp || ''} 
                onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                className="w-full h-11 bg-gray-50 rounded-xl px-4 text-xs font-bold border border-gray-200 focus:border-red-600 outline-none"
                placeholder="+91..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Customer Code (Internal ID)</label>
              <input 
                value={formData.customerCode || ''} 
                onChange={e => setFormData({...formData, customerCode: e.target.value})}
                className="w-full h-11 bg-gray-50 rounded-xl px-4 text-xs font-bold font-mono text-red-600 border border-gray-200 focus:border-red-600 outline-none"
                placeholder="e.g. HC-VIP-001"
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
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">System Role</label>
              <select 
                value={formData.role || UserRole.USER} 
                onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                className="w-full h-11 bg-gray-50 rounded-xl px-3 text-xs font-black border border-gray-200 focus:border-red-600 outline-none"
              >
                <option value={UserRole.USER}>Customer (USER)</option>
                <option value={UserRole.CHEF}>Chef (CHEF)</option>
                <option value={UserRole.MANAGER}>Manager (MANAGER)</option>
                <option value={UserRole.ADMIN}>Administrator (ADMIN)</option>
              </select>
            </div>
          </div>

          {/* Account Status */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Account Status</label>
            <select 
              value={formData.status || 'ACTIVE'} 
              onChange={e => setFormData({...formData, status: e.target.value as UserStatus})}
              className="w-full h-11 bg-gray-50 rounded-xl px-3 text-xs font-black border border-gray-200 focus:border-red-600 outline-none"
            >
              <option value="ACTIVE">🟢 ACTIVE</option>
              <option value="INACTIVE">⚪ INACTIVE / DEACTIVATED</option>
              <option value="SUSPENDED">🟠 SUSPENDED</option>
              <option value="BLOCKED">🔴 BLOCKED / BANNED</option>
            </select>

            {formData.status !== 'ACTIVE' && (
              <input 
                value={formData.statusReason || ''} 
                onChange={e => setFormData({...formData, statusReason: e.target.value})}
                className="w-full h-10 bg-red-50/50 rounded-xl px-3 text-xs font-bold border border-red-200 outline-none mt-2"
                placeholder="Reason for inactive/suspended/blocked status..."
              />
            )}
          </div>

          {/* Primary Address */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Primary Delivery / Kitchen Address</label>
            <textarea 
              rows={2}
              value={formData.address || ''} 
              onChange={e => setFormData({...formData, address: e.target.value})}
              className="w-full bg-gray-50 rounded-xl p-3 text-xs font-medium border border-gray-200 focus:border-red-600 outline-none"
              placeholder="Full street address, apartment / flat number..."
            />
          </div>

          {/* Google Maps Link */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Google Maps Location Link</label>
            <input 
              value={formData.googleLocation || ''} 
              onChange={e => setFormData({...formData, googleLocation: e.target.value})}
              className="w-full h-11 bg-gray-50 rounded-xl px-4 text-xs font-medium border border-gray-200 focus:border-red-600 outline-none"
              placeholder="https://maps.google.com/?q=..."
            />
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
              {isSaving ? 'Saving...' : 'Save User Profile'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
