import React, { useState } from 'react';
import { 
  ChefHat, 
  Target, 
  Eye, 
  MessageSquare, 
  Phone, 
  Mail, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  Heart,
  Clock,
  Utensils,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Download,
  Smartphone
} from 'lucide-react';
import { AppConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import AppLogo from './AppLogo';
import ApkDownloadModal from './ApkDownloadModal';
import BannerSlider from './BannerSlider';
// @ts-ignore
import officialBannerImage from '../assets/images/hchome_official_banner_1788236680661.jpg';
// @ts-ignore
import chefHeroImage from '../assets/images/indian_home_chef_1781542950747.jpg';

export default function LandingPage({ config, onExplore }: { config: AppConfig | null, onExplore: () => void }) {
  const [showApkModal, setShowApkModal] = useState(false);
  const configToUse = config || {
    address: 'Lucknow',
    contactEmail: 'hchomecookingservices@gmail.com',
    contactPhone: '+91 85438 98295',
    upiId: 'hc@upi',
    homeBannerUrl: officialBannerImage,
    homeBannerType: 'image'
  } as AppConfig;

  const bannerUrl = (configToUse.homeBannerUrl && (configToUse.homeBannerUrl.includes('unsplash.com/photo-1589302168068-964664d93dc9') || configToUse.homeBannerUrl.includes('indian_home_chef_1781542950747.jpg')))
    ? officialBannerImage
    : (configToUse.homeBannerUrl || officialBannerImage);

  return (
    <div className="bg-[#FFFBFA] selection:bg-red-100 min-h-screen font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 h-20 flex items-center shadow-sm">
        <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
          <AppLogo config={configToUse} size="md" />
            <div className="hidden lg:flex items-center gap-7">
               <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Service Area
                  </span>
                  <span className="text-[11px] font-black text-gray-900">Lucknow, UP Only</span>
               </div>
               <div className="w-px h-8 bg-gray-100" />
               <a href="#about" className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-red-600 transition-colors">About</a>
               <a href="#services" className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-emerald-600 transition-colors">Services</a>
               <a href="#contact" className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-red-600 transition-colors">Contact</a>
               
               <button 
                  onClick={() => setShowApkModal(true)}
                  className="flex items-center gap-1.5 px-3.5 h-11 rounded-xl text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all active:scale-95 shadow-sm"
                  title="Install Mobile App"
               >
                  <Smartphone size={15} className="text-emerald-600" />
                  <span>Install App</span>
               </button>

               <button 
                  onClick={onExplore}
                  className="bg-red-600 text-white px-7 h-11 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-700 hover:shadow-lg hover:shadow-red-200 transition-all active:scale-95"
               >
                  Login / Register
               </button>
            </div>
            
            {/* Mobile Menu Actions */}
            <div className="lg:hidden flex items-center gap-2">
               <button 
                  onClick={() => setShowApkModal(true)}
                  className="p-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl"
                  title="Download APK"
               >
                  <Download size={20} />
               </button>
               <button className="p-2 text-gray-900 bg-red-50 rounded-xl" onClick={onExplore}>
                  <ChefHat size={24} className="text-red-600" />
               </button>
            </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
           <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
           >
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-700 border border-red-200/80 rounded-full">
                  <MapPin size={12} className="animate-pulse text-red-600" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Exclusively in Lucknow, UP</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-wider">100% Fresh & Authentic</span>
                </div>
              </div>

              <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-[1.1] text-gray-900">
                 Elite Indian <br/> Chefs in Your <br/> <span className="text-red-600">Kitchen.</span>
              </h1>
              <p className="text-lg text-gray-600 font-medium leading-relaxed max-w-lg">
                 We bring professional Indian culinary expertise to Lucknow homes. Fresh ingredients, authentic taste, and healthy meals prepared by elite chefs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                 <button 
                    onClick={onExplore}
                    className="bg-red-600 text-white px-10 h-16 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95"
                 >
                    Get Started <ArrowRight size={20} />
                 </button>
                 <div className="flex items-center gap-4 px-6 h-16 bg-emerald-50/70 rounded-2xl border border-emerald-200/80">
                    <div className="flex -space-x-3">
                       {[1,2,3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="avatar" />
                          </div>
                       ))}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                      1000+ Happy Clients
                    </span>
                 </div>
              </div>
           </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex flex-col space-y-4 w-full"
           >
              {/* Multi-Image Banner Slider (100% Uncropped from Top, Bottom & Sides) */}
              <BannerSlider
                banners={configToUse.banners}
                defaultBannerUrl={bannerUrl}
                defaultBannerType={configToUse.homeBannerType}
                autoplayInterval={configToUse.bannerAutoplayInterval || 4500}
                showControls={true}
                showDots={true}
                showBadge={true}
              />

              {/* Tagline Card cleanly positioned DOWN below the banner (no overlap) */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-r from-[#590d10] via-[#8c1218] to-[#6b0f14] text-white p-4 sm:p-6 rounded-2xl md:rounded-3xl border border-red-800/60 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full"
              >
                 <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-red-200">Lucknow's #1 Home Chef Network</p>
                    </div>
                    <h3 className="text-white font-black text-lg sm:text-xl tracking-tight italic">
                      "Asal Lucknowi Swad, Chef ke Haath"
                    </h3>
                 </div>
                 <div className="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/20 shrink-0 flex items-center gap-2 self-start sm:self-center shadow-inner">
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-200">Live Rate:</span>
                    <span className="text-sm font-black text-white flex items-center">
                      <IndianRupee size={13} className="mr-0.5" /> ONLY 3 PER MINUTE
                    </span>
                 </div>
              </motion.div>
           </motion.div>
        </div>
      </section>

      {/* Our Services Section */}
      <section id="services" className="py-24 px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div className="space-y-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <Utensils size={12} /> Our Excellence
                 </div>
                 <h2 className="text-5xl font-black tracking-tight leading-none">Our Services</h2>
              </div>
              <p className="max-w-md text-gray-500 font-medium text-lg leading-relaxed">
                 Professional culinary solutions for every occasion, exclusively available for Lucknow residents.
              </p>
           </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "1. Daily Veg Meals",
                  badge: "100% PURE VEG",
                  badgeColor: "bg-emerald-600 text-white",
                  features: ["Seasonal fresh vegetables", "Balanced home nutrition", "Cooked fresh every single day"],
                  color: "bg-gradient-to-b from-emerald-50/90 to-emerald-50/40",
                  borderColor: "border-emerald-200",
                  textColor: "text-emerald-800",
                  iconColor: "text-emerald-600"
                },
                {
                  title: "2. Party Special Menu – ₹555 Per Plate",
                  badge: "LUCKNOW FEAST",
                  badgeColor: "bg-red-600 text-white",
                  features: ["Starters + Main Course + Dessert", "Customizable as per event size", "Hygienic, authentic & flavorful"],
                  color: "bg-gradient-to-b from-red-50/90 to-red-50/40",
                  borderColor: "border-red-200",
                  textColor: "text-red-800",
                  iconColor: "text-red-600",
                  special: true
                },
                {
                  title: "3. Customized Orders",
                  badge: "FLEXIBLE CHEF",
                  badgeColor: "bg-emerald-700 text-white",
                  features: ["Flexible menu selection & dietary care", "Monsoon, summer & winter specials", "Healthy, delicious & made to order"],
                  color: "bg-gradient-to-b from-emerald-50/70 via-white to-red-50/40",
                  borderColor: "border-emerald-200/80",
                  textColor: "text-gray-900",
                  iconColor: "text-emerald-600"
                }
              ].map((service, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn("p-10 rounded-[3.5rem] border flex flex-col h-full shadow-sm hover:shadow-md transition-shadow", service.color, service.borderColor)}
                >
                   <div className="flex items-center justify-between gap-2 mb-4">
                     <span className={cn("text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full", service.badgeColor)}>
                       {service.badge}
                     </span>
                   </div>
                   <h3 className={cn("text-2xl font-black mb-8 leading-tight", service.textColor)}>{service.title}</h3>
                   <ul className="space-y-4 flex-1">
                      {service.features.map((feat, j) => (
                        <li key={j} className="flex items-center gap-3 font-bold text-gray-700">
                           <CheckCircle2 size={18} className={service.iconColor} />
                           {feat}
                        </li>
                      ))}
                   </ul>
                   {service.special && (
                      <div className="mt-10 p-6 bg-white/95 rounded-3xl border border-red-200 shadow-sm">
                         <div className="flex items-center gap-2 mb-2">
                           <ShieldCheck size={16} className="text-red-600" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-[#E31E24]">Advance Payment Policy</span>
                         </div>
                         <p className="text-[11px] font-bold text-gray-600 leading-relaxed italic">
                            For party menu bookings, 50% advance payment is required at the time of booking, and the full payment must be cleared one day before the event.
                         </p>
                      </div>
                   )}
                </motion.div>
              ))}
           </div>
        </div>
      </section>

      {/* Reference Images Section */}
      {(configToUse.partyMenuImageUrl || configToUse.dailyVegImageUrl) && (
        <section className="py-24 px-8 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
            {configToUse.partyMenuImageUrl && (
              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-red-600 italic">Party Special Menu Reference</h4>
                <div className="rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl bg-gray-50 flex items-center justify-center min-h-[300px]">
                  <img src={configToUse.partyMenuImageUrl} className="w-full h-auto max-h-[500px] object-contain block" alt="Party Menu" />
                </div>
              </div>
            )}
            {configToUse.dailyVegImageUrl && (
              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-emerald-600 italic">Daily Vegetable List</h4>
                <div className="rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl bg-gray-50 flex items-center justify-center min-h-[300px]">
                  <img src={configToUse.dailyVegImageUrl} className="w-full h-auto max-h-[500px] object-contain block" alt="Daily Veg" />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="py-24 bg-gray-50/70 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
           <div className="text-center space-y-4 mb-20">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck size={13} /> The HCHOME Standard
              </div>
              <h2 className="text-4xl font-black tracking-tight text-gray-900">Why Choose Professionals?</h2>
              <p className="text-gray-500 font-medium tracking-tight">Experience and hygienic care matter when it comes to your family's health.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { icon: <Clock />, title: "30-Min Arrival", desc: "Our chefs arrive within 30 minutes of booking confirmation in Lucknow.", color: "bg-red-50 text-red-600 border-red-100" },
                { icon: <Heart />, title: "Personal Care", desc: "Meals tailored to your taste, dietary health, and family preferences.", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
                { icon: <ShieldCheck />, title: "Hygiene First", desc: "Strict hygiene protocols, fresh gloves, and sanitized cooking sessions.", color: "bg-red-50 text-red-600 border-red-100" },
                { icon: <CheckCircle2 />, title: "Verified Chefs", desc: "Background checked and professionally certified home culinary experts.", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
                { icon: <Utensils />, title: "Home-Style", desc: "Authentic taste of home cooking with minimal oil, pure spices & fresh veggies.", color: "bg-red-50 text-red-600 border-red-100" }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4 hover:shadow-xl hover:-translate-y-1 transition-all cursor-default"
                >
                   <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border", item.color)}>
                      {React.cloneElement(item.icon as React.ReactElement, { size: 28 })}
                   </div>
                   <h4 className="text-lg font-black text-gray-900">{item.title}</h4>
                   <p className="text-sm text-gray-500 leading-relaxed font-medium">{item.desc}</p>
                </motion.div>
              ))}
           </div>
        </div>
      </section>

      {/* About Us */}
      <section id="about" className="py-24 px-8">
        <div className="max-w-4xl mx-auto space-y-12">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-[2rem] flex items-center justify-center shrink-0 shadow-xl shadow-red-200">
                 <ChefHat size={40} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Our Heritage</span>
                <h2 className="text-5xl font-black tracking-tight text-gray-900">About HC Home Cooking</h2>
              </div>
           </div>
           <p className="text-2xl font-bold text-gray-700 leading-relaxed italic border-l-8 border-emerald-600 pl-8 bg-emerald-50/30 py-4 rounded-r-3xl">
              {configToUse.aboutUs}
           </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section id="vision" className="py-24 bg-[#0d0d0d] text-white">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-12">
             <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-white/5 p-12 rounded-[3.5rem] border border-red-500/20 space-y-6 relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
               <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30">
                  <Target size={32} />
               </div>
               <div className="space-y-1">
                 <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Our Purpose</span>
                 <h3 className="text-3xl font-black text-white">Our Mission</h3>
               </div>
               <p className="text-xl text-gray-300 font-medium leading-relaxed italic">
                  {configToUse.mission}
               </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-white/5 p-12 rounded-[3.5rem] border border-emerald-500/20 space-y-6 relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
               <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/30">
                  <Eye size={32} />
               </div>
               <div className="space-y-1">
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Future Growth</span>
                 <h3 className="text-3xl font-black text-white">Our Vision</h3>
               </div>
               <p className="text-xl text-gray-300 font-medium leading-relaxed italic">
                  {configToUse.vision}
               </p>
            </motion.div>
        </div>
      </section>

      {/* Director's Message */}
      <section id="director" className="py-32 px-8 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 className="relative group lg:order-2"
              >
                 <div className="absolute -inset-4 bg-emerald-600/10 rounded-[5rem] blur-2xl group-hover:bg-emerald-600/20 transition-all" />
                 <img 
                    src={configToUse.directorPhoto} 
                    alt="Director" 
                    className="relative w-full aspect-square object-cover rounded-[4rem] shadow-2xl z-10 grayscale hover:grayscale-0 transition-all duration-700 border-4 border-white" 
                 />
                 <div className="absolute -bottom-10 -right-10 bg-white p-8 rounded-[3rem] shadow-xl z-20 border border-gray-100 hidden md:block">
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-700 mb-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Director
                    </p>
                    <h4 className="text-xl font-black text-gray-900">{configToUse.directorName}</h4>
                 </div>
              </motion.div>

              <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 className="space-y-10 lg:order-1"
              >
                 <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">Word from Leadership</span>
                    <h2 className="text-5xl font-black tracking-tighter leading-tight text-gray-900">💬 Director’s Message</h2>
                 </div>
                 <div className="space-y-6 text-lg text-gray-600 font-medium leading-relaxed">
                    {configToUse.directorMessage?.split('\n').map((line: string, i: number) => (
                      <p key={i}>{line}</p>
                    ))}
                 </div>
                 <div className="pt-6 border-t border-gray-200">
                    <p className="text-xl font-black text-gray-900">— {configToUse.directorName}</p>
                    <p className="text-sm font-bold text-gray-500">Director, HC Home Cooking.</p>
                 </div>
              </motion.div>
           </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 px-8">
        <div className="max-w-7xl mx-auto">
           <div className="bg-gray-900 rounded-[4rem] p-12 md:p-20 text-white grid grid-cols-1 lg:grid-cols-2 gap-20 shadow-2xl border border-gray-800">
              <div className="space-y-12">
                 <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded-full text-[10px] font-black uppercase tracking-widest">
                      <Phone size={12} /> Direct Support
                    </div>
                    <h2 className="text-5xl font-black tracking-tight">Contact Us</h2>
                    <p className="text-gray-400 font-medium">Have questions? We're here to help you start your healthy journey in Lucknow.</p>
                 </div>
                 <div className="space-y-8">
                    <div className="flex items-center gap-6 group cursor-default">
                       <div className="w-16 h-16 bg-emerald-950/60 rounded-3xl flex items-center justify-center border border-emerald-700/50 group-hover:bg-emerald-600 transition-all text-emerald-400 group-hover:text-white">
                          <Phone size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phone & WhatsApp</p>
                          <p className="text-xl font-bold text-white">{configToUse.contactPhone}</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-6 group cursor-default">
                       <div className="w-16 h-16 bg-red-950/60 rounded-3xl flex items-center justify-center border border-red-700/50 group-hover:bg-red-600 transition-all text-red-400 group-hover:text-white">
                          <Mail size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</p>
                          <p className="text-xl font-bold text-white">{configToUse.contactEmail}</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-6 group cursor-default">
                       <div className="w-16 h-16 bg-emerald-950/60 rounded-3xl flex items-center justify-center border border-emerald-700/50 group-hover:bg-emerald-600 transition-all text-emerald-400 group-hover:text-white">
                          <MapPin size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Headquarters (Lucknow Only)</p>
                          <p className="text-lg font-bold leading-tight text-white">{configToUse.address}</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-white/5 rounded-[3rem] p-10 border border-white/10 space-y-8 backdrop-blur-sm">
                 <h3 className="text-2xl font-black text-white">Send us a Message</h3>
                 <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                    <div className="grid grid-cols-2 gap-4">
                       <input placeholder="Name" className="h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold focus:border-emerald-500 outline-none transition-all text-white placeholder-gray-500" />
                       <input placeholder="Phone" className="h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold focus:border-emerald-500 outline-none transition-all text-white placeholder-gray-500" />
                    </div>
                    <input placeholder="Subject" className="h-14 w-full bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold focus:border-emerald-500 outline-none transition-all text-white placeholder-gray-500" />
                    <textarea placeholder="Message" className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-6 text-sm font-bold focus:border-emerald-500 outline-none transition-all resize-none text-white placeholder-gray-500" />
                    <button className="w-full h-16 bg-gradient-to-r from-red-600 via-red-700 to-rose-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-600/30 flex items-center justify-center gap-3 hover:opacity-95 active:scale-95 transition-all border border-red-500/30">
                       Send Message <MessageSquare size={18} />
                    </button>
                 </form>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 px-8">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <AppLogo config={configToUse} size="md" />
            <div className="flex flex-wrap justify-center gap-8">
               <PolicyModal title="Privacy Policy" content={configToUse.privacyPolicy} />
               <PolicyModal title="Terms and Conditions" content={configToUse.termsAndConditions} />
               <PolicyModal title="Refund Policy" content={configToUse.refundPolicy} />
               <button 
                  onClick={() => setShowApkModal(true)}
                  className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:underline flex items-center gap-1"
               >
                  <Smartphone size={12} /> Install Mobile App
               </button>
            </div>
            <div className="flex flex-col items-center md:items-end gap-1.5 text-center md:text-right">
               <p className="text-[11px] font-bold text-gray-500">
                  Software has been developed by <span className="text-gray-900 font-black">Digital Communique Private Limited</span>.
               </p>
               <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">© 2026 HC Home Cooking | Lucknow, India</p>
            </div>
         </div>
      </footer>

      {/* APK Download Modal */}
      <ApkDownloadModal 
        isOpen={showApkModal}
        onClose={() => setShowApkModal(false)}
        config={configToUse}
      />
    </div>
  );
}

function PolicyModal({ title, content }: { title: string, content?: string }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900"
      >
        {title}
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }} 
               className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
               onClick={() => setIsOpen(false)} 
             />
             <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white w-full max-w-2xl max-h-[80vh] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col"
             >
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                   <h3 className="text-xl font-black">{title}</h3>
                   <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                      <XCircle size={24} />
                   </button>
                </div>
                <div className="p-8 overflow-y-auto text-sm text-gray-600 leading-loose font-medium whitespace-pre-wrap">
                   {content || `Our ${title} will be updated soon. Please check back later.`}
                </div>
                <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
                   <button onClick={() => setIsOpen(false)} className="bg-gray-900 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest">Close</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
