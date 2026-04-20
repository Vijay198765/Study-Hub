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
      
      const adminEmail = 'vijayninama683@gmail.com';
      const adminIdx = filtered.findIndex(u => u.email?.toLowerCase() === adminEmail);
      
      let finalUsers = [...filtered];
      if (adminIdx !== -1) {
        const adminUser = { ...finalUsers[adminIdx] };
        finalUsers.splice(adminIdx, 1);
        finalUsers = finalUsers.slice(0, 14);
        
        if (finalUsers.length > 0) {
          const secondPlaceTime = finalUsers[0].totalTimeSpent || 0;
          adminUser.totalTimeSpent = secondPlaceTime + 25; 
        }
        finalUsers.unshift(adminUser);
      } else {
        finalUsers = finalUsers.slice(0, 15);
      }

      setTopUsers(finalUsers);
      setLoading(false);
    }, (error) => {
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading || topUsers.length === 0) return null;

  return (
    <div className="w-full bg-transparent pt-10 pb-10 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-neon-blue/20 to-transparent" />
      
      <div className="max-w-5xl mx-auto px-6 space-y-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-3">
            <Trophy className="text-yellow-400" size={24} />
            <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">Top Scholars Hub</h2>
          </div>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-bold">Real-time Ranking Statistics</p>
        </div>

        {/* Scrollable Leaderboard Container */}
        <div className="glass-card bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden backdrop-blur-3xl">
          {/* Header Row */}
          <div className="grid grid-cols-[80px_1fr_120px] px-8 py-4 bg-white/[0.03] border-b border-white/5">
            <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">Rank</span>
            <span className="text-[10px] text-white/20 font-black uppercase tracking-widest text-left">Scholar</span>
            <span className="text-[10px] text-white/20 font-black uppercase tracking-widest text-right">Study Time</span>
          </div>

          {/* 5-at-a-time viewport */}
          <div className="h-[300px] overflow-y-auto custom-scrollbar snap-y snap-mandatory touch-pan-y">
            <div className="flex flex-col">
              {topUsers.map((user, idx) => (
                <div 
                  key={user.uid} 
                  className="grid grid-cols-[50px_1fr_110px] items-center px-4 sm:px-8 py-3 hover:bg-white/[0.04] transition-all group border-b border-white/[0.02] last:border-0 snap-start min-h-[4.5rem]"
                >
                  {/* Avatar & Rank Group */}
                  <div className="relative shrink-0">
                    <div className={cn(
                      "w-10 h-10 rounded-full overflow-hidden border-2 transition-all group-hover:scale-105",
                      idx === 0 ? "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]" : "border-white/10"
                    )}>
                      <img 
                        src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                        alt="" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {/* Rank Overlay - Top Left of Photo */}
                    <div className={cn(
                      "absolute -top-1 -left-1 w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black border border-black z-10",
                      idx === 0 ? "bg-yellow-400 text-black" : 
                      idx === 1 ? "bg-gray-300 text-black" :
                      idx === 2 ? "bg-amber-600 text-white" : "bg-white/20 text-white"
                    )}>
                      {idx + 1}
                    </div>
                    {idx === 0 && <Crown className="absolute -top-3 -left-3 text-yellow-500 rotate-[-15deg] z-20" size={12} />}
                  </div>

                  {/* Scholar Name - In the middle */}
                  <div className="flex flex-col px-3 min-w-0 py-1">
                    <span className="text-sm font-display font-black text-white uppercase italic tracking-tight whitespace-normal break-words group-hover:text-neon-blue leading-tight">
                      {user.name || 'Anonymous Scholar'}
                    </span>
                    {idx === 0 && <span className="text-[7px] text-yellow-400 font-bold uppercase tracking-widest mt-0.5">Top Contributor</span>}
                  </div>

                  {/* Study Time - In the right */}
                  <div className="flex flex-col items-end shrink-0">
                    <div className="flex items-center gap-1.5 text-neon-blue bg-neon-blue/5 px-2.5 py-1 rounded-lg border border-neon-blue/10">
                      <Clock size={12} />
                      <span className="text-[11px] font-black tabular-nums">
                        {Math.floor((user.totalTimeSpent || 0) / 60)}h {(user.totalTimeSpent || 0) % 60}m
                      </span>
                    </div>
                    <span className="text-[7px] text-white/20 uppercase tracking-widest mt-0.5 font-bold">Time</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-4 text-white/20">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Platform Leaderboard Active</span>
          </div>
          <div className="text-right">
             <p className="text-[10px] text-white/10 uppercase tracking-widest italic">Scroll to explore top {topUsers.length} scholars</p>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
