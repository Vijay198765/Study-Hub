import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Trophy, Crown, Clock } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';

export default function LeaderboardScroller() {
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('totalTimeSpent', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, (snap) => {
      const users = snap.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserProfile[];
      
      const filtered = users.filter(u => u.name && !u.secretLoginLogged);
      
      // Ensure Admin (Vijay Ninama) is always first
      const adminEmail = 'vijayninama683@gmail.com';
      const adminIdx = filtered.findIndex(u => u.email?.toLowerCase() === adminEmail);
      
      let finalUsers = [...filtered];
      if (adminIdx !== -1) {
        const adminUser = { ...finalUsers[adminIdx] };
        finalUsers.splice(adminIdx, 1);
        finalUsers = finalUsers.slice(0, 9);
        
        if (finalUsers.length > 0) {
          const secondPlaceTime = finalUsers[0].totalTimeSpent || 0;
          adminUser.totalTimeSpent = secondPlaceTime + 25; 
        }
        finalUsers.unshift(adminUser);
      } else {
        finalUsers = finalUsers.slice(0, 10);
      }

      setTopUsers(finalUsers);
      setLoading(false);
    }, (error) => {
      console.warn('Leaderboard fetch failed:', error.message);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading || topUsers.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 hidden md:block">
      <div className="glass-card p-4 w-48 border-white/10 bg-black/40 backdrop-blur-md overflow-hidden relative">
        <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
          <Trophy size={14} className="text-yellow-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Live Rank</span>
        </div>
        
        <div className="h-32 relative overflow-hidden">
          <div className="flex flex-col animate-scroll-vertical gap-3">
            {[...topUsers, ...topUsers].map((user, idx) => (
              <div 
                key={`${user.uid}-${idx}`} 
                className="flex items-center gap-3 py-1 group transition-all"
              >
                <div className="relative shrink-0">
                  <div className={cn(
                    "w-7 h-7 rounded-full overflow-hidden border",
                    idx % topUsers.length === 0 ? "border-yellow-400" : "border-white/10"
                  )}>
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                        {user.name?.charAt(0) || 'S'}
                      </div>
                    )}
                  </div>
                  <div className={cn(
                    "absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black border border-black",
                    idx % topUsers.length === 0 ? "bg-yellow-400 text-black" : "bg-white/20 text-white"
                  )}>
                    {(idx % topUsers.length) + 1}
                  </div>
                </div>
                
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white truncate group-hover:text-neon-blue transition-colors">
                    {user.name?.split(' ')[0] || 'Scholar'}
                  </p>
                  <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Clock size={8} className="text-neon-blue" />
                    {Math.floor((user.totalTimeSpent || 0) / 60)}h
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute inset-x-0 top-10 h-6 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>

      <style>{`
        @keyframes scroll-vertical {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-scroll-vertical {
          animation: scroll-vertical 20s linear infinite;
        }
        .animate-scroll-vertical:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
