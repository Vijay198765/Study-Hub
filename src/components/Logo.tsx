import React from 'react';
import { GraduationCap } from 'lucide-react';
import { cn, convertDriveUrl } from '../lib/utils';

interface LogoProps {
  siteLogo?: string;
  faviconUrl?: string;
  logoColor?: string;
  logoColorSecondary?: string;
  logoColorTertiary?: string;
  logoInnerColor?: string;
  logoInnerColorSecondary?: string;
  logoInnerColorTertiary?: string;
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Logo({ 
  siteLogo,
  faviconUrl, 
  logoColor, 
  logoColorSecondary, 
  logoColorTertiary,
  logoInnerColor, 
  logoInnerColorSecondary,
  logoInnerColorTertiary,
  className, 
  iconClassName, 
  size = 'md' 
}: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48
  };

  const displayUrl = siteLogo || faviconUrl;
  
  // Border Gradient Colors
  const b1 = logoColor || '#00f2ff';
  const b2 = logoColorSecondary || '#bc13fe';
  const b3 = logoColorTertiary || '#ff00ff';
  
  // Inner Gradient Colors (Left Top to Right Bottom)
  const i1 = logoInnerColor || '#0A0A0A';
  const i2 = logoInnerColorSecondary || i1;
  const i3 = logoInnerColorTertiary || i1;

  if (displayUrl) {
    return (
      <div className={cn("relative flex items-center justify-center overflow-hidden", sizeClasses[size], className)}>
        <img 
          src={convertDriveUrl(displayUrl)} 
          alt="Logo" 
          className="w-full h-full object-contain relative z-10" 
          referrerPolicy="no-referrer" 
        />
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "rounded-xl p-[1px] transition-transform hover:scale-110 duration-500",
        sizeClasses[size],
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${b1} 0%, ${b2} 50%, ${b3} 100%)`,
        boxShadow: `0 8px 25px -10px ${b1}66`
      }}
    >
      <div 
        className="w-full h-full rounded-[11px] flex items-center justify-center overflow-hidden relative group"
        style={{ 
          background: `linear-gradient(135deg, ${i1} 0%, ${i2} 50%, ${i3} 100%)`
        }}
      >
        {/* Animated Glow effect */}
        <div 
          className="absolute inset-0 transition-opacity duration-1000 group-hover:opacity-100 opacity-50" 
          style={{ 
            background: `radial-gradient(circle at center, ${b1}22 0%, transparent 70%)` 
          }}
        />
        
        {/* Fallback Icon */}
        <div className="relative z-10 flex items-center justify-center">
          <GraduationCap 
            size={iconSizes[size]} 
            style={{ 
              color: logoColor || 'white',
              filter: `drop-shadow(0 0 8px ${b1}44)` 
            }} 
          />
        </div>

        {/* Glossy overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-30 pointer-events-none" />
      </div>
    </div>
  );
}
