import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Crown, Clock } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { UserProfile, SiteConfig } from '../types';
import { cn, convertDriveUrl } from '../lib/utils';

export default function Leaderboard() {
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch Site Config for Global Pins
    const unsubConfig = onSnapshot(doc(db, 'config', 'site'), (snap) => {
      if (snap.exists()) {
        setSiteConfig(snap.data() as SiteConfig);
      }
    });

    const q = query(
      collection(db, 'users'),
      orderBy('totalTimeSpent', 'desc')
    );

    const unsubUsers = onSnapshot(q, (snap) => {
      const users = snap.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserProfile[];
      
      // Filter out users who have a name and secret logins. 
      // Main admin is filtered out UNLESS they are pinned.
      const now = Date.now();
      const pinnedUids = new Set(
        (siteConfig?.pinnedEntries || [])
          .filter(p => {
            const expiry = p.expiresAt?.seconds ? p.expiresAt.seconds * 1000 : p.expiresAt;
            return expiry > now;
          })
          .map(p => p.uid)
      );

      const filtered = users.filter(u => {
        const isMainAdmin = u.email?.toLowerCase() === 'vijayninama683@gmail.com';
        const isPinned = pinnedUids.has(u.uid) || u.pinnedToTop;
        
        // Show main admin normally now as requested
        if (isMainAdmin) return true;
        
        return u.name && !u.secretLoginLogged;
      });
      
      const finalUsers = [...filtered].sort((a, b) => {
        const aPinned = pinnedUids.has(a.uid) || a.pinnedToTop;
        const bPinned = pinnedUids.has(b.uid) || b.pinnedToTop;

        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        
        // Rank by combined time
        const aTotal = (a.totalTimeSpent || 0) + (a.bonusTimeSpent || 0);
        const bTotal = (b.totalTimeSpent || 0) + (b.bonusTimeSpent || 0);
        return bTotal - aTotal;
      }).slice(0, 10);

      setTopUsers(finalUsers);
      setLoading(false);
    }, (error) => {
      console.warn('Leaderboard fetch failed:', error.message);
      setLoading(false);
    });

    return () => {
      unsubConfig();
      unsubUsers();
    };
  }, []); // Empty dependency array - listeners manage their own state updates

  if (loading) return null;
  if (topUsers.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto mb-20 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
          <Trophy size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold">Top Scholars</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Based on study time</p>
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 gap-3">
          {topUsers.map((user, idx) => (
            <motion.div
              key={user.uid}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(idx * 0.05, 0.5) }}
              className="relative group"
            >
              <div className={cn(
                "glass-card p-4 flex items-center justify-between gap-4 border-l-4 transition-all hover:neon-border",
                idx === 0 ? "border-yellow-400 bg-yellow-400/5 shadow-[0_0_15px_rgba(250,204,21,0.1)]" : 
                idx === 1 ? "border-slate-300 bg-slate-300/5" : 
                idx === 2 ? "border-amber-600 bg-amber-600/5" : "border-white/10"
              )}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex-shrink-0 relative">
                    <div className={cn(
                      "w-12 h-12 rounded-full overflow-hidden border-2",
                      idx === 0 ? "border-yellow-400/50" : "border-white/10"
                    )}>
                      {user.photoURL ? (
                        <img 
                          src={convertDriveUrl(user.photoURL)} 
                          alt={user.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'S')}&background=random&color=fff`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center text-white/40 text-lg font-bold">
                          {user.name?.charAt(0) || 'S'}
                        </div>
                      )}
                    </div>
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-xl border-2 border-black",
                      idx === 0 ? "bg-yellow-400 text-black" : 
                      idx === 1 ? "bg-slate-300 text-black" : 
                      idx === 2 ? "bg-amber-600 text-white" : "bg-white/20 text-white"
                    )}>
                      {idx + 1}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm truncate group-hover:text-neon-blue transition-colors">
                        {user.name || 'Scholar'}
                      </h3>
                      {idx === 0 && <Crown size={14} className="text-yellow-400 flex-shrink-0 animate-pulse" />}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-white/40 font-bold uppercase tracking-wider">
                      <span className="bg-white/5 px-2 py-0.5 rounded-full border border-white/5">Rank #{idx + 1}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1.5 justify-end text-sm font-display font-bold text-white">
                    <Clock size={14} className="text-neon-blue" />
                    <span>
                      {Math.floor((user.totalTimeSpent || 0) / 60)}h {(user.totalTimeSpent || 0) % 60}m
                    </span>
                  </div>
                  <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mt-0.5">Study Time</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
