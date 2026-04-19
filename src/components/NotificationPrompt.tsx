import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, BellOff, ArrowRight } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Notification as AppNotification } from '../types';

export default function NotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showBar, setShowBar] = useState(false);
  const [latestNotification, setLatestNotification] = useState<AppNotification | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      const currentPermission = window.Notification ? window.Notification.permission : 'denied';
      setPermission(currentPermission);

      // Check if we should show the bar - Don't show on admin pages
      const isAdminPage = window.location.pathname.startsWith('/admin');
      if (window.Notification && currentPermission === 'default' && !isAdminPage) {
        setShowBar(true);
      }
    }, 2000);

    // Listen for new notifications
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const notif = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AppNotification;
        
        // Only show if it's "new" (within last 5 minutes)
        const now = Date.now();
        const createdAt = notif.createdAt?.toMillis ? notif.createdAt.toMillis() : now;
        
        if (now - createdAt < 300000) { // 5 minutes
          setLatestNotification(notif);
          setShowToast(true);
          
          // Also try browser notification
          if (window.Notification && window.Notification.permission === 'granted') {
            new window.Notification(notif.title, {
              body: notif.message,
              icon: '/favicon.ico'
            });
          }
          
          // Check if this notification has been seen before in this session or recently
          const seenKey = `notif_seen_${notif.id}`;
          if (!localStorage.getItem(seenKey)) {
            setLatestNotification(notif);
            setShowToast(true);
            localStorage.setItem(seenKey, 'true');
            
            // Auto hide toast after 3 seconds as requested
            setTimeout(() => setShowToast(false), 3000);
          }
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notifications');
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !window.Notification) return;
    
    try {
      const result = await window.Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        setShowBar(false);
      } else {
        // If denied or dismissed, still hide the bar for this session 
        // to avoid annoying the user if they specifically said no
        setShowBar(false);
      }
    } catch (err) {
      console.error("Error requesting notification permission:", err);
    }
  };

  return (
    <>
      {/* Permission Bar */}
      <AnimatePresence>
        {showBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-0 right-0 z-[200] px-4"
          >
            <div className="max-w-xl mx-auto bg-neon-blue text-black p-4 rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.4)] flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center">
                  <Bell size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-tight">Stay Updated!</p>
                  <p className="text-[10px] opacity-70 font-medium">Turn on notifications to get important study updates.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={requestPermission}
                  className="px-4 py-2 bg-black text-neon-blue rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
                >
                  Turn On
                </button>
                <button 
                  onClick={() => setShowBar(false)}
                  className="p-2 hover:bg-black/10 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* In-App Toast */}
      <AnimatePresence>
        {showToast && latestNotification && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed bottom-6 right-6 z-[110] w-full max-w-sm"
          >
            <div className={`glass-card p-5 border-l-4 ${
              latestNotification.type === 'success' ? 'border-l-green-500' :
              latestNotification.type === 'warning' ? 'border-l-yellow-500' :
              latestNotification.type === 'error' ? 'border-l-red-500' :
              'border-l-neon-blue'
            } relative overflow-hidden group`}>
              <div className="absolute top-0 right-0 p-2">
                <button onClick={() => setShowToast(false)} className="text-white/20 hover:text-white transition-all">
                  <X size={16} />
                </button>
              </div>
              
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  latestNotification.type === 'success' ? 'bg-green-500/10 text-green-500' :
                  latestNotification.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                  latestNotification.type === 'error' ? 'bg-red-500/10 text-red-500' :
                  'bg-neon-blue/10 text-neon-blue'
                }`}>
                  <Bell size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-tight">{latestNotification.title}</h4>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">{latestNotification.message}</p>
                  {latestNotification.url && (
                    <a 
                      href={latestNotification.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-neon-blue mt-3 uppercase tracking-widest hover:underline"
                    >
                      View Details
                      <ArrowRight size={10} />
                    </a>
                  )}
                </div>
              </div>
              
              {/* Progress bar for auto-hide */}
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 3, ease: "linear" }}
                className="absolute bottom-0 left-0 h-0.5 bg-white/10"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
