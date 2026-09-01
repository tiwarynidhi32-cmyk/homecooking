import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChefHat, 
  User, 
  Settings, 
  LayoutDashboard, 
  LogOut, 
  Bell, 
  Menu as MenuIcon,
  X,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { UserRole, User as UserType, AppConfig } from './types';
import AdminPanel from './panels/AdminPanel';
import ManagerPanel from './panels/ManagerPanel';
import UserPanel from './panels/UserPanel';
import ChefPanel from './panels/ChefPanel';
import Login from './components/Login';
import AppLogo from './components/AppLogo';
import socket from './services/socket';
import { cn } from './lib/utils';
import { api } from './services/api';
import { soundService } from './services/soundService';
import ApkDownloadModal from './components/ApkDownloadModal';

import LandingPage from './components/LandingPage';

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showApkModal, setShowApkModal] = useState(false);

  const refreshConfig = async () => {
    try {
      const data = await api.getConfig();
      setConfig(data);
    } catch (err) {
      console.warn("Failed to fetch config", err);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const mobileStatus = window.innerWidth < 768;
      setIsMobile(mobileStatus);
      if (mobileStatus) {
        setIsSidebarOpen(false); // Default closed on mobile
      } else {
        setIsSidebarOpen(true);  // Default open on desktop
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const init = async () => {
      await refreshConfig();
      // Auto-login from localStorage if session exists
      try {
        const savedUser = localStorage.getItem('hc_session_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed && typeof parsed === 'object') {
            setUser(parsed);
          }
        }
      } catch (err) {
        console.warn("Failed to parse saved user session:", err);
        localStorage.removeItem('hc_session_user');
      }
      setLoadingAuth(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (user) {
      socket.emit('join', user.id);
      
      const handleNewOrder = (order: any) => {
        if (user.role === UserRole.CHEF && user.isOnline) {
          setNotifications(prev => [{ id: Date.now(), message: 'New order available!', data: order }, ...prev]);
          soundService.startOrderRingtone();
        }
      };

      socket.on('newOrderNotification', handleNewOrder);
      
      const handleStatusChange = (order: any) => {
        if (order.userId === user.id || order.chefId === user.id) {
           let message = `Order update: ${order.status.replace('_', ' ')}`;
           if (order.status === 'PAYMENT_PENDING' && user.role === UserRole.USER) {
              message = 'Cooking session ended. Please proceed to payment.';
              soundService.playAcceptSound();
           } else if (order.status === 'PAID' && user.role === UserRole.CHEF) {
              message = 'Payment received! Session completed.';
              soundService.playAcceptSound();
           } else {
              soundService.testRingtone();
           }
           
           setNotifications(prev => [{ id: Date.now(), message, data: order }, ...prev]);
        }
      };

      socket.on('orderStatusChanged', handleStatusChange);

      return () => {
        socket.off('newOrderNotification', handleNewOrder);
        socket.off('orderStatusChanged', handleStatusChange);
      };
    }
  }, [user]);

  const handleLogout = async () => {
    localStorage.removeItem('hc_session_user');
    setUser(null);
  };

  if (loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!user) {
    if (showLogin) {
      return <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="h-16 bg-white border-b border-gray-100 flex items-center px-6 md:px-8 justify-between">
           <button onClick={() => setShowLogin(false)} className="text-[11px] font-black uppercase tracking-wider text-red-600 hover:underline">← Back to Home</button>
           <AppLogo config={config} size="sm" />
           <div className="w-20" />
        </nav>
        <div className="flex-1 flex items-center justify-center">
          <Login onLogin={(u) => { 
  setUser(u); 
  localStorage.setItem('hc_session_user', JSON.stringify(u));
  setShowLogin(false); 
}} config={config} />
        </div>
      </div>;
    }
    return <LandingPage config={config} onExplore={() => setShowLogin(true)} />;
  }

  const renderPanel = () => {
    switch (user.role) {
      case UserRole.ADMIN: return <AdminPanel user={user} config={config} onUpdateConfig={refreshConfig} />;
      case UserRole.MANAGER: return <ManagerPanel user={user} />;
      case UserRole.CHEF: return <ChefPanel user={user} config={config} />;
      case UserRole.USER: return <UserPanel user={user} config={config} />;
      default: return <div>Unauthorized</div>;
    }
  };

  return (
    <div className="flex h-screen bg-[#FDFCFB] text-[#1D1D1D] font-sans selection:bg-red-50 relative overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={isMobile ? { x: isSidebarOpen ? 0 : -260, width: 260 } : { width: isSidebarOpen ? 260 : 80 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className={cn(
          "bg-white border-r border-[#EFECE9] flex flex-col h-full",
          isMobile ? "fixed left-0 top-0 bottom-0 z-50 shadow-2xl" : "relative z-20 shadow-sm"
        )}
      >
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <AppLogo 
              config={config} 
              size="md" 
              showSubtitle={isSidebarOpen || isMobile} 
            />
          </div>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active isOpen={isSidebarOpen || isMobile} />
          {user.role === UserRole.ADMIN && <NavItem icon={<Settings size={20} />} label="Settings" isOpen={isSidebarOpen || isMobile} />}
          {user.role === UserRole.USER && <NavItem icon={<MenuIcon size={20} />} label="My Orders" isOpen={isSidebarOpen || isMobile} />}
          
          <button 
            onClick={() => setShowApkModal(true)}
            className={cn(
              "w-full flex items-center gap-4 p-3 rounded-xl transition-all font-semibold text-xs text-red-600 bg-red-50/60 hover:bg-red-100/80 border border-red-100"
            )}
          >
            <div className="p-1.5 rounded-lg bg-red-100">
              <Smartphone size={18} className="text-red-600" />
            </div>
            {(isSidebarOpen || isMobile) && <span className="uppercase tracking-widest text-[11px] font-black">Mobile APK / Sync</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-[#EFECE9]">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            {(isSidebarOpen || isMobile) && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#EFECE9] px-4 md:px-8 flex items-center justify-between z-10 sticky top-0">
          <div className="flex items-center gap-3 md:gap-4">
             <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
            >
              <MenuIcon size={20} />
            </button>
            <h1 className="text-sm md:text-lg font-semibold text-gray-800 flex items-center gap-1.5 flex-wrap">
               <span>Hi, {user.name}</span>
               <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[9px] rounded-full font-bold uppercase tracking-wider border border-red-100">
                 {user.role}
               </span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setShowApkModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              title="Install Mobile App & Database Sync"
            >
              <Smartphone size={14} />
              <span>Mobile APK / Sync</span>
            </button>

            <div className="relative">
              <button className="p-2.5 hover:bg-[#F5F2F0] rounded-full transition-all relative">
                <Bell size={20} className="text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-600 border-2 border-white rounded-full"></span>
                )}
              </button>
              
              <AnimatePresence>
                {notifications.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-black uppercase tracking-widest">Notifications</h3>
                      <button onClick={() => setNotifications([])} className="text-[10px] font-bold text-gray-400 hover:text-red-600">Clear all</button>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className="p-3 bg-red-50 rounded-xl text-xs font-medium border border-red-100 text-gray-700">
                          {n.message}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="h-10 w-10 bg-[#EFECE9] rounded-full flex items-center justify-center text-gray-500 overflow-hidden ring-2 ring-red-50 ring-offset-2 ring-offset-white flex-shrink-0">
              {user.photo ? <img src={user.photo} className="w-full h-full object-cover" /> : <User size={20} />}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col justify-between">
           <div>
              {renderPanel()}
           </div>
           
           <footer className="mt-12 pt-6 border-t border-[#EFECE9] text-center pb-4">
              <p className="text-[11px] font-bold text-gray-500">
                Software has been developed by <span className="text-gray-900 font-black">Digital Communique Private Limited</span>.
              </p>
           </footer>
        </div>
      </main>

      {/* Mobile APK & Database Sync Modal */}
      <ApkDownloadModal 
        isOpen={showApkModal} 
        onClose={() => setShowApkModal(false)} 
        config={config} 
      />
    </div>
  );
}

function NavItem({ icon, label, active = false, isOpen = true }: { icon: React.ReactNode, label: string, active?: boolean, isOpen?: boolean }) {
  return (
    <button className={cn(
      "w-full flex items-center gap-4 p-3 rounded-xl transition-all font-semibold text-xs",
      active ? "bg-red-50 text-red-600 shadow-sm shadow-red-100" : "text-gray-400 hover:bg-[#F5F2F0] hover:text-gray-700"
    )}>
      <div className={cn(
        "p-1.5 rounded-lg",
        active ? "bg-red-100" : "bg-transparent"
      )}>
        {icon}
      </div>
      {isOpen && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="uppercase tracking-widest">{label}</motion.span>}
    </button>
  );
}

