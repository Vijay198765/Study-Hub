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

  // Global Ranking System calculation based on Wins, Kills, High Score, Level
  const totalKillPoints = stats.killCount * 150;
  const totalWinPoints = stats.wins * 350;
  const levelPoints = stats.level * 250;
  const ratingPoints = totalKillPoints + totalWinPoints + levelPoints + stats.highScore;

  // Determine Tier Rank
  let currentTierRank = 'Bronze';
  let tierIcon = '🥉';
  let tierColorClass = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
  let nextTierRank = 'Silver';
  let ptsNeededForNextTier = 2000;
  let prevTierPts = 0;

  if (ratingPoints >= 100000) {
    currentTierRank = 'Predator';
    tierIcon = '⚔️';
    tierColorClass = 'text-red-400 bg-red-400/20 border-red-500/30 font-black animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]';
    nextTierRank = 'Peak Level Maxed';
    ptsNeededForNextTier = 100000;
    prevTierPts = 100000;
  } else if (ratingPoints >= 50000) {
    currentTierRank = 'Master';
    tierIcon = '👑';
    tierColorClass = 'text-purple-400 bg-purple-500/20 border-purple-400/30 font-extrabold animate-pulse';
    nextTierRank = 'Predator';
    ptsNeededForNextTier = 100000;
    prevTierPts = 50000;
  } else if (ratingPoints >= 25000) {
    currentTierRank = 'Diamond';
    tierIcon = '🔮';
    tierColorClass = 'text-rose-400 bg-rose-500/20 border-rose-400/30 font-bold';
    nextTierRank = 'Master';
    ptsNeededForNextTier = 50000;
    prevTierPts = 25000;
  } else if (ratingPoints >= 12000) {
    currentTierRank = 'Platinum';
    tierIcon = '💎';
    tierColorClass = 'text-cyan-400 bg-cyan-500/20 border-cyan-400/30 font-bold';
    nextTierRank = 'Diamond';
    ptsNeededForNextTier = 25000;
    prevTierPts = 12000;
  } else if (ratingPoints >= 5000) {
    currentTierRank = 'Gold';
    tierIcon = '🥇';
    tierColorClass = 'text-yellow-500 bg-yellow-500/25 border-yellow-500/30';
    nextTierRank = 'Platinum';
    ptsNeededForNextTier = 12000;
    prevTierPts = 5000;
  } else if (ratingPoints >= 2000) {
    currentTierRank = 'Silver';
    tierIcon = '🥈';
    tierColorClass = 'text-slate-300 bg-slate-300/20 border-slate-300/30';
    nextTierRank = 'Gold';
    ptsNeededForNextTier = 5000;
    prevTierPts = 2000;
  } else {
    currentTierRank = 'Bronze';
    tierIcon = '🥉';
    tierColorClass = 'text-amber-600 bg-amber-700/10 border-amber-600/20';
    nextTierRank = 'Silver';
    ptsNeededForNextTier = 2000;
    prevTierPts = 0;
  }

  const rangeSpan = ptsNeededForNextTier - prevTierPts;
  const currentProgressPct = rangeSpan > 0 
    ? Math.min(100, Math.floor(((ratingPoints - prevTierPts) / rangeSpan) * 100))
    : 100;

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

      {/* Dynamic League Competitive Standings (Fulfilling User Request!) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Competitive Division standings card */}
        <div className="glass-card p-6 border border-white/5 bg-gradient-to-b from-white/[0.01] to-white/[0.03] flex flex-col justify-between relative overflow-hidden shadow-xl">
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
              <h4 className="font-bold text-white text-md flex items-center gap-1.5 uppercase tracking-wider select-none">
                🏆 Global Competitive Tier
              </h4>
              <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full font-bold">Live Synced</span>
            </div>
            
            <div className="flex items-center gap-4 py-2">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border transition-all duration-300 ${tierColorClass}`}>
                {tierIcon}
              </div>
              <div>
                <div className="text-white/40 text-[10px] uppercase font-black tracking-widest leading-none">Your Arena Division</div>
                <div className="text-xl font-black text-white mt-1 flex items-center gap-1.5">
                  {currentTierRank}
                  <span className="text-xs bg-white/5 border border-white/10 text-emerald-400 font-mono px-2 py-0.5 rounded-md font-bold">
                    {ratingPoints.toLocaleString()} RP
                  </span>
                </div>
                <p className="text-white/30 text-[9px] mt-1">Slay kills (150 RP) + Slay wins (350 RP) + Level points + High score.</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/50 font-bold mb-1.5">
              <span>Next Division: <span className="text-neon-blue">{nextTierRank}</span></span>
              <span>{ratingPoints.toLocaleString()} / {ptsNeededForNextTier.toLocaleString()} RP</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
              <div className="bg-gradient-to-r from-[#10b981] to-[#3b82f6] h-full rounded-full transition-all duration-500" style={{ width: `${currentProgressPct}%` }} />
            </div>
            <div className="flex justify-between text-[8px] text-white/30 font-mono mt-1">
              <span>Bronze (0) &rarr; Silver (2k) &rarr; Gold (5k)</span>
              <span>Platinum (12k) &rarr; Diamond (25k) &rarr; Master (50k) &rarr; Predator (100k+)</span>
            </div>
          </div>
        </div>

        {/* Seasonal Rewards card */}
        <div className="glass-card p-6 border border-white/5 bg-gradient-to-b from-white/[0.01] to-white/[0.03] flex flex-col justify-between relative overflow-hidden shadow-xl">
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
              <h4 className="font-bold text-white text-md flex items-center gap-1.5 uppercase tracking-wider select-none">
                🌌 Seasonal Arena Tournament
              </h4>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse">May 2026 Season</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60 font-medium">May Cosmic Championship Countdown</span>
                <span className="text-emerald-400 font-bold font-mono text-[10px] bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">8 Days Left</span>
              </div>
              
              <div className="text-[11px] text-white/40 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/5">
                🔥 <span className="font-bold text-white/80">Seasonal Rewards:</span> At the end of May, competitive divisions rotate. Exclusive Cosmic titles are rewarded to active Gladiators, alongside premium 
                <span className="text-neon-blue font-bold"> Cosmic / Rainbow Skins</span> loaded into your armory!
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="flex -space-x-2 overflow-hidden">
                  <span className="inline-block h-6 w-6 rounded-full bg-indigo-500/30 ring-2 ring-[#0f1118] text-center text-xs flex items-center justify-center border border-indigo-400/30" title="Galaxy skin reward">🌌</span>
                  <span className="inline-block h-6 w-6 rounded-full bg-rose-500/30 ring-2 ring-[#0f1118] text-center text-xs flex items-center justify-center border border-rose-400/30" title="Magma skin reward">🌋</span>
                  <span className="inline-block h-6 w-6 rounded-full bg-yellow-500/30 ring-2 ring-[#0f1118] text-center text-xs flex items-center justify-center border border-yellow-400/30" title="Championship Royal skin">👑</span>
                </div>
                <div className="text-[10px] text-white/50 font-bold">
                  Exclusive seasonal skins available! Return daily to boost your survival XP.
                </div>
              </div>
            </div>
          </div>
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
