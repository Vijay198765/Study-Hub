import React, { useEffect, useRef, useState } from "react";
import socket from "../lib/socket";
import { Play, Pause, Music } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const MusicPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [musicState, setMusicState] = useState<any>(null);
  const [userPaused, setUserPaused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    socket.on("musicStateUpdate", (state) => {
      setMusicState(state);
    });

    return () => {
      socket.off("musicStateUpdate");
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current || !musicState || !musicState.isEnabled) return;

    const audio = audioRef.current;

    // Sync URL
    if (audio.src !== musicState.url && musicState.url) {
      audio.src = musicState.url;
      audio.load();
    }

    // Sync Playback
    if (musicState.isPlaying && !userPaused && hasInteracted) {
      audio.play().catch((err) => {
        console.warn("Autoplay blocked or error:", err);
      });
    } else {
      audio.pause();
    }
  }, [musicState, userPaused, hasInteracted]);

  const toggleUserPlayback = () => {
    if (!hasInteracted) setHasInteracted(true);
    setUserPaused(!userPaused);
  };

  // Initial interaction to enable audio
  const handleInitialInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      if (audioRef.current && musicState?.isPlaying && !userPaused) {
        audioRef.current.play().catch(console.error);
      }
    }
  };

  if (!musicState || !musicState.isEnabled) return null;

  return (
    <>
      <audio ref={audioRef} loop />
      
      {/* Invisible overlay for initial interaction if needed */}
      {!hasInteracted && (
        <div 
          onClick={handleInitialInteraction}
          className="fixed inset-0 z-[9998] cursor-pointer"
        />
      )}

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[9999]"
        >
          <button
            onClick={toggleUserPlayback}
            className={`group relative p-4 rounded-full shadow-2xl transition-all duration-500 flex items-center justify-center ${
              userPaused 
                ? 'bg-zinc-900 text-zinc-400 border border-zinc-800' 
                : 'bg-zinc-100 text-zinc-950 border border-white'
            }`}
          >
            {/* Pulsing effect when playing */}
            {!userPaused && musicState.isPlaying && (
              <span className="absolute inset-0 rounded-full bg-zinc-100/20 animate-ping" />
            )}
            
            <div className="relative z-10">
              {userPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
            </div>

            {/* Tooltip-like label */}
            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              <span className="text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                <Music className="w-3 h-3 text-orange-500" />
                {userPaused ? 'Resume Music' : 'Pause Music'}
              </span>
            </div>
          </button>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default MusicPlayer;
