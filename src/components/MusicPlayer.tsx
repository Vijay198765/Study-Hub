import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MusicPlayerProps {
  urls: string[]; // Updated to support multiple URLs
  enabled: boolean;
}

export default function MusicPlayer({ urls = [], enabled }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Get valid urls
  const validUrls = (urls || []).filter(url => url && url.startsWith('http'));
  const currentUrl = validUrls[currentTrackIndex] || '';

  useEffect(() => {
    // Basic interaction listener to overcome browser autoplay blocks
    const handleInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        if (enabled && currentUrl) {
          playAudio();
        }
      }
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('scroll', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
    };
  }, [enabled, currentUrl, hasInteracted]);

  const playAudio = () => {
    if (audioRef.current && enabled && currentUrl) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(e => {
        console.warn("BGM Play auto-blocked by browser (waiting for interaction):", e);
      });
    }
  };

  useEffect(() => {
    if (!currentUrl || !enabled) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(currentUrl);
      audioRef.current.loop = false; // We use onEnded to cycle
      audioRef.current.volume = 0.3;
      
      audioRef.current.onended = () => {
        if (validUrls.length > 1) {
          setCurrentTrackIndex((prev) => (prev + 1) % validUrls.length);
        } else {
          audioRef.current?.play();
        }
      };
    } else if (audioRef.current.src !== currentUrl) {
      audioRef.current.src = currentUrl;
      if (isPlaying) playAudio();
    }

    // Try to play if enabled
    if (enabled && (isPlaying || hasInteracted)) {
      playAudio();
    }

  }, [currentUrl, enabled, isPlaying, hasInteracted, validUrls.length]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => {
        console.error("BGM Play blocked or error:", e);
      });
    }
    setIsPlaying(!isPlaying);
    setHasInteracted(true);
  };

  if (!enabled || !currentUrl) return null;

  return (
    <motion.div 
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed bottom-24 right-6 z-[60]"
    >
      <button 
        onClick={togglePlay}
        className={`relative group flex items-center gap-3 bg-dark-bg/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl transition-all duration-500 hover:border-neon-blue/40 ${isPlaying ? 'pr-6' : 'pr-4'}`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isPlaying ? 'bg-neon-blue text-black shadow-[0_0_20px_rgba(0,229,255,0.4)] rotate-[360deg]' : 'bg-white/5 text-white/40'}`}>
          {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </div>
        
        {isPlaying && (
          <div className="flex flex-col items-start overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-blue animate-pulse">Live BGM</span>
            <div className="flex gap-1 mt-1">
              {[...Array(4)].map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ height: [4, 12, 4] }}
                  transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                  className="w-0.5 bg-neon-blue rounded-full"
                />
              ))}
            </div>
          </div>
        )}

        {!isPlaying && (
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-white/40 transition-colors">Play Music</span>
        )}

        {/* Hover label */}
        <div className="absolute bottom-full right-0 mb-3 bg-dark-bg border border-white/10 px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
           <p className="text-[9px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
             <Music size={10} className="text-neon-blue" />
             Ambient Soundscape
           </p>
        </div>
      </button>
    </motion.div>
  );
}
