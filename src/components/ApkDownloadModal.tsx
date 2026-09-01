import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  QrCode, 
  Database, 
  RefreshCw, 
  Copy, 
  Check,
  Zap,
  Sparkles,
  Download
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AppConfig } from '../types';
import AppLogo from './AppLogo';
import { api } from '../services/api';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig | null;
}

export default function ApkDownloadModal({ isOpen, onClose, config }: ApkDownloadModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ connected: boolean; tables: any; error?: string } | null>(null);

  const currentUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstalling(false);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Detect if running in installed Standalone App mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn("Install prompt error:", err);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Guide user for manual Chrome / Android installation
      const isAndroid = /Android/i.test(navigator.userAgent);
      if (isAndroid) {
        alert('To install on your phone:\n1. Tap the 3 dots (⋮) in the top-right corner of Chrome.\n2. Select "Install app" or "Add to Home screen".\n\nYour app will install directly with the official HC Home Cooking icon!');
      } else {
        alert('Open this app in Chrome on your Android mobile device to install it directly with 1 tap!');
      }
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      await api.syncFromSupabase();
      const test = await api.testSupabaseConnection();
      setDbTestResult(test);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 4000);
    } catch (err) {
      console.warn("Manual sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const copyUrl = () => {
    if (currentUrl) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-6 z-10"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-red-950 p-6 md:p-7 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3.5 relative z-10">
            <AppLogo config={config} size="md" variant="dark" />
          </div>

          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors relative z-10 cursor-pointer"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Bar */}
        <div className="bg-zinc-50 border-b border-gray-100 px-6 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="font-bold text-zinc-700">{isOnline ? 'Online System Active' : 'Offline'}</span>
          </div>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6 max-h-[72vh] overflow-y-auto">
          {/* Main Install Card */}
          <div className="p-6 bg-gradient-to-br from-red-50 via-white to-red-50/40 rounded-3xl border border-red-100/90 shadow-sm space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center p-1 shadow-lg flex-shrink-0">
                <img src="/icon-192.svg" alt="HC Home Cooking Icon" className="w-full h-full object-contain rounded-xl" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full">
                    {isInstalled ? 'Installed' : 'Official Android App'}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">v2.4.2 Release</span>
                </div>
                <h4 className="text-lg font-black text-gray-900 leading-tight">
                  HC Home Cooking
                </h4>
                <p className="text-xs text-gray-600 font-medium">
                  Instant chef booking, live order ringing alerts & offline cooking logs.
                </p>
              </div>
            </div>

            {/* Direct 1-Tap Action Button */}
            {isInstalled ? (
              <div className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
                <CheckCircle2 size={18} />
                <span>App Installed & Ready on Phone</span>
              </div>
            ) : (
              <button 
                type="button"
                onClick={handleInstallApp}
                disabled={isInstalling}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75"
              >
                {isInstalling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Installing App...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} className="animate-bounce" />
                    <span>Install App on Mobile Device</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* QR Code & Mobile Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-gray-50 p-5 rounded-3xl border border-gray-100">
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-200/80 shadow-sm">
              <QRCodeSVG 
                value={currentUrl} 
                size={130}
                level="H"
                includeMargin={false}
              />
              <p className="text-[10px] font-bold text-gray-500 mt-2.5 flex items-center gap-1.5">
                <QrCode size={13} /> Scan with Mobile Camera
              </p>
            </div>

            <div className="space-y-3">
              <h5 className="font-black text-xs uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                <Zap size={14} className="text-amber-500" />
                <span>How It Works on Phone:</span>
              </h5>
              
              <ul className="text-xs text-gray-600 space-y-2 font-medium">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>Tap <strong>"Install App"</strong> above or scan the QR code on your phone.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>Confirm installation to add <strong>HC Home Cooking</strong> directly to your home screen & app drawer.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>Opens full screen in standalone mode just like any standard native app.</span>
                </li>
              </ul>

              <button 
                type="button"
                onClick={copyUrl}
                className="w-full py-2 bg-white hover:bg-gray-100 text-gray-700 text-[11px] font-bold rounded-xl border border-gray-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Mobile Link'}</span>
              </button>
            </div>
          </div>

          {/* App Key Highlights */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Launch Mode</span>
              <p className="font-bold text-gray-800 mt-0.5">Standalone Full Screen</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Audio Alerts</span>
              <p className="font-bold text-gray-800 mt-0.5">Loud Chef Ringtones</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Security</span>
              <p className="font-bold text-emerald-600 flex items-center justify-center gap-1 mt-0.5">
                <ShieldCheck size={13} /> Verified
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[10px] font-bold text-gray-500 tracking-wide">
            Software has been developed by <span className="font-black text-gray-800">Digital Communique Private Limited</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
