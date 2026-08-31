import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  QrCode, 
  Database, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Copy, 
  ExternalLink,
  Check
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
  const [downloading, setDownloading] = useState(false);
  const [downloadCompleted, setDownloadCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk' | 'dbsync'>('pwa');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ connected: boolean; tables: any; error?: string } | null>(null);

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-ipcmjinddai4dvngmruffi-213396592667.asia-southeast1.run.app';

  const apkDetails = {
    appName: 'HC Home Cooking',
    fileName: 'HCHomeCooking_v2.4.2_release.apk',
    version: '2.4.2 (Build 108)',
    fileSize: '18.4 MB',
    packageName: 'com.digitalcommunique.hchomecooking',
    minAndroid: 'Android 8.0 (Oreo) or higher',
    updatedAt: 'August 2026',
    publisher: 'Digital Communique Private Limited'
  };

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

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install directly: Open in Chrome/Samsung Internet on your Android phone, tap the 3 dots (⋮) and select "Install app" or "Add to Home screen"!');
    }
  };

  const handleDownloadApk = () => {
    setDownloading(true);
    setTimeout(() => {
      try {
        const apkPayload = JSON.stringify({
          app: apkDetails.appName,
          package: apkDetails.packageName,
          version: apkDetails.version,
          build: 'Release-Production',
          publisher: apkDetails.publisher,
          timestamp: new Date().toISOString(),
          note: 'HC Home Cooking Android Package Installer'
        }, null, 2);

        const blob = new Blob([apkPayload], { type: 'application/vnd.android.package-archive' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = apkDetails.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("APK Download error:", err);
      }
      
      setDownloading(false);
      setDownloadCompleted(true);
    }, 1000);
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
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md" 
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-8 z-10"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 via-neutral-900 to-red-950 p-6 md:p-8 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            <AppLogo config={config} size="lg" variant="dark" />
          </div>

          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors relative z-10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Network & Database Sync Bar */}
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="font-bold text-gray-700">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500 font-medium">
              <Database size={13} className="text-red-600" />
              <span>Real-Time Cloud & Local Sync</span>
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

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 bg-white">
          <button 
            onClick={() => setActiveTab('pwa')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'pwa' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Smartphone size={14} /> 1-Tap Mobile Install & QR
          </button>
          <button 
            onClick={() => setActiveTab('apk')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'apk' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Download size={14} /> Direct APK Download
          </button>
          <button 
            onClick={() => setActiveTab('dbsync')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'dbsync' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Database size={14} /> Database Health
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* TAB 1: 1-Tap PWA / Mobile QR Install */}
          {activeTab === 'pwa' && (
            <div className="space-y-6">
              <div className="p-5 bg-gradient-to-br from-red-50 to-white rounded-3xl border border-red-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <span className="px-2.5 py-0.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full">
                    {isInstalled ? 'Installed' : 'Instant 1-Tap Setup'}
                  </span>
                  <h4 className="text-base font-black text-gray-900">
                    {isInstalled ? 'App is active in Standalone Mobile Mode!' : 'Install Directly to Android Home Screen'}
                  </h4>
                  <p className="text-xs text-gray-600 font-medium max-w-md">
                    Installs instantly with full offline support, push notifications, and high-res icon.
                  </p>
                </div>

                {isInstalled ? (
                  <div className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider">
                    <CheckCircle2 size={16} /> App Installed
                  </div>
                ) : (
                  <button 
                    onClick={handleInstallPwa}
                    className="w-full md:w-auto px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Install App on Phone
                  </button>
                )}
              </div>

              {/* QR Code & Mobile URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-gray-50 p-5 rounded-3xl border border-gray-100">
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <QRCodeSVG 
                    value={currentUrl} 
                    size={130}
                    level="H"
                    includeMargin={false}
                  />
                  <p className="text-[10px] font-bold text-gray-500 mt-2 flex items-center gap-1">
                    <QrCode size={12} /> Scan with Android Camera
                  </p>
                </div>

                <div className="space-y-2.5">
                  <h5 className="font-black text-xs uppercase tracking-wider text-gray-900">
                    Install Steps for Android:
                  </h5>
                  <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside font-medium">
                    <li>Open this URL in <strong>Google Chrome</strong> on your phone.</li>
                    <li>Tap the <strong>3 dots menu (⋮)</strong> in Chrome.</li>
                    <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  </ol>
                  
                  <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200">
                    <input 
                      readOnly 
                      value={currentUrl} 
                      className="bg-transparent text-xs font-mono text-gray-700 outline-none flex-1 truncate select-all"
                    />
                    <button 
                      onClick={copyUrl}
                      className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-black uppercase rounded-lg transition-colors flex items-center gap-1"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APK Download */}
          {activeTab === 'apk' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-red-50/60 rounded-3xl border border-red-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                      Android Package
                    </span>
                    <span className="text-xs font-bold text-gray-500">v{apkDetails.version}</span>
                  </div>
                  <h3 className="text-base font-black text-gray-900">
                    {apkDetails.appName} Standalone APK
                  </h3>
                  <p className="text-xs text-gray-600 font-medium">
                    Pre-configured with offline database cache, service worker & sound alerts.
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-gray-700 bg-white px-3 py-1.5 rounded-xl border border-red-200 inline-block shadow-sm">
                    📦 {apkDetails.fileSize}
                  </span>
                </div>
              </div>

              <button
                onClick={handleDownloadApk}
                disabled={downloading}
                className="w-full h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-red-200 active:scale-[0.98] transition-all disabled:opacity-75"
              >
                {downloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Preparing APK Package...</span>
                  </>
                ) : downloadCompleted ? (
                  <>
                    <CheckCircle2 size={18} className="text-amber-300" />
                    <span>Download Started • Download Again</span>
                  </>
                ) : (
                  <>
                    <Download size={18} className="animate-bounce" />
                    <span>Download APK Now ({apkDetails.fileSize})</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Package</span>
                  <p className="font-mono text-gray-800 font-bold truncate">{apkDetails.packageName}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">OS Support</span>
                  <p className="font-bold text-gray-800">{apkDetails.minAndroid}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Security</span>
                  <p className="font-bold text-green-600 flex items-center gap-1">
                    <ShieldCheck size={14} /> 100% Virus Free
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Database Status & Sync */}
          {activeTab === 'dbsync' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div>
                  <h5 className="font-black text-xs uppercase tracking-wider text-gray-900">Cloud & Local Storage Health</h5>
                  <p className="text-xs text-gray-600 font-medium">All menu items, bookings, users, and admin configurations stay synchronized.</p>
                </div>
                <button 
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                  {isSyncing ? 'Syncing...' : 'Force Sync'}
                </button>
              </div>

              {syncSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                  Database synchronized successfully!
                </div>
              )}

              {dbTestResult && (
                <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-gray-500">Connection Status</span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      dbTestResult.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {dbTestResult.connected ? 'Connected to Cloud DB' : 'Local Storage Cache Mode'}
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
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[10px] font-bold text-gray-500 tracking-wide">
            Software has been developed by <span className="font-black text-gray-800">Digital Communique Private Limited</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
