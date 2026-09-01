import React from 'react';
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
          "relative bg-black shadow-md border border-gray-900 flex items-center justify-center overflow-hidden p-0.5 transition-transform group-hover:scale-105"
        )}>
          <img 
            src={config.logo} 
            alt="HC Home Cooking Logo" 
            className="w-full h-full object-contain rounded-lg"
            onError={(e) => {
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

  // Official HC Home Cooking Emblem Logo (Black Background + Red Circle + White HC)
  return (
    <div className={cn("flex items-center gap-3 select-none group", className)}>
      <div className="relative">
        <div className={cn(
          dim.box,
          "bg-black flex items-center justify-center text-white shadow-lg shadow-black/30 relative overflow-hidden transition-all duration-300 group-hover:scale-105 border border-zinc-800"
        )}>
          {/* Authentic HC Red Circle Emblem SVG */}
          <svg viewBox="0 0 100 100" className="w-full h-full p-0.5">
            {/* Red Circle with organic contour */}
            <circle cx="50" cy="46" r="38" fill="#FF2636" />
            {/* White handwritten HC */}
            <g fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 33 28 L 30 64" />
              <path d="M 27 46 L 47 43" />
              <path d="M 45 30 L 42 61" />
              <path d="M 68 31 C 58 27, 49 35, 51 47 C 52 57, 60 62, 70 57" strokeWidth="6.5" />
            </g>
            {/* White Home Cooking Subtitle */}
            <text x="50" y="94" textAnchor="middle" fill="#FFFFFF" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="10.5" letterSpacing="0.3">
              Home cooking
            </text>
          </svg>
        </div>

        {/* Verified green active badge */}
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm" />
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
