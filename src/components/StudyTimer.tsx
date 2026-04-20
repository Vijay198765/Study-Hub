import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Play, Pause, RotateCcw, X, Timer, Coffee, Zap } from 'lucide-react';

interface StudyTimerProps {
  onClose?: () => void;
}

export default function StudyTimer({ onClose }: StudyTimerProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Optional: Play a notification sound
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Auto switch modes?
      if (mode === 'study') {
         setMode('break');
         setTimeLeft(5 * 60);
      } else {
         setMode('study');
         setTimeLeft(25 * 60);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'study' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = timeLeft / (mode === 'study' ? 25 * 60 : 5 * 60);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-24 right-6 z-50 w-64 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${mode === 'study' ? 'bg-orange-500/20 text-orange-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
            {mode === 'study' ? <Zap size={14} /> : <Coffee size={14} />}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
            {mode === 'study' ? 'Deep Work' : 'Break Time'}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-6 flex flex-col items-center text-center">
        <div className="relative w-32 h-32 flex items-center justify-center mb-6">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle 
              cx="64" cy="64" r="60" 
              className="fill-none stroke-white/5 stroke-[4]"
            />
            <motion.circle 
              cx="64" cy="64" r="60" 
              className={`fill-none stroke-[4] ${mode === 'study' ? 'stroke-orange-500' : 'stroke-emerald-500'}`}
              strokeDasharray="377"
              animate={{ strokeDashoffset: 377 * (1 - progress) }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </svg>
          <span className="text-3xl font-mono font-bold text-white tracking-tight">
            {formatTime(timeLeft)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={resetTimer}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/60 hover:text-white transition-all"
          >
            <RotateCcw size={18} />
          </button>
          
          <button 
            onClick={toggleTimer}
            className={`p-5 rounded-2xl transition-all shadow-lg flex items-center justify-center ${
              isActive 
                ? 'bg-zinc-800 text-white' 
                : mode === 'study' 
                  ? 'bg-orange-500 text-white shadow-orange-500/20' 
                  : 'bg-emerald-500 text-white shadow-emerald-500/20'
            }`}
          >
            {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>
          
          <button 
            onClick={() => {
              setMode(m => m === 'study' ? 'break' : 'study');
              setIsActive(false);
              setTimeLeft(mode === 'study' ? 5 * 60 : 25 * 60);
            }}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/60 hover:text-white transition-all"
          >
            <Timer size={18} />
          </button>
        </div>
      </div>
      
      <div className="px-4 pb-4">
        <p className="text-[9px] text-white/20 text-center uppercase tracking-widest font-bold">
          Pomodoro Technique: 25m Focus • 5m Rest
        </p>
      </div>
    </motion.div>
  );
}
