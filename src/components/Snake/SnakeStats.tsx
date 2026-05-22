import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Target, Award, Calendar, ChevronRight, Zap } from 'lucide-react';
import { SnakePlayerStats, SnakeAchievement } from './types';
import { DEFAULT_ACHIEVEMENTS } from './achievementData';

interface SnakeStatsProps {
  stats: SnakePlayerStats;
  achievements: SnakeAchievement[];
  onClaimDailyReward: () => void;
  canClaimDailyReward: boolean;
}

export default function SnakeStats({
  stats,
  achievements,
  onClaimDailyReward,
  canClaimDailyReward
}: SnakeStatsProps) {
  
  // Calculate XP threshold for next level
  const xpNeededForNextLevel = stats.level * 500;
  const xpPercentage = Math.min(100, Math.floor((stats.xp / xpNeededForNextLevel) * 100));

  // Count unlocked achievements
  const unlockedAchievementsCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="w-full">
      {/* 1. Header with Level Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 glass-card p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-neon-blue/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-blue to-purple-500 flex items-center justify-center text-white ring-4 ring-neon-blue/20">
              <div className="text-center">
                <span className="text-[10px] uppercase block tracking-wider font-semibold opacity-70">Level</span>
                <span className="text-3xl font-black font-mono">{stats.level}</span>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white">Gladiator Rank</h3>
              <p className="text-white/40 text-xs mt-1">Play matches to earn XP. Every game score feeds your gladiator prowess.</p>
            </div>
          </div>

          <div className="w-full md:w-64">
            <div className="flex justify-between items-end text-sm mb-2">
              <span className="text-white/60 font-medium">XP Progression</span>
              <span className="text-neon-blue font-mono font-bold">{stats.xp} / {xpNeededForNextLevel} XP</span>
            </div>
            <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                className="bg-gradient-to-r from-neon-blue to-purple-500 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Daily Reward Module */}
        <div className="glass-card p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="flex justify-between items-start gap-4">
            <div>
              <h4 className="font-bold text-white text-lg flex items-center gap-1.5 label-neon">
                <Calendar className="text-yellow-400 w-5 h-5" /> Daily Reward Streak
              </h4>
              <p className="text-white/40 text-xs mt-1">Claim your starting gift every 24 hours to buy premium skins!</p>
            </div>
          </div>

          <div className="mt-4">
            {canClaimDailyReward ? (
              <button 
                onClick={onClaimDailyReward}
                className="w-full btn-neon py-3 px-4 font-bold flex items-center justify-center gap-2"
              >
                Claim +100 Coins Free
              </button>
            ) : (
              <div className="text-center py-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white/50 font-bold flex items-center justify-center gap-1.5">
                Saved! Daily Reward Claimed Today
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Stats Bento Grid */}
      <h3 className="text-xl font-bold text-white mb-4">Milestone Records</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        <div className="glass-card p-5 text-center flex flex-col justify-center border border-white/5 bg-white/5 hover:border-neon-blue/20 transition-all">
          <Trophy className="text-yellow-400 w-6 h-6 mx-auto mb-2.5" />
          <span className="text-[10px] text-white/40 uppercase font-black uppercase tracking-wider block">High Score</span>
          <span className="text-xl font-black font-mono mt-0.5 text-white">{stats.highScore}</span>
        </div>

        <div className="glass-card p-5 text-center flex flex-col justify-center border border-white/5 bg-white/5 hover:border-purple-400/20 transition-all">
          <Award className="text-purple-400 w-6 h-6 mx-auto mb-2.5" />
          <span className="text-[10px] text-white/40 uppercase font-black uppercase tracking-wider block">Longest Tail</span>
          <span className="text-xl font-black font-mono mt-0.5 text-white">{stats.longestSnakeLength} segs</span>
        </div>

        <div className="glass-card p-5 text-center flex flex-col justify-center border border-white/5 bg-white/5 hover:border-red-500/20 transition-all">
          <Target className="text-red-500 w-6 h-6 mx-auto mb-2.5" />
          <span className="text-[10px] text-white/40 uppercase font-black uppercase tracking-wider block">Slay Wins</span>
          <span className="text-xl font-black font-mono mt-0.5 text-white">{stats.wins} times</span>
        </div>

        <div className="glass-card p-5 text-center flex flex-col justify-center border border-white/5 bg-white/5 hover:border-neon-blue/20 transition-all">
          <Zap className="text-neon-blue w-6 h-6 mx-auto mb-2.5" />
          <span className="text-[10px] text-white/40 uppercase font-black uppercase tracking-wider block">Kill Count</span>
          <span className="text-xl font-black font-mono mt-0.5 text-white">{stats.killCount} kills</span>
        </div>

        <div className="glass-card p-5 text-center flex flex-col justify-center border border-white/5 bg-white/5 hover:border-blue-400/20 transition-all">
          <Calendar className="text-blue-400 w-6 h-6 mx-auto mb-2.5" />
          <span className="text-[10px] text-white/40 uppercase font-black uppercase tracking-wider block">Matches</span>
          <span className="text-xl font-black font-mono mt-0.5 text-white">{stats.matchesPlayed} games</span>
        </div>

        <div className="glass-card p-5 text-center flex flex-col justify-center border border-white/5 bg-white/5 hover:border-yellow-400/20 transition-all">
          <Trophy className="text-yellow-500 w-6 h-6 mx-auto mb-2.5" />
          <span className="text-[10px] text-white/40 uppercase font-black uppercase tracking-wider block">Achievements</span>
          <span className="text-xl font-black font-mono mt-0.5 text-white">{unlockedAchievementsCount} / {achievements.length}</span>
        </div>
      </div>

      {/* 3. Achievements Progress Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Gladiator Achievements</h3>
          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
            {achievements.map((ach) => {
              const pct = Math.min(100, Math.floor((ach.progress / ach.maxProgress) * 100));
              return (
                <div 
                  key={ach.id}
                  className={`glass-card p-4 flex gap-4 border transition-all ${
                    ach.unlocked 
                      ? 'border-emerald-500/20 bg-emerald-500/5' 
                      : 'border-white/5 bg-white/5'
                  }`}
                >
                  <div className="text-3xl flex items-center justify-center p-2.5 bg-black/25 rounded-xl border border-white/5 h-12 w-12 shrink-0">
                    {ach.icon}
                  </div>
                  <div className="w-full">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className={`font-bold text-sm ${ach.unlocked ? 'text-emerald-400' : 'text-white'}`}>
                          {ach.title}
                        </h4>
                        <p className="text-white/40 text-xs mt-0.5">{ach.description}</p>
                      </div>
                      <div className="text-right">
                        {ach.unlocked ? (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 uppercase font-bold px-1.5 py-0.5 rounded">Unlocked</span>
                        ) : (
                          <span className="text-[10px] bg-white/10 text-white/50 uppercase font-mono px-1.5 py-0.5 rounded">{ach.progress}/{ach.maxProgress}</span>
                        )}
                      </div>
                    </div>

                    {!ach.unlocked && (
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5 mt-3">
                        <div className="bg-neon-blue h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gameplay Instructions Side */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Survival Training</h3>
          <div className="glass-card p-6 border border-white/5 bg-white/5 h-full max-h-[460px]">
            <ul className="space-y-4">
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-neon-blue/15 border border-neon-blue/30 flex items-center justify-center text-neon-blue font-black font-mono shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-sm text-white">Steer Smoothly Inside Boundaries</h4>
                  <p className="text-white/40 text-xs mt-1">Your snake head will smoothly point and follow your cursor in any direction. Adjust mouse coordinate position for sharp circles.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-neon-blue/15 border border-neon-blue/30 flex items-center justify-center text-neon-blue font-black font-mono shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-sm text-white">Dread the Collisions</h4>
                  <p className="text-white/40 text-xs mt-1">If your snake's face bumps into the dynamic body of any bot snake (or another snake's face), you disintegrate instantly. Run along their flanks to trap them!</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-neon-blue/15 border border-neon-blue/30 flex items-center justify-center text-neon-blue font-black font-mono shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-sm text-white">Use Boosting wisely</h4>
                  <p className="text-white/40 text-xs mt-1">Hold mouse clicks or space to launch turbo gliding boost! Speed comes at a cost—shedding glowing tail segments behind you for others to eat.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-neon-blue/15 border border-neon-blue/30 flex items-center justify-center text-neon-blue font-black font-mono shrink-0">4</div>
                <div>
                  <h4 className="font-bold text-sm text-white">Gluttony breeds Coins</h4>
                  <p className="text-white/40 text-xs mt-1">Inhaling giant food cells boosts your tail segment capacity. At the end of every match, coins are awarded based on your final scores and bot slays!</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
