import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, limit, onSnapshot, where } from 'firebase/firestore';

export default function NewsTicker() {
  const [news, setNews] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Fetch global notifications from 'notifications' collection
    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', ['', 'all']),
      limit(20)
    );

    const unsub = onSnapshot(q, {
      next: (snap) => {
        const newsData = snap.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          // Filter for global notifications (no userId or userId is '' or 'all')
          .filter((d: any) => !d.userId || d.userId === '' || d.userId === 'all')
          // Sort by createdAt in-memory to avoid composite index requirement
          .sort((a: any, b: any) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
          })
          .slice(0, 10);

        setNews(newsData);
      },
      error: (error) => handleFirestoreError(error, OperationType.GET, 'notifications')
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (news.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % news.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [news, isPaused]);

  if (news.length === 0) return null;

  const currentNews = news[currentIndex];

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          glow: 'shadow-[0_0_12px_rgba(34,197,94,0.3)]',
          dot: 'bg-green-500 shadow-[0_0_8px_#22c55e]',
          badgeText: 'text-green-400',
          badgeBg: 'bg-green-500/10 border-green-500/20',
          accent: '#22c55e'
        };
      case 'warning':
        return {
          glow: 'shadow-[0_0_12px_rgba(234,179,8,0.3)]',
          dot: 'bg-yellow-500 shadow-[0_0_8px_#eab308]',
          badgeText: 'text-yellow-400',
          badgeBg: 'bg-yellow-500/10 border-yellow-500/20',
          accent: '#eab308'
        };
      case 'error':
        return {
          glow: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]',
          dot: 'bg-red-500 shadow-[0_0_8px_#ef4444]',
          badgeText: 'text-red-400',
          badgeBg: 'bg-red-500/10 border-red-500/20',
          accent: '#ef4444'
        };
      default:
        return {
          glow: 'shadow-[0_0_12px_rgba(59,130,246,0.3)]',
          dot: 'bg-neon-blue shadow-[0_0_8px_#3b82f6]',
          badgeText: 'text-neon-blue',
          badgeBg: 'bg-neon-blue/10 border-neon-blue/20',
          accent: '#00f2ff'
        };
    }
  };

  const style = getTypeStyles(currentNews.type);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? news.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % news.length);
  };

  return (
    <div 
      className="w-full bg-slate-950/60 backdrop-blur-md border-y border-white/[0.04] py-2 px-4 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.02)] transition-all flex flex-col md:flex-row items-center justify-between gap-3 min-h-[44px] select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      id="news-ticker-container"
    >
      <div className="flex items-center gap-3 w-full md:w-auto min-w-0 flex-1">
        {/* News Indicator Flag */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/5 shrink-0 select-none">
          <Megaphone size={14} className="text-neon-blue animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider text-white-800 text-white/70">
            Bulletin
          </span>
        </div>

        {/* Dynamic sliding ticker item */}
        <div className="flex-1 min-w-0 relative h-6 flex items-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentNews.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2.5 w-full min-w-0 text-left cursor-pointer group"
              onClick={() => {
                if (currentNews.url) {
                  window.open(currentNews.url, '_blank', 'noopener,noreferrer');
                }
              }}
            >
              {/* Alert Indicator */}
              <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot} animate-ping`} />
              
              {/* Text content */}
              <div className="flex items-center gap-1.5 min-w-0 flex-grow">
                <span className={`text-xs font-semibold shrink-0 uppercase tracking-wide px-1.5 py-0.5 rounded text-[10px] border ${style.badgeBg} ${style.badgeText}`}>
                  {currentNews.title}
                </span>
                <span className="text-xs font-medium text-white/75 truncate select-all group-hover:text-white transition-colors">
                  {currentNews.message}
                </span>
                {currentNews.url && (
                  <ExternalLink size={11} className="text-white/40 shrink-0 group-hover:text-white/80 transition-colors" />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Manual Controls & Micro Indicators */}
      <div className="flex items-center gap-4 shrink-0 justify-end w-full md:w-auto border-t md:border-t-0 border-white/5 pt-2 md:pt-0">
        {/* Pagination indicators */}
        <div className="hidden lg:flex gap-1.5 items-center">
          {news.map((_, idx) => (
            <button 
              key={idx} 
              onClick={() => setCurrentIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex 
                  ? 'bg-neon-blue w-4 scale-110 shadow-[0_0_8px_#00f2ff]' 
                  : 'bg-white/10 hover:bg-white/30'
              }`}
              title={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Action Arrows */}
        {news.length > 1 && (
          <div className="flex items-center gap-1 bg-white/[0.01] border border-white/5 rounded-lg p-0.5 shadow-inner">
            <button
              onClick={handlePrev}
              className="p-1 hover:text-white text-white/50 active:scale-90 hover:bg-white/[0.04] rounded transition-all"
              aria-label="Previous News"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[10px] font-mono font-bold text-white/30 px-1 select-none">
              {currentIndex + 1} / {news.length}
            </span>
            <button
              onClick={handleNext}
              className="p-1 hover:text-white text-white/50 active:scale-90 hover:bg-white/[0.04] rounded transition-all"
              aria-label="Next News"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
