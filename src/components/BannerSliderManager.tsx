import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Link, 
  Sparkles, 
  Save, 
  RotateCcw, 
  Clock, 
  Film, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AppConfig, BannerSlide } from '../types';
import BannerSlider from './BannerSlider';
import { cn } from '../lib/utils';
// @ts-ignore
import officialBannerImage from '../assets/images/hchome_official_banner_1788236680661.jpg';
// @ts-ignore
import indianHomeChefImage from '../assets/images/indian_home_chef_1781542950747.jpg';

interface BannerSliderManagerProps {
  config: AppConfig;
  onSave: (updatedConfig: Partial<AppConfig>) => Promise<void> | void;
}

export default function BannerSliderManager({ config, onSave }: BannerSliderManagerProps) {
  const [banners, setBanners] = useState<BannerSlide[]>(() => {
    if (config.banners && config.banners.length > 0) {
      return config.banners;
    }
    return [
      {
        id: 'banner_1',
        url: config.homeBannerUrl || officialBannerImage,
        type: config.homeBannerType || 'image',
        title: 'HC Home Cooking Lucknow',
        subtitle: 'Homemade Taste, Made with Care',
        active: true
      },
      {
        id: 'banner_2',
        url: indianHomeChefImage,
        type: 'image',
        title: 'Verified Home Chefs at ₹3/min',
        subtitle: 'Arrives in 30 minutes with strict hygiene',
        active: true
      }
    ];
  });

  const [autoplayInterval, setAutoplayInterval] = useState<number>(config.bannerAutoplayInterval || 4500);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageTitle, setNewImageTitle] = useState('');
  const [newImageSubtitle, setNewImageSubtitle] = useState('');

  // Handle multi-image file uploads
  const handleMultipleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const isVideo = file.type.startsWith('video');
      const isGif = file.type === 'image/gif';
      const reader = new FileReader();

      reader.onload = (loadEvt) => {
        const resultUrl = loadEvt.target?.result as string;
        if (resultUrl) {
          const newSlide: BannerSlide = {
            id: `slide_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            url: resultUrl,
            type: isVideo ? 'video' : isGif ? 'gif' : 'image',
            title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
            subtitle: 'Uploaded Banner Slide',
            active: true
          };
          setBanners(prev => [...prev, newSlide]);
        }
      };

      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Add slide via URL
  const handleAddByUrl = () => {
    if (!newImageUrl.trim()) return;
    const isVideo = newImageUrl.endsWith('.mp4') || newImageUrl.endsWith('.webm');
    const isGif = newImageUrl.endsWith('.gif');

    const newSlide: BannerSlide = {
      id: `slide_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      url: newImageUrl.trim(),
      type: isVideo ? 'video' : isGif ? 'gif' : 'image',
      title: newImageTitle.trim() || 'Custom Banner Slide',
      subtitle: newImageSubtitle.trim() || '',
      active: true
    };

    setBanners(prev => [...prev, newSlide]);
    setNewImageUrl('');
    setNewImageTitle('');
    setNewImageSubtitle('');
  };

  // Move slide position
  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= banners.length) return;
    const updated = [...banners];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setBanners(updated);
  };

  // Toggle active status
  const toggleSlideActive = (id: string) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };

  // Delete slide
  const deleteSlide = (id: string) => {
    if (banners.length <= 1) {
      alert("At least one banner must remain in the system.");
      return;
    }
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  // Reset to default banners
  const resetToDefault = () => {
    if (confirm("Reset banner slider to official Lucknow HCHOME templates?")) {
      const defaults: BannerSlide[] = [
        {
          id: 'banner_1',
          url: officialBannerImage,
          type: 'image',
          title: 'HC Home Cooking Lucknow',
          subtitle: 'Homemade Taste, Made with Care',
          active: true
        },
        {
          id: 'banner_2',
          url: indianHomeChefImage,
          type: 'image',
          title: 'Verified Home Chefs at ₹3/min',
          subtitle: 'Arrives in 30 minutes with strict hygiene',
          active: true
        }
      ];
      setBanners(defaults);
      setAutoplayInterval(4500);
    }
  };

  // Save all banner slider changes
  const handleSaveBanners = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const primaryBanner = banners.find(b => b.active) || banners[0];
      await onSave({
        banners,
        bannerAutoplayInterval: autoplayInterval,
        homeBannerUrl: primaryBanner?.url || config.homeBannerUrl,
        homeBannerType: primaryBanner?.type || 'image'
      });
      setSaveMessage("Banner Slider settings saved and broadcasted successfully!");
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      alert(err?.message || "Failed to save banner slider configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-red-50 text-red-600 rounded-xl">
              <Sparkles size={20} />
            </span>
            <h3 className="text-xl md:text-2xl font-black text-gray-900">
              Banner & Slider Management
            </h3>
          </div>
          <p className="text-xs text-gray-500 font-bold mt-1">
            Upload multiple banner slides for Admin, Chef & User Panels. 100% natural resolution without cropping.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetToDefault}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw size={14} /> Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSaveBanners}
            disabled={isSaving}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {saveMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-black flex items-center gap-2"
        >
          <CheckCircle2 size={18} className="text-emerald-600" />
          {saveMessage}
        </motion.div>
      )}

      {/* Live Slider Preview (No Crop Guaranteed) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-widest text-gray-700 flex items-center gap-2">
            <Eye size={14} className="text-red-600" /> Live Interactive Preview ({banners.filter(b => b.active).length} Active Slides)
          </label>
          <span className="text-[10px] font-bold text-gray-400">
            Previewing at {autoplayInterval / 1000}s autoplay interval
          </span>
        </div>

        <BannerSlider
          banners={banners}
          autoplayInterval={autoplayInterval}
          showControls={true}
          showDots={true}
          showBadge={true}
        />
      </div>

      {/* Multi-Image Upload Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
        {/* Upload Multiple Files (Drag & Drop or File Select) */}
        <div className="p-6 bg-red-50/40 rounded-3xl border-2 border-dashed border-red-200 text-center flex flex-col items-center justify-center space-y-3 relative group hover:bg-red-50/70 transition-all">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <Upload size={26} />
          </div>
          <div>
            <h4 className="font-black text-sm text-gray-900">Upload Multiple Banners</h4>
            <p className="text-[11px] text-gray-500 mt-1">
              Select 1 or more images/videos (PNG, JPG, WEBP, GIF, MP4). No height crop applied.
            </p>
          </div>
          <label className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md transition-all active:scale-95 flex items-center gap-2">
            <Plus size={14} /> Select Images / Videos
            <input 
              type="file" 
              multiple 
              accept="image/*,video/*" 
              className="hidden" 
              onChange={handleMultipleFileUpload}
            />
          </label>
        </div>

        {/* Add via URL */}
        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-200/80 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="font-black text-sm text-gray-900 flex items-center gap-2">
              <Link size={16} className="text-gray-500" /> Add Banner from URL
            </h4>
            <input 
              type="url" 
              placeholder="Paste Image / Video URL (https://...)" 
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="w-full h-11 px-4 bg-white rounded-xl border border-gray-200 text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                placeholder="Slide Title (optional)" 
                value={newImageTitle}
                onChange={(e) => setNewImageTitle(e.target.value)}
                className="w-full h-10 px-3 bg-white rounded-xl border border-gray-200 text-[11px] font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500"
              />
              <input 
                type="text" 
                placeholder="Subtitle (optional)" 
                value={newImageSubtitle}
                onChange={(e) => setNewImageSubtitle(e.target.value)}
                className="w-full h-10 px-3 bg-white rounded-xl border border-gray-200 text-[11px] font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddByUrl}
            disabled={!newImageUrl.trim()}
            className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Add Slide to Carousel
          </button>
        </div>
      </div>

      {/* Slider Configuration Controls */}
      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Clock size={20} className="text-gray-500" />
          <div>
            <h5 className="text-xs font-black text-gray-900">Autoplay Transition Speed</h5>
            <p className="text-[10px] text-gray-500 font-medium">How long each slide stays visible before transitioning.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[
            { label: '3 Seconds', value: 3000 },
            { label: '4.5 Seconds', value: 4500 },
            { label: '7 Seconds', value: 7000 },
            { label: '10 Seconds', value: 10000 }
          ].map((spd) => (
            <button
              key={spd.value}
              type="button"
              onClick={() => setAutoplayInterval(spd.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer",
                autoplayInterval === spd.value 
                  ? "bg-red-600 text-white shadow-sm" 
                  : "bg-white text-gray-600 hover:bg-gray-200 border border-gray-200"
              )}
            >
              {spd.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slide Items List (Reorder, Toggle Active, Edit, Delete) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-700">
            Current Slides in Queue ({banners.length})
          </h4>
          <span className="text-[11px] font-bold text-gray-400">
            Use arrows to change display order
          </span>
        </div>

        <div className="space-y-3">
          {banners.map((slide, index) => (
            <div 
              key={slide.id || index}
              className={cn(
                "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4",
                slide.active 
                  ? "bg-white border-gray-200 shadow-sm" 
                  : "bg-gray-50/70 border-gray-200/60 opacity-60"
              )}
            >
              {/* Media Thumbnail & Details */}
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 font-black text-xs flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </div>

                <div className="w-24 h-14 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 flex items-center justify-center">
                  {slide.type === 'video' ? (
                    <video src={slide.url} className="w-full h-full object-contain" muted />
                  ) : (
                    <img src={slide.url} alt={slide.title} className="w-full h-full object-contain" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 px-2 py-0.5 rounded-md">
                      {slide.type || 'IMAGE'}
                    </span>
                    <h5 className="font-bold text-sm text-gray-900 line-clamp-1">{slide.title || `Slide #${index + 1}`}</h5>
                  </div>
                  {slide.subtitle && (
                    <p className="text-xs text-gray-500 line-clamp-1">{slide.subtitle}</p>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 justify-end">
                {/* Move Up */}
                <button
                  type="button"
                  onClick={() => moveSlide(index, 'up')}
                  disabled={index === 0}
                  title="Move Up"
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp size={14} />
                </button>

                {/* Move Down */}
                <button
                  type="button"
                  onClick={() => moveSlide(index, 'down')}
                  disabled={index === banners.length - 1}
                  title="Move Down"
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown size={14} />
                </button>

                {/* Toggle Active */}
                <button
                  type="button"
                  onClick={() => toggleSlideActive(slide.id)}
                  title={slide.active ? "Hide from Live Slider" : "Show in Live Slider"}
                  className={cn(
                    "px-3 h-8 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer",
                    slide.active 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" 
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  )}
                >
                  {slide.active ? <Eye size={13} /> : <EyeOff size={13} />}
                  {slide.active ? "Active" : "Hidden"}
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => deleteSlide(slide.id)}
                  title="Delete Slide"
                  className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
