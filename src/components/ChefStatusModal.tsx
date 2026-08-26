import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Ban, 
  PauseCircle, 
  PlayCircle,
  PhoneCall
} from 'lucide-react';
import { User, UserStatus } from '../types';
import { api } from '../services/api';

interface ChefStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  chef: User | null;
  onChefUpdated: (updatedChef: User) => void;
}

export default function ChefStatusModal({
  isOpen,
  onClose,
  chef,
  onChefUpdated
}: ChefStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>(chef?.status || 'ACTIVE');
  const [reason, setReason] = useState(chef?.statusReason || '');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (chef) {
      setSelectedStatus(chef.status || 'ACTIVE');
      setReason(chef.statusReason || '');
    }
  }, [chef]);

  if (!isOpen || !chef) return null;

  const handleSaveStatus = async () => {
    if ((selectedStatus === 'SUSPENDED' || selectedStatus === 'BLOCKED') && !reason.trim()) {
      alert(`Please enter a clear reason for setting chef status to ${selectedStatus}. This reason will be logged for administrative reference.`);
      return;
    }

    setIsSaving(true);
    try {
      const updated = await api.updateUserStatus(chef.id, selectedStatus, reason);
      onChefUpdated(updated);
      alert(`Chef ${chef.name} ${chef.surname} status updated to ${selectedStatus}!`);
      onClose();
    } catch (err) {
      alert('Failed to update chef status');
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions: { 
    id: UserStatus; 
    title: string; 
    badge: string; 
    icon: any; 
    desc: string; 
    colorClasses: string;
    borderActive: string;
  }[] = [
    {
      id: 'ACTIVE',
      title: 'Active & Verified',
      badge: 'Normal Operations',
      icon: PlayCircle,
      desc: 'Chef can login, go online, receive incoming booking dispatches, and accept live cooking sessions.',
      colorClasses: 'text-green-600 bg-green-50',
      borderActive: 'border-green-500 bg-green-50/40 ring-2 ring-green-400'
    },
    {
      id: 'INACTIVE',
      title: 'Deactivate / On Leave',
      badge: 'Temporary Pause',
      icon: PauseCircle,
      desc: 'Temporarily pause chef missions without penalties. Chef cannot take new orders until reactivated.',
      colorClasses: 'text-gray-600 bg-gray-100',
      borderActive: 'border-gray-500 bg-gray-50 ring-2 ring-gray-400'
    },
    {
      id: 'SUSPENDED',
      title: 'Suspend Account',
      badge: 'Administrative Hold',
      icon: AlertTriangle,
      desc: 'Temporarily lock account due to customer complaint, hygiene audit, or verification check. Login is blocked.',
      colorClasses: 'text-amber-600 bg-amber-50',
      borderActive: 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-400'
    },
    {
      id: 'BLOCKED',
      title: 'Block / Ban Chef',
      badge: 'Permanent Restriction',
      icon: Ban,
      desc: 'Permanently prohibit chef from logging in, taking orders, or accessing payouts due to policy violations.',
      colorClasses: 'text-red-600 bg-red-50',
      borderActive: 'border-red-500 bg-red-50/60 ring-2 ring-red-400'
    }
  ];

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 overflow-y-auto">
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
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400">
              <ShieldAlert size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
                Chef Account Lifecycle & Access Control
              </span>
              <h3 className="text-xl font-black text-white">
                Manage Status: {chef.name} {chef.surname}
              </h3>
              <p className="text-xs text-gray-400">Chef ID: #{chef.id} • Phone: {chef.phone || 'N/A'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Status Options Grid */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
              Select Chef Operational Status:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {statusOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedStatus === opt.id;

                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedStatus(opt.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                      isSelected ? opt.borderActive : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${opt.colorClasses}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="font-black text-sm text-gray-900">{opt.title}</p>
                          <span className="text-[9px] font-bold text-gray-500 uppercase">{opt.badge}</span>
                        </div>
                      </div>
                      <span className={`w-3.5 h-3.5 rounded-full border-2 ${isSelected ? 'bg-red-600 border-white' : 'border-gray-300'}`} />
                    </div>
                    <p className="text-xs text-gray-600 font-medium leading-relaxed">{opt.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reason Input Box */}
          {(selectedStatus === 'SUSPENDED' || selectedStatus === 'BLOCKED' || selectedStatus === 'INACTIVE') && (
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-700">
                  {selectedStatus === 'INACTIVE' ? 'Reason / Notes for Deactivation' : 'Reason for Suspension / Blocking (Mandatory)'}
                </label>
                <span className="text-[10px] font-black text-red-600">
                  {selectedStatus !== 'INACTIVE' ? '* Required' : 'Optional'}
                </span>
              </div>
              <textarea 
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={`Provide reason why ${chef.name} is being marked as ${selectedStatus} (e.g. repeated late arrival, customer dispute, document verification failure, chef requested leave)...`}
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-medium outline-none focus:border-red-600 transition-colors"
              />
              <p className="text-[10px] text-gray-400 font-medium">
                This note will be recorded in the system audit log and displayed if the chef attempts to login.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-2xl font-black text-xs uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button"
            disabled={isSaving}
            onClick={handleSaveStatus}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isSaving ? 'Updating...' : `Confirm & Apply ${selectedStatus}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
