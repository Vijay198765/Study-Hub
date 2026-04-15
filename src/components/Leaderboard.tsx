import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Crown, Clock } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';

export default function Leaderboard() {
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('totalTimeSpent', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(q, (snap) => {
      const users = snap.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setTopUsers(users.filter(u => u.totalTimeSpent && u.totalTimeSpent > 0));
      setLoading(false);
    });

    return () => unsub();
  }, []);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topUsers.map((user, idx) => (
            <motion.div
              key={user.uid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="relative group"
            >
              <div className={`glass-card p-4 flex items-center gap-4 border-l-4 transition-all group-hover:neon-border ${
                idx === 0 ? 'border-yellow-400 bg-yellow-400/5' : 
                idx === 1 ? 'border-slate-300 bg-slate-300/5' : 
                idx === 2 ? 'border-amber-600 bg-amber-600/5' : 'border-white/10'
              }`}>
                <div className="flex-shrink-0 relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20 text-sm">
                        {user.name?.charAt(0) || 'S'}
                      </div>
                    )}
                  </div>
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shadow-lg ${
                    idx === 0 ? 'bg-yellow-400 text-black' : 
                    idx === 1 ? 'bg-slate-300 text-black' : 
                    idx === 2 ? 'bg-amber-600 text-white' : 'bg-white/10 text-white/60'
                  }`}>
                    {idx + 1}
                  </div>
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-sm truncate group-hover:neon-text transition-colors">
                      {user.name || 'Anonymous Student'}
                    </h3>
                    {idx === 0 && <Crown size={12} className="text-yellow-400 flex-shrink-0" />}
                    {idx === 1 && <Medal size={12} className="text-slate-300 flex-shrink-0" />}
                    {idx === 2 && <Medal size={12} className="text-amber-600 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] text-white/40 font-bold uppercase tracking-wider">
                    <Clock size={8} className="text-neon-blue" />
                    <span>{Math.floor((user.totalTimeSpent || 0) / 60)}h {(user.totalTimeSpent || 0) % 60}m</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
