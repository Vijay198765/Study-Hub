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
    <div className="w-full bg-black/60 border-y border-white/5 py-3 overflow-hidden relative group">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-6">
        <div className="flex items-center gap-2 shrink-0 border-r border-white/10 pr-6">
          <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center text-yellow-400">
            <Trophy size={18} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hidden sm:block">Top Scholars</span>
        </div>

        <div className="h-24 flex-grow relative overflow-y-auto custom-scrollbar snap-y snap-mandatory touch-pan-y pr-4">
          <div className="flex flex-col gap-1">
            {topUsers.map((user, idx) => (
              <div 
                key={user.uid} 
                className="h-10 flex items-center gap-4 transition-all group shrink-0 snap-start bg-white/5 px-4 rounded-xl border border-white/5 hover:border-white/10"
              >
                <div className="relative shrink-0">
                  <div className={cn(
                    "w-7 h-7 rounded-full overflow-hidden border",
                    idx === 0 ? "border-yellow-400" : "border-white/10"
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
                    idx === 0 ? "bg-yellow-400 text-black" : "bg-white/20 text-white"
                  )}>
                    {idx + 1}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 min-w-0">
                  <p className="text-sm font-bold text-white truncate group-hover:text-neon-blue transition-colors">
                    {user.name || 'Scholar'}
                  </p>
                  <div className="flex items-center gap-1.5 text-neon-blue text-[10px] font-bold bg-neon-blue/5 px-2 py-0.5 rounded-full border border-neon-blue/10">
                    <Clock size={10} />
                    {Math.floor((user.totalTimeSpent || 0) / 60)}h {(user.totalTimeSpent || 0) % 60}m
                    <span className="text-white/20 mx-1">|</span>
                    Rank #{idx + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 shrink-0 border-l border-white/10 pl-6 text-white/20">
          <span className="text-[10px] font-bold uppercase tracking-widest">Live Updates</span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 242, 255, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 242, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
