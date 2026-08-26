import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Smartphone, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Share2, 
  Globe, 
  Database, 
  Wifi, 
  WifiOff, 
  Check, 
  ShieldCheck,
  Zap,
  QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { AppConfig } from '../types';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: AppConfig | null;
}

export default function InstallAppModal({ isOpen, onClose, config }: InstallAppModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ connected: boolean; tables: any; error?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'install' | 'sync' | 'instructions'>('install');

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-ipcmjinddai4dvngmruffi-213396592667.asia-southeast1.run.app';

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if running in standalone mode (installed as APK or PWA)
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

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setActiveTab('instructions');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E31E24] to-[#B31217] text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Smartphone size={26} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-xl tracking-tight">Mobile APK & App Hub</h3>
                <span className="px-2 py-0.5 bg-yellow-400 text-red-900 text-[10px] font-black uppercase rounded-full">
                  Android Ready
                </span>
              </div>
              <p className="text-red-100 text-xs font-medium">Install APK on phone & sync real-time database</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Bar */}
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-bold text-gray-700">{isOnline ? 'Device Online' : 'Device Offline'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
              <Database size={13} className="text-red-600" />
              <span>Supabase / Offline Cache Active</span>
            </div>
          </div>

          <button 
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Database'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 px-6 bg-white">
          <button 
            onClick={() => setActiveTab('install')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'install' ? 'border-[#E31E24] text-[#E31E24]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Download size={14} /> 1-Tap Install & QR
          </button>
          <button 
            onClick={() => setActiveTab('instructions')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'instructions' ? 'border-[#E31E24] text-[#E31E24]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Smartphone size={14} /> APK Installation Guide
          </button>
          <button 
            onClick={() => setActiveTab('sync')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'sync' ? 'border-[#E31E24] text-[#E31E24]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Database size={14} /> Database Status
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'install' && (
            <div className="space-y-6">
              {/* Direct Install CTA */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-red-50 via-white to-red-50/40 border border-red-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <span className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                    {isInstalled ? 'App Ready' : 'Instant Setup'}
                  </span>
                  <h4 className="text-lg font-black text-gray-900">
                    {isInstalled ? 'HC Cooking is Installed on this Device!' : 'Install HC Cooking on Android / Phone'}
                  </h4>
                  <p className="text-xs text-gray-600 font-medium max-w-md">
                    Works offline, receives instant order sound notifications, and synchronizes your bookings and chef schedules in real-time.
                  </p>
                </div>

                {isInstalled ? (
                  <div className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl font-black text-xs uppercase tracking-wider">
                    <CheckCircle2 size={18} /> Installed & Ready
                  </div>
                ) : (
                  <button 
                    onClick={handleInstallClick}
                    className="w-full md:w-auto px-6 py-3.5 bg-[#E31E24] hover:bg-[#B31217] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Download size={18} /> Install App Now
                  </button>
                )}
              </div>

              {/* QR Code & Mobile URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <div className="p-2 bg-white rounded-xl">
                    <QRCodeSVG 
                      value={currentUrl} 
                      size={140}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 mt-2 flex items-center gap-1">
                    <QrCode size={12} /> Scan with Phone Camera to Open
                  </p>
                </div>

                <div className="space-y-3">
                  <h5 className="font-black text-sm text-gray-900 flex items-center gap-1.5">
                    <Globe size={16} className="text-red-600" /> Open on Mobile Browser
                  </h5>
                  <p className="text-xs text-gray-600 font-medium">
                    Open this URL on Google Chrome or Samsung Internet on your Android phone, then tap <strong className="text-gray-900">"Install app"</strong> or <strong className="text-gray-900">"Add to Home screen"</strong>.
                  </p>
                  
                  <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200">
                    <input 
                      readOnly 
                      value={currentUrl} 
                      className="bg-transparent text-xs font-mono text-gray-700 outline-none flex-1 truncate select-all"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(currentUrl);
                        alert('URL copied to clipboard!');
                      }}
                      className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-black uppercase rounded-lg transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-4">
              <div className="bg-red-50/60 p-4 rounded-2xl border border-red-100 text-xs text-red-900 font-medium">
                <strong>Why APK / WebAPK Installation Works Perfectly:</strong> Our app is built with a production-grade Web App Manifest, Service Worker offline cache, and Supabase cloud persistence. When installed on Android or wrapped via PWABuilder / Capacitor, it runs as a native standalone Android APK.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step 1 */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                  <div className="w-8 h-8 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center">1</div>
                  <h5 className="font-black text-xs uppercase tracking-wider text-gray-900">Open on Android</h5>
                  <p className="text-xs text-gray-600 font-medium">Open the app URL in Google Chrome, Brave, or Samsung Internet on your phone.</p>
                </div>

                {/* Step 2 */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                  <div className="w-8 h-8 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center">2</div>
                  <h5 className="font-black text-xs uppercase tracking-wider text-gray-900">Tap Menu (⋮)</h5>
                  <p className="text-xs text-gray-600 font-medium">Tap the 3 dots in the top-right corner of Chrome and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</p>
                </div>

                {/* Step 3 */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                  <div className="w-8 h-8 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center">3</div>
                  <h5 className="font-black text-xs uppercase tracking-wider text-gray-900">Launch from Home</h5>
                  <p className="text-xs text-gray-600 font-medium">The HC Cooking icon will appear on your phone home screen and app drawer as an independent APK app.</p>
                </div>
              </div>

              {/* Generating APK via PWABuilder / TWA Note */}
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-2 text-xs">
                <h5 className="font-black text-gray-900 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-green-600" /> Building a Standalone .APK File for Google Play or Direct Distribution
                </h5>
                <p className="text-gray-600 font-medium">
                  If you want a downloadable <strong>.apk</strong> file for your team or Google Play Store, paste your app URL into <strong>PWABuilder.com</strong> or <strong>Bubblewrap (TWA)</strong>. Because our <code className="bg-white px-1.5 py-0.5 rounded border text-red-600">manifest.json</code> and <code className="bg-white px-1.5 py-0.5 rounded border text-red-600">sw.js</code> are fully configured, it generates a signed Android APK package with 100% compliance.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div>
                  <h5 className="font-black text-xs uppercase tracking-wider text-gray-900">Live Supabase Database Sync</h5>
                  <p className="text-xs text-gray-600 font-medium">All menu items, bookings, users, and admin configurations are stored in Supabase with local offline fallback.</p>
                </div>
                <button 
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                  {isSyncing ? 'Synchronizing...' : 'Force Sync Now'}
                </button>
              </div>

              {syncSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                  Database synchronized successfully! All local cached items are updated with the cloud.
                </motion.div>
              )}

              {dbTestResult && (
                <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-gray-500">Connection Status</span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      dbTestResult.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {dbTestResult.connected ? 'Connected to Cloud DB' : 'Using Local Storage Fallback'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                    <div className="p-2 bg-gray-50 rounded-xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Users</p>
                      <p className="font-black text-sm text-gray-900">{dbTestResult.tables.users}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Orders</p>
                      <p className="font-black text-sm text-gray-900">{dbTestResult.tables.orders}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Menu Items</p>
                      <p className="font-black text-sm text-gray-900">{dbTestResult.tables.menu_items}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Withdrawals</p>
                      <p className="font-black text-sm text-gray-900">{dbTestResult.tables.withdrawals}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Config</p>
                      <p className="font-black text-sm text-gray-900">{dbTestResult.tables.app_config}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium">HC Home Cooking Mobile Engine v2.0</span>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-black text-xs uppercase tracking-wider transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
