import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Volume2, VolumeX, MessageSquare, ShieldAlert } from 'lucide-react';
import { SnakeSegment, BotSnake, Pellets, KillRecord, FloatingEmote, SnakePlayerStats, SnakeSkin, PowerUpItem } from './types';
import { SKINS } from './skinData';
import { auth, db } from '../../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

// Sound Helper using Web Audio API
class AudioSynth {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    // Lazy initialize to bypass user gesture policy
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public playEat() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {
      // Ignore audio contexts blocks
    }
  }

  public playKill() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(450, this.ctx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {
      // Ignore
    }
  }

  public playDeath() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.5);
      
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch {
      // Ignore
    }
  }

  public playBoost() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(100, this.ctx.currentTime);
      osc.frequency.setValueAtTime(120, this.ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // Ignore
    }
  }
}

const audio = new AudioSynth();

interface SnakeGameProps {
  stats: SnakePlayerStats;
  activeSkinId: string;
  playerDisplayName: string;
  onMatchComplete: (gameStats: { score: number; kills: number; longestLength: number }) => void;
  onPlayingStateChange?: (isPlaying: boolean) => void;
}

const MAP_SIZE = 3500; // Large 2D virtual boundary
const BOT_NAMES = ['AeroSlither', 'RedViper', 'CobraCommander', 'NeonAsphalt', 'VenomDart', 'CosmicWorm', 'SlytherKing', 'Anaconda99', 'Basilisk', 'SneakySid'];
const EMOTE_OPTIONS = ['😂', '🔥', '👑', '😡', '😜', '⚔️', '⚡', '👀'];
const PELLET_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e', '#a7f3d0'];

// Realistic 3D radial shading draw function for snake segments
const drawSnakeSegment = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  baseR: number,
  index: number,
  totalLength: number,
  baseColor: string,
  headColor: string,
  accentColor: string,
  pattern: string | undefined,
  isPlayer: boolean,
  isBoosting: boolean
) => {
  ctx.save();

  // Equal thickness trailing all the time with a subtle breathing shimmer
  const r = baseR;

  // Create standard highlights for 3D sphere look
  let grd = ctx.createRadialGradient(
    x - r * 0.35, y - r * 0.35, r * 0.1,
    x, y, r
  );

  // Set style based on pattern!
  if (pattern === 'rainbow') {
    // Dynamic color cycle based on segment index and time
    const hue = (index * 14 + Date.now() / 8) % 360;
    grd.addColorStop(0, `hsl(${(hue + 60) % 360}, 100%, 85%)`);
    grd.addColorStop(0.3, `hsl(${hue}, 100%, 60%)`);
    grd.addColorStop(1, `hsl(${(hue - 20) % 360}, 100%, 35%)`);
    
    ctx.shadowBlur = isBoosting ? 24 : 10;
    ctx.shadowColor = `hsla(${hue}, 100%, 55%, 0.85)`;
  } else if (pattern === 'neon') {
    grd.addColorStop(0, '#ffffff');
    grd.addColorStop(0.2, '#10b981');
    grd.addColorStop(1, '#064e3b');
    
    ctx.shadowBlur = isBoosting ? 25 : 14;
    ctx.shadowColor = '#10b981';
  } else if (pattern === 'cyberpunk') {
    grd.addColorStop(0, '#fbcfe8');
    grd.addColorStop(0.3, '#ec4899');
    grd.addColorStop(1, '#3b0764');
    
    ctx.shadowBlur = isBoosting ? 20 : 10;
    ctx.shadowColor = '#ec4899';
  } else if (pattern === 'glow') {
    grd.addColorStop(0, '#fef08a');
    grd.addColorStop(0.2, '#ec4899');
    grd.addColorStop(1, '#6b21a8');
    
    ctx.shadowBlur = isBoosting ? 28 : 15;
    ctx.shadowColor = '#f43f5e';
  } else if (pattern === 'magma') {
    // Pulsating flame colors
    const pulse = Math.sin(Date.now() / 120 + index * 0.6) * 0.15 + 0.85;
    grd.addColorStop(0, '#fef08a');
    grd.addColorStop(0.3, `rgba(249, 115, 22, ${pulse})`);
    grd.addColorStop(1, '#7f1d1d');
    
    ctx.shadowBlur = isBoosting ? 30 : 12;
    ctx.shadowColor = '#f97316';
  } else if (pattern === 'pulsing') {
    // Translucent cloaking pulse
    const alpha = (Math.sin(Date.now() / 200 + index * 0.4) * 0.25 + 0.55);
    grd.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    grd.addColorStop(0.3, `rgba(107, 114, 128, ${alpha})`);
    grd.addColorStop(1, `rgba(17, 24, 39, ${alpha})`);
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.15)';
  } else if (pattern === 'galaxy') {
    grd.addColorStop(0, '#e0f2fe');
    grd.addColorStop(0.3, '#8b5cf6');
    grd.addColorStop(1, '#1e1b4b');
    
    ctx.shadowBlur = isBoosting ? 18 : 7;
    ctx.shadowColor = '#a78bfa';
  } else if (pattern === 'royal') {
    grd.addColorStop(0, '#fffbeb');
    grd.addColorStop(0.3, '#fbbf24');
    grd.addColorStop(1, '#78350f');
    
    ctx.shadowBlur = isBoosting ? 24 : 11;
    ctx.shadowColor = '#fbbf24';
  } else if (pattern === 'dragon') {
    grd.addColorStop(0, '#a7f3d0');
    grd.addColorStop(0.3, '#06b6d4');
    grd.addColorStop(1, '#1e293b');
    
    ctx.shadowBlur = isBoosting ? 18 : 8;
    ctx.shadowColor = '#34d399';
  } else if (pattern === 'stripes') {
    grd.addColorStop(0, '#ffedd5');
    grd.addColorStop(0.3, '#f97316');
    grd.addColorStop(1, '#431407');
  } else {
    // default/classic 3D sphere
    grd.addColorStop(0, '#93c5fd');
    grd.addColorStop(0.2, baseColor);
    grd.addColorStop(1, '#1e3a8a');
  }

  // Draw Segment sphere
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grd;
  ctx.fill();

  // --- Beautiful Design textures & overlay designs on top ---
  if (pattern === 'dragon') {
    // Double layered overlapping sharp dragon scales
    ctx.fillStyle = accentColor;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1;

    // Scale 1
    ctx.beginPath();
    ctx.arc(x, y - r * 0.4, r * 0.45, 0, Math.PI, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Scale 2
    ctx.beginPath();
    ctx.arc(x, y + r * 0.4, r * 0.45, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ridge spikes
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + r + 5, y - 3);
    ctx.lineTo(x + r + 5, y + 3);
    ctx.closePath();
    ctx.fill();
  }

  if (pattern === 'galaxy') {
    // Spatial rings orbiting each segment (Saturn-like aspect)
    ctx.strokeStyle = '#c7d2fe';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.25, r * 0.35, Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();

    if (index % 2 === 0) {
      // Orbiting stardust sparkles
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x - r * 0.6, y - r * 0.4, 2, 0, Math.PI * 2);
      ctx.arc(x + r * 0.7, y + r * 0.3, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (pattern === 'royal') {
    // Crown luxury lines with embedded diamond/ruby shape
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x - r * 0.4, y - r * 0.4, r * 0.8, r * 0.8);

    // Luxury Ruby core
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.35);
    ctx.lineTo(x + r * 0.35, y);
    ctx.lineTo(x, y + r * 0.35);
    ctx.lineTo(x - r * 0.35, y);
    ctx.closePath();
    ctx.fill();
  }

  if (pattern === 'cyberpunk') {
    // Technocratic neon cross grids
    ctx.strokeStyle = '#ffffff80';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y);
    ctx.lineTo(x + r * 0.4, y);
    ctx.moveTo(x, y - r * 0.7);
    ctx.lineTo(x, y + r * 0.7);
    ctx.stroke();

    // Central digital core
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (pattern === 'stripes') {
    // Thick tigers stripes with shadow borders
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.70, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  if (pattern === 'rainbow') {
    // Swirling multi-color inner concentric rings
    ctx.strokeStyle = `hsl(${(index * 20 + Date.now() / 6) % 360}, 100%, 75%)`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.60, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.30, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (pattern === 'neon') {
    // Tech-matrix nodes
    ctx.fillStyle = accentColor;
    ctx.fillRect(x - 3, y - 3, 6, 6);
  }

  if (pattern === 'classic' || pattern === 'default' || !pattern) {
    // Simple sleek target rings
    ctx.strokeStyle = '#ffffff30';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
};

// Specialized head cosmetics rendering
const drawSnakeHeadDecorations = (
  ctx: CanvasRenderingContext2D,
  pattern: string | undefined,
  headColor: string,
  accentColor: string
) => {
  ctx.save();

  if (pattern === 'royal') {
    // Fine-tuned golden crown with ruby jewels
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#fffbeb';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-9, -16);
    ctx.lineTo(-13, -8);
    ctx.lineTo(13, -8);
    ctx.lineTo(9, -16);
    ctx.lineTo(3, -11);
    ctx.lineTo(0, -20);
    ctx.lineTo(-3, -11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crown dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -21, 2, 0, Math.PI * 2);
    ctx.arc(-9, -17, 1.5, 0, Math.PI * 2);
    ctx.arc(9, -17, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (pattern === 'dragon') {
    // Abyssal horns
    ctx.fillStyle = '#06b6d4';
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1;
    
    // Left horn
    ctx.beginPath();
    ctx.moveTo(-5, -10);
    ctx.quadraticCurveTo(-14, -19, -15, -14);
    ctx.quadraticCurveTo(-9, -11, -3, -8);
    ctx.fill();
    ctx.stroke();

    // Right horn
    ctx.beginPath();
    ctx.moveTo(5, -10);
    ctx.quadraticCurveTo(15, -19, 16, -14);
    ctx.quadraticCurveTo(10, -11, 3, -8);
    ctx.fill();
    ctx.stroke();
  } else if (pattern === 'magma') {
    // Burning magma sparks
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(-8, -12, 2.5, 0, Math.PI * 2);
    ctx.arc(8, -12, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (pattern === 'galaxy') {
    // Spatial stardust orbital line
    ctx.strokeStyle = 'rgba(199, 210, 254, 0.65)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, -9, 13, 3.5, Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
};

const FRUIT_EMOJIS = ['🍎', '🍌', '🍉', '🍇', '🍓', '🍒', '🍍', '🍊', '🥝', '🍑', '🍋'];
const GEM_EMOJIS = ['💎', '🌌', '⭐', '🔮', '✨', '🌀'];

export default function SnakeGame({
  stats,
  activeSkinId,
  playerDisplayName,
  onMatchComplete,
  onPlayingStateChange
}: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game mode status
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    onPlayingStateChange?.(isPlaying || isGameOver);
  }, [isPlaying, isGameOver, onPlayingStateChange]);
  const [muted, setMuted] = useState(false);
  const [tick, setTick] = useState(0);

  // Live scoreboard trackers
  const [liveScore, setLiveScore] = useState(0);
  const [liveKills, setLiveKills] = useState(0);
  const [maxLengthAchieved, setMaxLengthAchieved] = useState(1);

  // References to keep state synced without retriggering useEffect interval loops
  const playerRef = useRef({
    segments: [] as SnakeSegment[],
    angle: 0,
    speed: 4,
    color: '#3b82f6',
    headColor: '#2563eb',
    accentColor: '#60a5fa',
    isBoosting: false,
    killCount: 0,
    displayName: playerDisplayName || 'Spectre',
    skinId: activeSkinId,
    // Active power-up buffs (measured in frame steps):
    speedTimer: 0,
    magnetTimer: 0,
    doubleTimer: 0,
    shieldTimer: 0,
    freezeTimer: 0
  });

  const botsRef = useRef<BotSnake[]>([]);
  const pelletsRef = useRef<Pellets[]>([]);
  const powerUpsRef = useRef<PowerUpItem[]>([]);
  const killFeedRef = useRef<KillRecord[]>([]);
  const floatEmotesRef = useRef<FloatingEmote[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Live real-time multiplayer states & references
  const myPlayerDocId = useRef(
    auth.currentUser?.uid || 'guest-' + (playerDisplayName || 'Spectre').replace(/\s+/g, '_') + '-' + Math.random().toString().slice(2, 6)
  ).current;
  const multiplayerPlayersRef = useRef<{
    id: string;
    username: string;
    segments: SnakeSegment[];
    angle: number;
    skinId: string;
    score: number;
    lastActive: number;
    headColor: string;
    color: string;
  }[]>([]);

  // Load selected skin assets
  const currentSkin = SKINS.find(s => s.id === activeSkinId) || SKINS[0];

  // Map view dimensions
  const viewSize = useRef({ width: 700, height: 480 });

  useEffect(() => {
    playerRef.current.displayName = playerDisplayName || 'Spectre';
    playerRef.current.skinId = activeSkinId;
    playerRef.current.color = currentSkin.bodyColor;
    playerRef.current.headColor = currentSkin.headColor;
    playerRef.current.accentColor = currentSkin.accentColor;
  }, [playerDisplayName, activeSkinId, currentSkin]);

  // --- REAL-TIME MULTIPLAYER FIREBASE SYNCHRONIZER ---
  useEffect(() => {
    if (!isPlaying) {
      // Clean up self from live players collection immediately if not in-game
      const cleanupMyPresence = async () => {
        try {
          await deleteDoc(doc(db, 'snake_arena_live_players', myPlayerDocId));
        } catch (e) {
          // Ignore
        }
      };
      cleanupMyPresence();
      return;
    }

    // Subscribe in real-time to other live players in the arena
    const playersColRef = collection(db, 'snake_arena_live_players');
    const unsubscribe = onSnapshot(playersColRef, (snapshot) => {
      const list: typeof multiplayerPlayersRef.current = [];
      const now = Date.now();
      snapshot.forEach((doc) => {
        if (doc.id === myPlayerDocId) return; // skip self
        const data = doc.data();
        
        // Render layers that are active within the last 12 seconds (stale cleanup)
        if (data.lastActive && now - data.lastActive < 12000) {
          list.push({
            id: doc.id,
            username: data.username || 'Spectre',
            segments: data.segments || [],
            angle: data.angle || 0,
            skinId: data.skinId || 'default',
            score: data.score || 0,
            lastActive: data.lastActive,
            headColor: data.headColor || '#2563eb',
            color: data.color || '#3b82f6'
          });
        }
      });
      multiplayerPlayersRef.current = list;
    }, (err) => {
      console.error("Firestore Multiplayer Subscription error:", err);
    });

    return () => {
      unsubscribe();
      // clean up presence on component unmount
      const cleanupMyPresence = async () => {
        try {
          await deleteDoc(doc(db, 'snake_arena_live_players', myPlayerDocId));
        } catch (e) {
          // Ignore
        }
      };
      cleanupMyPresence();
    };
  }, [isPlaying, myPlayerDocId]);

  // Handle Mute setting
  const toggleMute = () => {
    audio.enabled = muted;
    setMuted(!muted);
  };

  // Initialize foods and bots
  const initializeGame = () => {
    // 1. Position player in center of MAP
    const startX = MAP_SIZE / 2;
    const startY = MAP_SIZE / 2;
    const initialSegments: SnakeSegment[] = [];
    for (let i = 0; i < 12; i++) {
      initialSegments.push({ x: startX - i * 14, y: startY });
    }

    playerRef.current.segments = initialSegments;
    playerRef.current.angle = 0;
    playerRef.current.killCount = 0;
    playerRef.current.isBoosting = false;
    playerRef.current.speedTimer = 0;
    playerRef.current.magnetTimer = 0;
    playerRef.current.doubleTimer = 0;
    playerRef.current.shieldTimer = 0;
    playerRef.current.freezeTimer = 0;

    setLiveScore(0);
    setLiveKills(0);
    setMaxLengthAchieved(12);

    // 2. Generate 150 juicy fruits and sparkling gem pellets
    const FRUIT_EMOJIS = ['🍎', '🍌', '🍉', '🍇', '🍓', '🍒', '🍍', '🍊', '🥝', '🍑', '🍋'];
    const GEM_EMOJIS = ['💎', '🌌', '⭐', '🔮', '✨', '🌀'];
    
    const pellets: Pellets[] = [];
    for (let i = 0; i < 150; i++) {
      const isFruit = Math.random() < 0.65;
      const emoji = isFruit 
        ? FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)] 
        : GEM_EMOJIS[Math.floor(Math.random() * GEM_EMOJIS.length)];
      pellets.push({
        id: Math.random().toString(),
        x: Math.floor(Math.random() * (MAP_SIZE - 40)) + 20,
        y: Math.floor(Math.random() * (MAP_SIZE - 40)) + 20,
        size: isFruit ? 8 : 6,
        color: PELLET_COLORS[Math.floor(Math.random() * PELLET_COLORS.length)],
        points: isFruit ? 12 : 8,
        fruitEmoji: emoji
      });
    }
    pelletsRef.current = pellets;

    // 3. Spawning 5 scattered power-up bottles
    const powerUps: PowerUpItem[] = [];
    const puTypes: Array<'speed' | 'magnet' | 'double' | 'shield' | 'freeze'> = ['speed', 'magnet', 'double', 'shield', 'freeze'];
    const puEmojis = { speed: '⚡', magnet: '🧲', double: '💰', shield: '🛡️', freeze: '❄️' };
    const puColors = { speed: '#38bdf8', magnet: '#ec4899', double: '#fbbf24', shield: '#10b981', freeze: '#06b6d4' };

    for (let i = 0; i < 5; i++) {
      const type = puTypes[i % puTypes.length];
      powerUps.push({
        id: Math.random().toString(),
        x: Math.floor(Math.random() * (MAP_SIZE - 200)) + 100,
        y: Math.floor(Math.random() * (MAP_SIZE - 200)) + 100,
        type: type,
        color: puColors[type],
        emoji: puEmojis[type],
        pulseScale: 1
      });
    }
    powerUpsRef.current = powerUps;

    // 3. Create 10 hostile AI bot snakes
    const bots: BotSnake[] = [];
    for (let i = 0; i < 10; i++) {
      const spawnX = Math.floor(Math.random() * (MAP_SIZE - 300)) + 150;
      const spawnY = Math.floor(Math.random() * (MAP_SIZE - 300)) + 150;
      
      // Prevent spawning directly on player
      if (Math.hypot(spawnX - startX, spawnY - startY) < 300) continue;

      const botSegs: SnakeSegment[] = [];
      const botSkin = SKINS[Math.floor(Math.random() * SKINS.length)];
      const startAngle = Math.random() * Math.PI * 2;
      
      // Some start as massive bosses!
      const isGiant = Math.random() < 0.25;
      const botLen = isGiant 
        ? Math.floor(Math.random() * 35) + 35 
        : Math.floor(Math.random() * 15) + 8;

      for (let j = 0; j < botLen; j++) {
        botSegs.push({
          x: spawnX - Math.cos(startAngle) * j * 14,
          y: spawnY - Math.sin(startAngle) * j * 14
        });
      }

      let botName = BOT_NAMES[i % BOT_NAMES.length];
      if (isGiant) {
        const prefixes = ['👑 BOSS ', '🔥 OMEGA ', '⚡ TITAN ', '🌟 CHIEF ', '💀 REAPER '];
        botName = prefixes[Math.floor(Math.random() * prefixes.length)] + botName;
      }

      bots.push({
        id: Math.random().toString(),
        name: botName,
        segments: botSegs,
        angle: startAngle,
        speed: 3.5,
        color: botSkin.bodyColor,
        headColor: botSkin.headColor,
        isBoosting: false,
        targetAngle: startAngle,
        changeDirectionTimer: Math.floor(Math.random() * 40) + 10,
        skinId: botSkin.id
      });
    }
    botsRef.current = bots;

    // Clean structures
    killFeedRef.current = [];
    floatEmotesRef.current = [];
  };

  // Steer Head on Mouse angle
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isPlaying) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate mouse position relative to canvas center
    const dx = mouseX - rect.width / 2;
    const dy = mouseY - rect.height / 2;
    
    playerRef.current.angle = Math.atan2(dy, dx);
  };

  const handleMouseDown = () => {
    if (isPlaying) playerRef.current.isBoosting = true;
  };

  const handleMouseUp = () => {
    playerRef.current.isBoosting = false;
  };

  const handleEmoteClick = (emote: string) => {
    if (!isPlaying) return;
    const head = playerRef.current.segments[0];
    const emoteId = Math.random().toString();
    
    floatEmotesRef.current.push({
      id: emoteId,
      x: head.x,
      y: head.y - 30,
      text: emote,
      opacity: 1,
      timer: 45
    });

    // Make bots randomly express emote as well
    if (Math.random() < 0.4 && botsRef.current.length > 0) {
      const idx = Math.floor(Math.random() * botsRef.current.length);
      const botHead = botsRef.current[idx].segments[0];
      floatEmotesRef.current.push({
        id: Math.random().toString(),
        x: botHead.x,
        y: botHead.y - 30,
        text: EMOTE_OPTIONS[Math.floor(Math.random() * EMOTE_OPTIONS.length)],
        opacity: 1,
        timer: 45
      });
    }
  };

  // Keyboard Boost / Keyboard Emotes bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) playerRef.current.isBoosting = true;
      }
      // Hotkeys for Emotes
      if (e.key >= '1' && e.key <= '8') {
        const emoteIdx = parseInt(e.key) - 1;
        if (emoteIdx >= 0 && emoteIdx < EMOTE_OPTIONS.length) {
          handleEmoteClick(EMOTE_OPTIONS[emoteIdx]);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        playerRef.current.isBoosting = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying]);

  const startGame = () => {
    setIsGameOver(false);
    initializeGame();
    setIsPlaying(true);

    // Effortless standard browser-level fullscreen projection if supported
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if ((docEl as any).webkitRequestFullscreen) {
        (docEl as any).webkitRequestFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen request not allowed or supported inside iframe context:", e);
    }
  };

  const triggerDeath = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    audio.playDeath();

    // Reset standard browser-level fullscreen smoothly if active
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {
      console.warn("Could not exit fullscreen context:", e);
    }

    const scoreSubmit = liveScore;
    const killsSubmit = liveKills;
    const lengthSubmit = maxLengthAchieved;

    // Save permanently in database
    onMatchComplete({
      score: scoreSubmit,
      kills: killsSubmit,
      longestLength: lengthSubmit
    });
  };

  // Loop runner inside canvas
  useEffect(() => {
    if (!isPlaying) return;

    let animId = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI responsive canvas dimensional updater
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const dpr = window.devicePixelRatio || 1;
        const rect = parent.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = (rect.height || 520) * dpr;
        
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Clear transforms
        ctx.scale(dpr, dpr);
        
        viewSize.current = { width: rect.width, height: rect.height || 520 };
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const updateAndDraw = () => {
      if (!isPlaying) return;

      const player = playerRef.current;
      const head = player.segments[0];

      // --- 1. Settle speed parameters (speed powerup offers free high-velocity slithering) ---
      const isSpeedActive = player.speedTimer > 0;
      let playerSpeed = (player.isBoosting || isSpeedActive) ? 6 : 3.5;
      
      if (player.isBoosting && player.segments.length > 6 && animId % 10 === 0) {
        if (!isSpeedActive) {
          // Normal boosting consumes tail length to shed pellet seeds
          const last = player.segments.pop();
          if (last) {
            pelletsRef.current.push({
              id: Math.random().toString(),
              x: last.x + (Math.random() * 20 - 10),
              y: last.y + (Math.random() * 20 - 10),
              size: 4,
              color: '#ffffff',
              points: 5
            });
            audio.playBoost();
          }
        } else {
          // Free speed bottle boosting! Just trigger minor sound effect.
          audio.playBoost();
        }
      }

      // Decrement active power-up buff frame timers
      if (player.speedTimer > 0) player.speedTimer--;
      if (player.magnetTimer > 0) player.magnetTimer--;
      if (player.doubleTimer > 0) player.doubleTimer--;
      if (player.shieldTimer > 0) player.shieldTimer--;
      if (player.freezeTimer > 0) player.freezeTimer--;

      // --- 2. Update player head segment coordinates ---
      const nextHeadX = head.x + Math.cos(player.angle) * playerSpeed;
      const nextHeadY = head.y + Math.sin(player.angle) * playerSpeed;

      // Bound player inside arena walls
      if (nextHeadX < 10 || nextHeadX > MAP_SIZE - 10 || nextHeadY < 10 || nextHeadY > MAP_SIZE - 10) {
        triggerDeath();
        return;
      }

      // Sliding chain logic for entire tail segments
      const newSegments = [{ x: nextHeadX, y: nextHeadY }];
      const targetSpacing = 15; // Distance between tail segment links

      for (let i = 1; i < player.segments.length; i++) {
        const prevSeg = newSegments[i - 1];
        const curSeg = player.segments[i];
        const dx = curSeg.x - prevSeg.x;
        const dy = curSeg.y - prevSeg.y;
        const dist = Math.hypot(dx, dy);

        if (dist > targetSpacing) {
          const ratio = targetSpacing / dist;
          newSegments.push({
            x: prevSeg.x + dx * ratio,
            y: prevSeg.y + dy * ratio
          });
        } else {
          newSegments.push({ ...curSeg });
        }
      }
      player.segments = newSegments;
      const computedScore = player.segments.length * 15 - 180 + player.killCount * 100;
      setLiveScore(computedScore);
      setMaxLengthAchieved(prev => Math.max(prev, player.segments.length));

      // Publish coords to Firebase live multiplayer arena collection at highly optimized rate
      if (animId % 10 === 0 && isPlaying) {
        try {
          setDoc(doc(db, 'snake_arena_live_players', myPlayerDocId), {
            userId: myPlayerDocId,
            username: player.displayName,
            segments: player.segments,
            angle: player.angle,
            skinId: player.skinId,
            score: computedScore,
            lastActive: Date.now(),
            headColor: player.headColor,
            color: player.color
          });
        } catch (e) {
          // Fail silently
        }
      }

      // --- 3. Update AI Bots Steering (Bots are slowed by 65% when Ice freeze bottle is active!) ---
      const botSpeedMult = player.freezeTimer > 0 ? 0.35 : 1.0;

      botsRef.current.forEach((bot) => {
        const botHead = bot.segments[0];
        bot.changeDirectionTimer--;

        // Determine if bot should boost (speed increases when trying to attack/escape)
        const playerDist = Math.hypot(player.segments[0].x - botHead.x, player.segments[0].y - botHead.y);
        
        // Boost conditions: If close to player or another giant snake, and has enough length
        if (bot.segments.length > 15 && (playerDist < 350 || Math.random() < 0.05)) {
          // 35% chance of active boosting to make it action-packed
          bot.isBoosting = Math.random() < 0.35;
        } else {
          bot.isBoosting = false;
        }

        const currentBotSpeed = (bot.isBoosting ? 5.5 : 3.2) * botSpeedMult;

        // 1. Basic Pellet Seeking or Random steering
        if (bot.changeDirectionTimer <= 0) {
          bot.changeDirectionTimer = Math.floor(Math.random() * 40) + 20; // quicker re-steering for harder bots
          
          let closestPellet: Pellets | null = null;
          let minDist = 350; // wider view range
          pelletsRef.current.forEach((p) => {
            const dist = Math.hypot(p.x - botHead.x, p.y - botHead.y);
            if (dist < minDist) {
              minDist = dist;
              closestPellet = p;
            }
          });

          if (closestPellet) {
            bot.targetAngle = Math.atan2((closestPellet as any).y - botHead.y, (closestPellet as any).x - botHead.x);
          } else {
            bot.targetAngle += (Math.random() * 1.6 - 0.8);
          }
        }

        // 2. ACTIVE OBSTACLE AVOIDANCE (Smarter Collision evasion of bodies!)
        // Project a collision ray ahead of the bot head
        const checkDist = bot.isBoosting ? 130 : 85;
        const rayEndX = botHead.x + Math.cos(bot.angle) * checkDist;
        const rayEndY = botHead.y + Math.sin(bot.angle) * checkDist;

        let needsEvasion = false;
        let evasionAngle = 0;

        // Check player body
        for (let k = 0; k < player.segments.length; k++) {
          const seg = player.segments[k];
          const distToRay = Math.hypot(seg.x - rayEndX, seg.y - rayEndY);
          if (distToRay < 55) { // danger zone
            needsEvasion = true;
            const angleToSeg = Math.atan2(seg.y - botHead.y, seg.x - botHead.x);
            const relativeAngle = Math.atan2(Math.sin(angleToSeg - bot.angle), Math.cos(angleToSeg - bot.angle));
            evasionAngle = relativeAngle > 0 ? bot.angle - Math.PI / 2.5 : bot.angle + Math.PI / 2.5;
            break;
          }
        }

        // Check other bot bodies
        if (!needsEvasion) {
          for (let bIdx = 0; bIdx < botsRef.current.length; bIdx++) {
            const other = botsRef.current[bIdx];
            if (other.id === bot.id) continue;
            for (let k = 0; k < other.segments.length; k++) {
              const seg = other.segments[k];
              const distToRay = Math.hypot(seg.x - rayEndX, seg.y - rayEndY);
              if (distToRay < 55) {
                needsEvasion = true;
                const angleToSeg = Math.atan2(seg.y - botHead.y, seg.x - botHead.x);
                const relativeAngle = Math.atan2(Math.sin(angleToSeg - bot.angle), Math.cos(angleToSeg - bot.angle));
                evasionAngle = relativeAngle > 0 ? bot.angle - Math.PI / 2.5 : bot.angle + Math.PI / 2.5;
                break;
              }
            }
            if (needsEvasion) break;
          }
        }

        if (needsEvasion) {
          bot.targetAngle = evasionAngle;
          bot.changeDirectionTimer = 15; // Hold avoidance action briefly
        }

        // 3. SECURE SMOOTH WALL AVOIDANCE (Steer away dynamically before crashing)
        let avoidForceX = 0;
        let avoidForceY = 0;
        const wallBuffer = 300; // start avoiding 300px away from the boundary
        if (botHead.x < wallBuffer) {
          avoidForceX = (wallBuffer - botHead.x) / wallBuffer;
        } else if (botHead.x > MAP_SIZE - wallBuffer) {
          avoidForceX = -((botHead.x - (MAP_SIZE - wallBuffer)) / wallBuffer);
        }
        if (botHead.y < wallBuffer) {
          avoidForceY = (wallBuffer - botHead.y) / wallBuffer;
        } else if (botHead.y > MAP_SIZE - wallBuffer) {
          avoidForceY = -((botHead.y - (MAP_SIZE - wallBuffer)) / wallBuffer);
        }

        if (avoidForceX !== 0 || avoidForceY !== 0) {
          // Blend current heading with avoidance force vector smoothly
          const targetAvoidAngle = Math.atan2(Math.sin(bot.angle) + avoidForceY * 2.8, Math.cos(bot.angle) + avoidForceX * 2.8);
          bot.targetAngle = targetAvoidAngle;
          bot.angle += Math.sin(targetAvoidAngle - bot.angle) * 0.18;
        }

        // Smoothly interpolate bots angles (faster turnrate when boosting or escaping)
        const turnSpeed = (bot.isBoosting || needsEvasion) ? 0.18 : 0.08;
        const angleDiff = bot.targetAngle - bot.angle;
        bot.angle += Math.sin(angleDiff) * turnSpeed;

        // Propagate updates (and physically clamp bot coordinates inside the arena so they never die on walls)
        const nextBotHeadX = Math.max(20, Math.min(MAP_SIZE - 20, botHead.x + Math.cos(bot.angle) * currentBotSpeed));
        const nextBotHeadY = Math.max(20, Math.min(MAP_SIZE - 20, botHead.y + Math.sin(bot.angle) * currentBotSpeed));
        const nextBotSegs = [{ x: nextBotHeadX, y: nextBotHeadY }];

        for (let j = 1; j < bot.segments.length; j++) {
          const prev = nextBotSegs[j - 1];
          const cur = bot.segments[j];
          const dx = cur.x - prev.x;
          const dy = cur.y - prev.y;
          const dist = Math.hypot(dx, dy);
          if (dist > targetSpacing) {
            nextBotSegs.push({
              x: prev.x + dx * (targetSpacing / dist),
              y: prev.y + dy * (targetSpacing / dist)
            });
          } else {
            nextBotSegs.push({ ...cur });
          }
        }

        // If the bot is actively speed boosting, spawn pellet crumbs occasionally at their tail segment
        if (bot.isBoosting && bot.segments.length > 8 && animId % 15 === 0) {
          const last = bot.segments[bot.segments.length - 1];
          pelletsRef.current.push({
            id: Math.random().toString(),
            x: last.x + (Math.random() * 20 - 10),
            y: last.y + (Math.random() * 20 - 10),
            size: 4,
            color: bot.color,
            points: 5
          });
        }

        bot.segments = nextBotSegs;
      });

      // --- 4. Pellet Suction & Consumptions ---
      const currentHead = player.segments[0];
      const radiusPlayer = 15;

      // Handle Magnet powerup suction (pulls close fruits/gems closer rapidly!)
      if (player.magnetTimer > 0) {
        pelletsRef.current.forEach((p) => {
          const dx = currentHead.x - p.x;
          const dy = currentHead.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 200 && dist > 5) {
            p.x += (dx / dist) * 7.5;
            p.y += (dy / dist) * 7.5;
          }
        });
        powerUpsRef.current.forEach((pu) => {
          const dx = currentHead.x - pu.x;
          const dy = currentHead.y - pu.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 200 && dist > 5) {
            pu.x += (dx / dist) * 7.5;
            pu.y += (dy / dist) * 7.5;
          }
        });
      }

      // Player eating pellets (Double score multiplier grants 2x tail growth chances!)
      pelletsRef.current = pelletsRef.current.filter((p) => {
        const dist = Math.hypot(p.x - currentHead.x, p.y - currentHead.y);
        if (dist < radiusPlayer + p.size) {
          const growthChance = player.doubleTimer > 0 ? 0.50 : 0.25;
          if (Math.random() < growthChance) {
            const tail = player.segments[player.segments.length - 1];
            player.segments.push({ x: tail.x, y: tail.y });
          }
          audio.playEat();
          return false; // Pellets consumed
        }
        return true;
      });

      // Player eating physical power-ups
      powerUpsRef.current = powerUpsRef.current.filter((pu) => {
        const dist = Math.hypot(pu.x - currentHead.x, pu.y - currentHead.y);
        if (dist < radiusPlayer + 14) {
          if (pu.type === 'speed') {
            player.speedTimer = 600; // 10 seconds of free speed boost
          } else if (pu.type === 'magnet') {
            player.magnetTimer = 900; // 15 seconds of item magnet
          } else if (pu.type === 'double') {
            player.doubleTimer = 900; // 15 seconds of double points tail growth
          } else if (pu.type === 'shield') {
            player.shieldTimer = 750; // 12 seconds of invulnerability shield
          } else if (pu.type === 'freeze') {
            player.freezeTimer = 600; // 10 seconds of bot slow down ice
          }

          audio.playEat();

          // Spawn beautiful localized text alert above player snake head
          floatEmotesRef.current.push({
            id: Math.random().toString(),
            x: currentHead.x,
            y: currentHead.y - 40,
            text: `🧪 ${pu.type.toUpperCase()} ACTIVATED! ${pu.emoji}`,
            opacity: 1,
            timer: 75
          });

          return false; // Bottle consumed
        }
        return true;
      });

      // Bots eating pellets
      botsRef.current.forEach((bot) => {
        const botHead = bot.segments[0];
        pelletsRef.current = pelletsRef.current.filter((p) => {
          const dist = Math.hypot(p.x - botHead.x, p.y - botHead.y);
          if (dist < 15 + p.size) {
            if (Math.random() < 0.25) {
              const tail = bot.segments[bot.segments.length - 1];
              bot.segments.push({ x: tail.x, y: tail.y });
            }
            return false;
          }
          return true;
        });
      });

      // Replenish pellets (juicy fruits and luxury glowing gems!)
      while (pelletsRef.current.length < 150) {
        const FRUIT_EMOJIS = ['🍎', '🍌', '🍉', '🍇', '🍓', '🍒', '🍍', '🍊', '🥝', '🍑', '🍋'];
        const GEM_EMOJIS = ['💎', '🌌', '⭐', '🔮', '✨', '🌀'];
        const isFruit = Math.random() < 0.65;
        const emoji = isFruit 
          ? FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)] 
          : GEM_EMOJIS[Math.floor(Math.random() * GEM_EMOJIS.length)];
        pelletsRef.current.push({
          id: Math.random().toString(),
          x: Math.floor(Math.random() * (MAP_SIZE - 40)) + 20,
          y: Math.floor(Math.random() * (MAP_SIZE - 40)) + 20,
          size: isFruit ? 8 : 6,
          color: PELLET_COLORS[Math.floor(Math.random() * PELLET_COLORS.length)],
          points: isFruit ? 12 : 8,
          fruitEmoji: emoji
        });
      }

      // Replenish power ups always to keep 5 on the battlefield
      while (powerUpsRef.current.length < 5) {
        const puTypes: Array<'speed' | 'magnet' | 'double' | 'shield' | 'freeze'> = ['speed', 'magnet', 'double', 'shield', 'freeze'];
        const puEmojis = { speed: '⚡', magnet: '🧲', double: '💰', shield: '🛡️', freeze: '❄️' };
        const puColors = { speed: '#38bdf8', magnet: '#ec4899', double: '#fbbf24', shield: '#10b981', freeze: '#06b6d4' };
        const type = puTypes[Math.floor(Math.random() * puTypes.length)];
        powerUpsRef.current.push({
          id: Math.random().toString(),
          x: Math.floor(Math.random() * (MAP_SIZE - 200)) + 100,
          y: Math.floor(Math.random() * (MAP_SIZE - 200)) + 100,
          type: type,
          color: puColors[type],
          emoji: puEmojis[type],
          pulseScale: 1
        });
      }

      // --- 5. Hostile Inter-Snake Collisions ---
      const headCoords = player.segments[0];

      // Check if player runs into any bot body
      let playerDied = false;
      botsRef.current.forEach((bot) => {
        // Skip head index [0] to prevent dual head locks
        for (let j = 1; j < bot.segments.length; j++) {
          const segCoords = bot.segments[j];
          const dist = Math.hypot(headCoords.x - segCoords.x, headCoords.y - segCoords.y);
          if (dist < 22) { // Collision threshold
            if (player.shieldTimer > 0) {
              // Shield absorbed! Bounce the snake head back
              player.angle = player.angle + Math.PI;
              player.shieldTimer = Math.max(0, player.shieldTimer - 150); // subtract armor timer
              floatEmotesRef.current.push({
                id: Math.random().toString(),
                x: headCoords.x,
                y: headCoords.y - 35,
                text: '🛡️ SHIELD BLOCKED COLLISION!',
                opacity: 1,
                timer: 50
              });
            } else {
              playerDied = true;
            }
          }
        }
      });

      // Check if player runs into any other real multiplayer player body
      multiplayerPlayersRef.current.forEach((mp) => {
        if (!mp.segments || mp.segments.length === 0) return;
        // Skip head index [0] to prevent dual head locks
        for (let j = 1; j < mp.segments.length; j++) {
          const segCoords = mp.segments[j];
          if (!segCoords) continue;
          const dist = Math.hypot(headCoords.x - segCoords.x, headCoords.y - segCoords.y);
          if (dist < 22) { // Collision threshold
            if (player.shieldTimer > 0) {
              // Shield absorbed! Bounce the snake head back
              player.angle = player.angle + Math.PI;
              player.shieldTimer = Math.max(0, player.shieldTimer - 150);
              floatEmotesRef.current.push({
                id: Math.random().toString(),
                x: headCoords.x,
                y: headCoords.y - 35,
                text: '🛡️ SHIELD BLOCKED COLLISION!',
                opacity: 1,
                timer: 50
              });
            } else {
              playerDied = true;
            }
          }
        }
      });

      if (playerDied) {
        triggerDeath();
        return;
      }

      // Check if bots run into either player body or other bots bodies
      const remainingBots: BotSnake[] = [];
      botsRef.current.forEach((bot) => {
        const botHead = bot.segments[0];
        let botCrashed = false;
        let killedByPlayer = false;

        // Hit player body?
        for (let k = 0; k < player.segments.length; k++) {
          const pSeg = player.segments[k];
          const dist = Math.hypot(botHead.x - pSeg.x, botHead.y - pSeg.y);
          if (dist < 22) {
            botCrashed = true;
            if (k === 0) {
              // Duel of heads: larger wins
              if (bot.segments.length > player.segments.length) {
                if (player.shieldTimer > 0) {
                  // Shield absorbs head collision!
                  player.angle = player.angle + Math.PI;
                  player.shieldTimer = Math.max(0, player.shieldTimer - 120);
                  botCrashed = true; // bot dies instead because player is shielded!
                } else {
                  playerDied = true;
                }
              }
            } else {
              killedByPlayer = true;
            }
          }
        }

        // Hit other bots body?
        let killerName = '';
        botsRef.current.forEach((otherBot) => {
          if (otherBot.id === bot.id) return;
          for (let k = 0; k < otherBot.segments.length; k++) {
            const bSeg = otherBot.segments[k];
            const dist = Math.hypot(botHead.x - bSeg.x, botHead.y - bSeg.y);
            if (dist < 22) {
              botCrashed = true;
              killerName = otherBot.name;
            }
          }
        });

        // Hit other real players' bodies?
        multiplayerPlayersRef.current.forEach((mp) => {
          if (!mp.segments) return;
          for (let k = 0; k < mp.segments.length; k++) {
            const pSeg = mp.segments[k];
            if (!pSeg) continue;
            const dist = Math.hypot(botHead.x - pSeg.x, botHead.y - pSeg.y);
            if (dist < 22) {
              botCrashed = true;
              killerName = mp.username;
            }
          }
        });

        if (botCrashed) {
          // turn bot into colorful food pellets
          bot.segments.forEach((seg, idx) => {
            if (idx % 2 === 0) {
              const isFruit = Math.random() < 0.65;
              const emoji = isFruit 
                ? FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)] 
                : GEM_EMOJIS[Math.floor(Math.random() * GEM_EMOJIS.length)];
              pelletsRef.current.push({
                id: Math.random().toString(),
                x: seg.x + (Math.random() * 14 - 7),
                y: seg.y + (Math.random() * 14 - 7),
                size: isFruit ? 9 : 7,
                color: bot.color,
                points: 15,
                fruitEmoji: emoji
              });
            }
          });

          if (killedByPlayer) {
            player.killCount++;
            setLiveKills(player.killCount);
            audio.playKill();
            
            // Add to live kill feed
            const logId = Math.random().toString();
            killFeedRef.current.push({
              id: logId,
              killer: player.displayName,
              victim: bot.name,
              timestamp: Date.now()
            });
            // Keep top 4 logs
            if (killFeedRef.current.length > 4) {
              killFeedRef.current.shift();
            }
          } else {
            killFeedRef.current.push({
              id: Math.random().toString(),
              killer: killerName || 'Battle Crash',
              victim: bot.name,
              timestamp: Date.now()
            });
            if (killFeedRef.current.length > 4) {
              killFeedRef.current.shift();
            }
          }
        } else {
          remainingBots.push(bot);
        }
      });

      if (playerDied) {
        triggerDeath();
        return;
      }

      // Replenish bots
      while (remainingBots.length < 10) {
        const spawnX = Math.floor(Math.random() * (MAP_SIZE - 300)) + 150;
        const spawnY = Math.floor(Math.random() * (MAP_SIZE - 300)) + 150;
        const botSegs: SnakeSegment[] = [];
        const botSkin = SKINS[Math.floor(Math.random() * SKINS.length)];
        const startAngle = Math.random() * Math.PI * 2;
        
        // 25% of bots replenish as huge behemoths!
        const isGiant = Math.random() < 0.25;
        const botLen = isGiant 
          ? Math.floor(Math.random() * 35) + 35 
          : Math.floor(Math.random() * 15) + 8;

        for (let j = 0; j < botLen; j++) {
          botSegs.push({
            x: spawnX - Math.cos(startAngle) * j * 14,
            y: spawnY - Math.sin(startAngle) * j * 14
          });
        }

        let botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
        if (isGiant) {
          const prefixes = ['👑 BOSS ', '🔥 OMEGA ', '⚡ TITAN ', '🌟 CHIEF ', '💀 REAPER '];
          botName = prefixes[Math.floor(Math.random() * prefixes.length)] + botName;
        }

        remainingBots.push({
          id: Math.random().toString(),
          name: botName,
          segments: botSegs,
          angle: startAngle,
          speed: 3.5,
          color: botSkin.bodyColor,
          headColor: botSkin.headColor,
          isBoosting: false,
          targetAngle: startAngle,
          changeDirectionTimer: Math.floor(Math.random() * 40) + 10,
          skinId: botSkin.id
        });
      }
      botsRef.current = remainingBots;

      // Update emotes opacity
      floatEmotesRef.current.forEach((em) => {
        em.timer--;
        if (em.timer <= 20) {
          em.opacity = em.timer / 20;
        }
        em.y -= 0.8; // Float up
      });
      floatEmotesRef.current = floatEmotesRef.current.filter(em => em.timer > 0);

      // --- 6. Render Map View relative to Camera (Player centered) ---
      const camX = currentHead.x - viewSize.current.width / 2;
      const camY = currentHead.y - viewSize.current.height / 2;

      // Clear canvas
      ctx.fillStyle = '#08090d'; // Deeper space background 
      ctx.fillRect(0, 0, viewSize.current.width, viewSize.current.height);

      // Draw virtual map space background grid (Lines drawn relative to camera offset)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      const startGridX = Math.floor(camX / gridSize) * gridSize;
      const startGridY = Math.floor(camY / gridSize) * gridSize;

      for (let x = startGridX; x < startGridX + viewSize.current.width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x - camX, 0);
        ctx.lineTo(x - camX, viewSize.current.height);
        ctx.stroke();
      }
      for (let y = startGridY; y < startGridY + viewSize.current.height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y - camY);
        ctx.lineTo(viewSize.current.width, y - camY);
        ctx.stroke();
      }

      // Draw map outer borders
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 6;
      ctx.strokeRect(-camX, -camY, MAP_SIZE, MAP_SIZE);

      // Render colorful pellets (high-quality fruit and gem emojis)
      pelletsRef.current.forEach((pellet) => {
        // Frustum culling (only draw elements inside player bounds)
        if (
          pellet.x - pellet.size - camX >= 0 &&
          pellet.x + pellet.size - camX <= viewSize.current.width &&
          pellet.y - pellet.size - camY >= 0 &&
          pellet.y + pellet.size - camY <= viewSize.current.height
        ) {
          ctx.save();
          // Draw a soft glowing halo behind
          ctx.beginPath();
          ctx.arc(pellet.x - camX, pellet.y - camY, pellet.size * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = pellet.color + '15';
          ctx.fill();

          if (pellet.fruitEmoji) {
            // Draw fruit Emoji!
            ctx.font = `${Math.floor(pellet.size * 2.1)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pellet.fruitEmoji, pellet.x - camX, pellet.y - camY);
          } else {
            // Falling back to glossy gem look
            const radGrd = ctx.createRadialGradient(
              pellet.x - camX - pellet.size*0.3, pellet.y - camY - pellet.size*0.3, pellet.size*0.1,
              pellet.x - camX, pellet.y - camY, pellet.size
            );
            radGrd.addColorStop(0, '#ffffff');
            radGrd.addColorStop(0.3, pellet.color);
            radGrd.addColorStop(1, '#000000');
            ctx.beginPath();
            ctx.arc(pellet.x - camX, pellet.y - camY, pellet.size, 0, Math.PI * 2);
            ctx.fillStyle = radGrd;
            ctx.fill();
          }
          ctx.restore();
        }
      });

      // Draw active powerups on map
      powerUpsRef.current.forEach((pu) => {
        // Frustum culling
        if (
          pu.x - 35 - camX >= 0 &&
          pu.x + 35 - camX <= viewSize.current.width &&
          pu.y - 35 - camY >= 0 &&
          pu.y + 35 - camY <= viewSize.current.height
        ) {
          ctx.save();
          const px = pu.x - camX;
          const py = pu.y - camY;
          const pulse = Math.sin(Date.now() / 150) * 3 + 20;

          // Outer neon glow ring
          ctx.strokeStyle = pu.color;
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 20;
          ctx.shadowColor = pu.color;
          ctx.beginPath();
          ctx.arc(px, py, pulse, 0, Math.PI * 2);
          ctx.stroke();

          // Soft radial gradient fill back
          const rad = ctx.createRadialGradient(px, py, 2, px, py, pulse);
          rad.addColorStop(0, pu.color + '45');
          rad.addColorStop(0.7, pu.color + '15');
          rad.addColorStop(1, 'transparent');
          ctx.fillStyle = rad;
          ctx.beginPath();
          ctx.arc(px, py, pulse, 0, Math.PI * 2);
          ctx.fill();

          // Physical Chemistry/Apothecary science bottle glass structure
          ctx.shadowBlur = 5;
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.strokeStyle = '#ffffffde';
          ctx.lineWidth = 2;
          ctx.fillStyle = pu.color + '35'; // glowing liquid color fill

          ctx.beginPath();
          // Top lip
          ctx.moveTo(px - 6, py - 15);
          ctx.lineTo(px + 6, py - 15);
          // Neck left
          ctx.moveTo(px - 4, py - 15);
          ctx.lineTo(px - 4, py - 6);
          // Bulb body left
          ctx.quadraticCurveTo(px - 14, py - 2, px - 14, py + 8);
          // Base bottom
          ctx.lineTo(px - 10, py + 15);
          ctx.lineTo(px + 10, py + 15);
          // Bulb body right
          ctx.lineTo(px + 14, py + 8);
          ctx.quadraticCurveTo(px + 14, py - 2, px + 4, py - 6);
          // Neck right
          ctx.lineTo(px + 4, py - 15);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Cork stopper
          ctx.fillStyle = '#b45309'; // woody brown rustic stopper
          ctx.fillRect(px - 5, py - 19, 10, 5);

          // Render the glowing emoji centered inside the glass bulb!
          ctx.shadowBlur = 0;
          ctx.font = '13px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pu.emoji, px, py + 3);

          // Render overhead scientific tag
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 8;
          ctx.shadowColor = pu.color;
          ctx.font = 'black 9px Courier New, monospace';
          ctx.fillText(pu.type.toUpperCase(), px, py - 26);

          ctx.restore();
        }
      });

      // Render AI bot snakes
      botsRef.current.forEach((bot) => {
        ctx.shadowBlur = 0;
        const botSkinObj = SKINS.find(s => s.id === bot.skinId) || SKINS[0];
        const botPattern = botSkinObj.pattern;
        
        // Body (Render from tail to head)
        for (let j = bot.segments.length - 1; j > 0; j--) {
          const seg = bot.segments[j];
          const r = 18; // Constant equal size for bots
          
          drawSnakeSegment(
            ctx,
            seg.x - camX,
            seg.y - camY,
            r,
            j,
            bot.segments.length,
            bot.color,
            bot.headColor,
            botSkinObj.accentColor || '#ffffff',
            botPattern,
            false,
            bot.isBoosting
          );
        }

        // Head
        const bHead = bot.segments[0];
        ctx.beginPath();
        ctx.arc(bHead.x - camX, bHead.y - camY, 20, 0, Math.PI * 2);
        ctx.fillStyle = bot.headColor;
        ctx.fill();

        // Bot head cosmetics based on skin pattern
        ctx.save();
        ctx.translate(bHead.x - camX, bHead.y - camY);
        ctx.rotate(bot.angle);
        drawSnakeHeadDecorations(ctx, botPattern, bot.headColor, botSkinObj.accentColor || '#ffffff');
        ctx.restore();

        // Eyes & Eyeballs
        ctx.save();
        ctx.translate(bHead.x - camX, bHead.y - camY);
        ctx.rotate(bot.angle);
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(6, -5, 3.5, 0, Math.PI * 2);
        ctx.arc(6, 5, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(8, -5, 1.5, 0, Math.PI * 2);
        ctx.arc(8, 5, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Name Tag
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(bot.name, bHead.x - camX, bHead.y - camY - 20);
      });

      // Render other real-time multiplayer players in the same arena!
      multiplayerPlayersRef.current.forEach((mp) => {
        if (!mp.segments || mp.segments.length === 0) return;
        ctx.shadowBlur = 0;
        const mpSkinObj = SKINS.find(s => s.id === mp.skinId) || SKINS[0];
        const mpPattern = mpSkinObj.pattern;

        // Draw body (Render from tail to head)
        for (let j = mp.segments.length - 1; j > 0; j--) {
          const seg = mp.segments[j];
          if (!seg) continue;
          const r = 21; // Match player size for true human presence

          drawSnakeSegment(
            ctx,
            seg.x - camX,
            seg.y - camY,
            r,
            j,
            mp.segments.length,
            mp.color,
            mp.headColor,
            mpSkinObj.accentColor || '#ffffff',
            mpPattern,
            false,
            false
          );
        }

        // Draw head
        const mpHead = mp.segments[0];
        if (mpHead) {
          ctx.beginPath();
          ctx.arc(mpHead.x - camX, mpHead.y - camY, 23, 0, Math.PI * 2);
          ctx.fillStyle = mp.headColor;
          ctx.fill();

          // Head Cosmetics based on skin pattern
          ctx.save();
          ctx.translate(mpHead.x - camX, mpHead.y - camY);
          ctx.rotate(mp.angle || 0);
          drawSnakeHeadDecorations(ctx, mpPattern, mp.headColor, mpSkinObj.accentColor || '#ffffff');
          ctx.restore();

          // Eyes
          ctx.save();
          ctx.translate(mpHead.x - camX, mpHead.y - camY);
          ctx.rotate(mp.angle || 0);

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(6, -6, 4, 0, Math.PI * 2);
          ctx.arc(6, 6, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(8, -6, 2, 0, Math.PI * 2);
          ctx.arc(8, 6, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Dynamic Name tag for real human opponents
          ctx.fillStyle = '#38bdf8'; // Sky blue for real players
          ctx.font = 'bold 11px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`🎮 ${mp.username} (${mp.score})`, mpHead.x - camX, mpHead.y - camY - 24);
        }
      });

      // Render player snake
      ctx.shadowBlur = 0;
      const playerPattern = currentSkin.pattern;

      // Draw body
      for (let j = player.segments.length - 1; j > 0; j--) {
        const seg = player.segments[j];
        const r = 21; // Constant equal size for player (larger and thicker)
        
        drawSnakeSegment(
          ctx,
          seg.x - camX,
          seg.y - camY,
          r,
          j,
          player.segments.length,
          player.color,
          player.headColor,
          player.accentColor || '#ffffff',
          playerPattern,
          true,
          player.isBoosting
        );
      }

      // Draw head
      ctx.beginPath();
      ctx.arc(currentHead.x - camX, currentHead.y - camY, 23, 0, Math.PI * 2);
      ctx.fillStyle = player.headColor;
      ctx.fill();

      // Render active powerup visual auras around player head (SHIELD, MAGNET, SPEED)
      if (player.shieldTimer > 0) {
        ctx.save();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5 + Math.sin(Date.now() / 80) * 1.0;
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#10b981';
        ctx.beginPath();
        ctx.arc(currentHead.x - camX, currentHead.y - camY, 25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (player.magnetTimer > 0) {
        ctx.save();
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]); // cool rotating dash line
        ctx.translate(currentHead.x - camX, currentHead.y - camY);
        ctx.rotate(Date.now() / 120);
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (player.speedTimer > 0) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#38bdf8';
        ctx.beginPath();
        ctx.arc(currentHead.x - camX, currentHead.y - camY, 19 + Math.sin(Date.now() / 100) * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Player head cosmetics based on skin pattern
      ctx.save();
      ctx.translate(currentHead.x - camX, currentHead.y - camY);
      ctx.rotate(player.angle);
      drawSnakeHeadDecorations(ctx, playerPattern, player.headColor, player.accentColor || '#ffffff');
      ctx.restore();

      // Eyes
      ctx.save();
      ctx.translate(currentHead.x - camX, currentHead.y - camY);
      ctx.rotate(player.angle);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(6, -6, 4, 0, Math.PI * 2);
      ctx.arc(6, 6, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(8, -6, 2, 0, Math.PI * 2);
      ctx.arc(8, 6, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw Player Name tag
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(player.displayName, currentHead.x - camX, currentHead.y - camY - 22);

      // Render floating emotes
      floatEmotesRef.current.forEach((em) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${em.opacity})`;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(em.text, em.x - camX, em.y - camY);
      });

      if (animId % 6 === 0) {
        setTick(prev => prev + 1);
      }

      animId = requestAnimationFrame(updateAndDraw);
    };

    // Begin looping
    updateAndDraw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isPlaying]);

  // Combined pointer coordinate tracker (mouse dragging / tap fingers)
  const handlePointerDownOrMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isPlaying) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate relative coordinates to center
    const dx = mouseX - rect.width / 2;
    const dy = mouseY - rect.height / 2;
    
    playerRef.current.angle = Math.atan2(dy, dx);
  };

  const handleTouchMoveAndSteer = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isPlaying) return;
    e.preventDefault(); // absolutely key: stops mobile browser bounce & scrolling
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;

    const dx = mouseX - rect.width / 2;
    const dy = mouseY - rect.height / 2;
    
    playerRef.current.angle = Math.atan2(dy, dx);
  };

  return (
    <div className={`relative bg-[#090a0f] select-none transition-all duration-300 overflow-hidden ${
      isPlaying 
        ? 'fixed inset-0 w-screen h-screen z-[100] rounded-none border-0' 
        : 'w-full h-[540px] rounded-2xl border border-white/5 shadow-2xl'
    }`}>
      
      {/* 1. Play Now Screen Overlay */}
      {!isPlaying && !isGameOver && (
        <div className="absolute inset-0 bg-black/85 z-20 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue to-purple-500 flex items-center justify-center text-white text-3xl font-black shadow-[0_0_20px_rgba(37,99,235,0.4)] mb-6 animate-bounce">
            🐍
          </div>

          <h2 className="text-3xl font-extrabold text-white font-display mb-1 tracking-tight">Snake .io Cosmic Arena</h2>
          <p className="text-white/50 text-sm max-w-sm mb-8">Slither smoothly, absorb fruit pellets & gems, capture powerup flasks, trap bot snakes & conquer the leaderboard!</p>

          <button 
            onClick={startGame}
            className="btn-neon px-12 py-4 text-lg font-bold flex items-center gap-2 tracking-wide transform hover:scale-105 active:scale-95 transition-all"
          >
            <Play size={20} className="fill-slate-900 stroke-none" /> Join Space Arena
          </button>
        </div>
      )}

      {/* 2. Game Over screen overlay */}
      {isGameOver && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="absolute inset-0 bg-black/95 z-20 flex flex-col items-center justify-center p-8 text-center"
        >
          <div className="text-5xl mb-4 text-red-500 animate-pulse">💀</div>
          <h2 className="text-4xl font-black text-white font-display mb-2">Eliminated!</h2>
          <p className="text-white/40 text-xs mb-8">Your head crashed into an opponent's slither flank.</p>

          <div className="grid grid-cols-3 gap-6 max-w-sm w-full bg-white/5 p-5 rounded-2xl border border-white/5 mb-8">
            <div>
              <div className="text-[10px] text-white/40 uppercase font-bold">Your Score</div>
              <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{liveScore}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/40 uppercase font-bold">Bot Slayed</div>
              <div className="text-lg font-bold text-red-400 font-mono mt-0.5">{liveKills}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/40 uppercase font-bold">Tail size</div>
              <div className="text-lg font-bold text-purple-400 font-mono mt-0.5">{maxLengthAchieved}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={startGame}
              className="btn-neon px-8 py-3 font-bold flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <RotateCcw size={16} /> Slither Again
            </button>
            <button 
              onClick={() => {
                setIsGameOver(false);
                setIsPlaying(false);
              }}
              className="px-8 py-3 font-bold flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl transition-all w-full sm:w-auto justify-center"
            >
              Exit to Lobby
            </button>
          </div>
        </motion.div>
      )}

      {/* 3. Real interactive HTML Canvas rendering window */}
      <canvas
        ref={canvasRef}
        width={720}
        height={520}
        onPointerDown={handlePointerDownOrMove}
        onPointerMove={handlePointerDownOrMove}
        onTouchStart={handleTouchMoveAndSteer}
        onTouchMove={handleTouchMoveAndSteer}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className="w-full h-full cursor-crosshair block touch-none"
      />

      {/* 4. Overlay Live HUD controls */}
      {isPlaying && (
        <>
          {/* Escape / Quit arena button */}
          <button
            onClick={() => {
              triggerDeath();
            }}
            className="absolute top-5 right-5 bg-red-600/30 hover:bg-red-600/70 text-red-100 border border-red-500/30 font-bold text-xs rounded-xl px-4 py-2 pointer-events-auto backdrop-blur-md transition-all select-none shadow-lg z-50 flex items-center gap-1.5"
          >
            Quit Arena 🚪
          </button>

          {/* Live Score stats layout */}
          <div className="absolute top-5 left-5 bg-black/60 border border-white/10 p-4 rounded-xl flex items-center gap-6 pointer-events-none z-10 backdrop-blur-md">
            <div>
              <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider">High Score Record</span>
              <div className="text-xl font-bold font-mono text-emerald-400 leading-none mt-0.5">{liveScore}</div>
            </div>
            <div className="w-[1px] h-6 bg-white/10" />
            <div>
              <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Bots Defeated</span>
              <div className="text-xl font-bold font-mono text-red-400 leading-none mt-0.5">{liveKills}</div>
            </div>
            <div className="w-[1px] h-6 bg-white/10" />
            <div>
              <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Tail length</span>
              <div className="text-xl font-bold font-mono text-purple-400 leading-none mt-0.5">{playerRef.current.segments.length}</div>
            </div>
          </div>

          {/* Active Power-Ups Indicators */}
          {(playerRef.current.speedTimer > 0 ||
            playerRef.current.magnetTimer > 0 ||
            playerRef.current.doubleTimer > 0 ||
            playerRef.current.shieldTimer > 0 ||
            playerRef.current.freezeTimer > 0) && (
            <div className="absolute top-24 left-5 bg-black/75 border border-white/10 p-3.5 rounded-xl flex flex-col gap-2.5 z-10 backdrop-blur-md min-w-[170px] pointer-events-none">
              <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider block">Active Power-Ups 🧪</span>
              {playerRef.current.speedTimer > 0 && (
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-[10px] font-bold text-sky-400">
                    <span>⚡ Speed Thruster</span>
                    <span>{Math.ceil(playerRef.current.speedTimer / 60)}s</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-400 transition-all duration-100" style={{ width: `${(playerRef.current.speedTimer / 600) * 100}%` }} />
                  </div>
                </div>
              )}
              {playerRef.current.magnetTimer > 0 && (
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-[10px] font-bold text-pink-400">
                    <span>🧲 Pellet Magnet</span>
                    <span>{Math.ceil(playerRef.current.magnetTimer / 60)}s</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-400 transition-all duration-100" style={{ width: `${(playerRef.current.magnetTimer / 900) * 100}%` }} />
                  </div>
                </div>
              )}
              {playerRef.current.doubleTimer > 0 && (
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-[10px] font-bold text-amber-400">
                    <span>💰 Double Growth</span>
                    <span>{Math.ceil(playerRef.current.doubleTimer / 60)}s</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 transition-all duration-100" style={{ width: `${(playerRef.current.doubleTimer / 900) * 100}%` }} />
                  </div>
                </div>
              )}
              {playerRef.current.shieldTimer > 0 && (
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-[10px] font-bold text-emerald-400">
                    <span>🛡️ Crash Shield</span>
                    <span>{Math.ceil(playerRef.current.shieldTimer / 60)}s</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 transition-all duration-100" style={{ width: `${(playerRef.current.shieldTimer / 750) * 100}%` }} />
                  </div>
                </div>
              )}
              {playerRef.current.freezeTimer > 0 && (
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-[10px] font-bold text-cyan-400">
                    <span>❄️ Time Freeze</span>
                    <span>{Math.ceil(playerRef.current.freezeTimer / 60)}s</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 transition-all duration-100" style={{ width: `${(playerRef.current.freezeTimer / 600) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat Emotes drawer overlay selector */}
          <div className="absolute bottom-5 left-5 flex items-center gap-2 z-10">
            <div className="bg-black/60 border border-white/10 p-2.5 rounded-xl flex items-center gap-1.5 backdrop-blur-md">
              <span className="text-[10px] text-white/30 uppercase font-bold mr-1.5 hidden sm:inline-flex items-center gap-1">
                <MessageSquare size={12} /> Hotkey Emotes:
              </span>
              {EMOTE_OPTIONS.map((em, idx) => (
                <button
                  key={em}
                  onClick={() => handleEmoteClick(em)}
                  className="hover:scale-125 hover:-translate-y-1 transition-all duration-200 text-lg w-7 h-7 flex items-center justify-center p-0"
                  title={`Press ${idx + 1}`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Minimap radar corner rendering */}
          <div className="absolute bottom-5 right-5 w-24 h-24 rounded-xl border border-white/15 bg-black/80 z-10 overflow-hidden pointer-events-none backdrop-blur-md flex items-center justify-center shadow-lg">
            <div className="relative w-20 h-20 bg-white/[0.02] border border-white/5 rounded-full overflow-hidden">
              {/* Player dot */}
              <div 
                className="absolute w-2 h-2 rounded-full bg-neon-blue animate-pulse"
                style={{
                  left: `${(playerRef.current.segments[0].x / MAP_SIZE) * 100}%`,
                  top: `${(playerRef.current.segments[0].y / MAP_SIZE) * 100}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
              {/* Bots dot indicators */}
              {botsRef.current.map((bot) => (
                <div 
                  key={bot.id}
                  className="absolute w-1 h-1 rounded-full bg-red-400"
                  style={{
                    left: `${(bot.segments[0].x / MAP_SIZE) * 100}%`,
                    top: `${(bot.segments[0].y / MAP_SIZE) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Mobile Speed Boost button indicator */}
          <div className="absolute bottom-5 right-[145px] z-20 pointer-events-auto">
            <button
              onPointerDown={() => { playerRef.current.isBoosting = true; }}
              onPointerUp={() => { playerRef.current.isBoosting = false; }}
              onPointerLeave={() => { playerRef.current.isBoosting = false; }}
              onTouchStart={(e) => { e.preventDefault(); playerRef.current.isBoosting = true; }}
              onTouchEnd={(e) => { e.preventDefault(); playerRef.current.isBoosting = false; }}
              className="w-14 h-14 rounded-full bg-sky-500/20 active:scale-90 border border-sky-400/50 hover:neon-border flex items-center justify-center text-white text-xl font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.25)] touch-none select-none"
              title="Hold to Boost Speed"
            >
              ⚡
            </button>
            <div className="text-[8px] text-center text-sky-400/60 font-bold mt-1 uppercase">Hold Boost</div>
          </div>

          {/* Live System Kill feed logging */}
          <div className="absolute top-20 right-5 flex flex-col gap-1.5 z-10 pointer-events-none">
            {killFeedRef.current.map((log) => (
              <motion.div 
                key={log.id} 
                initial={{ opacity: 0, x: 50 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="bg-black/60 border border-white/5 px-3 py-1.5 rounded-lg text-[10px] text-white/50 backdrop-blur-md flex items-center gap-1.5 text-right font-medium"
              >
                <span className="text-neon-blue font-bold">{log.killer}</span>
                <span className="text-white/30 font-bold">slayed</span>
                <span className="text-red-400 font-bold">{log.victim}!</span>
              </motion.div>
            ))}
          </div>

          {/* Boost floating instruction tooltips */}
          <div className="absolute top-[22px] right-[160px] text-[9px] font-bold text-white/30 hidden md:flex items-center gap-2 pointer-events-none bg-black/40 border border-white/5 px-2 py-1 rounded">
            Drag mouse/finger to STEER • Hold space/Click to BOOST (Sheds parts)
          </div>
        </>
      )}

      {/* 5. Sound muters buttons */}
      <button 
        onClick={toggleMute}
        className="absolute bottom-5 right-[245px] w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-white/60 hover:text-white z-10 backdrop-blur-md select-none"
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

    </div>
  );
}
