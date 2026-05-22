import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Volume2, VolumeX, MessageSquare, ShieldAlert } from 'lucide-react';
import { SnakeSegment, BotSnake, Pellets, KillRecord, FloatingEmote, SnakePlayerStats, SnakeSkin } from './types';
import { SKINS } from './skinData';

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
}

const MAP_SIZE = 2200; // Large 2D virtual boundary
const BOT_NAMES = ['AeroSlither', 'RedViper', 'CobraCommander', 'NeonAsphalt', 'VenomDart', 'CosmicWorm', 'SlytherKing', 'Anaconda99', 'Basilisk', 'SneakySid'];
const EMOTE_OPTIONS = ['😂', '🔥', '👑', '😡', '😜', '⚔️', '⚡', '👀'];
const PELLET_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e', '#a7f3d0'];

// Realistic 3D radial shading draw function for snake segments
const drawSnakeSegment = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
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

  // Create standard highlights for 3D sphere look
  let grd = ctx.createRadialGradient(
    x - r * 0.3, y - r * 0.3, r * 0.1,
    x, y, r
  );

  // Set style based on pattern!
  if (pattern === 'rainbow') {
    // Dynamic color cycle based on segment index and time
    const hue = (index * 12 + Date.now() / 10) % 360;
    grd.addColorStop(0, `hsl(${(hue + 60) % 360}, 100%, 80%)`);
    grd.addColorStop(0.3, `hsl(${hue}, 100%, 55%)`);
    grd.addColorStop(1, `hsl(${(hue - 20) % 360}, 100%, 30%)`);
    
    ctx.shadowBlur = isBoosting ? 20 : 8;
    ctx.shadowColor = `hsla(${hue}, 100%, 50%, 0.7)`;
  } else if (pattern === 'neon') {
    grd.addColorStop(0, '#ffffff');
    grd.addColorStop(0.2, '#10b981');
    grd.addColorStop(1, '#064e3b');
    
    ctx.shadowBlur = isBoosting ? 22 : 12;
    ctx.shadowColor = '#10b981';
  } else if (pattern === 'cyberpunk') {
    grd.addColorStop(0, '#fbcfe8');
    grd.addColorStop(0.3, '#ec4899');
    grd.addColorStop(1, '#3b0764');
    
    ctx.shadowBlur = isBoosting ? 18 : 8;
    ctx.shadowColor = '#ec4899';
  } else if (pattern === 'glow') {
    grd.addColorStop(0, '#fef08a');
    grd.addColorStop(0.2, '#ec4899');
    grd.addColorStop(1, '#6b21a8');
    
    ctx.shadowBlur = isBoosting ? 24 : 12;
    ctx.shadowColor = '#f43f5e';
  } else if (pattern === 'magma') {
    // Pulsating flame colors
    const pulse = Math.sin(Date.now() / 150 + index * 0.5) * 0.15 + 0.85;
    grd.addColorStop(0, '#fef08a');
    grd.addColorStop(0.3, `rgba(249, 115, 22, ${pulse})`);
    grd.addColorStop(1, '#7f1d1d');
    
    ctx.shadowBlur = isBoosting ? 26 : 10;
    ctx.shadowColor = '#f97316';
  } else if (pattern === 'pulsing') {
    // Translucent cloaking pulse
    const alpha = (Math.sin(Date.now() / 250 + index * 0.3) * 0.25 + 0.5);
    grd.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    grd.addColorStop(0.3, `rgba(107, 114, 128, ${alpha})`);
    grd.addColorStop(1, `rgba(17, 24, 39, ${alpha})`);
  } else if (pattern === 'galaxy') {
    grd.addColorStop(0, '#e0f2fe');
    grd.addColorStop(0.3, '#8b5cf6');
    grd.addColorStop(1, '#1e1b4b');
    
    ctx.shadowBlur = isBoosting ? 15 : 5;
    ctx.shadowColor = '#a78bfa';
  } else if (pattern === 'royal') {
    grd.addColorStop(0, '#fffbeb');
    grd.addColorStop(0.3, '#fbbf24');
    grd.addColorStop(1, '#78350f');
    
    ctx.shadowBlur = isBoosting ? 20 : 8;
    ctx.shadowColor = '#fbbf24';
  } else if (pattern === 'dragon') {
    grd.addColorStop(0, '#a7f3d0');
    grd.addColorStop(0.3, '#06b6d4');
    grd.addColorStop(1, '#1e293b');
    
    ctx.shadowBlur = isBoosting ? 16 : 6;
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

  // Draw unique pattern layers on top of each segment
  if (pattern === 'dragon' && index % 2 === 0) {
    // Spikey scales on back of segments
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(x, y - r * 0.8, r * 0.35, 0, Math.PI * 2);
    ctx.arc(x, y + r * 0.8, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  if (pattern === 'galaxy' && index % 3 === 0) {
    // Twinkling space star glints
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(r * 0.85)}px sans-serif`;
    ctx.fillText('✦', x - r * 0.35, y + r * 0.3);
  }

  if (pattern === 'royal' && index % 2 === 0) {
    // Imperial gold ring
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.65, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (pattern === 'cyberpunk' && index % 2 === 0) {
    // Hologram circular ring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (pattern === 'stripes' && index % 2 === 0) {
    // Alternating dark stripe
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
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

export default function SnakeGame({
  stats,
  activeSkinId,
  playerDisplayName,
  onMatchComplete
}: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game mode status
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [muted, setMuted] = useState(false);

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
  });

  const botsRef = useRef<BotSnake[]>([]);
  const pelletsRef = useRef<Pellets[]>([]);
  const killFeedRef = useRef<KillRecord[]>([]);
  const floatEmotesRef = useRef<FloatingEmote[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });

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

    setLiveScore(0);
    setLiveKills(0);
    setMaxLengthAchieved(12);

    // 2. Generate 120 colorful pellets
    const pellets: Pellets[] = [];
    for (let i = 0; i < 150; i++) {
      pellets.push({
        id: Math.random().toString(),
        x: Math.floor(Math.random() * (MAP_SIZE - 40)) + 20,
        y: Math.floor(Math.random() * (MAP_SIZE - 40)) + 20,
        size: Math.floor(Math.random() * 5) + 3,
        color: PELLET_COLORS[Math.floor(Math.random() * PELLET_COLORS.length)],
        points: Math.floor(Math.random() * 8) + 4
      });
    }
    pelletsRef.current = pellets;

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
      const botLen = Math.floor(Math.random() * 15) + 8;

      for (let j = 0; j < botLen; j++) {
        botSegs.push({
          x: spawnX - Math.cos(startAngle) * j * 14,
          y: spawnY - Math.sin(startAngle) * j * 14
        });
      }

      bots.push({
        id: Math.random().toString(),
        name: BOT_NAMES[i % BOT_NAMES.length],
        segments: botSegs,
        angle: startAngle,
        speed: 3.5,
        color: botSkin.bodyColor,
        headColor: botSkin.headColor,
        isBoosting: false,
        targetAngle: startAngle,
        changeDirectionTimer: Math.floor(Math.random() * 50) + 10,
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
  };

  const triggerDeath = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    audio.playDeath();

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

      // --- 1. Settle speed parameters (boosting uses length) ---
      let playerSpeed = player.isBoosting && player.segments.length > 6 ? 6 : 3.5;
      if (player.isBoosting && player.segments.length > 6 && animId % 10 === 0) {
        // Shed body particles behind
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
      }

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
      let cumulativeDist = 0;
      const targetSpacing = 13; // Distance between tail segment links

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
      setLiveScore(player.segments.length * 15 - 180 + player.killCount * 100);
      setMaxLengthAchieved(prev => Math.max(prev, player.segments.length));

      // --- 3. Update AI Bots Steering ---
      botsRef.current.forEach((bot) => {
        const botHead = bot.segments[0];
        bot.changeDirectionTimer--;

        // Steer bots towards closest food pellets or steer randomly
        if (bot.changeDirectionTimer <= 0) {
          bot.changeDirectionTimer = Math.floor(Math.random() * 80) + 30;
          
          let closestPellet: Pellets | null = null;
          let minDist = 220;
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
            bot.targetAngle += (Math.random() * 2 - 1);
          }
        }

        // Steer away from walls
        if (botHead.x < 150) bot.targetAngle = 0;
        else if (botHead.x > MAP_SIZE - 150) bot.targetAngle = Math.PI;
        if (botHead.y < 150) bot.targetAngle = Math.PI / 2;
        else if (botHead.y > MAP_SIZE - 150) bot.targetAngle = -Math.PI / 2;

        // Smoothly interpolate bots angles
        const angleDiff = bot.targetAngle - bot.angle;
        bot.angle += Math.sin(angleDiff) * 0.1;

        // Propagate updates
        const nextBotHeadX = botHead.x + Math.cos(bot.angle) * bot.speed;
        const nextBotHeadY = botHead.y + Math.sin(bot.angle) * bot.speed;
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
        bot.segments = nextBotSegs;
      });

      // --- 4. Pellets collision detectors ---
      const currentHead = player.segments[0];
      const radiusPlayer = 15;

      // Player eating pellets
      pelletsRef.current = pelletsRef.current.filter((p) => {
        const dist = Math.hypot(p.x - currentHead.x, p.y - currentHead.y);
        if (dist < radiusPlayer + p.size) {
          // Increase snake tail length (e.g. add segment on every 4 points)
          if (Math.random() < 0.25) {
            const tail = player.segments[player.segments.length - 1];
            player.segments.push({ x: tail.x, y: tail.y });
          }
          audio.playEat();
          return false; // Pellets consumed
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

      // Replenish pellets
      while (pelletsRef.current.length < 150) {
        pelletsRef.current.push({
          id: Math.random().toString(),
          x: Math.floor(Math.random() * (MAP_SIZE - 40)) + 20,
          y: Math.floor(Math.random() * (MAP_SIZE - 40)) + 20,
          size: Math.floor(Math.random() * 5) + 3,
          color: PELLET_COLORS[Math.floor(Math.random() * PELLET_COLORS.length)],
          points: Math.floor(Math.random() * 8) + 4
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
            playerDied = true;
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
                playerDied = true;
              }
            } else {
              killedByPlayer = true;
            }
          }
        }

        // Hit other bots body?
        botsRef.current.forEach((otherBot) => {
          if (otherBot.id === bot.id) return;
          for (let k = 0; k < otherBot.segments.length; k++) {
            const bSeg = otherBot.segments[k];
            const dist = Math.hypot(botHead.x - bSeg.x, botHead.y - bSeg.y);
            if (dist < 22) {
              botCrashed = true;
            }
          }
        });

        if (botCrashed) {
          // turn bot into colorful food pellets
          bot.segments.forEach((seg, idx) => {
            if (idx % 2 === 0) {
              pelletsRef.current.push({
                id: Math.random().toString(),
                x: seg.x + (Math.random() * 10 - 5),
                y: seg.y + (Math.random() * 10 - 5),
                size: 6,
                color: bot.color,
                points: 15
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
              killer: 'Arena Wall',
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
        const botLen = Math.floor(Math.random() * 15) + 8;

        for (let j = 0; j < botLen; j++) {
          botSegs.push({
            x: spawnX - Math.cos(startAngle) * j * 14,
            y: spawnY - Math.sin(startAngle) * j * 14
          });
        }

        remainingBots.push({
          id: Math.random().toString(),
          name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
          segments: botSegs,
          angle: startAngle,
          speed: 3.5,
          color: botSkin.bodyColor,
          headColor: botSkin.headColor,
          isBoosting: false,
          targetAngle: startAngle,
          changeDirectionTimer: Math.floor(Math.random() * 50) + 10,
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

      // Render colorful pellets
      pelletsRef.current.forEach((pellet) => {
        // Frustum culling (only draw elements inside player bounds)
        if (
          pellet.x - pellet.size - camX >= 0 &&
          pellet.x + pellet.size - camX <= viewSize.current.width &&
          pellet.y - pellet.size - camY >= 0 &&
          pellet.y + pellet.size - camY <= viewSize.current.height
        ) {
          ctx.beginPath();
          ctx.arc(pellet.x - camX, pellet.y - camY, pellet.size, 0, Math.PI * 2);
          ctx.fillStyle = pellet.color;
          ctx.shadowBlur = pellet.size * 1.5;
          ctx.shadowColor = pellet.color;
          ctx.fill();
          ctx.shadowBlur = 0; // Reset shadow glow
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
          const r = Math.max(5, 12 * (1 - j / bot.segments.length));
          
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
        ctx.arc(bHead.x - camX, bHead.y - camY, 13, 0, Math.PI * 2);
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

      // Render player snake
      ctx.shadowBlur = 0;
      const playerPattern = currentSkin.pattern;

      // Draw body
      for (let j = player.segments.length - 1; j > 0; j--) {
        const seg = player.segments[j];
        const r = Math.max(5, 13 * (1 - j / player.segments.length));
        
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
      ctx.arc(currentHead.x - camX, currentHead.y - camY, 14, 0, Math.PI * 2);
      ctx.fillStyle = player.headColor;
      ctx.fill();

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

      animId = requestAnimationFrame(updateAndDraw);
    };

    // Begin looping
    updateAndDraw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isPlaying]);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden bg-[#090a0f] border border-white/5 select-none">
      
      {/* 1. Play Now Screen Overlay */}
      {!isPlaying && !isGameOver && (
        <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue to-purple-500 flex items-center justify-center text-white text-2xl font-black shadow-[0_0_20px_rgba(37,99,235,0.4)] mb-6">
            🐍
          </div>

          <h2 className="text-3xl font-extrabold text-white font-display mb-2">Snake .io Arena</h2>
          <p className="text-white/50 text-sm max-w-sm mb-8">Slither smoothly, absorb pellets, cut off opponent bot trails and dominate the space board!</p>

          <button 
            onClick={startGame}
            className="btn-neon px-10 py-3.5 text-lg font-bold flex items-center gap-2"
          >
            <Play size={20} className="fill-slate-900 stroke-none" /> Join Arena
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
          <div className="text-5xl mb-4 text-red-500">💀</div>
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

          <button 
            onClick={startGame}
            className="btn-neon px-8 py-3 font-bold flex items-center gap-2"
          >
            <RotateCcw size={16} /> Slither Again
          </button>
        </motion.div>
      )}

      {/* 3. Real interactive HTML Canvas rendering window */}
      <canvas
        ref={canvasRef}
        width={720}
        height={520}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className="w-full h-full cursor-crosshair block"
      />

      {/* 4. Overlay Live HUD controls */}
      {isPlaying && (
        <>
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

          {/* Live System Kill feed logging */}
          <div className="absolute top-5 right-5 flex flex-col gap-1.5 z-10 pointer-events-none">
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
          <div className="absolute top-24 left-5 text-[9px] font-bold text-white/30 flex items-center gap-2 pointer-events-none bg-black/40 border border-white/5 px-2 py-1 rounded">
            Hold Click / Spacebar to BOOST (Sheds pieces of tail)
          </div>
        </>
      )}

      {/* 5. Sound muters buttons */}
      <button 
        onClick={toggleMute}
        className="absolute bottom-5 right-32 w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-white/60 hover:text-white z-10 backdrop-blur-md"
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

    </div>
  );
}
