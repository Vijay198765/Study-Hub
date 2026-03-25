import React, { useState, useEffect, useRef } from 'react';
import { Music as MusicIcon, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Settings } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface MusicTrack {
  id: string;
  title: string;
  url: string;
}

export default function MusicPlayer({ user }: { user: any }) {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [globalTrackId, setGlobalTrackId] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasAutoPlayed = useRef(false);

  useEffect(() => {
    const handleToggle = () => setShowSettings(prev => !prev);
    window.addEventListener('toggle-music', handleToggle);
    return () => window.removeEventListener('toggle-music', handleToggle);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'music'), orderBy('createdAt', 'desc'));
    const unsubMusic = onSnapshot(q, (snapshot) => {
      const musicData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MusicTrack));
      setTracks(musicData);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setGlobalTrackId(snapshot.data().globalAutoPlayTrackId);
      }
    });

    return () => {
      unsubMusic();
      unsubSettings();
    };
  }, []);

  // Separate effect to handle initial auto-play once tracks and settings are loaded
  useEffect(() => {
    if (tracks.length > 0 && !hasAutoPlayed.current) {
      const targetTrackId = user?.preferredMusicId || globalTrackId;
      
      if (targetTrackId) {
        const idx = tracks.findIndex(t => t.id === targetTrackId);
        if (idx !== -1) {
          setCurrentTrackIdx(idx);
          setIsPlaying(true);
          hasAutoPlayed.current = true;
        }
      }
    }
  }, [tracks, globalTrackId, user?.preferredMusicId]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.log("Auto-play blocked by browser. User interaction required.");
          setIsBlocked(true);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIdx]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (isBlocked && audioRef.current) {
        audioRef.current.play().then(() => {
          setIsBlocked(false);
          setIsPlaying(true);
          window.removeEventListener('click', handleFirstInteraction);
        }).catch(() => {});
      }
    };
    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, [isBlocked]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsBlocked(false);
        setIsPlaying(true);
      }).catch(err => {
        console.error("Playback error:", err?.message || "Unknown error");
        toast.error("Click anywhere on the page first to enable audio playback.");
      });
    }
  };

  const nextTrack = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIdx((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIdx((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  };

  const handleSetAutoPlay = async (trackId: string) => {
    if (!user) {
      toast.error("Please login to set auto-play preference.");
      return;
    }
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        preferredMusicId: trackId
      });
      toast.success("Auto-play track updated!");
    } catch (error) {
      console.error("Error updating auto-play:", error instanceof Error ? error.message : String(error));
      toast.error("Failed to update preference.");
    }
  };

  const getDirectUrl = (url: string) => {
    if (!url) return '';
    
    // Handle YouTube links - they won't work in an <audio> tag
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return ''; // Let the onError handler catch this
    }

    if (url.includes('drive.google.com')) {
      // Improved regex to handle various Drive link formats
      const idMatch = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
      if (idMatch && idMatch[1]) {
        return `https://docs.google.com/uc?export=download&id=${idMatch[1]}`;
      }
    }
    return url;
  };

  if (tracks.length === 0) return null;

  const currentTrack = tracks[currentTrackIdx];

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">
      <AnimatePresence>
        {isBlocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-neon-blue text-black px-4 py-2 rounded-full text-xs font-bold shadow-[0_0_20px_rgba(0,242,255,0.5)] mb-2 cursor-pointer hover:scale-105 transition-transform"
            onClick={togglePlay}
          >
            Click to Enable Music 🎵
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="bg-dark-bg/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-64 shadow-2xl mb-2"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Music Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white">
                <Settings size={14} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase font-bold">Volume</label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-neon-blue"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase font-bold">Playlist</label>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {tracks.map((track, idx) => (
                    <button
                      key={track.id}
                      onClick={() => {
                        setCurrentTrackIdx(idx);
                        setIsPlaying(true);
                      }}
                      className={cn(
                        "w-full text-left text-[10px] p-2 rounded-lg transition-colors flex justify-between items-center group",
                        idx === currentTrackIdx ? "bg-neon-blue/20 text-neon-blue" : "text-white/60 hover:bg-white/5"
                      )}
                    >
                      <span className="truncate mr-2">{track.title}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetAutoPlay(track.id);
                          }}
                          className={cn(
                            "p-1 rounded hover:bg-white/10",
                            user?.preferredMusicId === track.id ? "text-neon-blue" : "text-white/40"
                          )}
                          title="Set as Auto-play"
                        >
                          <Play size={10} fill={user?.preferredMusicId === track.id ? "currentColor" : "none"} />
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 bg-dark-bg/80 backdrop-blur-md border border-white/10 rounded-full p-2 pl-4 shadow-xl">
        <div className="flex flex-col min-w-[100px] max-w-[150px]">
          <span className="text-[10px] font-bold text-neon-blue uppercase tracking-tighter truncate">
            {isPlaying ? 'Now Playing' : 'Paused'}
          </span>
          <span className="text-xs text-white font-medium truncate">
            {currentTrack?.title}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={prevTrack} className="p-2 text-white/60 hover:text-white transition-colors">
            <SkipBack size={16} />
          </button>
          <button 
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-neon-blue text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,242,255,0.4)]"
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
          </button>
          <button onClick={nextTrack} className="p-2 text-white/60 hover:text-white transition-colors">
            <SkipForward size={16} />
          </button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button onClick={() => setIsMuted(!isMuted)} className="p-2 text-white/60 hover:text-white transition-colors">
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-white/60 hover:text-white transition-colors">
            <Settings size={16} className={cn(showSettings && "text-neon-blue animate-spin-slow")} />
          </button>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={getDirectUrl(currentTrack?.url)}
        onEnded={nextTrack}
        autoPlay={isPlaying}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={(e) => {
          console.error("Audio error occurred for track:", currentTrack?.title);
          if (currentTrack?.url) {
            if (currentTrack.url.includes('youtube.com') || currentTrack.url.includes('youtu.be')) {
              toast.error(`YouTube links are not supported for background music. Please use a direct audio link or Google Drive link.`);
            } else {
              toast.error(`Failed to load audio: ${currentTrack.title}. Ensure the link is public and valid.`);
            }
          }
        }}
        preload="auto"
      />
    </div>
  );
}
