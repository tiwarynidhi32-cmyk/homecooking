import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Pause, 
  Play, 
  Maximize2, 
  X, 
  ExternalLink,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { BannerSlide } from '../types';
import { cn } from '../lib/utils';
// @ts-ignore
import officialBannerImage from '../assets/images/hchome_official_banner_1788236680661.jpg';
// @ts-ignore
import indianHomeChefImage from '../assets/images/indian_home_chef_1781542950747.jpg';

interface BannerSliderProps {
  banners?: BannerSlide[] | null;
  defaultBannerUrl?: string;
  defaultBannerType?: 'image' | 'video' | 'gif';
  autoplayInterval?: number;
  showControls?: boolean;
  showDots?: boolean;
  showBadge?: boolean;
  className?: string;
  maxHeight?: string;
  title?: string;
  subtitle?: string;
  onBannerClick?: (banner: BannerSlide) => void;
  badgeLabel?: string;
}

export default function BannerSlider({
  banners,
  defaultBannerUrl,
  defaultBannerType = 'image',
  autoplayInterval = 4500,
  showControls = true,
  showDots = true,
  showBadge = true,
  className,
  maxHeight = 'max-h-[580px]',
  title,
  subtitle,
  onBannerClick,
  badgeLabel = 'Promotions & Notices'
}: BannerSliderProps) {
  // Build effective slides list
  const activeSlides: BannerSlide[] = React.useMemo(() => {
    if (banners && banners.length > 0) {
      const filtered = banners.filter(b => b.active !== false && b.url);
      if (filtered.length > 0) return filtered;
    }
    
    // Fallback default slides
    const fallbackList: BannerSlide[] = [];
    if (defaultBannerUrl) {
      fallbackList.push({
        id: 'default_1',
        url: defaultBannerUrl,
        type: defaultBannerType,
        title: 'HC Home Cooking Lucknow',
        subtitle: 'Homemade Taste, Made with Care',
        active: true
      });
    } else {
      fallbackList.push({
        id: 'official_1',
        url: officialBannerImage,
        type: 'image',
        title: 'HC Home Cooking Lucknow',
        subtitle: 'Homemade Taste, Made with Care • Book Verified Home Chefs',
        active: true
      });
      fallbackList.push({
        id: 'official_2',
        url: indianHomeChefImage,
        type: 'image',
        title: 'Verified Home Chefs at ₹3/min',
        subtitle: 'Arrives within 30 mins • 100% Hygienic & Fresh Spices',
        active: true
      });
    }
    return fallbackList;
  }, [banners, defaultBannerUrl, defaultBannerType]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  
  // Touch swipe handling
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // Auto-slide effect
  useEffect(() => {
    if (activeSlides.length <= 1 || isPaused || isHovered) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, autoplayInterval);

    return () => clearInterval(timer);
  }, [activeSlides.length, isPaused, isHovered, autoplayInterval]);

  // Wrap index safely
  useEffect(() => {
    if (currentIndex >= activeSlides.length) {
      setCurrentIndex(0);
    }
  }, [activeSlides.length, currentIndex]);

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  const prevSlide = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1));
  }, [activeSlides.length]);

  const nextSlide = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  }, [activeSlides.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 45;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const currentSlide = activeSlides[currentIndex] || activeSlides[0];

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.98
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.35 }
      }
    },
    exit: (dir: number) => ({
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.25 }
      }
    })
  };

  if (!currentSlide) return null;

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Optional Title Header */}
      {(title || subtitle) && (
        <div className="flex items-center justify-between px-1">
          <div>
            {title && <h3 className="font-black text-gray-900 text-base md:text-lg">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 font-medium">{subtitle}</p>}
          </div>
          {activeSlides.length > 1 && showBadge && (
            <span className="text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 px-2.5 py-1 rounded-full border border-red-200 flex items-center gap-1">
              <Sparkles size={11} /> {currentIndex + 1} / {activeSlides.length}
            </span>
          )}
        </div>
      )}

      {/* Main Banner Container - 100% UNCROPPED, NATURAL FITTING */}
      <div 
        id="main-banner-slider-container"
        className="relative rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-200/90 bg-[#faf7f2] group select-none transition-all"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slide Display Area */}
        <div className="relative w-full flex items-center justify-center min-h-[160px] sm:min-h-[220px] md:min-h-[300px] overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentSlide.id || `${currentIndex}_${currentSlide.url}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full flex items-center justify-center p-1 sm:p-2"
              onClick={() => {
                if (onBannerClick) onBannerClick(currentSlide);
              }}
            >
              {currentSlide.type === 'video' ? (
                <video
                  src={currentSlide.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className={cn(
                    "w-full h-auto object-contain block mx-auto rounded-xl md:rounded-[2rem] shadow-sm",
                    maxHeight
                  )}
                />
              ) : (
                <img
                  src={currentSlide.url}
                  alt={currentSlide.title || "HCHOME Banner Slide"}
                  className={cn(
                    "w-full h-auto object-contain block mx-auto rounded-xl md:rounded-[2rem] shadow-sm pointer-events-none select-none",
                    maxHeight
                  )}
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Slide Navigation Arrows */}
          {activeSlides.length > 1 && showControls && (
            <>
              <button
                id="banner-slider-prev-btn"
                type="button"
                onClick={prevSlide}
                aria-label="Previous Slide"
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-12 md:h-12 rounded-full bg-black/40 md:bg-black/50 hover:bg-red-600 text-white backdrop-blur-md flex items-center justify-center shadow-lg transition-all duration-200 opacity-80 md:opacity-0 group-hover:opacity-100 active:scale-90 z-20 cursor-pointer border border-white/20"
              >
                <ChevronLeft size={22} className="md:w-6 md:h-6" />
              </button>

              <button
                id="banner-slider-next-btn"
                type="button"
                onClick={nextSlide}
                aria-label="Next Slide"
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-12 md:h-12 rounded-full bg-black/40 md:bg-black/50 hover:bg-red-600 text-white backdrop-blur-md flex items-center justify-center shadow-lg transition-all duration-200 opacity-80 md:opacity-0 group-hover:opacity-100 active:scale-90 z-20 cursor-pointer border border-white/20"
              >
                <ChevronRight size={22} className="md:w-6 md:h-6" />
              </button>
            </>
          )}

          {/* Top Right Actions: Fullscreen & Pause / Play */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
            {activeSlides.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused(!isPaused);
                }}
                title={isPaused ? "Resume Auto-slide" : "Pause Auto-slide"}
                className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-70 hover:opacity-100 border border-white/10"
              >
                {isPaused ? <Play size={12} /> : <Pause size={12} />}
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenImage(currentSlide.url);
              }}
              title="View Full Resolution Graphic"
              className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-70 hover:opacity-100 border border-white/10"
            >
              <Maximize2 size={12} />
            </button>
          </div>

          {/* Top Left Slide Badge */}
          {activeSlides.length > 1 && showBadge && (
            <div className="absolute top-3 left-3 z-20">
              <span className="text-[10px] font-black uppercase tracking-wider bg-black/60 text-white px-3 py-1 rounded-full backdrop-blur-md border border-white/20 shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {currentIndex + 1} of {activeSlides.length}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Slide Indicators (Dots & Links) */}
        {activeSlides.length > 1 && showDots && (
          <div className="py-2.5 px-4 bg-gradient-to-t from-black/15 via-transparent to-transparent flex items-center justify-center gap-2">
            {activeSlides.map((slide, idx) => (
              <button
                key={slide.id || idx}
                type="button"
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={cn(
                  "h-2 rounded-full transition-all duration-300 cursor-pointer",
                  idx === currentIndex 
                    ? "w-8 bg-red-600 shadow-md shadow-red-600/30" 
                    : "w-2 bg-gray-300 hover:bg-gray-400"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen High-Resolution Image Preview Modal */}
      <AnimatePresence>
        {fullscreenImage && (
          <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4"
            onClick={() => setFullscreenImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-6xl max-h-[92vh] w-full flex flex-col items-center justify-center bg-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setFullscreenImage(null)}
                className="absolute -top-12 right-0 text-white hover:text-red-400 bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md transition-all cursor-pointer"
              >
                <X size={24} />
              </button>
              
              <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-[#faf7f2] w-full flex items-center justify-center p-2">
                <img 
                  src={fullscreenImage} 
                  alt="Full Banner Resolution" 
                  className="w-full h-auto max-h-[85vh] object-contain rounded-2xl" 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
