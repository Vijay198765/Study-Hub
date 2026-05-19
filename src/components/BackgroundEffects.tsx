import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface BackgroundEffectsProps {
  effect?: 'snow' | 'confetti' | 'stars' | 'cybergrid' | 'aurora' | 'matrix' | 'nebula' | 'vortex' | 'drift' | 'none';
  quality?: 'high' | 'medium' | 'low';
}

const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({ effect = 'none', quality = 'high' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (effect === 'confetti') {
      const duration = 15 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [effect]);

  // Matrix Effect
  useEffect(() => {
    if (effect !== 'matrix' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()*&^%';
    const fontSize = 16;
    const columns = Math.ceil(width / fontSize);
    const drops: number[] = new Array(columns).fill(1);

    let animationFrame: number;

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#0F0';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, [effect]);

  if (effect === 'none') return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {effect === 'snow' && (
        <div className="absolute inset-0">
          {[...Array(quality === 'high' ? 50 : 20)].map((_, i) => (
            <div 
              key={i}
              className="absolute bg-white rounded-full opacity-20 animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                animationDuration: `${Math.random() * 10 + 10}s`,
                animationDelay: `${Math.random() * 10}s`,
                filter: 'blur(1px)'
              }}
            />
          ))}
        </div>
      )}

      {effect === 'stars' && (
        <div className="absolute inset-0">
          {[...Array(quality === 'high' ? 100 : 40)].map((_, i) => (
            <div 
              key={i}
              className="absolute bg-white rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                animationDuration: `${Math.random() * 3 + 2}s`,
                animationDelay: `${Math.random() * 5}s`,
                boxShadow: '0 0 10px rgba(255,255,255,0.8)'
              }}
            />
          ))}
        </div>
      )}

      {effect === 'cybergrid' && (
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] animate-grid-move" />
        </div>
      )}

      {effect === 'aurora' && (
        <div className="absolute inset-0 filter blur-[100px] opacity-30 mix-blend-screen">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-neon-blue rounded-full animate-blob opacity-50" />
          <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] bg-neon-purple rounded-full animate-blob animation-delay-2000 opacity-50" />
          <div className="absolute bottom-[-20%] left-[20%] w-[70%] h-[60%] bg-neon-pink rounded-full animate-blob animation-delay-4000 opacity-50" />
        </div>
      )}

      {effect === 'matrix' && (
        <canvas ref={canvasRef} className="absolute inset-0 opacity-10" />
      )}

      {effect === 'nebula' && (
        <div className="absolute inset-0 bg-black">
          <div className="absolute inset-0 opacity-30 mix-blend-overlay animate-pulse" style={{ backgroundColor: '#050505' }} />
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full blur-[80px] opacity-20 animate-pulse"
              style={{
                width: `${Math.random() * 40 + 30}%`,
                height: `${Math.random() * 40 + 30}%`,
                left: `${Math.random() * 100 - 20}%`,
                top: `${Math.random() * 100 - 20}%`,
                backgroundColor: i % 2 === 0 ? '#00f2ff' : '#bc13fe',
                animationDuration: `${Math.random() * 10 + 10}s`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>
      )}

      {effect === 'vortex' && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="w-[200vw] h-[200vw] rounded-full border-[100px] border-neon-blue/5 animate-spin-slow opacity-20" />
          <div className="absolute w-[150vw] h-[150vw] rounded-full border-[60px] border-neon-purple/5 animate-spin-reverse opacity-20" />
          <div className="absolute w-[100vw] h-[100vw] rounded-full border-[40px] border-neon-pink/5 animate-spin-slow opacity-20" />
        </div>
      )}

      {effect === 'drift' && (
        <div className="absolute inset-0">
          {[...Array(quality === 'high' ? 40 : 15)].map((_, i) => (
            <div 
              key={i}
              className="absolute bg-gradient-to-r from-neon-blue to-transparent w-24 h-px opacity-10 animate-drift-line"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 15 + 10}s`,
                animationDelay: `${Math.random() * 10}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BackgroundEffects;
