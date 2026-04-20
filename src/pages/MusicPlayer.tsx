import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, 
  VolumeX, Music as MusicIcon, Disc, Loader2, ChevronLeft,
  Heart, Repeat, Shuffle, List, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { Music } from '../types';

export default function MusicPlayer() {
  const [songs, setSongs] = useState<Music[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [likedSongs, setLikedSongs] = useState<string[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load likes from local storage
    const savedLikes = localStorage.getItem('music_likes');
    if (savedLikes) setLikedSongs(JSON.parse(savedLikes));
  }, []);

  const toggleLike = (songId: string) => {
    const newLikes = likedSongs.includes(songId)
      ? likedSongs.filter(id => id !== songId)
      : [...likedSongs, songId];
    setLikedSongs(newLikes);
    localStorage.setItem('music_likes', JSON.stringify(newLikes));
  };

  useEffect(() => {
    // Check if authenticated for music page
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
      })) as Music[];
      setSongs(musicData);
      setLoading(false);
    });

    return () => unsub();
  }, [navigate]);

  const currentSong = songs[currentIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current && currentSong) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.error("Playback failed:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentIndex, currentSong]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const handlePrev = () => {
    if (currentTime > 3) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      return;
    }
    setCurrentIndex(prev => (prev === 0 ? songs.length - 1 : prev - 1));
    setIsPlaying(true);
  };

  const handleNext = () => {
    if (isShuffle) {
      const nextIndex = Math.floor(Math.random() * songs.length);
      setCurrentIndex(nextIndex);
    } else {
      setCurrentIndex(prev => (prev === songs.length - 1 ? 0 : prev + 1));
    }
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
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDirectLink = (url: string) => {
    if (!url) return '';
    if (!url.startsWith('http') && !url.startsWith('/')) {
      return `/music/${url}`;
    }
    if (url.includes('drive.google.com')) {
      const id = url.match(/\/d\/(.+?)\//)?.[1] || url.match(/id=(.+?)(&|$)/)?.[1];
      if (id) return `https://docs.google.com/uc?export=download&id=${id}`;
    }
    if (url.includes('dropbox.com')) {
      return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '').replace('?dl=1', '');
    }
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-neon-blue w-12 h-12" />
          <p className="text-white/20 font-display uppercase tracking-widest text-xs">Tuning frequency...</p>
        </div>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 gap-6 text-center">
        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10 animate-pulse">
           <MusicIcon className="text-white/20 w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter">Silence in the Hub</h1>
          <p className="text-white/40 max-w-xs mx-auto text-sm">Your music library is currently empty. Add some tracks in the Admin Panel.</p>
        </div>
        <Link to="/" className="btn-neon px-12 py-3 bg-white text-black border-none hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">Return to Hub</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Immersive Audio-reactive background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
         <motion.div 
           animate={isPlaying ? {
             scale: [1, 1.2, 1],
             opacity: [0.3, 0.5, 0.3]
           } : {}}
           transition={{ duration: 3, repeat: Infinity }}
           className="absolute top-1/4 left-1/4 w-[50%] h-[50%] bg-neon-blue/30 blur-[150px] rounded-full"
         />
         <motion.div 
           animate={isPlaying ? {
             scale: [1, 1.3, 1],
             opacity: [0.2, 0.4, 0.2]
           } : {}}
           transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
           className="absolute bottom-1/4 right-1/4 w-[50%] h-[50%] bg-neon-purple/30 blur-[150px] rounded-full"
         />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
      >
        {/* Album Art Section */}
        <div className="flex flex-col items-center gap-8 order-2 md:order-1">
          <div className="relative">
            <motion.div 
              animate={isPlaying ? { rotate: 360 } : {}}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96"
            >
              <div className="absolute inset-0 rounded-full border-[12px] border-white/5 ring-1 ring-white/10 ring-offset-4 ring-offset-black" />
              <div className="absolute inset-4 rounded-full overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10">
                <img 
                  src={currentSong.coverUrl || `https://picsum.photos/seed/${currentSong.id}/800/800`} 
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
              {/* Spinner Center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black border-4 border-[#111] rounded-full z-20 flex items-center justify-center">
                 <div className="w-2 h-2 bg-white/20 rounded-full" />
              </div>
            </motion.div>
            
            {/* Pulsing Aura */}
            <AnimatePresence>
              {isPlaying && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 border-2 border-neon-blue/20 rounded-full pointer-events-none"
                />
              )}
            </AnimatePresence>
          </div>

          <div className="text-center space-y-4 max-w-md">
             <div className="space-y-1">
               <motion.span 
                 key={currentSong.id + 'artist'}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="text-neon-blue text-xs font-black uppercase tracking-[0.4em]"
               >
                 {currentSong.artist || 'Independent Hub Artist'}
               </motion.span>
               <motion.h1 
                 key={currentSong.id + 'title'}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.1 }}
                 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 italic"
               >
                 {currentSong.title}
               </motion.h1>
             </div>
             
             <div className="flex items-center justify-center gap-6 pt-2">
               <button 
                 onClick={() => toggleLike(currentSong.id)}
                 className={cn(
                   "p-3 rounded-full border border-white/5 transition-all text-white/40 hover:text-white",
                   likedSongs.includes(currentSong.id) && "text-red-500 border-red-500/20 bg-red-500/5"
                 )}
               >
                 <Heart size={20} fill={likedSongs.includes(currentSong.id) ? "currentColor" : "none"} />
               </button>
               <button 
                 onClick={() => setShowPlaylist(true)}
                 className="p-3 rounded-full border border-white/5 text-white/40 hover:text-white transition-all"
               >
                 <List size={20} />
               </button>
             </div>
          </div>
        </div>

        {/* Console Section */}
        <div className="space-y-10 order-1 md:order-2">
           <div className="flex justify-between items-center mb-8">
              <Link to="/" className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all group">
                 <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
              </Link>
              <div className="text-right">
                 <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Global Study Stream</p>
                 <p className="text-sm font-display font-bold text-white italic">Music Player V2.0</p>
              </div>
           </div>

           {/* Visualization Console */}
           <div className="glass-card p-10 bg-black/40 border-white/5 space-y-12 relative overflow-hidden group">
              {/* Scanline Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.01),rgba(0,0,255,0.01))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20" />
              
              {/* Visuals */}
              <div className="flex items-end justify-center gap-1.5 h-20">
                {[...Array(32)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={isPlaying ? {
                      height: [Math.random() * 20 + 5, Math.random() * 80 + 10, Math.random() * 20 + 5]
                    } : { height: 10 }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.4 + (i * 0.02),
                      ease: "easeInOut"
                    }}
                    className={cn(
                      "w-1.5 rounded-full",
                      i < 16 ? "bg-neon-blue/40" : "bg-neon-purple/40"
                    )}
                  />
                ))}
              </div>

              {/* Progress */}
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black text-white/30 uppercase tracking-widest">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div className="relative group/seek h-1.5 w-full bg-white/5 rounded-full">
                  <input 
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="absolute h-full bg-gradient-to-r from-neon-blue via-white to-neon-purple shadow-[0_0_15px_rgba(0,242,255,0.5)] rounded-full transition-all duration-150"
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                  />
                  <div 
                    className="absolute h-4 w-4 bg-white rounded-full top-1/2 -translate-y-1/2 shadow-xl opacity-0 group-hover/seek:opacity-100 transition-opacity border-4 border-black"
                    style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 8px)` }}
                  />
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex flex-col gap-10">
                <div className="flex items-center justify-between px-6">
                   <button 
                     onClick={() => setIsShuffle(!isShuffle)}
                     className={cn("transition-colors", isShuffle ? "text-neon-blue" : "text-white/20 hover:text-white")}
                   >
                     <Shuffle size={20} />
                   </button>
                   <div className="flex items-center gap-10">
                      <button onClick={handlePrev} className="text-white/40 hover:text-white transition-all transform active:scale-90">
                        <SkipBack size={32} />
                      </button>
                      <button 
                        onClick={togglePlay}
                        className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.15)] hover:scale-105 transition-all transform active:scale-95"
                      >
                        {isPlaying ? <Pause size={32} fill="black" /> : <Play size={32} fill="black" className="translate-x-0.5" />}
                      </button>
                      <button onClick={handleNext} className="text-white/40 hover:text-white transition-all transform active:scale-90">
                        <SkipForward size={32} />
                      </button>
                   </div>
                   <button 
                     onClick={() => setIsRepeat(!isRepeat)}
                     className={cn("transition-colors", isRepeat ? "text-neon-purple" : "text-white/20 hover:text-white")}
                   >
                     <Repeat size={20} />
                   </button>
                </div>

                {/* Vertical Separator */}
                <div className="h-px bg-white/5 w-full" />

                <div className="flex items-center gap-6 px-4">
                  <button onClick={() => setIsMuted(!isMuted)} className="text-white/40 hover:text-white transition-colors">
                    {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <div className="relative flex-grow h-1 bg-white/5 rounded-full overflow-hidden">
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
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div 
                      className="absolute h-full bg-white/20 transition-all"
                      style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
           </div>
        </div>
      </motion.div>

      {/* Modern Queue Overlay */}
      <AnimatePresence>
        {showPlaylist && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPlaylist(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 top-1/4 bg-[#080808] border-t border-white/10 z-[101] rounded-t-[40px] p-8 md:p-12 overflow-hidden flex flex-col"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-10 shrink-0" />
              
              <div className="flex items-center justify-between mb-10 shrink-0">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-4xl font-display font-black italic uppercase tracking-tighter">Your Queue</h2>
                  <span className="text-white/20 font-mono text-sm">/ {songs.length} Tracks</span>
                </div>
                <button 
                  onClick={() => setShowPlaylist(false)}
                  className="p-3 bg-white/5 rounded-2xl text-white/40 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 space-y-2">
                {songs.map((song, idx) => (
                  <button 
                    key={song.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsPlaying(true);
                      setShowPlaylist(false);
                    }}
                    className={cn(
                      "w-full group p-4 rounded-3xl flex items-center gap-6 transition-all text-left border",
                      currentIndex === idx 
                        ? "bg-white/10 border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]" 
                        : "bg-transparent border-transparent hover:bg-white/5"
                    )}
                  >
                    <div className="text-xs font-mono text-white/20 w-4 font-bold">
                      {(idx + 1).toString().padStart(2, '0')}
                    </div>
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/10 relative">
                      <img 
                        src={song.coverUrl || `https://picsum.photos/seed/${song.id}/200/200`} 
                        alt={song.title}
                        className={cn("w-full h-full object-cover transition-transform group-hover:scale-110", currentIndex === idx && "opacity-40")}
                        referrerPolicy="no-referrer"
                      />
                      {currentIndex === idx && (
                        <div className="absolute inset-0 flex items-center justify-center">
                           <div className="flex gap-0.5 items-end h-4">
                              <div className="w-1 bg-white animate-music-bar-1" />
                              <div className="w-1 bg-white animate-music-bar-2" />
                              <div className="w-1 bg-white animate-music-bar-3" />
                           </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className={cn("font-bold truncate text-lg tracking-tight", currentIndex === idx ? "text-white" : "text-white/80")}>
                        {song.title}
                      </p>
                      <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">{song.artist}</p>
                    </div>
                    <div className="text-[10px] font-mono text-white/20 group-hover:opacity-100 opacity-0 transition-opacity">
                      3:42
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
        src={getDirectLink(currentSong?.url)}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={handleNext}
        muted={isMuted}
        loop={isRepeat}
      />
    </div>
  );
}
