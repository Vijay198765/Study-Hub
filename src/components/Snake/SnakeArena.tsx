import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Palette, Trophy, Award, Coins, Info, Calendar, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase';
import { SnakePlayerStats, SnakeAchievement } from './types';
import { DEFAULT_ACHIEVEMENTS } from './achievementData';
import { SKINS } from './skinData';
import SnakeGame from './SnakeGame';
import SnakeShop from './SnakeShop';
import SnakeStats from './SnakeStats';
import SnakeLeaderboard from './SnakeLeaderboard';

// Alert Confetti
import confetti from 'canvas-confetti';
import UserName from '../UserName';

// Compact live leaderboard component for the play sidebar
function SnakeCompactLeaderboard({ currentUserId, onShopClick, currentSkinId }: { currentUserId: string, onShopClick: () => void, currentSkinId: string }) {
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const scoresRef = collection(db, 'snake_scores');
    const q = query(scoresRef, orderBy('score', 'desc'), limit(7));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        list.push({ id: doc.id, ...data });
      });
      setScores(list);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const currentSkinObj = SKINS.find(s => s.id === currentSkinId) || SKINS[0];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Real-time scoreboard */}
      <div className="glass-card p-5 border border-white/5 bg-white/[0.02] flex flex-col shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 select-none">
            <Trophy size={14} className="text-yellow-400" /> Arena Top Scores
          </h3>
          <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full animate-pulse font-bold select-none">
            Live
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] text-white/30 mt-2">Loading gladiators...</p>
          </div>
        ) : scores.length === 0 ? (
          <div className="text-center py-8 text-white/30 text-xs">
            No active runs yet!
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
            {scores.map((item, index) => {
              const isCurrentUser = item.userId === currentUserId;
              const rank = index + 1;
              let rankColor = "text-white/40";
              let rankBg = "bg-white/5";
              if (rank === 1) {
                rankColor = "text-yellow-400 font-black";
                rankBg = "bg-yellow-500/20 border border-yellow-500/30";
              } else if (rank === 2) {
                rankColor = "text-slate-300 font-extrabold";
                rankBg = "bg-slate-300/20 border border-slate-300/30";
              } else if (rank === 3) {
                rankColor = "text-amber-600 font-extrabold";
                rankBg = "bg-amber-600/20 border border-amber-600/30";
              }

              return (
                <div 
                  key={item.id || index}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                    isCurrentUser ? 'bg-neon-blue/15 border border-neon-blue/40 shadow-[0_0_10px_rgba(59,130,246,0.15)]' : 'bg-white/[0.01] hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 max-w-[65%] min-w-0">
                    <div className={`w-5.5 h-5.5 rounded-lg text-[10px] font-bold font-mono flex items-center justify-center ${rankBg} ${rankColor} shrink-0`}>
                      {rank}
                    </div>
                    <UserName 
                      userUid={item.userId} 
                      fallback={item.username} 
                      fallbackPhoto={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.username}`} 
                      showPhoto={true}
                      className={`text-xs font-bold truncate ${isCurrentUser ? 'text-neon-blue' : 'text-white/80'}`}
                      photoClassName="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-white/10 shadow-sm"
                    />
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="font-mono text-xs font-bold text-emerald-400 leading-none">
                      {item.score.toLocaleString()}
                    </span>
                    <span className="text-[8px] text-white/30 font-mono mt-0.5">
                      {item.kills} Slays
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Skin Equip card */}
      <div className="glass-card p-5 border border-white/5 bg-gradient-to-br from-white/[0.01] to-white/[0.03] shadow-md flex flex-col">
        <h4 className="text-[10px] uppercase tracking-wider text-white/40 mb-3 font-bold select-none">Equipped Armor Skin</h4>
        <div className="flex items-center gap-3">
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl relative shrink-0 shadow-lg border border-white/10"
            style={{ 
              background: currentSkinObj.colorGrade.includes('gradient') ? 'transparent' : currentSkinObj.bodyColor,
              backgroundImage: currentSkinObj.colorGrade.includes('gradient') ? currentSkinObj.colorGrade : undefined
            }}
          >
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center select-none">🐍</div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black text-white truncate">{currentSkinObj.name}</div>
            <div className="text-[9px] text-white/40 truncate mt-0.5">
              {currentSkinObj.cost === 0 ? 'Starter Default' : `${currentSkinObj.cost} Coins Premium`}
            </div>
            <button 
              onClick={onShopClick}
              className="text-[9px] text-neon-blue hover:text-neon-blue/80 font-bold mt-1.5 flex items-center gap-1 transition-colors border-0 p-0"
            >
              Skin Room &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SnakeArena() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'play' | 'shop' | 'stats' | 'leaderboard'>('play');
  const [isGameRunning, setIsGameRunning] = useState(false);
  
  // Current logged in user context with real-time state adaptation
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Unique persistent Guest ID for non-logged in users
  const [guestId] = useState(() => {
    let gid = localStorage.getItem('snake_guest_id');
    if (!gid) {
      gid = 'guest-' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('snake_guest_id', gid);
    }
    return gid;
  });

  // Custom nickname persistent state
  const [customNickname, setCustomNickname] = useState(() => {
    return localStorage.getItem('snake_nickname') || '';
  });

  const userId = currentUser?.uid || guestId;
  const playerDisplayName = customNickname || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Spectre';

  // Stats status
  const [stats, setStats] = useState<SnakePlayerStats>({
    userId: userId,
    highScore: 0,
    totalScore: 0,
    coins: 150, // Welcome Starter Gift!
    xp: 0,
    level: 1,
    matchesPlayed: 0,
    wins: 0,
    killCount: 0,
    longestSnakeLength: 12,
    currentSkin: 'default',
    settings: {
      soundEnabled: true,
      joystickEnabled: false,
      particlesEnabled: true,
      minimapEnabled: true
    },
    dailyRewardsClaimed: 0,
    lastDailyRewardAt: null
  });

  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(['default']);
  const [achievements, setAchievements] = useState<SnakeAchievement[]>(DEFAULT_ACHIEVEMENTS);
  const [loading, setLoading] = useState(true);

  // Load database statistics from Firestore
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const loadUserData = async () => {
      try {
        const statsRef = doc(db, 'snake_player_stats', userId);
        const statsSnap = await getDoc(statsRef);

        const inventoryRef = doc(db, 'snake_inventory', userId);
        const inventorySnap = await getDoc(inventoryRef);

        const achievementsRef = doc(db, 'snake_achievements', userId);
        const achievementsSnap = await getDoc(achievementsRef);

        let currentStats = stats;
        let currentSkins = unlockedSkins;
        let currentAch = achievements;

        // 1. Initial Player stats doc
        if (statsSnap.exists()) {
          currentStats = statsSnap.data() as SnakePlayerStats;
          setStats(currentStats);
        } else {
          // Setup starter profile stats Document in Firestore
          await setDoc(statsRef, stats);
        }

        // 2. Initial Inventory skin doc
        if (inventorySnap.exists()) {
          const skinData = inventorySnap.data();
          if (skinData && skinData.unlockedSkins) {
            currentSkins = skinData.unlockedSkins;
            setUnlockedSkins(currentSkins);
          }
        } else {
          await setDoc(inventoryRef, {
            userId: userId,
            unlockedSkins: ['default']
          });
        }

        // 3. Initial Achievements doc
        if (achievementsSnap.exists()) {
          const achData = achievementsSnap.data();
          if (achData && achData.unlockedAchievements) {
            // Map saved unlocked status on top of DEFAULT metadata array
            const loadedAch: SnakeAchievement[] = DEFAULT_ACHIEVEMENTS.map((def_ach) => {
              const matched = achData.unlockedAchievements.find((u: any) => u.id === def_ach.id);
              if (matched) {
                return {
                  ...def_ach,
                  unlocked: matched.unlocked,
                  progress: matched.progress
                };
              }
              return def_ach;
            });
            currentAch = loadedAch;
            setAchievements(loadedAch);
          }
        } else {
          await setDoc(achievementsRef, {
            userId: userId,
            unlockedAchievements: DEFAULT_ACHIEVEMENTS.map(a => ({ id: a.id, unlocked: false, progress: 0 }))
          });
        }

        // Run sync-checker checks on progress once everything is gathered
        evaluateProgressAchievements(currentStats, currentAch, false);

      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `snake_player_stats/${userId}`);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [currentUser, userId]);

  // Sync Achievements Checker logic
  const evaluateProgressAchievements = async (
    playerStats: SnakePlayerStats,
    loadedAch: SnakeAchievement[],
    shouldWrite: boolean = true
  ) => {
    let unlockedAny = false;
    let newCoinsReward = 0;

    const updatedAchievements = loadedAch.map((ach) => {
      if (ach.unlocked) return ach;

      let currentVal = 0;
      switch (ach.type) {
        case 'matches':
          currentVal = playerStats.matchesPlayed;
          break;
        case 'kills':
          currentVal = playerStats.killCount;
          break;
        case 'score':
          currentVal = playerStats.highScore;
          break;
        case 'length':
          currentVal = playerStats.longestSnakeLength;
          break;
        case 'level':
          currentVal = playerStats.level;
          break;
        default:
          break;
      }

      const isEligible = currentVal >= ach.maxProgress;
      if (isEligible) {
        unlockedAny = true;
        newCoinsReward += ach.rewardCoins;
        return {
          ...ach,
          unlocked: true,
          progress: ach.maxProgress
        };
      } else {
        return {
          ...ach,
          progress: currentVal
        };
      }
    });

    if (unlockedAny) {
      confetti();
      // Update local state variables
      setAchievements(updatedAchievements);
      
      const newBalance = playerStats.coins + newCoinsReward;
      setStats(prev => ({
        ...prev,
        coins: newBalance
      }));

      // Flush to Firestore asynchronously
      if (currentUser && shouldWrite) {
        try {
          const statsRef = doc(db, 'snake_player_stats', userId);
          await updateDoc(statsRef, {
            coins: newBalance
          });

          const achRef = doc(db, 'snake_achievements', userId);
          await setDoc(achRef, {
            userId: userId,
            unlockedAchievements: updatedAchievements.map(a => ({ id: a.id, unlocked: a.unlocked, progress: a.progress }))
          });
        } catch {
          // Silently capture sync rules limits
        }
      }
    } else {
      setAchievements(updatedAchievements);
    }
  };

  // Match ended: calculate coins, xp and commit metrics
  const handleMatchComplete = async (gameStats: { score: number; kills: number; longestLength: number }) => {
    // 1. Calculate Earnings
    const earnedXp = Math.floor(gameStats.score / 2);
    const earnedCoins = gameStats.kills * 12 + Math.floor(gameStats.score / 15);

    // Accumulated stats
    let newXp = stats.xp + earnedXp;
    let newLevel = stats.level;
    const xpNeeded = newLevel * 500;

    // Check level up milestone bounds
    let leveledUp = false;
    if (newXp >= xpNeeded) {
      newXp = newXp - xpNeeded;
      newLevel++;
      leveledUp = true;
    }

    const isNewHighScore = gameStats.score > stats.highScore;
    const resolvedHighScore = Math.max(stats.highScore, gameStats.score);
    const resolvedLongestLength = Math.max(stats.longestSnakeLength, gameStats.longestLength);

    const updatedStats: SnakePlayerStats = {
      ...stats,
      highScore: resolvedHighScore,
      longestSnakeLength: resolvedLongestLength,
      totalScore: stats.totalScore + gameStats.score,
      matchesPlayed: stats.matchesPlayed + 1,
      wins: stats.wins + (gameStats.kills > 0 ? 1 : 0),
      killCount: stats.killCount + gameStats.kills,
      coins: stats.coins + earnedCoins + (leveledUp ? 200 : 0),
      xp: newXp,
      level: newLevel
    };

    setStats(updatedStats);

    if (leveledUp) {
      confetti();
    }

    // Evaluate stats accomplishments
    evaluateProgressAchievements(updatedStats, achievements, true);

    // Save stats & match history to Firestore for logged-in users
    if (currentUser) {
      try {
        const statsRef = doc(db, 'snake_player_stats', userId);
        await setDoc(statsRef, updatedStats);

        // Save Historic Match record
        const matchesRef = collection(db, 'snake_match_history');
        await addDoc(matchesRef, {
          matchId: Math.random().toString().slice(2, 10),
          userId: userId,
          score: gameStats.score,
          kills: gameStats.kills,
          longestLength: gameStats.longestLength,
          rank: Math.floor(Math.random() * 5) + 1,
          coinsEarned: earnedCoins,
          xpEarned: earnedXp,
          timestamp: serverTimestamp(),
          skinUsed: stats.currentSkin
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `snake_player_stats/${userId}`);
      }
    }

    // Submit/update highest recorded accomplishments on the Global Leaderboard in real-time for ALL users (Guests AND Logged-in)
    try {
      const userScoreRef = doc(db, 'snake_scores', userId);
      const currentScoreSnap = await getDoc(userScoreRef);
      
      const existingLeaderboardScore = currentScoreSnap.exists() ? (currentScoreSnap.data()?.score || 0) : 0;
      const existingLeaderboardKills = currentScoreSnap.exists() ? (currentScoreSnap.data()?.kills || 0) : 0;
      const existingLeaderboardLength = currentScoreSnap.exists() ? (currentScoreSnap.data()?.longestLength || 0) : 0;

      // Update with the peak values if this game exceeded any peak values, or if no entry existed yet
      if (!currentScoreSnap.exists() || resolvedHighScore > existingLeaderboardScore || gameStats.kills > existingLeaderboardKills || resolvedLongestLength > existingLeaderboardLength) {
        const latestName = (localStorage.getItem('snake_nickname') || playerDisplayName || 'Spectre').trim();
        await setDoc(userScoreRef, {
          userId: userId,
          username: latestName,
          score: Math.max(resolvedHighScore, existingLeaderboardScore),
          kills: Math.max(gameStats.kills, existingLeaderboardKills),
          longestLength: Math.max(resolvedLongestLength, existingLeaderboardLength),
          timestamp: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Failed to update global scoreboard document for uid/guestId:", userId, err);
    }
  };

  // Buy a lock skin in the custom Shop tab
  const handlePurchaseSkin = async (skinId: string, cost: number) => {
    if (unlockedSkins.includes(skinId)) return; // Prevent double purchases
    if (stats.coins < cost) return;

    const updatedCoins = stats.coins - cost;
    const updatedSkinsList = Array.from(new Set([...unlockedSkins, skinId]));

    setStats(prev => ({
      ...prev,
      coins: updatedCoins
    }));
    setUnlockedSkins(updatedSkinsList);
    confetti();

    // Commit purchase to database
    if (currentUser) {
      try {
        const statsRef = doc(db, 'snake_player_stats', userId);
        await updateDoc(statsRef, {
          coins: updatedCoins
        });

        const inventoryRef = doc(db, 'snake_inventory', userId);
        await setDoc(inventoryRef, {
          userId: userId,
          unlockedSkins: updatedSkinsList
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `snake_inventory/${userId}`);
      }
    }
  };

  // Select skin to equip
  const handleSelectSkin = async (skinId: string) => {
    setStats(prev => ({
      ...prev,
      currentSkin: skinId
    }));

    if (currentUser) {
      try {
        const statsRef = doc(db, 'snake_player_stats', userId);
        await updateDoc(statsRef, {
          currentSkin: skinId
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `snake_player_stats/${userId}`);
      }
    }
  };

  // Handle Daily Streak claims
  const handleClaimDailyReward = async () => {
    const todayStr = new Date().toDateString();
    
    const updatedStats: SnakePlayerStats = {
      ...stats,
      coins: stats.coins + 100,
      dailyRewardsClaimed: stats.dailyRewardsClaimed + 1,
      lastDailyRewardAt: todayStr
    };

    setStats(updatedStats);
    confetti();

    if (currentUser) {
      try {
        const statsRef = doc(db, 'snake_player_stats', userId);
        await setDoc(statsRef, updatedStats);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `snake_player_stats/${userId}`);
      }
    }
  };

  const checkCanClaimDailyReward = () => {
    if (!stats.lastDailyRewardAt) return true;
    return stats.lastDailyRewardAt !== new Date().toDateString();
  };

  const canClaimDailyReward = checkCanClaimDailyReward();

  return (
    <div className="w-full min-h-screen pt-4 pb-12 px-4 max-w-7xl mx-auto flex flex-col gap-4 text-white">
      {/* Brand Header */}
      {!isGameRunning && (
        <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neon-blue/20 flex items-center justify-center text-neon-blue">
              <Gamepad2 size={20} />
            </div>
            <div>
              <h1 className="text-xl font-display font-black uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-neon-blue via-emerald-400 to-purple-400">
                Cosmic Slither .io Arena
              </h1>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Standalone Fullscreen Simulator Mode</p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/games')}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white hover:bg-white/5 border border-white/5 px-4 py-2 rounded-xl transition-all font-semibold"
          >
            <ChevronLeft size={14} /> Back to Games Catalog
          </button>
        </div>
      )}

      {/* Tab Selectors header */}
      {!isGameRunning && (
        <div className="flex border-b border-white/5 mb-8 overflow-x-auto gap-2 text-sm">
          <button
            onClick={() => setActiveTab('play')}
            className={`px-6 py-4 font-bold flex items-center gap-2 whitespace-nowrap transition-colors relative border-0 ${
              activeTab === 'play' ? 'text-neon-blue' : 'text-white/40 hover:text-white'
            }`}
          >
            <Gamepad2 size={16} /> Slither Arena
            {activeTab === 'play' && (
              <motion.div layoutId="active-snake-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-neon-blue" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('shop')}
            className={`px-6 py-4 font-bold flex items-center gap-2 whitespace-nowrap transition-colors relative border-0 ${
              activeTab === 'shop' ? 'text-neon-blue' : 'text-white/40 hover:text-white'
            }`}
          >
            <Palette size={16} /> Skin Shop
            {activeTab === 'shop' && (
              <motion.div layoutId="active-snake-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-neon-blue" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-4 font-bold flex items-center gap-2 whitespace-nowrap transition-colors relative border-0 ${
              activeTab === 'stats' ? 'text-neon-blue' : 'text-white/40 hover:text-white'
            }`}
          >
            <Award size={16} /> My Accomplishments
            {activeTab === 'stats' && (
              <motion.div layoutId="active-snake-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-neon-blue" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-4 font-bold flex items-center gap-2 whitespace-nowrap transition-colors relative border-0 ${
              activeTab === 'leaderboard' ? 'text-neon-blue' : 'text-white/40 hover:text-white'
            }`}
          >
            <Trophy size={16} /> Hall of Fame
            {activeTab === 'leaderboard' && (
              <motion.div layoutId="active-snake-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-neon-blue" />
            )}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/40 text-xs mt-4">Syncing client profile with secure cloud nodes...</p>
        </div>
      ) : (
        <div className="w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'play' && (
              <motion.div
                key="play-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col gap-4 z-10"
              >
                <div className={isGameRunning ? "w-full" : "grid grid-cols-1 lg:grid-cols-4 gap-6 items-start"}>
                  <div className={isGameRunning ? "w-full" : "lg:col-span-3"}>
                    <SnakeGame
                      stats={stats}
                      activeSkinId={stats.currentSkin}
                      playerDisplayName={playerDisplayName}
                      onMatchComplete={handleMatchComplete}
                      onPlayingStateChange={setIsGameRunning}
                    />
                  </div>
                  
                  {!isGameRunning && (
                    <div className="lg:col-span-1">
                      <SnakeCompactLeaderboard 
                         currentUserId={userId} 
                         currentSkinId={stats.currentSkin}
                         onShopClick={() => setActiveTab('shop')} 
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'shop' && (
              <motion.div
                key="shop-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <SnakeShop
                  coins={stats.coins}
                  unlockedSkins={unlockedSkins}
                  activeSkinId={stats.currentSkin}
                  totalKills={stats.killCount}
                  highScore={stats.highScore}
                  totalMatches={stats.matchesPlayed}
                  onPurchaseSkin={handlePurchaseSkin}
                  onSelectSkin={handleSelectSkin}
                />
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div
                key="stats-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <SnakeStats
                  stats={stats}
                  achievements={achievements}
                  onClaimDailyReward={handleClaimDailyReward}
                  canClaimDailyReward={canClaimDailyReward}
                />
              </motion.div>
            )}

            {activeTab === 'leaderboard' && (
              <motion.div
                key="leaderboard-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <SnakeLeaderboard currentUserId={userId} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
