import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function Watermark() {
  const { theme } = useTheme();
  
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] select-none flex items-center justify-center overflow-hidden p-4">
      <div 
        className="font-display font-black text-white tracking-tighter text-center break-words max-w-full"
        style={{ 
          fontSize: 'min(15vw, 180px)',
          opacity: theme.watermarkOpacity,
          transform: `rotate(${theme.watermarkRotate}deg)`,
          filter: 'blur(0.5px)',
          lineHeight: 1
        }}
      >
        {theme.watermarkText}
      </div>
    </div>
  );
}
