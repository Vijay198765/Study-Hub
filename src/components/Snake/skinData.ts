import { SnakeSkin } from './types';

export const SKINS: SnakeSkin[] = [
  {
    id: 'default',
    name: 'Classic Serpent',
    colorGrade: 'linear-gradient(to right, #3b82f6, #1d4ed8)',
    headColor: '#2563eb',
    bodyColor: '#3b82f6',
    accentColor: '#60a5fa',
    isGradient: false,
    cost: 0,
    pattern: 'classic'
  },
  {
    id: 'neon-emerald',
    name: 'Neon Toxic',
    colorGrade: 'linear-gradient(to right, #10b981, #059669)',
    headColor: '#10b981',
    bodyColor: '#34d399',
    accentColor: '#a7f3d0',
    isGradient: true,
    cost: 150,
    pattern: 'neon'
  },
  {
    id: 'cyber-pink',
    name: 'Cyberpunk Spark',
    colorGrade: 'linear-gradient(to right, #ec4899, #db2777)',
    headColor: '#f43f5e',
    bodyColor: '#ec4899',
    accentColor: '#fbcfe8',
    isGradient: true,
    cost: 300,
    pattern: 'cyberpunk'
  },
  {
    id: 'retro-synth',
    name: 'Outrun Synthwave',
    colorGrade: 'linear-gradient(to right, #a855f7, #ec4899)',
    headColor: '#8b5cf6',
    bodyColor: '#bbf7d0',
    accentColor: '#f472b6',
    isGradient: true,
    cost: 450,
    pattern: 'glow'
  },
  {
    id: 'ruby-fire',
    name: 'Volcanic Overlord',
    colorGrade: 'linear-gradient(to right, #ef4444, #b91c1c)',
    headColor: '#dc2626',
    bodyColor: '#ef4444',
    accentColor: '#f59e0b',
    isGradient: true,
    cost: 500,
    pattern: 'magma'
  },
  {
    id: 'stealth-camo',
    name: 'Phantom Hunter',
    colorGrade: 'linear-gradient(to right, #4b5563, #1f2937)',
    headColor: '#374151',
    bodyColor: '#6b7280',
    accentColor: '#10b981',
    isGradient: false,
    cost: 650,
    pattern: 'pulsing'
  },
  {
    id: 'cosmic-galaxy',
    name: 'Nebula Void',
    colorGrade: 'linear-gradient(to right, #8b5cf6, #4c1d95)',
    headColor: '#6366f1',
    bodyColor: '#8b5cf6',
    accentColor: '#c7d2fe',
    isGradient: true,
    cost: 800,
    condition: 'Play 10 matches',
    pattern: 'galaxy'
  },
  {
    id: 'royal-gold',
    name: 'Golden Emperor',
    colorGrade: 'linear-gradient(to right, #fbbf24, #d97706)',
    headColor: '#fbbf24',
    bodyColor: '#f59e0b',
    accentColor: '#fef3c7',
    isGradient: true,
    cost: 1000,
    condition: 'Reach a High Score of 2,000',
    pattern: 'royal'
  },
  {
    id: 'dragon-scale',
    name: 'Abyssal Dragon',
    colorGrade: 'linear-gradient(to right, #06b6d4, #0891b2)',
    headColor: '#0891b2',
    bodyColor: '#06b6d4',
    accentColor: '#34d399',
    isGradient: true,
    cost: 1200,
    condition: 'Kill 20 total snakes',
    pattern: 'dragon'
  },
  {
    id: 'rainbow-aurora',
    name: 'Prismatic Aurora',
    colorGrade: 'linear-gradient(to right, #ff007f, #7f00ff, #00ffff)',
    headColor: '#ff0055',
    bodyColor: '#00ffaa',
    accentColor: '#ffff00',
    isGradient: true,
    cost: 1500,
    condition: 'Reach Level 5',
    pattern: 'rainbow'
  }
];
