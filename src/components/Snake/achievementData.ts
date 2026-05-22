import { SnakeAchievement } from './types';

export const DEFAULT_ACHIEVEMENTS: SnakeAchievement[] = [
  {
    id: 'first_match',
    title: 'Warming Up',
    description: 'Play your first ever match of Snake .io.',
    icon: '🎮',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rewardCoins: 50,
    type: 'matches'
  },
  {
    id: 'seasoned_veteran',
    title: 'Seasoned Gladiator',
    description: 'Complete 10 total full matches.',
    icon: '👑',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
    rewardCoins: 250,
    type: 'matches'
  },
  {
    id: 'first_kill',
    title: 'First Blood',
    description: 'Slay an opponent bot snake in the arena.',
    icon: '⚔️',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rewardCoins: 50,
    type: 'kills'
  },
  {
    id: 'slayer',
    title: 'Snake Decimator',
    description: 'Defeat 25 total bots in the arena.',
    icon: '💀',
    unlocked: false,
    progress: 0,
    maxProgress: 25,
    rewardCoins: 300,
    type: 'kills'
  },
  {
    id: 'score_rookie',
    title: 'Healthy Appetite',
    description: 'Reach a single game score of 300.',
    icon: '#️⃣',
    unlocked: false,
    progress: 0,
    maxProgress: 300,
    rewardCoins: 100,
    type: 'score'
  },
  {
    id: 'score_expert',
    title: 'Giant Anaconda',
    description: 'Reach an impressive high score of 1,500.',
    icon: '🐉',
    unlocked: false,
    progress: 0,
    maxProgress: 1500,
    rewardCoins: 500,
    type: 'score'
  },
  {
    id: 'length_30',
    title: 'Python Scale',
    description: 'Grow your snake tail length to at least 30 segments.',
    icon: '📏',
    unlocked: false,
    progress: 0,
    maxProgress: 30,
    rewardCoins: 150,
    type: 'length'
  },
  {
    id: 'level_5',
    title: 'Rising Star',
    description: 'Advance your player level to Rank 5.',
    icon: '⭐',
    unlocked: false,
    progress: 1,
    maxProgress: 5,
    rewardCoins: 200,
    type: 'level'
  }
];
