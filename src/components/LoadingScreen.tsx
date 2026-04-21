import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const LOADING_MESSAGES = [
  "Initializing Neural Pathways...",
  "Architecting Knowledge Grids...",
  "Optimizing Cognitive Engines...",
  "Sourcing Academic Archives...",
  "Syncing Scholastic Protocols...",
  "Calibrating HUB Systems..."
];

export const LoadingScreen = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#00f2ff22_0%,transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative flex flex-col items-center gap-12 max-w-sm w-full px-8">
        {/* Simple Animated Ring */}
        <div className="relative w-32 h-32">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-[1px] border-neon-blue rounded-full opacity-40 border-dashed"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 border-[1px] border-neon-pink rounded-full opacity-20 border-dashed"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-16 h-16 bg-neon-blue rounded-full blur-[40px]"
            />
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-3 h-3 bg-white rounded-full shadow-[0_0_20px_white] z-10"
            />
          </div>
        </div>

        <div className="space-y-8 text-center w-full">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-2"
          >
            <h1 className="text-white text-5xl sm:text-6xl font-black tracking-[0.2em] uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20 select-none drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              STUDY HUB
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/20" />
              <p className="text-[10px] text-white/30 tracking-[0.5em] font-black uppercase">Technical Excellence</p>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/20" />
            </div>
          </motion.div>

          <div className="space-y-6 w-full">
            <div className="relative w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-neon-blue to-transparent shadow-[0_0_20px_#00f2ff]"
              />
            </div>
            
            <div className="h-4">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={messageIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-white/40 text-[11px] uppercase font-mono tracking-[0.3em] font-medium"
                >
                  {LOADING_MESSAGES[messageIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Status */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-12 flex items-center gap-3"
      >
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        <span className="text-[8px] text-white/20 uppercase tracking-[0.8em] font-black">System Ready</span>
      </motion.div>
    </motion.div>
  );
};
