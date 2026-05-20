import React from 'react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { ExternalLink, Maximize2 } from 'lucide-react';

export default function Explorer() {
  return (
    <div className="min-h-screen bg-transparent pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>COSMOS — Solar System Explorer</title>
      </Helmet>
      
      <div className="max-w-7xl mx-auto h-[calc(100vh-180px)] sm:h-[calc(100vh-160px)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 sm:p-3 bg-neon-blue/10 rounded-xl sm:rounded-2xl border border-neon-blue/20">
              <Maximize2 className="text-neon-blue size-5 sm:size-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight italic">COSMOS Explorer</h1>
              <p className="text-[10px] sm:text-sm text-white/40 uppercase tracking-widest font-black">Navigate the Infinite</p>
            </div>
          </div>
          
          <button 
            onClick={() => window.open('/explorer.html', '_blank')}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl sm:rounded-2xl border border-white/10 transition-all font-bold text-xs sm:text-sm"
          >
            <ExternalLink className="size-4 sm:size-[18px]" />
            Full Screen
          </button>
        </div>

        <div className="w-full h-full rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/10 overflow-hidden bg-black/40 shadow-2xl relative group">
          <div className="absolute inset-0 bg-neon-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <iframe 
            src="/explorer.html" 
            className="w-full h-full border-none"
            title="COSMOS Explorer"
            allow="fullscreen"
          />
        </div>
      </div>
    </div>
  );
}
