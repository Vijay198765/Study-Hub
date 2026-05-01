import React from 'react';
import { GraduationCap } from 'lucide-react';
import { cn, convertDriveUrl } from '../lib/utils';

interface LogoProps {
  logoUrl?: string;
  faviconUrl?: string;
  logoColor?: string;
  logoColorSecondary?: string;
  logoInnerColor?: string;
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Logo({ logoUrl, faviconUrl, logoColor, logoColorSecondary, logoInnerColor, className, iconClassName, size = 'md' }: LogoProps) {
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

  const displayUrl = logoUrl || faviconUrl;
  const primaryColor = logoColor || '#00f2ff'; // Default neon-blue
  const secondaryColor = logoColorSecondary || (logoColor ? `${logoColor}88` : '#bc13fe'); // Default neon-purple or faded primary
  const innerBgColor = logoInnerColor || '#0A0A0A'; // Default dark bg

  return (
    <div 
      className={cn(
        "rounded-xl p-[1px] transition-transform hover:scale-110 duration-500",
        sizeClasses[size],
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        boxShadow: `0 8px 25px -10px ${primaryColor}66`
      }}
    >
      <div 
        className="w-full h-full rounded-[11px] flex items-center justify-center overflow-hidden relative group"
        style={{ backgroundColor: innerBgColor }}
      >
        {/* Animated Glow effect */}
        <div 
          className="absolute inset-0 transition-opacity duration-1000 group-hover:opacity-100 opacity-50" 
          style={{ 
            background: `radial-gradient(circle at center, ${primaryColor}22 0%, transparent 70%)` 
          }}
        />
        
        {displayUrl ? (
          <img 
            src={convertDriveUrl(displayUrl)} 
            alt="Logo" 
            className="w-full h-full object-cover relative z-10 transition-transform duration-500 group-hover:scale-110" 
            referrerPolicy="no-referrer" 
            onError={(e) => {
              // Fallback if image fails to load
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement?.classList.add('show-fallback');
            }}
          />
        ) : null}
        
        {/* Fallback Icon */}
        <div className={cn(
          "relative z-10 flex items-center justify-center",
          displayUrl ? "hidden group-[.show-fallback]:flex" : "flex"
        )}
        >
          <GraduationCap 
            size={iconSizes[size]} 
            style={{ 
              color: logoColor || 'white',
              filter: `drop-shadow(0 0 8px ${primaryColor}44)` 
            }} 
          />
        </div>

        {/* Glossy overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-30 pointer-events-none" />
      </div>
    </div>
  );
}
