import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Smartphone, 
  CheckCircle2, 
  X, 
  Zap, 
  QrCode,
  Download
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AppConfig } from '../types';
import AppLogo from './AppLogo';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: AppConfig | null;
}

export default function InstallAppModal({ isOpen, onClose, config }: InstallAppModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install directly: Open in Chrome on your phone, tap the 3 dots (⋮) and select "Install app" or "Add to Home screen"!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md" 
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 1, y: 0 }}
        className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-6 z-10 p-6 md:p-8 space-y-6"
      >
        <div className="flex items-center justify-between">
          <AppLogo config={config} size="md" />
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-xl font-black text-gray-900">Install HC Home Cooking</h3>
          <p className="text-xs text-gray-600 font-medium">Install official app on your Android phone for full-screen access, sound notifications & offline support.</p>
        </div>

        <button 
          onClick={handleInstallClick}
          className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-200 cursor-pointer"
        >
          <Download size={18} />
          <span>Install App on Phone</span>
        </button>

        <div className="flex justify-center p-4 bg-gray-50 rounded-2xl">
          <QRCodeSVG value={currentUrl} size={140} />
        </div>
      </motion.div>
    </div>
  );
}
