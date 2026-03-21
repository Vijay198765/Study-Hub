import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Timer, Play, Pause, RotateCcw, Coffee, Brain, Quote, Lightbulb } from 'lucide-react';

export default function StudyTips() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');

  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      const nextMode = mode === 'work' ? 'break' : 'work';
      setMode(nextMode);
      setTimeLeft(nextMode === 'work' ? 25 * 60 : 5 * 60);
      alert(mode === 'work' ? 'Time for a break!' : 'Back to work!');
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const tips = [
    { title: "Active Recall", desc: "Test yourself on what you've learned instead of just re-reading notes." },
    { title: "Spaced Repetition", desc: "Review material at increasing intervals to improve long-term memory." },
    { title: "Feynman Technique", desc: "Explain a concept in simple terms as if you were teaching a child." },
    { title: "Pomodoro Method", desc: "Study for 25 minutes, then take a 5-minute break to stay focused." }
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-display font-bold mb-12 text-center">Study Smarter, Not Harder</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pomodoro Timer */}
          <div className="lg:col-span-1">
            <div className="glass-card p-8 text-center sticky top-24">
              <div className="flex items-center justify-center gap-2 mb-6">
                {mode === 'work' ? <Brain className="text-neon-blue" /> : <Coffee className="text-neon-purple" />}
                <span className="text-sm font-bold uppercase tracking-widest text-white/40">
                  {mode === 'work' ? 'Focus Session' : 'Short Break'}
                </span>
              </div>
              
              <div className="text-7xl font-display font-bold mb-8 font-mono tracking-tighter">
                {formatTime(timeLeft)}
              </div>
              
              <div className="flex items-center justify-center gap-4 mb-8">
                <button onClick={toggleTimer} className="w-16 h-16 rounded-full bg-neon-blue text-black flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_20px_rgba(0,242,255,0.4)]">
                  {isActive ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                </button>
                <button onClick={resetTimer} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                  <RotateCcw size={20} />
                </button>
              </div>
              
              <p className="text-xs text-white/30 italic">
                The Pomodoro Technique helps you maintain high levels of focus and prevents mental fatigue.
              </p>
            </div>
          </div>

          {/* Tips & Quotes */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tips.map((tip, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-card p-6 border-l-4 border-neon-blue"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Lightbulb className="text-neon-blue w-5 h-5" />
                    <h3 className="font-bold text-lg">{tip.title}</h3>
                  </div>
                  <p className="text-white/50 text-sm leading-relaxed">{tip.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="glass-card p-8 bg-gradient-to-br from-neon-purple/10 to-transparent">
              <Quote className="text-neon-purple mb-4" size={32} />
              <p className="text-2xl font-display italic mb-6 leading-tight">
                "The mind is not a vessel to be filled, but a fire to be kindled."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10"></div>
                <div>
                  <p className="font-bold text-sm">Plutarch</p>
                  <p className="text-xs text-white/30">Greek Philosopher</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-8">
              <h3 className="text-xl font-bold mb-6">Daily Motivation</h3>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-sm text-white/70">"Don't stop until you're proud."</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-sm text-white/70">"Your only limit is your mind."</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-sm text-white/70">"Dream it. Wish it. Do it."</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
