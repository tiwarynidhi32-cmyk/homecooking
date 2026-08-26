import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  X, 
  Upload, 
  Eye, 
  Download, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck, 
  Image as ImageIcon,
  User as UserIcon,
  Plus
} from 'lucide-react';
import { User, UserDocument } from '../types';
import { api } from '../services/api';

interface DocumentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: (updatedUser: User) => void;
}

export default function DocumentManagerModal({ 
  isOpen, 
  onClose, 
  user, 
  onUserUpdated 
}: DocumentManagerModalProps) {
  const [activePreviewDoc, setActivePreviewDoc] = useState<{ title: string; url: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Editable documents state
  const [idProof, setIdProof] = useState(user?.idProofDoc || user?.documents?.[0] || '');
  const [certDoc, setCertDoc] = useState(user?.certDoc || user?.documents?.[1] || '');
  const [addressProof, setAddressProof] = useState(user?.addressProofDoc || user?.documents?.[2] || '');
  const [upiPhoto, setUpiPhoto] = useState(user?.bankDetails?.upiPhoto || '');
  const [photo, setPhoto] = useState(user?.photo || '');

  // Reset when user changes
  React.useEffect(() => {
    if (user) {
      setIdProof(user.idProofDoc || user.documents?.[0] || '');
      setCertDoc(user.certDoc || user.documents?.[1] || '');
      setAddressProof(user.addressProofDoc || user.documents?.[2] || '');
      setUpiPhoto(user.bankDetails?.upiPhoto || '');
      setPhoto(user.photo || '');
      setActivePreviewDoc(null);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    title: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setter(result);
      setActivePreviewDoc({ title, url: result });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAllDocuments = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    try {
      const updatedDocs = [idProof, certDoc, addressProof].filter(Boolean);
      const updates: Partial<User> = {
        idProofDoc: idProof,
        certDoc: certDoc,
        addressProofDoc: addressProof,
        documents: updatedDocs,
        photo: photo,
        bankDetails: {
          accountNumber: user.bankDetails?.accountNumber || '',
          bankName: user.bankDetails?.bankName || '',
          ifscCode: user.bankDetails?.ifscCode || '',
          upiId: user.bankDetails?.upiId || '',
          upiPhoto: upiPhoto,
        },
      };

      const updated = await api.updateUser(user.id, updates);
      onUserUpdated(updated);
      setSuccessMsg('All documents updated successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err) {
      alert('Failed to save documents');
    } finally {
      setIsSaving(false);
    }
  };

  const isChef = user.role === 'CHEF';

  const docSlots = [
    {
      id: 'idProof',
      title: isChef ? 'Aadhaar / Gov ID Proof' : 'Identity Verification Proof',
      desc: 'Government recognized identity document (Aadhaar/PAN/Passport)',
      value: idProof,
      setter: setIdProof,
      required: isChef
    },
    {
      id: 'certDoc',
      title: isChef ? 'FSSAI / Food Safety & Chef Cert' : 'Secondary Verification / Certificate',
      desc: isChef ? 'FSSAI registration or culinary training certificate' : 'Additional verification or authorization proof',
      value: certDoc,
      setter: setCertDoc,
      required: false
    },
    {
      id: 'addressProof',
      title: 'Current Residential / Kitchen Address Proof',
      desc: 'Electricity bill, rent agreement, or registered address document',
      value: addressProof,
      setter: setAddressProof,
      required: false
    },
    ...(isChef ? [{
      id: 'upiPhoto',
      title: 'Chef UPI QR Code / Bank Passbook Photo',
      desc: 'Direct payment QR for instant payouts & commission settlements',
      value: upiPhoto,
      setter: setUpiPhoto,
      required: false
    }] : []),
    {
      id: 'photo',
      title: 'Profile Display Photograph',
      desc: 'Official profile picture displayed on dispatch cards and orders',
      value: photo,
      setter: setPhoto,
      required: false
    }
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
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
        className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col z-10 overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-gray-900 via-neutral-900 to-red-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600/30 border border-red-500/30 flex items-center justify-center text-red-400">
              <FileText size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
                Official Verification & Documentation
              </span>
              <h3 className="text-xl md:text-2xl font-black text-white">
                {user.name} {user.surname} ({user.role})
              </h3>
              <p className="text-xs text-gray-400 font-medium">User ID: #{user.id} • Phone: {user.phone || 'N/A'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-green-500 text-white p-3 text-center text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
          {/* Lightbox / Preview Area if active */}
          {activePreviewDoc && (
            <div className="p-4 bg-gray-900 text-white rounded-3xl border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-2">
                  <Eye size={15} /> Previewing: {activePreviewDoc.title}
                </span>
                <div className="flex items-center gap-2">
                  <a 
                    href={activePreviewDoc.url} 
                    download={`${user.name}_${activePreviewDoc.title.replace(/\s+/g, '_')}`}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors"
                  >
                    <Download size={12} /> Download
                  </a>
                  <button 
                    onClick={() => setActivePreviewDoc(null)}
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="w-full max-h-72 bg-black/50 rounded-2xl overflow-hidden flex items-center justify-center p-2">
                <img 
                  src={activePreviewDoc.url} 
                  alt={activePreviewDoc.title} 
                  className="max-h-64 object-contain rounded-xl shadow-lg" 
                />
              </div>
            </div>
          )}

          {/* Document Slots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {docSlots.map((slot) => {
              const hasDoc = Boolean(slot.value);

              return (
                <div 
                  key={slot.id}
                  className={`p-5 rounded-3xl border transition-all ${
                    hasDoc 
                      ? 'bg-red-50/20 border-red-100 hover:border-red-200' 
                      : 'bg-gray-50 border-gray-200/80 border-dashed'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-gray-900">{slot.title}</span>
                        {slot.required && (
                          <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-black uppercase">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{slot.desc}</p>
                    </div>

                    <span className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${hasDoc ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>

                  {/* Thumbnail / Upload Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    {hasDoc ? (
                      <div className="flex items-center gap-3">
                        <div 
                          onClick={() => setActivePreviewDoc({ title: slot.title, url: slot.value })}
                          className="w-14 h-14 bg-white rounded-xl border border-gray-200 p-1 cursor-pointer overflow-hidden relative group shadow-sm flex items-center justify-center"
                        >
                          <img src={slot.value} alt={slot.title} className="w-full h-full object-cover rounded-lg" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Eye size={16} />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-green-700 flex items-center gap-1">
                            <ShieldCheck size={14} /> Document Uploaded
                          </p>
                          <button 
                            type="button"
                            onClick={() => setActivePreviewDoc({ title: slot.title, url: slot.value })}
                            className="text-[10px] font-black uppercase tracking-wider text-red-600 hover:underline"
                          >
                            Click to View Full Size
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 font-bold italic">
                        No document attached
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {/* Upload / Replace Button */}
                      <label className="px-3.5 py-2 bg-gray-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm">
                        <Upload size={12} />
                        {hasDoc ? 'Change / Replace' : 'Upload File'}
                        <input 
                          type="file" 
                          accept="image/*,application/pdf"
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, slot.setter, slot.title)}
                        />
                      </label>

                      {hasDoc && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Remove ${slot.title}?`)) {
                              slot.setter('');
                              if (activePreviewDoc?.title === slot.title) setActivePreviewDoc(null);
                            }
                          }}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                          title="Remove document"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 font-medium">
            Changes will be permanently updated in cloud database and local device cache.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-2xl font-black text-xs uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button 
              type="button"
              disabled={isSaving}
              onClick={handleSaveAllDocuments}
              className="flex-1 sm:flex-none px-8 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Documents...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Save All Documents</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
