import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Trophy, Crown, Clock } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';

export default function LeaderboardScroller() {
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('totalTimeSpent', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const users = snap.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserProfile[];
      
      // Filter out users who have a name AND exclude special/secret accounts
      // Also filter out standard admin emails if needed
      const filtered = users.filter(u => u.name && !u.secretLoginLogged);
      
      // Ensure Admin (Vijay Ninama) is always first
      const adminEmail = 'vijayninama683@gmail.com';
      const adminIdx = filtered.findIndex(u => u.email?.toLowerCase() === adminEmail);
      
      let finalUsers = [...filtered];
      if (adminIdx !== -1) {
        const adminUser = { ...finalUsers[adminIdx] };
        finalUsers.splice(adminIdx, 1);
        
        // Take the top 15 others for the scroller
        finalUsers = finalUsers.slice(0, 14);
        
        // Ensure admin has extra time than second place (10-30 mins range)
        if (finalUsers.length > 0) {
          const secondPlaceTime = finalUsers[0].totalTimeSpent || 0;
          adminUser.totalTimeSpent = secondPlaceTime + Math.floor(Math.random() * 20) + 10; 
        } else {
          adminUser.totalTimeSpent = adminUser.totalTimeSpent || 60;
        }
        
        finalUsers.unshift(adminUser);
      } else {
        finalUsers = finalUsers.slice(0, 15);
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
    <div className="w-full bg-black/40 border-y border-white/5 py-4 overflow-hidden relative group">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent z-10"></div>
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent z-10"></div>
      
      <div className="flex animate-scroll whitespace-nowrap gap-8 hover:[animation-play-state:paused]">
        {[...topUsers, ...topUsers].map((user, idx) => (
          <div 
            key={`${user.uid}-${idx}`} 
            className="inline-flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-2.5 hover:border-neon-blue/50 transition-all cursor-default"
          >
            <div className="relative">
              <div className={cn(
                "w-10 h-10 rounded-full overflow-hidden border-2",
                idx % topUsers.length === 0 ? "border-yellow-400" : "border-white/10"
              )}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/40 text-xs font-bold">
                    {user.name?.charAt(0) || 'S'}
                  </div>
                )}
              </div>
              <div className={cn(
                "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border border-black",
                idx % topUsers.length === 0 ? "bg-yellow-400 text-black" : "bg-white/20 text-white"
              )}>
                {(idx % topUsers.length) + 1}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white">
                  {user.name?.split(' ')[0] || 'Scholar'}
                </span>
                {idx % topUsers.length === 0 && <Crown size={12} className="text-yellow-400" />}
              </div>
              <div className="flex items-center gap-1.5 text-neon-blue text-[10px] font-bold">
                <Clock size={10} />
                {Math.floor((user.totalTimeSpent || 0) / 60)}h {(user.totalTimeSpent || 0) % 60}m
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
      `}</style>
    </div>
  );
}
