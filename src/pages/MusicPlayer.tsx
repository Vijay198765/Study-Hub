import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, 
  VolumeX, Music, Disc, Loader2, ChevronLeft,
  Heart, Repeat, Shuffle, List
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverUrl?: string;
}

export default function MusicPlayer() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if authenticated for music page (simple local check for the secret)
    const hasAccess = sessionStorage.getItem('music_access') === 'true';
    if (!hasAccess) {
      navigate('/');
      return;
    }

    const q = query(collection(db, 'music'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const musicData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Song[];
      setSongs(musicData);
      setLoading(false);
    });

    return () => unsub();
  }, [navigate]);

  const currentSong = songs[currentIndex];

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.error("Playback failed:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? songs.length - 1 : prev - 1));
    setIsPlaying(true);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === songs.length - 1 ? 0 : prev + 1));
    setIsPlaying(true);
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-neon-blue w-12 h-12" />
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 gap-4">
        <Music className="text-white/20 w-20 h-20" />
        <h1 className="text-2xl font-display font-bold text-white">No Songs Found</h1>
        <p className="text-white/40">Ask the administrator to add some music.</p>
        <Link to="/" className="btn-neon px-8 py-3">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-blue/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-purple/20 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10"
      >
        {/* Left Side: Art and Main Info */}
        <div className="flex flex-col items-center lg:items-start gap-8">
           <Link to="/" className="flex items-center gap-2 text-white/40 hover:text-neon-blue transition-colors mb-4 lg:mb-0 group self-start">
             <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
             <span className="text-sm font-bold uppercase tracking-widest">Exit Player</span>
           </Link>

           <div className="relative group perspective-1000">
             <motion.div 
                animate={isPlaying ? { rotate: 360 } : {}}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className={cn(
                  "w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-8 border-[#111] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative",
                  isPlaying && "shadow-[0_0_80px_rgba(0,242,255,0.2)]"
                )}
             >
               <img 
                 src={currentSong.coverUrl || `https://picsum.photos/seed/${currentSong.id}/800/800`} 
                 alt={currentSong.title}
                 className="w-full h-full object-cover"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
               <div className="absolute inset-x-0 bottom-8 flex justify-center">
                 <Disc className={cn("text-white/40 w-12 h-12", isPlaying && "animate-spin-slow")} />
               </div>
             </motion.div>
             
             {/* Glowing Rings */}
             <div className="absolute inset-[-20px] border-2 border-neon-blue/10 rounded-full animate-pulse pointer-events-none" />
             <div className="absolute inset-[-40px] border-2 border-neon-purple/5 rounded-full animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />
           </div>

           <div className="text-center lg:text-left space-y-2 w-full">
             <motion.h1 
               key={currentSong.id + 'title'}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="text-4xl md:text-5xl font-display font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60"
             >
               {currentSong.title}
             </motion.h1>
             <motion.p 
               key={currentSong.id + 'artist'}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.1 }}
               className="text-neon-blue font-bold uppercase tracking-[0.3em] text-sm"
             >
               {currentSong.artist || 'Unknown Artist'}
             </motion.p>
           </div>
        </div>

        {/* Right Side: Controls and Visualization */}
        <div className="glass-card p-8 md:p-10 space-y-10 border-white/5 bg-black/40 relative group overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
             <button 
                onClick={() => setShowPlaylist(!showPlaylist)}
                className="text-white/40 hover:text-white transition-colors"
             >
               <List size={24} />
             </button>
          </div>

          <div className="space-y-4">
            <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden group/seek">
              <input 
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <motion.div 
                className="absolute h-full bg-gradient-to-r from-neon-blue to-neon-purple"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
              <div className="absolute h-full w-full bg-white/10 group-hover/seek:opacity-100 opacity-0 transition-opacity" />
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/30">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-10">
            <button 
              onClick={handlePrev}
              className="text-white/40 hover:text-white transition-all transform active:scale-90"
            >
              <SkipBack size={32} />
            </button>
            <button 
              onClick={togglePlay}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-[0_0_30px_rgba(0,242,255,0.3)] hover:scale-105 transition-all transform active:scale-95"
            >
              {isPlaying ? <Pause size={40} className="text-black" /> : <Play size={40} className="text-black translate-x-1" />}
            </button>
            <button 
              onClick={handleNext}
              className="text-white/40 hover:text-white transition-all transform active:scale-90"
            >
              <SkipForward size={32} />
            </button>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button onClick={() => setIsMuted(!isMuted)} className="text-white/40 hover:text-white transition-colors">
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="flex-grow accent-neon-blue"
            />
          </div>

          {/* Visualization Placeholder */}
          <div className="flex items-end justify-center gap-1 h-12 pt-4">
            {[...Array(20)].map((_, i) => (
              <motion.div 
                key={i}
                animate={isPlaying ? {
                  height: [8, Math.random() * 40 + 10, 8]
                } : { height: 8 }}
                transition={{
                  repeat: Infinity,
                  duration: 0.5 + Math.random(),
                  ease: "easeInOut"
                }}
                className="w-1 bg-neon-blue/30 rounded-full"
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Playlist Drawer */}
      <AnimatePresence>
        {showPlaylist && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPlaylist(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[50]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-dark-bg border-l border-white/10 z-[60] p-8 overflow-y-auto custom-scrollbar"
            >
              <h2 className="text-2xl font-display font-bold mb-8 uppercase tracking-tighter italic">Queue</h2>
              <div className="space-y-4">
                {songs.map((song, idx) => (
                  <button 
                    key={song.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsPlaying(true);
                    }}
                    className={cn(
                      "w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left",
                      currentIndex === idx ? "bg-white/10 border border-white/10" : "hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      <img 
                        src={song.coverUrl || `https://picsum.photos/seed/${song.id}/200/200`} 
                        alt={song.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-sm font-bold truncate", currentIndex === idx ? "text-neon-blue" : "text-white")}>
                        {song.title}
                      </p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest truncate">{song.artist}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <audio 
        ref={audioRef}
        src={currentSong.url}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={handleNext}
        muted={isMuted}
        volume={volume}
      />
    </div>
  );
}
