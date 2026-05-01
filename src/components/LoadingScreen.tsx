import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';
import { Scene } from './Loading3D';

const LOADING_MESSAGES = [
  "Initializing Neural Pathways...",
  "Architecting Knowledge Grids...",
  "Optimizing Cognitive Engines...",
  "Sourcing Academic Archives...",
  "Syncing Scholastic Protocols...",
  "Calibrating HUB Systems..."
];

export const LoadingScreen = ({ siteConfig }: { siteConfig?: any }) => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth < 768;
    return false;
  });
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
      clearInterval(interval);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: isCanvasReady ? 1 : 0, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <Canvas 
          shadows
          dpr={[1, isMobile ? 1.5 : 2]} 
          gl={{ antialias: !isMobile, alpha: true }}
          onCreated={({ gl }) => {
            gl.shadowMap.type = THREE.PCFShadowMap;
            setIsCanvasReady(true);
          }}
        >
          <Scene isMobile={isMobile} />
        </Canvas>
      </motion.div>
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-gradient-to-t from-neon-blue/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mt-auto mb-10 sm:mb-16 flex flex-col items-center gap-8 px-6 text-center w-full max-w-lg"
      >
        <div className="space-y-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent mb-4" />
            
            {/* Logo in Loading Screen */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mb-4"
            >
              <Logo 
                logoUrl={siteConfig?.logoUrl} 
                faviconUrl={siteConfig?.faviconUrl}
                logoColor={siteConfig?.logoColor}
                logoColorSecondary={siteConfig?.logoColorSecondary}
                size="lg" 
              />
            </motion.div>

            <motion.h1
              animate={{ 
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-white font-sans text-4xl sm:text-5xl font-black tracking-[0.25em] uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              {siteConfig?.siteName || 'STUDY HUB'}
            </motion.h1>
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent mt-4" />
          </motion.div>
        </div>

        <div className="flex flex-col items-center gap-6 w-full">
          <div className="w-full max-w-[280px] h-[3px] bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <motion.div 
              animate={{ 
                x: ["-100%", "100%"]
              }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/60 to-transparent shadow-[0_0_20px_white]"
            />
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <AnimatePresence mode="wait">
              <motion.p 
                key={messageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="text-neon-blue/80 text-[11px] uppercase font-mono tracking-[0.4em] font-medium"
              >
                {LOADING_MESSAGES[messageIndex]}
              </motion.p>
            </AnimatePresence>
            
            <motion.div
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-[9px] text-white/20 uppercase tracking-[0.6em] font-black"
            >
              System Online
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
