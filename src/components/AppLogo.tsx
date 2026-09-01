import React from 'react';
import { ChefHat, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { AppConfig } from '../types';

interface AppLogoProps {
  config?: AppConfig | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'auto';
  showSubtitle?: boolean;
}

export default function AppLogo({
  config,
  className,
  size = 'md',
  variant = 'auto',
  showSubtitle = true
}: AppLogoProps) {
  const iconSizes = {
    sm: { box: 'w-8 h-8 rounded-lg', icon: 16, title: 'text-sm', sub: 'text-[8px]', star: 8 },
    md: { box: 'w-10 h-10 rounded-xl', icon: 20, title: 'text-base', sub: 'text-[9px]', star: 10 },
    lg: { box: 'w-14 h-14 rounded-2xl', icon: 28, title: 'text-xl', sub: 'text-[10px]', star: 12 },
    xl: { box: 'w-20 h-20 rounded-3xl', icon: 40, title: 'text-3xl', sub: 'text-xs', star: 16 },
  };

  const dim = iconSizes[size];

  // If custom logo image URL is configured by Admin
  if (config?.logo && config.logo.trim() !== '') {
    return (
      <div className={cn("flex items-center gap-3 group", className)}>
        <div className={cn(
          dim.box,
          "relative bg-white shadow-md border border-gray-100 flex items-center justify-center overflow-hidden p-1 transition-transform group-hover:scale-105"
        )}>
          <img 
            src={config.logo} 
            alt="HC Home Cooking Logo" 
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback to vector icon if custom image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div className="flex flex-col">
          <span className={cn(
            "font-black tracking-tighter leading-none text-gray-900",
            dim.title,
            variant === 'dark' && 'text-white'
          )}>
            HC HOME
          </span>
          {showSubtitle && (
            <span className={cn(
              "font-black tracking-widest leading-none text-red-600 uppercase mt-0.5",
              dim.sub
            )}>
              Cooking Services
            </span>
          )}
        </div>
      </div>
    );
  }

// Modern Vector Emblem Logo
  return (
    <div className={cn("flex items-center gap-3 select-none group", className)}>
      <div className="relative">
        <div className={cn(
          dim.box,
          "bg-gradient-to-br from-red-600 via-red-700 to-rose-800 flex items-center justify-center text-white shadow-lg shadow-red-500/25 relative overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-red-500/40 border border-red-400/30"
        )}>
          {/* Subtle decorative inner sheen */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/20 pointer-events-none" />
          
          <ChefHat size={dim.icon} className="relative z-10 drop-shadow-sm transition-transform group-hover:rotate-[-6deg]" />
          
          {/* Fresh Emerald Green accent sparkle */}
          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
        </div>

        {/* Verified Emerald green badge dot */}
        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
          <div className="w-1 h-1 bg-white rounded-full" />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "font-black tracking-tighter leading-none text-gray-900",
            dim.title,
            variant === 'dark' && 'text-white'
          )}>
            HC HOME
          </span>
          <span className="inline-flex items-center px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-300/80 rounded text-[8px] font-black tracking-tight uppercase">
            PRO
          </span>
        </div>
        {showSubtitle && (
          <span className={cn(
            "font-black tracking-[0.18em] leading-none text-red-600 uppercase mt-0.5",
            dim.sub
          )}>
            Cooking Services
          </span>
        )}
      </div>
    </div>
  );
}
