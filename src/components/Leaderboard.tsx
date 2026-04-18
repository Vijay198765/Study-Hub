import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Crown, Clock } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';

export default function Leaderboard() {
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
      const filtered = users.filter(u => u.name && !u.secretLoginLogged);
      
      // Ensure Admin (Vijay Ninama) is always first
      const adminEmail = 'vijayninama683@gmail.com';
      const adminIdx = filtered.findIndex(u => u.email?.toLowerCase() === adminEmail);
      
      let finalUsers = [...filtered];
      if (adminIdx !== -1) {
        const adminUser = { ...finalUsers[adminIdx] };
        finalUsers.splice(adminIdx, 1);
        
        // Take the top 10 others
        finalUsers = finalUsers.slice(0, 9);
        
        // Ensure admin has extra time than second place
        if (finalUsers.length > 0) {
          const secondPlaceTime = finalUsers[0].totalTimeSpent || 0;
          // Add 10-30 minutes extra for display
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

  if (loading) return null;
  if (topUsers.length === 0) return null;

  const itemWidth = 304; // 280px min-w + 24px gap
  const scrollDistance = topUsers.length * itemWidth;

  return (
    <section className="max-w-7xl mx-auto mb-20 px-4 overflow-hidden">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
          <Trophy size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold">Top Scholars</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Live Activity Scroller</p>
        </div>
      </div>

      <div className="relative group">
        {/* Faded edges for the scroller */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-dark-bg to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-dark-bg to-transparent z-10 pointer-events-none" />
        
        <div className="overflow-x-hidden py-4">
          <motion.div 
            animate={{ x: [0, -scrollDistance] }}
            transition={{ 
              duration: topUsers.length * 4, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="flex gap-6 whitespace-nowrap"
          >
            {/* Double the users for a seamless loop */}
            {[...topUsers, ...topUsers].map((user, idx) => {
              const displayIdx = idx % topUsers.length;
              const isFirst = displayIdx === 0;
              
              return (
                <div 
                  key={`${user.uid}-${idx}`}
                  className={cn(
                    "flex-shrink-0 glass-card p-4 flex items-center gap-4 min-w-[280px] border-l-4 transition-all hover:neon-border group/item",
                    isFirst ? "border-yellow-400 bg-yellow-400/5 shadow-[0_0_15px_rgba(250,204,21,0.1)]" : "border-white/10"
                  )}
                >
                  <div className="relative">
                    <div className={cn(
                      "w-10 h-10 rounded-full overflow-hidden border-2",
                      isFirst ? "border-yellow-400/50" : "border-white/10"
                    )}>
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center text-white/40 text-sm font-bold">
                          {user.name?.charAt(0) || 'S'}
                        </div>
                      )}
                    </div>
                    {isFirst && (
                      <div className="absolute -top-1 -right-1">
                        <Crown size={12} className="text-yellow-400 animate-bounce" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate group-hover/item:text-neon-blue transition-colors">
                      {user.name || 'Scholar'}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock size={10} className="text-neon-blue" />
                      <span className="text-[10px] text-white/60 font-mono">
                        {Math.floor((user.totalTimeSpent || 0) / 60)}h {(user.totalTimeSpent || 0) % 60}m
                      </span>
                      {isFirst && (
                        <span className="text-[8px] bg-yellow-400 text-black px-1 rounded font-black uppercase tracking-tighter">Leader</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
