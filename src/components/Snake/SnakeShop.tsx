import React from 'react';
import { motion } from 'motion/react';
import { Coins, Check, Lock, ShieldCheck } from 'lucide-react';
import { SnakeSkin } from './types';
import { SKINS } from './skinData';

interface SnakeShopProps {
  coins: number;
  unlockedSkins: string[];
  activeSkinId: string;
  totalKills: number;
  highScore: number;
  totalMatches: number;
  onPurchaseSkin: (skinId: string, cost: number) => void;
  onSelectSkin: (skinId: string) => void;
}

export default function SnakeShop({
  coins,
  unlockedSkins,
  activeSkinId,
  totalKills,
  highScore,
  totalMatches,
  onPurchaseSkin,
  onSelectSkin
}: SnakeShopProps) {
  
  const isSkinUnlocked = (skin: SnakeSkin) => {
    // Check direct purchase status
    if (unlockedSkins.includes(skin.id)) return true;
    if (skin.cost === 0) return true;

    // Check millestone locks
    if (skin.id === 'royal-gold' && highScore >= 2000) return true;
    if (skin.id === 'cosmic-galaxy' && totalMatches >= 10) return true;
    if (skin.id === 'dragon-scale' && totalKills >= 20) return true;

    return false;
  };

  const getSkinLockReason = (skin: SnakeSkin) => {
    if (skin.id === 'royal-gold' && highScore < 2000) {
      return `Requires High Score of 2,000 (Current: ${highScore})`;
    }
    if (skin.id === 'cosmic-galaxy' && totalMatches < 10) {
      return `Requires 10 Matches Played (Current: ${totalMatches}/${10})`;
    }
    if (skin.id === 'dragon-scale' && totalKills < 20) {
      return `Requires 20 Total Kills (Current: ${totalKills}/${20})`;
    }
    return '';
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-neon-blue to-purple-400 bg-clip-text text-transparent">
            Skin Customization Shop
          </h2>
          <p className="text-white/50 text-sm mt-1">Unlock cosmic shells or stripes to dominate the arena in style.</p>
        </div>

        <div className="flex items-center gap-3 bg-neon-blue/10 border border-neon-blue/30 px-5 py-2.5 rounded-2xl">
          <Coins className="text-yellow-400 w-6 h-6 animate-pulse" />
          <div>
            <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Your Balance</div>
            <div className="text-xl font-bold text-yellow-400 font-mono">{coins} COINS</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {SKINS.map((skin) => {
          const unlocked = isSkinUnlocked(skin);
          const active = activeSkinId === skin.id;
          const milestoneLock = skin.condition && !unlocked;
          const milestoneReason = milestoneLock ? getSkinLockReason(skin) : '';

          return (
            <motion.div
              key={skin.id}
              whileHover={{ y: -4 }}
              className={`glass-card p-6 relative overflow-hidden transition-all duration-300 ${
                active ? 'border-neon-blue bg-neon-blue/5 shadow-[0_0_20px_rgba(0,195,255,0.15)]' : 'border-white/5 bg-white/5'
              }`}
            >
              {/* Card visual background glow */}
              <div 
                className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-[40px] opacity-10"
                style={{ background: skin.headColor }}
              ></div>

              {/* Skin Preview Block */}
              <div className="flex justify-center items-center py-6 bg-black/40 rounded-xl mb-4 border border-white/5 relative">
                <div className="flex items-center gap-1.5">
                  {/* Head */}
                  <div 
                    className="w-8 h-8 rounded-full shadow-lg relative flex items-center justify-center border border-white/20"
                    style={{ background: skin.headColor }}
                  >
                    {/* Eyes */}
                    <div className="absolute top-1.5 left-1 w-1.5 h-1.5 rounded-full bg-white flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-black"></div>
                    </div>
                    <div className="absolute top-1.5 right-1 w-1.5 h-1.5 rounded-full bg-white flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-black"></div>
                    </div>
                  </div>
                  {/* Tail segs */}
                  {[1, 2, 3, 4].map((seg) => (
                    <div 
                      key={seg}
                      className="w-6 h-6 rounded-full opacity-80"
                      style={{ 
                        background: skin.isGradient 
                          ? `linear-gradient(135deg, ${skin.bodyColor}, ${skin.accentColor})` 
                          : skin.bodyColor,
                        transform: `scale(${1 - seg * 0.1})`
                      }}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Skin Info */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-lg text-white">{skin.name}</h4>
                  <p className="text-white/40 text-xs mt-0.5">
                    {skin.id === 'default' ? 'Starter Skin' : 'Cosmetic Skin'}
                  </p>
                </div>
                {active && (
                  <span className="flex items-center gap-1 text-[10px] uppercase bg-neon-blue/20 text-neon-blue border border-neon-blue/30 px-2 py-0.5 rounded-lg font-bold">
                    <ShieldCheck size={12} /> Equipped
                  </span>
                )}
              </div>

              {/* Purchase/Select Controls */}
              {unlocked ? (
                <button
                  onClick={() => onSelectSkin(skin.id)}
                  disabled={active}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all duration-200 ${
                    active 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                      : 'bg-white/10 hover:bg-neon-blue/20 text-white hover:text-neon-blue border border-transparent hover:border-neon-blue/30'
                  }`}
                >
                  {active ? (
                    <>
                      <Check size={16} /> Active Skin
                    </>
                  ) : (
                    'Equip Skin'
                  )}
                </button>
              ) : milestoneLock ? (
                <div className="text-center p-2.5 bg-red-500/5 text-red-400/80 border border-red-500/15 rounded-xl text-xs flex flex-col gap-1 items-center justify-center min-h-[46px]">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Lock size={12} /> Milestone Locked
                  </div>
                  <span className="text-[10px] text-white/50">{milestoneReason || skin.condition}</span>
                </div>
              ) : (
                <button
                  onClick={() => onPurchaseSkin(skin.id, skin.cost)}
                  disabled={coins < skin.cost}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold flex justify-center items-center gap-2 border transition-all duration-200 ${
                    coins >= skin.cost
                      ? 'bg-yellow-500/20 hover:bg-yellow-500 text-yellow-400 hover:text-slate-900 border-yellow-500/30'
                      : 'bg-white/5 text-white/20 border-white/5 cursor-not-allowed'
                  }`}
                >
                  <Lock size={14} /> Buy for {skin.cost} Coins
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
