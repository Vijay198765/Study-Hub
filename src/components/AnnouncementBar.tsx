import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, X, ExternalLink } from 'lucide-react';

export default function AnnouncementBar() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        // Filter for global notifications (no userId or userId is '' or 'all')
        .filter((d: any) => !d.userId || d.userId === '' || d.userId === 'all')
        .sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
      setNotifications(docs);
      if (docs.length > 0) setIsVisible(true);
    });

    return () => unsubscribe();
  }, []);

  if (!isVisible || notifications.length === 0) return null;

  const activeNotif = notifications[0];

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-neon-blue/90 via-neon-purple/90 to-neon-blue/90 backdrop-blur-md border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white animate-pulse">
              <Megaphone size={16} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 whitespace-nowrap hidden sm:inline">News Alert:</span>
              <p className="text-white text-[13px] font-bold leading-tight">
                {activeNotif.title}: {activeNotif.message}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            {activeNotif.url && (
              <a 
                href={activeNotif.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-[10px] font-black uppercase tracking-widest transition-all"
              >
                View <ExternalLink size={10} />
              </a>
            )}
            <button 
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
