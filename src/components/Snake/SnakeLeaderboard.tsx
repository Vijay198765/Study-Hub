import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Shield, Calendar, Award } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { SnakeScore } from './types';

interface SnakeLeaderboardProps {
  currentUserId: string;
}

export default function SnakeLeaderboard({ currentUserId }: SnakeLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<SnakeScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const scoresRef = collection(db, 'snake_scores');
    const q = query(scoresRef, orderBy('score', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const scores: SnakeScore[] = [];
        snapshot.forEach((doc) => {
          scores.push({ id: doc.id, ...doc.data() } as SnakeScore);
        });
        setLeaderboard(scores);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'snake_scores');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400 border border-yellow-500/20">
          <Trophy size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white font-display">Global Hall of Fame</h2>
          <p className="text-white/40 text-sm mt-1">Universal real-time scoreboard. Do you have what it takes to grasp Rank 1?</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden border border-white/5 bg-white/5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white/40 text-sm mt-4">Loading universal scores...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-20">
            <Trophy size={48} className="mx-auto mb-4 text-white/20" />
            <p className="text-white/50 font-bold">No scores submitted yet!</p>
            <p className="text-white/30 text-xs mt-1">Be the first player to conquer the arena and claim Rank 1.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-white/40 uppercase tracking-wider font-bold">
                  <th className="py-4 px-6 text-center w-16">Rank</th>
                  <th className="py-4 px-6">Gladiator</th>
                  <th className="py-4 px-6 text-right">High Score</th>
                  <th className="py-4 px-6 text-right">Bot Slayed</th>
                  <th className="py-4 px-6 text-right">Longest Tail</th>
                  <th className="py-4 px-6 text-right hidden sm:table-cell">Date Played</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaderboard.map((item, index) => {
                  const isCurrentUser = item.userId === currentUserId;
                  const rank = index + 1;
                  
                  // Style configurations for podium rows
                  let rankStyle = "text-white/70";
                  let bgStyle = "hover:bg-white/5";
                  if (rank === 1) {
                    rankStyle = "text-yellow-400 font-extrabold sm:text-lg";
                    bgStyle = "bg-yellow-500/5 hover:bg-yellow-500/10";
                  } else if (rank === 2) {
                    rankStyle = "text-slate-300 font-extrabold sm:text-lg";
                    bgStyle = "bg-slate-300/5 hover:bg-slate-300/10";
                  } else if (rank === 3) {
                    rankStyle = "text-amber-600 font-extrabold sm:text-lg";
                    bgStyle = "bg-amber-600/5 hover:bg-amber-600/10";
                  }

                  if (isCurrentUser) {
                    bgStyle = "bg-neon-blue/10 hover:bg-neon-blue/15 border-l-2 border-l-neon-blue";
                  }

                  return (
                    <tr key={item.id || index} className={`transition-colors text-sm ${bgStyle}`}>
                      <td className="py-4 px-6 text-center select-none">
                        {rank <= 3 ? (
                          <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold">
                            <span className={rankStyle}>{rank}</span>
                          </div>
                        ) : (
                          <span className="font-mono text-white/40">{rank}</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className={`font-bold transition-colors ${isCurrentUser ? 'text-neon-blue' : 'text-white'}`}>
                            {item.username}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[8px] uppercase bg-neon-blue/20 border border-neon-blue/30 px-1.5 py-0.5 rounded text-neon-blue font-bold">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-emerald-400">
                        {item.score.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-red-400">
                        {item.kills}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-purple-400">
                        {item.longestLength}
                      </td>
                      <td className="py-4 px-6 text-right text-white/40 font-mono text-xs hidden sm:table-cell">
                        {formatDate(item.timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex gap-2 items-center mt-6 text-xs text-white/40 bg-white/5 p-4 rounded-xl border border-white/5">
        <Shield size={16} className="text-neon-blue" />
        <span>Universal anti-integrity server parameters deployed. High score submissions are guarded.</span>
      </div>
    </div>
  );
}
