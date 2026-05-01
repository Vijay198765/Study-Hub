import React from 'react';
import { GraduationCap } from 'lucide-react';
import { cn, convertDriveUrl } from '../lib/utils';

interface LogoProps {
  siteLogo?: string;
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Logo({ siteLogo, className, iconClassName, size = 'md' }: LogoProps) {
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
        
        {siteLogo ? (
          <img 
            src={convertDriveUrl(siteLogo)} 
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
        
        {/* Fallback Icon / Custom SVG Logo */}
        <div className={cn(
          "relative z-10 flex items-center justify-center",
          siteLogo ? "hidden group-[.show-fallback]:flex" : "flex"
        )}>
          <svg 
            width={iconSizes[size]} 
            height={iconSizes[size]} 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={cn("text-white", iconClassName)}
          >
            {/* Professional School/Academic Logo SVG */}
            <path d="M50 15L15 35L50 55L85 35L50 15Z" fill="currentColor" fillOpacity="0.2" stroke="white" strokeWidth="4" strokeLinejoin="round" />
            <path d="M15 35V65C15 65 30 75 50 75C70 75 85 65 85 65V35" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M50 55V85" stroke="white" strokeWidth="4" strokeLinecap="round" />
            <path d="M50 15L20 32" stroke="#00f2ff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="50" cy="40" r="15" stroke="#00f2ff" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
        </div>
      </div>
    </div>
  );
}
