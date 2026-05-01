import React from 'react';
import { GraduationCap } from 'lucide-react';
import { cn, convertDriveUrl } from '../lib/utils';

interface LogoProps {
  logoUrl?: string;
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Logo({ logoUrl, className, iconClassName, size = 'md' }: LogoProps) {
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

  return (
    <div className={cn(
      "rounded-xl bg-gradient-to-br from-neon-blue via-neon-purple to-neon-pink p-[1px] shadow-lg shadow-neon-blue/20 transition-transform hover:scale-105",
      sizeClasses[size],
      className
    )}>
      <div className="w-full h-full rounded-[11px] bg-dark-bg flex items-center justify-center overflow-hidden relative group">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-neon-blue/5 group-hover:bg-neon-blue/10 transition-colors" />
        
        {logoUrl ? (
          <img 
            src={convertDriveUrl(logoUrl)} 
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
          "relative z-10 flex items-center justify-center text-white",
          logoUrl ? "hidden group-[.show-fallback]:flex" : "flex"
        )}>
          <GraduationCap size={iconSizes[size]} />
        </div>
      </div>
    </div>
  );
}
