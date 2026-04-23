import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, ArrowRight } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';

export default function NewsTicker() {
  const [news, setNews] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Only fetch global notifications (userId empty or 'all')
    // Note: Firestore 'in' query can handle multiple values
    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', ['', 'all']),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const newsData = snap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        // Sort by createdAt in-memory to avoid index requirement
        .sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        })
        .slice(0, 10);

      setNews(newsData);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (news.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % news.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [news]);

  if (news.length === 0) return null;

  const currentNews = news[currentIndex];

  return (
    <div className="w-full bg-black/40 border-y border-white/5 backdrop-blur-md h-10 flex items-center relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 bg-neon-blue px-4 flex items-center gap-2 z-10 shadow-[5px_0_15px_rgba(0,242,255,0.3)]">
        <Megaphone size={14} className="text-black" />
        <span className="text-[10px] font-black uppercase tracking-widest text-black whitespace-nowrap hidden sm:inline">Latest News</span>
      </div>
      
      <div className="flex-grow pl-12 sm:pl-36 pr-4 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNews.id}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex items-center gap-3"
          >
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              currentNews.type === 'success' ? 'bg-green-500' :
              currentNews.type === 'warning' ? 'bg-yellow-500' :
              currentNews.type === 'error' ? 'bg-red-500' :
              'bg-neon-blue'
            } animate-pulse shadow-[0_0_8px_currentColor]`} />
            <span className="text-[11px] font-bold text-white/90 truncate mr-2">
              {currentNews.title}:
            </span>
            <span className="text-[11px] font-medium text-white/60 truncate">
              {currentNews.message}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
      
      <div className="absolute right-0 top-0 bottom-0 px-4 bg-gradient-to-l from-black/80 to-transparent flex items-center">
        <div className="flex gap-1">
          {news.map((_, idx) => (
            <div 
              key={idx} 
              className={`w-1 h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-neon-blue w-3' : 'bg-white/10'}`} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
