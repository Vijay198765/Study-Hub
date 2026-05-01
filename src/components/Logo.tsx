import React from 'react';
import { GraduationCap } from 'lucide-react';
import { cn, convertDriveUrl } from '../lib/utils';

interface LogoProps {
  logoUrl?: string;
  faviconUrl?: string;
  logoColor?: string;
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Logo({ logoUrl, faviconUrl, logoColor, className, iconClassName, size = 'md' }: LogoProps) {
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

  return (
    <div 
      className={cn(
        "rounded-xl p-[1px] transition-transform hover:scale-105",
        sizeClasses[size],
        className
      )}
      style={{
        background: logoColor 
          ? `linear-gradient(135deg, ${logoColor}, ${logoColor}88)`
          : undefined,
        boxShadow: `0 4px 20px -5px ${primaryColor}44`
      }}
    >
      <div 
        className={cn(
          "w-full h-full rounded-[11px] bg-dark-bg flex items-center justify-center overflow-hidden relative group",
          !logoColor && "bg-gradient-to-br from-neon-blue via-neon-purple to-neon-pink p-[1px]" ? "" : ""
        )}
        style={{
          background: logoColor ? undefined : undefined // Keep default layout
        }}
      >
        {/* Glow effect */}
        <div 
          className="absolute inset-0 transition-colors" 
          style={{ backgroundColor: `${primaryColor}11` }}
        />
        
        {displayUrl ? (
          <img 
            src={convertDriveUrl(displayUrl)} 
            alt="Logo" 
            className="w-full h-full object-cover relative z-10" 
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
        style={{ color: logoColor || 'white' }}
        >
          <GraduationCap size={iconSizes[size]} />
        </div>
      </div>
    </div>
  );
}
