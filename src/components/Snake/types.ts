export interface SnakeSegment {
  x: number;
  y: number;
}

export interface SnakeSkin {
  id: string;
  name: string;
  colorGrade: string; // Tailwind class description or canvas gradient colors
  headColor: string;
  bodyColor: string;
  accentColor: string;
  isGradient: boolean;
  cost: number;
  condition?: string; // e.g. "Kill 50 snakes"
  pattern?: 'classic' | 'neon' | 'glow' | 'rainbow' | 'dragon' | 'stripes' | 'magma' | 'cyberpunk' | 'galaxy' | 'royal' | 'pulsing';
}

export interface SnakePlayerStats {
  userId: string;
  highScore: number;
  totalScore: number;
  coins: number;
  xp: number;
  level: number;
  matchesPlayed: number;
  wins: number;
  killCount: number;
  longestSnakeLength: number;
  currentSkin: string;
  settings: {
    soundEnabled: boolean;
    joystickEnabled: boolean;
    particlesEnabled: boolean;
    minimapEnabled: boolean;
  };
  dailyRewardsClaimed: number;
  lastDailyRewardAt: string | null;
}

export interface BotSnake {
  id: string;
  name: string;
  segments: SnakeSegment[];
  angle: number;
  speed: number;
  color: string;
  headColor: string;
  isBoosting: boolean;
  targetAngle: number;
  changeDirectionTimer: number;
  skinId: string;
}

export interface Pellets {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  points: number;
}

export interface KillRecord {
  id: string;
  killer: string;
  victim: string;
  timestamp: number;
}

export interface FloatingEmote {
  id: string;
  x: number;
  y: number;
  text: string;
  opacity: number;
  timer: number;
}

export interface SnakeScore {
  id?: string;
  userId: string;
  username: string;
  score: number;
  kills: number;
  longestLength: number;
  timestamp: any; // Firestore Timestamp
}

export interface SnakeMatchHistory {
  id?: string;
  matchId: string;
  userId: string;
  score: number;
  kills: number;
  longestLength: number;
  rank: number;
  coinsEarned: number;
  xpEarned: number;
  timestamp: any;
  skinUsed: string;
}

export interface SnakeAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  rewardCoins: number;
  type: 'score' | 'kills' | 'matches' | 'length' | 'level';
}
